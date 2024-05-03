window.gameActive = false;

let gameStartEvent = new CustomEvent("gameStart");
window.dispatchEvent(gameStartEvent);

let gameCompleteEvent = new CustomEvent("gameComplete");
window.dispatchEvent(gameCompleteEvent);

window.addEventListener("gameStart", function() {
    window.gameActive = true;
    console.log("Game started...");
});

window.addEventListener("gameComplete", function() {
    window.gameActive = false;
    console.log("Game completed...");
});

let gameOver = false;

const form = document.getElementById('wordPuzzleForm');
const inputContainer = document.getElementById('inputContainer');
const feedback = document.getElementById('feedback');
const submitButton = document.getElementById('submitButton');

const submitLoadButton = document.getElementById('submit-load-button');
const cancelButton = document.getElementById('cancel-button');
const retrieveTransaction = document.getElementById('retrieve-transaction');
const versionNumber = document.getElementById('version-number');

const version = '0.1.3';

document.addEventListener('DOMContentLoaded', () => {
    function updateVersionNumber() {
        versionNumber.textContent = "Ver. " + version;
    }
    updateVersionNumber();
});

const REQUIRED_CHAIN_ID = 8453; // Base L2

const songs = [
    'tukyo-deSypher.ogg', 'vaang-caliente.ogg', '333amethyst-mantis(P.2).ogg', 'web4-happyhappyjoyjoy.ogg'
];

// #region WordGame Main 
function sendGuess() {
    if (!playerAddress) {
        console.log('Player address not found');
        return;
    }
    if (!transactionHash) {
        console.log('Transaction hash not found');
        return;
    }
    const rows = document.querySelectorAll('.input-fields');
    const lastRow = rows[rows.length - 1];
    const inputs = lastRow.querySelectorAll('.puzzle-input');
    let word = '';
    inputs.forEach(input => {
        word += input.value;
    });
    if (word.length !== 5) {
        document.dispatchEvent(new CustomEvent('appError', { detail: 'The word must be exactly 5 letters long.' }));
        return; // Exit the function early if the word is not 5 letters
    }
    if (word.toLowerCase() === 'music') {
        console.log('Cheat code activated: Revealing music player.');
        revealMusicPlayer();
        return; // Do not proceed with the fetch request
    }
    if (word.toLowerCase() === 'color') {
        console.log("Cheat code activated: Changing the color scheme.");
        changeColors();
        return;
    }
    if (word.toLowerCase() === 'colin') {
        document.dispatchEvent(new CustomEvent('appError', { detail: "Tehe!" }));
        return;
    }
    if (word.toLowerCase() === 'lazer') {
        lazerRayz();
        return;
    }
    if (word.toLowerCase() === 'tukyo') {
        tukyoMode();
        return;
    }
    // Disable the submit button while processing the guess
    submitButton.disabled = true;
    document.dispatchEvent(new CustomEvent('appSystemMessage', { detail: "Processing..." }));
    console.log('Guess submitted:', word);

    fetch('/game', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerAddress, transactionHash, word }),
    })
        .then(response => response.json())
        .then(data => {
            console.log('Guess result:', data);
            if (data.error) {
                const errorEvent = new CustomEvent('appError', { detail: data.error });
                document.dispatchEvent(errorEvent);
            } else {
                document.dispatchEvent(new Event('hideSystemMessage'));
                updateUI(data);
                submitButton.disabled = false;
            }
        })
        .catch((error) => {
            console.error('Network Error:', error);
            const errorEvent = new CustomEvent('appError', { detail: 'Network error. Please try again.' });
            document.dispatchEvent(errorEvent);
            submitButton.disabled = false;
        })
        .finally(() => {
            submitButton.disabled = false; // Always re-enable the submit button
        });
}
document.getElementById('wordPuzzleForm').addEventListener('submit', function (event) {
    event.preventDefault();
    sendGuess();
});
//#endregion WordGame Main

// #region Input Field Controls
function addInputListeners(inputs) {
    inputs.forEach((input, index, array) => {
        // Skip disabled inputs on input
        input.addEventListener('input', function () {
            const clickSound = clickAudioPool[clickAudioIndex];
            clickSound.currentTime = 0; // Rewind to start
            clickSound.play().catch(error => console.log("Error playing sound:", error));
            clickAudioIndex = (clickAudioIndex + 1) % poolSize;

            let nextIndex = index + 1;
            while (nextIndex < array.length && array[nextIndex].disabled) {
                nextIndex++; // Skip over disabled inputs
            }
            if (input.value.length === 1 && nextIndex < array.length) {
                array[nextIndex].focus();
            }
        });
        // Adjust backspace functionality to skip disabled inputs
        input.addEventListener('keydown', function (event) {
            if (event.key === "Backspace" && input.value === '' && index > 0) {
                event.preventDefault();
                let prevIndex = index - 1;
                while (prevIndex >= 0 && array[prevIndex].disabled) {
                    prevIndex--; // Skip over disabled inputs
                }
                if (prevIndex >= 0) {
                    array[prevIndex].value = '';
                    array[prevIndex].focus();

                    // Play click sound on backspace
                    const clickSound = clickAudioPool[clickAudioIndex];
                    clickSound.currentTime = 0; // Rewind to start
                    clickSound.play().catch(error => console.log("Error playing sound:", error));
                    clickAudioIndex = (clickAudioIndex + 1) % poolSize;
                }
            }
        });
        // Listen for focus to handle tab navigation
        input.addEventListener('focus', () => {
            // Play click sound on focus
            const clickSound = clickAudioPool[clickAudioIndex];
            clickSound.currentTime = 0; // Rewind to start
            clickSound.play().catch(error => console.log("Error playing sound:", error));
            clickAudioIndex = (clickAudioIndex + 1) % poolSize;
        });
    });
}
// #endregion Input Field Controls

// #region UI Update Logic
function updateUI(data) {
    const rows = document.querySelectorAll('.input-fields');
    const lastRow = rows[rows.length - 1];
    const inputs = lastRow.querySelectorAll('.puzzle-input');

    // Color the inputs based on the guess result
    data.result.forEach((item, index) => {
        const statusColor = getColorForStatus(item.status);
        inputs[index].style.backgroundColor = statusColor;
        inputs[index].disabled = true; // Disable the input after the guess
        inputs[index].style.boxShadow = `0 0 10px ${statusColor}, 0 0 20px ${statusColor}`;
    });

    updateKeyboardHelper(data.result); // Update the keyboard helper

    if (data.isWin || data.gameOver) {
        if (data.isWin) {
            // If the player wins the game
            submitButton.textContent = "Code deSyphered! Play again?";
            submitButton.style.marginTop = "50px";
        } else if (data.gameOver) {
            // If the player loses the game
            let randomMessage = getRandomLosingMessage(losingMessages);
            submitButton.textContent = randomMessage;
            submitButton.style.marginTop = "0px";
            window.dispatchEvent(gameCompleteEvent);
        }
        submitButton.disabled = false;

        if (!data.isWin && data.gameOver) {
            // Check if the correctAnswer textbox already exists to prevent duplicates
            let correctAnswerBox = document.getElementById('correct-answer');
            if (!correctAnswerBox) {
                // Create and append the textbox if it does not exist
                correctAnswerBox = document.createElement('div');
                correctAnswerBox.id = 'correct-answer';
                // Convert the correct word to uppercase before setting it
                correctAnswerBox.textContent = `Correct Word: ${data.correctWord.toUpperCase()}`;
                // Append it to the container that holds the input rows
                document.getElementById('inputContainer').appendChild(correctAnswerBox);
            }
        }

        // Change the button's event listener to refresh the page
        submitButton.onclick = function (event) {
            event.preventDefault(); // Prevent form submission
            window.location.reload(); // Refresh the page to start a new game
        };
    } else {
        console.log(`Try again! Attempts left: ${data.attemptsLeft}`);
        hintBox(false, '');
        // Reset the button for regular game flow
        submitButton.textContent = "Submit";
        submitButton.disabled = false; // Ensure it's enabled for further guesses
        submitButton.onclick = null; // Remove onclick to prevent interfering with regular submit

        // Prepare for the next guess
        const newInputs = createInputRow(data.result); // Pass the result directly
        addInputListeners(newInputs);

        // Focus the first input in the new row for user convenience
        if (newInputs.length > 0) newInputs[0].focus();
    }
}
function createInputRow(lastGuessResult = []) {
    const inputContainer = document.getElementById('inputContainer');
    const row = document.createElement('div');
    row.className = 'input-fields';
    let firstEnabledInputIndex = -1; // Initialize to -1 to indicate no enabled input found yet

    for (let i = 0; i < 5; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = '1';
        input.className = 'puzzle-input';

        // Check if the current letter was correctly guessed
        if (lastGuessResult[i] && lastGuessResult[i].status === 'correct') {
            input.value = lastGuessResult[i].letter; // Pre-fill with the correct letter
            input.style.backgroundColor = getColorForStatus(lastGuessResult[i].status); // Set background color
            input.style.boxShadow = `0 0 10px ${getColorForStatus(lastGuessResult[i].status)}, 0 0 20px ${getColorForStatus(lastGuessResult[i].status)}`; // Apply matching shadow
            input.disabled = true; // Make field unselectable
        } else {
            // If this is the first enabled input, mark its index
            if (firstEnabledInputIndex === -1) firstEnabledInputIndex = i;
        }

        addAudioListener(input);
        row.appendChild(input);
    }
    inputContainer.appendChild(row);
    updateLogoSize(); // Update the logo size based on the number of rows
    updateMainContentPadding(); // Adjust the .main-content padding based on the number of rows

    const newInputs = row.querySelectorAll('.puzzle-input');
    // Focus on the first enabled input. If all are enabled, this will be the first input.
    if (firstEnabledInputIndex !== -1) {
        newInputs[firstEnabledInputIndex].focus();
    } else {
        // If for some reason all inputs are disabled (which shouldn't happen in this context), default to focusing the first input
        newInputs[0].focus();
    }

    return newInputs;
}
function hintBox(show, message) {
    const hintBox = document.getElementById('hint-box');
    if (show) {
      hintBox.textContent = message; // Set the hint message
      hintBox.style.display = 'block';
      console.log("Displayed the hint box with message:", message);
    } else {
      hintBox.style.display = 'none';
      console.log("Hidden the hint box.");
    }
  }
// Helper function to determine the color based on the status
function getColorForStatus(status) {
    // Get the root element's computed style to access CSS variables
    const rootStyle = getComputedStyle(document.documentElement);
    
    const colorPalette = {
        correct: rootStyle.getPropertyValue('--correct').trim(), // Get the CSS variable for 'correct' status
        misplaced: rootStyle.getPropertyValue('--misplaced').trim(), // Get the CSS variable for 'misplaced' status
        incorrect: rootStyle.getPropertyValue('--incorrect').trim(), // Get the CSS variable for 'incorrect' status
    };

    return colorPalette[status] || 'grey'; // Default to 'grey' if status is unknown
}
// #endregion UI Update Logic

// #region Losing Messages
const losingMessages = [
    { message: "You lose. Try again?", weight: 5 }, // 30.62%
    { message: "Nice try. Maybe next time!", weight: 1.5 }, // 9.18%
    { message: "Access denied. Try again?", weight: 1.25 }, // 7.65%
    { message: "You're not very good at this!", weight: 1.25 }, // 7.65%
    { message: "Maybe this just isn't your game...", weight: 0.95 }, // 5.82%
    { message: "Just one more game!", weight: 0.95 }, // 5.82%
    { message: "Close. I'm sure you'll win the next one!", weight: 0.85 }, // 5.20%
    { message: "They were right about you...", weight: 0.65 }, // 3.98%
    { message: "You should stop...", weight: 0.75 }, // 4.59%
    { message: "Keep trying, script kiddie!", weight: 0.45 }, // 2.76%
    { message: "Loser! Try again?", weight: 0.5 }, // 3.06%
    { message: "Sucks 2 suck! Try again?", weight: 0.5 }, // 3.06%
    { message: "Your $SYPHER = gone!", weight: 0.5 }, // 3.06%
    { message: "F in chat...", weight: 0.35 }, // 2.14%
    { message: "Error 404. Skills not found...", weight: 0.25 }, // 1.53%
    { message: "Skill issue...", weight: 0.15 }, // 0.92%
    { message: "Thank you but NOPE!", weight: 0.175 }, // 1.07%
    { message: "Go back 2 skool!", weight: 0.105 }, // 0.64%
    { message: "Try entering the Konami code!", weight: 0.1 }, // 0.61%
    { message: "You suck. Try again!", weight: 0.1 }, // 0.61%
    { message: "残念！再挑戦?", weight: 0.1 }, // 0.61%
    { message: "tehe! Try again??", weight: 0.001 }, // 0.01%    
];
function getRandomLosingMessage(messages) {
    let totalWeight = messages.reduce((sum, item) => sum + item.weight, 0);
    let randomNum = Math.random() * totalWeight;
    let weightSum = 0;

    for (let i = 0; i < messages.length; i++) {
        weightSum += messages[i].weight;
        if (randomNum <= weightSum) {
            return messages[i].message;
        }
    }
}
// #endregion Losing Messages

// Add listeners to the initial row of inputs
const initialInputs = document.querySelectorAll('.puzzle-input');
addInputListeners(initialInputs);
form.addEventListener('submit', function (event) {
    event.preventDefault();
});

// #region Dynamic Graphical Adjustments Based on Number of Input Rows
// Functions to resize the elements within the page based on the number of input rows
function updateLogoSize() {
    const logo = document.querySelector('.game-logo');
    const inputRows = document.querySelectorAll('.input-fields');
    const scaleFactor = 1 - (0.1 * (inputRows.length - 1));
    logo.style.transform = `scale(${Math.max(scaleFactor, 0.5)})`; // Ensuring minimum scale is 0.5

    // Check if the game has started by checking the number of input rows
    if (inputRows.length > 0) {
        logo.style.marginBottom = "0px"; // Set margin-bottom to 0px when game starts
    } else {
        logo.style.marginBottom = "50px"; // Reset to default when no game is active
    }

    console.log(`Updated logo scale: ${Math.max(scaleFactor, 0.5)}`);
}
function updateMainContentPadding() {
    const mainContent = document.querySelector('.main-content');
    const inputRows = document.querySelectorAll('.input-fields');
    const totalRows = inputRows.length;
    const basePadding = 200; // Base padding value in pixels
    const paddingReductionPerRow = 30; // Reduction per row in pixels

    // Calculate new padding values
    const newPaddingTop = Math.max(basePadding - (paddingReductionPerRow * totalRows), 100); // Ensures minimum padding of 100px
    const newPaddingBottom = Math.max(basePadding - (paddingReductionPerRow * totalRows), 100);

    // Apply new padding values to .main-content
    mainContent.style.paddingTop = `${newPaddingTop}px`;
    mainContent.style.paddingBottom = `${newPaddingBottom}px`;

    console.log(`Updated .main-content padding: top=${newPaddingTop}px, bottom=${newPaddingBottom}px`);
}
// #endregion Dynamic Graphical Adjustments Based on Number of Input Rows

// #region Effects & Extras

// #region Cheat Codes
document.addEventListener('DOMContentLoaded', () => {
    let konamiCode = [
        'ArrowUp', 'ArrowUp', 'ArrowDown',
        'ArrowDown', 'ArrowLeft', 'ArrowRight',
        'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA', 'Enter'
    ];
    let currentPosition = 0;
    let timer;
    const CODE_TIMEOUT = 2000; // Time allowed between key presses in milliseconds

    document.addEventListener('keydown', (e) => {
        if (konamiCode[currentPosition] === e.code) {
            console.log("Correct key: " + e.code);
            currentPosition++;

            clearTimeout(timer);
            if (currentPosition === konamiCode.length) {
                console.log("Code entered!");
                revealMusicPlayer();
                currentPosition = 0; // Reset the position for the next attempt
            } else {
                timer = setTimeout(() => {
                    console.log("Timeout, try again.");
                    currentPosition = 0; // Reset the position due to timeout
                }, CODE_TIMEOUT);
            }
        } else {
            console.log("Incorrect key, try again.");
            currentPosition = 0; // Reset the position if the wrong key is pressed
        }
    });
});
function changeColors() {
    changeColorScheme();
    changeImageColor();
    changeBackgroundColor();
    changeSpritesheetColor();
}
function getRandomGradient() {
    const getRandomColor = () => '#' + Math.floor(Math.random() * 16777215).toString(16);
    const color1 = getRandomColor();
    const color2 = getRandomColor();
    const gradient = `linear-gradient(to left, ${color1} 1%, ${color2} 99%)`;

    return gradient;
}
function changeColorScheme() {
    const root = document.documentElement;
    const getRandomColor = () => '#' + Math.floor(Math.random() * 16777215).toString(16);
    root.style.setProperty('--desypher-green-main', getRandomColor());
    root.style.setProperty('--desypher-green-dark', getRandomColor());
    root.style.setProperty('--desypher-green-ultradark', getRandomColor());
    root.style.setProperty('--desypher-green-bright', getRandomColor());
    root.style.setProperty('--glow-green-main', getRandomColor());
    root.style.setProperty('--glow-green-secondary', getRandomColor());
    root.style.setProperty('--glow-green-dark', getRandomColor());
    // root.style.setProperty('--font-color', getRandomColor());
    root.style.setProperty('--background-gradient', getRandomGradient());

    console.log("Changed color scheme to random colors including gradient.");
}
function changeImageColor() {
    const images = document.querySelectorAll('.game-logo');
    const getRandomHueRotate = () => `hue-rotate(${Math.floor(Math.random() * 360)}deg)`;
    images.forEach(image => {
        image.style.filter = getRandomHueRotate();
    });
    console.log("Applied random color filter to game logo images.");
}
function changeBackgroundColor() {
    const background = document.querySelector('.background-image');
    const getRandomHueRotate = () => `hue-rotate(${Math.floor(Math.random() * 360)}deg)`;
    background.style.filter = getRandomHueRotate();
    console.log("Applied random color filter to the background.");
}
function changeSpritesheetColor() {
    const getRandomHueRotate = () => `hue-rotate(${Math.floor(Math.random() * 360)}deg)`;
    currentHueRotation = getRandomHueRotate();

    // Apply the new hue rotation to all existing spritesheets
    document.querySelectorAll('.spritesheet').forEach(sprite => {
        sprite.style.filter = currentHueRotation;
    });

    console.log("Applied random color filter to all spritesheets.");
}
function lazerRayz() {
    const lazerContainer = document.getElementById('lazerContainer');

    document.addEventListener('mousemove', function (e) {
        // Remove all existing lazers before creating new ones
        while (lazerContainer.firstChild) {
            lazerContainer.removeChild(lazerContainer.firstChild);
        }

        const minLazers = 3; // Minimum number of lazers to spawn
        const maxLazers = 10; // Maximum number of lazers to spawn
        const numLazers = Math.floor(Math.random() * (maxLazers - minLazers + 1)) + minLazers;

        for (let i = 0; i < numLazers; i++) {
            const lazer = document.createElement('div');
            lazer.className = 'lazer';
            const color = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 1)`;
            lazer.style.background = color;
            lazer.style.left = `${e.pageX}px`;
            lazer.style.top = `${e.pageY}px`;
            const angle = Math.random() * 360;
            lazer.style.transform = `rotate(${angle}deg)`;
            lazer.style.width = `${Math.max(window.innerWidth, window.innerHeight)}px`;
            lazer.style.boxShadow = `0 0 10px ${color}`;

            lazerContainer.appendChild(lazer);

            const lifetime = Math.random() * 1000 + 500; // 500 to 1500 milliseconds
            setTimeout(() => {
                lazer.remove();
            }, lifetime);
        }
    });
}
let tukyoModeActive = false;

function tukyoMode() {
    if (tukyoModeActive) {
        console.log("Tukyo mode is already active.");
        return; // Prevent multiple instances if it's already active
    }

    tukyoModeActive = true; // Set the mode as active

    var youtubeUrls = [
        { url: "https://www.youtube.com/embed/_9IX9spM2P4?autoplay=1&mute=0", weight: 10 },
        { url: "https://www.youtube.com/embed/l7jVlOGH4ww?autoplay=1&mute=0", weight: 10 },
        { url: "https://www.youtube.com/embed/tvPUT4NplbM?autoplay=1&mute=0", weight: 10 },
        { url: "https://www.youtube.com/embed/uxfpWD7R6aA?autoplay=1&mute=0", weight: 10 },
        { url: "https://www.youtube.com/embed/pmxUA9P0iOA?autoplay=1&mute=0", weight: 10 },
        { url: "https://www.youtube.com/embed/BToi56kK3Lg?autoplay=1&mute=0", weight: 10 },
        { url: "https://www.youtube.com/embed/5kW_DPHrzFA?autoplay=1&mute=0", weight: 10 },
        { url: "https://www.youtube.com/embed/jNEtE7DeyZQ?autoplay=1&mute=0", weight: 10 },
        { url: "https://www.youtube.com/embed/Dt6buhLTaMc?autoplay=1&mute=0", weight: 10 },
    ];

    function chooseWeightedUrl(urls) {
        var totalWeight = urls.reduce((total, item) => total + item.weight, 0);
        var randomNum = Math.random() * totalWeight;
        var weightSum = 0;

        for (var item of urls) {
            weightSum += item.weight;
            if (randomNum <= weightSum) {
                return item.url;
            }
        }
    }

    var youtubeUrl = chooseWeightedUrl(youtubeUrls);
    console.log("Selected YouTube URL:", youtubeUrl);

    var youtubeIframe = document.getElementById('youtubeIframe');
    var closeButton = document.getElementById('closeButton');
    var iframe = document.getElementById('iframe');

    youtubeIframe.style.display = "block"; // Show the iframe
    youtubeIframe.style.aspectRatio = "16 / 9"; // Ensures nothing extends outside the container

    iframe.setAttribute('src', youtubeUrl);
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowFullscreen = true;

    // Create a close button
    closeButton.style.display = "block"; // Show the close button
    closeButton.innerHTML = "X";

    closeButton.onclick = function () {
        iframe.src = "";
        youtubeIframe.style.display = "none"; // Hide the iframe
        tukyoModeActive = false;
        console.log("Tukyo mode deactivated.");
    };

    console.log("Tukyo mode activated: Video displayed with autoplay.");
}
// #endregion Cheat Codes

// #region Audio
let isMuted = false;
const audioPool = [];
const poolSize = 5; // Adjust based on needs and testing
for (let i = 0; i < poolSize; i++) {
    audioPool.push(new Audio('assets/audio/hover-sound.ogg'));
}
let audioIndex = 0;
const clickAudioPool = [];
const clickSound = 'assets/audio/click-sound.ogg';
for (let i = 0; i < poolSize; i++) {
    clickAudioPool.push(new Audio(clickSound));
}
let clickAudioIndex = 0;
const elements = document.querySelectorAll('button, input');
elements.forEach(element => {
    addAudioListener(element);
});
function addAudioListener(element) {
    element.addEventListener('mouseenter', () => {
        // Hover sound
        const sound = audioPool[audioIndex];
        sound.currentTime = 0; // Rewind to start
        sound.play().catch(error => console.log("Error playing sound:", error));
        audioIndex = (audioIndex + 1) % poolSize;
    });

    // Adding click sound
    element.addEventListener('click', () => {
        // Click sound
        const clickSound = clickAudioPool[clickAudioIndex];
        clickSound.currentTime = 0; // Rewind to start
        clickSound.play().catch(error => console.log("Error playing sound:", error));
        clickAudioIndex = (clickAudioIndex + 1) % poolSize;
    });
}
// #endregion Audio

// #region Music Player
window.revealMusicPlayer = function () {
    document.getElementById('musicPlayer').style.display = 'block';
    const playPauseBtn = document.getElementById('playPauseBtn');
    const nextTrackBtn = document.getElementById('nextTrack');
    const prevTrackBtn = document.getElementById('prevTrack');
    const loopToggleBtn = document.getElementById('loopToggle');
    const volumeControlsBtn = document.getElementById('volume-button');
    const volumeControls = document.getElementById('volume-controls');
    const volumeSlider = document.getElementById('volume-slider');
    const music = document.getElementById('music');
    const progressBar = document.getElementById('musicProgressBar');
    const progressContainer = document.getElementById('musicProgressContainer');
    const pageNavigation = document.querySelector('.page-navigation-section');
    const socialMediaIcons = document.querySelector('.social-media-section');
    const footerSection = document.querySelector('.home-page-footer');

    let currentIndex = Math.floor(Math.random() * songs.length);
    let isLooping = false;

    pageNavigation.style.bottom = '35px';
    socialMediaIcons.style.bottom = '55px';

    const expandedHeight = '110px'; // Expanded height when the player is visible
    document.documentElement.style.setProperty('--footer-height', expandedHeight);

    footerSection.style.animation = 'homeFooterIn 1s forwards';

    function playSong(index) {
        const selectedSong = songs[index];
        music.src = `assets/audio/${selectedSong}`;
        music.play()
            .then(() => {
                console.log("Music playback started successfully with " + selectedSong);
                playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';

                // Extract artist and song name from the filename
                const [artist, songWithExtension] = selectedSong.split('-');
                const songName = songWithExtension.replace('.ogg', '');

                // Update the song info display
                document.getElementById('song-info').textContent = `${artist} - ${songName}`;
            })
            .catch(error => console.error("Error starting music playback:", error));
    }

    function goToNextTrack() {
        currentIndex = (currentIndex + 1) % songs.length; // Go to next track, loop to start if at end
        playSong(currentIndex);
    }

    playSong(currentIndex);

    function updateProgressBar() {
        if (music.duration) {
            const percentage = (music.currentTime / music.duration) * 100;
            progressBar.style.width = percentage + '%';
        }
    }

    music.addEventListener('timeupdate', updateProgressBar);

    // Function to jump to a different part of the song
    function setPlaybackPosition(e) {
        e.preventDefault();

        const width = progressContainer.clientWidth; // Width of the container
        const clickX = e.offsetX; // X position of the click within the container
        const duration = music.duration; // Total duration of the song

        music.currentTime = (clickX / width) * duration; // Calculate and set the new current time
    }

    progressContainer.addEventListener('click', setPlaybackPosition);
    music.addEventListener('timeupdate', updateProgressBar);

    function toggleVolumeControls() {
        // Check the current display state of the volume controls
        if (volumeControls.style.display === 'none') {
            // Show volume controls and hide other buttons
            volumeControls.style.display = 'block';
            prevTrackBtn.style.display = 'none';
            playPauseBtn.style.display = 'none';
            nextTrackBtn.style.display = 'none';
            loopToggleBtn.style.display = 'none';
        } else {
            // Hide volume controls and show other buttons
            volumeControls.style.display = 'none';
            prevTrackBtn.style.display = 'block';
            playPauseBtn.style.display = 'block';
            nextTrackBtn.style.display = 'block';
            loopToggleBtn.style.display = 'block';
        }
    }

    playPauseBtn.addEventListener('click', () => {
        if (music.paused) {
            music.play()
                .then(() => {
                    console.log("Music playback resumed with " + songs[currentIndex]);
                    playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
                })
                .catch(error => console.error("Error resuming music playback:", error));
        } else {
            music.pause();
            console.log("Music playback paused.");
            playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        }
    });
    nextTrackBtn.addEventListener('click', () => {
        goToNextTrack();
    });
    prevTrackBtn.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + songs.length) % songs.length; // Go to previous track, loop to end if at start
        playSong(currentIndex);
    });
    loopToggleBtn.addEventListener('click', () => {
        isLooping = !isLooping;
        music.loop = isLooping;
        if (isLooping) {
            loopToggleBtn.style.color = '#4CAF50'; // Green color when active
        } else {
            loopToggleBtn.style.color = 'white'; // Revert to original color when not active
        }
        console.log("Looping " + (isLooping ? "enabled" : "disabled"));
    });
    volumeControlsBtn.addEventListener('click', toggleVolumeControls);
    volumeSlider.addEventListener('input', function () {
        music.volume = this.value / 100;
        console.log("Volume set to: " + this.value);
    });
    music.addEventListener('ended', () => {
        if (!isLooping) {
            goToNextTrack(); // Handle automatic track change when a song ends
        }
    });
}
function animateSongInfo() {
    const songInfo = document.getElementById('song-info');
    let isScrollingLeft = true;
    let scrollAmount = 0;
    let scrollInterval;  // Declare the interval variable outside to manage it within functions

    function startScrolling() {
        scrollInterval = setInterval(scrollText, 50);  // Start or resume scrolling
    }

    function scrollText() {
        if (songInfo.scrollWidth > songInfo.clientWidth) {
            const maxScrollLeft = songInfo.scrollWidth - songInfo.clientWidth;

            if (isScrollingLeft) {
                scrollAmount += 1;
                if (scrollAmount >= maxScrollLeft) {
                    isScrollingLeft = false;
                    clearInterval(scrollInterval);  // Stop scrolling
                    setTimeout(() => {
                        startScrolling();  // Resume scrolling after the pause
                    }, 2000);  // Longer pause at the end
                }
            } else {
                scrollAmount -= 1;
                if (scrollAmount <= 0) {
                    isScrollingLeft = true;
                    clearInterval(scrollInterval);  // Stop scrolling
                    setTimeout(() => {
                        startScrolling();  // Resume scrolling after the pause
                    }, 2000);  // Longer pause at the start
                }
            }
            songInfo.scrollLeft = scrollAmount;  // Apply the current scroll position
        }
    }

    startScrolling();  // Initially start the scrolling

    window.addEventListener('unload', () => {
        clearInterval(scrollInterval);  // Ensure to clear interval when page unloads
    });
}
animateSongInfo();
document.getElementById('volume-bar').addEventListener('click', function (event) {
    const barWidth = this.offsetWidth;
    const clickedPosition = event.offsetX;
    const volume = clickedPosition / barWidth;
    document.getElementById('music').volume = volume;
    document.getElementById('volume-indicator').style.width = `${volume * 100}%`;
    console.log("Volume set to: " + Math.round(volume * 100) + "%");
});

// #endregion Music Player

// #region Keyboard Helper
function updateKeyboardHelper(results) {
    const buttons = document.querySelectorAll('.keyboard-button');
    results.forEach(result => {
        buttons.forEach(button => {
            if (button.textContent.toUpperCase() === result.letter.toUpperCase()) {
                if (result.status === 'correct') {
                    button.style.backgroundColor = 'var(--correct)';  // Correct guesses get a green background
                } else if (result.status === 'incorrect') {
                    button.style.backgroundColor = 'var(--incorrect)';    // Incorrect guesses get a red background
                }
            }
        });
    });
}
// #endregion Keyboard Helper

// #endregion Effects & Extras

// #region Rules Dropdown
// Get the dropdown button and content elements
document.addEventListener('DOMContentLoaded', function () {
    var dropdown = document.querySelector('.dropdown-button');
    var dropdownContent = document.querySelector('.dropdown-content');

    dropdown.addEventListener('click', function () {
        if (dropdownContent.classList.contains('show')) {
            dropdownContent.style.animation = 'tvScreenOff 0.25s ease forwards';
            setTimeout(function () {
                dropdownContent.style.animation = '';
                dropdownContent.classList.remove('show');
            }, 500);
        } else {
            dropdownContent.classList.add('show');
        }
    });
});
// #endregion Rules Dropdown

// #region SYPHER Cache Logic
document.addEventListener('DOMContentLoaded', async () => {
    const sypherCacheElement = document.getElementById('sypher-cache-value');
    const sypherCacheContainer = document.querySelector('.sypher-cache');
    let provider;

    try {
        const response = await fetch('endpoints.json');
        const config = await response.json();

        // Initialize provider using the testnet endpoint from the configuration
        provider = new ethers.providers.JsonRpcProvider(config.testnetEndpoint);

        // Assuming you have the correct addresses and ABIs
        const deSypherContract = new ethers.Contract(gameContractAddress, gameContractABI, provider);
        const gameManagerContract = new ethers.Contract(gameManagerAddress, gameManagerABI, provider);

        // Fetch the sypher cache value from GameManager
        const sypherCache = await gameManagerContract.getSypherCache();
        const formattedSypherCache = ethers.utils.formatUnits(sypherCache, 18); // Assuming 'sypherCache' uses 18 decimal places
        sypherCacheElement.innerHTML = `<span style="font-weight: bold;">${formattedSypherCache}</span>`;
        console.log("Sypher Cache loaded: " + formattedSypherCache);

        // Event listener for SypherCacheUpdated from deSypher contract
        deSypherContract.on('SypherCacheUpdated', (newCacheAmount) => {
            // TODO: Shuffle letters or add a visual effect when the cache is updated
            const formattedNewCache = ethers.utils.formatUnits(newCacheAmount, 18);
            sypherCacheElement.innerHTML = `<span style="font-weight: bold;">${formattedNewCache}</span>`;
            console.log("Sypher Cache updated live: " + formattedNewCache);
        });

    } catch (error) {
        console.error("Failed to load configuration or blockchain interaction failed: ", error);
        sypherCacheContainer.style.display = 'none';
    }
});
// #endregion SYPHER Cache Logic

// #region Load Game Logic
document.addEventListener('gameRestart', (e) => {
    console.log("Received game restart event:", e.detail.reason);
    if (e.detail.sessionData) {
        console.log("Session data received with the game restart event:", e.detail.sessionData);
        loadGame(e.detail.sessionData);  // Correctly pass session data to the loadGame function
    } else {
        console.error("No session data received with the game restart event.");  // Only log this when no data is received
        document.dispatchEvent(new CustomEvent('appError', { detail: 'No session data found...' }));
    }
});
document.addEventListener('hideSessionRecoveryForm', resetUIElements);
function loadGame(sessionData) {
    document.getElementById('inputContainer').innerHTML = '';
    form.style.display = 'block';

    if (sessionData && sessionData.guesses) {
        sessionData.guesses.forEach((guess, index) => {
            console.log(`Guess ${index + 1}: ${guess.word}`);
        });
        restoreGameSession(sessionData.guesses);
        restoreKeyboardHelper(sessionData.guesses);
        window.dispatchEvent(gameStartEvent);
        console.log("Game session restored successfully.");
    } else {
        console.error("No guesses found in the session data or session data is missing.");
        document.dispatchEvent(new CustomEvent('appError', { detail: 'No guesses found in the session data or session data is missing.' }));
        sendGuess();
    }

    // UI reset for the game elements
    resetUIElements();

    updateUI(sessionData);
};
function resetUIElements() {
    // Reset visibility and animation styles for elements like buttons and transaction inputs
    cancelButton.style.opacity = '1';
    cancelButton.style.display = 'block';
    cancelButton.style.animation = 'tvScreenOff .1s forwards';
    cancelButton.style.animationDelay = '.025s';
    cancelButton.addEventListener('animationend', () => setDisplayNone(cancelButton));

    submitLoadButton.style.opacity = '1';
    submitLoadButton.style.display = 'block';
    submitLoadButton.style.animation = 'tvScreenOff .1s forwards';
    submitLoadButton.style.animationDelay = '.05s';
    submitLoadButton.addEventListener('animationend', () => setDisplayNone(submitLoadButton));

    retrieveTransaction.style.opacity = '1';
    retrieveTransaction.style.display = 'block';
    retrieveTransaction.style.animation = 'tvScreenOff .1s forwards';
    retrieveTransaction.style.animationDelay = '.1s';
    retrieveTransaction.addEventListener('animationend', () => setDisplayNone(retrieveTransaction));

    console.log("Session recovery form elements removed...");
}
function setDisplayNone(element) {
    element.style.display = 'none';
}
function restoreGameSession(guesses) {
    form.style.display = 'block'; // Reveal the form
    inputContainer.innerHTML = ''; // Clear existing input rows

    // Create input rows for each guess
    guesses.forEach(guess => {
        restoreInputRows(guess.result);
        console.log("Restored input row for guess:", guess.word.toUpperCase());
    });
}
function restoreInputRows(guessResult = []) {
    const row = document.createElement('div');
    row.className = 'input-fields';

    guessResult.forEach((result, i) => {
        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = '1';
        input.className = 'puzzle-input';

        input.value = result.letter; // Set the letter regardless of status
        input.style.backgroundColor = getColorForStatus(result.status); // Set background color based on the status
        input.style.boxShadow = `0 0 10px ${getColorForStatus(result.status)}, 0 0 20px ${getColorForStatus(result.status)}`; // Apply matching shadow

        if (result.status === 'correct') {
            input.disabled = true; // Disable input if the letter is correctly placed
        }

        addAudioListener(input);
        row.appendChild(input);
    });

    inputContainer.appendChild(row);
}
function restoreKeyboardHelper(allGuesses) {
    const buttons = document.querySelectorAll('.keyboard-button');
    let letterColors = {};

    allGuesses.forEach(guess => {
        guess.result.forEach(result => {
            // If the letter is correct or if it's not already marked as correct, update the color
            if (result.status === 'correct' || letterColors[result.letter] !== 'green') {
                letterColors[result.letter] = result.status === 'correct' ? 'green' : 'red';
            }
        });
    });
    for (const [letter, color] of Object.entries(letterColors)) {
        buttons.forEach(button => {
            if (button.textContent.toUpperCase() === letter.toUpperCase()) {
                button.style.backgroundColor = color;
            }
        });
    }
}
// #endregion Load Game Logic