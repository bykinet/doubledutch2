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
    <div className="homepage-container">
      {/* 3D Cel-shaded Characters Flanking Preview */}
      <div className="homepage-characters-backdrop">
        <img
          src="/assets/images/turner_left.png"
          alt="Rope Turner Left"
          className="homepage-turner-left"
        />
        <img
          src="/assets/images/turner_right.png"
          alt="Rope Turner Right"
          className="homepage-turner-right"
        />
      </div>

      <div className="homepage-content-wrap">
        {/* Anime Game Title Banner Logo & Guide Banner */}
        <div className="homepage-hero">
          <img
            src="/assets/images/game_logo.png"
            alt="Double Dutch Jumping Action"
            className="homepage-logo"
          />

          {/* Guide Banner Text */}
          <div className="anime-card homepage-guide-card">
            "{t("app.subtitle")}"
          </div>
        </div>

        {/* Action Buttons Stack (Story 0: top to bottom: Login, Register, Play without account) */}
        <div className="homepage-actions">
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
    </div>
  );
};
