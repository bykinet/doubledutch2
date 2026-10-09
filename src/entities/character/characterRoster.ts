import { CharacterItem, CharacterRole, SelectedCharacters } from "./types";

export const DEFAULT_TURNERS: CharacterItem[] = [
  {
    id: "turner_ren",
    name: "렌 (Ren)",
    role: "turner",
    description: "차분하고 정밀한 줄회전의 스포티 블루 리더",
    themeColor: "#2563EB",
    hairColor: "#1D4ED8",
    outfitColor: "#3B82F6",
  },
  {
    id: "turner_aoi",
    name: "아오이 (Aoi)",
    role: "turner",
    description: "생기발랄한 에너지를 지닌 트윈테일 스피드 터너",
    themeColor: "#EC4899",
    hairColor: "#D946EF",
    outfitColor: "#F43F5E",
  },
  {
    id: "turner_daiki",
    name: "다이키 (Daiki)",
    role: "turner",
    description: "강력하고 안정적인 리듬감의 골드&블랙 파워 터너",
    themeColor: "#EAB308",
    hairColor: "#1E293B",
    outfitColor: "#CA8A04",
  },
  {
    id: "turner_sakura",
    name: "사쿠라 (Sakura)",
    role: "turner",
    description: "정확한 밸런스와 박자 감각의 민트 그린 테니스 에이스",
    themeColor: "#10B981",
    hairColor: "#059669",
    outfitColor: "#34D399",
  },
];

export const DEFAULT_JUMPERS: CharacterItem[] = [
  {
    id: "jumper_haruto",
    name: "하루토 (Haruto)",
    role: "jumper",
    description: "클래식 오렌지 후드를 입은 정통파 만능 점퍼",
    themeColor: "#F97316",
    hairColor: "#6B21A8",
    outfitColor: "#EA580C",
  },
  {
    id: "jumper_yuna",
    name: "유나 (Yuna)",
    role: "jumper",
    description: "화려한 체공 시간과 가벼운 스텝의 아이돌 점퍼",
    themeColor: "#8B5CF6",
    hairColor: "#EC4899",
    outfitColor: "#7C3AED",
  },
  {
    id: "jumper_kenji",
    name: "켄지 (Kenji)",
    role: "jumper",
    description: "붉은 헤드밴드를 휘날리는 광속 스피드 스프린터",
    themeColor: "#DC2626",
    hairColor: "#18181B",
    outfitColor: "#EF4444",
  },
  {
    id: "jumper_chloe",
    name: "클로이 (Chloe)",
    role: "jumper",
    description: "리듬을 타며 춤추듯 도약하는 금발 스트리트 댄서",
    themeColor: "#06B6D4",
    hairColor: "#FACC15",
    outfitColor: "#0891B2",
  },
  {
    id: "jumper_jin",
    name: "진 (Jin)",
    role: "jumper",
    description: "네온 바이저와 공중제비를 자유자재로 구사하는 사이버 아크로뱃",
    themeColor: "#14B8A6",
    hairColor: "#E2E8F0",
    outfitColor: "#0D9488",
  },
  {
    id: "jumper_mei",
    name: "메이 (Mei)",
    role: "jumper",
    description: "귀여운 고양이귀 후드와 퐁퐁 솟는 탄력의 활력소",
    themeColor: "#F59E0B",
    hairColor: "#78350F",
    outfitColor: "#FBBF24",
  },
  {
    id: "jumper_leo",
    name: "레오 (Leo)",
    role: "jumper",
    description: "높은 덩크슛 도약력을 자랑하는 코발트 농구 에이스",
    themeColor: "#3B82F6",
    hairColor: "#1E293B",
    outfitColor: "#1D4ED8",
  },
  {
    id: "jumper_hana",
    name: "하나 (Hana)",
    role: "jumper",
    description: "민트 비니와 가벼운 발놀림으로 착지하는 체조 유망주",
    themeColor: "#84CC16",
    hairColor: "#FB7185",
    outfitColor: "#65A30D",
  },
  {
    id: "jumper_sora",
    name: "소라 (Sora)",
    role: "jumper",
    description: "스카이블루 스냅백을 쓴 자유분방한 파쿠르 러너",
    themeColor: "#0284C7",
    hairColor: "#64748B",
    outfitColor: "#38BDF8",
  },
  {
    id: "jumper_riko",
    name: "리코 (Riko)",
    role: "jumper",
    description: "단련된 집중력과 완벽한 타이밍의 마룬 트랙 가드",
    themeColor: "#9F1239",
    hairColor: "#0F172A",
    outfitColor: "#BE123C",
  },
];

import { saveUserCharactersToFirestore, loadUserCharactersFromFirestore } from "./api/characterApi";

export const MAX_CUSTOM_JUMPERS = 4;
export const MAX_CUSTOM_TURNERS = 2;
export const TOTAL_JUMPERS_COUNT = 10;
export const TOTAL_TURNERS_COUNT = 4;

const CUSTOM_CHARACTERS_KEY = "dd_custom_characters_v1";
const SELECTED_CHARACTERS_KEY = "dd_selected_characters_v1";

export function getCustomCharacters(): CharacterItem[] {
  try {
    const raw = localStorage.getItem(CUSTOM_CHARACTERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to read custom characters from localStorage", e);
    return [];
  }
}

export function canAddCustomCharacter(role: CharacterRole): {
  allowed: boolean;
  currentCount: number;
  maxCount: number;
} {
  const current = getCustomCharacters().filter((c) => c.role === role);
  const maxCount = role === "turner" ? MAX_CUSTOM_TURNERS : MAX_CUSTOM_JUMPERS;
  return {
    allowed: current.length < maxCount,
    currentCount: current.length,
    maxCount,
  };
}

export async function saveCustomCharacter(
  char: CharacterItem,
  uid?: string | null
): Promise<CharacterItem[]> {
  const current = getCustomCharacters();
  const maxCount = char.role === "turner" ? MAX_CUSTOM_TURNERS : MAX_CUSTOM_JUMPERS;
  const sameRoleList = current.filter((c) => c.role === char.role);

  if (sameRoleList.length >= maxCount && !current.some((c) => c.id === char.id)) {
    throw new Error(
      `${char.role === "turner" ? "줄잡이는 최대 2개" : "점퍼는 최대 4개"}까지만 등록할 수 있습니다.`
    );
  }

  const updated = [char, ...current.filter((c) => c.id !== char.id)];
  try {
    localStorage.setItem(CUSTOM_CHARACTERS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save custom character to localStorage", e);
  }

  // Firestore sync if user is logged in
  if (uid) {
    saveUserCharactersToFirestore(uid, updated).catch((err) =>
      console.error("Firestore character sync error:", err)
    );
  }

  return updated;
}

export async function deleteCustomCharacter(
  id: string,
  uid?: string | null
): Promise<CharacterItem[]> {
  const current = getCustomCharacters();
  const updated = current.filter((c) => c.id !== id);
  try {
    localStorage.setItem(CUSTOM_CHARACTERS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to delete custom character", e);
  }

  // Firestore sync if user is logged in
  if (uid) {
    saveUserCharactersToFirestore(uid, updated).catch((err) =>
      console.error("Firestore character sync error:", err)
    );
  }

  return updated;
}

/**
 * Sync custom characters from Firestore when user logs in
 */
export async function syncCharactersWithFirestore(uid: string): Promise<CharacterItem[]> {
  if (!uid) return getCustomCharacters();
  try {
    const remote = await loadUserCharactersFromFirestore(uid);
    if (remote && remote.length > 0) {
      localStorage.setItem(CUSTOM_CHARACTERS_KEY, JSON.stringify(remote));
      return remote;
    }
  } catch (e) {
    console.error("Failed to sync characters with Firestore:", e);
  }
  return getCustomCharacters();
}

/**
 * Returns exactly TOTAL_TURNERS_COUNT (4) Turners:
 * Custom turners replace default turners from the tail of the list.
 */
export function getAllTurners(): CharacterItem[] {
  const custom = getCustomCharacters()
    .filter((c) => c.role === "turner")
    .slice(0, MAX_CUSTOM_TURNERS);

  const customCount = custom.length;
  // Keep (4 - customCount) default turners so total is always strictly 4!
  const defaultToKeep = DEFAULT_TURNERS.slice(0, TOTAL_TURNERS_COUNT - customCount);

  return [...custom, ...defaultToKeep];
}

/**
 * Returns exactly TOTAL_JUMPERS_COUNT (10) Jumpers:
 * Custom jumpers replace default jumpers from the tail of the list.
 */
export function getAllJumpers(): CharacterItem[] {
  const custom = getCustomCharacters()
    .filter((c) => c.role === "jumper")
    .slice(0, MAX_CUSTOM_JUMPERS);

  const customCount = custom.length;
  // Keep (10 - customCount) default jumpers so total is always strictly 10!
  const defaultToKeep = DEFAULT_JUMPERS.slice(0, TOTAL_JUMPERS_COUNT - customCount);

  return [...custom, ...defaultToKeep];
}

export function getSelectedCharacters(): SelectedCharacters {
  try {
    const raw = localStorage.getItem(SELECTED_CHARACTERS_KEY);
    if (raw) {
      const parsed: SelectedCharacters = JSON.parse(raw);
      // Validate that selected IDs are still available in current roster
      const availableTurners = getAllTurners().map((t) => t.id);
      const availableJumpers = getAllJumpers().map((j) => j.id);

      return {
        leftTurnerId: availableTurners.includes(parsed.leftTurnerId)
          ? parsed.leftTurnerId
          : availableTurners[0] || "turner_ren",
        rightTurnerId: availableTurners.includes(parsed.rightTurnerId)
          ? parsed.rightTurnerId
          : availableTurners[1] || "turner_aoi",
        jumperId: availableJumpers.includes(parsed.jumperId)
          ? parsed.jumperId
          : availableJumpers[0] || "jumper_haruto",
      };
    }
  } catch (e) {
    console.error(e);
  }
  return {
    leftTurnerId: "turner_ren",
    rightTurnerId: "turner_aoi",
    jumperId: "jumper_haruto",
  };
}

export function saveSelectedCharacters(selection: SelectedCharacters) {
  try {
    localStorage.setItem(SELECTED_CHARACTERS_KEY, JSON.stringify(selection));
  } catch (e) {
    console.error("Failed to save selected characters", e);
  }
}
