# 3D-WORLDGEN

3D-WORLDGEN is a web-based project (JavaScript/CSS/HTML) for generating and viewing a 3D world in the browser.

## Requirements

- **Git** (to clone the repository)
- A modern web browser (latest **Chrome**, **Firefox**, or **Edge** recommended)
- **Node.js** (recommended) if you want to run a local dev server
  - Recommended: Node.js **18+**

> Note: This project is primarily front-end. If you open `index.html` directly it may work, but some browsers restrict certain features (like module imports or asset loading) when using the `file://` protocol. Using a local server is recommended.

## Setup

### 1) Clone the repo

```bash
git clone https://github.com/FreeMarine2000/3D-WORLDGEN.git
cd 3D-WORLDGEN
```

### 2) Run locally (recommended)

Pick one option:

#### Option A: Node.js static server

If you already have Node.js installed, you can use a simple static server.

**Using `npx serve`:**

```bash
npx serve
```

Then open the URL it prints (typically `http://localhost:3000`).

#### Option B: VS Code Live Server

1. Install the **Live Server** extension in VS Code.
2. Open this repository folder in VS Code.
3. Right-click `index.html` and choose **Open with Live Server**.

### 3) Open in browser (fallback)

If the project does not rely on module imports or restricted assets, you may be able to open it directly:

- Double-click `index.html`

If you run into loading errors, use one of the local server options above.

## Project Structure (typical)

- `index.html` — entry point
- `*.js` — application logic / rendering / world generation
- `*.css` — styles
- `assets/` (if present) — textures/models/etc.

## Troubleshooting

- **Blank screen**: Check the browser console (DevTools) for errors.
- **CORS / module errors** when opening `index.html` directly: run with a local server.
- **Performance issues**: try a different browser, reduce any render settings if available, and close other GPU-heavy apps.

## License

If you intend to add a license, create a `LICENSE` file and update this section.
