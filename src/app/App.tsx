import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth/model/useAuth";
import { TopNav } from "@/shared/ui/TopNav";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { GamePage } from "@/pages/GamePage";
import { ResultPage } from "@/pages/ResultPage";
import { NicknameModal } from "@/features/auth/ui/NicknameModal";
import { MyPageModal } from "@/features/profile/ui/MyPageModal";
import { LeaderboardModal } from "@/features/leaderboard/ui/LeaderboardModal";
import { AdminModal } from "@/features/admin/ui/AdminModal";
import { SpeechBubble } from "@/shared/ui/SpeechBubble";
import { GamePlayStats, GameSettings } from "@/game/logic/types";

type Screen = "home" | "game" | "result";

export const App: React.FC = () => {
  const { t } = useTranslation();
  const { user, profile, loginGuest, setNickname, loading } = useAuth();

  const [screen, setScreen] = useState<Screen>("home");

  // Modals state
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [showNicknameModal, setShowNicknameModal] = useState<boolean>(false);
  const [showMyPageModal, setShowMyPageModal] = useState<boolean>(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState<boolean>(false);
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);

  // First game completed tracker (for difficulty 3 highlight hiding)
  const [hasPlayedFirstGame, setHasPlayedFirstGame] = useState<boolean>(() => {
    return localStorage.getItem("doubledutch_has_played") === "true";
  });

  // Account deleted notice toast
  const [accountDeletedNotice, setAccountDeletedNotice] = useState<boolean>(false);

  // Result state
  const [lastStats, setLastStats] = useState<GamePlayStats | null>(null);
  const [lastSettings, setLastSettings] = useState<GameSettings>({
    duration: 60,
    speed: 2,
    difficulty: 1,
    maxJumpers: 3,
  });
  const [lastTheoreticalMax, setLastTheoreticalMax] = useState<number>(1000);
  const [lastGrade, setLastGrade] = useState<"S" | "A" | "B" | "C">("B");

  // Handler for starting game
  const handleStartGame = () => {
    // If user has no nickname, prompt for nickname first
    if (user && (!profile?.nickname || profile.nickname.trim() === "")) {
      setShowNicknameModal(true);
      return;
    }
    setScreen("game");
  };

  // Guest Play
  const handleGuestPlay = async () => {
    try {
      if (!user) {
        await loginGuest();
      }
      // If no nickname, open nickname prompt
      setShowNicknameModal(true);
    } catch (err) {
      console.error("Guest login failed:", err);
    }
  };

  // Nickname confirm
  const handleNicknameConfirm = async (nick: string) => {
    await setNickname(nick);
    setShowNicknameModal(false);
    setScreen("game");
  };

  // Game Over handler
  const handleGameOver = (
    stats: GamePlayStats,
    settings: GameSettings,
    theoreticalMax: number,
    grade: "S" | "A" | "B" | "C"
  ) => {
    setLastStats(stats);
    setLastSettings(settings);
    setLastTheoreticalMax(theoreticalMax);
    setLastGrade(grade);
    setHasPlayedFirstGame(true);
    localStorage.setItem("doubledutch_has_played", "true");
    setScreen("result");
  };

  if (loading) {
    return (
      <div className="app-viewport" style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#FFD200", fontSize: 24, fontWeight: 900 }}>Loading Double Dutch...</div>
      </div>
    );
  }

  return (
    <div className="app-viewport">
      {/* Top Navigation */}
      <TopNav
        onHomeClick={() => setScreen("home")}
        onOpenMyPage={() => setShowMyPageModal(true)}
        onOpenLeaderboard={() => setShowLeaderboardModal(true)}
        onOpenAdmin={() => setShowAdminModal(true)}
        showUserControls={!showLoginModal && !showRegisterModal}
      />

      {/* Account Deletion Notice Toast */}
      {accountDeletedNotice && (
        <div
          style={{
            position: "absolute",
            top: 70,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 300,
          }}
        >
          <SpeechBubble message={t("mypage.deleteSuccess")} variant="info" />
        </div>
      )}

      {/* Main Screens */}
      {screen === "home" && (
        <HomePage
          onStartGame={handleStartGame}
          onOpenLogin={() => setShowLoginModal(true)}
          onOpenRegister={() => setShowRegisterModal(true)}
          onPlayGuest={handleGuestPlay}
        />
      )}

      {screen === "game" && (
        <GamePage
          onGameOver={handleGameOver}
          hasPlayedFirstGame={hasPlayedFirstGame}
        />
      )}

      {screen === "result" && lastStats && (
        <ResultPage
          stats={lastStats}
          settings={lastSettings}
          grade={lastGrade}
          theoreticalMax={lastTheoreticalMax}
          onPlayAgain={() => setScreen("game")}
          onOpenMyPage={() => setShowMyPageModal(true)}
          onOpenLeaderboard={() => setShowLeaderboardModal(true)}
        />
      )}

      {/* Modals */}
      {showLoginModal && (
        <LoginPage
          onSwitchToRegister={() => {
            setShowLoginModal(false);
            setShowRegisterModal(true);
          }}
          onSuccess={() => {
            setShowLoginModal(false);
            if (!profile?.nickname) {
              setShowNicknameModal(true);
            }
          }}
          onCancel={() => setShowLoginModal(false)}
        />
      )}

      {showRegisterModal && (
        <RegisterPage
          onSwitchToLogin={() => {
            setShowRegisterModal(false);
            setShowLoginModal(true);
          }}
          onSuccess={() => {
            setShowRegisterModal(false);
            setShowNicknameModal(true);
          }}
          onCancel={() => setShowRegisterModal(false)}
        />
      )}

      <NicknameModal
        isOpen={showNicknameModal}
        onConfirm={handleNicknameConfirm}
      />

      <MyPageModal
        isOpen={showMyPageModal}
        onClose={() => setShowMyPageModal(false)}
        onAccountDeleted={() => {
          setAccountDeletedNotice(true);
          setScreen("home");
          setTimeout(() => setAccountDeletedNotice(false), 4000);
        }}
      />

      <LeaderboardModal
        isOpen={showLeaderboardModal}
        onClose={() => setShowLeaderboardModal(false)}
        defaultDuration={lastSettings.duration}
        defaultSpeed={lastSettings.speed}
        defaultDifficulty={lastSettings.difficulty}
      />

      <AdminModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
      />
    </div>
  );
};
