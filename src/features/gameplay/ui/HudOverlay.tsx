import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CameraAngle, CameraMode } from "@/game/logic/types";
import { Button } from "@/shared/ui/Button";
import {
  Camera,
  ZoomIn,
  ZoomOut,
  Flame,
  Users,
  Timer,
  Volume2,
  VolumeX,
  Globe,
  Trophy,
  LogOut,
} from "lucide-react";
import { soundManager } from "@/shared/audio/soundManager";
import { useAuth } from "@/features/auth/model/useAuth";
import { getNextLanguage, getLanguageLabel } from "@/shared/i18n";

interface HudOverlayProps {
  score: number;
  combo: number;
  comboMultiplier: number;
  remainingTime: number;
  activeJumpers: number;
  maxJumpers: number;
  isRush: boolean;
  currentAngle: number;
  isLocked: boolean;
  isEnding?: boolean;
  cameraMode: CameraMode;
  cameraAngle: CameraAngle;
  zoomLevel: number;
  isPaused: boolean;
  onTogglePause: () => void;
  onJumpIn: () => void;
  onJumpOut: () => void;
  onToggleCameraMode: () => void;
  onCycleCameraAngle: () => void;
  onZoomChange: (zoom: number) => void;
  onOpenCharacterSidebar?: () => void;
  onOpenLeaderboard?: () => void;
  onOpenMyPage?: () => void;
  onHomeClick?: () => void;
}

const ZOOM_STEPS = [0.8, 0.9, 1.0, 1.15, 1.3];

export const HudOverlay: React.FC<HudOverlayProps> = ({
  score,
  combo,
  comboMultiplier,
  remainingTime,
  activeJumpers,
  maxJumpers,
  isRush,
  isLocked,
  isEnding = false,
  cameraMode,
  cameraAngle,
  zoomLevel,
  isPaused,
  onTogglePause,
  onJumpIn,
  onJumpOut,
  onToggleCameraMode,
  onCycleCameraAngle,
  onZoomChange,
  onOpenCharacterSidebar,
  onOpenLeaderboard,
  onOpenMyPage,
  onHomeClick,
}) => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const [muted, setMuted] = useState(soundManager.getMuted());

  const toggleLanguage = () => {
    const nextLang = getNextLanguage(i18n.language);
    i18n.changeLanguage(nextLang);
  };

  const toggleAudio = () => {
    const nextMuted = soundManager.toggleMute();
    setMuted(nextMuted);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEnding) return;
      if (e.repeat) return;
      if (e.code === "Space" || e.code === "KeyJ") {
        e.preventDefault();
        onJumpIn();
      } else if (e.code === "KeyK" || e.code === "Backspace") {
        e.preventDefault();
        onJumpOut();
      } else if (e.code === "KeyC") {
        if (cameraMode === "move") {
          onCycleCameraAngle();
        } else {
          onToggleCameraMode();
        }
      } else if (e.code === "KeyP") {
        onTogglePause();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onJumpIn, onJumpOut, cameraMode, onCycleCameraAngle, onToggleCameraMode, onTogglePause, isEnding]);

  // Handle Zoom change step
  const handleZoomStep = (direction: "in" | "out") => {
    const currentIndex = ZOOM_STEPS.indexOf(zoomLevel);
    if (direction === "in" && currentIndex < ZOOM_STEPS.length - 1) {
      onZoomChange(ZOOM_STEPS[currentIndex + 1]);
    } else if (direction === "out" && currentIndex > 0) {
      onZoomChange(ZOOM_STEPS[currentIndex - 1]);
    }
  };

  const getCameraAngleLabel = (angle: CameraAngle) => {
    switch (angle) {
      case "front": return t("game.front");
      case "left": return t("game.left");
      case "right": return t("game.right");
      case "high": return t("game.high");
    }
  };

  return (
    <>
      {/* 1. Top Fixed Unified Control Bar (Requirement 1) */}
      <header className="game-top-control-bar" role="banner" aria-label="Game Control Bar">
        {/* Row 1 for Mobile / Ordered item for Desktop */}
        <div className="top-row-mobile row-1">
          {/* Group 1: Timer, Rush & GO / Stop Toggle Button */}
          <div className="top-control-group top-group-timer">
            <div className="hud-stat-pill timer-pill">
              <Timer size={18} color={isRush ? "#EF4444" : "#FFD200"} />
              <span className={`hud-timer ${isRush ? "rush" : ""}`}>
                {remainingTime}s
              </span>

              {!isEnding && (
                <button
                  type="button"
                  className={`anime-btn sm ${isPaused ? "accent-green" : "danger"} go-toggle-btn`}
                  onClick={onTogglePause}
                  aria-label={isPaused ? "Go" : "Stop"}
                  title={isPaused ? "Resume game" : "Pause game"}
                >
                  {isPaused ? "GO" : "STOP"}
                </button>
              )}

              {isRush && (
                <span className="rush-label">
                  <span className="rush-icon">⚡</span>
                  <span className="rush-text">{t("game.speedUp")}</span>
                </span>
              )}
            </div>
          </div>

          {/* Group 4: Quick Nav Utility Controls (Audio, Lang, Trophy, Logout) */}
          <div className="top-control-group top-group-nav nav-actions">
            <button
              type="button"
              className="anime-btn dark sm icon-btn"
              onClick={toggleAudio}
              aria-label={muted ? "Unmute audio" : "Mute audio"}
              title={muted ? "Unmute audio" : "Mute audio"}
            >
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>

            <button
              type="button"
              className="anime-btn dark sm lang-btn"
              onClick={toggleLanguage}
              aria-label="Change language"
              title={`Language: ${getLanguageLabel(i18n.language)}`}
            >
              <Globe size={18} />
              <span className="lang-text">{getLanguageLabel(i18n.language, true)}</span>
            </button>

            {onOpenLeaderboard && (
              <button
                type="button"
                className="anime-btn dark sm icon-btn"
                onClick={onOpenLeaderboard}
                aria-label={t("leaderboard.title")}
                title={t("leaderboard.title")}
              >
                <Trophy size={18} />
              </button>
            )}

            {user && (
              <button
                type="button"
                className="anime-btn dark sm logout-btn"
                onClick={logout}
                aria-label={t("nav.logout")}
                title={t("nav.logout")}
              >
                <LogOut size={18} />
                <span className="logout-text">{t("nav.logout")}</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2 for Mobile / Ordered item for Desktop */}
        <div className="top-row-mobile row-2">
          {/* Group 2: Jumpers Count & Character Roster Button */}
          <div className="top-control-group top-group-jumpers">
            <div className="hud-stat-pill roster-pill">
              <div className="jumpers-counter">
                <Users size={16} color="#38BDF8" />
                <span className="jumpers-count-text">
                  {activeJumpers} / {maxJumpers}
                </span>
              </div>

              {onOpenCharacterSidebar && (
                <button
                  type="button"
                  className="anime-btn sm dark character-change-btn"
                  onClick={onOpenCharacterSidebar}
                  title={t("game.changeCharacter")}
                >
                  <span className="char-btn-icon">👥</span>
                  <span className="char-btn-text"> {t("game.changeCharacter")}</span>
                </button>
              )}
            </div>
          </div>

          {/* Group 3: Combo Badge & Score */}
          <div className="top-control-group top-group-score">
            <div className="hud-stat-pill score-pill">
              {combo > 0 && (
                <div className="hud-combo-badge">
                  <Flame size={13} style={{ display: "inline", marginRight: 2 }} />
                  <span className="combo-count">{combo}</span>
                  <span className="combo-suffix">C</span>
                  <span className="combo-mult"> ({comboMultiplier.toFixed(1)}x)</span>
                </div>
              )}
              <div className="hud-score">
                <span className="score-val">{score.toLocaleString()}</span>
                <span className="pts-label"> PTS</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Bottom Center Controls: JUMP-IN & JUMP-OUT buttons (Requirement 2) */}
      {!isEnding && (
        <div className="bottom-center-controls">
          <button
            type="button"
            className="jump-action-btn accent-green"
            onClick={onJumpIn}
            disabled={isLocked || activeJumpers >= maxJumpers}
            aria-label="JUMP-IN"
          >
            {isLocked ? t("game.cooldown") : "JUMP-IN"}
          </button>

          <button
            type="button"
            className="jump-action-btn danger"
            onClick={onJumpOut}
            disabled={isLocked || activeJumpers === 0}
            aria-label="JUMP-OUT"
          >
            {isLocked ? t("game.cooldown") : "JUMP-OUT"}
          </button>
        </div>
      )}

      {/* 3. Bottom Right Controls: STILL / MOVE, Camera Angle & 100% Zoom (Requirement 4) */}
      <div className="bottom-right-controls">
        <div className="hud-tool-card">
          <Button
            type="button"
            variant={cameraMode === "still" ? "primary" : "dark"}
            size="sm"
            onClick={onToggleCameraMode}
            className="camera-mode-btn"
          >
            {cameraMode === "still" ? t("game.still") : t("game.move")}
          </Button>

          {cameraMode === "move" && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onCycleCameraAngle}
              className="camera-angle-btn"
            >
              <Camera size={14} />
              <span>{getCameraAngleLabel(cameraAngle)}</span>
            </Button>
          )}

          <div className="zoom-controls-divider" />

          <button
            type="button"
            className="anime-btn dark sm icon-btn"
            onClick={() => handleZoomStep("out")}
            disabled={zoomLevel <= ZOOM_STEPS[0]}
            aria-label="Zoom out"
          >
            <ZoomOut size={14} />
          </button>

          <span className="zoom-pct-label">
            {Math.round(zoomLevel * 100)}%
          </span>

          <button
            type="button"
            className="anime-btn dark sm icon-btn"
            onClick={() => handleZoomStep("in")}
            disabled={zoomLevel >= ZOOM_STEPS[ZOOM_STEPS.length - 1]}
            aria-label="Zoom in"
          >
            <ZoomIn size={14} />
          </button>
        </div>
      </div>
    </>
  );
};
