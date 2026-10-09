import Phaser from "phaser";
import { registerAllCharacterTextures } from "@/game/graphics/characterTextures";
import { DEFAULT_JUMPERS } from "@/entities/character/characterRoster";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    // 1. Generate and register all 14 cel-shaded character textures & sheets (4 Turners + 10 Jumpers)
    registerAllCharacterTextures(this.textures);

    // 2. Fallback legacy textures for backward compatibility
    this.createTurnerSpritesheet();
    this.createJumperSpritesheet();
    this.createCourtBackgroundTexture();

    // 3. Load anime background and illustrations
    this.load.image("court_bg_anime", "/assets/images/anime_court_bg.jpg");
    this.load.image("turner_left_anime", "/assets/images/turner_left.png");
    this.load.image("turner_right_anime", "/assets/images/turner_right.png");
    this.load.image("jumper_char_anime", "/assets/images/jumper_char.png");
    this.load.image("game_logo_anime", "/assets/images/game_logo.png");
  }

  create() {
    // Register animations for all jumpers
    DEFAULT_JUMPERS.forEach((jumper) => {
      if (this.textures.exists(`sheet_${jumper.id}`)) {
        this.anims.create({
          key: `anim_${jumper.id}`,
          frames: this.anims.generateFrameNumbers(`sheet_${jumper.id}`, { start: 0, end: 7 }),
          frameRate: 12,
          repeat: -1,
        });
      }
    });

    // Register animations
    this.anims.create({
      key: "turner_turn",
      frames: this.anims.generateFrameNumbers("turner_sheet", { start: 0, end: 7 }),
      frameRate: 8,
      repeat: -1,
    });

    this.anims.create({
      key: "jumper_jump_anim",
      frames: this.anims.generateFrameNumbers("jumper_jump_sheet", { start: 0, end: 7 }),
      frameRate: 12,
      repeat: -1,
    });

    this.anims.create({
      key: "jumper_enter_anim",
      frames: this.anims.generateFrameNumbers("jumper_enter_sheet", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: 0,
    });

    this.anims.create({
      key: "jumper_exit_anim",
      frames: this.anims.generateFrameNumbers("jumper_exit_sheet", { start: 0, end: 2 }),
      frameRate: 10,
      repeat: 0,
    });

    this.anims.create({
      key: "jumper_trip_anim",
      frames: this.anims.generateFrameNumbers("jumper_trip_sheet", { start: 0, end: 3 }),
      frameRate: 8,
      repeat: 0,
    });

    this.scene.start("GameScene");
  }

  // --- Procedural Sprite Sheet Generators (Cel-Shaded Anime Style) ---

  private createTurnerSpritesheet() {
    const frameW = 72;
    const frameH = 100;
    const canvas = document.createElement("canvas");
    canvas.width = frameW * 8;
    canvas.height = frameH;
    const ctx = canvas.getContext("2d")!;

    for (let f = 0; f < 8; f++) {
      const ox = f * frameW;
      const angleDeg = f * 45;
      const armRad = (angleDeg * Math.PI) / 180;

      ctx.save();
      ctx.translate(ox, 0);

      // Shadow on floor
      ctx.fillStyle = "rgba(18, 24, 38, 0.28)";
      ctx.beginPath();
      ctx.ellipse(36, 92, 22, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Legs (athletic stance)
      ctx.strokeStyle = "#1A1A24";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";

      // Left leg & sneaker
      ctx.fillStyle = "#2D3748";
      ctx.beginPath();
      ctx.moveTo(30, 60);
      ctx.lineTo(24, 88);
      ctx.lineTo(16, 90);
      ctx.lineTo(24, 92);
      ctx.lineTo(34, 60);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Right leg & sneaker
      ctx.beginPath();
      ctx.moveTo(38, 60);
      ctx.lineTo(46, 88);
      ctx.lineTo(54, 90);
      ctx.lineTo(46, 92);
      ctx.lineTo(36, 60);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Torso / Jersey (Anime cyan / dark navy)
      ctx.fillStyle = "#3182CE";
      ctx.beginPath();
      ctx.roundRect(24, 36, 24, 26, 4);
      ctx.fill();
      ctx.stroke();

      // White jersey side-stripe
      ctx.fillStyle = "#EBF8FF";
      ctx.fillRect(26, 36, 4, 26);

      // Head / Face (Anime peach with cel shade)
      ctx.fillStyle = "#FEEBC8";
      ctx.beginPath();
      ctx.arc(36, 24, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Anime Eye
      ctx.fillStyle = "#1A202C";
      ctx.beginPath();
      ctx.arc(41, 23, 2, 0, Math.PI * 2);
      ctx.fill();

      // Anime Hair (Spiky / stylish tufts)
      ctx.fillStyle = "#2B6CB0";
      ctx.beginPath();
      ctx.moveTo(22, 22);
      ctx.quadraticCurveTo(28, 8, 38, 10);
      ctx.quadraticCurveTo(46, 12, 50, 20);
      ctx.lineTo(44, 24);
      ctx.lineTo(36, 14);
      ctx.lineTo(28, 24);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Rotating arm holding rope handle
      const shoulderX = 36;
      const shoulderY = 42;
      const armLength = 22;
      const handX = shoulderX + Math.cos(armRad) * armLength;
      const handY = shoulderY + Math.sin(armRad) * armLength;

      // Arm limb
      ctx.strokeStyle = "#FEEBC8";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(shoulderX, shoulderY);
      ctx.lineTo(handX, handY);
      ctx.stroke();

      ctx.strokeStyle = "#1A1A24";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(shoulderX, shoulderY);
      ctx.lineTo(handX, handY);
      ctx.stroke();

      // Hand / Rope handle
      ctx.fillStyle = "#ED8936";
      ctx.beginPath();
      ctx.arc(handX, handY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }

    this.textures.addSpriteSheet("turner_sheet", canvas, {
      frameWidth: frameW,
      frameHeight: frameH,
    });
  }

  private createJumperSpritesheet() {
    const frameW = 64;
    const frameH = 100;

    // --- 1. Jump 8 frames ---
    const jumpCanvas = document.createElement("canvas");
    jumpCanvas.width = frameW * 8;
    jumpCanvas.height = frameH;
    const jumpCtx = jumpCanvas.getContext("2d")!;

    // Jump height curves: Frame 4 is Apex (~52px off ground)
    const yOffsets = [2, -10, -26, -42, -54, -40, -18, 0];
    const legSpreads = [10, 6, 8, 12, 16, 12, 8, 10];

    for (let f = 0; f < 8; f++) {
      const ox = f * frameW;
      const dy = yOffsets[f];
      const spread = legSpreads[f];

      jumpCtx.save();
      jumpCtx.translate(ox, dy);

      // Floor shadow (shrinks as jumper ascends)
      const shadowScale = Math.max(0.3, 1 - Math.abs(dy) / 60);
      jumpCtx.fillStyle = `rgba(18, 24, 38, ${0.3 * shadowScale})`;
      jumpCtx.beginPath();
      jumpCtx.ellipse(32, 92 - dy, 18 * shadowScale, 5 * shadowScale, 0, 0, Math.PI * 2);
      jumpCtx.fill();

      // Sneakers & Legs
      jumpCtx.strokeStyle = "#1A1A24";
      jumpCtx.lineWidth = 2.5;
      jumpCtx.lineCap = "round";

      // Left leg
      jumpCtx.fillStyle = "#E53E3E";
      jumpCtx.beginPath();
      jumpCtx.moveTo(26, 62);
      jumpCtx.lineTo(32 - spread, 84);
      jumpCtx.lineTo(26 - spread, 87);
      jumpCtx.lineTo(34 - spread, 87);
      jumpCtx.lineTo(28, 62);
      jumpCtx.closePath();
      jumpCtx.fill();
      jumpCtx.stroke();

      // Right leg
      jumpCtx.beginPath();
      jumpCtx.moveTo(36, 62);
      jumpCtx.lineTo(32 + spread, 84);
      jumpCtx.lineTo(40 + spread, 87);
      jumpCtx.lineTo(32 + spread, 87);
      jumpCtx.lineTo(38, 62);
      jumpCtx.closePath();
      jumpCtx.fill();
      jumpCtx.stroke();

      // Torso / Sport Hoodie (Bright Orange/Coral with cel shade)
      jumpCtx.fillStyle = "#DD6B20";
      jumpCtx.beginPath();
      jumpCtx.roundRect(20, 38, 24, 25, 5);
      jumpCtx.fill();
      jumpCtx.stroke();

      // Center logo / badge
      jumpCtx.fillStyle = "#FFFAF0";
      jumpCtx.beginPath();
      jumpCtx.arc(32, 49, 4, 0, Math.PI * 2);
      jumpCtx.fill();

      // Arms (Pumping in rhythm)
      const armAngle = (f % 2 === 0 ? 1 : -1) * 0.4;
      jumpCtx.strokeStyle = "#FEEBC8";
      jumpCtx.lineWidth = 5;
      jumpCtx.beginPath();
      jumpCtx.moveTo(22, 42);
      jumpCtx.lineTo(14, 48 + armAngle * 10);
      jumpCtx.moveTo(42, 42);
      jumpCtx.lineTo(50, 48 - armAngle * 10);
      jumpCtx.stroke();

      jumpCtx.strokeStyle = "#1A1A24";
      jumpCtx.lineWidth = 2.5;
      jumpCtx.stroke();

      // Head & Anime Face
      jumpCtx.fillStyle = "#FEEBC8";
      jumpCtx.beginPath();
      jumpCtx.arc(32, 25, 11, 0, Math.PI * 2);
      jumpCtx.fill();
      jumpCtx.stroke();

      // Cheerful Eyes
      jumpCtx.fillStyle = "#1A202C";
      jumpCtx.beginPath();
      jumpCtx.arc(29, 24, 1.8, 0, Math.PI * 2);
      jumpCtx.arc(35, 24, 1.8, 0, Math.PI * 2);
      jumpCtx.fill();

      // Cute Smile
      jumpCtx.strokeStyle = "#C53030";
      jumpCtx.lineWidth = 1.8;
      jumpCtx.beginPath();
      jumpCtx.arc(32, 27, 3, 0.1, Math.PI - 0.1);
      jumpCtx.stroke();

      // Hair (Flowing / animated upward at peak)
      jumpCtx.fillStyle = "#805AD5";
      const hairLift = f === 4 ? -4 : 0;
      jumpCtx.beginPath();
      jumpCtx.moveTo(20, 24 + hairLift);
      jumpCtx.quadraticCurveTo(24, 8 + hairLift, 32, 10 + hairLift);
      jumpCtx.quadraticCurveTo(40, 8 + hairLift, 44, 24 + hairLift);
      jumpCtx.lineTo(32, 16 + hairLift);
      jumpCtx.closePath();
      jumpCtx.fill();
      jumpCtx.stroke();

      // Sports Headband
      jumpCtx.fillStyle = "#38A169";
      jumpCtx.fillRect(22, 17 + hairLift, 20, 4);

      jumpCtx.restore();
    }

    this.textures.addSpriteSheet("jumper_jump_sheet", jumpCanvas, {
      frameWidth: frameW,
      frameHeight: frameH,
    });

    // --- 2. Enter 4 frames ---
    const enterCanvas = document.createElement("canvas");
    enterCanvas.width = frameW * 4;
    enterCanvas.height = frameH;
    const enterCtx = enterCanvas.getContext("2d")!;
    for (let f = 0; f < 4; f++) {
      enterCtx.save();
      enterCtx.translate(f * frameW, 0);
      enterCtx.drawImage(jumpCanvas, f * frameW, 0, frameW, frameH, 0, 0, frameW, frameH);
      enterCtx.restore();
    }
    this.textures.addSpriteSheet("jumper_enter_sheet", enterCanvas, {
      frameWidth: frameW,
      frameHeight: frameH,
    });

    // --- 3. Exit 3 frames ---
    const exitCanvas = document.createElement("canvas");
    exitCanvas.width = frameW * 3;
    exitCanvas.height = frameH;
    const exitCtx = exitCanvas.getContext("2d")!;
    for (let f = 0; f < 3; f++) {
      exitCtx.save();
      exitCtx.translate(f * frameW, 0);
      exitCtx.drawImage(jumpCanvas, (7 - f) * frameW, 0, frameW, frameH, 0, 0, frameW, frameH);
      exitCtx.restore();
    }
    this.textures.addSpriteSheet("jumper_exit_sheet", exitCanvas, {
      frameWidth: frameW,
      frameHeight: frameH,
    });

    // --- 4. Trip 4 frames ---
    const tripCanvas = document.createElement("canvas");
    tripCanvas.width = frameW * 4;
    tripCanvas.height = frameH;
    const tripCtx = tripCanvas.getContext("2d")!;
    for (let f = 0; f < 4; f++) {
      tripCtx.save();
      tripCtx.translate(f * frameW, 0);
      // Stumble rotation
      tripCtx.translate(32, 50);
      tripCtx.rotate((f % 2 === 0 ? 0.2 : -0.2) * (f + 1));
      tripCtx.translate(-32, -50);
      tripCtx.drawImage(jumpCanvas, 0, 0, frameW, frameH, 0, 0, frameW, frameH);

      // Sweat drops (Anime exclamation)
      tripCtx.fillStyle = "#63B3ED";
      tripCtx.beginPath();
      tripCtx.arc(46, 16, 4, 0, Math.PI * 2);
      tripCtx.fill();
      tripCtx.restore();
    }
    this.textures.addSpriteSheet("jumper_trip_sheet", tripCanvas, {
      frameWidth: frameW,
      frameHeight: frameH,
    });
  }

  private createCourtBackgroundTexture() {
    const w = 960;
    const h = 540;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;

    // 1. Anime Sky & Gym Upper Horizon
    const gradSky = ctx.createLinearGradient(0, 0, 0, 320);
    gradSky.addColorStop(0, "#2B6CB0");
    gradSky.addColorStop(0.6, "#63B3ED");
    gradSky.addColorStop(1, "#EBF8FF");
    ctx.fillStyle = gradSky;
    ctx.fillRect(0, 0, w, 320);

    // Fluffy anime clouds
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    const clouds = [
      { x: 120, y: 70, r: 35 },
      { x: 155, y: 60, r: 45 },
      { x: 195, y: 75, r: 30 },
      { x: 740, y: 90, r: 40 },
      { x: 785, y: 80, r: 50 },
      { x: 830, y: 95, r: 35 },
    ];
    clouds.forEach((c) => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Gym windows & architectural grid
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    for (let x = 60; x < w; x += 140) {
      ctx.fillRect(x, 140, 80, 140);
      ctx.strokeStyle = "rgba(43, 108, 176, 0.5)";
      ctx.lineWidth = 3;
      ctx.strokeRect(x, 140, 80, 140);
    }

    // 2. Polished Japanese Anime Gym Floor (Parquet warm wood with gloss reflection)
    const floorY = 280;
    const gradFloor = ctx.createLinearGradient(0, floorY, 0, h);
    gradFloor.addColorStop(0, "#D69E2E");
    gradFloor.addColorStop(0.3, "#ECC94B");
    gradFloor.addColorStop(0.8, "#D69E2E");
    gradFloor.addColorStop(1, "#B7791F");
    ctx.fillStyle = gradFloor;
    ctx.fillRect(0, floorY, w, h - floorY);

    // Parquet wooden plank perspective lines
    ctx.strokeStyle = "rgba(183, 121, 31, 0.45)";
    ctx.lineWidth = 1.5;
    for (let x = -200; x < w + 200; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, floorY);
      ctx.lineTo(x + (x - w / 2) * 0.4, h);
      ctx.stroke();
    }

    // Horizontal court boundary lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(60, floorY + 40);
    ctx.lineTo(w - 60, floorY + 40);
    ctx.moveTo(40, h - 30);
    ctx.lineTo(w - 40, h - 30);
    ctx.stroke();

    // Center jump circle
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(w / 2, floorY + 120, 160, 45, 0, 0, Math.PI * 2);
    ctx.stroke();

    this.textures.addCanvas("court_bg", canvas);
  }
}
