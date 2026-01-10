/**
 * Context menu component for right-click menu in corner regions.
 * Displays options for opening the configuration panel.
 */

export class ContextMenu {
	constructor() {
		this.element = null;
		this.onOpenSettings = null;
	}

	/**
	 * Create the context menu DOM element
	 * @returns {HTMLElement} The menu element
	 */
	create() {
		const menu = document.createElement("div");
		menu.className = "matrix-context-menu";
		menu.style.display = "none";

		const settingsItem = document.createElement("div");
		settingsItem.className = "menu-item";
		settingsItem.textContent = "⚙️ Open Settings";
		settingsItem.addEventListener("click", () => {
			if (this.onOpenSettings) {
				this.onOpenSettings();
			}
			this.hide();
		});

		menu.appendChild(settingsItem);
		this.element = menu;

		return menu;
	}

	/**
	 * Show the context menu at the specified position
	 * @param {number} x - Mouse X coordinate
	 * @param {number} y - Mouse Y coordinate
	 */
	show(x, y) {
		if (!this.element) return;

		// Adjust position to keep menu within viewport
		const menuWidth = 180;
		const menuHeight = 50;
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;

		let adjustedX = x;
		let adjustedY = y;

		if (x + menuWidth > viewportWidth) {
			adjustedX = viewportWidth - menuWidth - 10;
		}

		if (y + menuHeight > viewportHeight) {
			adjustedY = viewportHeight - menuHeight - 10;
		}

		this.element.style.left = adjustedX + "px";
		this.element.style.top = adjustedY + "px";
		this.element.style.display = "block";
	}

	/**
	 * Hide the context menu
	 */
	hide() {
		if (this.element) {
			this.element.style.display = "none";
		}
	}

	/**
	 * Check if the menu is currently visible
	 * @returns {boolean} True if visible
	 */
	isVisible() {
		return this.element && this.element.style.display !== "none";
	}

	/**
	 * Destroy the context menu
	 */
	destroy() {
		if (this.element && this.element.parentNode) {
			this.element.parentNode.removeChild(this.element);
		}
		this.element = null;
		this.onOpenSettings = null;
	}
}
