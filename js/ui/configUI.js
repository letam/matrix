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

	// Long press handler for mobile
	let longPressTimer = null;
	let longPressTriggered = false;
	const LONG_PRESS_DURATION = 500; // ms

	// Swipe gestures for mobile:
	// - Right edge swipe left: open config panel
	// - Swipe right on panel: close config panel
	// - Bottom left corner swipe right: toggle controls
	let edgeSwipeStartX = null;
	let panelSwipeStartX = null;
	let cornerSwipeStart = null;
	const EDGE_THRESHOLD = 20; // px from right edge to start swipe
	const CORNER_SIZE = 60; // px from bottom-left corner to start swipe
	const SWIPE_THRESHOLD = 50; // px distance to trigger action

	document.addEventListener("touchstart", (e) => {
		if (e.touches.length !== 1) return;

		const touch = e.touches[0];
		const x = touch.clientX;
		const y = touch.clientY;
		const width = window.innerWidth;
		const height = window.innerHeight;

		// Check for edge swipe from right edge
		if (x > width - EDGE_THRESHOLD && !configPanel.isVisible()) {
			edgeSwipeStartX = x;
		}

		// Check for swipe on config panel to close
		if (configPanel.isVisible() && configPanel.element.contains(e.target)) {
			panelSwipeStartX = x;
		}

		// Check for corner swipe from bottom left
		if (x < CORNER_SIZE && y > height - CORNER_SIZE) {
			cornerSwipeStart = { x, y };
		}

		// Only start timer if touch is in a corner
		if (isInCorner(x, y, width, height)) {
			longPressTriggered = false;
			longPressTimer = setTimeout(() => {
				longPressTriggered = true;
				contextMenu.show(x, y);
			}, LONG_PRESS_DURATION);
		}
	});

	document.addEventListener("touchmove", (e) => {
		// Cancel long press if finger moves
		if (longPressTimer) {
			clearTimeout(longPressTimer);
			longPressTimer = null;
		}

		// Check for edge swipe (right edge -> open config panel)
		if (edgeSwipeStartX !== null && e.touches.length === 1) {
			const touch = e.touches[0];
			const deltaX = edgeSwipeStartX - touch.clientX;

			if (deltaX > SWIPE_THRESHOLD) {
				configPanel.show();
				edgeSwipeStartX = null;
			}
		}

		// Drag panel to close (follow finger)
		if (panelSwipeStartX !== null && e.touches.length === 1) {
			const touch = e.touches[0];
			const deltaX = Math.max(0, touch.clientX - panelSwipeStartX);

			// Disable transition during drag and update position
			configPanel.element.style.transition = "none";
			configPanel.element.style.transform = `translateX(${deltaX}px)`;
		}

		// Check for corner swipe (bottom left -> toggle controls)
		if (cornerSwipeStart !== null && e.touches.length === 1) {
			const touch = e.touches[0];
			const deltaX = touch.clientX - cornerSwipeStart.x;

			if (deltaX > SWIPE_THRESHOLD) {
				if (buttonsVisible) {
					hideControlButtons();
				} else {
					showControlButtons();
				}
				contextMenu.updateControlsLabel(buttonsVisible);
				cornerSwipeStart = null;
			}
		}
	});

	document.addEventListener("touchend", (e) => {
		if (longPressTimer) {
			clearTimeout(longPressTimer);
			longPressTimer = null;
		}
		// Prevent click event if long press was triggered
		if (longPressTriggered) {
			e.preventDefault();
			longPressTriggered = false;
		}
		// Handle panel drag release
		if (panelSwipeStartX !== null && configPanel.isVisible()) {
			const panelWidth = configPanel.element.offsetWidth;
			const currentTransform = configPanel.element.style.transform;
			const match = currentTransform.match(/translateX\((\d+)px\)/);
			const dragDistance = match ? parseInt(match[1]) : 0;

			// Re-enable transition for snap animation
			configPanel.element.style.transition = "";
			configPanel.element.style.transform = "";

			// Close if dragged more than 30% of panel width
			if (dragDistance > panelWidth * 0.3) {
				configPanel.hide();
			}
		}

		// Reset swipe tracking
		edgeSwipeStartX = null;
		panelSwipeStartX = null;
		cornerSwipeStart = null;
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
