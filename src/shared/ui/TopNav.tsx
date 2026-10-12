import React from "react";
import { useTranslation } from "react-i18next";
import { LogOut, User, Globe, Volume2, VolumeX, Trophy, ShieldAlert } from "lucide-react";
import { useAuth } from "@/features/auth/model/useAuth";
import { soundManager } from "@/shared/audio/soundManager";
import { getNextLanguage, getLanguageLabel } from "@/shared/i18n";

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
    const nextLang = getNextLanguage(i18n.language);
    i18n.changeLanguage(nextLang);
  };

  const toggleAudio = () => {
    const nextMuted = soundManager.toggleMute();
    setMuted(nextMuted);
  };

  return (
    <nav className="top-nav" aria-label="Main Navigation">
      <div className="top-nav-brand" onClick={onHomeClick} role="button" tabIndex={0}>
        <span className="top-nav-brand-icon">🏃</span>
        <span className="top-nav-brand-text">Double Dutch</span>
      </div>

      <div className="top-nav-right">
        {/* Audio Mute Toggle */}
        <button
          className="anime-btn dark sm top-nav-btn top-nav-audio-btn"
          onClick={toggleAudio}
          aria-label={muted ? "Unmute audio" : "Mute audio"}
          title={muted ? "Unmute audio" : "Mute audio"}
        >
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>

        {/* Language Switcher */}
        <button
          className="anime-btn dark sm top-nav-btn top-nav-lang-btn"
          onClick={toggleLanguage}
          aria-label="Change language"
          title={`Language: ${getLanguageLabel(i18n.language)}`}
        >
          <Globe size={18} />
          <span className="top-nav-lang-text">{getLanguageLabel(i18n.language, true)}</span>
        </button>

        {/* Leaderboard */}
        {onOpenLeaderboard && (
          <button
            className="anime-btn dark sm top-nav-btn top-nav-rank-btn"
            onClick={onOpenLeaderboard}
            aria-label={t("leaderboard.title")}
          >
            <Trophy size={18} />
          </button>
        )}

        {/* Admin Dashboard (if admin claim) */}
        {isAdmin && onOpenAdmin && (
          <button
            className="anime-btn secondary sm top-nav-btn top-nav-admin-btn"
            onClick={onOpenAdmin}
            aria-label={t("admin.title")}
          >
            <ShieldAlert size={18} />
          </button>
        )}

        {/* Required Order: [로그아웃] [마이페이지] (마이페이지가 가장 오른쪽) */}
        {showUserControls && user && (
          <>
            <button
              className="anime-btn dark sm top-nav-btn top-nav-logout-btn"
              onClick={logout}
              aria-label={t("nav.logout")}
            >
              <LogOut size={18} />
              <span className="top-nav-logout-text">{t("nav.logout")}</span>
            </button>

            <button
              className="anime-btn primary sm top-nav-btn top-nav-user-btn"
              onClick={onOpenMyPage}
              aria-label={t("nav.mypage")}
            >
              <User size={18} />
              <span className="top-nav-user-text">{profile?.nickname || t("nav.mypage")}</span>
            </button>
          </>
        )}
      </div>
    </nav>
  );
};
