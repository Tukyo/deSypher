document.addEventListener('DOMContentLoaded', function () {})
    
    let gameOver = false; // Checks if game is over
    
    const form = document.getElementById('wordPuzzleForm');
    const inputContainer = document.getElementById('inputContainer');
    const feedback = document.getElementById('feedback');

    const playButton = document.getElementById('playButton');

    const REQUIRED_CHAIN_ID = 8453; // Base L2

    //#region Audio
    const audioPool = [];
    const poolSize = 5; // Adjust based on needs and testing
    for (let i = 0; i < poolSize; i++) {
        audioPool.push(new Audio('assets/hover_sound.ogg'));
    }
    let audioIndex = 0;

    const elements = document.querySelectorAll('button, input');

    elements.forEach(element => {
        element.addEventListener('mouseenter', () => {
            // Use an audio object from the pool
            const sound = audioPool[audioIndex];
            sound.currentTime = 0; // Rewind to start
            sound.play().catch(error => console.log("Error playing sound:", error));

            // Move to the next audio object in the pool for the next event
            audioIndex = (audioIndex + 1) % poolSize;
        });
    });
    //#endregion Audio

    //#region Color Palette
    const colorPalette = {
        green: '#2dc60e',
        yellow: '#f6f626cb',
        red: '#f02020ad',
    };
    //#endregion Color Palette

    //#region WordGame Main 
    playButton.addEventListener('click', async function(event) {
        if (window.ethereum) {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const accounts = await provider.listAccounts();
            const network = await provider.getNetwork();
            const chainId = network.chainId;
            if (accounts.length === 0 ) {
                // No wallet is connected, prevent the button from doing anything
                event.preventDefault();
                playButton.textContent = "No Wallet Connected!";
                console.log("No wallet connected");
                return;
            }
            if (chainId !== REQUIRED_CHAIN_ID) {
                // The player is on the wrong chain, prevent the button from doing anything
                event.preventDefault();
                playButton.textContent = "Please switch to Base Mainnet!";
                console.log("Wrong chain");
                return;
            }
            if (chainId === REQUIRED_CHAIN_ID) {
                // Hide the Play button
                playButton.style.display = 'none';
                // Show the form
                form.style.display = 'block';
    
                console.log("Wallet connected, and player is on the correct chain, game started.");
            }
        } else {
            // MetaMask is not installed, prevent the button from doing anything
            event.preventDefault();
            playButton.textContent = "No Wallet Connected!";
            console.log("MetaMask is not installed");
            return;
        }
    });
    function sendGuess() {
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
        fetch(`/guess?word=${word}`)
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
            if (item.status === 'correct') {
                inputs[index].style.backgroundColor = colorPalette.green;
            } else if (item.status === 'misplaced') {
                inputs[index].style.backgroundColor = colorPalette.yellow;
            } else {
                inputs[index].style.backgroundColor = colorPalette.red;
            }
            inputs[index].disabled = true; // Disable the input after the guess
        });
    
        if (data.isWin) {
            alert('Congratulations, you won!');
            button.disabled = true; // Disable the button
        } else if (data.gameOver) {
            alert(`Game over! The correct word was ${data.correctWord}.`);
            button.disabled = true; // Disable the button
        } else {
            // Update the UI to reflect the number of remaining attempts
            console.log(`Try again! Attempts left: ${data.attemptsLeft}`);
            // Create a new row for the next guess
            const newInputs = createInputRow();
            addInputListeners(newInputs);
        }
    }

    function createInputRow() {
        const inputContainer = document.getElementById('inputContainer'); // Ensure you have this container in your HTML
        const row = document.createElement('div');
        row.className = 'input-fields';
        for (let i = 0; i < 5; i++) {
            const input = document.createElement('input');
            input.type = 'text';
            input.maxLength = '1';
            input.className = 'puzzle-input';
    
            // Add the hover sound effect to the input
            input.addEventListener('mouseenter', function() {
                // Use an audio object from the pool
                const sound = audioPool[audioIndex];
                sound.currentTime = 0; // Rewind to start
                sound.play().catch(error => console.log("Error playing sound:", error));
    
                // Move to the next audio object in the pool for the next event
                audioIndex = (audioIndex + 1) % poolSize;
            });
    
            row.appendChild(input);
        }
        inputContainer.appendChild(row);
        return row.querySelectorAll('.puzzle-input');
    }

    function addInputListeners(inputs) {
        inputs.forEach((input, index) => {
            // Keydown listener for backspace functionality
            input.addEventListener('keydown', function (event) {
                if (event.key === "Backspace" && input.value === '' && index > 0) {
                    // Prevent default backspace behavior
                    event.preventDefault();
                    // Clear the previous input
                    inputs[index - 1].value = '';
                    // Move focus to the previous input
                    inputs[index - 1].focus();
                }
            });

            // Input event listener to move to the next field
            input.addEventListener('input', function () {
                // Move to the next field on input
                if (input.value.length === 1 && index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }
            });
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
    
        document.addEventListener('keydown', (e) => {
            if (konamiCode[currentPosition] === e.code) {
                console.log("Correct key: " + e.code);
                currentPosition++;
    
                clearTimeout(timer);
                if (currentPosition === konamiCode.length) {
                    console.log("Code entered!");
                    playMusic();
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
    
        function playMusic() {
            var music = new Audio('/assets/h4ck3rm0d3act1v4t3d.ogg');
            music.loop = true; // Enable looping
        
            music.play()
                .then(() => console.log("Music playback started successfully and will loop."))
                .catch(error => console.error("Error starting music playback:", error));
        }
    });
    //#endregion Cheat Codes
    
    //#endregion Effects & Extras

    //#region Rules Dropdown
    // Get the dropdown button and content elements
    document.addEventListener('DOMContentLoaded', function() {
        var dropdown = document.querySelector('.dropdown-button');
        var dropdownContent = document.querySelector('.dropdown-content');
    
        dropdown.addEventListener('click', function () {
            if (dropdownContent.classList.contains('show')) {
                dropdownContent.style.animation = 'tvScreenOff 0.25s ease forwards';
                setTimeout(function() {
                    dropdownContent.style.animation = '';
                    dropdownContent.classList.remove('show');
                }, 500);
            } else {
                dropdownContent.classList.add('show');
            }
        });
    });
    //#endregion Rules Dropdown   