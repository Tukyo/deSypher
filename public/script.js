document.addEventListener('DOMContentLoaded', function () {})
    
    let gameOver = false; // Checks if game is over
    
    const form = document.getElementById('wordPuzzleForm');
    const inputContainer = document.getElementById('inputContainer');
    const feedback = document.getElementById('feedback');

    //#region Color Palette
    const colorPalette = {
        green: '#2dc60e',
        yellow: '#f6f626cb',
        red: '#f02020ad',
    };
    //#endregion Color Palette

    //#region WordGame Main

    // function checkWord(inputs) {
    //     const enteredWord = Array.from(inputs).map(input => input.value.toUpperCase()).join('');
    //     let currentFrequency = {...letterFrequency}; // Copy of the letter frequency for manipulation

    //     // First pass for exact matches (potentially green or orange)
    //     Array.from(inputs).forEach((input, index) => {
    //         if (input.value.toUpperCase() === correctWord[index]) {
    //             // Temporarily mark as green, might change to orange later
    //             input.style.backgroundColor = 'lightgreen';
    //             currentFrequency[input.value.toUpperCase()] -= 1;
    //         }
    //     });

    //     // Second pass for correct letters that are also elsewhere (orange) and letters in wrong place (yellow)
    //     Array.from(inputs).forEach((input, index) => {
    //         const char = input.value.toUpperCase();
    //         if (char === correctWord[index] && currentFrequency[char] > 0) {
    //             // If the letter matches and is still in frequency, it's also elsewhere
    //             input.style.backgroundColor = 'orange';
    //         } else if (input.style.backgroundColor !== 'lightgreen') { // Skip already marked green
    //             if (correctWord.includes(char) && currentFrequency[char] > 0) {
    //                 input.style.backgroundColor = 'yellow';
    //                 currentFrequency[char] -= 1;
    //             }
    //         }
    //     });

    //     // Third pass for incorrect letters (red)
    //     Array.from(inputs).forEach((input, index) => {
    //         if (input.style.backgroundColor !== 'lightgreen' && input.style.backgroundColor !== 'orange' && input.style.backgroundColor !== 'yellow') {
    //             input.style.backgroundColor = 'lightcoral';
    //         }
    //     });

    //     if (enteredWord === correctWord) {
    //         // Disable all input fields on success
    //         Array.from(document.querySelectorAll('.puzzle-input')).forEach(input => {
    //             input.disabled = true;
    //         });
    //         // Display the success message without removing the fields
    //         feedback.textContent = 'Success!';
    //         feedback.style.color = 'green';
    //         feedback.style.fontSize = '24px';
    //         feedback.style.marginTop = '20px';
    //         gameOver = true; // Add this line to indicate the game is over
    //         return true; // Word is correct
    //     } else {
    //         return false; // Word is not correct
    //     }
    // }
    
    function sendGuess() {
        const inputs = document.querySelectorAll('.puzzle-input');
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
                //handleAttempt();
                updateUI(data);
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
        const inputs = document.querySelectorAll('.puzzle-input');
        const button = document.getElementById('submitButton');
        const inputContainer = document.getElementById('inputContainer'); // Ensure you have this container in your HTML
    
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
            row.appendChild(input);
        }
        inputContainer.appendChild(row);
        return row.querySelectorAll('.puzzle-input');
    }

    // function handleAttempt() {
    //     // Check if the game is already over
    //     if (gameOver) {
    //         return; // Exit the function early if the game is over
    //     }

    //     if (isCorrect) {
    //         feedback.textContent = 'Success!';
    //         feedback.style.color = 'green';
    //         gameOver = true; // Set the flag to true as the game is over
    //         // Disable all inputs
    //         Array.from(document.querySelectorAll('.puzzle-input')).forEach(input => {
    //             input.disabled = true;
    //         });
    //     } else {
    //         attemptCount++;
    //         if (attemptCount < maxAttempts && !gameOver) {
    //             // Only add a new row if the game is not over
    //             const newInputs = createInputRow();
    //             newInputs[0].focus();
    //             addInputListeners(newInputs);
    //         } else {
    //             feedback.textContent = 'Game Over!';
    //             feedback.style.color = 'red';
    //             gameOver = true; // Set the flag to true as the game is over
    //             Array.from(document.querySelectorAll('.puzzle-input')).forEach(input => {
    //                 input.disabled = true;
    //             });
    //         }
    //     }
    // }

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
        console.log("spawning matrix rain");
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
    //#region Konami Code
    document.addEventListener('DOMContentLoaded', (event) => {
        let konamiCode = [
            'ArrowUp', 'ArrowUp', 'ArrowDown',
            'ArrowDown', 'ArrowLeft', 'ArrowRight',
            'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA', 'Enter'
        ];
        let currentPosition = 0;
        let timer;
        const KONAMI_CODE_TIMEOUT = 2000; // Time allowed between key presses in milliseconds
    
        document.addEventListener('keydown', (e) => {
            if (konamiCode[currentPosition] === e.code) {
                console.log("Correct key: " + e.code);
                currentPosition++;
    
                clearTimeout(timer);
                if (currentPosition === konamiCode.length) {
                    console.log("Konami code entered!");
                    playMusic();
                    currentPosition = 0; // Reset the position for the next attempt
                } else {
                    timer = setTimeout(() => {
                        console.log("Timeout, resetting Konami code sequence.");
                        currentPosition = 0; // Reset the position due to timeout
                    }, KONAMI_CODE_TIMEOUT);
                }
            } else {
                console.log("Incorrect key, resetting Konami code sequence.");
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
    //#endregion Konami Code
    //#endregion Effects & Extras

    //#region Web3 Connectivity
    // Function to update the button text with the wallet address
    function updateButtonWithAddress(address) {
        const connectButton = document.getElementById('connect-button');
        connectButton.textContent = `Connected: ${address.substring(0, 6)}...${address.substring(address.length - 4)}`; // Display a shortened version of the address
    }

    // Function to connect to the wallet
    async function connectWallet() {
        if (window.ethereum) { // Check if MetaMask is installed
            try {
                updateButtonWithAddress(account); // Update the button with the connected wallet address
                await window.ethereum.request({ method: 'eth_requestAccounts' }); // Request account access
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const signer = provider.getSigner();
                const account = await signer.getAddress();
            } catch (error) {
                console.error(error);
            }
        } else {
            console.log("MetaMask is not installed. Please consider installing it: https://metamask.io/download.html");
        }
    }

    // Add click event listener to the connect button
    document.getElementById('connect-button').addEventListener('click', connectWallet);

    // Check if MetaMask is already connected when the page loads
    window.addEventListener('load', async () => {
        if (window.ethereum) {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const accounts = await provider.listAccounts();
            if (accounts.length > 0) {
                updateButtonWithAddress(accounts[0]); // Update the button if an account is already connected
            }
        }
    });
    //#endregion Web3 Connectivity

    //#region Rules Dropdown
    // Get the dropdown button and content elements
    document.addEventListener('DOMContentLoaded', function() {
        var dropdown = document.querySelector('.dropdown-button');
        var dropdownContent = document.querySelector('.dropdown-content');
    
        dropdown.addEventListener('click', function () {
            dropdownContent.classList.toggle('show');
        });
    });
    //#endregion Rules Dropdown   