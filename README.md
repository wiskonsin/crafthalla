# CraftHalla

A real-time strategy (RTS) base-defense game built entirely in the browser with React and Three.js. Defend your headquarters, harvest minerals, build structures, and survive waves of enemies — all rendered in 3D.

> **Created by [@techhalla](https://x.com/techhalla)** through vibe coding, powered by AI assistance from **Grok** and **Cursor**.
>
> Image presets generated with **[Freepik](https://referral.freepik.com/mzHqDWB)** | 3D model presets created with **[Tripo AI](https://studio.tripo3d.ai/?via=techhalla&invite_code=QAO5TH)**

---

## Features

- **3D Isometric Gameplay** — Full Three.js rendering with real-time lighting, shadows, and particle effects
- **Base Building** — Construct headquarters, generators, turrets, AA turrets, sub-bases, and walls
- **Resource Harvesting** — Automated harvester trucks mine procedural mineral rocks and return ore to base
- **Wave-Based Combat** — Enemies spawn in escalating waves with increasing difficulty
- **Fog of War** — Dynamic fog that follows terrain height, revealed by buildings and harvesters
- **Terrain Customization** — Swap ground tiles, rock textures, toggle grass, and preview changes live
- **Custom 3D Models** — Upload your own GLB models for buildings, enemies, and units
- **Procedural Generation** — Terrain relief, mineral rock formations, and cloud systems are generated each game
- **Construction Animations** — Buildings rise from the ground with engineer welding effects
- **Harvester POV Camera** — Select a harvester and ride along in first-person view with a full HUD
- **In-Game Music Player** — Built-in music player with playlist controls
- **Plasma Generators** — Generators feature animated plasma orbs with electric arcs
- **Influence Halos** — Smooth union of building influence areas with electric arc effects
- **Terrain Effects** — Dirt patches around buildings, tire tracks, missile craters with smoke

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **UI Framework** | [React 19](https://react.dev/) |
| **3D Engine** | [Three.js](https://threejs.org/) via [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) |
| **3D Utilities** | [@react-three/drei](https://github.com/pmndrs/drei) |
| **Physics** | [@react-three/rapier](https://github.com/pmndrs/react-three-rapier) (Rapier WASM) |
| **State Management** | [Zustand](https://zustand-demo.pmnd.rs/) |
| **Local Storage** | [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) via [idb](https://github.com/jakearchibald/idb) |
| **Build Tool** | [Vite](https://vitejs.dev/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Noise Generation** | [simplex-noise](https://github.com/jwagner/simplex-noise.js) + [seedrandom](https://github.com/davidbau/seedrandom) |

## Getting Started

### Prerequisites

- **[Node.js](https://nodejs.org/)** (v18 or higher recommended) — if you don't have it, download the LTS version from the official website and install it. This also installs `npm`.

Verify your installation:

```bash
node --version
npm --version
```

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/techhalla/crafthalla.git
cd crafthalla
```

2. **Install dependencies**

```bash
npm install
```

3. **Start the development server**

```bash
npm run dev
```

4. **Open in your browser**

Navigate to the URL shown in your terminal (typically `http://localhost:5173`).

### Building for Production

```bash
npm run build
```

The output will be in the `dist/` folder, ready to be deployed to any static hosting service (Vercel, Netlify, GitHub Pages, etc.).

### Preview the Production Build

```bash
npm run preview
```

## Project Structure

```
crafthalla/
├── public/
│   ├── models/          # Default GLB 3D models
│   ├── music/           # Background music tracks (OST)
│   └── tiles/           # Terrain and rock texture tiles
├── src/
│   ├── components/
│   │   ├── custom/      # Model & terrain customization editors
│   │   ├── game/        # All in-game 3D components
│   │   └── ui/          # UI overlays (menus, HUD, settings)
│   ├── config/          # Game constants and configuration
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities (storage, currency, random)
│   ├── stores/          # Zustand state stores
│   ├── systems/         # Core systems (terrain heightmap, etc.)
│   └── types/           # TypeScript type definitions
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Controls

| Action | Input |
|--------|-------|
| **Pan Camera** | Middle mouse drag / Arrow keys |
| **Zoom** | Scroll wheel |
| **Rotate Camera** | Right mouse drag |
| **Place Building** | Select from build bar, left-click on terrain |
| **Rotate Wall** | Right-click before placing |
| **Select Harvester** | Left-click on a harvester truck |
| **POV Mode** | Click the POV button after selecting a harvester |
| **Open Menu** | Click MENU in the top bar |

## Customization

CraftHalla features a full **Custom Model Setup** screen where you can:

- Upload custom **GLB 3D models** for any building, unit, or enemy type
- Adjust model **scale, position, rotation**, and animation settings
- Swap **ground tile textures** between Normal, Exoplanet, or upload your own
- Change **rock textures** with your own seamless tiles
- Toggle **grass** on/off
- Preview all changes in real-time before starting

## License

This project is licensed under the **GNU General Public License v3.0** — see the [LICENSE](LICENSE) file for details.

## Credits

- **Game Design & Development**: [@techhalla](https://x.com/techhalla)
- **AI Coding Assistance**: Grok (xAI) & Cursor
- **Image Generation Presets**: [Freepik](https://referral.freepik.com/mzHqDWB)
- **3D Model Generation**: [Tripo AI](https://studio.tripo3d.ai/?via=techhalla&invite_code=QAO5TH)

---

*Built with vibe coding — where creativity meets AI.*
