/**
 * React component version of the configuration panel.
 * Provides the same UI as the vanilla JS version but with React state management.
 */

import React, { useState, useEffect, useRef } from "react";
import { isInCorner } from "./cornerDetector.js";
import {
	defaults,
	versions,
	colorSchemes,
	colorMaps,
	paletteFromHue,
	hsl,
	paramMapping,
} from "../utils/config.js";

// Import category definitions from vanilla version
import { CATEGORIES } from "./configPanel.js";

// Build reverse mapping: config key -> URL param name
const configKeyToURLParam = {};
for (const [urlParam, mapping] of Object.entries(paramMapping)) {
	const configKey = mapping.key;
	if (!configKeyToURLParam[configKey]) {
		configKeyToURLParam[configKey] = urlParam;
	}
}

export { CATEGORIES };

/**
 * Compare two values for equality
 * Handles colors, palettes, arrays, and primitives
 */
function valuesAreDifferent(value1, value2) {
	if (value1 === undefined || value2 === undefined) {
		return value1 !== value2;
	}

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
		if (value1.length > 0 && value1[0]?.color && value1[0]?.at !== undefined) {
			return value1.some((stop, i) => {
				const stop2 = value2[i];
				if (!stop2) return true;
				if (Math.abs(stop.at - stop2.at) > 0.0001) return true;
				if (stop.color.space !== stop2.color.space) return true;
				return stop.color.values.some(
					(v, j) => Math.abs(v - (stop2.color.values[j] || 0)) > 0.0001,
				);
			});
		}
		return JSON.stringify(value1) !== JSON.stringify(value2);
	}

	return value1 !== value2;
}

/**
 * Check if a value is different from the default
 * Takes into account version, colorScheme, and colorMap overrides
 * Only returns true if the value differs from BOTH the base default AND any preset defaults
 */
function isDifferentFromDefault(
	key,
	value,
	activeVersion = null,
	activeColorScheme = null,
	activeColorMap = null,
) {
	const baseDefault = defaults[key];

	// If the value matches the base default, never include it
	if (!valuesAreDifferent(value, baseDefault)) {
		return false;
	}

	// Check if value matches ANY version's preset (handles case of switching between versions)
	for (const versionName in versions) {
		const versionPreset = versions[versionName];
		if (versionPreset[key] !== undefined) {
			if (!valuesAreDifferent(value, versionPreset[key])) {
				return false; // Matches a version preset, don't include
			}
		}
	}

	// Check if value matches ANY colorScheme preset
	for (const schemeName in colorSchemes) {
		const scheme = colorSchemes[schemeName];
		if (scheme[key] !== undefined) {
			if (!valuesAreDifferent(value, scheme[key])) {
				return false; // Matches a color scheme preset, don't include
			}
		}
	}

	// Check if value matches ANY colorMap generated value
	for (const mapName in colorMaps) {
		const hue = colorMaps[mapName];
		if (key === "palette") {
			const generatedPalette = paletteFromHue(hue);
			if (!valuesAreDifferent(value, generatedPalette)) {
				return false; // Matches a colorMap palette, don't include
			}
		} else if (key === "cursorColor") {
			const generatedColor = hsl(hue, 1, 0.73);
			if (!valuesAreDifferent(value, generatedColor)) {
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
	return valuesAreDifferent(value, presetDefault);
}

export function ConfigPanel({ initialConfig = {}, show = false, onClose, onApply }) {
	const [isOpen, setIsOpen] = useState(show);
	const [livePreview, setLivePreview] = useState(false);
	const [config, setConfig] = useState(initialConfig);
	const [pendingChanges, setPendingChanges] = useState({});
	const [collapsedCategories, setCollapsedCategories] = useState(new Set());

	useEffect(() => {
		setIsOpen(show);
	}, [show]);

	const handleChange = (key, value) => {
		if (livePreview) {
			setConfig((prev) => ({ ...prev, [key]: value }));
			if (onApply) {
				onApply({ ...config, [key]: value });
			}
		} else {
			setPendingChanges((prev) => ({ ...prev, [key]: value }));
		}
	};

	const getValue = (key) => {
		return Object.hasOwn(pendingChanges, key) ? pendingChanges[key] : config[key];
	};

	const handleApply = () => {
		const newConfig = { ...config, ...pendingChanges };
		setConfig(newConfig);
		setPendingChanges({});
		if (onApply) {
			onApply(newConfig);
		}
	};

	const handleReset = () => {
		if (confirm("Reset all parameters to defaults?")) {
			setConfig({});
			setPendingChanges({});
			if (onApply) {
				onApply({});
			}
		}
	};

	const handleCopyURL = async () => {
		const params = new URLSearchParams();
		const configToUse = { ...config, ...pendingChanges };
		const activeVersion = configToUse.version;
		const activeColorScheme = configToUse.colorScheme;
		const activeColorMap = configToUse.colorMap;

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

			// Skip if same as default (accounting for version/colorScheme/colorMap overrides)
			if (!isDifferentFromDefault(key, value, activeVersion, activeColorScheme, activeColorMap)) {
				continue;
			}

			// Use the URL parameter name (not the config key)
			const urlParamName = configKeyToURLParam[key];

			// Format value for URL
			let formattedValue = null;

			// Handle color objects
			if (value?.space && value?.values) {
				formattedValue = value.values.join(",");
			}
			// Handle palette arrays
			else if (Array.isArray(value)) {
				if (value.length > 0 && value[0]?.color && value[0]?.at !== undefined) {
					formattedValue = value.map((stop) => [...stop.color.values, stop.at].join(",")).join(",");
				} else {
					formattedValue = value.join(",");
				}
			}
			// Handle objects (skip complex ones)
			else if (typeof value === "object") {
				continue;
			}
			// Handle primitives
			else {
				formattedValue = String(value);
			}

			if (formattedValue !== null) {
				params.set(urlParamName, formattedValue);
			}
		}

		const url =
			window.location.origin +
			window.location.pathname +
			(params.toString() ? "?" + params.toString() : "");
		try {
			await navigator.clipboard.writeText(url);
			alert("URL copied to clipboard!");
		} catch (err) {
			console.error("Failed to copy URL:", err);
		}
	};

	const toggleCategory = (key) => {
		setCollapsedCategories((prev) => {
			const next = new Set(prev);
			if (next.has(key)) {
				next.delete(key);
			} else {
				next.add(key);
			}
			return next;
		});
	};

	const handleClose = () => {
		setIsOpen(false);
		if (onClose) {
			onClose();
		}
	};

	const pendingCount = Object.keys(pendingChanges).length;

	return (
		<div className={`matrix-config-panel ${isOpen ? "open" : ""}`}>
			<div className="panel-header">
				<h2>Matrix Configuration</h2>
				<button className="close-btn" onClick={handleClose}>
					×
				</button>
			</div>

			<div className="panel-controls">
				<label>
					<input
						type="checkbox"
						checked={livePreview}
						onChange={(e) => setLivePreview(e.target.checked)}
					/>
					Live Preview
				</label>
			</div>

			<div className="panel-body">
				{Object.entries(CATEGORIES).map(([categoryKey, category]) => (
					<Category
						key={categoryKey}
						categoryKey={categoryKey}
						category={category}
						getValue={getValue}
						onChange={handleChange}
						collapsed={collapsedCategories.has(categoryKey)}
						onToggle={() => toggleCategory(categoryKey)}
					/>
				))}
			</div>

			<div className="panel-footer">
				<button className="copy-url-btn" onClick={handleCopyURL}>
					Copy URL
				</button>
				<button className="reset-btn" onClick={handleReset}>
					Reset
				</button>
				<button className="apply-btn" onClick={handleApply}>
					Apply{" "}
					{pendingCount > 0 && !livePreview && (
						<span className="pending-badge">{pendingCount}</span>
					)}
				</button>
			</div>
		</div>
	);
}

function Category({ categoryKey, category, getValue, onChange, collapsed, onToggle }) {
	return (
		<div className={`category ${collapsed ? "collapsed" : ""}`} data-category={categoryKey}>
			<div className="category-header" onClick={onToggle}>
				{category.title}
			</div>
			<div className="category-content">
				{Object.entries(category.params).map(([paramKey, paramDef]) => (
					<Parameter
						key={paramKey}
						paramKey={paramKey}
						def={paramDef}
						value={getValue(paramKey)}
						onChange={onChange}
					/>
				))}
			</div>
		</div>
	);
}

function Parameter({ paramKey, def, value, onChange }) {
	switch (def.type) {
		case "checkbox":
			return <CheckboxParameter paramKey={paramKey} def={def} value={value} onChange={onChange} />;
		case "select":
			return <SelectParameter paramKey={paramKey} def={def} value={value} onChange={onChange} />;
		case "range":
			return <RangeParameter paramKey={paramKey} def={def} value={value} onChange={onChange} />;
		case "number":
			return <NumberParameter paramKey={paramKey} def={def} value={value} onChange={onChange} />;
		default:
			return <TextParameter paramKey={paramKey} def={def} value={value} onChange={onChange} />;
	}
}

function CheckboxParameter({ paramKey, def, value, onChange }) {
	return (
		<div className="param-group">
			<label className="checkbox-label">
				<input
					type="checkbox"
					checked={value || false}
					onChange={(e) => onChange(paramKey, e.target.checked)}
				/>
				{def.label}
			</label>
		</div>
	);
}

function SelectParameter({ paramKey, def, value, onChange }) {
	return (
		<div className="param-group">
			<label>{def.label}</label>
			<select
				value={value === null || value === undefined ? "" : value}
				onChange={(e) => onChange(paramKey, e.target.value === "" ? null : e.target.value)}
			>
				<option value="">-- Default --</option>
				{def.options.map((option, index) => (
					<option key={index} value={option === null ? "" : option}>
						{def.labels ? def.labels[index] : option === null ? "None" : option}
					</option>
				))}
			</select>
		</div>
	);
}

function RangeParameter({ paramKey, def, value, onChange }) {
	const currentValue = value !== null && value !== undefined ? value : def.min;

	return (
		<div className="param-group">
			<label>{def.label}</label>
			<div>
				<input
					type="range"
					min={def.min}
					max={def.max}
					step={def.step || 0.01}
					value={currentValue}
					onChange={(e) => onChange(paramKey, parseFloat(e.target.value))}
				/>
				<input
					type="number"
					className="range-value"
					min={def.min}
					max={def.max}
					step={def.step || 0.01}
					value={currentValue}
					onChange={(e) => onChange(paramKey, parseFloat(e.target.value))}
				/>
			</div>
		</div>
	);
}

function NumberParameter({ paramKey, def, value, onChange }) {
	return (
		<div className="param-group">
			<label>{def.label}</label>
			<input
				type="number"
				min={def.min}
				max={def.max}
				step={def.step}
				value={value || ""}
				onChange={(e) =>
					onChange(paramKey, e.target.value === "" ? null : parseFloat(e.target.value))
				}
			/>
		</div>
	);
}

function TextParameter({ paramKey, def, value, onChange }) {
	return (
		<div className="param-group">
			<label>{def.label}</label>
			<input type="text" value={value || ""} onChange={(e) => onChange(paramKey, e.target.value)} />
		</div>
	);
}

/**
 * Hook for managing config panel with corner right-click detection
 */
export function useConfigPanel(initialConfig = {}) {
	const [showPanel, setShowPanel] = useState(false);
	const [showContextMenu, setShowContextMenu] = useState(false);
	const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });

	useEffect(() => {
		const handleContextMenu = (e) => {
			const x = e.clientX;
			const y = e.clientY;
			const width = window.innerWidth;
			const height = window.innerHeight;

			if (isInCorner(x, y, width, height)) {
				e.preventDefault();
				setContextMenuPos({ x, y });
				setShowContextMenu(true);
			} else {
				setShowContextMenu(false);
			}
		};

		const handleClick = () => {
			setShowContextMenu(false);
		};

		const handleEscape = (e) => {
			if (e.key === "Escape") {
				if (showPanel) {
					setShowPanel(false);
					e.preventDefault();
				} else if (showContextMenu) {
					setShowContextMenu(false);
					e.preventDefault();
				}
			}
		};

		document.addEventListener("contextmenu", handleContextMenu);
		document.addEventListener("click", handleClick);
		document.addEventListener("keydown", handleEscape);

		return () => {
			document.removeEventListener("contextmenu", handleContextMenu);
			document.removeEventListener("click", handleClick);
			document.removeEventListener("keydown", handleEscape);
		};
	}, [showPanel, showContextMenu]);

	const ContextMenuComponent = showContextMenu ? (
		<div
			className="matrix-context-menu"
			style={{
				left: contextMenuPos.x + "px",
				top: contextMenuPos.y + "px",
				display: "block",
			}}
		>
			<div
				className="menu-item"
				onClick={() => {
					setShowPanel(true);
					setShowContextMenu(false);
				}}
			>
				⚙️ Open Settings
			</div>
		</div>
	) : null;

	return {
		showPanel,
		setShowPanel,
		ContextMenuComponent,
	};
}
