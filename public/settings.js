console.log("Settings loaded!");

const settingsButton = document.getElementById("settings-button");
const settingsMenuContainer = document.getElementById("settings-menu-container");

const muteButton = document.getElementById('mute-button');

const statusCorrectButton = document.getElementById('settings-correct-button');
const statusIncorrectButton = document.getElementById('settings-incorrect-button');
const statusMisplacedButton = document.getElementById('settings-misplaced-button');
const statusColorPickerContainer = document.getElementById('status-color-picker-container');

const redButton = document.getElementById('red-button');
const orangeButton = document.getElementById('orange-button');
const yellowButton = document.getElementById('yellow-button');
const greenButton = document.getElementById('green-button');
const cyanButton = document.getElementById('cyan-button');
const blueButton = document.getElementById('blue-button');
const purpleButton = document.getElementById('purple-button');
const pinkButton = document.getElementById('pink-button');

let sliderHandle = document.querySelector('.color-slider-handle');
let sliderContainer = document.querySelector('.color-slider-container');
let isDragging = false;

let settingsOpen = false;

let lastButtonId = '';

const defaultColors = {
    '--desypher-green-main': '#2dc60e',
    '--desypher-green-bright': '#39e016',
    '--desypher-green-dark': '#166009',
    '--desypher-green-ultradark': '#0f3e07',
    '--glow-green-main': '#00ff00c2',
    '--glow-green-secondary': '#00ff009e',
    '--glow-green-dark': '#00ff005f',
    '--desypher-yellow-main': '#ffff00',
    'hueShift': '0deg'
};

const sliderColors = [
    { p: 0, color: "ff0000" },    // Red
    { p: 0.17, color: "ffff00" }, // Yellow
    { p: 0.33, color: "00ff00" }, // Green
    { p: 0.5, color: "00ffff" },  // Cyan
    { p: 0.67, color: "0000ff" }, // Blue
    { p: 0.83, color: "ff00ff" }, // Magenta
    { p: 1, color: "ff0000" }     // Red
];

document.addEventListener('DOMContentLoaded', (event) => {
    loadSettings();
});

if (settingsButton) {
    settingsButton.addEventListener('click', () => {
        settingsMenu();
    });
} else {
    console.error("Settings button not found!");
}

function settingsMenu() {
    if (settingsOpen) {
        settingsMenuContainer.style.display = "none";
        settingsOpen = false;
        saveSettings();
    } else {
        settingsMenuContainer.style.display = "block";
        settingsMenuContainer.style.animation = "fadeIn 0.5s forwards";
        settingsOpen = true;
        initializeSliderHandleColor();
    }
}

function loadSettings() {
    const colorVariables = [
        '--desypher-green-main',
        '--desypher-green-bright',
        '--desypher-green-dark',
        '--desypher-green-ultradark',
        '--desypher-yellow-main',
        '--glow-green-main',
        '--glow-green-secondary',
        '--glow-green-dark',
        '--correct',
        '--incorrect',
        '--misplaced'
    ];
    colorVariables.forEach(varName => {
        const colorValue = localStorage.getItem(varName);
        if (colorValue) {
            document.documentElement.style.setProperty(varName, colorValue);
            console.log(`Loaded setting: ${varName} restored to ${colorValue}`);
        }
    });

    // Load and apply hue shift for images
    const hueShift = localStorage.getItem('hueShift');
    if (hueShift) {
        document.querySelector('.background-image').style.filter = `hue-rotate(${hueShift})`;
        document.querySelector('.game-logo').style.filter = `hue-rotate(${hueShift})`;
        console.log(`Loaded setting: Hue shift restored to ${hueShift}`);
    }

    // Load the Audio State
    const mutedState = localStorage.getItem('isMuted');
    isMuted = mutedState === 'true';
    muteButton.className = isMuted ? 'fa-solid fa-volume-off' : 'fa-solid fa-volume-high';
    audioPool.forEach(audio => audio.muted = isMuted);
    clickAudioPool.forEach(audio => audio.muted = isMuted);
    console.log("Audio muted state loaded: " + isMuted);

    // Load the VFX State
    const vfxState = localStorage.getItem('isAnimating');
    if (vfxState !== null) {
        isAnimating = vfxState === 'true'; // Convert the string back to a boolean
        if (!isAnimating) {
            document.getElementById('vfx-toggle').classList.replace('fa-toggle-on', 'fa-toggle-off');
        } else {
            animate(0); // Ensure the animation is running if it should be
            document.getElementById('vfx-toggle').classList.replace('fa-toggle-off', 'fa-toggle-on');
        }
    } else {
        // Set default state if there's no saved state (assuming default is ON)
        isAnimating = true;
        animate(0);
        document.getElementById('vfx-toggle').classList.add('fa-toggle-on');
    }
    console.log("VFX state loaded: " + isAnimating);
}

function saveSettings() {
    // Save all CSS color variables
    const colorVariables = [
        '--desypher-green-main',
        '--desypher-green-bright',
        '--desypher-green-dark',
        '--desypher-green-ultradark',
        '--glow-green-main',
        '--glow-green-secondary',
        '--glow-green-dark',
        '--desypher-yellow-main',
        '--correct',
        '--incorrect',
        '--misplaced'
    ];
    colorVariables.forEach(varName => {
        const colorValue = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
        localStorage.setItem(varName, colorValue);
        console.log(`Saved setting: ${varName} set to ${colorValue}`);
    });

    // Save the hue shift for images
    const filterStyle = getComputedStyle(document.querySelector('.background-image')).filter;
    const hueShiftMatch = filterStyle.match(/hue-rotate\((-?\d+\.?\d*deg)\)/);
    if (hueShiftMatch && hueShiftMatch[1]) {
        const hueShift = hueShiftMatch[1];
        localStorage.setItem('hueShift', hueShift);
        console.log(`Saved setting: Hue shift set to ${hueShift}`);
    } else {
        console.log("No hue-rotate value found; hue shift not saved.");
    }

    // Save the Audio State
    localStorage.setItem('isMuted', isMuted);
    console.log("Audio muted state saved: " + isMuted);

    // Save the VFX State
    localStorage.setItem('isAnimating', isAnimating);
    console.log("VFX saved: " + isAnimating);
}

function restoreDefaultColors() {
    Object.keys(defaultColors).forEach(key => {
        localStorage.removeItem(key);  // Remove the setting from local storage
        if (key.startsWith('--')) {  // It's a CSS variable
            document.documentElement.style.setProperty(key, defaultColors[key]);
        } else if (key === 'hueShift') {
            document.querySelector('.background-image').style.filter = `hue-rotate(${defaultColors[key]})`;
            document.querySelector('.game-logo').style.filter = `hue-rotate(${defaultColors[key]})`;
        }
        setSliderToColor(defaultColors['--desypher-green-main'].slice(1));
    });
    console.log("Color settings restored to defaults.");
}

document.getElementById('default-color-button').addEventListener('click', restoreDefaultColors);

function toggleVisualEffects() {
    isAnimating = !isAnimating;
    if (isAnimating) {
        animate(0);  // Restart the animation if it was stopped
    }
}
document.getElementById('vfx-toggle').addEventListener('click', function () {
    toggleVisualEffects();  // Assuming this function is defined in settings.js

    // Toggle the icon
    if (this.classList.contains('fa-toggle-on')) {
        this.classList.remove('fa-toggle-on');
        this.classList.add('fa-toggle-off');
    } else {
        this.classList.remove('fa-toggle-off');
        this.classList.add('fa-toggle-on');
    }
});

muteButton.addEventListener('click', () => {
    isMuted = !isMuted;
    muteButton.className = isMuted ? 'fa-solid fa-volume-off' : 'fa-solid fa-volume-high'; // Set the appropriate icon based on the mute state
    audioPool.forEach(audio => audio.muted = isMuted); // Set the volume of all audio objects in the hover and click pools
    clickAudioPool.forEach(audio => audio.muted = isMuted);
    console.log("Mute state changed: " + (isMuted ? "Muted" : "Unmuted"));
});

// #region Color Slider Functionality
function initializeSliderHandleColor() {
    const hexColor = getComputedStyle(document.documentElement).getPropertyValue('--desypher-green-main').trim().slice(1);
    setSliderToColor(hexColor);
}
function setSliderToColor(hexColor) {
    const position = calculatePositionFromHex(hexColor);
    sliderHandle.style.left = `${position * sliderContainer.offsetWidth}px`;
    updateHandleColor(position * sliderContainer.offsetWidth, sliderContainer.offsetWidth);
}
function updateHandleColor(position, totalWidth) {
    const percentage = position / totalWidth;
    let i = 1;
    for (; i < sliderColors.length && percentage > sliderColors[i].p; i++) { }
    i = i === 0 ? 1 : i; // Ensure we never go below the first index

    const { p: p1, color: c1 } = sliderColors[i - 1];
    const { p: p2, color: c2 } = sliderColors[i % sliderColors.length]; // Use modulo for cycling within bounds

    const ratio = (percentage - p1) / (p2 - p1);
    const interpolatedHex = interpolateHex(c1, c2, ratio);
    const rgb = hexToRgb(interpolatedHex);

    sliderHandle.style.borderColor = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}
function interpolateHex(hex1, hex2, ratio) {
    const rgb1 = hexToRgb(hex1);
    const rgb2 = hexToRgb(hex2);
    const r = Math.round(rgb1.r + ratio * (rgb2.r - rgb1.r));
    const g = Math.round(rgb1.g + ratio * (rgb2.g - rgb1.g));
    const b = Math.round(rgb1.b + ratio * (rgb2.b - rgb1.b));
    return rgbToHex(r, g, b);
}
function calculatePositionFromHex(hex) {
    let closestMatch = { position: 0, diff: Infinity };
    sliderColors.forEach((color, index) => {
        const diff = hexDistance(hex, color.color);
        if (diff < closestMatch.diff) {
            closestMatch = { position: color.p, diff };
        }
    });
    return closestMatch.position;
}
function hexDistance(hex1, hex2) {
    const rgb1 = hexToRgb(hex1);
    const rgb2 = hexToRgb(hex2);
    return Math.sqrt(Math.pow(rgb1.r - rgb2.r, 2) + Math.pow(rgb1.g - rgb2.g, 2) + Math.pow(rgb1.b - rgb2.b, 2));
}
function hexToRgb(hex) {
    if (hex.length !== 6) {
        console.error("Invalid HEX color: " + hex);
        return { r: 0, g: 0, b: 0 }; // Fallback to black
    }
    var r = parseInt(hex.slice(0, 2), 16);
    var g = parseInt(hex.slice(2, 4), 16);
    var b = parseInt(hex.slice(4, 6), 16);
    return { r, g, b };
}
function rgbToHex(r, g, b) {
    return [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}
function hslToRgb(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
    let r, g, b;
    if (s == 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        }
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
function rgbToHsl(r, g, b) {
    r /= 255, g /= 255, b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max == min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
}
function updateAllColors(interpolatedHex) {
    const rgb = hexToRgb(interpolatedHex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    document.documentElement.style.setProperty('--desypher-green-main', `#${interpolatedHex}`);

    // Adjust and update related colors based on the main color's HSL values
    const adjustments = [
        { var: '--desypher-green-bright', lightnessAdjust: 10 },
        { var: '--desypher-green-dark', lightnessAdjust: -10 },
        { var: '--desypher-green-ultradark', lightnessAdjust: -20 },
        { var: '--glow-green-main', lightnessAdjust: 0, alpha: 0.75 },
        { var: '--glow-green-secondary', lightnessAdjust: 0, alpha: 0.62 },
        { var: '--glow-green-dark', lightnessAdjust: 0, alpha: 0.37 },
        { var: '--desypher-yellow-main', hue: 60, saturationAdjust: 10, lightnessAdjust: 20 }
    ];

    adjustments.forEach(adj => {
        const newHsl = {
            h: hsl.h,
            s: hsl.s,
            l: Math.max(0, Math.min(100, hsl.l + adj.lightnessAdjust)),
            a: adj.alpha || 1
        };
        const newRgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
        const newHex = rgbToHex(newRgb[0], newRgb[1], newRgb[2]);
        document.documentElement.style.setProperty(adj.var, `#${newHex}`);
    });

    // Apply filters based on calculated values
    const filterSettings = `brightness(0.8) contrast(1.2) hue-rotate(${hsl.h - 120}deg) saturate(${hsl.s / 50})`;
    document.querySelector('.background-image').style.filter = filterSettings;
    document.querySelector('.game-logo').style.filter = filterSettings;
}
function getCurrentColorFromPosition(position, totalWidth) {
    const percentage = position / totalWidth;
    let i = 1;
    for (; i < sliderColors.length && percentage >= sliderColors[i].p; i++) { }
    const { p: p1, color: c1 } = sliderColors[i - 1];
    const { p: p2, color: c2 } = sliderColors[i % sliderColors.length];

    const ratio = (percentage - p1) / (p2 - p1);
    const interpolatedHex = interpolateHex(c1, c2, ratio);
    return interpolatedHex;
}
// #endregion Color Slider Functionality

// #region Event Listeners for Slider Functionality
sliderHandle.addEventListener('mousedown', startDrag);
document.addEventListener('mousemove', drag);
document.addEventListener('mouseup', endDrag);

// Mobile event listeners
sliderHandle.addEventListener('touchstart', startDrag, { passive: true });
document.addEventListener('touchmove', drag, { passive: false });
document.addEventListener('touchend', endDrag, { passive: true });

function startDrag(event) {
    isDragging = true;
    let clientX = event.type.includes('mouse') ? event.clientX : event.touches[0].clientX;
    console.log("Slider handle interaction started.");
    sliderHandle.style.borderWidth = '15px';  // Increase the border size when grabbed
}
function drag(event) {
    if (isDragging) {
        let clientX = event.type.includes('mouse') ? event.clientX : event.touches[0].clientX;
        let newLeft = clientX - sliderContainer.getBoundingClientRect().left;
        newLeft = Math.max(0, newLeft);
        newLeft = Math.min(newLeft, sliderContainer.offsetWidth - sliderHandle.offsetWidth);
        sliderHandle.style.left = newLeft + 'px';
        updateHandleColor(newLeft, sliderContainer.offsetWidth);
        console.log("Slider handle moved to position: " + newLeft);

        // Dynamically update all related colors
        let newColorHex = getCurrentColorFromPosition(newLeft, sliderContainer.offsetWidth);
        updateAllColors(newColorHex);
    }
}
function endDrag() {
    if (isDragging) {
        isDragging = false;
        console.log("Slider handle interaction ended.");
        sliderHandle.style.borderWidth = '5px';  // Reset the border size when released
    }
}
// #endregion Event Listeners for Slider Functionality

// #region Status Color Selector
statusCorrectButton.addEventListener('click', () => {
    openStatusColorPickerContainer('correct');
});
statusIncorrectButton.addEventListener('click', () => {
    openStatusColorPickerContainer('incorrect');
});
statusMisplacedButton.addEventListener('click', () => {
    openStatusColorPickerContainer('misplaced');
});

function openStatusColorPickerContainer(buttonId) {
    console.log("Button pressed:", buttonId);
    lastButtonId = buttonId; // Remember which button was pressed
    statusColorPickerContainer.style.display = 'block';  // Make it visible
}
statusColorPickerContainer.addEventListener('click', function(event) {
    if (event.target.className === 'status-color-picker-button') {
        const color = getComputedStyle(event.target).backgroundColor;  // Get the background color of the clicked button
        if (['correct', 'incorrect', 'misplaced'].includes(lastButtonId)) {
            document.documentElement.style.setProperty(`--${lastButtonId}`, color);
            console.log(`Changed --${lastButtonId} to ${color}`);
        }
        statusColorPickerContainer.style.display = 'none';  // Optionally hide the container after selection
    }
});
// #endregion Status Color Selector