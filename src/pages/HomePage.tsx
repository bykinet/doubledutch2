import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/Button";
import { Play, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "@/features/auth/model/useAuth";

interface HomePageProps {
  onStartGame: () => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onPlayGuest: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onStartGame,
  onOpenLogin,
  onOpenRegister,
  onPlayGuest,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        textAlign: "center",
        zIndex: 10,
        position: "relative",
        backgroundImage: "radial-gradient(circle at center, rgba(15, 23, 42, 0.72) 0%, rgba(10, 15, 30, 0.94) 100%), url('/assets/images/anime_court_bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* 3D Cel-shaded Characters Flanking Preview */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: "none",
          overflow: "hidden",
          zIndex: 1,
        }}
      >
        <img
          src="/assets/images/turner_left.png"
          alt="Rope Turner Left"
          style={{
            position: "absolute",
            bottom: "2%",
            left: "4%",
            height: "clamp(240px, 42vh, 480px)",
            opacity: 0.92,
            filter: "drop-shadow(0 10px 24px rgba(0,0,0,0.65))",
            transform: "rotate(-3deg)",
          }}
        />
        <img
          src="/assets/images/turner_right.png"
          alt="Rope Turner Right"
          style={{
            position: "absolute",
            bottom: "2%",
            right: "4%",
            height: "clamp(240px, 42vh, 480px)",
            opacity: 0.92,
            filter: "drop-shadow(0 10px 24px rgba(0,0,0,0.65))",
            transform: "rotate(3deg)",
          }}
        />
      </div>

      {/* Anime Game Title Banner Logo */}
      <div style={{ marginBottom: 16, position: "relative", zIndex: 5 }}>
        <img
          src="/assets/images/game_logo.png"
          alt="Double Dutch Jumping Action"
          style={{
            maxHeight: "clamp(120px, 24vh, 220px)",
            maxWidth: "92vw",
            objectFit: "contain",
            filter: "drop-shadow(0 8px 24px rgba(255, 140, 0, 0.55))",
            animation: "pulse 3s infinite ease-in-out",
          }}
        />
      </div>

      {/* Guide Banner Text */}
      <div
        className="anime-card"
        style={{
          maxWidth: 580,
          width: "100%",
          padding: "16px 24px",
          marginBottom: 24,
          fontSize: 15,
          fontWeight: 700,
          lineHeight: 1.6,
          color: "#F8FAFC",
          border: "2px solid rgba(255, 210, 0, 0.45)",
          background: "rgba(18, 24, 38, 0.88)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
          zIndex: 5,
        }}
      >
        "{t("app.subtitle")}"
      </div>

      {/* Action Buttons Stack (Story 0: top to bottom: Login, Register, Play without account) */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
          width: "100%",
          maxWidth: 320,
          zIndex: 5,
        }}
      >
        {user ? (
          /* When already logged in */
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={onStartGame}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
          >
            <Play size={24} fill="#FFFFFF" />
            <span>{t("settings.start")}</span>
          </Button>
        ) : (
          /* Story 0: top to bottom: 1. Login, 2. New Account, 3. Play without account */
          <>
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={onOpenLogin}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              <LogIn size={20} />
              <span>{t("home.login")}</span>
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onOpenRegister}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              <UserPlus size={18} />
              <span>{t("home.register")}</span>
            </Button>

            <Button
              type="button"
              variant="dark"
              size="md"
              onClick={onPlayGuest}
              style={{ width: "100%", border: "2px dashed #475569" }}
            >
              <span>{t("home.guestPlay")}</span>
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
