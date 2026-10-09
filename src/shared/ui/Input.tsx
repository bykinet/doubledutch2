import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { SpeechBubble } from "./SpeechBubble";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  errorMessage?: string;
  isPassword?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  errorMessage,
  isPassword = false,
  type = "text",
  className = "",
  id,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;

  const effectiveType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className={`form-group ${className}`}>
      {errorMessage && <SpeechBubble message={errorMessage} variant="danger" />}
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
        </label>
      )}
      <div className="form-input-wrap">
        <input
          id={inputId}
          type={effectiveType}
          className="form-input"
          aria-invalid={!!errorMessage}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            className="form-input-icon-btn"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
};
