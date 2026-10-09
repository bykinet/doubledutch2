import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth/model/useAuth";
import { Input } from "@/shared/ui/Input";
import { Button } from "@/shared/ui/Button";
import { SpeechBubble } from "@/shared/ui/SpeechBubble";

interface RegisterPageProps {
  onSwitchToLogin: () => void;
  onSuccess: () => void;
  onCancel: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onSwitchToLogin,
  onSuccess,
  onCancel,
}) => {
  const { t } = useTranslation();
  const { registerEmail, registerPhone } = useAuth();

  const [activeTab, setActiveTab] = useState<"email" | "phone">("email");

  // Email form
  const [email, setEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailConfirm, setEmailConfirm] = useState("");
  const [emailFormatError, setEmailFormatError] = useState<string | null>(null);
  const [emailPassError, setEmailPassError] = useState<string | null>(null);
  const [emailConfirmError, setEmailConfirmError] = useState<string | null>(null);

  // Phone form
  const [countryCode, setCountryCode] = useState("+82");
  const [phone, setPhone] = useState("");
  const [phonePassword, setPhonePassword] = useState("");
  const [phoneConfirm, setPhoneConfirm] = useState("");
  const [phoneFormatError, setPhoneFormatError] = useState<string | null>(null);
  const [phonePassError, setPhonePassError] = useState<string | null>(null);
  const [phoneConfirmError, setPhoneConfirmError] = useState<string | null>(null);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Validation
  const validateEmailFormat = (val: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(val.trim())) {
      setEmailFormatError(t("auth.errorEmailFormat"));
      return false;
    }
    setEmailFormatError(null);
    return true;
  };

  const validatePhoneFormat = (val: string): boolean => {
    const rawDigits = val.replace(/\D/g, "");
    if (rawDigits.length < 9 || rawDigits.length > 11) {
      setPhoneFormatError(t("auth.errorPhoneFormat"));
      return false;
    }
    setPhoneFormatError(null);
    return true;
  };

  const validatePassword = (val: string, setter: (err: string | null) => void): boolean => {
    const regex = /^[a-zA-Z0-9]{6,20}$/;
    if (!regex.test(val)) {
      setter(t("auth.errorPasswordFormat"));
      return false;
    }
    setter(null);
    return true;
  };

  const validateConfirm = (p: string, c: string, setter: (err: string | null) => void): boolean => {
    if (p !== c) {
      setter(t("auth.errorPasswordMismatch"));
      return false;
    }
    setter(null);
    return true;
  };

  // Submit Email Register
  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const isEmailValid = validateEmailFormat(email);
    const isPassValid = validatePassword(emailPassword, setEmailPassError);
    const isConfirmValid = validateConfirm(emailPassword, emailConfirm, setEmailConfirmError);

    if (!isEmailValid || !isPassValid || !isConfirmValid) return;

    try {
      setLoading(true);
      await registerEmail(email.trim(), emailPassword);
      onSuccess();
    } catch (err: any) {
      setSubmitError(err.message || t("auth.authFailed"));
    } finally {
      setLoading(false);
    }
  };

  // Submit Phone Register
  const handlePhoneRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const isPhoneValid = validatePhoneFormat(phone);
    const isPassValid = validatePassword(phonePassword, setPhonePassError);
    const isConfirmValid = validateConfirm(phonePassword, phoneConfirm, setPhoneConfirmError);

    if (!isPhoneValid || !isPassValid || !isConfirmValid) return;

    const rawDigits = phone.replace(/\D/g, "");
    const formattedDigits = rawDigits.startsWith("0") ? rawDigits.substring(1) : rawDigits;
    const e164 = `${countryCode}${formattedDigits}`;

    try {
      setLoading(true);
      await registerPhone(e164, phonePassword);
      onSuccess();
    } catch (err: any) {
      setSubmitError(err.message || t("auth.authFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="anime-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="register-title">
      <div className="anime-card" style={{ maxWidth: 440, width: "100%" }}>
        <h2 id="register-title" style={{ fontSize: 24, fontWeight: 900, textAlign: "center", marginBottom: 20 }}>
          {t("auth.registerTitle")}
        </h2>

        {submitError && (
          <div style={{ marginBottom: 16 }}>
            <SpeechBubble message={submitError} variant="danger" />
          </div>
        )}

        {/* Tabs: Email vs Phone */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <Button
            type="button"
            variant={activeTab === "email" ? "primary" : "dark"}
            size="sm"
            style={{ flex: 1 }}
            onClick={() => {
              setActiveTab("email");
              setSubmitError(null);
            }}
          >
            {t("auth.emailTab")}
          </Button>
          <Button
            type="button"
            variant={activeTab === "phone" ? "primary" : "dark"}
            size="sm"
            style={{ flex: 1 }}
            onClick={() => {
              setActiveTab("phone");
              setSubmitError(null);
            }}
          >
            {t("auth.phoneTab")}
          </Button>
        </div>

        {/* Email Register Form */}
        {activeTab === "email" && (
          <form onSubmit={handleEmailRegister}>
            <Input
              label={t("auth.emailLabel")}
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => validateEmailFormat(email)}
              errorMessage={emailFormatError || undefined}
            />

            <Input
              label={t("auth.passwordLabel")}
              placeholder={t("auth.passwordPlaceholder")}
              isPassword
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
              onBlur={() => validatePassword(emailPassword, setEmailPassError)}
              errorMessage={emailPassError || undefined}
            />

            <Input
              label={t("auth.confirmPasswordLabel")}
              placeholder={t("auth.passwordPlaceholder")}
              isPassword
              value={emailConfirm}
              onChange={(e) => setEmailConfirm(e.target.value)}
              onBlur={() => validateConfirm(emailPassword, emailConfirm, setEmailConfirmError)}
              errorMessage={emailConfirmError || undefined}
            />

            <Button type="submit" variant="primary" style={{ width: "100%", marginTop: 8 }} disabled={loading}>
              {loading ? "..." : t("auth.registerBtn")}
            </Button>
          </form>
        )}

        {/* Phone Register Form */}
        {activeTab === "phone" && (
          <form onSubmit={handlePhoneRegister}>
            <div className="form-group">
              <label className="form-label">{t("auth.phoneLabel")}</label>
              <div style={{ display: "flex", gap: 8 }}>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="form-input"
                  style={{ width: 90, padding: "12px 8px" }}
                >
                  <option value="+82">+82</option>
                  <option value="+1">+1</option>
                  <option value="+81">+81</option>
                </select>
                <div style={{ flex: 1 }}>
                  <Input
                    placeholder="10-1234-5678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onBlur={() => validatePhoneFormat(phone)}
                    errorMessage={phoneFormatError || undefined}
                  />
                </div>
              </div>
            </div>

            <Input
              label={t("auth.passwordLabel")}
              placeholder={t("auth.passwordPlaceholder")}
              isPassword
              value={phonePassword}
              onChange={(e) => setPhonePassword(e.target.value)}
              onBlur={() => validatePassword(phonePassword, setPhonePassError)}
              errorMessage={phonePassError || undefined}
            />

            <Input
              label={t("auth.confirmPasswordLabel")}
              placeholder={t("auth.passwordPlaceholder")}
              isPassword
              value={phoneConfirm}
              onChange={(e) => setPhoneConfirm(e.target.value)}
              onBlur={() => validateConfirm(phonePassword, phoneConfirm, setPhoneConfirmError)}
              errorMessage={phoneConfirmError || undefined}
            />

            <Button type="submit" variant="primary" style={{ width: "100%", marginTop: 8 }} disabled={loading}>
              {loading ? "..." : t("auth.registerBtn")}
            </Button>
          </form>
        )}

        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10, textAlign: "center" }}>
          <button
            type="button"
            onClick={onSwitchToLogin}
            style={{
              background: "none",
              border: "none",
              color: "#38BDF8",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {t("auth.switchToLogin")}
          </button>

          <Button type="button" variant="dark" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
