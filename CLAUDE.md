# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a web-based implementation of the Matrix digital rain effect (the green falling code from The Matrix films). It runs entirely in the browser using WebGL (via REGL) with experimental WebGPU support.

## Running the Project

Serve with any HTTP server. Example using Python:
```bash
python3 -m http.server
```
Then open `http://localhost:8000` in a browser.

## Code Formatting

```bash
prettier --write --use-tabs --print-width 160 "index.html" "./js/**/**.js" "./lib/gpu-buffer.js"
```

## Architecture

### Entry Point and Renderer Selection
- `index.html` - Loads `js/main.js` as ES module
- `js/main.js` - Detects WebGPU support and loads either `js/regl/main.js` or `js/webgpu/main.js`
- `js/config.js` - Parses URL parameters and merges with version presets and defaults

### Rendering Pipeline
Both renderers (REGL/WebGPU) implement the same pipeline architecture:

1. **Rain Pass** - GPU-computed simulation using double-buffered textures:
   - `intro` buffer - Controls the initial screen fill animation
   - `raindrop` buffer - Tracks raindrop positions and brightness decay
   - `symbol` buffer - Manages glyph cycling
   - Final render outputs glyphs using MSDF (multi-channel signed distance field) textures

2. **Bloom Pass** - Multi-step blur effect:
   - High-pass filter extracts bright areas
   - Gaussian blur via texture pyramid
   - Combines blur with original

3. **Effect Pass** - Color mapping and effects:
   - `palettePass` - Standard color gradient mapping
   - `stripePass` - Vertical color stripes (pride flags, etc.)
   - `imagePass` - Overlays an external image
   - `mirrorPass` - Webcam mirror effect

4. **Quilt Pass** - Special output for Looking Glass holographic displays

### Shader Organization
- `shaders/glsl/` - GLSL fragment/vertex shaders for REGL
- `shaders/wgsl/` - WGSL shaders for WebGPU

### Configuration System
URL parameters override version presets which override defaults. Key structures in `js/config.js`:
- `fonts` - MSDF texture paths and glyph grid dimensions
- `defaults` - Base configuration values
- `versions` - Named presets (classic, resurrections, operator, nightmare, paradise, etc.)
- `paramMapping` - URL parameter parsing rules

### Asset Types
- `assets/*_msdf.png` - Multi-channel signed distance field glyph textures
- `assets/*.ttf` - TrueType fonts (Matrix-Code, Matrix-Resurrected)
- `assets/*.png` - Texture overlays (metal, mesh, sand, pixel_grid)

## Playdate Port

The `playdate/` directory contains a port for the Playdate handheld console with both C and Lua implementations. See `playdate/INSTRUCTIONS.md` for build commands.
