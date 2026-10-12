import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { GameScene } from "./scenes/GameScene";
import { GameSettings, CameraAngle, CameraMode } from "./logic/types";

export class DoubleDutchGame {
  private game: any = null;
  private containerElement: HTMLElement;
  private resizeObserver: ResizeObserver | null = null;
  private resizeTimeouts: number[] = [];

  constructor(container: HTMLElement) {
    this.containerElement = container;
  }

  public init(settings: GameSettings, hasPlayedFirstGame: boolean = false) {
    if (this.game) {
      this.destroy();
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: this.containerElement,
      width: 960,
      height: 540,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      backgroundColor: "#1A202C",
      scene: [BootScene, GameScene],
      physics: {
        default: "arcade",
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      callbacks: {
        postBoot: (gameInstance) => {
          // Pass settings to GameScene once BootScene transitions
          gameInstance.scene.getScene("BootScene").events.once("create", () => {
            const gameScene = gameInstance.scene.getScene("GameScene") as GameScene;
            if (gameScene) {
              gameScene.scene.restart({ settings, hasPlayedFirstGame });
            }
          });
        },
      },
    };

    this.game = new Phaser.Game(config);

    // Setup responsive resize listeners
    this.setupResizeListeners();
  }

  private triggerRefresh = () => {
    if (!this.game || !this.game.scale) return;
    try {
      this.game.scale.refresh();
    } catch (e) {
      console.warn("Phaser scale refresh warning:", e);
    }
  };

  public handleResize = () => {
    this.clearResizeTimeouts();
    // Multi-stage refresh to adapt to mobile browser viewport animation easing & address bar collapse
    const delays = [0, 60, 150, 300, 500];
    delays.forEach((delay) => {
      const id = window.setTimeout(this.triggerRefresh, delay);
      this.resizeTimeouts.push(id);
    });
  };

  private clearResizeTimeouts() {
    this.resizeTimeouts.forEach((id) => clearTimeout(id));
    this.resizeTimeouts = [];
  }

  private setupResizeListeners() {
    this.cleanupResizeListeners();

    if (typeof ResizeObserver !== "undefined" && this.containerElement) {
      this.resizeObserver = new ResizeObserver(() => {
        this.handleResize();
      });
      this.resizeObserver.observe(this.containerElement);
    }

    window.addEventListener("resize", this.handleResize);
    window.addEventListener("orientationchange", this.handleResize);
    if (window.screen?.orientation) {
      window.screen.orientation.addEventListener("change", this.handleResize);
    }
  }

  private cleanupResizeListeners() {
    this.clearResizeTimeouts();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    window.removeEventListener("resize", this.handleResize);
    window.removeEventListener("orientationchange", this.handleResize);
    if (window.screen?.orientation) {
      window.screen.orientation.removeEventListener("change", this.handleResize);
    }
  }

  // --- External control actions triggered by React UI ---

  public jumpIn() {
    this.game?.events.emit("REACT_JUMP_IN");
  }

  public jumpOut() {
    this.game?.events.emit("REACT_JUMP_OUT");
  }

  public setCameraMode(mode: CameraMode) {
    this.game?.events.emit("REACT_SET_CAMERA_MODE", mode);
  }

  public setCameraAngle(angle: CameraAngle) {
    this.game?.events.emit("REACT_SET_CAMERA_ANGLE", angle);
  }

  public setZoom(zoom: number) {
    this.game?.events.emit("REACT_SET_ZOOM", zoom);
  }

  public togglePause(isPaused: boolean) {
    this.game?.events.emit("REACT_TOGGLE_PAUSE", isPaused);
  }

  public setCharacters(characters: { leftTurnerId: string; rightTurnerId: string; jumperId: string }) {
    this.game?.events.emit("REACT_SET_CHARACTERS", characters);
  }

  public on(event: string, fn: (...args: any[]) => void, context?: any) {
    this.game?.events.on(event, fn, context);
  }

  public off(event: string, fn?: (...args: any[]) => void, context?: any) {
    this.game?.events.off(event, fn, context);
  }

  public destroy() {
    this.cleanupResizeListeners();
    if (this.game) {
      this.game.destroy(true);
      this.game = null;
    }
  }
}
