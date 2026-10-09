# Double Dutch Jumping - Asset Specifications

## Overview
This document specifies the sprite sheets, frame sequences, dimensions, and anime cel-shaded visual requirements for the Double Dutch jumping game.

## Sprites & Sequences

### 1. Jumper Sprite (`jumper_sprite`)
- **Frame Dimensions**: 64 x 96 px (or scalable vector canvas texture)
- **Cel-shaded Anime Style**: Bold outlines (1.5px ink), vibrant flat fills with 2-tone cel-shading, dynamic hair and clothing motion.
- **States & Frame Layout**:
  - `idle`: 1 frame (standing ready, relaxed athletic stance).
  - `enter`: 4 frames (dynamic hop forward into the rope zone).
  - `jump`: 8 frames (cyclical jump loop synced with rope timing):
    - Frame 0: Crouch / preload
    - Frame 1: Takeoff
    - Frame 2: Ascending
    - Frame 3: Near apex
    - Frame 4: **Apex (Highest peak)** - Exactly matches front/back rope passing at lowest feet level (~180°)
    - Frame 5: Descending
    - Frame 6: Landing impact (slight flex)
    - Frame 7: Spring / recovery to takeoff
  - `exit`: 3 frames (dash/hop backward out of the rope zone).
  - `trip`: 4 frames (caught on rope, stumble / stumble recovery).

### 2. Turner Sprites (`turner_left`, `turner_right`)
- **Frame Dimensions**: 64 x 96 px
- **Cel-shaded Anime Style**: Side-facing athletic turners holding rope ends with rhythmic whole-body sway and arm rotation.
- **Arm Rotation**: 8 frames per full 360° rotation:
  - Synchronized with front rope `angle`:
    - Frame 0: Angle 0° (Arm high, rope at apex)
    - Frame 1: Angle 45°
    - Frame 2: Angle 90° (Arm forward)
    - Frame 3: Angle 135°
    - Frame 4: Angle 180° (Arm down, rope skimming ground)
    - Frame 5: Angle 225°
    - Frame 6: Angle 270° (Arm back)
    - Frame 7: Angle 315°
- **Left Turner**: Turns clockwise/counter-clockwise as required for dual rope opposition.
- **Right Turner**: Mirrored orientation, turning in counter-phase.

### 3. Dynamic Ropes
- Ropes are drawn procedurally every frame using Phaser Graphics / cubic Bézier curves (not static sprite sheets).
- Features anime-styled dual outlines with dynamic speed trailing and color coding:
  - Front rope: Vibrant orange/cyan with slight glow.
  - Back rope: Complementary deep indigo/magenta with depth fade.

### 4. Background & Court
- Japanese anime school gymnasium / outdoor sunny urban rooftop court.
- Multi-layered parallax backdrop responding to camera modes:
  - Layer 0: Distant anime sky with cumulus clouds / city skyline.
  - Layer 1: Gym wall / railing / bleachers.
  - Layer 2: Polished wooden floor with reflective sheen and subtle rope shadow projection.
  - Layer 3: Safe-zone floor indicator (active during first game or Easy/Med difficulty).
