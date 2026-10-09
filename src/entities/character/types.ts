export type CharacterRole = "turner" | "jumper";

export interface CharacterItem {
  id: string;
  name: string;
  role: CharacterRole;
  description: string;
  themeColor: string;
  hairColor: string;
  outfitColor: string;
  avatarUrl?: string; // base64 or generated data url
  isCustom?: boolean;
}

export interface SelectedCharacters {
  leftTurnerId: string;
  rightTurnerId: string;
  jumperId: string;
}
