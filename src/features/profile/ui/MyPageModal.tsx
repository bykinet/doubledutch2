import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth/model/useAuth";
import { Input } from "@/shared/ui/Input";
import { Button } from "@/shared/ui/Button";
import { SpeechBubble } from "@/shared/ui/SpeechBubble";
import { X, Check, KeyRound, Trash2 } from "lucide-react";

interface MyPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountDeleted: () => void;
}

export const MyPageModal: React.FC<MyPageModalProps> = ({
  isOpen,
  onClose,
  onAccountDeleted,
}) => {
  const { t } = useTranslation();
  const { profile, user, setNickname, changePassword, deleteAccount } = useAuth();

  // Nickname state
  const [isEditingNick, setIsEditingNick] = useState(false);
  const [nicknameInput, setNicknameInput] = useState(profile?.nickname || "");
  const [nickError, setNickError] = useState<string | null>(null);

  // Password change state
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmNewPass, setConfirmNewPass] = useState("");
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);

  // Account deletion double-step state
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Nickname save
  const handleSaveNickname = async () => {
    const trimmed = nicknameInput.trim();
    const regex = /^[a-zA-Z0-9가-힣]{2,12}$/;
    if (!regex.test(trimmed)) {
      setNickError(t("nickname.errorLength"));
      return;
    }
    setNickError(null);
    try {
      setLoading(true);
      await setNickname(trimmed);
      setIsEditingNick(false);
    } catch {
      setNickError(t("auth.authFailed"));
    } finally {
      setLoading(false);
    }
  };

  // Password update
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    const regex = /^[a-zA-Z0-9]{6,20}$/;
    if (!regex.test(newPass)) {
      setPassError(t("auth.errorPasswordFormat"));
      return;
    }
    if (newPass !== confirmNewPass) {
      setPassError(t("auth.errorPasswordMismatch"));
      return;
    }

    try {
      setLoading(true);
      await changePassword(currentPass, newPass);
      setPassSuccess(t("mypage.passwordChangedSuccess"));
      setCurrentPass("");
      setNewPass("");
      setConfirmNewPass("");
      setIsChangingPass(false);
    } catch {
      setPassError(t("auth.errorInvalidEmailOrPassword"));
    } finally {
      setLoading(false);
    }
  };

  // Deletion logic
  const handleDeleteClick = async () => {
    if (deleteStep === 1) {
      // Step 1: Switch button to contrasting color and show warning bubble
      setDeleteStep(2);
    } else {
      // Step 2: Confirm deletion
      try {
        setLoading(true);
        await deleteAccount();
        onClose();
        onAccountDeleted();
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  // Display ID (friendly, not raw invalid phone email)
  const getDisplayLoginId = () => {
    if (user?.isAnonymous) return "Guest (Anonymous)";
    if (profile?.phoneE164) return profile.phoneE164;
    return profile?.email || user?.email || "Unknown";
  };

  return (
    <div className="anime-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="mypage-title">
      <div className="anime-card" style={{ maxWidth: 480, width: "100%", position: "relative" }}>
        {/* Close Button */}
        <button
          className="form-input-icon-btn"
          style={{ position: "absolute", top: 18, right: 18 }}
          onClick={onClose}
          aria-label="Close"
        >
          <X size={22} />
        </button>

        <h2 id="mypage-title" style={{ fontSize: 24, fontWeight: 900, marginBottom: 20 }}>
          {t("mypage.title")}
        </h2>

        {/* 1. Nickname */}
        <div style={{ marginBottom: 18 }}>
          <div className="form-label">{t("mypage.nickname")}</div>
          {isEditingNick ? (
            <div>
              <Input
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                errorMessage={nickError || undefined}
                maxLength={12}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <Button variant="primary" size="sm" onClick={handleSaveNickname} disabled={loading}>
                  <Check size={16} /> {t("mypage.save")}
                </Button>
                <Button variant="dark" size="sm" onClick={() => setIsEditingNick(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 18, fontWeight: 800 }}>{profile?.nickname || "(None)"}</span>
              <Button variant="dark" size="sm" onClick={() => setIsEditingNick(true)}>
                {t("mypage.edit")}
              </Button>
            </div>
          )}
        </div>

        {/* 2. Login ID */}
        <div style={{ marginBottom: 18 }}>
          <div className="form-label">{t("mypage.loginId")}</div>
          <div style={{ fontSize: 16, color: "#CBD5E1", fontWeight: 600 }}>
            {getDisplayLoginId()}
          </div>
        </div>

        {/* 3. Password */}
        {!user?.isAnonymous && profile?.provider !== "google.com" && (
          <div style={{ marginBottom: 24, borderTop: "1px solid #334155", paddingTop: 16 }}>
            <div className="form-label">{t("auth.passwordLabel")}</div>
            {passSuccess && <SpeechBubble message={passSuccess} variant="info" />}
            {passError && <SpeechBubble message={passError} variant="danger" />}

            {isChangingPass ? (
              <form onSubmit={handleSavePassword}>
                <Input
                  label={t("mypage.currentPassword")}
                  isPassword
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  placeholder="******"
                  required
                />
                <Input
                  label={t("mypage.newPassword")}
                  isPassword
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder={t("auth.passwordPlaceholder")}
                  required
                />
                <Input
                  label={t("auth.confirmPasswordLabel")}
                  isPassword
                  value={confirmNewPass}
                  onChange={(e) => setConfirmNewPass(e.target.value)}
                  placeholder={t("auth.passwordPlaceholder")}
                  required
                />
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <Button type="submit" variant="primary" size="sm" disabled={loading}>
                    {t("mypage.updatePasswordBtn")}
                  </Button>
                  <Button type="button" variant="dark" size="sm" onClick={() => setIsChangingPass(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 16, letterSpacing: 3 }}>••••••••</span>
                <Button variant="dark" size="sm" onClick={() => setIsChangingPass(true)}>
                  <KeyRound size={14} /> {t("mypage.changePassword")}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* 4. Delete Account (Double click with warning bubble & contrast color switch) */}
        <div style={{ borderTop: "1px solid #334155", paddingTop: 20 }}>
          {deleteStep === 2 && (
            <SpeechBubble message={t("mypage.deleteWarningBubble")} variant="danger" />
          )}

          <Button
            type="button"
            variant={deleteStep === 2 ? "contrast-confirm" : "danger"}
            size="sm"
            style={{ width: "100%", marginTop: 8 }}
            onClick={handleDeleteClick}
            disabled={loading}
          >
            <Trash2 size={16} />
            <span>{deleteStep === 2 ? t("mypage.deleteConfirm") : t("mypage.deleteAccount")}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
