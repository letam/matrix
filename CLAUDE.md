# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Digital Rain is a web-based implementation of the "green code rain" effect from The Matrix franchise. It features dual renderer support (WebGL via REGL and WebGPU), 15+ visual presets, and 60+ configurable parameters. The project can be used standalone or as a React component.

## Commands

The project supports both npm and bun as package managers.

```bash
npm run dev          # Format + start Vite dev server
npm run build        # Format + build core and full bundles to dist/
npm run format       # Run ESLint + Prettier
npm run test         # Start http-server and open manual test page
npm run test-bundles # Build + run Vite server with bundled version tests
```

## Architecture

### Dual Renderer System

Two interchangeable renderer implementations in `js/regl/` and `js/webgpu/`:
- **REGLRenderer** (`js/regl/renderer.js`): WebGL-based, uses REGL library
- **WebGPURenderer** (`js/webgpu/renderer.js`): Native WebGPU (beta)

Both extend the base `Renderer` class (`js/renderer.js`) and implement the same interface.

### Rendering Pipeline

Each renderer uses a pass-based architecture where textures flow between stages:
1. **Rain Pass**: Core effect - computes raindrop states via GPU textures, renders glyphs using MSDF (multi-channel signed distance field)
2. **Bloom Pass**: Glow effect with multi-scale blur
3. **Effect Pass**: Color mapping (palette, stripes, image, mirror modes)
4. **End Pass** (WebGPU only): Final canvas compositing

### Key Files

- `js/main.js` - Vanilla JS entry point
- `js/Matrix.jsx` - React component wrapper
- `js/utils/config.js` - Configuration system with presets and 60+ parameters
- `js/staticAssets.js` - Dynamic asset loader for shaders and images

### Shaders

- `shaders/glsl/` - OpenGL ES shaders for REGL renderer
- `shaders/wgsl/` - WebGPU shaders

### Build Outputs

- `dist/digital-rain.core.es.js` / `.cjs` - Core bundle (no React dependency)
- `dist/digital-rain.full.es.js` / `.cjs` - Full bundle with all features

## Configuration

### URL Parameters

The effect supports extensive customization via URL parameters. Two special parameters provide quick color customization:

#### colorMap
Simple hue-based color mapping from a single keyword. Generates palette and cursor colors automatically.

Available: `green`, `blue`, `cyan`, `red`, `orange`, `yellow`, `purple`, `magenta`, `pink`

Example: `?colorMap=cyan`

#### colorScheme
Preset color schemes with hand-crafted palettes and custom settings.

Available: `classic`, `blue`, `cyan`, `electricBlue`, `fire`, `lava`, `sunset`, `purple`, `magenta`, `pink`, `heaven`, `hell`

Special schemes:
- `heaven`: Light background with adjusted intensity
- `hell`: Enhanced bloom effects

Example: `?colorScheme=fire`

#### Parameter Precedence
Configuration values are applied in this order (later overrides earlier):
1. Default values
2. Version presets (`?version=operator`, `?version=resurrections`, etc.)
3. `colorScheme` parameter
4. `colorMap` parameter
5. Individual URL parameters (e.g., `?cursorIntensity=5`)

Examples:
```
?colorScheme=fire
?colorMap=cyan
?version=operator&colorScheme=lava
?colorScheme=fire&cursorIntensity=5&glyphEdgeCrop=0.1
```

All 60+ configuration parameters can be set via URL parameters. See `js/utils/config.js` for the complete list.

## Code Style

- Uses tabs for indentation, 100 character print width
- ESLint with React hooks plugin
- Prettier for formatting (runs automatically with `npm run dev` and `npm run build`)
