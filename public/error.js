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

// Event listener for custom error events
document.addEventListener('appError', function(event) {
    showErrorMessage(event.detail);
});