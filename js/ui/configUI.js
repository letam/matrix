/**
 * Configuration UI integration module.
 * Coordinates context menu, config panel, and event handling.
 */

import { isInCorner } from "./cornerDetector.js";
import { ContextMenu } from "./contextMenu.js";
import { ConfigPanel } from "./configPanel.js";

let contextMenu = null;
let configPanel = null;
let isInitialized = false;

/**
 * Initialize the configuration UI system
 * @param {Object} config - Current configuration object
 */
export function initConfigUI(config) {
	if (isInitialized) {
		console.warn("Config UI already initialized");
		return;
	}

	// Create context menu
	contextMenu = new ContextMenu();
	const menuEl = contextMenu.create();
	document.body.appendChild(menuEl);

	// Create config panel
	configPanel = new ConfigPanel(config);
	const panelEl = configPanel.create();
	document.body.appendChild(panelEl);

	// Wire up context menu to open panel
	contextMenu.onOpenSettings = () => {
		configPanel.show();
	};

	// Set up event listeners
	setupEventListeners();

	isInitialized = true;
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

	// Escape key to close panel
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

	isInitialized = false;
}
