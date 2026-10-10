import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import confetti from "canvas-confetti";
import { GamePlayStats, GameSettings } from "@/game/logic/types";
import { Button } from "@/shared/ui/Button";
import {
  Trophy,
  RefreshCw,
  UserPlus,
  Flame,
  Users,
  AlertTriangle,
  LogOut,
  Globe,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useAuth } from "@/features/auth/model/useAuth";
import { soundManager } from "@/shared/audio/soundManager";

interface ResultPageProps {
  stats: GamePlayStats;
  settings: GameSettings;
  grade: "S" | "A" | "B" | "C";
  theoreticalMax: number;
  onPlayAgain: () => void;
  onOpenMyPage: () => void;
  onOpenLeaderboard: () => void;
  onHomeClick?: () => void;
}

export const ResultPage: React.FC<ResultPageProps> = ({
  stats,
  settings,
  grade,
  theoreticalMax,
  onPlayAgain,
  onOpenMyPage,
  onOpenLeaderboard,
  onHomeClick,
}) => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const [muted, setMuted] = React.useState(soundManager.getMuted());
  const isGuest = user?.isAnonymous;

  const toggleLanguage = () => {
    const nextLang = i18n.language === "ko" ? "en" : "ko";
    i18n.changeLanguage(nextLang);
  };

  const toggleAudio = () => {
    const nextMuted = soundManager.toggleMute();
    setMuted(nextMuted);
  };

  const handleLogout = async () => {
    try {
      await logout();
      if (onHomeClick) {
        onHomeClick();
      }
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Trigger celebration confetti for high rank
  useEffect(() => {
    if (grade === "S" || grade === "A") {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [grade]);

  const getGradeColor = (g: string) => {
    switch (g) {
      case "S": return "#FFD200";
      case "A": return "#10B981";
      case "B": return "#38BDF8";
      default: return "#94A3B8";
    }
  };

  const percentage = Math.min(100, Math.round((stats.score / theoreticalMax) * 100));

  return (
    <div className="anime-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="result-title">
      {/* Top Right Controls (Identical design to Game Screen) */}
      <header className="result-top-control-bar" role="banner" aria-label="Score Screen Top Controls">
        <div className="top-control-group nav-actions">
          {/* Audio Mute Toggle */}
          <button
            type="button"
            className="anime-btn dark sm icon-btn"
            onClick={toggleAudio}
            aria-label={muted ? "Unmute audio" : "Mute audio"}
            title={muted ? "Unmute audio" : "Mute audio"}
          >
            {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>

          {/* Language Switcher */}
          <button
            type="button"
            className="anime-btn dark sm lang-btn"
            onClick={toggleLanguage}
            aria-label="Change language"
            title="Change language"
          >
            <Globe size={15} />
            <span className="lang-text">{i18n.language === "ko" ? "EN" : "한국어"}</span>
          </button>

          {/* Leaderboard */}
          {onOpenLeaderboard && (
            <button
              type="button"
              className="anime-btn dark sm icon-btn"
              onClick={onOpenLeaderboard}
              aria-label={t("leaderboard.title")}
              title={t("leaderboard.title")}
            >
              <Trophy size={15} />
            </button>
          )}

          {/* LOGOUT Button (Identical to Game Screen) */}
          {user && (
            <button
              type="button"
              className="anime-btn dark sm logout-btn"
              onClick={handleLogout}
              aria-label={t("nav.logout")}
              title={t("nav.logout")}
            >
              <LogOut size={15} />
              <span className="logout-text">{t("nav.logout")}</span>
            </button>
          )}
        </div>
      </header>

      <div className="anime-card" style={{ maxWidth: 460, width: "100%", textAlign: "center" }}>
        <h2 id="result-title" style={{ fontSize: 28, fontWeight: 900, marginBottom: 12 }}>
          {t("result.title")}
        </h2>

        {/* Grade Ribbon Badge */}
        <div style={{ display: "inline-block", position: "relative", marginBottom: 16 }}>
          <div
            style={{
              fontSize: 68,
              fontWeight: 900,
              color: getGradeColor(grade),
              textShadow: `0 0 24px ${getGradeColor(grade)}`,
              lineHeight: 1,
            }}
          >
            {grade}
          </div>
          <div style={{ fontSize: 13, color: "#94A3B8", marginTop: 4 }}>
            {percentage}% {t("result.gradeDesc")}
          </div>
        </div>

        {/* Big Score Box */}
        <div
          style={{
            background: "rgba(15, 23, 42, 0.9)",
            border: "2px solid rgba(255, 255, 255, 0.1)",
            borderRadius: 16,
            padding: "16px 20px",
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 13, textTransform: "uppercase", color: "#94A3B8", fontWeight: 700 }}>
            {t("result.score")}
          </div>
          <div style={{ fontSize: 36, fontWeight: 900, color: "#FFFFFF", letterSpacing: 1 }}>
            {stats.score.toLocaleString()} <span style={{ fontSize: 18, color: "#F59E0B" }}>PTS</span>
          </div>
        </div>

        {/* Detailed Stats Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginBottom: 20,
            textAlign: "left",
          }}
        >
          <div className="hud-stat-pill" style={{ justifyContent: "space-between" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              <Flame size={16} color="#EF4444" /> {t("result.maxCombo")}
            </span>
            <span style={{ color: "#FFD200" }}>{stats.maxCombo}</span>
          </div>

          <div className="hud-stat-pill" style={{ justifyContent: "space-between" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              <Users size={16} color="#38BDF8" /> {t("result.entered")}
            </span>
            <span>{stats.enteredCount}</span>
          </div>

          <div className="hud-stat-pill" style={{ justifyContent: "space-between" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              <AlertTriangle size={16} color="#F59E0B" /> {t("result.tripped")}
            </span>
            <span style={{ color: stats.trippedCount > 0 ? "#EF4444" : "#10B981" }}>
              {stats.trippedCount}
            </span>
          </div>

          <div className="hud-stat-pill" style={{ justifyContent: "space-between" }}>
            <span style={{ fontSize: 13 }}>PERFECT / GOOD</span>
            <span>
              {stats.perfectCount} / {stats.goodCount}
            </span>
          </div>
        </div>

        {/* Guest Link Notice */}
        {isGuest && (
          <div
            style={{
              background: "rgba(245, 158, 11, 0.15)",
              border: "1px solid rgba(245, 158, 11, 0.4)",
              borderRadius: 14,
              padding: "10px 14px",
              fontSize: 13,
              color: "#FCD34D",
              textAlign: "left",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <UserPlus size={20} style={{ flexShrink: 0 }} />
            <div>
              <p style={{ margin: 0 }}>{t("result.saveGuestNotice")}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Button
            type="button"
            variant="primary"
            size="lg"
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            onClick={onPlayAgain}
          >
            <RefreshCw size={20} />
            <span>{t("result.playAgain")}</span>
          </Button>

          <div style={{ display: "flex", gap: 10 }}>
            {isGuest && (
              <Button
                type="button"
                variant="secondary"
                style={{ flex: 1 }}
                onClick={onOpenMyPage}
              >
                {t("result.linkAccount")}
              </Button>
            )}

            <Button
              type="button"
              variant="dark"
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              onClick={onOpenLeaderboard}
            >
              <Trophy size={16} />
              <span>{t("result.viewLeaderboard")}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
