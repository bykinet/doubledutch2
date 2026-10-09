/// <reference types="vite/client" />

declare namespace Phaser {
  export const AUTO: any;
  export const Scale: any;
  export const Curves: any;
  export const Math: any;
  export const Scene: any;
  export const Game: any;
  export namespace Types {
    export namespace Core {
      export type GameConfig = any;
    }
  }
  export namespace GameObjects {
    export type Sprite = any;
    export type Graphics = any;
    export type Image = any;
    export type Text = any;
  }
}

declare module "phaser" {
  export = Phaser;
}

declare module "firebase/auth";
declare module "firebase/firestore";
declare module "firebase/app";
declare module "firebase/analytics";
declare module "canvas-confetti";
declare module "lucide-react";
