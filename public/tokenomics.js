// This script handles the logic for the tokenomics page.
// It generates the animated text, the doughnut chart, and the exponential curve chart.
// It also handles the copy-to-clipboard functionality for the contract address.
// Update the contract address on the tokenomics page using the centralized variable from contracts.js
document.addEventListener('DOMContentLoaded', function () {
    // Ensuring this script runs after all DOM content is fully loaded, including scripts.
    const addressElement = document.getElementById('address-text');
    addressElement.textContent = "COMING SOON!";
    addressElement.textContent = baseMainnetTokenAddress;
    console.log("Updated contract address to: " + baseMainnetTokenAddress);

    setDistributionValues();
});

// #region Distribution Section
const canvas = document.getElementById('distributionChart');
const ctx = canvas.getContext('2d');
canvas.width = document.querySelector('.distribution-section').clientWidth - 24; // Adjusted for padding

const distributionData = {
    "Circulating Supply": 750000,
    "Initial Rewards Pool": 170000,
    "Profectio Airdrop": 10000,
    "Bug Bounty": 44000,
    "Development": 26000
};
const distributionColors = {
    "Circulating Supply": "#2dc60e",
    "Initial Rewards Pool": "#ffff00",
    "Profectio Airdrop": "#2dc60e",
    "Bug Bounty": "#ffff00",
    "Development": "#ffff00"
};
function setDistributionValues() {
    document.querySelector('#circulating-supply-value').textContent = distributionData["Circulating Supply"].toLocaleString();
    document.querySelector('#initial-reward-pool-value').textContent = distributionData["Initial Rewards Pool"].toLocaleString();
    document.querySelector('#bug-bounty-value').textContent = distributionData["Bug Bounty"].toLocaleString();
    document.querySelector('#airdrop-value').textContent = distributionData["Profectio Airdrop"].toLocaleString();
    document.querySelector('#development-value').textContent = distributionData["Development"].toLocaleString();

    console.log("Updated text content with formatted numbers.");
}

const totalTokens = Object.values(distributionData).reduce((acc, val) => acc + val, 0);
const sqrtValues = Object.values(distributionData).map(value => Math.sqrt(value)); // Square root transformation
const maxSqrtHeight = Math.max(...sqrtValues);
const padding = 10;
const numBars = Object.keys(distributionData).length;
const availableWidth = canvas.width - 2 * padding;
const gap = 20;
const barWidth = (availableWidth - gap * (numBars - 1)) / numBars;
const maxBarHeight = canvas.height - 1 * padding;

let barRegions = [];

let x = padding;
Object.entries(distributionData).forEach(([key, value], index) => {
    const sqrtValue = Math.sqrt(value); // Applying square root to each value
    const barHeight = (sqrtValue / maxSqrtHeight) * maxBarHeight; // Scaling based on the square root of the value
    ctx.fillStyle = distributionColors[key];
    ctx.fillRect(x, canvas.height - padding - barHeight, barWidth, barHeight);

    // Store bar region for hover detection
    barRegions.push({
        x: x,
        y: canvas.height - padding - barHeight,
        width: barWidth,
        height: barHeight,
        label: `${key}: ${((value / totalTokens) * 100).toFixed(2)}%`
    });

    x += barWidth + gap;
});


canvas.addEventListener('mousemove', function (event) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas to redraw

    let isOverBar = true;

    // Redraw bars
    barRegions.forEach(region => {
        ctx.fillStyle = distributionColors[region.label.split(':')[0]];
        if (mouseX > region.x && mouseX < region.x + region.width && mouseY > region.y && mouseY < region.y + region.height) {
            ctx.save();
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 10;
            ctx.fillRect(region.x - 5, region.y - 5, region.width + 10, region.height + 10);
            ctx.restore();
        } else {
            ctx.fillRect(region.x, region.y, region.width, region.height);
        }
    });

    // Display tooltip if mouse is over a bar
    barRegions.forEach(region => {
        if (mouseX > region.x && mouseX < region.x + region.width && mouseY > region.y && mouseY < region.y + region.height) {
            const textWidth = ctx.measureText(region.label).width;
            const tooltipX = mouseX + 15 + textWidth > canvas.width ? mouseX - textWidth - 15 : mouseX + 15;
            const tooltipY = mouseY + 20 + 24 > canvas.height ? mouseY - 30 : mouseY + 20;


            ctx.fillStyle = 'black';
            ctx.strokeStyle = 'green';
            ctx.lineWidth = 2;
            ctx.font = '14px monospace';
            ctx.beginPath();
            ctx.moveTo(tooltipX + 5, tooltipY - 20);
            ctx.lineTo(tooltipX + textWidth + 5, tooltipY - 20);
            ctx.quadraticCurveTo(tooltipX + textWidth + 15, tooltipY - 20, tooltipX + textWidth + 15, tooltipY - 10);
            ctx.lineTo(tooltipX + textWidth + 15, tooltipY + 4);
            ctx.quadraticCurveTo(tooltipX + textWidth + 15, tooltipY + 14, tooltipX + textWidth + 5, tooltipY + 14);
            ctx.lineTo(tooltipX + 5, tooltipY + 14);
            ctx.quadraticCurveTo(tooltipX - 5, tooltipY + 14, tooltipX - 5, tooltipY + 4);
            ctx.lineTo(tooltipX - 5, tooltipY - 10);
            ctx.quadraticCurveTo(tooltipX - 5, tooltipY - 20, tooltipX + 5, tooltipY - 20);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = 'white';
            ctx.fillText(region.label, tooltipX + (textWidth + 10) / 2 - ctx.measureText(region.label).width / 2, tooltipY);

            return; // This prevents the tooltip from being drawn multiple times
        }
    });
    if (!isOverBar) {
        redrawChart(currentHoverCategory);
    }
});

// #region Mouse Over Numbers Logic
const spanToCategoryMap = {
    'circulating-supply-value': 'Circulating Supply',
    'initial-reward-pool-value': 'Initial Rewards Pool',
    'bug-bounty-value': 'Bug Bounty',
    'airdrop-value': 'Profectio Airdrop',
    'development-value': 'Development'
};

let currentHoverCategory = null;

// Redraw the chart with a highlight on the specified category
function redrawChart(highlightCategory = null) {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas to redraw
    barRegions.forEach(region => {
        ctx.fillStyle = distributionColors[region.label.split(':')[0]];
        if (highlightCategory && region.label.startsWith(highlightCategory)) {
            ctx.save();
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 10;
            ctx.fillRect(region.x - 5, region.y - 5, region.width + 10, region.height + 10);
            ctx.restore();
        } else {
            ctx.fillRect(region.x, region.y, region.width, region.height);
        }
    });
}
// Add event listeners to each span
Object.entries(spanToCategoryMap).forEach(([spanId, category]) => {
    const spanElement = document.getElementById(spanId);
    const originalValue = distributionData[category];

    // Handle mouse enter
    spanElement.addEventListener('mouseenter', () => {
        currentHoverCategory = category;
        const percentage = (originalValue / totalTokens * 100).toFixed(2);
        spanElement.textContent = `${percentage}%`;
        redrawChart(currentHoverCategory);
        console.log("Mouse entered: " + category + " showing " + percentage + "%");
    });

    // Handle mouse leave
    spanElement.addEventListener('mouseleave', () => {
        currentHoverCategory = null;
        spanElement.textContent = originalValue.toLocaleString();
        redrawChart();
    });

    // Handle click
    spanElement.addEventListener('click', () => {
        console.log(`Category: ${category} clicked!`);
    });
});
// #endregion Mouse Over Numbers Logic

// #endregion Distribution Section

// #region Logic for Chart Calculations
function calculateDistributionPercentage(data) {
    const total = Object.values(data).reduce((acc, value) => acc + value, 0);
    const percentages = {};
    for (const key in data) {
        percentages[key] = (data[key] / total) * 100;
    }
    return percentages;
}

const distributionPercentages = calculateDistributionPercentage(distributionData);

function updatePieChart(percentages) {
    let gradientParts = [];
    let accumulatedPercentage = 0;

    for (const key in percentages) {
        const color = distributionColors[key];
        const size = percentages[key];
        gradientParts.push(`${color} ${accumulatedPercentage}% ${accumulatedPercentage + size}%`);
        accumulatedPercentage += size;
    }

    const gradientString = gradientParts.join(', ');
}

updatePieChart(distributionPercentages);
// #endregion Logic for Chart Calculations

// #region Contract Address Matrix load-in effect
const matrixChars = 'ヨBシ0GげほヸタゾWめYZャbefgぜijnヴopあrstォxyバ01456ゑ89';
const maxLength = 42; // Maximum number of characters to animate
const animationDuration = 800; // Duration in milliseconds

document.addEventListener('DOMContentLoaded', function () {
    const targetElementId = 'address-text'; // Target the span around the address
    let originalText = document.getElementById(targetElementId).textContent;
    const totalLength = Math.min(originalText.length, maxLength); // Use the smaller of the original length or maxLength
    originalText = originalText.substring(0, totalLength); // Trim the original text to the maximum length
    let currentLength = 0;
    document.getElementById(targetElementId).textContent = ''; // Start with an empty string

    // Function to generate a random character
    function getRandomCharacter() {
        return matrixChars.charAt(Math.floor(Math.random() * matrixChars.length));
    }

    // Function to animate text from the first character
    function animateTextOut() {
        if (currentLength < totalLength) {
            let animatedText = new Array(currentLength + 1).join('0').split('0').map(_ => getRandomCharacter()).join('');
            document.getElementById(targetElementId).textContent = animatedText;
            currentLength++;
            setTimeout(animateTextOut, animationDuration / totalLength); // Adjust timing to animate each character
        } else {
            // Once the animation is complete, ensure the original (or trimmed) text is set
            document.getElementById(targetElementId).textContent = originalText;
        }
    }

    animateTextOut();
});
//#endregion Contract Address Matrix load-in effect

// #region Contract Address Copy Functionality
// Add event listener to the copy icon
document.getElementById('copy-icon').addEventListener('click', function () {
    const contractAddress = document.getElementById('address-text').textContent.trim(); // Adjust to target the span
    const confirmTime = 2000; // Time until the copy icon changes back from a checkmark to a copy icon

    navigator.clipboard.writeText(contractAddress).then(function () {
        console.log('Copying to clipboard was successful!');
        // Change the icon to a check mark
        document.getElementById('copy-icon').className = 'fa-solid fa-check';

        // Change the icon back to copy after confirmTime milliseconds
        setTimeout(function () {
            document.getElementById('copy-icon').className = 'fa-regular fa-copy';
        }, confirmTime);
    }, function (err) {
        console.error('Could not copy text: ', err);
    });
});
// #endregion Contract Address Copy Functionality

// #endregion SYPHER Cache Logic