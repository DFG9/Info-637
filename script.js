let currentScheme = 'monochromatic';
let currentColors = [];

// Color roles that make sense for monochromatic palettes
const monochromaticRoles = ['Lightest', 'Light', 'Base', 'Dark', 'Darkest'];
const generalRoles = ['Primary', 'Secondary', 'Accent', 'Neutral', 'Support'];

function getColorRoles() {
    return currentScheme === 'monochromatic' ? monochromaticRoles : generalRoles;
}

// Color utilities
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function hexToHsl(hex) {
    let {r, g, b} = hexToRgb(hex);
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToHex(h, s, l) {
    s /= 100; l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;

    if (0 <= h && h < 60) { r = c; g = x; b = 0; }
    else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
    else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
    else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
    else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
    else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
    return rgbToHex(r, g, b);
}

// Color schemes
function generateComplementary(base) {
    const hsl = hexToHsl(base);
    return [
        base,
        hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l),
        hslToHex(hsl.h, Math.max(30, hsl.s - 20), Math.max(25, hsl.l - 15)),
        hslToHex((hsl.h + 180) % 360, Math.max(30, hsl.s - 20), Math.max(25, hsl.l - 15)),
        hslToHex(hsl.h, Math.max(20, hsl.s - 40), Math.min(85, hsl.l + 20))
    ];
}

function generateAnalogous(base) {
    const hsl = hexToHsl(base);
    return [
        hslToHex((hsl.h - 30 + 360) % 360, hsl.s, hsl.l),
        hslToHex((hsl.h - 15 + 360) % 360, hsl.s, hsl.l),
        base,
        hslToHex((hsl.h + 15) % 360, hsl.s, hsl.l),
        hslToHex((hsl.h + 30) % 360, hsl.s, hsl.l)
    ];
}

function generateTriadic(base) {
    const hsl = hexToHsl(base);
    return [
        base,
        hslToHex((hsl.h + 120) % 360, hsl.s, hsl.l),
        hslToHex((hsl.h + 240) % 360, hsl.s, hsl.l),
        hslToHex(hsl.h, hsl.s, Math.max(25, hsl.l - 15)),
        hslToHex((hsl.h + 120) % 360, hsl.s, Math.max(25, hsl.l - 15))
    ];
}

function generateTetradic(base) {
    const hsl = hexToHsl(base);
    return [
        base,
        hslToHex((hsl.h + 90) % 360, hsl.s, hsl.l),
        hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l),
        hslToHex((hsl.h + 270) % 360, hsl.s, hsl.l),
        hslToHex(hsl.h, Math.max(30, hsl.s - 30), hsl.l)
    ];
}

function generateMonochromatic(base) {
    const hsl = hexToHsl(base);
    // Create a scale from lightest to darkest with the base in the middle
    return [
        hslToHex(hsl.h, Math.max(20, hsl.s - 10), 90),  // Lightest - for backgrounds
        hslToHex(hsl.h, Math.max(25, hsl.s - 5), 70),   // Light - for surfaces
        base,                                            // Base - main color
        hslToHex(hsl.h, Math.min(80, hsl.s + 5), Math.max(20, hsl.l - 20)),  // Dark - for text on light
        hslToHex(hsl.h, Math.min(85, hsl.s + 10), Math.max(15, hsl.l - 35))  // Darkest - for emphasis
    ];
}

function generatePalette(base) {
    const generators = {
        complementary: generateComplementary,
        analogous: generateAnalogous,
        triadic: generateTriadic,
        tetradic: generateTetradic,
        monochromatic: generateMonochromatic
    };
    return generators[currentScheme](base);
}

// Contrast calculations
function getLuminance(rgb) {
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrast(color1, color2) {
    const l1 = getLuminance(hexToRgb(color1));
    const l2 = getLuminance(hexToRgb(color2));
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}

// Suggest better color for accessibility
function suggestAccessibleColor(foreground, background, targetRatio = 4.5) {
    const fgHsl = hexToHsl(foreground);
    let bestColor = foreground;
    let bestRatio = getContrast(foreground, background);

    for (let l = 5; l <= 95; l += 5) {
        const testColor = hslToHex(fgHsl.h, fgHsl.s, l);
        const ratio = getContrast(testColor, background);
        if (ratio >= targetRatio && Math.abs(ratio - targetRatio) < Math.abs(bestRatio - targetRatio)) {
            bestColor = testColor;
            bestRatio = ratio;
        }
    }

    return bestColor;
}

// Colorblind simulation
function simulateColorblind(hex, type) {
    const rgb = hexToRgb(hex);
    let r = rgb.r, g = rgb.g, b = rgb.b;

    const matrices = {
        protanopia: [0.567, 0.433, 0, 0.558, 0.442, 0, 0, 0.242, 0.758],
        deuteranopia: [0.625, 0.375, 0, 0.7, 0.3, 0, 0, 0.3, 0.7],
        tritanopia: [0.95, 0.05, 0, 0, 0.433, 0.567, 0, 0.475, 0.525]
    };

    if (matrices[type]) {
        const m = matrices[type];
        const newR = m[0] * r + m[1] * g + m[2] * b;
        const newG = m[3] * r + m[4] * g + m[5] * b;
        const newB = m[6] * r + m[7] * g + m[8] * b;
        return rgbToHex(Math.round(newR), Math.round(newG), Math.round(newB));
    }
    return hex;
}

// Display functions
function displayPalette(colors) {
    currentColors = colors;
    const roles = getColorRoles();
    const grid = document.getElementById('paletteGrid');
    grid.innerHTML = colors.map((color, i) => `
        <div class="palette-item" style="background: ${color}" onclick="copyColor('${color}')">
            <div class="color-role-badge">${roles[i]}</div>
            <div class="palette-label">${color}</div>
        </div>
    `).join('');

    updateContrastChecker(colors);
    updateColorblindSim(colors);
    updateCodeOutput(colors);
}

function updateContrastChecker(colors) {
    const grid = document.getElementById('contrastGrid');
    const roles = getColorRoles();
    
    // Test the base color (middle color in monochromatic, first in others)
    const testColorIndex = currentScheme === 'monochromatic' ? 2 : 0;
    
    const tests = [
        { 
            fg: colors[testColorIndex], 
            bg: '#FFFFFF', 
            role: roles[testColorIndex],
            context: 'White Background',
            useCase: 'For light mode interfaces, cards, and content areas' 
        },
        { 
            fg: colors[testColorIndex], 
            bg: '#000000', 
            role: roles[testColorIndex],
            context: 'Black Background',
            useCase: 'For dark mode interfaces and high contrast designs' 
        },
        { 
            fg: colors[testColorIndex], 
            bg: '#F3F4F6', 
            role: roles[testColorIndex],
            context: 'Light Gray Background',
            useCase: 'For subtle backgrounds and secondary surfaces' 
        }
    ];

    grid.innerHTML = tests.map(test => {
        const ratio = getContrast(test.fg, test.bg);
        const passAA = ratio >= 4.5;
        const passAAA = ratio >= 7;
        const passLarge = ratio >= 3;
        const suggestion = passAA ? null : suggestAccessibleColor(test.fg, test.bg);

        let wcagExplanation = '';
        if (passAAA) {
            wcagExplanation = 'AAA: Enhanced (7:1) — Optimal for all text sizes';
        } else if (passAA) {
            wcagExplanation = 'AA: Minimum (4.5:1) — Standard for normal text';
        } else if (passLarge) {
            wcagExplanation = 'Large Text Only (3:1) — Use 18pt+ or 14pt+ bold';
        } else {
            wcagExplanation = 'Failed — Not recommended for text';
        }

        return `
            <div class="contrast-card">
                <div class="contrast-sample" style="background: ${test.bg}; color: ${test.fg}">
                    Aa
                </div>
                <div class="contrast-details">
                    <div class="contrast-context">${test.role} on ${test.context}</div>
                    <div class="contrast-use-case">${test.useCase}</div>
                    <div class="contrast-ratio-value">
                        ${ratio.toFixed(2)}<span class="label">contrast ratio</span>
                    </div>
                    <div class="wcag-results">
                        <span class="wcag-badge ${passAA ? 'pass' : 'fail'}">AA ${passAA ? '✓' : '✗'}</span>
                        <span class="wcag-badge ${passAAA ? 'pass' : 'fail'}">AAA ${passAAA ? '✓' : '✗'}</span>
                        <span class="wcag-badge ${passLarge ? 'pass' : 'fail'}">Large ${passLarge ? '✓' : '✗'}</span>
                    </div>
                    <div class="wcag-explanation">${wcagExplanation}</div>
                    ${!passAA && suggestion ? `
                        <button class="suggestion-btn" onclick="applySuggestion('${suggestion}')">
                            <span>Suggested:</span>
                            <span class="suggested-color" style="background: ${suggestion}"></span>
                            <span>${suggestion}</span>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function updateColorblindSim(colors) {
    const types = [
        { name: 'Normal Vision', type: null, desc: 'How most people see colors' },
        { name: 'Protanopia', type: 'protanopia', desc: 'Red-blind (1% of males)' },
        { name: 'Deuteranopia', type: 'deuteranopia', desc: 'Green-blind (1% of males)' },
        { name: 'Tritanopia', type: 'tritanopia', desc: 'Blue-blind (rare)' }
    ];

    const gallery = document.getElementById('simGallery');
    gallery.innerHTML = types.map(({name, type, desc}) => `
        <div class="sim-panel">
            <div class="sim-label">${name}</div>
            <div class="sim-description">${desc}</div>
            <div class="sim-swatches">
                ${colors.map(color => {
                    const simColor = type ? simulateColorblind(color, type) : color;
                    return `<div class="sim-swatch" style="background: ${simColor}"></div>`;
                }).join('')}
            </div>
        </div>
    `).join('');
}

function updateCodeOutput(colors) {
    const roles = getColorRoles();
    const varNames = roles.map(r => r.toLowerCase().replace(' ', '-'));
    
    const code = `<span class="code-comment">/* CSS Variables */</span>
:root {
  --${varNames[0]}: ${colors[0]};
  --${varNames[1]}: ${colors[1]};
  --${varNames[2]}: ${colors[2]};
  --${varNames[3]}: ${colors[3]};
  --${varNames[4]}: ${colors[4]};
}

<span class="code-comment">/* Tailwind Configuration */</span>
module.exports = {
  theme: {
    extend: {
      colors: {
        '${varNames[0]}': '${colors[0]}',
        '${varNames[1]}': '${colors[1]}',
        '${varNames[2]}': '${colors[2]}',
        '${varNames[3]}': '${colors[3]}',
        '${varNames[4]}': '${colors[4]}',
      }
    }
  }
}`;
    document.getElementById('codeBlock').innerHTML = code;
}

// User interactions
function copyColor(color) {
    navigator.clipboard.writeText(color);
    showToast(`Copied ${color}`);
}

function copyCode() {
    const code = document.getElementById('codeBlock').textContent;
    navigator.clipboard.writeText(code);
    showToast('Code copied!');
}

function applySuggestion(color) {
    document.getElementById('hexInput').value = color;
    document.getElementById('colorPicker').value = color;
    document.getElementById('colorPreview').style.background = color;
    displayPalette(generatePalette(color));
    showToast('Applied suggested color');
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

// Event listeners
document.getElementById('colorPicker').addEventListener('input', e => {
    const color = e.target.value;
    document.getElementById('hexInput').value = color;
    document.getElementById('colorPreview').style.background = color;
    displayPalette(generatePalette(color));
});

document.getElementById('hexInput').addEventListener('input', e => {
    let color = e.target.value.trim();
    if (!color.startsWith('#')) color = '#' + color;
    if (/^#[0-9A-F]{6}$/i.test(color)) {
        document.getElementById('colorPicker').value = color;
        document.getElementById('colorPreview').style.background = color;
        displayPalette(generatePalette(color));
    }
});

document.querySelectorAll('.scheme-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.scheme-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentScheme = tab.dataset.scheme;
        const base = document.getElementById('colorPicker').value;
        displayPalette(generatePalette(base));
    });
});

// Initialize
const initial = '#6366f1';
document.getElementById('colorPreview').style.background = initial;
displayPalette(generatePalette(initial));