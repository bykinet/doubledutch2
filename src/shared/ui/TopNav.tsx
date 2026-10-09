import React from "react";
import { useTranslation } from "react-i18next";
import { LogOut, User, Globe, Volume2, VolumeX, Trophy, ShieldAlert } from "lucide-react";
import { useAuth } from "@/features/auth/model/useAuth";
import { soundManager } from "@/shared/audio/soundManager";

interface TopNavProps {
  onOpenMyPage?: () => void;
  onOpenLeaderboard?: () => void;
  onOpenAdmin?: () => void;
  onHomeClick?: () => void;
  showUserControls?: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  onOpenMyPage,
  onOpenLeaderboard,
  onOpenAdmin,
  onHomeClick,
  showUserControls = true,
}) => {
  const { t, i18n } = useTranslation();
  const { user, profile, isAdmin, logout } = useAuth();
  const [muted, setMuted] = React.useState(soundManager.getMuted());

  const toggleLanguage = () => {
    const nextLang = i18n.language === "ko" ? "en" : "ko";
    i18n.changeLanguage(nextLang);
  };

  const toggleAudio = () => {
    const nextMuted = soundManager.toggleMute();
    setMuted(nextMuted);
  };

  return (
    <nav className="top-nav" aria-label="Main Navigation">
      <div className="top-nav-brand" onClick={onHomeClick} role="button" tabIndex={0}>
        <span>🏃 Double Dutch</span>
      </div>

      <div className="top-nav-right">
        {/* Audio Mute Toggle */}
        <button
          className="anime-btn dark sm"
          onClick={toggleAudio}
          aria-label={muted ? "Unmute audio" : "Mute audio"}
          title={muted ? "Unmute audio" : "Mute audio"}
        >
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>

        {/* Language Switcher */}
        <button
          className="anime-btn dark sm"
          onClick={toggleLanguage}
          aria-label="Change language"
          title="Change language"
        >
          <Globe size={16} />
          <span>{i18n.language === "ko" ? "EN" : "한국어"}</span>
        </button>

        {/* Leaderboard */}
        {onOpenLeaderboard && (
          <button
            className="anime-btn dark sm"
            onClick={onOpenLeaderboard}
            aria-label={t("leaderboard.title")}
          >
            <Trophy size={16} />
          </button>
        )}

        {/* Admin Dashboard (if admin claim) */}
        {isAdmin && onOpenAdmin && (
          <button
            className="anime-btn secondary sm"
            onClick={onOpenAdmin}
            aria-label={t("admin.title")}
          >
            <ShieldAlert size={16} />
          </button>
        )}

        {/* Required Order: [로그아웃] [마이페이지] (마이페이지가 가장 오른쪽) */}
        {showUserControls && user && (
          <>
            <button
              className="anime-btn dark sm"
              onClick={logout}
              aria-label={t("nav.logout")}
            >
              <LogOut size={16} />
              <span>{t("nav.logout")}</span>
            </button>

            <button
              className="anime-btn primary sm"
              onClick={onOpenMyPage}
              aria-label={t("nav.mypage")}
            >
              <User size={16} />
              <span>{profile?.nickname || t("nav.mypage")}</span>
            </button>
          </>
        )}
      </div>
    </nav>
  );
};
