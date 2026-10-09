import Phaser from "phaser";
import {
  GameSettings,
  CameraAngle,
  CameraMode,
  JudgmentRating,
  GamePlayStats,
} from "../logic/types";
import {
  evaluateTiming,
  getAngularSpeed,
  getComboMultiplier,
  getJumperTargetX,
  SPEED_SCORES,
  DIFFICULTY_SCORES,
  DIFFICULTY_WINDOWS,
  SCORE_MAX_CAP,
  BUTTON_COOLDOWN_MS,
  calculateTheoreticalMaxScore,
  calculateGrade,
} from "../logic/judgment";
import { soundManager } from "@/shared/audio/soundManager";
import { getSelectedCharacters } from "@/entities/character/characterRoster";

interface JumperEntity {
  id: string;
  sprite: Phaser.GameObjects.Sprite;
  shadow: Phaser.GameObjects.Graphics;
  targetUnitX: number; // 3.0 ~ 7.0
  hasCompletedFullRound: boolean;
  state: "enter" | "jumping" | "exit" | "trip";
}

export class GameScene extends Phaser.Scene {
  private settings!: GameSettings;
  private currentAngle: number = 0;
  private previousAngle: number = 0;
  private remainingTime: number = 60;
  private isRunning: boolean = false;
  private isEndingSequence: boolean = false;
  private isButtonLocked: boolean = false;
  private hasPlayedFirstGame: boolean = false;

  // Camera & view mode
  private cameraMode: CameraMode = "still";
  private cameraAngle: CameraAngle = "front";
  private zoomLevel: number = 1.0;

  // Selected character IDs
  private leftTurnerId: string = "turner_ren";
  private rightTurnerId: string = "turner_aoi";
  private currentJumperId: string = "jumper_haruto";

  // Stats
  private stats: GamePlayStats = {
    score: 0,
    comboRounds: 0,
    maxCombo: 0,
    enteredCount: 0,
    trippedCount: 0,
    perfectCount: 0,
    goodCount: 0,
    missCount: 0,
  };

  // Game visual objects
  private courtBg!: Phaser.GameObjects.Image;
  private placardContainer?: any;
  private safeZoneGraphics!: Phaser.GameObjects.Graphics;
  private backRopeGraphics!: Phaser.GameObjects.Graphics;
  private frontRopeGraphics!: Phaser.GameObjects.Graphics;
  private turnerArmsGraphics!: Phaser.GameObjects.Graphics;
  private leftTurnerSprite!: Phaser.GameObjects.Sprite;
  private rightTurnerSprite!: Phaser.GameObjects.Sprite;

  private jumpers: JumperEntity[] = [];
  private floatingFeedbackTexts: Phaser.GameObjects.Text[] = [];

  // Sound throttles
  private hasPlayedSwishThisRound: boolean = false;
  private hasPlayedJumpThisRound: boolean = false;

  constructor() {
    super("GameScene");
  }

  init(data: { settings?: GameSettings; hasPlayedFirstGame?: boolean }) {
    this.settings = data.settings || {
      duration: 60,
      speed: 2,
      difficulty: 1,
      maxJumpers: 3,
    };
    this.hasPlayedFirstGame = data.hasPlayedFirstGame || false;
    this.remainingTime = this.settings.duration;
    this.currentAngle = 0;
    this.previousAngle = 0;
    this.isRunning = true;
    this.isEndingSequence = false;
    this.hasPlayedSwishThisRound = false;
    this.hasPlayedJumpThisRound = false;
    this.stats = {
      score: 0,
      comboRounds: 0,
      maxCombo: 0,
      enteredCount: 0,
      trippedCount: 0,
      perfectCount: 0,
      goodCount: 0,
      missCount: 0,
    };
    this.jumpers = [];

    // Load active character selection
    const sel = getSelectedCharacters();
    this.leftTurnerId = sel.leftTurnerId;
    this.rightTurnerId = sel.rightTurnerId;
    this.currentJumperId = sel.jumperId;
  }

  create() {
    const { width, height } = this.scale;

    // 1. Background (Japanese anime school gym court)
    const bgKey = this.textures.exists("court_bg_anime") ? "court_bg_anime" : "court_bg";
    this.courtBg = this.add.image(width / 2, height / 2, bgKey);
    const bgScaleX = width / this.courtBg.width;
    const bgScaleY = height / this.courtBg.height;
    this.courtBg.setScale(Math.max(bgScaleX, bgScaleY));

    // 2. Gymnasium Championship Placard (covering original Japanese sign with English text)
    this.renderGymPlacard();

    // 3. Safe zone floor highlight (under ropes & characters)
    this.safeZoneGraphics = this.add.graphics();
    this.drawSafeZoneHighlight();

    // 4. Back Rope Graphics (rendered behind jumpers)
    this.backRopeGraphics = this.add.graphics();

    // 5. Turners (3D Cel-shaded Turner Athletes, scaled to 2x)
    const leftKey = this.textures.exists(`texture_${this.leftTurnerId}`)
      ? `texture_${this.leftTurnerId}`
      : "turner_sheet";
    const rightKey = this.textures.exists(`texture_${this.rightTurnerId}`)
      ? `texture_${this.rightTurnerId}`
      : "turner_sheet";

    this.leftTurnerSprite = this.add.sprite(this.unitToPx(0.85), height * 0.77, leftKey, 0);
    this.leftTurnerSprite.setOrigin(0.5, 0.95);
    this.leftTurnerSprite.setScale(1.75); // 2x character scale

    this.rightTurnerSprite = this.add.sprite(this.unitToPx(9.15), height * 0.77, rightKey, 0);
    this.rightTurnerSprite.setOrigin(0.5, 0.95);
    this.rightTurnerSprite.setScale(1.75); // 2x character scale
    this.rightTurnerSprite.setFlipX(true);

    // 6. Turner dynamic arms graphics (synchronously cranks with the rope handles)
    this.turnerArmsGraphics = this.add.graphics();

    // 7. Front Rope Graphics (rendered in front of jumpers)
    this.frontRopeGraphics = this.add.graphics();

    // Apply initial camera zoom & perspective
    this.applyCameraTransform();

    // Setup input listeners from external React HUD
    this.game.events.on("REACT_JUMP_IN", this.handleJumpIn, this);
    this.game.events.on("REACT_JUMP_OUT", this.handleJumpOut, this);
    this.game.events.on("REACT_SET_CAMERA_MODE", this.setCameraMode, this);
    this.game.events.on("REACT_SET_CAMERA_ANGLE", this.setCameraAngle, this);
    this.game.events.on("REACT_SET_ZOOM", this.setZoomLevel, this);
    this.game.events.on("REACT_TOGGLE_PAUSE", this.setPaused, this);
    this.game.events.on("REACT_SET_CHARACTERS", this.handleSetCharacters, this);

    // Initial HUD notification
    this.emitHudState();
  }

  update(_time: number, delta: number) {
    if (!this.isRunning) return;

    const deltaSec = delta / 1000;
    this.remainingTime = Math.max(0, this.remainingTime - deltaSec);

    // Check game over
    if (this.remainingTime <= 0) {
      this.handleGameOver();
      return;
    }

    // 1. Angular speed calculation with RUSH (1.15x during final 20%)
    const angularSpeed = getAngularSpeed(
      this.settings.speed,
      this.remainingTime,
      this.settings.duration
    );

    this.previousAngle = this.currentAngle;
    this.currentAngle = (this.currentAngle + angularSpeed * deltaSec) % 360;

    // 2. Swish sound effect as front rope nears floor (160° - 190°)
    if (this.currentAngle >= 160 && this.currentAngle <= 200) {
      if (!this.hasPlayedSwishThisRound) {
        soundManager.playSwish(angularSpeed / 360);
        this.hasPlayedSwishThisRound = true;
      }
    } else {
      this.hasPlayedSwishThisRound = false;
    }

    // 3. Evaluate full round pass (Angle wrapping around 0°)
    if (this.previousAngle > 270 && this.currentAngle < 90) {
      this.onRopeFullTurn();
    }

    // 4. Synchronize Turner Arm Rotation frames (8 frames)
    const turnerFrame = Math.floor(this.currentAngle / 45) % 8;
    this.leftTurnerSprite.setFrame(turnerFrame);
    this.rightTurnerSprite.setFrame((8 - turnerFrame) % 8);

    // 5. Update Jumpers (Jump cycle sync, positions, and animations)
    this.updateJumpers(deltaSec);

    // 6. Draw dynamic dual ropes with perspective
    this.renderDualRopes();

    // Periodically update HUD
    this.emitHudState();
  }

  private unitToPx(unit: number): number {
    const { width } = this.scale;
    // Map 0 -> 140px, 10 -> width - 140px
    const minX = 140;
    const maxX = width - 140;
    return minX + (unit / 10) * (maxX - minX);
  }

  // --- Dynamic Realistic Braided Anime Rope Rendering ---
  private renderDualRopes() {
    this.frontRopeGraphics.clear();
    this.backRopeGraphics.clear();

    const { width, height } = this.scale;

    // Angle radians
    const frontRad = (this.currentAngle * Math.PI) / 180;
    const backAngle = (360 - this.currentAngle) % 360;
    const backRad = (backAngle * Math.PI) / 180;

    // Turner Crank Hands (2x scale coordinate computation)
    // Left Turner
    const leftShoulderX = this.leftTurnerSprite.x + 12;
    const leftShoulderY = this.leftTurnerSprite.y - 128;
    const crankRadiusX = 36;
    const crankRadiusY = 32;

    const leftFrontHandX = leftShoulderX + Math.cos(frontRad) * crankRadiusX;
    const leftFrontHandY = leftShoulderY + Math.sin(frontRad) * crankRadiusY;
    const leftBackHandX = leftShoulderX - 14 + Math.cos(backRad) * (crankRadiusX * 0.85);
    const leftBackHandY = leftShoulderY + Math.sin(backRad) * crankRadiusY;

    // Right Turner
    const rightShoulderX = this.rightTurnerSprite.x - 12;
    const rightShoulderY = this.rightTurnerSprite.y - 128;
    const rightFrontHandX = rightShoulderX - Math.cos(frontRad) * crankRadiusX;
    const rightFrontHandY = rightShoulderY + Math.sin(frontRad) * crankRadiusY;
    const rightBackHandX = rightShoulderX + 14 - Math.cos(backRad) * (crankRadiusX * 0.85);
    const rightBackHandY = rightShoulderY + Math.sin(backRad) * crankRadiusY;

    // Render Turner Arms connecting shoulder directly to hand handles in 1:1 motion
    this.renderTurnerArms(
      leftShoulderX,
      leftShoulderY,
      leftFrontHandX,
      leftFrontHandY,
      rightShoulderX,
      rightShoulderY,
      rightFrontHandX,
      rightFrontHandY
    );

    const midX = (leftFrontHandX + rightFrontHandX) / 2;
    const midY = (leftFrontHandY + rightFrontHandY) / 2;

    // Perspective parameters based on cameraAngle
    let depthTiltX = 0;
    let verticalFlatten = 1.0;
    if (this.cameraAngle === "left") {
      depthTiltX = 45;
    } else if (this.cameraAngle === "right") {
      depthTiltX = -45;
    } else if (this.cameraAngle === "high") {
      verticalFlatten = 0.72;
    }

    // Floor coordinate (Gym floor level)
    const floorY = height * 0.77;
    const floorDelta = floorY - midY;

    // Rope ellipse amplitudes:
    // 1. maxSagY ensures the lowest point of the quadratic bezier curve grazes and touches the floor:
    //    midY + maxSagY / 2 = floorY => maxSagY = floorDelta * 2
    const maxSagY = (floorDelta * 2 + 8) * verticalFlatten; // Lowest point touches the floor at 180°
    // 2. maxRiseY ensures the peak of the rotating rope arches slightly higher than the jumper's jump apex:
    const maxRiseY = -340 * verticalFlatten; // Crest when at top (0°) - rises slightly above jumper's jump apex

    // Front Rope Sag calculation
    const frontCos = Math.cos(frontRad);
    const frontSin = Math.sin(frontRad);
    const frontSag = midY - (frontCos * (maxSagY + Math.abs(maxRiseY))) / 2 + (maxSagY + maxRiseY) / 2;
    const frontDepthX = midX + frontSin * depthTiltX;

    // Back Rope Sag calculation
    const backCos = Math.cos(backRad);
    const backSin = Math.sin(backRad);
    const backSag = midY - (backCos * (maxSagY + Math.abs(maxRiseY))) / 2 + (maxSagY + maxRiseY) / 2;
    const backDepthX = midX + backSin * depthTiltX;

    // Perspective thickness: rope is thicker when near floor/camera, thinner when at top apex
    const frontThickness = Phaser.Math.Linear(3.8, 7.5, (frontCos + 1) / 2);
    const backThickness = Phaser.Math.Linear(2.6, 5.2, (backCos + 1) / 2);

    // 1. Draw Back Rope (attached directly to left & right back hands)
    this.drawRealisticBraidedRope(
      this.backRopeGraphics,
      leftBackHandX,
      leftBackHandY,
      backDepthX,
      backSag,
      rightBackHandX,
      rightBackHandY,
      backThickness,
      0x553C9A, // Base cord shadow
      0xB794F4, // Braided weave highlight
      0xE9D8FD  // Core specular
    );

    // 2. Draw Front Rope (attached directly to left & right front hands)
    this.drawRealisticBraidedRope(
      this.frontRopeGraphics,
      leftFrontHandX,
      leftFrontHandY,
      frontDepthX,
      frontSag,
      rightFrontHandX,
      rightFrontHandY,
      frontThickness,
      0x9B2C2C, // Deep cord shadow
      0xDD6B20, // Rich braided nylon body
      0xFEEBC8  // Specular braided highlights
    );
  }

  // Realistic Braided Rope with multi-strand spiral weave texture
  private drawRealisticBraidedRope(
    graphics: Phaser.GameObjects.Graphics,
    x0: number,
    y0: number,
    midX: number,
    midY: number,
    x1: number,
    y1: number,
    baseThickness: number,
    shadowColor: number,
    bodyColor: number,
    highlightColor: number
  ) {
    const curve = new Phaser.Curves.QuadraticBezier(
      new Phaser.Math.Vector2(x0, y0),
      new Phaser.Math.Vector2(midX, midY),
      new Phaser.Math.Vector2(x1, y1)
    );

    const numPoints = 48;
    const points = curve.getPoints(numPoints);

    // Layer 1: Soft atmospheric motion glow
    graphics.lineStyle(baseThickness * 1.8, bodyColor, 0.25);
    graphics.beginPath();
    for (let i = 0; i < points.length; i++) {
      if (i === 0) graphics.moveTo(points[i].x, points[i].y);
      else graphics.lineTo(points[i].x, points[i].y);
    }
    graphics.strokePath();

    // Layer 2: Main outer cord core & shadow
    graphics.lineStyle(baseThickness, shadowColor, 0.95);
    graphics.beginPath();
    for (let i = 0; i < points.length; i++) {
      if (i === 0) graphics.moveTo(points[i].x, points[i].y);
      else graphics.lineTo(points[i].x, points[i].y);
    }
    graphics.strokePath();

    // Layer 3: Main body fiber
    graphics.lineStyle(baseThickness * 0.75, bodyColor, 1.0);
    graphics.beginPath();
    for (let i = 0; i < points.length; i++) {
      if (i === 0) graphics.moveTo(points[i].x, points[i].y);
      else graphics.lineTo(points[i].x, points[i].y);
    }
    graphics.strokePath();

    // Layer 4: Braided Spiral Weave Segments (Twisted rope texture simulation)
    const strandRadius = baseThickness * 0.45;
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];

      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) continue;
      const normalX = -dy / len;
      const normalY = dx / len;

      const spiralPhase = Math.sin(i * 1.4);
      const offsetDist = spiralPhase * strandRadius;

      if (spiralPhase > 0.1) {
        graphics.lineStyle(Math.max(1.2, baseThickness * 0.35), highlightColor, 0.9);
        graphics.beginPath();
        graphics.moveTo(p1.x + normalX * offsetDist, p1.y + normalY * offsetDist);
        graphics.lineTo(p2.x + normalX * offsetDist, p2.y + normalY * offsetDist);
        graphics.strokePath();
      }
    }

    // Layer 5: End Handle Grip Caps held by turners
    graphics.fillStyle(0x1A202C, 1.0);
    graphics.lineStyle(1.5, 0xCBD5E0, 1.0);
    graphics.fillCircle(x0, y0, baseThickness * 1.2);
    graphics.strokeCircle(x0, y0, baseThickness * 1.2);
    graphics.fillCircle(x1, y1, baseThickness * 1.2);
    graphics.strokeCircle(x1, y1, baseThickness * 1.2);
  }

  // --- Safe Zone Floor Highlight ---
  private drawSafeZoneHighlight() {
    this.safeZoneGraphics.clear();

    const shouldShow = !this.hasPlayedFirstGame || this.settings.difficulty < 3;
    if (!shouldShow) return;

    const { width, height } = this.scale;
    const floorY = height * 0.77;

    const startX = this.unitToPx(3.6);
    const endX = this.unitToPx(6.4);
    const zoneW = endX - startX;

    // Glowing subtle neon green / amber floor target
    this.safeZoneGraphics.fillStyle(0x38A169, 0.22);
    this.safeZoneGraphics.fillEllipse((startX + endX) / 2, floorY, zoneW + 40, 36);

    this.safeZoneGraphics.lineStyle(2, 0x68D391, 0.65);
    this.safeZoneGraphics.strokeEllipse((startX + endX) / 2, floorY, zoneW + 40, 36);
  }

  // --- Jumper Updates & Jump Sync ---
  private updateJumpers(deltaSec: number) {
    const height = this.scale.height;
    const baseY = height * 0.77;

    // Jump timing:
    // Jumper stands on floor, prepares and takes off at 100°, reaches APEX at 180° (when rope is at floor),
    // and lands back on the floor at 260°.
    // From 260° through 360°/0° to 100°, jumper is firmly standing on the floor with feet planted!
    const jumpStartAngle = 100;
    const jumpEndAngle = 260;
    const jumpWindow = jumpEndAngle - jumpStartAngle; // 160° airborne window

    let jumpArcY = 0;
    let jumpFrame = 0;

    if (this.currentAngle >= jumpStartAngle && this.currentAngle <= jumpEndAngle) {
      const jumpProgress = (this.currentAngle - jumpStartAngle) / jumpWindow; // 0.0 to 1.0
      // Parabolic jump arc: peaks at 1.0 (apex) at 180°
      jumpArcY = Math.sin(jumpProgress * Math.PI) * 125;

      // Sprite jump animation frames:
      if (jumpProgress < 0.14) {
        jumpFrame = 1; // Takeoff push off floor
      } else if (jumpProgress < 0.34) {
        jumpFrame = 2; // Ascending
      } else if (jumpProgress < 0.44) {
        jumpFrame = 3; // Approaching apex
      } else if (jumpProgress <= 0.56) {
        jumpFrame = 4; // APEX PEAK at 180° - high in the air while rope sweeps floor!
      } else if (jumpProgress < 0.72) {
        jumpFrame = 5; // Descending
      } else if (jumpProgress < 0.88) {
        jumpFrame = 6; // Landing reach
      } else {
        jumpFrame = 7; // Touchdown
      }
    } else {
      // Firmly on the floor! Feet planted on the ground.
      jumpArcY = 0;
      if (this.currentAngle > 260 && this.currentAngle < 290) {
        jumpFrame = 7; // Landing cushion
      } else if (this.currentAngle >= 75 && this.currentAngle < 100) {
        jumpFrame = 1; // Crouch preparing to spring
      } else {
        jumpFrame = 0; // Standing ready on floor
      }
    }

    // Play spring takeoff audio once per jump
    if (this.currentAngle >= 100 && this.currentAngle <= 125) {
      if (!this.hasPlayedJumpThisRound) {
        soundManager.playJump();
        this.hasPlayedJumpThisRound = true;
      }
    } else if (this.currentAngle > 260 || this.currentAngle < 80) {
      this.hasPlayedJumpThisRound = false;
    }

    this.jumpers.forEach((jumper, index) => {
      // Re-calculate target position based on total count
      jumper.targetUnitX = getJumperTargetX(index, this.jumpers.length);
      const targetPx = this.unitToPx(jumper.targetUnitX);

      // Smooth horizontal lerp
      jumper.sprite.x = Phaser.Math.Linear(jumper.sprite.x, targetPx, Math.min(1.0, deltaSec * 8));

      if (jumper.state === "jumping") {
        jumper.sprite.setFrame(jumpFrame);
        jumper.sprite.y = baseY - jumpArcY;

        // Dynamic shadow on gym floor
        if (jumpArcY > 0) {
          const shadowScale = Math.max(0.35, 1 - jumpArcY / 140);
          jumper.shadow.clear();
          jumper.shadow.fillStyle(0x0F172A, 0.28 * shadowScale);
          jumper.shadow.fillEllipse(jumper.sprite.x, baseY + 6, 48 * shadowScale, 14 * shadowScale);
        } else {
          // Standing flat on floor: full clear shadow
          jumper.shadow.clear();
          jumper.shadow.fillStyle(0x0F172A, 0.34);
          jumper.shadow.fillEllipse(jumper.sprite.x, baseY + 6, 52, 16);
        }
      }
    });
  }

  // --- Scoring on Full Turn (Angle 0° Crossing) ---
  private onRopeFullTurn() {
    let qualifiedCount = 0;

    this.jumpers.forEach((jumper) => {
      if (jumper.hasCompletedFullRound) {
        qualifiedCount++;
      } else {
        // Now has completed 1 full round!
        jumper.hasCompletedFullRound = true;
      }
    });

    if (qualifiedCount > 0) {
      // Add combo & score
      this.stats.comboRounds++;
      if (this.stats.comboRounds > this.stats.maxCombo) {
        this.stats.maxCombo = this.stats.comboRounds;
      }

      const speedScore = SPEED_SCORES[this.settings.speed];
      const diffScore = DIFFICULTY_SCORES[this.settings.difficulty];
      const comboMult = getComboMultiplier(this.stats.comboRounds);

      const added = Math.floor(qualifiedCount * speedScore * diffScore * comboMult);
      this.stats.score = Math.min(SCORE_MAX_CAP, this.stats.score + added);
    }
  }

  // --- Player Action: Jump-In ---
  public handleJumpIn() {
    if (!this.isRunning || this.isButtonLocked) return;

    if (this.jumpers.length >= this.settings.maxJumpers) {
      return; // Already reached max jumpers
    }

    const rating = evaluateTiming(this.currentAngle, this.settings.difficulty);

    if (rating === "perfect" || rating === "good") {
      // Successful Jump-In!
      if (rating === "perfect") {
        this.stats.perfectCount++;
        soundManager.playPerfect();
        this.showFloatingFeedback("PERFECT!", 0x38A169);
      } else {
        this.stats.goodCount++;
        soundManager.playGood();
        this.showFloatingFeedback("GOOD!", 0x3182CE);
      }

      this.stats.enteredCount++;

      // Spawn jumper
      const newIndex = this.jumpers.length;
      const targetUnitX = getJumperTargetX(newIndex, newIndex + 1);
      const spawnX = this.unitToPx(0.5); // enter from left side
      const height = this.scale.height;

      const sheetKey = this.textures.exists(`sheet_${this.currentJumperId}`)
        ? `sheet_${this.currentJumperId}`
        : "jumper_jump_sheet";

      const sprite = this.add.sprite(spawnX, height * 0.77, sheetKey, 0);
      sprite.setOrigin(0.5, 0.95);
      sprite.setScale(1.45); // 2x character scale

      const jumperEntity: JumperEntity = {
        id: `jumper_${Date.now()}_${Math.random()}`,
        sprite,
        shadow: this.add.graphics(),
        targetUnitX,
        hasCompletedFullRound: false,
        state: "jumping",
      };

      this.jumpers.push(jumperEntity);
    } else {
      // Missed Jump-In!
      this.stats.missCount++;
      this.stats.comboRounds = 0; // Combo breaks
      soundManager.playMiss();
      this.showFloatingFeedback("MISS!", 0xE53E3E);
      this.lockButtons();
    }

    this.emitHudState();
  }

  // --- Player Action: Jump-Out ---
  public handleJumpOut() {
    if (!this.isRunning || this.isButtonLocked) return;
    if (this.jumpers.length === 0) return;

    const rating = evaluateTiming(this.currentAngle, this.settings.difficulty);
    const firstJumper = this.jumpers.shift()!; // FIFO

    if (rating === "perfect" || rating === "good") {
      // Successful Jump-Out!
      if (rating === "perfect") {
        this.stats.perfectCount++;
        soundManager.playPerfect();
        this.showFloatingFeedback("PERFECT!", 0x38A169);
      } else {
        this.stats.goodCount++;
        soundManager.playGood();
        this.showFloatingFeedback("GOOD!", 0x3182CE);
      }

      // Exit animation: leaps away to right side
      this.tweens.add({
        targets: firstJumper.sprite,
        x: this.unitToPx(9.8),
        alpha: 0,
        duration: 400,
        ease: "Power2",
        onComplete: () => {
          firstJumper.sprite.destroy();
          firstJumper.shadow.destroy();
        },
      });
    } else {
      // Missed Jump-Out: Tripped on rope!
      this.stats.missCount++;
      this.stats.trippedCount++;
      this.stats.comboRounds = 0; // Combo breaks
      soundManager.playMiss();
      this.showFloatingFeedback("CAUGHT!", 0xE53E3E);

      firstJumper.state = "trip";
      firstJumper.sprite.play("jumper_trip_anim");
      this.tweens.add({
        targets: firstJumper.sprite,
        alpha: 0,
        y: firstJumper.sprite.y + 20,
        duration: 500,
        ease: "Power1",
        onComplete: () => {
          firstJumper.sprite.destroy();
          firstJumper.shadow.destroy();
        },
      });

      this.lockButtons();
    }

    this.emitHudState();
  }

  private lockButtons() {
    this.isButtonLocked = true;
    this.game.events.emit("REACT_BUTTONS_LOCKED", true);
    this.time.delayedCall(BUTTON_COOLDOWN_MS, () => {
      this.isButtonLocked = false;
      this.game.events.emit("REACT_BUTTONS_LOCKED", false);
    });
  }

  private showFloatingFeedback(text: string, color: number) {
    const { width, height } = this.scale;
    const txt = this.add.text(width / 2, height * 0.42, text, {
      fontFamily: "'Outfit', 'Noto Sans KR', sans-serif",
      fontSize: "36px",
      fontStyle: "bold",
      color: "#FFFFFF",
      stroke: `#${color.toString(16).padStart(6, "0")}`,
      strokeThickness: 8,
      shadow: { blur: 10, stroke: true, fill: true, color: "#000000" },
    });
    txt.setOrigin(0.5);

    this.tweens.add({
      targets: txt,
      y: txt.y - 60,
      scale: 1.25,
      alpha: 0,
      duration: 700,
      ease: "Cubic.easeOut",
      onComplete: () => txt.destroy(),
    });
  }

  // --- Camera Perspectives & Zoom ---
  public setCameraMode(mode: CameraMode) {
    this.cameraMode = mode;
    if (mode === "still") {
      this.setCameraAngle("front");
    }
  }

  public setCameraAngle(angle: CameraAngle) {
    this.cameraAngle = angle;
    this.applyCameraTransform();
  }

  public setZoomLevel(zoom: number) {
    this.zoomLevel = zoom;
    this.applyCameraTransform();
  }

  private applyCameraTransform() {
    const camera = this.cameras.main;
    camera.setZoom(this.zoomLevel);

    let scrollX = 0;
    let scrollY = 0;

    if (this.cameraAngle === "left") {
      scrollX = -70;
      scrollY = -10;
    } else if (this.cameraAngle === "right") {
      scrollX = 70;
      scrollY = -10;
    } else if (this.cameraAngle === "high") {
      scrollX = 0;
      scrollY = -40;
    }

    this.tweens.add({
      targets: camera,
      scrollX,
      scrollY,
      duration: 350,
      ease: "Cubic.easeOut",
    });
  }

  private handleGameOver() {
    if (this.isEndingSequence) return;
    this.isEndingSequence = true;
    this.isRunning = false;

    // Success condition: the configured number of jumpers survived and are actively jumping at the end!
    // Failure condition: remaining jumpers is less than maxJumpers or 0.
    const isSuccess = this.jumpers.length === this.settings.maxJumpers;

    // Notify React UI that gameplay ended and ending sequence has started
    this.game.events.emit("REACT_GAME_ENDING", { isSuccess });

    // Play 3-second celebratory cheering or disappointment scene, then freeze and show score button
    this.playEndingSequence(isSuccess, () => {
      this.scene.pause(); // Freeze scene completely at 3 seconds!

      const theoreticalMax = calculateTheoreticalMaxScore(this.settings);
      const grade = calculateGrade(this.stats.score, theoreticalMax);

      this.game.events.emit("REACT_SHOW_SCORE_BUTTON", {
        isSuccess,
        stats: this.stats,
        settings: this.settings,
        theoreticalMax,
        grade,
      });
    });
  }

  // --- Extended 3-second Ending Sequence (Cheering on Success vs Disappointment on Failure) ---
  private playEndingSequence(isSuccess: boolean, onFinish: () => void) {
    const { width, height } = this.scale;
    const baseY = height * 0.77;

    // Settle ropes to resting position on gym floor
    this.currentAngle = 180;
    this.renderDualRopes();

    if (isSuccess) {
      // 1. Victory Fanfare Sound
      soundManager.playFanfare();

      // 2. Celebratory Anime Banner
      const bannerContainer = this.add.container(width / 2, height * 0.32);

      const bannerBg = this.add.graphics();
      bannerBg.fillStyle(0x000000, 0.7);
      bannerBg.fillRoundedRect(-240, -45, 480, 90, 18);
      bannerBg.fillStyle(0x1A202C, 0.96);
      bannerBg.fillRoundedRect(-236, -42, 472, 84, 16);
      // Double Gold rim
      bannerBg.lineStyle(3, 0xF59E0B, 1.0);
      bannerBg.strokeRoundedRect(-236, -42, 472, 84, 16);
      bannerBg.lineStyle(1.5, 0xFDE047, 0.85);
      bannerBg.strokeRoundedRect(-232, -38, 464, 76, 14);

      const titleText = this.add.text(0, -12, "🏆 SUCCESS! 미션 완주 성공! 🏆", {
        fontFamily: "'Outfit', 'Noto Sans KR', sans-serif",
        fontSize: "26px",
        fontStyle: "bold",
        color: "#FDE047",
        stroke: "#78350F",
        strokeThickness: 5,
        align: "center",
      }).setOrigin(0.5);

      const subText = this.add.text(0, 20, `설정 인원 ${this.settings.maxJumpers}명 전원 완주 달성! 🎉`, {
        fontFamily: "'Outfit', 'Noto Sans KR', sans-serif",
        fontSize: "16px",
        fontStyle: "bold",
        color: "#E2E8F0",
        stroke: "#0F172A",
        strokeThickness: 3,
        align: "center",
      }).setOrigin(0.5);

      bannerContainer.add([bannerBg, titleText, subText]);
      bannerContainer.setScale(0.3);
      bannerContainer.setAlpha(0);

      this.tweens.add({
        targets: bannerContainer,
        scale: 1.0,
        alpha: 1.0,
        duration: 450,
        ease: "Back.easeOut",
      });

      // 3. Jumpers: Joyful bouncing cheer animation
      this.jumpers.forEach((jumper, idx) => {
        jumper.sprite.y = baseY;
        jumper.sprite.setFrame(4); // Apex celebratory pose
        jumper.shadow.clear();
        jumper.shadow.fillStyle(0x0F172A, 0.28);
        jumper.shadow.fillEllipse(jumper.sprite.x, baseY + 6, 48, 14);

        // Bouncing cheer tween
        this.tweens.add({
          targets: jumper.sprite,
          y: baseY - 36,
          duration: 260,
          yoyo: true,
          repeat: 5,
          delay: idx * 70,
          ease: "Sine.easeInOut",
          onUpdate: () => {
            const jumpOffset = baseY - jumper.sprite.y;
            const shadowScale = Math.max(0.4, 1 - jumpOffset / 70);
            jumper.shadow.clear();
            jumper.shadow.fillStyle(0x0F172A, 0.28 * shadowScale);
            jumper.shadow.fillEllipse(jumper.sprite.x, baseY + 6, 48 * shadowScale, 14 * shadowScale);
          },
        });

        // Cheerful floating text/emojis above each jumper
        const cheerWords = ["🎉", "CLEAR!", "✨", "YEAH!", "⭐"];
        const cheerTxt = this.add.text(
          jumper.sprite.x,
          baseY - 75,
          cheerWords[idx % cheerWords.length],
          {
            fontFamily: "'Outfit', 'Noto Sans KR', sans-serif",
            fontSize: "22px",
            fontStyle: "bold",
            color: "#FEF08A",
            stroke: "#92400E",
            strokeThickness: 4,
          }
        ).setOrigin(0.5);

        this.tweens.add({
          targets: cheerTxt,
          y: cheerTxt.y - 30,
          alpha: 0,
          duration: 900,
          repeat: 2,
          delay: idx * 100,
        });
      });

      // 4. Turners: Joyful hops
      this.leftTurnerSprite.setFrame(4);
      this.rightTurnerSprite.setFrame(4);
      this.tweens.add({
        targets: [this.leftTurnerSprite, this.rightTurnerSprite],
        y: "-=16",
        duration: 260,
        yoyo: true,
        repeat: 5,
        ease: "Sine.easeInOut",
      });

      // 5. Confetti rain particles
      const confettiColors = [0xFBBF24, 0x34D399, 0x60A5FA, 0xF472B6, 0xA78BFA, 0xFB923C];
      for (let i = 0; i < 40; i++) {
        const confetti = this.add.graphics();
        confetti.fillStyle(confettiColors[i % confettiColors.length], 0.9);
        confetti.fillRect(-5, -5, 10, 10);
        confetti.setPosition(
          Phaser.Math.Between(80, width - 80),
          Phaser.Math.Between(-40, 120)
        );
        this.tweens.add({
          targets: confetti,
          y: height + 30,
          x: `+=${Phaser.Math.Between(-70, 70)}`,
          angle: `+=${Phaser.Math.Between(180, 720)}`,
          duration: Phaser.Math.Between(1800, 2900),
          ease: "Sine.easeIn",
        });
      }
    } else {
      // 1. Defeat melancholy sound
      soundManager.playDefeat();

      // 2. Disappointment Anime Banner
      const bannerContainer = this.add.container(width / 2, height * 0.32);

      const bannerBg = this.add.graphics();
      bannerBg.fillStyle(0x000000, 0.7);
      bannerBg.fillRoundedRect(-240, -45, 480, 90, 18);
      bannerBg.fillStyle(0x111827, 0.96);
      bannerBg.fillRoundedRect(-236, -42, 472, 84, 16);
      // Crimson / deep border
      bannerBg.lineStyle(3, 0xEF4444, 0.95);
      bannerBg.strokeRoundedRect(-236, -42, 472, 84, 16);
      bannerBg.lineStyle(1.5, 0x60A5FA, 0.7);
      bannerBg.strokeRoundedRect(-232, -38, 464, 76, 14);

      const titleText = this.add.text(0, -12, "💧 TIME UP... 실패 💧", {
        fontFamily: "'Outfit', 'Noto Sans KR', sans-serif",
        fontSize: "26px",
        fontStyle: "bold",
        color: "#F87171",
        stroke: "#450A0A",
        strokeThickness: 5,
        align: "center",
      }).setOrigin(0.5);

      const subText = this.add.text(
        0,
        20,
        `목표 인원 미달 (남은 인원: ${this.jumpers.length} / ${this.settings.maxJumpers}명) 😢`,
        {
          fontFamily: "'Outfit', 'Noto Sans KR', sans-serif",
          fontSize: "16px",
          fontStyle: "bold",
          color: "#94A3B8",
          stroke: "#0F172A",
          strokeThickness: 3,
          align: "center",
        }
      ).setOrigin(0.5);

      bannerContainer.add([bannerBg, titleText, subText]);
      bannerContainer.setScale(0.8);
      bannerContainer.setAlpha(0);

      this.tweens.add({
        targets: bannerContainer,
        scale: 1.0,
        alpha: 1.0,
        y: "+=10",
        duration: 400,
        ease: "Quad.easeOut",
      });

      // 3. Jumpers (if any): Slump forward with sweat drops
      if (this.jumpers.length > 0) {
        this.jumpers.forEach((jumper, idx) => {
          jumper.sprite.y = baseY;
          jumper.sprite.setFrame(0);
          jumper.shadow.clear();
          jumper.shadow.fillStyle(0x0F172A, 0.28);
          jumper.shadow.fillEllipse(jumper.sprite.x, baseY + 6, 48, 14);

          // Droop posture tween
          this.tweens.add({
            targets: jumper.sprite,
            y: baseY + 6,
            angle: idx % 2 === 0 ? -7 : 7,
            duration: 600,
            ease: "Power2",
          });

          // Sweat drop
          const sweat = this.add.text(jumper.sprite.x + 14, baseY - 62, "💧", {
            fontSize: "24px",
          }).setOrigin(0.5);

          this.tweens.add({
            targets: sweat,
            y: sweat.y - 12,
            alpha: { from: 1, to: 0.3 },
            duration: 700,
            yoyo: true,
            repeat: 3,
          });
        });
      } else {
        // No jumpers remaining at all
        const emptyCourtNotice = this.add.text(width / 2, baseY - 35, "😢 코트에 남은 점퍼가 없습니다", {
          fontFamily: "'Outfit', 'Noto Sans KR', sans-serif",
          fontSize: "18px",
          fontStyle: "bold",
          color: "#94A3B8",
          stroke: "#0F172A",
          strokeThickness: 4,
        }).setOrigin(0.5);

        this.tweens.add({
          targets: emptyCourtNotice,
          alpha: { from: 0.4, to: 1 },
          duration: 600,
          yoyo: true,
          repeat: 4,
        });
      }

      // 4. Turners: Droop posture with sweat drops
      this.leftTurnerSprite.setFrame(0);
      this.rightTurnerSprite.setFrame(0);

      const leftSweat = this.add.text(this.leftTurnerSprite.x, this.leftTurnerSprite.y - 145, "💧", {
        fontSize: "24px",
      }).setOrigin(0.5);
      const rightSweat = this.add.text(this.rightTurnerSprite.x, this.rightTurnerSprite.y - 145, "💧", {
        fontSize: "24px",
      }).setOrigin(0.5);

      this.tweens.add({
        targets: [leftSweat, rightSweat],
        y: "-=12",
        alpha: { from: 1, to: 0.3 },
        duration: 700,
        yoyo: true,
        repeat: 3,
      });
    }

    // After exactly 3.0 seconds (3,000 ms), invoke callback to freeze scene and show score button!
    this.time.delayedCall(3000, onFinish);
  }

  private emitHudState() {
    const isRush = this.remainingTime <= this.settings.duration * 0.2;
    this.game.events.emit("REACT_HUD_UPDATE", {
      score: this.stats.score,
      combo: this.stats.comboRounds,
      comboMultiplier: getComboMultiplier(this.stats.comboRounds),
      remainingTime: Math.ceil(this.remainingTime),
      activeJumpers: this.jumpers.length,
      maxJumpers: this.settings.maxJumpers,
      isRush,
      currentAngle: Math.floor(this.currentAngle),
      difficulty: this.settings.difficulty,
    });
  }

  public setPaused(paused: boolean) {
    if (this.isEndingSequence) return;
    this.isRunning = !paused;
    if (paused) {
      this.scene.pause();
    } else {
      this.scene.resume();
    }
  }

  // --- Gymnasium Championship Placard (Replaces Japanese text with English) ---
  private renderGymPlacard() {
    if (this.placardContainer) {
      this.placardContainer.destroy();
    }
    this.placardContainer = this.add.container(0, 0);

    // Placard position on balcony above basketball hoop
    const placardX = this.courtBg.x - this.courtBg.displayWidth * 0.222;
    const placardY = this.courtBg.y - this.courtBg.displayHeight * 0.246;

    const bgG = this.add.graphics();
    // Shadow
    bgG.fillStyle(0x000000, 0.55);
    bgG.fillRoundedRect(-100, -23, 200, 46, 6);

    // Placard board (Deep athletic navy)
    bgG.fillStyle(0x1E2238, 0.96);
    bgG.fillRoundedRect(-98, -21, 196, 42, 6);

    // Double Gold rim
    bgG.lineStyle(2, 0xF59E0B, 0.9);
    bgG.strokeRoundedRect(-98, -21, 196, 42, 6);
    bgG.lineStyle(1, 0xFDE047, 0.6);
    bgG.strokeRoundedRect(-95, -18, 190, 36, 4);

    // Corner rivets
    [-90, 90].forEach((rx) => {
      [-14, 14].forEach((ry) => {
        bgG.fillStyle(0xE2E8F0, 0.9);
        bgG.fillCircle(rx, ry, 2.5);
      });
    });

    const text = this.add.text(0, 0, "Double Dutch Jumping Games", {
      fontFamily: "'Trebuchet MS', 'Impact', sans-serif",
      fontSize: "12px",
      fontStyle: "bold",
      color: "#FFFFFF",
      stroke: "#0F172A",
      strokeThickness: 2,
      align: "center",
    });
    text.setOrigin(0.5, 0.5);

    this.placardContainer.add([bgG, text]);
    this.placardContainer.setPosition(placardX, placardY);
    this.placardContainer.setAngle(-4.5); // Perspective slant matching the balcony
  }

  // --- Dynamic Turner Arms Rendering (1:1 with Rope Motion) ---
  private renderTurnerArms(
    leftShoulderX: number,
    leftShoulderY: number,
    leftHandX: number,
    leftHandY: number,
    rightShoulderX: number,
    rightShoulderY: number,
    rightHandX: number,
    rightHandY: number
  ) {
    this.turnerArmsGraphics.clear();

    // 1. Left Turner Arm (Shoulder -> Elbow -> Hand Handle)
    const leftElbowX = (leftShoulderX + leftHandX) / 2 - 8;
    const leftElbowY = (leftShoulderY + leftHandY) / 2 + 10;

    // Sleeve
    this.turnerArmsGraphics.lineStyle(14, 0x1E293B, 1.0);
    this.turnerArmsGraphics.beginPath();
    this.turnerArmsGraphics.moveTo(leftShoulderX, leftShoulderY);
    this.turnerArmsGraphics.lineTo(leftElbowX, leftElbowY);
    this.turnerArmsGraphics.stroke();

    // Forearm
    this.turnerArmsGraphics.lineStyle(10, 0xFFEDD5, 1.0);
    this.turnerArmsGraphics.beginPath();
    this.turnerArmsGraphics.moveTo(leftElbowX, leftElbowY);
    this.turnerArmsGraphics.lineTo(leftHandX, leftHandY);
    this.turnerArmsGraphics.stroke();

    // Outline
    this.turnerArmsGraphics.lineStyle(2.5, 0x1A1A24, 0.85);
    this.turnerArmsGraphics.stroke();

    // Handle Grip held in hand
    this.turnerArmsGraphics.fillStyle(0xED8936, 1.0);
    this.turnerArmsGraphics.fillCircle(leftHandX, leftHandY, 8);
    this.turnerArmsGraphics.lineStyle(2, 0x7B341E, 1.0);
    this.turnerArmsGraphics.strokeCircle(leftHandX, leftHandY, 8);

    // 2. Right Turner Arm
    const rightElbowX = (rightShoulderX + rightHandX) / 2 + 8;
    const rightElbowY = (rightShoulderY + rightHandY) / 2 + 10;

    // Sleeve
    this.turnerArmsGraphics.lineStyle(14, 0x1E293B, 1.0);
    this.turnerArmsGraphics.beginPath();
    this.turnerArmsGraphics.moveTo(rightShoulderX, rightShoulderY);
    this.turnerArmsGraphics.lineTo(rightElbowX, rightElbowY);
    this.turnerArmsGraphics.stroke();

    // Forearm
    this.turnerArmsGraphics.lineStyle(10, 0xFFEDD5, 1.0);
    this.turnerArmsGraphics.beginPath();
    this.turnerArmsGraphics.moveTo(rightElbowX, rightElbowY);
    this.turnerArmsGraphics.lineTo(rightHandX, rightHandY);
    this.turnerArmsGraphics.stroke();

    // Outline
    this.turnerArmsGraphics.lineStyle(2.5, 0x1A1A24, 0.85);
    this.turnerArmsGraphics.stroke();

    // Handle Grip
    this.turnerArmsGraphics.fillStyle(0xED8936, 1.0);
    this.turnerArmsGraphics.fillCircle(rightHandX, rightHandY, 8);
    this.turnerArmsGraphics.lineStyle(2, 0x7B341E, 1.0);
    this.turnerArmsGraphics.strokeCircle(rightHandX, rightHandY, 8);
  }

  // --- Real-time Character Selection Switch ---
  private handleSetCharacters(selection: { leftTurnerId: string; rightTurnerId: string; jumperId: string }) {
    this.leftTurnerId = selection.leftTurnerId;
    this.rightTurnerId = selection.rightTurnerId;
    this.currentJumperId = selection.jumperId;

    if (this.textures.exists(`texture_${this.leftTurnerId}`)) {
      this.leftTurnerSprite.setTexture(`texture_${this.leftTurnerId}`);
    }
    if (this.textures.exists(`texture_${this.rightTurnerId}`)) {
      this.rightTurnerSprite.setTexture(`texture_${this.rightTurnerId}`);
    }
    this.jumpers.forEach((jumper) => {
      const sheetKey = `sheet_${this.currentJumperId}`;
      if (this.textures.exists(sheetKey)) {
        jumper.sprite.setTexture(sheetKey);
      }
    });
  }
}
