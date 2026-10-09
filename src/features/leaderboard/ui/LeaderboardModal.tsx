import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { GameDifficulty, GameSpeed } from "@/game/logic/types";
import { GameSessionRecord } from "@/entities/session/model/types";
import { fetchLeaderboard } from "@/entities/session/api/sessionApi";
import { Button } from "@/shared/ui/Button";
import { Trophy, X, Flame } from "lucide-react";

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDuration?: number;
  defaultSpeed?: GameSpeed;
  defaultDifficulty?: GameDifficulty;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  defaultDuration = 60,
  defaultSpeed = 2,
  defaultDifficulty = 1,
}) => {
  const { t } = useTranslation();

  const [duration, setDuration] = useState<number>(defaultDuration);
  const [speed, setSpeed] = useState<GameSpeed>(defaultSpeed);
  const [difficulty, setDifficulty] = useState<GameDifficulty>(defaultDifficulty);

  const [records, setRecords] = useState<GameSessionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);

    fetchLeaderboard(duration, speed, difficulty)
      .then((data) => {
        if (isMounted) setRecords(data);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, duration, speed, difficulty]);

  if (!isOpen) return null;

  return (
    <div className="anime-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="leaderboard-title">
      <div className="anime-card" style={{ maxWidth: 580, width: "100%", position: "relative" }}>
        <button
          className="form-input-icon-btn"
          style={{ position: "absolute", top: 18, right: 18 }}
          onClick={onClose}
          aria-label="Close"
        >
          <X size={22} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <Trophy size={26} color="#FFD200" />
          <h2 id="leaderboard-title" style={{ fontSize: 24, fontWeight: 900 }}>
            {t("leaderboard.title")}
          </h2>
        </div>

        <p style={{ fontSize: 13, color: "#94A3B8", marginBottom: 16 }}>
          {t("leaderboard.filterNotice")}
        </p>

        {/* Filter selectors (Only records with identical duration + speed + difficulty are compared) */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
          {/* Duration */}
          <div>
            <label className="form-label" style={{ fontSize: 11 }}>{t("settings.duration")}</label>
            <select
              className="form-input"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              style={{ padding: "8px 12px" }}
            >
              {[30, 60, 90, 120, 150, 180].map((d) => (
                <option key={d} value={d}>{d}s</option>
              ))}
            </select>
          </div>

          {/* Speed */}
          <div>
            <label className="form-label" style={{ fontSize: 11 }}>{t("settings.speed")}</label>
            <select
              className="form-input"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value) as GameSpeed)}
              style={{ padding: "8px 12px" }}
            >
              {[1, 2, 3, 4, 5].map((s) => (
                <option key={s} value={s}>Lv.{s}</option>
              ))}
            </select>
          </div>

          {/* Difficulty */}
          <div>
            <label className="form-label" style={{ fontSize: 11 }}>{t("settings.difficulty")}</label>
            <select
              className="form-input"
              value={difficulty}
              onChange={(e) => setDifficulty(Number(e.target.value) as GameDifficulty)}
              style={{ padding: "8px 12px" }}
            >
              <option value={1}>{t("settings.easy")}</option>
              <option value={2}>{t("settings.medium")}</option>
              <option value={3}>{t("settings.hard")}</option>
            </select>
          </div>
        </div>

        {/* Records Table */}
        <div style={{ maxHeight: 300, overflowY: "auto", borderTop: "1px solid #334155" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 30, color: "#94A3B8" }}>Loading scores...</div>
          ) : records.length === 0 ? (
            <div style={{ textAlign: "center", padding: 30, color: "#94A3B8", fontSize: 14 }}>
              {t("leaderboard.empty")}
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }}>
              <thead>
                <tr style={{ color: "#94A3B8", fontSize: 12, textAlign: "left" }}>
                  <th style={{ padding: "8px 6px" }}>{t("leaderboard.rank")}</th>
                  <th style={{ padding: "8px 6px" }}>{t("leaderboard.player")}</th>
                  <th style={{ padding: "8px 6px", textAlign: "right" }}>{t("leaderboard.score")}</th>
                  <th style={{ padding: "8px 6px", textAlign: "right" }}>{t("leaderboard.maxCombo")}</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr
                    key={r.id || i}
                    style={{
                      borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                      fontSize: 14,
                      fontWeight: 700,
                    }}
                  >
                    <td style={{ padding: "10px 6px" }}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                    </td>
                    <td style={{ padding: "10px 6px", color: "#F1F5F9" }}>
                      {r.nickname || "Anonymous Jumper"}
                    </td>
                    <td style={{ padding: "10px 6px", textAlign: "right", color: "#FFD200" }}>
                      {r.score.toLocaleString()}
                    </td>
                    <td style={{ padding: "10px 6px", textAlign: "right", color: "#EF4444" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                        <Flame size={13} /> {r.maxCombo}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ marginTop: 16, textAlign: "right" }}>
          <Button variant="dark" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
