# Rain Stop/Resume Fix

This document describes the fix for visual glitches that occurred when stopping and resuming rain using the R key.

## Problem

When rain was stopped and then resumed, users observed:
1. Rain glyphs shifting or jerking to different positions
2. Stuttering animation on some columns
3. Gradual fade-in instead of immediate appearance

## Root Causes

Two separate issues were identified:

### 1. Time Base Mismatch

The base `Renderer` class used `performance.now() / 1000` for timing calculations in `startRain()` and `stopRain()`. However, the shaders receive time from REGL's internal clock (`ctx.time`), which starts from when the REGL context was created, not from page load.

If there's any delay between page load and REGL initialization, these time bases diverge, causing:
- `rainTimeOffset` to be computed in the wrong time domain
- Rain appearing at incorrect positions after reset

### 2. Buffer Blending with Cleared Values

When rain is reset, all double buffers (intro, raindrop, symbol, effect) are cleared to zero. However, the shaders use an `isFirstFrame` check based on REGL's `tick` counter to decide whether to blend with previous values:

```glsl
bool isFirstFrame = tick <= 1.;
if (!isFirstFrame) {
    brightness = mix(previousBrightness, brightness, brightnessDecay);
}
```

Since `tick` keeps incrementing and is never reset, `isFirstFrame` was always `false` after the initial startup. This caused shaders to blend new values with the cleared (zero) buffer values, resulting in gradual fade-in and stuttering.

## Solution

### Fix 1: Consistent Time Base

Added `_getCurrentRenderTime()` method to the base `Renderer` class that subclasses can override:

```javascript
// Base Renderer
_getCurrentRenderTime() {
    return performance.now() / 1000;
}

// REGL Renderer override
_getCurrentRenderTime() {
    return this.#regl ? this.#regl.now() : super._getCurrentRenderTime();
}
```

The `startRain()` and `stopRain()` methods now use `_getCurrentRenderTime()` instead of `performance.now() / 1000` directly.

### Fix 2: Frame Counter for Reset Detection

Added a `framesSinceRainReset` counter to track frames since the last rain reset:

1. Counter resets to 0 when `startRain(true)` is called
2. REGL renderer increments it after each frame
3. Counter is passed to all rain pass shaders as a uniform
4. Shaders check both conditions for first frame:

```glsl
bool isFirstFrame = tick <= 1. || framesSinceRainReset <= 1.;
```

This ensures shaders skip blending with previous values on the first frame after a reset.

## Files Modified

### JavaScript
- `js/renderer.js` - Added `_getCurrentRenderTime()`, `framesSinceRainReset` counter, getter, and increment method
- `js/regl/renderer.js` - Override `_getCurrentRenderTime()` to use `regl.now()`, pass frame counter to rain pass, increment after render
- `js/regl/rainPass.js` - Accept and pass `framesSinceRainReset` uniform to all shader passes

### Shaders
- `shaders/glsl/rainPass.intro.frag.glsl`
- `shaders/glsl/rainPass.raindrop.frag.glsl`
- `shaders/glsl/rainPass.symbol.frag.glsl`
- `shaders/glsl/rainPass.effect.frag.glsl`

All shaders now declare `uniform float framesSinceRainReset` and use it in the `isFirstFrame` check.

## Testing

1. Run `npm run dev`
2. Let the rain animation run for several seconds
3. Press R to stop rain
4. Wait for rain to fade out
5. Press R to resume rain
6. Verify rain restarts cleanly without jerking, shifting, or gradual fade-in
