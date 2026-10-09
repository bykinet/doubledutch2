import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/shared/ui/Input";
import { Button } from "@/shared/ui/Button";

interface NicknameModalProps {
  isOpen: boolean;
  onConfirm: (nickname: string) => Promise<void>;
}

export const NicknameModal: React.FC<NicknameModalProps> = ({ isOpen, onConfirm }) => {
  const { t } = useTranslation();
  const [nickname, setNicknameVal] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const validateNickname = (val: string): boolean => {
    // 2-12 alphanumeric & Korean characters
    const trimmed = val.trim();
    const regex = /^[a-zA-Z0-9가-힣]{2,12}$/;
    if (!regex.test(trimmed)) {
      setError(t("nickname.errorLength"));
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateNickname(nickname)) return;

    try {
      setLoading(true);
      await onConfirm(nickname.trim());
    } catch {
      setError(t("auth.authFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="anime-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="nickname-modal-title">
      <div className="anime-card" style={{ maxWidth: 400, width: "100%", textAlign: "center" }}>
        <h2 id="nickname-modal-title" style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>
          {t("nickname.title")}
        </h2>
        <p style={{ color: "#94A3B8", fontSize: 14, marginBottom: 20 }}>
          {t("nickname.desc")}
        </p>

        <form onSubmit={handleSubmit}>
          <Input
            value={nickname}
            onChange={(e) => {
              setNicknameVal(e.target.value);
              if (error) validateNickname(e.target.value);
            }}
            onBlur={() => validateNickname(nickname)}
            errorMessage={error || undefined}
            placeholder={t("nickname.placeholder")}
            autoFocus
            maxLength={12}
          />

          <div style={{ marginTop: 12 }}>
            <Button type="submit" variant="primary" style={{ width: "100%" }} disabled={loading}>
              {loading ? "..." : t("nickname.submit")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
