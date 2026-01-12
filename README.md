# auto-pixi8-signals-ts

TypeScript-Modularisierung der ursprünglichen HTML-Demo.

## Start

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Module-Übersicht

- `src/main.ts`: App-Start, Ticker, globale Hotkeys
- `src/ui.ts`: UI-Refs, Sync, Toast, Event-Bindings
- `src/camera.ts`: Kamera (Pan/Zoom/Clamp)
- `src/world.ts`: Welt-Generierung, Nodes/Edges, Rendering
- `src/pathfinding.ts`: A* auf dem Node-Graph
- `src/signals.ts`: Stop/Ampel/Bahnübergang (State + Rendering + Regeln)
- `src/car.ts`: Car-Entity, Traffic-Reconcile, Bewegung + Signal-Compliance
- `src/input.ts`: Pointer/Keyboard-Interaktion (Ziel, Spawn, Sperren, Signale)
