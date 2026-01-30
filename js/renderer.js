import fetchLibraries from "./fetchLibraries.js";

export default class Renderer {
	static libraries = fetchLibraries();
	#type;
	#canvas;
	#ready;
	#width = 300;
	#height = 150;
	#fullscreen = false;
	#cache = new Map();
	#destroyed = false;
	#running = false;
	#pausedTime = 0;
	#pauseStartTime = null;
	#rainTimeOffset = 0;
	#rainStopped = false;
	#rainStopTime = -1;
	#rainStopEffect = 0; // 0 = per-glyph cycle, 1 = uniform cutoff
	#framesSinceRainReset = 0;

	constructor(type, ready) {
		this.#type = type;
		this.#canvas = document.createElement("canvas");
		this.#ready = Renderer.libraries
			.then((libraries) => {
				this.#cache = new Map(libraries.staticAssets);
			})
			.then(ready);
		this.#ready.then(() => this.start());
	}

	get running() {
		return this.#running;
	}

	get pausedTime() {
		return this.#pausedTime;
	}

	get rainStopped() {
		return this.#rainStopped;
	}

	get rainStopTime() {
		return this.#rainStopTime;
	}

	get rainStopEffect() {
		return this.#rainStopEffect;
	}

	set rainStopEffect(value) {
		this.#rainStopEffect = value;
	}

	get framesSinceRainReset() {
		return this.#framesSinceRainReset;
	}

	incrementFramesSinceRainReset() {
		this.#framesSinceRainReset++;
	}

	/**
	 * Get the current render time in seconds.
	 * Subclasses should override this to return their internal time (e.g., regl.now()).
	 * This ensures timing calculations are consistent with what shaders receive.
	 * @returns {number} Current time in seconds
	 */
	_getCurrentRenderTime() {
		return performance.now() / 1000;
	}

	/**
	 * Get the effective time offset for rain animation.
	 * This accounts for rain-specific resets.
	 * @param {number} currentTime - The current animation time (after pausedTime subtraction)
	 * @returns {number} The time to use for rain calculations
	 */
	getRainTime(currentTime) {
		// Time keeps advancing even when stopped (shader handles fade)
		return currentTime - this.#rainTimeOffset;
	}

	/**
	 * Stop rain from falling (existing rain continues to bottom, no new rain starts)
	 */
	stopRain() {
		if (!this.#rainStopped) {
			this.#rainStopped = true;
			// Record the time when rain was stopped (in rain time units)
			const currentTime = this._getCurrentRenderTime() - this.#pausedTime;
			this.#rainStopTime = currentTime - this.#rainTimeOffset;
		}
	}

	/**
	 * Start/restart rain
	 * @param {boolean} reset - If true, reset to beginning with intro animation
	 */
	startRain(reset = false) {
		if (reset) {
			// Reset rain time to 0 by setting offset to current time
			const currentTime = this._getCurrentRenderTime() - this.#pausedTime;
			this.#rainTimeOffset = currentTime;
			// Reset frame counter so shader knows to skip blending
			this.#framesSinceRainReset = 0;
			// Subclasses should override to also clear buffers
			this._resetRainBuffers();
		}
		this.#rainStopped = false;
		this.#rainStopTime = -1;
	}

	/**
	 * Override in subclass to clear rain buffers
	 */
	_resetRainBuffers() {
		// Base implementation does nothing
	}

	start() {
		if (this.#pauseStartTime !== null) {
			this.#pausedTime += performance.now() / 1000 - this.#pauseStartTime;
			this.#pauseStartTime = null;
		}
		this.#running = true;
		this.update();
	}

	stop() {
		this.#running = false;
		this.#pauseStartTime = performance.now() / 1000;
	}

	update(now) {
		if (!this.#running) return;
		requestAnimationFrame((now) => this.update(now));
	}

	get canvas() {
		return this.#canvas;
	}

	get cache() {
		return this.#cache;
	}

	get type() {
		return this.#type;
	}

	get ready() {
		return this.#ready;
	}

	get size() {
		return [this.#width, this.#height];
	}

	set size([width, height]) {
		[width, height] = [Math.ceil(width), Math.ceil(height)];
		if (width === this.#width && height === this.#height) return;
		[this.#canvas.width, this.#canvas.height] = [this.#width, this.#height] = [width, height];
	}

	get fullscreen() {
		return this.#fullscreen;
	}

	set fullscreen(value) {
		if (!!value === this.#fullscreen) return;
		if (!document.fullscreenEnabled && !document.webkitFullscreenEnabled) return;

		this.#fullscreen = value;
		if (document.fullscreenElement != null) {
			document.exitFullscreen();
		}
		if (this.#fullscreen) {
			if (this.#canvas.webkitRequestFullscreen != null) {
				this.#canvas.webkitRequestFullscreen();
			} else {
				this.#canvas.requestFullscreen();
			}
		}
	}

	async configure(config) {
		await this.ready;
		if (this.destroyed) {
			throw new Error("Cannot configure a destroyed renderer.");
		}
	}

	get destroyed() {
		return this.#destroyed;
	}

	destroy() {
		this.stop();
		this.#destroyed = true;
		this.#cache.clear();
	}
}
