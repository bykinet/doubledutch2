import React from "react";

interface SpeechBubbleProps {
  message: string;
  variant?: "warning" | "danger" | "info";
  className?: string;
}

export const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  message,
  variant = "danger",
  className = "",
}) => {
  if (!message) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`speech-bubble ${variant === "danger" ? "danger" : ""} ${className}`}
    >
      {message}
    </div>
  );
};
