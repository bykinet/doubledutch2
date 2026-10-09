# doubledutch

Double Dutch Jumping - A timing-based rhythmic mini-game.

## Tech Stack
- Vite + React + TypeScript
- Phaser 3 for real-time game loop & timing judgment
- Firebase (Auth, Firestore, Cloud Functions)
- Feature-Sliced Design (FSD) architecture
- i18next (English & Korean)

## Features
- Dynamic dual-rope physics with anime-styled graphics and cel-shaded characters
- Zero-latency client-side timing judgment (Perfect / Good / Miss)
- Up to 5 simultaneous auto-jumping jumpers with FIFO Jump-in and Jump-out mechanics
- 4 camera angles (Front, Left, Right, High) and 5 zoom levels (0.8x to 1.3x)
- Touch gestures (swipe to switch perspectives) and mobile-optimized 390px layout
- Anonymous Guest mode, Email & Password, Phone (internal e164), and Google sign-in
- Fair difficulty/speed-based leaderboards, safe-zone indicator, and sound effects
