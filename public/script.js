document.addEventListener('DOMContentLoaded', function () {})

    let ethersProvider = new ethers.providers.Web3Provider(window.ethereum);
    
    let gameOver = false; // Checks if game is over

    const REQUIRED_CHAIN_ID = '8453'; // Base L2
    
    const form = document.getElementById('wordPuzzleForm');
    const inputContainer = document.getElementById('inputContainer');
    const feedback = document.getElementById('feedback');

    const playButton = document.getElementById('playButton');

    // const address = ""; // Contract address
    // const abi = // Contract ABI list

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
            if (accounts.length === 0) {
                // No wallet is connected, prevent the button from doing anything
                event.preventDefault();
                playButton.textContent = "No Wallet Connected!";
                console.log("No wallet connected");
                return;
            }
        } else {
            // MetaMask is not installed, prevent the button from doing anything
            event.preventDefault();
            playButton.textContent = "No Wallet Connected!";
            console.log("MetaMask is not installed");
            return;
        }

        // Hide the Play button
        playButton.style.display = 'none';
        // Show the form
        form.style.display = 'block';

        console.log("Game started: Play button clicked.");
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

    //#region Web3 Connectivity
    // Function to connect to the wallet
    function connectWallet() {
        if (window.ethereum) {
            ethereum.request({ method: 'eth_requestAccounts' })
            .then(() => document.getElementById("count").click())
            .catch((error) => console.error(error.message));
    
                const provider = new ethers.providers.Web3Provider(window.ethereum);
    
                // const signer = provider.getSigner();
    
                // const contract = new ethers.Contract(address, abi, signer);
            }
            else {
                console.error("Please install MetaMask!");
            }
    }

    if (window.ethereum) {
        ethereum.on("chainChanged", () => window.location.reload());
        
        ethereum.on("message", (message) => console.log(message));
    
        ethereum.on("connect", (connectInfo) => {
            console.log(`Connected to ${connectInfo.chainId} network`);
        });

        ethereum.on("disconnect", () => window.location.reload());
        ethereum.on("accountsChanged", (accounts) => {
            if (accounts.length > 0) {
                console.log(`Using account ${accounts[0]}`);
                document.getElementById('connect-button').textContent = 'Connected: ' + accounts[0];
            } else {
                console.error("0 accounts available!");
            }
            // Reload the page whenever the accounts change
            window.location.reload();
        });
    }

    // Function to update the button text with the wallet address
    function updateButtonWithAddress(address) {
        const connectButton = document.getElementById('connect-button');
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        provider.lookupAddress(address).then(ensName => {
            if (ensName) {
                connectButton.textContent = `${ensName}`; // Display the ENS name if one exists
            } else {
                connectButton.textContent = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`; // Display a shortened version of the address
            }
        }).catch(error => {
            console.error("ENS is not supported on this network");
            connectButton.textContent = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`; // Display a shortened version of the address
        });
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