import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { CameraAngle, CameraMode } from "@/game/logic/types";
import { Button } from "@/shared/ui/Button";
import { Camera, ZoomIn, ZoomOut, Flame, Users, Timer } from "lucide-react";

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
}) => {
  const { t } = useTranslation();

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
      {/* Top HUD */}
      <div className="game-hud-top">
        {/* Left: Time, Stop/Go Toggle Button & Rush indicator */}
        <div className="hud-stat-pill" style={{ pointerEvents: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <Timer size={20} color={isRush ? "#EF4444" : "#FFD200"} />
          <span className={`hud-timer ${isRush ? "rush" : ""}`}>
            {remainingTime}s
          </span>

          {/* Test/Debug Toggle: Stop -> Go */}
          {!isEnding && (
            <button
              type="button"
              className={`anime-btn sm ${isPaused ? "accent-green" : "danger"}`}
              style={{
                padding: "4px 12px",
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: 0.5,
                height: 28,
                borderRadius: 8,
                minWidth: 52,
                cursor: "pointer",
              }}
              onClick={onTogglePause}
              aria-label={isPaused ? "Go" : "Stop"}
              title="개발/테스트용 일시정지 토글 버튼 (클릭 시 화면 고정/재개)"
            >
              {isPaused ? "Go" : "Stop"}
            </button>
          )}

          {isRush && (
            <span style={{ color: "#EF4444", fontSize: 13, fontWeight: 900 }}>
              {t("game.speedUp")}
            </span>
          )}
        </div>

        {/* Center: Jumpers Count & Character Roster Button */}
        <div className="hud-stat-pill" style={{ display: "flex", alignItems: "center", gap: 12, pointerEvents: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Users size={18} color="#38BDF8" />
            <span style={{ fontSize: 16 }}>
              {activeJumpers} / {maxJumpers}
            </span>
          </div>

          {onOpenCharacterSidebar && (
            <button
              type="button"
              className="anime-btn sm dark"
              style={{
                padding: "3px 10px",
                fontSize: 12,
                fontWeight: 800,
                height: 28,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                gap: 5,
                cursor: "pointer",
                border: "1px solid rgba(255, 215, 0, 0.4)",
              }}
              onClick={onOpenCharacterSidebar}
              title="캐릭터 선택 및 업로드 (사이드바)"
            >
              <span>👥 캐릭터 변경</span>
            </button>
          )}
        </div>

        {/* Right: Combo & Score */}
        <div className="hud-stat-pill">
          {combo > 0 && (
            <div className="hud-combo-badge">
              <Flame size={14} style={{ display: "inline", marginRight: 4 }} />
              {combo} COMBO ({comboMultiplier.toFixed(1)}x)
            </div>
          )}
          <div className="hud-score">
            {score.toLocaleString()} PTS
          </div>
        </div>
      </div>

      {/* Bottom HUD */}
      <div className="game-hud-bottom">
        {/* 1. Bottom Left: Still / Move Toggle & Angle Switcher */}
        <div className="bottom-left-controls">
          <div className="hud-tool-card">
            <Button
              type="button"
              variant={cameraMode === "still" ? "primary" : "dark"}
              size="sm"
              onClick={onToggleCameraMode}
            >
              {cameraMode === "still" ? t("game.still") : t("game.move")}
            </Button>

            {cameraMode === "move" && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onCycleCameraAngle}
              >
                <Camera size={16} />
                <span>{getCameraAngleLabel(cameraAngle)}</span>
              </Button>
            )}
          </div>
        </div>

        {/* 2. Bottom Center: Large Jump-In & Jump-Out buttons (Hidden during ending sequence) */}
        {!isEnding && (
          <div className="bottom-center-controls">
            <button
              type="button"
              className="anime-btn accent-green jump-action-btn"
              onClick={onJumpIn}
              disabled={isLocked || activeJumpers >= maxJumpers}
              aria-label={t("game.jumpIn")}
            >
              {isLocked ? t("game.cooldown") : t("game.jumpIn")}
            </button>

            <button
              type="button"
              className="anime-btn danger jump-action-btn"
              onClick={onJumpOut}
              disabled={isLocked || activeJumpers === 0}
              aria-label={t("game.jumpOut")}
            >
              {isLocked ? t("game.cooldown") : t("game.jumpOut")}
            </button>
          </div>
        )}

        {/* 3. Bottom Right: 5-step Zoom control */}
        <div className="bottom-right-controls">
          <div className="hud-tool-card">
            <button
              type="button"
              className="anime-btn dark sm"
              onClick={() => handleZoomStep("out")}
              disabled={zoomLevel <= ZOOM_STEPS[0]}
              aria-label="Zoom out"
            >
              <ZoomOut size={16} />
            </button>

            <span style={{ fontSize: 13, fontWeight: 800, minWidth: 46, textAlign: "center" }}>
              {Math.round(zoomLevel * 100)}%
            </span>

            <button
              type="button"
              className="anime-btn dark sm"
              onClick={() => handleZoomStep("in")}
              disabled={zoomLevel >= ZOOM_STEPS[ZOOM_STEPS.length - 1]}
              aria-label="Zoom in"
            >
              <ZoomIn size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
