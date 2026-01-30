/**
 * Configuration UI integration module.
 * Coordinates context menu, config panel, and event handling.
 */

import { isInCorner } from "./cornerDetector.js";
import { ContextMenu } from "./contextMenu.js";
import { ConfigPanel } from "./configPanel.js";

let contextMenu = null;
let configPanel = null;
let pauseButton = null;
let rainButton = null;
let renderer = null;
let isInitialized = false;
let buttonsVisible = false;

/**
 * Initialize the configuration UI system
 * @param {Object} config - Current configuration object
 * @param {Object} rendererInstance - The renderer instance to control
 * @param {Object} options - Options for UI initialization
 * @param {boolean} options.showButtons - Whether to show pause/rain buttons (default: true)
 */
export function initConfigUI(config, rendererInstance, options = {}) {
	if (isInitialized) {
		console.warn("Config UI already initialized");
		return;
	}

	const { showButtons = true } = options;

	renderer = rendererInstance;

	// Create context menu
	contextMenu = new ContextMenu();
	const menuEl = contextMenu.create();
	document.body.appendChild(menuEl);

	// Create config panel
	configPanel = new ConfigPanel(config);
	const panelEl = configPanel.create();
	document.body.appendChild(panelEl);

	// Create buttons only if showButtons is true
	if (showButtons) {
		showControlButtons();
	}

	// Wire up context menu to open panel
	contextMenu.onOpenSettings = () => {
		configPanel.show();
	};

	// Wire up context menu to toggle controls
	contextMenu.onToggleControls = () => {
		if (buttonsVisible) {
			hideControlButtons();
		} else {
			showControlButtons();
		}
		contextMenu.updateControlsLabel(buttonsVisible);
	};

	// Set initial label
	contextMenu.updateControlsLabel(buttonsVisible);

	// Set up event listeners
	setupEventListeners();

	isInitialized = true;
}

/**
 * Show the control buttons (pause and rain)
 */
function showControlButtons() {
	if (buttonsVisible) return;

	// Create pause button
	pauseButton = createPauseButton();
	document.body.appendChild(pauseButton);

	// Create rain control button
	rainButton = createRainButton();
	document.body.appendChild(rainButton);

	buttonsVisible = true;
}

/**
 * Hide the control buttons (pause and rain)
 */
function hideControlButtons() {
	if (!buttonsVisible) return;

	if (pauseButton && pauseButton.parentNode) {
		pauseButton.parentNode.removeChild(pauseButton);
		pauseButton = null;
	}

	if (rainButton && rainButton.parentNode) {
		rainButton.parentNode.removeChild(rainButton);
		rainButton = null;
	}

	buttonsVisible = false;
}

/**
 * Create the pause/play button
 * @returns {HTMLElement} The button element
 */
function createPauseButton() {
	const button = document.createElement("button");
	button.className = "pause-button";
	button.innerHTML = "⏸";
	button.title = "Pause/Play (Space)";

	button.addEventListener("click", () => {
		togglePause();
	});

	return button;
}

/**
 * Toggle pause state
 */
function togglePause() {
	if (!renderer) return;

	if (renderer.running) {
		renderer.stop();
		pauseButton.innerHTML = "▶";
		pauseButton.classList.add("paused");
	} else {
		renderer.start();
		pauseButton.innerHTML = "⏸";
		pauseButton.classList.remove("paused");
	}
}

/**
 * Create the rain stop/start button
 * @returns {HTMLElement} The button element
 */
function createRainButton() {
	const button = document.createElement("button");
	button.className = "rain-button";
	button.innerHTML = "🌧";
	button.title = "Stop/Start Rain (R)";

	button.addEventListener("click", () => {
		toggleRain();
	});

	return button;
}

/**
 * Toggle rain state - stops rain or restarts with intro
 */
function toggleRain() {
	if (!renderer) return;

	if (renderer.rainStopped) {
		// Restart rain with intro animation
		renderer.startRain(true);
		rainButton.innerHTML = "🌧";
		rainButton.classList.remove("stopped");
	} else {
		// Stop rain
		renderer.stopRain();
		rainButton.innerHTML = "☀";
		rainButton.classList.add("stopped");
	}
}

/**
 * Set up global event listeners
 */
function setupEventListeners() {
	// Context menu handler
	document.addEventListener("contextmenu", (e) => {
		const x = e.clientX;
		const y = e.clientY;
		const width = window.innerWidth;
		const height = window.innerHeight;

		// Check if click is in a corner region
		if (isInCorner(x, y, width, height)) {
			e.preventDefault();
			contextMenu.show(x, y);
		} else {
			// Allow default context menu outside corners
			contextMenu.hide();
		}
	});

	// Click outside to close context menu
	document.addEventListener("click", (e) => {
		if (contextMenu && contextMenu.isVisible()) {
			// Check if click is outside menu
			if (!contextMenu.element.contains(e.target)) {
				contextMenu.hide();
			}
		}
	});

	// Keyboard shortcuts
	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape") {
			if (configPanel && configPanel.isVisible()) {
				configPanel.hide();
				e.preventDefault();
			} else if (contextMenu && contextMenu.isVisible()) {
				contextMenu.hide();
				e.preventDefault();
			}
		}
		// Spacebar to toggle pause (only when not in an input field)
		if (e.key === " " && !["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) {
			togglePause();
			e.preventDefault();
		}
		// R to toggle rain (only when not in an input field)
		if (e.key === "r" && !["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) {
			toggleRain();
			e.preventDefault();
		}
	});

	// Close context menu when panel opens
	document.addEventListener("click", (e) => {
		if (configPanel && configPanel.isVisible()) {
			if (contextMenu && contextMenu.isVisible()) {
				contextMenu.hide();
			}
		}
	});
}

/**
 * Show the configuration panel
 */
export function showConfigPanel() {
	if (configPanel) {
		configPanel.show();
	}
}

/**
 * Hide the configuration panel
 */
export function hideConfigPanel() {
	if (configPanel) {
		configPanel.hide();
	}
}

/**
 * Toggle the configuration panel
 */
export function toggleConfigPanel() {
	if (configPanel) {
		configPanel.toggle();
	}
}

/**
 * Cleanup and destroy UI components
 */
export function destroyConfigUI() {
	if (contextMenu) {
		contextMenu.destroy();
		contextMenu = null;
	}

	if (configPanel) {
		configPanel.destroy();
		configPanel = null;
	}

	if (pauseButton && pauseButton.parentNode) {
		pauseButton.parentNode.removeChild(pauseButton);
		pauseButton = null;
	}

	if (rainButton && rainButton.parentNode) {
		rainButton.parentNode.removeChild(rainButton);
		rainButton = null;
	}

	renderer = null;
	isInitialized = false;
}
