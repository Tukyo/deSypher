let gameOver = false; // Checks if game is over

const form = document.getElementById('wordPuzzleForm');
const inputContainer = document.getElementById('inputContainer');
const feedback = document.getElementById('feedback');

const REQUIRED_CHAIN_ID = 8453; // Base L2

//#region Audio
let isMuted = false;
const muteButton = document.getElementById('mute-button');
muteButton.addEventListener('click', () => {
    // Toggle the mute state
    isMuted = !isMuted;
    // Set the appropriate icon based on the mute state
    muteButton.className = isMuted ? 'fa-solid fa-volume-off' : 'fa-solid fa-volume-high';
    // Set the volume of all audio objects in the hover and click pools
    audioPool.forEach(audio => audio.muted = isMuted);
    clickAudioPool.forEach(audio => audio.muted = isMuted);
    // Log the state change
    console.log("Mute state changed: " + (isMuted ? "Muted" : "Unmuted"));
});
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
    element.addEventListener('mouseenter', () => {
        // Use an audio object from the hover pool
        const hoverSound = audioPool[audioIndex];
        hoverSound.currentTime = 0; // Rewind to start
        hoverSound.play().catch(error => console.log("Error playing sound:", error));
        audioIndex = (audioIndex + 1) % poolSize;
    });

    // Add click event listener
    element.addEventListener('click', () => {
        // Use an audio object from the click pool
        const clickSound = clickAudioPool[clickAudioIndex];
        clickSound.currentTime = 0; // Rewind to start
        clickSound.play().catch(error => console.log("Error playing sound:", error));
        clickAudioIndex = (clickAudioIndex + 1) % poolSize;
    });
});
//#endregion Audio

//#region WordGame Main 
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
        alert('The word must be exactly 5 letters long.');
        return; // Exit the function early if the word is not 5 letters
    }

    if (word.toLowerCase() === 'music') {
        console.log('Cheat code activated: Revealing music player.');
        revealMusicPlayer();
        return; // Do not proceed with the fetch request
    }


    fetch('/guess', {
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
                alert(data.error);
            } else {
                updateUI(data);
            }
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

document.getElementById('wordPuzzleForm').addEventListener('submit', function (event) {
    event.preventDefault();
    sendGuess();
});

function updateUI(data) {
    const rows = document.querySelectorAll('.input-fields');
    const lastRow = rows[rows.length - 1];
    const inputs = lastRow.querySelectorAll('.puzzle-input');
    const button = document.getElementById('submitButton');

    // Color the inputs based on the guess result
    data.result.forEach((item, index) => {
        inputs[index].style.backgroundColor = getColorForStatus(item.status); // Use a function to determine color
        inputs[index].disabled = true; // Disable the input after the guess
    });

    updateKeyboardHelper(data.result); // Update the keyboard helper

    if (data.isWin || data.gameOver) {
        button.textContent = data.isWin ? "Code deSyphered! Play again?" : "Game Over... Try Again?";
        button.disabled = false; // Make sure button is clickable

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
        button.onclick = function (event) {
            event.preventDefault(); // Prevent form submission
            window.location.reload(); // Refresh the page to start a new game
        };
    } else {
        console.log(`Try again! Attempts left: ${data.attemptsLeft}`);
        // Reset the button for regular game flow
        button.textContent = "Submit";
        button.disabled = false; // Ensure it's enabled for further guesses
        button.onclick = null; // Remove onclick to prevent interfering with regular submit

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
            input.disabled = true; // Make field unselectable
        } else {
            // If this is the first enabled input, mark its index
            if (firstEnabledInputIndex === -1) firstEnabledInputIndex = i;
        }

        addAudioListener(input);

        row.appendChild(input);
    }
    inputContainer.appendChild(row);

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
// Helper function to determine the color based on the status
function getColorForStatus(status) {
    const colorPalette = {
        correct: '#2dc60e',
        misplaced: '#f6f626cb',
        incorrect: '#f02020ad',
    };
    return colorPalette[status] || 'grey'; // Default to 'grey' if status is unknown
}
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

// Add listeners to the initial row of inputs
const initialInputs = document.querySelectorAll('.puzzle-input');
addInputListeners(initialInputs);

form.addEventListener('submit', function (event) {
    event.preventDefault();
});
//#endregion WordGame Main

//#region Effects & Extras

//#region Cyber Rain
function spawnSpritesheet() {
    // console.log("spawning matrix rain");
    const sprite = document.createElement('div');
    sprite.className = 'spritesheet';
    sprite.style.left = Math.random() * (window.innerWidth - 128) + 'px'; // Randomize the horizontal position
    document.body.appendChild(sprite);

    // Start cycling through the spritesheet frames
    let frame = 0;
    const maxFrames = 16;
    const frameRate = 240; // Frame rate in ms, adjust as needed for animation speed
    const intervalId = setInterval(() => {
        if (frame >= maxFrames) {
            clearInterval(intervalId); // Stop the interval
            document.body.removeChild(sprite); // Remove the sprite from the DOM
        } else {
            sprite.style.backgroundPosition = `${-frame * 128}px 0`; // Move the background position to show the next frame
            frame++;
        }
    }, frameRate);

    // Optionally, you can also remove the sprite after the fall animation ends as a fallback
    sprite.addEventListener('animationend', function () {
        clearInterval(intervalId); // Ensure the frame interval is cleared
        document.body.removeChild(sprite);
    });
}
// Spawn a new spritesheet element every few seconds
setInterval(spawnSpritesheet, 1000); // Adjust interval as needed
//#endregion Cyber Rain

//#region Cheat Codes
document.addEventListener('DOMContentLoaded', (event) => {
    let konamiCode = [
        'ArrowUp', 'ArrowUp', 'ArrowDown',
        'ArrowDown', 'ArrowLeft', 'ArrowRight',
        'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA', 'Enter'
    ];
    let currentPosition = 0;
    let timer;
    const CODE_TIMEOUT = 2000; // Time allowed between key presses in milliseconds
    const songs = [
        'vaang-h4ck3rm0d3act1v4t3d.ogg', 'tukyo-deSypher.ogg', 'vaang-caliente.ogg'
    ];

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

    window.revealMusicPlayer = function () {
        document.getElementById('musicPlayer').style.display = 'block';
        const playPauseBtn = document.getElementById('playPauseBtn');
        const nextTrackBtn = document.getElementById('nextTrack');
        const prevTrackBtn = document.getElementById('prevTrack');
        const loopToggleBtn = document.getElementById('loopToggle');
        const music = document.getElementById('music');
        const progressBar = document.getElementById('musicProgressBar');
        const progressContainer = document.getElementById('musicProgressContainer');
        let currentIndex = Math.floor(Math.random() * songs.length);
        let isLooping = false;

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
            const width = progressContainer.clientWidth; // Width of the container
            const clickX = e.offsetX; // X position of the click within the container
            const duration = music.duration; // Total duration of the song

            music.currentTime = (clickX / width) * duration; // Calculate and set the new current time
        }

        progressContainer.addEventListener('click', setPlaybackPosition);
        music.addEventListener('timeupdate', updateProgressBar);

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
                loopToggleBtn.style.color = '#4CAF50'; // Example: green color when active
            } else {
                loopToggleBtn.style.color = 'white'; // Revert to original color when not active
            }
            console.log("Looping " + (isLooping ? "enabled" : "disabled"));
        });

        // Handle automatic track change when a song ends
        music.addEventListener('ended', () => {
            if (!isLooping) {
                goToNextTrack();
            }
        });
    }
});
//#endregion Cheat Codes

// #region Keyboard Helper
function updateKeyboardHelper(results) {
    const buttons = document.querySelectorAll('.keyboard-button');
    results.forEach(result => {
        buttons.forEach(button => {
            if (button.textContent.toUpperCase() === result.letter.toUpperCase()) {
                if (result.status === 'correct') {
                    button.style.backgroundColor = 'green';  // Correct guesses get a green background
                } else if (result.status === 'incorrect') {
                    button.style.backgroundColor = 'red';    // Incorrect guesses get a red background
                }
            }
        });
    });
}
// #endregion Keyboard Helper

//#endregion Effects & Extras

//#region Rules Dropdown
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
//#endregion Rules Dropdown

// #region SYPHER Cache Logic
// TODO Use an endpoint to initialize the SYPHER CACHE even if someone doesn't have a wallet or is not connected
document.addEventListener('DOMContentLoaded', async () => {
    const sypherCacheElement = document.getElementById('sypher-cache-value');
    const sypherCacheContainer = document.querySelector('.sypher-cache');

    if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.providers.Web3Provider(window.ethereum);

        // Assuming you have the correct addresses and ABIs
        const deSypherContract = new ethers.Contract(gameContractAddress, gameContractABI, provider);
        const gameManagerContract = new ethers.Contract(gameManagerAddress, gameManagerABI, provider);

        try {
            // Fetch the sypher cache value from GameManager
            const sypherCache = await gameManagerContract.getSypherCache();
            const formattedSypherCache = ethers.utils.formatUnits(sypherCache, 18); // Assuming 'sypherCache' uses 18 decimal places
            sypherCacheElement.innerHTML = `<span style="font-weight: bold; font-size: 22px;">${formattedSypherCache}</span>`;
            console.log("Sypher Cache loaded: " + formattedSypherCache);
        } catch (error) {
            console.error("Error loading the Sypher Cache: ", error);
            sypherCacheContainer.style.display = 'none';
        }

        // Event listener for SypherCacheUpdated from deSypher contract
        deSypherContract.on('SypherCacheUpdated', (newCacheAmount) => {
            const formattedNewCache = ethers.utils.formatUnits(newCacheAmount, 18);
            sypherCacheElement.innerHTML = `<span style="font-weight: bold; font-size: 22px;">${formattedNewCache}</span>`;
            console.log("Sypher Cache updated live: " + formattedNewCache);
        });
    } else {
        console.log("Ethereum provider not found. Make sure you have MetaMask installed.");
        sypherCacheContainer.style.display = 'none';
    }
});

// #endregion SYPHER Cache Logic