import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth/model/useAuth";
import { Input } from "@/shared/ui/Input";
import { Button } from "@/shared/ui/Button";
import { SpeechBubble } from "@/shared/ui/SpeechBubble";

interface LoginPageProps {
  onSwitchToRegister: () => void;
  onSuccess: () => void;
  onCancel: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSwitchToRegister,
  onSuccess,
  onCancel,
}) => {
  const { t } = useTranslation();
  const { loginEmail, loginPhone, loginGoogle } = useAuth();

  const [activeTab, setActiveTab] = useState<"email" | "phone">("email");

  // Email form state
  const [email, setEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailFormatError, setEmailFormatError] = useState<string | null>(null);
  const [emailPasswordFormatError, setEmailPasswordFormatError] = useState<string | null>(null);

  // Phone form state
  const [countryCode, setCountryCode] = useState("+82");
  const [phone, setPhone] = useState("");
  const [phonePassword, setPhonePassword] = useState("");
  const [phoneFormatError, setPhoneFormatError] = useState<string | null>(null);
  const [phonePasswordFormatError, setPhonePasswordFormatError] = useState<string | null>(null);

  // Submit level error
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Validation helpers
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

  const validatePasswordFormat = (val: string, setter: (err: string | null) => void): boolean => {
    const regex = /^[a-zA-Z0-9]{6,20}$/;
    if (!regex.test(val)) {
      setter(t("auth.errorPasswordFormat"));
      return false;
    }
    setter(null);
    return true;
  };

  // Google Login
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setSubmitError(null);
      await loginGoogle();
      onSuccess();
    } catch {
      setSubmitError(t("auth.authFailed"));
    } finally {
      setLoading(false);
    }
  };

  // Email Login
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const isEmailValid = validateEmailFormat(email);
    const isPassValid = validatePasswordFormat(emailPassword, setEmailPasswordFormatError);
    if (!isEmailValid || !isPassValid) return;

    try {
      setLoading(true);
      await loginEmail(email.trim(), emailPassword);
      onSuccess();
    } catch {
      // Do not distinguish account existence and password mismatch
      setSubmitError(t("auth.errorInvalidEmailOrPassword"));
    } finally {
      setLoading(false);
    }
  };

  // Phone Login
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const isPhoneValid = validatePhoneFormat(phone);
    const isPassValid = validatePasswordFormat(phonePassword, setPhonePasswordFormatError);
    if (!isPhoneValid || !isPassValid) return;

    // Convert to E.164 without leading 0 if Korean number
    const rawDigits = phone.replace(/\D/g, "");
    const formattedDigits = rawDigits.startsWith("0") ? rawDigits.substring(1) : rawDigits;
    const e164 = `${countryCode}${formattedDigits}`;

    try {
      setLoading(true);
      await loginPhone(e164, phonePassword);
      onSuccess();
    } catch {
      setSubmitError(t("auth.errorInvalidPhoneOrPassword"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="anime-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="login-title">
      <div className="anime-card" style={{ maxWidth: 440, width: "100%" }}>
        <h2 id="login-title" style={{ fontSize: 24, fontWeight: 900, textAlign: "center", marginBottom: 20 }}>
          {t("auth.loginTitle")}
        </h2>

        {/* Global Submit Error Bubble */}
        {submitError && (
          <div style={{ marginBottom: 16 }}>
            <SpeechBubble message={submitError} variant="danger" />
          </div>
        )}

        {/* 1. Google Login Button on Top */}
        <Button
          type="button"
          variant="dark"
          style={{ width: "100%", marginBottom: 16, border: "2px solid #475569" }}
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <span style={{ fontSize: 18 }}>🇬</span> {t("auth.googleLogin")}
        </Button>

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

        {/* 2. Email Login Form */}
        {activeTab === "email" && (
          <form onSubmit={handleEmailSubmit}>
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
              onBlur={() => validatePasswordFormat(emailPassword, setEmailPasswordFormatError)}
              errorMessage={emailPasswordFormatError || undefined}
            />

            <Button type="submit" variant="primary" style={{ width: "100%", marginTop: 8 }} disabled={loading}>
              {loading ? "..." : t("auth.loginBtn")}
            </Button>
          </form>
        )}

        {/* 3. Phone Login Form */}
        {activeTab === "phone" && (
          <form onSubmit={handlePhoneSubmit}>
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
              onBlur={() => validatePasswordFormat(phonePassword, setPhonePasswordFormatError)}
              errorMessage={phonePasswordFormatError || undefined}
            />

            <Button type="submit" variant="primary" style={{ width: "100%", marginTop: 8 }} disabled={loading}>
              {loading ? "..." : t("auth.loginBtn")}
            </Button>
          </form>
        )}

        {/* 4. Switch to Register and Cancel */}
        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10, textAlign: "center" }}>
          <button
            type="button"
            onClick={onSwitchToRegister}
            style={{
              background: "none",
              border: "none",
              color: "#38BDF8",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {t("auth.switchToRegister")}
          </button>

          <Button type="button" variant="dark" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
