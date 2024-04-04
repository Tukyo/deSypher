// This script handles the logic for the tokenomics page.
// It generates the animated text, the doughnut chart, and the exponential curve chart.
// It also handles the copy-to-clipboard functionality for the contract address.

const matrixChars = 'ヨBシ0GげほヸタゾWめYZャbefgぜijnヴopあrstォxyバ01456ゑ89';
const maxLength = 42; // Maximum number of characters to animate
const animationDuration = 800; // Duration in milliseconds

const distributionData = {
    "Team Allocation": 250000000,
    "Circulating Supply": 500000000,
    "Treasury": 150000000,
    "Marketing": 100000000
};
const distributionColors = {
    "Team Allocation": "#FFD700",
    "Circulating Supply": "#FF6347",
    "Treasury": "#4B0082",
    "Marketing": "#00FF00"
};

document.addEventListener('DOMContentLoaded', function() {

    // #region Animated Text on page load
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
    // #endregion Animated Text on page load

    // #region Doughnut Chart Configuration
    const ctx = document.getElementById('distributionChart').getContext('2d');

    const data = {
        labels: Object.keys(distributionData),
        datasets: [{
            label: 'Token Distribution',
            data: Object.values(distributionData),
            hoverOffset: 25,
            borderWidth: 0,
            borderRadius: 5,
            spacing: 1
        }]
    };

    const config = {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 15,
                    right: 15,
                    bottom: 15,
                    left: 15
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: false
                }
            }
        },
    };
    // #endregion Doughnut Chart Configuration

    // #region Distribution Chart Configuration
    const distributionChart = new Chart(ctx, config);

    const emissionCtx = document.getElementById('emissionChart').getContext('2d');

    // Generate data for the exponential curve
    const labels = Array.from({length: 10}, (_, i) => i + 1); // Assuming 10 time periods
    const initialEmission = 250000; // Initial number of tokens to be emitted
    const decayRate = 0.5; // Decay rate per period

    const emissionData = labels.map(label => initialEmission * Math.pow(decayRate, label - 1));

    const emissionConfig = {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Token Emission',
                data: emissionData,
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            layout: {
                padding: {
                    top: 15,
                    right: 15,
                    bottom: 15,
                    left: 15
                }
            },
        }
    };

    const emissionChart = new Chart(emissionCtx, emissionConfig);
    // #endregion Distribution Chart Configuration

});

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

// #region Contract Address Copy Functionality
// Add event listener to the copy icon
document.getElementById('copy-icon').addEventListener('click', function() {
    const contractAddress = document.getElementById('address-text').textContent.trim(); // Adjust to target the span
    const confirmTime = 2000; // Time until the copy icon changes back from a checkmark to a copy icon

    navigator.clipboard.writeText(contractAddress).then(function() {
        console.log('Copying to clipboard was successful!');
        // Change the icon to a check mark
        document.getElementById('copy-icon').className = 'fa-solid fa-check';

        // Change the icon back to copy after confirmTime milliseconds
        setTimeout(function() {
            document.getElementById('copy-icon').className = 'fa-regular fa-copy';
        }, confirmTime);
    }, function(err) {
        console.error('Could not copy text: ', err);
    });
});
// #endregion Contract Address Copy Functionality