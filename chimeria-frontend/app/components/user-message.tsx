/* eslint-disable @next/next/no-img-element */
"use client";

import { useProfile } from "@/app/contexts/profile";
import { getInitials } from "@/utils";

export const UserMessage = ({
  content,
  image,
}: {
  content: string;
  image: string | null;
}) => {
  const { profile } = useProfile();

  return (
    <div className="chat-message user items-center">
      <div className="message-avatar user">
        {getInitials(profile?.name || "")}
      </div>
      <div className="message-content-wrapper">
        {image && (
          <div className="message-image-wrapper">
            <img src={image} alt="User uploaded" className="message-image" />
          </div>
        )}
        {content && <div className="message-content">{content}</div>}
      </div>
    </div>
  );
};
