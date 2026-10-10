import React, { useEffect, useRef, useState, useCallback } from "react";
import { DoubleDutchGame } from "@/game/DoubleDutchGame";
import { GameSettings, CameraAngle, CameraMode, GamePlayStats } from "@/game/logic/types";
import { HudOverlay } from "@/features/gameplay/ui/HudOverlay";
import { SettingsModal } from "@/features/gameplay/ui/SettingsModal";
import { CharacterSidebar } from "@/features/character/ui/CharacterSidebar";
import { SelectedCharacters } from "@/entities/character/types";
import { saveGameSession } from "@/entities/session/api/sessionApi";
import { useAuth } from "@/features/auth/model/useAuth";
import { Trophy } from "lucide-react";

interface GamePageProps {
  onGameOver: (stats: GamePlayStats, settings: GameSettings, theoreticalMax: number, grade: "S" | "A" | "B" | "C") => void;
  hasPlayedFirstGame: boolean;
  onOpenLeaderboard?: () => void;
  onOpenMyPage?: () => void;
  onHomeClick?: () => void;
}

const CAMERA_ANGLES_ORDER: CameraAngle[] = ["front", "left", "right", "high"];

export const GamePage: React.FC<GamePageProps> = ({
  onGameOver,
  hasPlayedFirstGame,
  onOpenLeaderboard,
  onOpenMyPage,
  onHomeClick,
}) => {
  const { user, profile } = useAuth();
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<DoubleDutchGame | null>(null);

  // Settings & play state
  const [showSettings, setShowSettings] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [settings, setSettings] = useState<GameSettings>({
    duration: 60,
    speed: 2,
    difficulty: 1,
    maxJumpers: 3,
  });

  // HUD stats state
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [comboMultiplier, setComboMultiplier] = useState(1.0);
  const [remainingTime, setRemainingTime] = useState(60);
  const [activeJumpers, setActiveJumpers] = useState(0);
  const [isRush, setIsRush] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  // View state
  const [cameraMode, setCameraMode] = useState<CameraMode>("still");
  const [cameraAngle, setCameraAngle] = useState<CameraAngle>("front");
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isCharacterSidebarOpen, setIsCharacterSidebarOpen] = useState<boolean>(false);

  // Ending sequence & Score button state
  const [isEnding, setIsEnding] = useState<boolean>(false);
  const [showScoreButton, setShowScoreButton] = useState<boolean>(false);
  const [scoreResultData, setScoreResultData] = useState<any>(null);

  // Track latest stats for beforeunload save
  const latestStatsRef = useRef<GamePlayStats>({
    score: 0,
    comboRounds: 0,
    maxCombo: 0,
    enteredCount: 0,
    trippedCount: 0,
    perfectCount: 0,
    goodCount: 0,
    missCount: 0,
  });
  const startTimeRef = useRef<number>(Date.now());

  // Save in-progress game on tab close or navigation
  const saveSessionProgress = useCallback(
    (completed: boolean) => {
      if (!isPlaying || latestStatsRef.current.score === 0) return;
      saveGameSession({
        uid: user ? user.uid : null,
        nickname: profile?.nickname || "Guest",
        duration: settings.duration,
        speed: settings.speed,
        difficulty: settings.difficulty,
        maxJumpers: settings.maxJumpers,
        score: latestStatsRef.current.score,
        maxCombo: latestStatsRef.current.maxCombo,
        perfects: latestStatsRef.current.perfectCount,
        goods: latestStatsRef.current.goodCount,
        misses: latestStatsRef.current.missCount,
        entered: latestStatsRef.current.enteredCount,
        tripped: latestStatsRef.current.trippedCount,
        startedAt: startTimeRef.current,
        endedAt: Date.now(),
        completed,
      }).catch((e) => console.error(e));
    },
    [isPlaying, user, profile, settings]
  );

  useEffect(() => {
    const handleBeforeUnload = () => {
      saveSessionProgress(false);
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      saveSessionProgress(false);
    };
  }, [saveSessionProgress]);

  // Touch Swipe gesture support for camera angles in Move mode
  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const cycleCameraAngle = useCallback(
    (direction: "next" | "prev" = "next") => {
      const idx = CAMERA_ANGLES_ORDER.indexOf(cameraAngle);
      let nextIdx = direction === "next" ? idx + 1 : idx - 1;
      if (nextIdx >= CAMERA_ANGLES_ORDER.length) nextIdx = 0;
      if (nextIdx < 0) nextIdx = CAMERA_ANGLES_ORDER.length - 1;

      const nextAngle = CAMERA_ANGLES_ORDER[nextIdx];
      setCameraAngle(nextAngle);
      gameInstanceRef.current?.setCameraAngle(nextAngle);
    },
    [cameraAngle]
  );

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (cameraMode !== "move") return;
    const diffX = e.changedTouches[0].clientX - touchStartXRef.current;
    const diffY = e.changedTouches[0].clientY - touchStartYRef.current;

    // Horizontal swipe threshold 40px, more horizontal than vertical
    if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) {
        cycleCameraAngle("prev");
      } else {
        cycleCameraAngle("next");
      }
    }
  };

  // Launch Phaser Game
  const handleStartGame = () => {
    setShowSettings(false);
    setIsPlaying(true);
    setIsEnding(false);
    setShowScoreButton(false);
    setScoreResultData(null);
    startTimeRef.current = Date.now();

    if (!canvasContainerRef.current) return;

    if (!gameInstanceRef.current) {
      gameInstanceRef.current = new DoubleDutchGame(canvasContainerRef.current);
    }

    gameInstanceRef.current.init(settings, hasPlayedFirstGame);

    // Event listeners
    gameInstanceRef.current.on("REACT_HUD_UPDATE", (hud: any) => {
      setScore(hud.score);
      setCombo(hud.combo);
      setComboMultiplier(hud.comboMultiplier);
      setRemainingTime(hud.remainingTime);
      setActiveJumpers(hud.activeJumpers);
      setIsRush(hud.isRush);
      setCurrentAngle(hud.currentAngle);

      latestStatsRef.current.score = hud.score;
      latestStatsRef.current.comboRounds = hud.combo;
    });

    gameInstanceRef.current.on("REACT_BUTTONS_LOCKED", (locked: boolean) => {
      setIsLocked(locked);
    });

    // 3-second ending animation sequence started
    gameInstanceRef.current.on("REACT_GAME_ENDING", () => {
      setIsEnding(true);
    });

    // 3-second scene ended & frozen -> show "스코어 보기" button at bottom
    gameInstanceRef.current.on("REACT_SHOW_SCORE_BUTTON", (result: any) => {
      setScoreResultData(result);
      setShowScoreButton(true);
    });

    // Fallback if direct GAME_OVER is received
    gameInstanceRef.current.on("REACT_GAME_OVER", (result: any) => {
      setIsPlaying(false);
      latestStatsRef.current = result.stats;
      saveSessionProgress(true);
      onGameOver(result.stats, result.settings, result.theoreticalMax, result.grade);
    });
  };

  // User clicked "스코어 보기" button -> navigate to scoreboard (ResultPage)
  const handleProceedToScoreboard = () => {
    if (!scoreResultData) return;
    setIsPlaying(false);
    setShowScoreButton(false);
    latestStatsRef.current = scoreResultData.stats;
    saveSessionProgress(true);
    onGameOver(
      scoreResultData.stats,
      scoreResultData.settings,
      scoreResultData.theoreticalMax,
      scoreResultData.grade
    );
  };

  // Actions
  const handleJumpIn = () => {
    gameInstanceRef.current?.jumpIn();
  };

  const handleJumpOut = () => {
    gameInstanceRef.current?.jumpOut();
  };

  const handleToggleCameraMode = () => {
    const nextMode: CameraMode = cameraMode === "still" ? "move" : "still";
    setCameraMode(nextMode);
    gameInstanceRef.current?.setCameraMode(nextMode);
    if (nextMode === "still") {
      setCameraAngle("front");
    }
  };

  const handleZoomChange = (zoom: number) => {
    setZoomLevel(zoom);
    gameInstanceRef.current?.setZoom(zoom);
  };

  const handleTogglePause = () => {
    const nextPaused = !isPaused;
    setIsPaused(nextPaused);
    gameInstanceRef.current?.togglePause(nextPaused);
  };

  const handleSelectCharacters = (selection: SelectedCharacters) => {
    gameInstanceRef.current?.setCharacters(selection);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      gameInstanceRef.current?.destroy();
      gameInstanceRef.current = null;
    };
  }, []);

  return (
    <div
      style={{ width: "100%", height: "100%", position: "relative" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Phaser Canvas Mount */}
      <div className="game-canvas-container" ref={canvasContainerRef} />

      {/* Settings Modal (Before Game Start) */}
      <SettingsModal
        isOpen={showSettings}
        settings={settings}
        onChangeSettings={setSettings}
        onStartGame={handleStartGame}
        hasPlayedFirstGame={hasPlayedFirstGame}
      />

      {/* In-game HUD */}
      {isPlaying && (
        <HudOverlay
          score={score}
          combo={combo}
          comboMultiplier={comboMultiplier}
          remainingTime={remainingTime}
          activeJumpers={activeJumpers}
          maxJumpers={settings.maxJumpers}
          isRush={isRush}
          currentAngle={currentAngle}
          isLocked={isLocked}
          isEnding={isEnding}
          cameraMode={cameraMode}
          cameraAngle={cameraAngle}
          zoomLevel={zoomLevel}
          isPaused={isPaused}
          onTogglePause={handleTogglePause}
          onJumpIn={handleJumpIn}
          onJumpOut={handleJumpOut}
          onToggleCameraMode={handleToggleCameraMode}
          onCycleCameraAngle={cycleCameraAngle}
          onZoomChange={handleZoomChange}
          onOpenCharacterSidebar={() => setIsCharacterSidebarOpen(true)}
          onOpenLeaderboard={onOpenLeaderboard}
          onOpenMyPage={onOpenMyPage}
          onHomeClick={onHomeClick}
        />
      )}

      {/* Ending Scene: View Scoreboard Button (Appears at bottom after 3s freeze) */}
      {showScoreButton && scoreResultData && (
        <div className="ending-scoreboard-overlay">
          <button
            type="button"
            className={`anime-btn lg ${scoreResultData.isSuccess ? "accent-yellow" : "accent-blue"} score-view-pulse-btn`}
            onClick={handleProceedToScoreboard}
          >
            <Trophy size={26} />
            <span>스코어 보기</span>
          </button>
        </div>
      )}

      {/* Character Selection & Upload Sidebar Drawer */}
      <CharacterSidebar
        isOpen={isCharacterSidebarOpen}
        onClose={() => setIsCharacterSidebarOpen(false)}
        onSelectCharacters={handleSelectCharacters}
      />
    </div>
  );
};
