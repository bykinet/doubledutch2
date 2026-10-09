import Phaser from "phaser";
import { DEFAULT_TURNERS, DEFAULT_JUMPERS, getCustomCharacters } from "@/entities/character/characterRoster";
import { CharacterItem } from "@/entities/character/types";

export const FRAME_W = 120;
export const FRAME_H = 160;

/**
 * Draws a cel-shaded anime face & hair based on character configuration
 */
function drawAnimeHead(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  char: CharacterItem,
  hairLift: number = 0,
  expression: "happy" | "focused" | "excited" = "excited"
) {
  ctx.save();

  // 1. Anime Hair (Back layer for long hair/twin-tails/ponytails)
  ctx.fillStyle = char.hairColor;
  ctx.strokeStyle = "#1A1A24";
  ctx.lineWidth = 2.5;

  if (char.id === "turner_aoi" || char.id === "jumper_yuna" || char.id === "jumper_mei") {
    // Twin tails / Pigtails
    // Left tail
    ctx.beginPath();
    ctx.moveTo(cx - 22, cy - 2);
    ctx.quadraticCurveTo(cx - 44, cy + 10 + hairLift, cx - 36, cy + 34 + hairLift);
    ctx.quadraticCurveTo(cx - 26, cy + 16, cx - 18, cy + 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Right tail
    ctx.beginPath();
    ctx.moveTo(cx + 22, cy - 2);
    ctx.quadraticCurveTo(cx + 44, cy + 10 + hairLift, cx + 36, cy + 34 + hairLift);
    ctx.quadraticCurveTo(cx + 26, cy + 16, cx + 18, cy + 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (char.id === "turner_sakura" || char.id === "jumper_riko" || char.id === "jumper_chloe") {
    // High ponytail
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy - 18);
    ctx.quadraticCurveTo(cx - 28, cy - 36 + hairLift, cx - 22, cy + 8 + hairLift);
    ctx.quadraticCurveTo(cx - 14, cy - 10, cx - 4, cy - 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // 2. Face & Chin
  ctx.fillStyle = "#FFEDD5"; // warm anime skin tone
  ctx.beginPath();
  ctx.moveTo(cx - 18, cy - 12);
  ctx.lineTo(cx + 18, cy - 12);
  ctx.quadraticCurveTo(cx + 20, cy + 10, cx + 8, cy + 22);
  ctx.lineTo(cx, cy + 26); // pointed anime chin
  ctx.lineTo(cx - 8, cy + 22);
  ctx.quadraticCurveTo(cx - 20, cy + 10, cx - 18, cy - 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Cheerful Blush
  ctx.fillStyle = "rgba(244, 63, 94, 0.35)";
  ctx.beginPath();
  ctx.ellipse(cx - 12, cy + 12, 5, 2.5, 0, 0, Math.PI * 2);
  ctx.ellipse(cx + 12, cy + 12, 5, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // 3. Anime Eyes (Big and expressive with highlights)
  const eyeY = cy + 4;
  [-9, 9].forEach((ex) => {
    // White sclera
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.ellipse(cx + ex, eyeY, 5, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Iris (Theme matching)
    ctx.fillStyle = char.themeColor;
    ctx.beginPath();
    ctx.ellipse(cx + ex, eyeY + 1, 3.5, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pupil
    ctx.fillStyle = "#0F172A";
    ctx.beginPath();
    ctx.arc(cx + ex, eyeY + 1, 2, 0, Math.PI * 2);
    ctx.fill();

    // Eye highlight
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(cx + ex - 1, eyeY - 2, 1.4, 0, Math.PI * 2);
    ctx.arc(cx + ex + 1.2, eyeY + 2, 0.9, 0, Math.PI * 2);
    ctx.fill();

    // Eyelash line
    ctx.strokeStyle = "#1A1A24";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(cx + ex, eyeY - 4, 5, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
  });

  // Smile
  ctx.strokeStyle = "#BE123C";
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  if (expression === "happy") {
    ctx.arc(cx, eyeY + 12, 5, 0.1, Math.PI - 0.1);
  } else {
    ctx.arc(cx, eyeY + 11, 4, 0.2, Math.PI - 0.2);
  }
  ctx.stroke();

  // 4. Front Hair (Bangs & style)
  ctx.fillStyle = char.hairColor;
  ctx.strokeStyle = "#1A1A24";
  ctx.lineWidth = 2.5;

  if (char.id === "jumper_kenji" || char.id === "turner_daiki") {
    // Headband with spiky hair
    ctx.beginPath();
    ctx.moveTo(cx - 20, cy - 8);
    ctx.lineTo(cx - 24, cy - 28);
    ctx.lineTo(cx - 12, cy - 22);
    ctx.lineTo(cx - 4, cy - 34);
    ctx.lineTo(cx + 6, cy - 22);
    ctx.lineTo(cx + 18, cy - 30);
    ctx.lineTo(cx + 20, cy - 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Headband ribbon
    ctx.fillStyle = char.id === "jumper_kenji" ? "#DC2626" : "#EAB308";
    ctx.fillRect(cx - 20, cy - 14, 40, 7);
    ctx.strokeRect(cx - 20, cy - 14, 40, 7);
  } else if (char.id === "jumper_sora") {
    // Parkour Snapback Cap
    ctx.fillStyle = "#0284C7";
    ctx.beginPath();
    ctx.arc(cx, cy - 12, 19, Math.PI, 0);
    ctx.fill();
    ctx.stroke();
    // Cap brim
    ctx.fillStyle = "#0369A1";
    ctx.beginPath();
    ctx.ellipse(cx, cy - 10, 22, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    // Spiky / Layered Anime Bangs
    ctx.beginPath();
    ctx.moveTo(cx - 22, cy - 4);
    ctx.quadraticCurveTo(cx - 24, cy - 28 + hairLift, cx, cy - 28 + hairLift);
    ctx.quadraticCurveTo(cx + 24, cy - 28 + hairLift, cx + 22, cy - 4);
    // Bang spikes
    ctx.lineTo(cx + 14, cy - 2);
    ctx.lineTo(cx + 10, cy + 4);
    ctx.lineTo(cx + 4, cy - 4);
    ctx.lineTo(cx - 2, cy + 6);
    ctx.lineTo(cx - 8, cy - 2);
    ctx.lineTo(cx - 16, cy + 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Creates an 8-frame jump cycle spritesheet for a jumper.
 * Crucial fix: The character is fully contained within the 120x160 frame (NO clipping of head).
 */
export function createJumperSheet(char: CharacterItem): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = FRAME_W * 8;
  canvas.height = FRAME_H;
  const ctx = canvas.getContext("2d")!;

  // Poses for 8 frames:
  // 0: Crouch prep
  // 1: Launch push
  // 2: Ascending
  // 3: Rising tuck
  // 4: Apex peak tuck
  // 5: Descending tuck
  // 6: Legs extending
  // 7: Landing cushion
  const legBends = [14, 4, 8, 16, 22, 16, 6, 12];
  const armOffsets = [-4, -14, -20, -16, -10, -4, 4, -2];
  const bodyYOffsets = [12, 4, 0, -4, -6, -2, 4, 10]; // Small internal frame bounce, main jump motion in scene!

  for (let f = 0; f < 8; f++) {
    const ox = f * FRAME_W;
    const cx = ox + FRAME_W / 2;
    const by = 88 + bodyYOffsets[f];
    const bend = legBends[f];
    const armOff = armOffsets[f];

    ctx.save();

    // 1. Legs & Sneakers
    ctx.strokeStyle = "#1A1A24";
    ctx.lineWidth = 3.0;
    ctx.lineCap = "round";

    // Left leg
    ctx.fillStyle = char.themeColor;
    ctx.beginPath();
    ctx.moveTo(cx - 10, by + 24);
    ctx.lineTo(cx - 14 - bend * 0.4, by + 46);
    ctx.lineTo(cx - 12 - bend * 0.4, by + 56 - bend * 0.6);
    ctx.lineTo(cx - 2, by + 24);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Left Sneaker
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.roundRect(cx - 18 - bend * 0.4, by + 53 - bend * 0.6, 16, 8, 3);
    ctx.fill();
    ctx.stroke();

    // Right leg
    ctx.beginPath();
    ctx.moveTo(cx + 2, by + 24);
    ctx.lineTo(cx + 14 + bend * 0.4, by + 46);
    ctx.lineTo(cx + 12 + bend * 0.4, by + 56 - bend * 0.6);
    ctx.lineTo(cx + 10, by + 24);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Right Sneaker
    ctx.beginPath();
    ctx.roundRect(cx + 4 + bend * 0.4, by + 53 - bend * 0.6, 16, 8, 3);
    ctx.fill();
    ctx.stroke();

    // 2. Torso / Sportswear Outfit (Hoodie / Jersey)
    ctx.fillStyle = char.outfitColor;
    ctx.beginPath();
    ctx.roundRect(cx - 18, by - 6, 36, 32, 7);
    ctx.fill();
    ctx.stroke();

    // Outfit accent stripes / logo
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(cx, by + 10, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = char.themeColor;
    ctx.font = "bold 9px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${f + 1}`, cx, by + 10);

    // 3. Arms (Rhythmic pumping with jump)
    ctx.strokeStyle = "#FFEDD5";
    ctx.lineWidth = 6.0;
    // Left arm
    ctx.beginPath();
    ctx.moveTo(cx - 16, by);
    ctx.lineTo(cx - 28, by + 12 + armOff);
    ctx.stroke();
    ctx.strokeStyle = "#1A1A24";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Right arm
    ctx.strokeStyle = "#FFEDD5";
    ctx.lineWidth = 6.0;
    ctx.beginPath();
    ctx.moveTo(cx + 16, by);
    ctx.lineTo(cx + 28, by + 12 - armOff);
    ctx.stroke();
    ctx.strokeStyle = "#1A1A24";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 4. Head & Face (positioned at cy = by - 36, safely in canvas)
    drawAnimeHead(ctx, cx, by - 36, char, f === 4 ? -4 : 0, f === 4 ? "excited" : "happy");

    ctx.restore();
  }

  return canvas;
}

/**
 * Creates a high-fidelity cel-shaded Turner torso & body texture
 */
export function createTurnerTexture(char: CharacterItem): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = FRAME_W;
  canvas.height = FRAME_H;
  const ctx = canvas.getContext("2d")!;

  const cx = FRAME_W / 2;
  const by = 88;

  ctx.save();

  // 1. Athletic Legs & Stance
  ctx.strokeStyle = "#1A1A24";
  ctx.lineWidth = 3.0;
  ctx.lineCap = "round";

  // Left leg
  ctx.fillStyle = "#1E293B";
  ctx.beginPath();
  ctx.moveTo(cx - 12, by + 24);
  ctx.lineTo(cx - 22, by + 58);
  ctx.lineTo(cx - 4, by + 24);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Left Sneaker
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.roundRect(cx - 28, by + 55, 18, 9, 3);
  ctx.fill();
  ctx.stroke();

  // Right leg
  ctx.beginPath();
  ctx.moveTo(cx + 4, by + 24);
  ctx.lineTo(cx + 16, by + 58);
  ctx.lineTo(cx + 12, by + 24);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right Sneaker
  ctx.beginPath();
  ctx.roundRect(cx + 10, by + 55, 18, 9, 3);
  ctx.fill();
  ctx.stroke();

  // 2. Torso / Sporty Uniform
  ctx.fillStyle = char.outfitColor;
  ctx.beginPath();
  ctx.roundRect(cx - 20, by - 8, 40, 36, 7);
  ctx.fill();
  ctx.stroke();

  // Sports Number / Emblem
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 13px 'Trebuchet MS', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("DD", cx, by + 10);

  // 3. Head & Face
  drawAnimeHead(ctx, cx, by - 36, char, 0, "focused");

  ctx.restore();

  return canvas;
}

/**
 * Creates avatar preview data URL for sidebar UI
 */
export function createAvatarPreview(char: CharacterItem): string {
  const canvas = document.createElement("canvas");
  canvas.width = 80;
  canvas.height = 80;
  const ctx = canvas.getContext("2d")!;

  // Background radial glow
  const grad = ctx.createRadialGradient(40, 40, 10, 40, 40, 40);
  grad.addColorStop(0, char.themeColor);
  grad.addColorStop(1, "#0F172A");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 80, 80);

  // Draw head close-up
  drawAnimeHead(ctx, 40, 48, char, 0, "happy");

  return canvas.toDataURL("image/png");
}

/**
 * Preloads and registers all 14 character textures into Phaser
 */
export function registerAllCharacterTextures(textures: any) {
  // 1. Turners
  DEFAULT_TURNERS.forEach((turner) => {
    const canvas = createTurnerTexture(turner);
    textures.addImage(`texture_${turner.id}`, canvas);
  });

  // 2. Jumpers
  DEFAULT_JUMPERS.forEach((jumper) => {
    const sheetCanvas = createJumperSheet(jumper);
    textures.addSpriteSheet(`sheet_${jumper.id}`, sheetCanvas, {
      frameWidth: FRAME_W,
      frameHeight: FRAME_H,
    });
  });

  // 3. Custom characters from localStorage
  const custom = getCustomCharacters();
  custom.forEach((c) => {
    if (c.avatarUrl && c.avatarUrl.startsWith("data:image")) {
      const img = new Image();
      img.src = c.avatarUrl;
      img.onload = () => {
        if (c.role === "turner") {
          textures.addImage(`texture_${c.id}`, img);
        } else {
          // For custom jumper, register as single frame image or replicated sheet
          textures.addImage(`texture_${c.id}`, img);
          // Also create a 1-frame or repeated sprite sheet so Phaser won't error
          textures.addSpriteSheet(`sheet_${c.id}`, img, {
            frameWidth: img.width,
            frameHeight: img.height,
          });
        }
      };
    }
  });
}
