// This script manages all error messages that are displayed to the user
console.log('Error handling script loaded...');
let timeoutHandle;  // Declare a variable to keep track of the timeout

function showErrorMessage(error) {
    const errorMessageElement = document.getElementById('error-message');
    errorMessageElement.textContent = error;
    const errorBox = document.querySelector('.error-message-box');
    errorBox.style.display = 'block';

    // Clear any existing timeout to prevent quick disappearance
    if (timeoutHandle) {
        clearTimeout(timeoutHandle);
        console.log('Existing timeout cleared');
    }

    // Set a new timeout
    timeoutHandle = setTimeout(() => {
        errorBox.style.display = 'none'; // Hide the box after 5 seconds
        console.log('Error message hidden');
    }, 5000);
}

// Event listener for custom error events
document.addEventListener('appError', function(event) {
    showErrorMessage(event.detail);
});
