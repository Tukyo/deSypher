// This script manages all error messages that are displayed to the user
console.log('Error handling script loaded...');
let timeoutHandle;  // Declare a variable to keep track of the timeout

const errorSound = new Audio('assets/audio/error-sound.ogg');

function showErrorMessage(error) {
    const errorMessageElement = document.getElementById('error-message');
    errorMessageElement.textContent = error;
    const errorBox = document.querySelector('.error-message-box');
    errorBox.style.display = 'block';
    errorBox.style.animation = 'fadeIn 0.25s forwards';
    errorBox.style.boxShadow = '0 0 10px red, 0 0 20px red';

    // Play the error sound
    setTimeout(() => {
        errorSound.play();
        console.log('Error sound played');
    }, 150);

    // Clear any existing timeout to prevent quick disappearance
    if (timeoutHandle) {
        clearTimeout(timeoutHandle);
        console.log('Existing timeout cleared');
    }

    // Set a new timeout
    timeoutHandle = setTimeout(() => {
        errorBox.style.animation = 'fadeOut 0.25s forwards';
        errorBox.style.display = 'none';
        console.log('Error message hidden');
    }, 2500);
}

function showSystemMessage(message) {
    const systemMessageElement = document.getElementById('error-message');
    systemMessageElement.textContent = message;
    const systemBox = document.querySelector('.error-message-box');
    systemBox.style.display = 'block';
    systemBox.style.animation = 'fadeIn 0.25s forwards';
    systemBox.style.boxShadow = '0 0 10px green, 0 0 20px green';  // Set box shadow to green
    console.log('System message displayed');
}

function hideSystemMessage() {
    const systemBox = document.querySelector('.error-message-box');
    systemBox.style.animation = 'fadeOut 0.25s forwards';
    systemBox.style.display = 'none';
    console.log('System message hidden');
}

// Event listener for custom error events
document.addEventListener('appError', function(event) {
    showErrorMessage(event.detail);
});
// Event listeners for custom system message events
document.addEventListener('appSystemMessage', function(event) {
    showSystemMessage(event.detail);
});
document.addEventListener('hideSystemMessage', function(event) {
    hideSystemMessage();
});