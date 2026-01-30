precision highp float;

// This shader is the star of the show.
// It writes falling rain to the channels of a data texture:
// 		R: raindrop brightness
// 		G: whether the cell is a "cursor"
// 		B: whether the cell is "activated" — to animate the intro
// 		A: unused

// Listen.
// I understand if this shader looks confusing. Please don't be discouraged!
// It's just a handful of sine and fract functions. Try commenting parts out to learn
// how the different steps combine to produce the result. And feel free to reach out. -RM

#define PI 3.14159265359
#define SQRT_2 1.4142135623730951
#define SQRT_5 2.23606797749979

uniform sampler2D previousRaindropState, introState;
uniform float numColumns, numRows;
uniform float time, tick;
uniform float animationSpeed, fallSpeed;
uniform float framesSinceRainReset;

uniform bool loops, skipIntro, rainStopped;
uniform float brightnessDecay;
uniform float raindropLength;
uniform float rainStopTime;
uniform int rainStopEffect; // 0 = per-glyph cycle, 1 = per-column cycle, 2 = bottom-up, 3 = top-down

// Helper functions for generating randomness, borrowed from elsewhere

highp float randomFloat( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract(sin(sn) * c);
}

vec2 randomVec2( const in vec2 uv ) {
	return fract(vec2(sin(uv.x * 591.32 + uv.y * 154.077), cos(uv.x * 391.32 + uv.y * 49.077)));
}

float wobble(float x) {
	return x + 0.3 * sin(SQRT_2 * x) + 0.2 * sin(SQRT_5 * x);
}

// This is the code rain's key underlying concept.
// It's why glyphs that share a column are lit simultaneously, and are brighter toward the bottom.
// It's also why those bright areas are truncated into raindrops.
float getRainBrightness(float simTime, vec2 glyphPos) {
	float columnTimeOffset = randomFloat(vec2(glyphPos.x, 0.)) * 1000.;
	float columnSpeedOffset = randomFloat(vec2(glyphPos.x + 0.1, 0.)) * 0.5 + 0.5;
	if (loops) {
		columnSpeedOffset = 0.5;
	}
	float columnTime = columnTimeOffset + simTime * fallSpeed * columnSpeedOffset;
	float rainTime = (glyphPos.y * 0.01 + columnTime) / raindropLength;
	if (!loops) {
		rainTime = wobble(rainTime);
	}
	return 1.0 - fract(rainTime);
}

// Main function

vec4 computeResult(float simTime, bool isFirstFrame, vec2 glyphPos, vec4 previous, vec4 intro) {
	float brightness = getRainBrightness(simTime, glyphPos);
	float brightnessBelow = getRainBrightness(simTime, glyphPos + vec2(0., -1.));

	float introProgress = intro.r - (1. - glyphPos.y / numRows);
	float introProgressBelow = intro.r - (1. - (glyphPos.y - 1.) / numRows);

	bool activated = bool(previous.b) || skipIntro || introProgress > 0.;
	bool activatedBelow = skipIntro || introProgressBelow > 0.;

	bool cursor = brightness > brightnessBelow || (activated && !activatedBelow);

	// Blend the glyph's brightness with its previous brightness, so it winks on and off organically
	if (!isFirstFrame) {
		float previousBrightness = previous.r;
		brightness = mix(previousBrightness, brightness, brightnessDecay);
	}

	// ============================================================
	// RAIN STOP EFFECTS
	// Controls how rain fades when stopped (renderer.rainStopEffect)
	// ------------------------------------------------------------
	// Effect 0: Per-glyph cycle - fades when each glyph enters new cycle (top-down staggered)
	// Effect 1: Per-column cycle - entire column fades together when cycle completes
	// Effect 2: Bottom-to-top wipe - lower glyphs fade first, sweeps upward
	// Effect 3: Top-to-bottom - streams fall to bottom without fading prematurely
	// ============================================================
	if (rainStopped && rainStopTime >= 0.0) {
		bool shouldFade = false;
		float stopSimTime = rainStopTime * animationSpeed;

		// Common column timing calculations
		float columnTimeOffset = randomFloat(vec2(glyphPos.x, 0.)) * 1000.;
		float columnSpeedOffset = randomFloat(vec2(glyphPos.x + 0.1, 0.)) * 0.5 + 0.5;
		if (loops) {
			columnSpeedOffset = 0.5;
		}
		float columnTimeAtStop = columnTimeOffset + stopSimTime * fallSpeed * columnSpeedOffset;
		float columnTimeNow = columnTimeOffset + simTime * fallSpeed * columnSpeedOffset;
		float timeSinceStop = columnTimeNow - columnTimeAtStop;

		if (rainStopEffect == 1) {
			// EFFECT 1: Per-column cycle
			// Entire column fades when its rain cycle completes
			float cycleAtStop = floor(columnTimeAtStop / raindropLength);
			float cycleNow = floor(columnTimeNow / raindropLength);
			shouldFade = cycleNow > cycleAtStop;

		} else if (rainStopEffect == 2) {
			// EFFECT 2: Bottom-to-top wipe
			// Lower glyphs fade first, creating upward sweep
			float timeToReachBottom = glyphPos.y * 0.01;
			shouldFade = timeSinceStop > timeToReachBottom;

		} else if (rainStopEffect == 3) {
			// EFFECT 3: Top-to-bottom
			// Streams fall to bottom without fading prematurely
			float timeToFade = (numRows - glyphPos.y) * 0.01;
			shouldFade = timeSinceStop > timeToFade;

		} else {
			// EFFECT 0 (default): Per-glyph cycle
			// Each glyph fades when it enters a new rain cycle (includes Y position)
			float rainTimeAtStop = (glyphPos.y * 0.01 + columnTimeAtStop) / raindropLength;
			float rainTimeNow = (glyphPos.y * 0.01 + columnTimeNow) / raindropLength;
			float cycleAtStop = floor(rainTimeAtStop);
			float cycleNow = floor(rainTimeNow);
			shouldFade = cycleNow > cycleAtStop;
		}

		if (shouldFade) {
			brightness = mix(previous.r, 0.0, brightnessDecay);
			cursor = false;
			activated = false;
		}
	}

	vec4 result = vec4(brightness, cursor, activated, introProgress);
	return result;
}

void main()	{
	float simTime = time * animationSpeed;
	// Use framesSinceRainReset to detect first frame after rain reset (buffers cleared)
	// This ensures we don't blend with cleared (zero) buffer values
	bool isFirstFrame = tick <= 1. || framesSinceRainReset <= 1.;
	vec2 glyphPos = gl_FragCoord.xy;
	vec2 screenPos = glyphPos / vec2(numColumns, numRows);
	vec4 previous = texture2D( previousRaindropState, screenPos );
	vec4 intro = texture2D( introState, vec2(screenPos.x, 0.) );
	gl_FragColor = computeResult(simTime, isFirstFrame, glyphPos, previous, intro);
}
