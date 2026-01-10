/**
 * Configuration panel component - sidebar overlay for parameter editing.
 * Organizes 60+ parameters into collapsible categories with appropriate input types.
 */

import { ConfigState } from "./configState.js";

// Parameter definitions organized by category
export const CATEGORIES = {
	presets: {
		title: "Presets",
		params: {
			version: {
				type: "select",
				label: "Version",
				options: [
					"classic",
					"megacity",
					"neomatrixology",
					"operator",
					"nightmare",
					"paradise",
					"resurrections",
					"trinity",
					"morpheus",
					"bugs",
					"palimpsest",
					"twilight",
					"3d",
					"throwback",
					"updated",
					"1999",
					"2003",
					"2021",
				],
			},
			colorScheme: {
				type: "select",
				label: "Color Scheme",
				options: [
					"classic",
					"blue",
					"cyan",
					"electricBlue",
					"fire",
					"lava",
					"sunset",
					"purple",
					"magenta",
					"pink",
					"heaven",
					"hell",
				],
			},
			colorMap: {
				type: "select",
				label: "Color Map",
				options: ["green", "blue", "cyan", "red", "orange", "yellow", "purple", "magenta", "pink"],
			},
			font: {
				type: "select",
				label: "Font",
				options: [
					"matrixcode",
					"coptic",
					"gothic",
					"megacity",
					"resurrections",
					"huberfishA",
					"huberfishD",
					"gtarg_tenretniolleh",
					"gtarg_alientext",
					"neomatrixology",
				],
			},
			effect: {
				type: "select",
				label: "Effect",
				options: [
					"palette",
					"stripe",
					"image",
					"mirror",
					"plain",
					"customStripes",
					"pride",
					"transPride",
					"trans",
					"none",
				],
			},
		},
	},
	visual: {
		title: "Visual Style",
		params: {
			baseTexture: {
				type: "select",
				label: "Base Texture",
				options: [null, "sand", "pixels", "mesh", "metal"],
			},
			glintTexture: {
				type: "select",
				label: "Glint Texture",
				options: [null, "sand", "pixels", "mesh", "metal"],
			},
		},
	},
	animation: {
		title: "Animation",
		params: {
			animationSpeed: { type: "range", label: "Animation Speed", min: 0, max: 5, step: 0.1 },
			fallSpeed: { type: "range", label: "Fall Speed", min: 0, max: 10, step: 0.1 },
			cycleSpeed: { type: "range", label: "Cycle Speed", min: 0, max: 5, step: 0.1 },
			cycleFrameSkip: { type: "number", label: "Cycle Frame Skip", min: 0, max: 60 },
			forwardSpeed: { type: "range", label: "Forward Speed", min: 0, max: 5, step: 0.1 },
			slant: { type: "range", label: "Slant (degrees)", min: -180, max: 180, step: 1 },
		},
	},
	glyph: {
		title: "Glyph Appearance",
		params: {
			glyphEdgeCrop: { type: "range", label: "Edge Crop", min: 0, max: 1, step: 0.01 },
			glyphHeightToWidth: { type: "range", label: "Height to Width", min: 0.5, max: 3, step: 0.1 },
			glyphVerticalSpacing: {
				type: "range",
				label: "Vertical Spacing",
				min: 0.5,
				max: 3,
				step: 0.1,
			},
			glyphFlip: { type: "checkbox", label: "Flip Horizontal" },
			glyphRotation: {
				type: "select",
				label: "Rotation",
				options: [0, 1.5708, 3.14159, 4.71239],
				labels: ["0°", "90°", "180°", "270°"],
			},
			glyphIntensity: { type: "range", label: "Intensity", min: 0, max: 5, step: 0.1 },
		},
	},
	cursor: {
		title: "Cursor & Glint",
		params: {
			isolateCursor: { type: "checkbox", label: "Isolate Cursor" },
			cursorIntensity: { type: "range", label: "Cursor Intensity", min: 0, max: 10, step: 0.1 },
			isolateGlint: { type: "checkbox", label: "Isolate Glint" },
			glintIntensity: { type: "range", label: "Glint Intensity", min: 0, max: 10, step: 0.1 },
		},
	},
	effects: {
		title: "Effects & Bloom",
		params: {
			bloomStrength: { type: "range", label: "Bloom Strength", min: 0, max: 1, step: 0.01 },
			bloomSize: { type: "range", label: "Bloom Size", min: 0, max: 1, step: 0.01 },
			highPassThreshold: {
				type: "range",
				label: "High Pass Threshold",
				min: 0,
				max: 1,
				step: 0.01,
			},
			baseBrightness: { type: "range", label: "Base Brightness", min: -2, max: 2, step: 0.1 },
			baseContrast: { type: "range", label: "Base Contrast", min: 0, max: 5, step: 0.1 },
			glintBrightness: { type: "range", label: "Glint Brightness", min: -2, max: 2, step: 0.1 },
			glintContrast: { type: "range", label: "Glint Contrast", min: 0, max: 5, step: 0.1 },
			brightnessThreshold: {
				type: "range",
				label: "Brightness Threshold",
				min: 0,
				max: 1,
				step: 0.01,
			},
			brightnessDecay: { type: "range", label: "Brightness Decay", min: 0, max: 1, step: 0.01 },
			ditherMagnitude: { type: "range", label: "Dither Magnitude", min: 0, max: 1, step: 0.01 },
		},
	},
	geometry: {
		title: "Geometry",
		params: {
			numColumns: { type: "range", label: "Columns", min: 10, max: 200, step: 1 },
			density: { type: "range", label: "Density", min: 0.1, max: 5, step: 0.1 },
			raindropLength: { type: "range", label: "Raindrop Length", min: 0, max: 10, step: 0.1 },
			rippleTypeName: { type: "select", label: "Ripple Type", options: [null, "circle", "box"] },
			rippleThickness: { type: "range", label: "Ripple Thickness", min: 0, max: 10, step: 0.1 },
			rippleScale: { type: "range", label: "Ripple Scale", min: 0, max: 10, step: 0.1 },
			rippleSpeed: { type: "range", label: "Ripple Speed", min: 0, max: 10, step: 0.1 },
		},
	},
	threeD: {
		title: "3D & Camera",
		params: {
			volumetric: { type: "checkbox", label: "Volumetric Mode" },
			isometric: { type: "checkbox", label: "Isometric" },
			isPolar: { type: "checkbox", label: "Polar Coordinates" },
			useCamera: { type: "checkbox", label: "Use Camera" },
		},
	},
	advanced: {
		title: "Advanced",
		params: {
			renderer: { type: "select", label: "Renderer", options: ["regl", "webgpu"] },
			resolution: { type: "range", label: "Resolution", min: 0.1, max: 2, step: 0.1 },
			fps: { type: "range", label: "FPS", min: 0, max: 60, step: 1 },
			useHalfFloat: { type: "checkbox", label: "Use Half Float" },
			hasThunder: { type: "checkbox", label: "Thunder Effects" },
			loops: { type: "checkbox", label: "Animation Loops" },
			skipIntro: { type: "checkbox", label: "Skip Intro" },
			suppressWarnings: { type: "checkbox", label: "Suppress Warnings" },
		},
	},
};

export class ConfigPanel {
	constructor(initialConfig = {}) {
		this.element = null;
		this.configState = new ConfigState(initialConfig);
		this.collapsedCategories = new Set();
	}

	/**
	 * Create the panel DOM element
	 * @returns {HTMLElement} The panel element
	 */
	create() {
		const panel = document.createElement("div");
		panel.className = "matrix-config-panel";

		// Header
		const header = this.createHeader();
		panel.appendChild(header);

		// Controls (live preview toggle)
		const controls = this.createControls();
		panel.appendChild(controls);

		// Body (all parameters)
		const body = this.createBody();
		panel.appendChild(body);

		// Footer (buttons)
		const footer = this.createFooter();
		panel.appendChild(footer);

		this.element = panel;
		return panel;
	}

	/**
	 * Create header section
	 */
	createHeader() {
		const header = document.createElement("div");
		header.className = "panel-header";

		const title = document.createElement("h2");
		title.textContent = "Matrix Configuration";
		header.appendChild(title);

		const closeBtn = document.createElement("button");
		closeBtn.className = "close-btn";
		closeBtn.textContent = "×";
		closeBtn.addEventListener("click", () => this.hide());
		header.appendChild(closeBtn);

		return header;
	}

	/**
	 * Create controls section (live preview toggle)
	 */
	createControls() {
		const controls = document.createElement("div");
		controls.className = "panel-controls";

		const label = document.createElement("label");

		const checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		checkbox.id = "livePreview";
		checkbox.addEventListener("change", (e) => {
			this.configState.setLivePreview(e.target.checked);
			this.updateApplyButton();
		});

		const text = document.createTextNode("Live Preview");

		label.appendChild(checkbox);
		label.appendChild(text);
		controls.appendChild(label);

		return controls;
	}

	/**
	 * Create body section with all categories and parameters
	 */
	createBody() {
		const body = document.createElement("div");
		body.className = "panel-body";

		for (const [categoryKey, category] of Object.entries(CATEGORIES)) {
			const categoryEl = this.createCategory(categoryKey, category);
			body.appendChild(categoryEl);
		}

		return body;
	}

	/**
	 * Create a category section
	 */
	createCategory(key, category) {
		const categoryEl = document.createElement("div");
		categoryEl.className = "category";
		categoryEl.dataset.category = key;

		// Header
		const header = document.createElement("div");
		header.className = "category-header";
		header.textContent = category.title;
		header.addEventListener("click", () => this.toggleCategory(key, categoryEl));
		categoryEl.appendChild(header);

		// Content
		const content = document.createElement("div");
		content.className = "category-content";

		for (const [paramKey, paramDef] of Object.entries(category.params)) {
			const paramEl = this.createParameter(paramKey, paramDef);
			content.appendChild(paramEl);
		}

		categoryEl.appendChild(content);

		return categoryEl;
	}

	/**
	 * Create a parameter input group
	 */
	createParameter(key, def) {
		const group = document.createElement("div");
		group.className = "param-group";

		switch (def.type) {
			case "checkbox":
				group.appendChild(this.createCheckbox(key, def));
				break;
			case "select":
				group.appendChild(this.createSelect(key, def));
				break;
			case "range":
				group.appendChild(this.createRange(key, def));
				break;
			case "number":
				group.appendChild(this.createNumber(key, def));
				break;
			default:
				group.appendChild(this.createText(key, def));
		}

		return group;
	}

	/**
	 * Create checkbox input
	 */
	createCheckbox(key, def) {
		const label = document.createElement("label");
		label.className = "checkbox-label";

		const input = document.createElement("input");
		input.type = "checkbox";
		input.name = key;
		input.checked = this.configState.getValue(key) || false;
		input.addEventListener("change", (e) => {
			this.configState.setValue(key, e.target.checked);
			this.updateApplyButton();
		});

		const text = document.createTextNode(def.label);

		label.appendChild(input);
		label.appendChild(text);

		return label;
	}

	/**
	 * Create select dropdown
	 */
	createSelect(key, def) {
		const container = document.createDocumentFragment();

		const label = document.createElement("label");
		label.textContent = def.label;
		container.appendChild(label);

		const select = document.createElement("select");
		select.name = key;

		// Add empty option
		const emptyOption = document.createElement("option");
		emptyOption.value = "";
		emptyOption.textContent = "-- Default --";
		select.appendChild(emptyOption);

		// Add options
		def.options.forEach((option, index) => {
			const optionEl = document.createElement("option");
			optionEl.value = option === null ? "" : option;
			optionEl.textContent = def.labels ? def.labels[index] : option === null ? "None" : option;
			select.appendChild(optionEl);
		});

		const currentValue = this.configState.getValue(key);
		select.value = currentValue === null || currentValue === undefined ? "" : currentValue;

		select.addEventListener("change", (e) => {
			const value = e.target.value === "" ? null : e.target.value;
			this.configState.setValue(key, value);
			this.updateApplyButton();
		});

		container.appendChild(select);

		return container;
	}

	/**
	 * Create range slider with number input
	 */
	createRange(key, def) {
		const container = document.createDocumentFragment();

		const label = document.createElement("label");
		label.textContent = def.label;
		container.appendChild(label);

		const wrapper = document.createElement("div");

		const slider = document.createElement("input");
		slider.type = "range";
		slider.name = key;
		slider.min = def.min;
		slider.max = def.max;
		slider.step = def.step || 0.01;
		slider.value = this.configState.getValue(key) || def.min;

		const numberInput = document.createElement("input");
		numberInput.type = "number";
		numberInput.className = "range-value";
		numberInput.min = def.min;
		numberInput.max = def.max;
		numberInput.step = def.step || 0.01;
		numberInput.value = slider.value;

		const syncValues = (value) => {
			slider.value = value;
			numberInput.value = value;
			this.configState.setValue(key, parseFloat(value));
			this.updateApplyButton();
		};

		slider.addEventListener("input", (e) => syncValues(e.target.value));
		numberInput.addEventListener("input", (e) => syncValues(e.target.value));

		wrapper.appendChild(slider);
		wrapper.appendChild(numberInput);
		container.appendChild(wrapper);

		return container;
	}

	/**
	 * Create number input
	 */
	createNumber(key, def) {
		const container = document.createDocumentFragment();

		const label = document.createElement("label");
		label.textContent = def.label;
		container.appendChild(label);

		const input = document.createElement("input");
		input.type = "number";
		input.name = key;
		if (def.min !== undefined) input.min = def.min;
		if (def.max !== undefined) input.max = def.max;
		if (def.step !== undefined) input.step = def.step;
		input.value = this.configState.getValue(key) || "";

		input.addEventListener("change", (e) => {
			const value = e.target.value === "" ? null : parseFloat(e.target.value);
			this.configState.setValue(key, value);
			this.updateApplyButton();
		});

		container.appendChild(input);

		return container;
	}

	/**
	 * Create text input (fallback)
	 */
	createText(key, def) {
		const container = document.createDocumentFragment();

		const label = document.createElement("label");
		label.textContent = def.label;
		container.appendChild(label);

		const input = document.createElement("input");
		input.type = "text";
		input.name = key;
		input.value = this.configState.getValue(key) || "";

		input.addEventListener("change", (e) => {
			this.configState.setValue(key, e.target.value);
			this.updateApplyButton();
		});

		container.appendChild(input);

		return container;
	}

	/**
	 * Create footer section with buttons
	 */
	createFooter() {
		const footer = document.createElement("div");
		footer.className = "panel-footer";

		const copyBtn = document.createElement("button");
		copyBtn.className = "copy-url-btn";
		copyBtn.textContent = "Copy URL";
		copyBtn.addEventListener("click", async () => {
			const success = await this.configState.copyURL();
			if (success) {
				copyBtn.textContent = "Copied!";
				setTimeout(() => (copyBtn.textContent = "Copy URL"), 2000);
			}
		});
		footer.appendChild(copyBtn);

		const resetBtn = document.createElement("button");
		resetBtn.className = "reset-btn";
		resetBtn.textContent = "Reset";
		resetBtn.addEventListener("click", () => {
			if (confirm("Reset all parameters to defaults?")) {
				this.configState.reset();
			}
		});
		footer.appendChild(resetBtn);

		const applyBtn = document.createElement("button");
		applyBtn.className = "apply-btn";
		applyBtn.textContent = "Apply";
		applyBtn.addEventListener("click", () => {
			this.configState.applyChanges();
		});
		footer.appendChild(applyBtn);

		this.applyButton = applyBtn;

		return footer;
	}

	/**
	 * Toggle category collapsed state
	 */
	toggleCategory(key, element) {
		if (this.collapsedCategories.has(key)) {
			this.collapsedCategories.delete(key);
			element.classList.remove("collapsed");
		} else {
			this.collapsedCategories.add(key);
			element.classList.add("collapsed");
		}
	}

	/**
	 * Update apply button state (show pending count)
	 */
	updateApplyButton() {
		if (!this.applyButton) return;

		const pendingCount = this.configState.getPendingCount();

		// Remove existing badge
		const existingBadge = this.applyButton.querySelector(".pending-badge");
		if (existingBadge) {
			existingBadge.remove();
		}

		// Add badge if there are pending changes
		if (pendingCount > 0 && !this.configState.livePreview) {
			const badge = document.createElement("span");
			badge.className = "pending-badge";
			badge.textContent = pendingCount;
			this.applyButton.appendChild(badge);
		}
	}

	/**
	 * Show the panel
	 */
	show() {
		if (this.element) {
			this.element.classList.add("open");
		}
	}

	/**
	 * Hide the panel
	 */
	hide() {
		if (this.element) {
			this.element.classList.remove("open");
		}
	}

	/**
	 * Toggle panel visibility
	 */
	toggle() {
		if (this.element) {
			this.element.classList.toggle("open");
		}
	}

	/**
	 * Check if panel is visible
	 */
	isVisible() {
		return this.element && this.element.classList.contains("open");
	}

	/**
	 * Destroy the panel
	 */
	destroy() {
		if (this.element && this.element.parentNode) {
			this.element.parentNode.removeChild(this.element);
		}
		this.element = null;
		this.configState = null;
	}
}
