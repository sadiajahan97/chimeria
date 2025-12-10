"use client";

export const AssistantMessage = ({ content }: { content: string }) => {
  return (
    <div className="chat-message ai items-center">
      <div className="message-avatar ai">AI</div>
      <div className="message-content">{content}</div>
    </div>
  );
};
