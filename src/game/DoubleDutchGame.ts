import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { GameScene } from "./scenes/GameScene";
import { GameSettings, CameraAngle, CameraMode } from "./logic/types";

export class DoubleDutchGame {
  private game: any = null;
  private containerElement: HTMLElement;

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
    if (this.game) {
      this.game.destroy(true);
      this.game = null;
    }
  }
}
