/* eslint-disable @next/next/no-img-element */
"use client";

import {
  useState,
  useRef,
  useEffect,
  MouseEvent,
  DragEvent,
  ChangeEvent,
} from "react";
import { useForm } from "react-hook-form";
import { Header } from "./components/header";
import { useMutation, useQuery } from "@tanstack/react-query";
import { UserMessage } from "./components/user-message";
import { AssistantMessage } from "./components/assistant-message";
import { askGemini, getMessages } from "@/api";
import { calculateBoundingBoxArea } from "@/utils";
import { ProfileContextProvider } from "./contexts/profile";

interface Message {
  content: string;
  role: "user" | "assistant";
  image?: string;
}

interface DetectionFormData {
  file: File | null;
}

interface QuestionFormData {
  question: string;
}

interface AskGeminiFormData {
  file: File;
  question: string;
}

export default function DashboardPage() {
  const [previewImage, setPreviewImage] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [sortColumn, setSortColumn] = useState<0 | 1 | 2 | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [detectionError, setDetectionError] = useState<string | null>(null);
  const [questionError, setQuestionError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    getValues,
  } = useForm<DetectionFormData>();

  const {
    register: registerQuestion,
    handleSubmit: handleQuestionSubmit,
    reset: resetQuestion,
    formState: { errors: questionErrors },
  } = useForm<QuestionFormData>();

  const {
    data: messages = [],
    isLoading: isLoadingMessages,
    refetch: refetchMessages,
  } = useQuery<Message[]>({
    queryKey: ["messages"],
    queryFn: async () => {
      const response = await getMessages();
      return response.data as Message[];
    },
  });

  const askGeminiMutation = useMutation<Message, Error, AskGeminiFormData>({
    mutationFn: async ({ file, question }) => {
      const response = await askGemini(file, question);
      return response.data as Message;
    },
    onSuccess: (data) => {
      setQuestionError(null);
      refetchMessages();
    },
    onError: () => setQuestionError("An error occurred. Please try again."),
  });

  const onQuestionSubmit = async (data: QuestionFormData) => {
    const file = getValues("file");
    if (file) {
      const question = data.question.trim();
      resetQuestion();
      askGeminiMutation.mutate({
        file,
        question,
      });
    }
  };

  const handleFile = (file: File) => {
    setDetectionError(null);
    setQuestionError(null);
    const reader = new FileReader();
    reader.onload = (event) => setPreviewImage(event.target?.result as string);
    reader.readAsDataURL(file);
    setValue("file", file);
  };

  const handleUploadAreaClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target !== fileInputRef.current) fileInputRef.current?.click();
  };

  const handleUploadButtonClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    const file = event.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemoveImage = () => {
    setDetectionError(null);
    setQuestionError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setPreviewImage("");
    setValue("file", null);
  };

  useEffect(() => {
    if (chatContainerRef.current)
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
  }, [messages]);

  return (
    <ProfileContextProvider>
      <Header />
      <main className="main-content">
        <section className="upload-section">
          <h2 className="section-title">Upload Image for Detection</h2>
          <p className="section-subtitle">
            Upload an image to detect objects using our advanced YOLO model
          </p>

          <div
            className={`upload-area ${isDragOver ? "dragover" : ""}`}
            onClick={handleUploadAreaClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="upload-icon">
              <svg viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div className="upload-text">Drop your image here</div>
            <div className="upload-subtext">
              or click to browse (PNG, JPG, JPEG up to 10MB)
            </div>
            <button className="upload-btn" onClick={handleUploadButtonClick}>
              Select Image
            </button>
            <input
              type="file"
              {...register("file", {
                required: "Please select an image file",
                validate: (file) => {
                  if (!file) return "Please select a file";
                  if (!file.type.startsWith("image/"))
                    return "File must be an image";
                  if (file.size > 10 * 1024 * 1024)
                    return "File size must be less than 10MB";
                  return true;
                },
              })}
              ref={fileInputRef}
              className="file-input"
              accept="image/*"
              onChange={handleFileInputChange}
            />
          </div>
        </section>

        <div className="results-section active" id="resultsSection">
          <div className="qa-section">
            <div className="qa-header">
              <div className="qa-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
              </div>
              <div>
                <h3 className="card-title">Ask Questions About Results</h3>
                <p className="section-subtitle" style={{ margin: 0 }}>
                  Powered by Gemini 2.5 Flash
                </p>
              </div>
            </div>

            <div className="chat-container" ref={chatContainerRef}>
              {messages.length === 0 ? (
                <AssistantMessage content="No messages yet. Start a conversation!" />
              ) : (
                messages.map((message, index) =>
                  message.role === "user" ? (
                    <UserMessage
                      key={index}
                      content={message.content}
                      image={message.image}
                    />
                  ) : (
                    <AssistantMessage key={index} content={message.content} />
                  )
                )
              )}
            </div>

            <form
              className="qa-input-wrapper"
              onSubmit={handleQuestionSubmit(onQuestionSubmit)}
            >
              <input
                type="text"
                className="qa-input"
                placeholder="Ask a question about the detected objects..."
                {...registerQuestion("question", {
                  required: "Please enter a question",
                  minLength: {
                    value: 1,
                    message: "Question cannot be empty",
                  },
                })}
                disabled={askGeminiMutation.isPending || !getValues("file")}
              />
              {questionErrors.question && (
                <p className="text-sm text-red-600 mt-1">
                  {questionErrors.question.message}
                </p>
              )}
              {!questionErrors.question && questionError && (
                <p className="text-sm text-red-600 mt-1">{questionError}</p>
              )}
              <button
                type="submit"
                className="qa-submit"
                disabled={askGeminiMutation.isPending || !getValues("file")}
              >
                {askGeminiMutation.isPending ? "Sending..." : "Send"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </ProfileContextProvider>
  );
}
