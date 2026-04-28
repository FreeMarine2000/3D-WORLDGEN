# 3D-WORLDGEN

3D-WORLDGEN is a **Vite + Three.js (3JS)** project for generating and viewing a 3D world in the browser.

## Requirements

- **Git**
- **Node.js 18+** (recommended)
- A modern browser (Chrome / Firefox / Edge)

## Setup

### 1) Clone

```bash
git clone https://github.com/FreeMarine2000/3D-WORLDGEN.git
cd 3D-WORLDGEN
```

### 2) Install dependencies

```bash
npm install
```

### 3) Run the dev server

```bash
npm run dev
```

Vite will print a local URL (commonly `http://localhost:5173`). Open it in your browser.

### 4) Build for production

```bash
npm run build
```

### 5) Preview the production build

```bash
npm run preview
```

## Tech Stack

- **Vite** (dev server + build)
- **Three.js** (3D rendering)

## Troubleshooting

- **Blank screen**: open DevTools Console and check for errors.
- **Assets not loading**: ensure asset paths follow Vite conventions (typically `public/` for static files).
- **WebGL issues**: confirm hardware acceleration is enabled and your GPU/browser supports WebGL.

## License

Add a `LICENSE` file if you want to define usage terms.
