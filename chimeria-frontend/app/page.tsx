/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useRef, useEffect, MouseEvent, ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { Header } from "./components/header";
import { useMutation, useQuery } from "@tanstack/react-query";
import { UserMessage } from "./components/user-message";
import { AssistantMessage } from "./components/assistant-message";
import { askGemini, getMessages } from "@/api";
import { ProfileContextProvider } from "./contexts/profile";

interface Message {
  content: string;
  role: "user" | "assistant";
  image: string | null;
}

interface QuestionFormData {
  question: string;
  file: File | null;
}

interface AskGeminiFormData {
  file: File | null;
  question: string;
}

export default function DashboardPage() {
  const [previewImage, setPreviewImage] = useState("");
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const {
    register: registerQuestion,
    handleSubmit: handleQuestionSubmit,
    reset: resetQuestion,
    formState: { errors: questionErrors },
    setValue,
  } = useForm<QuestionFormData>();

  useQuery<Message[]>({
    queryKey: ["messages"],
    queryFn: async () => {
      const response = await getMessages();
      setMessages(response.data as Message[]);
      return response.data as Message[];
    },
  });

  const askGeminiMutation = useMutation<Message, Error, AskGeminiFormData>({
    mutationFn: async ({ file, question }) => {
      const response = await askGemini(file, question);
      setMessages((prevMessages) => [
        ...prevMessages,
        response.data as Message,
      ]);
      return response.data as Message;
    },
    onSuccess: () => setQuestionError(null),
    onError: () => setQuestionError("An error occurred. Please try again."),
  });

  const onQuestionSubmit = async (data: QuestionFormData) => {
    const file = data.file;
    const question = data.question.trim();
    resetQuestion();
    setPreviewImage("");
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        content: question,
        role: "user",
        image: file ? URL.createObjectURL(file) : null,
      },
    ]);
    askGeminiMutation.mutate({
      file,
      question,
    });
  };

  const handleRemoveImage = () => {
    setPreviewImage("");
    setValue("file", null, { shouldValidate: true });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => setPreviewImage(event.target?.result as string);
    reader.readAsDataURL(file);
    setValue("file", file, { shouldValidate: true });
  };

  const handleUploadButtonClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleFile(file);
    else {
      setValue("file", null, { shouldValidate: true });
      setPreviewImage("");
    }
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
        <div className="results-section active" id="resultsSection">
          <div className="qa-section">
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

            {previewImage && (
              <div className="image-preview-container mb-4">
                <div className="image-preview-wrapper relative inline-block">
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="max-w-[200px] max-h-[200px] rounded-[10px] border border-[#e2e8f0] object-contain"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-black/60 text-white border-none rounded-full w-6 h-6 cursor-pointer flex items-center justify-center text-base leading-none"
                    aria-label="Remove image"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
            <form onSubmit={handleQuestionSubmit(onQuestionSubmit)}>
              <div className="qa-input-wrapper items-start">
                <input
                  type="file"
                  {...registerQuestion("file", {
                    validate: (file: File | null) => {
                      if (!file) return true;
                      else if (!file.type.startsWith("image/"))
                        return "File must be an image";
                      else if (file.size > 10 * 1024 * 1024)
                        return "File size must be less than 10MB";
                      else return true;
                    },
                  })}
                  ref={fileInputRef}
                  className="file-input hidden"
                  accept="image/*"
                  onChange={handleFileInputChange}
                />
                <button
                  type="button"
                  onClick={handleUploadButtonClick}
                  disabled={askGeminiMutation.isPending}
                  className="py-[13px] px-[18px] bg-white border-[1.5px] border-[#e2e8f0] rounded-[10px] cursor-pointer flex items-center justify-center transition-all duration-300 ease-in-out hover:border-[#8b5cf6] hover:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] disabled:cursor-not-allowed disabled:opacity-50"
                  title="Upload image"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-5 h-5 stroke-[#8b5cf6] stroke-2 fill-none"
                  >
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </button>
                <div className="flex-1 flex flex-col">
                  <input
                    type="text"
                    className="qa-input"
                    placeholder="Ask a question..."
                    {...registerQuestion("question", {
                      required: "Please enter a question",
                      minLength: {
                        value: 1,
                        message: "Question cannot be empty",
                      },
                    })}
                    disabled={askGeminiMutation.isPending}
                  />
                  {questionErrors.question && (
                    <p className="text-sm text-red-600 mt-1">
                      {questionErrors.question.message}
                    </p>
                  )}
                  {questionErrors.file && (
                    <p className="text-sm text-red-600 mt-1">
                      {questionErrors.file.message}
                    </p>
                  )}
                  {!questionErrors.question &&
                    !questionErrors.file &&
                    questionError && (
                      <p className="text-sm text-red-600 mt-1">
                        {questionError}
                      </p>
                    )}
                </div>
                <button
                  type="submit"
                  className="qa-submit"
                  disabled={askGeminiMutation.isPending}
                >
                  {askGeminiMutation.isPending ? "Sending..." : "Send"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </ProfileContextProvider>
  );
}
