/**
 * Configuration state manager for tracking and applying parameter changes.
 * Handles URL synchronization, live preview mode, and state persistence.
 */

import {
	defaults,
	versions,
	colorSchemes,
	colorMaps,
	paletteFromHue,
	hsl,
	paramMapping,
} from "../utils/config.js";

// Build reverse mapping: config key -> URL param name
// Some config keys map to multiple URL params (e.g., cursorColor can be cursorColor or cursorHSL)
// We'll use the first (primary) mapping
const configKeyToURLParam = {};
for (const [urlParam, mapping] of Object.entries(paramMapping)) {
	const configKey = mapping.key;
	if (!configKeyToURLParam[configKey]) {
		configKeyToURLParam[configKey] = urlParam;
	}
}

export class ConfigState {
	constructor(currentConfig) {
		this.current = { ...currentConfig };
		this.pending = {};
		this.livePreview = false;
	}

	/**
	 * Set a configuration value
	 * @param {string} key - Parameter key
	 * @param {any} value - Parameter value
	 */
	setValue(key, value) {
		if (this.livePreview) {
			this.current[key] = value;
			this.updateURL();
			this.reloadPage();
		} else {
			this.pending[key] = value;
		}
	}

	/**
	 * Get current value for a parameter (pending takes precedence)
	 * @param {string} key - Parameter key
	 * @returns {any} Current or pending value
	 */
	getValue(key) {
		return Object.hasOwn(this.pending, key) ? this.pending[key] : this.current[key];
	}

	/**
	 * Toggle live preview mode
	 * @param {boolean} enabled - Whether live preview is enabled
	 */
	setLivePreview(enabled) {
		this.livePreview = enabled;
	}

	/**
	 * Check if a value is different from the default
	 * Takes into account version, colorScheme, and colorMap overrides
	 * Only returns true if the value differs from BOTH the base default AND any preset defaults
	 * This prevents including parameters that just happen to still be at base defaults when a preset is selected
	 * @param {string} key - Parameter key
	 * @param {any} value - Current value
	 * @returns {boolean} True if different from default
	 */
	isDifferentFromDefault(key, value) {
		const baseDefault = defaults[key];
		const activeVersion = this.current.version || this.pending.version;
		const activeColorScheme = this.current.colorScheme || this.pending.colorScheme;
		const activeColorMap = this.current.colorMap || this.pending.colorMap;

		// If the value matches the base default, never include it
		// This handles the case where a preset is selected but other fields haven't been updated yet
		if (!this.valuesAreDifferent(value, baseDefault)) {
			return false;
		}

		// Check if value matches ANY version's preset (handles case of switching between versions)
		// If it matches another version's value, it's likely a preset value, not a user customization
		for (const versionName in versions) {
			const versionPreset = versions[versionName];
			if (versionPreset[key] !== undefined) {
				if (!this.valuesAreDifferent(value, versionPreset[key])) {
					return false; // Matches a version preset, don't include
				}
			}
		}

		// Check if value matches ANY colorScheme preset
		for (const schemeName in colorSchemes) {
			const scheme = colorSchemes[schemeName];
			if (scheme[key] !== undefined) {
				if (!this.valuesAreDifferent(value, scheme[key])) {
					return false; // Matches a color scheme preset, don't include
				}
			}
		}

		// Check if value matches ANY colorMap generated value
		for (const mapName in colorMaps) {
			const hue = colorMaps[mapName];
			if (key === "palette") {
				const generatedPalette = paletteFromHue(hue);
				if (!this.valuesAreDifferent(value, generatedPalette)) {
					return false; // Matches a colorMap palette, don't include
				}
			} else if (key === "cursorColor") {
				const generatedColor = hsl(hue, 1, 0.73);
				if (!this.valuesAreDifferent(value, generatedColor)) {
					return false; // Matches a colorMap cursor color, don't include
				}
			}
		}

		// If no presets are active, value differs from base and no preset matches
		if (!activeVersion && !activeColorScheme && !activeColorMap) {
			return true; // User customization
		}

		// Build the effective default from active presets
		let presetDefault = baseDefault;

		// Apply version overrides
		if (activeVersion && versions[activeVersion] && versions[activeVersion][key] !== undefined) {
			presetDefault = versions[activeVersion][key];
		}

		// Apply colorScheme overrides (higher precedence than version)
		if (activeColorScheme && colorSchemes[activeColorScheme]) {
			const schemeOverride = colorSchemes[activeColorScheme][key];
			if (schemeOverride !== undefined) {
				presetDefault = schemeOverride;
			}
		}

		// Apply colorMap overrides (highest precedence)
		if (activeColorMap && colorMaps[activeColorMap] !== undefined) {
			const hue = colorMaps[activeColorMap];
			if (key === "palette") {
				presetDefault = paletteFromHue(hue);
			} else if (key === "cursorColor") {
				presetDefault = hsl(hue, 1, 0.73);
			}
		}

		// Include the parameter if it differs from the active preset default
		return this.valuesAreDifferent(value, presetDefault);
	}

	/**
	 * Compare two values for equality
	 * Handles colors, palettes, arrays, and primitives
	 * @param {any} value1 - First value
	 * @param {any} value2 - Second value
	 * @returns {boolean} True if values are different
	 */
	valuesAreDifferent(value1, value2) {
		// If either is undefined, compare directly
		if (value1 === undefined || value2 === undefined) {
			return value1 !== value2;
		}

		// Handle null/undefined
		if (value1 === null || value1 === undefined) {
			return value2 !== null && value2 !== undefined;
		}
		if (value2 === null || value2 === undefined) {
			return true;
		}

		// Handle color objects
		if (value1?.space && value1?.values && value2?.space && value2?.values) {
			if (value1.space !== value2.space) return true;
			if (value1.values.length !== value2.values.length) return true;
			return value1.values.some((v, i) => Math.abs(v - value2.values[i]) > 0.0001);
		}

		// Handle palette arrays
		if (Array.isArray(value1) && Array.isArray(value2)) {
			if (value1.length !== value2.length) return true;
			// For palette comparison
			if (value1.length > 0 && value1[0]?.color && value1[0]?.at !== undefined) {
				// Check if any stop is different
				return value1.some((stop, i) => {
					const stop2 = value2[i];
					if (!stop2) return true; // Different if no corresponding stop
					if (Math.abs(stop.at - stop2.at) > 0.0001) return true; // Different at position
					if (stop.color.space !== stop2.color.space) return true; // Different color space
					// Different if any color value differs
					return stop.color.values.some(
						(v, j) => Math.abs(v - (stop2.color.values[j] || 0)) > 0.0001,
					);
				});
			}
			// Simple array comparison
			return JSON.stringify(value1) !== JSON.stringify(value2);
		}

		// Handle simple values
		return value1 !== value2;
	}

	/**
	 * Build URL parameters from current configuration
	 * Only includes parameters that differ from defaults
	 * @param {Object} config - Configuration object (uses current + pending if not provided)
	 * @returns {URLSearchParams} URL parameters
	 */
	buildURLParams(config = null) {
		const configToUse = config || { ...this.current, ...this.pending };
		const params = new URLSearchParams();

		// Known computed/derived properties that should never be in URLs
		const computedProperties = new Set([
			"glyphSequenceLength",
			"glyphTextureGridSize",
			"glyphMSDFURL",
			"glintMSDFURL",
			"baseTextureURL",
			"glintTextureURL",
			"hasBaseTexture",
			"hasGlintTexture",
		]);

		for (const [key, value] of Object.entries(configToUse)) {
			if (value == null || value === undefined) continue;

			// Skip computed properties
			if (computedProperties.has(key)) {
				continue;
			}

			// Skip if not a valid URL parameter
			if (!configKeyToURLParam[key]) {
				continue;
			}

			// Skip if same as default
			if (!this.isDifferentFromDefault(key, value)) {
				continue;
			}

			// Use the URL parameter name (not the config key)
			const urlParamName = configKeyToURLParam[key];

			// Format value based on type
			const formattedValue = this.formatValueForURL(value);
			if (formattedValue !== null) {
				params.set(urlParamName, formattedValue);
			}
		}

		return params;
	}

	/**
	 * Format a value for URL encoding
	 * @param {any} value - Value to format
	 * @returns {string|null} Formatted value or null if not encodable
	 */
	formatValueForURL(value) {
		if (value == null) return null;

		// Handle color objects
		if (value?.space && value?.values) {
			return value.values.join(",");
		}

		// Handle palette arrays
		if (Array.isArray(value)) {
			if (value.length > 0 && value[0]?.color && value[0]?.at !== undefined) {
				// Palette format
				return value.map((stop) => [...stop.color.values, stop.at].join(",")).join(",");
			}
			// Regular array
			return value.join(",");
		}

		// Handle objects
		if (typeof value === "object") {
			return null; // Skip complex objects
		}

		// Handle primitives
		return String(value);
	}

	/**
	 * Update the browser URL with current configuration
	 */
	updateURL() {
		const params = this.buildURLParams();
		const url = params.toString() ? "?" + params.toString() : window.location.pathname;
		history.replaceState({}, "", url);
	}

	/**
	 * Apply pending changes (merge into current, update URL, reload)
	 */
	applyChanges() {
		this.current = { ...this.current, ...this.pending };
		this.pending = {};
		this.updateURL();
		this.reloadPage();
	}

	/**
	 * Reset to defaults (clear all URL parameters)
	 */
	reset() {
		const url = window.location.pathname;
		history.replaceState({}, "", url);
		window.location.reload();
	}

	/**
	 * Copy current URL to clipboard
	 */
	async copyURL() {
		const params = this.buildURLParams();
		const url = window.location.origin + window.location.pathname + "?" + params.toString();

		try {
			await navigator.clipboard.writeText(url);
			return true;
		} catch (err) {
			console.error("Failed to copy URL:", err);
			return false;
		}
	}

	/**
	 * Reload the page
	 */
	reloadPage() {
		window.location.reload();
	}

	/**
	 * Get pending changes count
	 * @returns {number} Number of pending changes
	 */
	getPendingCount() {
		return Object.keys(this.pending).length;
	}

	/**
	 * Clear pending changes
	 */
	clearPending() {
		this.pending = {};
	}
}

/**
 * Parse current URL parameters into a configuration object
 * @returns {Object} Configuration from URL
 */
export function parseURLConfig() {
	const params = new URLSearchParams(window.location.search);
	return Object.fromEntries(params.entries());
}
