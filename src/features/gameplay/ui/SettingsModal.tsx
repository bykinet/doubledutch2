import React from "react";
import { useTranslation } from "react-i18next";
import { GameSettings, GameSpeed, GameDifficulty } from "@/game/logic/types";
import { Button } from "@/shared/ui/Button";
import { Play, Sparkles } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  settings: GameSettings;
  onChangeSettings: (settings: GameSettings) => void;
  onStartGame: () => void;
  hasPlayedFirstGame: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onChangeSettings,
  onStartGame,
  hasPlayedFirstGame,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const durations = [30, 60, 90, 120, 150, 180];
  const speeds: GameSpeed[] = [1, 2, 3, 4, 5];
  const difficulties: GameDifficulty[] = [1, 2, 3];
  const jumperCounts = [1, 2, 3, 4, 5];

  const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    onChangeSettings({
      ...settings,
      [key]: value,
    });
  };

  return (
    <div className="anime-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="settings-modal-title">
      <div className="anime-card" style={{ maxWidth: 520, width: "100%" }}>
        <h2 id="settings-modal-title" style={{ fontSize: 26, fontWeight: 900, textAlign: "center", marginBottom: 20 }}>
          {t("settings.title")}
        </h2>

        {/* 1. Duration */}
        <div style={{ marginBottom: 18 }}>
          <div className="form-label">{t("settings.duration")}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
            {durations.map((d) => (
              <Button
                key={d}
                type="button"
                variant={settings.duration === d ? "primary" : "dark"}
                size="sm"
                onClick={() => updateSetting("duration", d)}
              >
                {d}s
              </Button>
            ))}
          </div>
        </div>

        {/* 2. Speed (1-5) */}
        <div style={{ marginBottom: 18 }}>
          <div className="form-label">{t("settings.speed")} (1~5)</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
            {speeds.map((s) => (
              <Button
                key={s}
                type="button"
                variant={settings.speed === s ? "primary" : "dark"}
                size="sm"
                onClick={() => updateSetting("speed", s)}
              >
                Lv.{s}
              </Button>
            ))}
          </div>
        </div>

        {/* 3. Difficulty (1-3) */}
        <div style={{ marginBottom: 18 }}>
          <div className="form-label">{t("settings.difficulty")}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {difficulties.map((d) => {
              const label = d === 1 ? t("settings.easy") : d === 2 ? t("settings.medium") : t("settings.hard");
              return (
                <Button
                  key={d}
                  type="button"
                  variant={settings.difficulty === d ? "primary" : "dark"}
                  size="sm"
                  onClick={() => updateSetting("difficulty", d)}
                >
                  {label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* 4. Max Jumpers (1-5) */}
        <div style={{ marginBottom: 20 }}>
          <div className="form-label">{t("settings.maxJumpers")} (1~5)</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
            {jumperCounts.map((c) => (
              <Button
                key={c}
                type="button"
                variant={settings.maxJumpers === c ? "primary" : "dark"}
                size="sm"
                onClick={() => updateSetting("maxJumpers", c)}
              >
                {c} {t("settings.people")}
              </Button>
            ))}
          </div>
        </div>

        {/* Floor Safe Zone Notice */}
        <div
          style={{
            background: "rgba(16, 185, 129, 0.15)",
            border: "1px solid rgba(16, 185, 129, 0.4)",
            borderRadius: 12,
            padding: "10px 14px",
            fontSize: 13,
            color: "#6EE7B7",
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 20,
          }}
        >
          <Sparkles size={16} />
          <span>
            {!hasPlayedFirstGame
              ? t("settings.safeZoneNotice")
              : settings.difficulty === 3
              ? "Hard difficulty: floor highlight hidden."
              : t("settings.safeZoneNotice")}
          </span>
        </div>

        {/* Start Game Button */}
        <Button
          type="button"
          variant="primary"
          size="lg"
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
          onClick={onStartGame}
        >
          <Play size={24} fill="#FFFFFF" />
          <span>{t("settings.start")}</span>
        </Button>
      </div>
    </div>
  );
};
