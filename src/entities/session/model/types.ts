import { GameDifficulty, GameSpeed } from "@/game/logic/types";

export interface GameSessionRecord {
  id?: string;
  uid: string | null; // null if anonymized after account deletion
  nickname?: string; // used for leaderboard display
  managementId?: string; // stored by function/server for statistics
  duration: number; // 30, 60, 90, 120, 150, 180
  speed: GameSpeed; // 1-5
  difficulty: GameDifficulty; // 1-3
  maxJumpers: number;
  score: number;
  maxCombo: number;
  perfects: number;
  goods: number;
  misses: number;
  entered: number;
  tripped: number;
  startedAt: number;
  endedAt: number;
  completed: boolean;
}
