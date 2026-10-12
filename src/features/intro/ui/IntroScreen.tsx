import React, { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Volume2, VolumeX, FastForward } from "lucide-react";
import { soundManager } from "@/shared/audio/soundManager";

interface IntroScreenProps {
  onComplete: () => void;
}

const INTRO_DURATION_MS = 3000; // 3.0 seconds

export const IntroScreen: React.FC<IntroScreenProps> = ({ onComplete }) => {
  const { t } = useTranslation();
  const [stage, setStage] = useState<number>(0); // 0, 1, 2
  const [progress, setProgress] = useState<number>(0); // 0 to 1
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(soundManager.getMuted());
  const [videoLoaded, setVideoLoaded] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const completedRef = useRef<boolean>(false);

  // Toggle Mute
  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMuted = soundManager.toggleMute();
    setMuted(nextMuted);
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
    if (!nextMuted) {
      soundManager.playIntroStage(stage);
    }
  };

  // Immediate Skip or End
  const handleSkip = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (completedRef.current) return;
    completedRef.current = true;
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 350);
  };

  // Stage sound triggers
  useEffect(() => {
    if (!muted) {
      soundManager.playIntroStage(stage);
    }
  }, [stage, muted]);

  // Video Autoplay & Timer loop
  useEffect(() => {
    startTimeRef.current = Date.now();
    completedRef.current = false;

    // Attempt autoplay video
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {
        // Autoplay policy fallback: video remains paused or muted
      });
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const currentProgress = Math.min(1, elapsed / INTRO_DURATION_MS);
      setProgress(currentProgress);

      if (elapsed < 1000) {
        setStage(0);
      } else if (elapsed < 2000) {
        setStage(1);
      } else {
        setStage(2);
      }

      if (elapsed >= INTRO_DURATION_MS && !completedRef.current) {
        clearInterval(interval);
        handleSkip();
      }
    }, 20);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Floating neon sparks canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
    }> = [];

    const colors = ["#00F0FF", "#FF007F", "#FFE600", "#FFFFFF"];
    for (let i = 0; i < 35; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        size: Math.random() * 3 + 1.5,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let running = true;
    let animId: number;
    const loop = () => {
      if (!running) return;
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      running = false;
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  const timeLeft = Math.max(0, 3 - Math.floor(progress * 3));

  return (
    <div
      className={`intro-screen-overlay ${isFadingOut ? "fade-out" : ""}`}
      onClick={() => handleSkip()}
    >
      {/* 1. Real AI Generated WebM Video Player */}
      <video
        ref={videoRef}
        src="/assets/intro/intro_video.webm"
        autoPlay
        muted={muted}
        playsInline
        preload="auto"
        onCanPlay={() => setVideoLoaded(true)}
        onEnded={() => handleSkip()}
        className={`intro-video-element ${videoLoaded ? "loaded" : "loading"}`}
      />

      {/* 2. Visual AI Keyframe Fallback/Backdrop Layers */}
      <div className={`intro-scenes-wrapper ${videoLoaded ? "video-active" : ""}`}>
        <div
          className={`intro-scene intro-scene-0 ${stage === 0 ? "active" : "inactive"}`}
          style={{ backgroundImage: `url('/assets/intro/scene_1.jpg')` }}
        />
        <div
          className={`intro-scene intro-scene-1 ${stage === 1 ? "active" : "inactive"}`}
          style={{ backgroundImage: `url('/assets/intro/scene_2.jpg')` }}
        />
        <div
          className={`intro-scene intro-scene-2 ${stage === 2 ? "active" : "inactive"}`}
          style={{ backgroundImage: `url('/assets/intro/scene_title.jpg')` }}
        />
      </div>

      {/* Speed lines overlay */}
      <div className={`intro-speedlines stage-${stage}`} />

      {/* Floating Canvas Sparks */}
      <canvas ref={canvasRef} className="intro-particles-canvas" />

      {/* Retro Sci-Fi / Anime HUD */}
      <div className="intro-hud" onClick={(e) => e.stopPropagation()}>
        {/* Top Header */}
        <div className="intro-top-bar">
          <div className="intro-rec-indicator">
            <span className="rec-dot" />
            <span className="rec-label">REC</span>
            <span className="rec-timer">00:0{timeLeft}</span>
            <span className="intro-ai-badge">AI CINEMATIC VIDEO</span>
          </div>

          <div className="intro-top-actions">
            {/* Audio Toggle */}
            <button
              type="button"
              className="intro-icon-btn"
              onClick={handleToggleMute}
              title={muted ? "Unmute" : "Mute"}
              aria-label="Toggle Audio"
            >
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>

            {/* Skip Button */}
            <button
              type="button"
              className="intro-skip-btn"
              onClick={handleSkip}
            >
              <span>{t("intro.skip", "SKIP")}</span>
              <FastForward size={16} />
            </button>
          </div>
        </div>

        {/* Center Title Sub-banner */}
        <div className="intro-center-banner">
          {stage === 0 && (
            <div className="intro-caption">
              <span className="intro-tag">SCENE 01</span>
              <h2 className="intro-heading">STREET ARENA BATTLE</h2>
            </div>
          )}
          {stage === 1 && (
            <div className="intro-caption">
              <span className="intro-tag">SCENE 02</span>
              <h2 className="intro-heading">NEON JUMP RUSH!</h2>
            </div>
          )}
          {stage === 2 && (
            <div className="intro-caption">
              <span className="intro-tag">STAGE START</span>
              <h2 className="intro-heading title-glow">DOUBLE DUTCH</h2>
            </div>
          )}
        </div>

        {/* Bottom Progress Bar */}
        <div className="intro-bottom-bar">
          <div className="intro-progress-track">
            <div
              className="intro-progress-fill"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <div className="intro-progress-meta">
            <span>3.0s AI OPENING VIDEO</span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
