document.addEventListener('DOMContentLoaded', function() {

    const provider = new ethers.providers.Web3Provider(window.ethereum);

    // Base Mainnet
    const REQUIRED_CHAIN_ID = 11155111; // Replace with 8453

    // Replace with actual token contract address <<<<!!!
    const tokenContractAddress = '0xb0292C7BcAD2196BE8e9534625Ca4B89b83c4e3F';

    // #region ABI Constants
    // Replace with actual token contract ABI <<<<!!!
    const tokenContractABI = [
        {
          "inputs": [],
          "stateMutability": "nonpayable",
          "type": "constructor"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "owner",
              "type": "address"
            },
            {
              "indexed": true,
              "internalType": "address",
              "name": "spender",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "value",
              "type": "uint256"
            }
          ],
          "name": "Approval",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "from",
              "type": "address"
            },
            {
              "indexed": true,
              "internalType": "address",
              "name": "to",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "value",
              "type": "uint256"
            }
          ],
          "name": "Transfer",
          "type": "event"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            }
          ],
          "name": "allowance",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "spender",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "value",
              "type": "uint256"
            }
          ],
          "name": "approve",
          "outputs": [
            {
              "internalType": "bool",
              "name": "success",
              "type": "bool"
            }
          ],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            }
          ],
          "name": "balanceOf",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "decimals",
          "outputs": [
            {
              "internalType": "uint8",
              "name": "",
              "type": "uint8"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "name",
          "outputs": [
            {
              "internalType": "string",
              "name": "",
              "type": "string"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "symbol",
          "outputs": [
            {
              "internalType": "string",
              "name": "",
              "type": "string"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "totalSupply",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "to",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "value",
              "type": "uint256"
            }
          ],
          "name": "transfer",
          "outputs": [
            {
              "internalType": "bool",
              "name": "success",
              "type": "bool"
            }
          ],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "from",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "to",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "value",
              "type": "uint256"
            }
          ],
          "name": "transferFrom",
          "outputs": [
            {
              "internalType": "bool",
              "name": "success",
              "type": "bool"
            }
          ],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ];
    const gameContractABI = [
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "_sypherTokenAddress",
              "type": "address"
            }
          ],
          "stateMutability": "nonpayable",
          "type": "constructor"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "internalType": "address",
              "name": "player",
              "type": "address"
            }
          ],
          "name": "GameStarted",
          "type": "event"
        },
        {
          "inputs": [],
          "name": "costToPlay",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "owner",
          "outputs": [
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "player",
              "type": "address"
            }
          ],
          "name": "playGame",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "sypherToken",
          "outputs": [
            {
              "internalType": "contract ISypherToken",
              "name": "",
              "type": "address"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "to",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "amount",
              "type": "uint256"
            }
          ],
          "name": "withdrawTokens",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ];
    // #endregion ABI Constants

    // Replace with actual game smart contract address <<<<!!!
    const gameContractAddress = '0x6D29342676DF775069480c1f199BbCf8Ac91bE9d';

    const connectButton = document.getElementById('connect-button');
    const playButton = document.getElementById('playButton');
    const loadingBar = document.querySelector('.loading-bar');
    const tokenBalanceSection = document.getElementById('token-balance-section');
    const minimumBalance = 0.001; // Cost to play the game

    // #region Manual Wallet Connection
    // Add click event listener to the connect button
    connectButton.addEventListener('click', async () => {
        if (!window.ethereum) {
            // Throw an error and redirect to wallet page if user tries to connect without a wallet installed
            console.error("No wallet installed!");
            window.location.href = "about.html";
            return;
        }

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        const network = await provider.getNetwork();
        const chainId = network.chainId; // Add this line to declare the chainId variable
    
        if (accounts.length !== 0 && chainId === REQUIRED_CHAIN_ID) { // Update the comparison operator to strict equality (===)
            // Wallet is already connected
            console.log("Wallet is already connected.");
        } else {
            // Wallet is not connected, connect it
            connectWallet();
        }
    });
    // Function to connect to the wallet
    async function connectWallet() {
        if (window.ethereum) {
            console.log("Checking for wallet connection...");
            try {
                await ethereum.request({ method: 'eth_requestAccounts' });
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const network = await provider.getNetwork();
                const chainId = network.chainId;

                const REQUIRED_CHAIN_HEX = '0x' + (REQUIRED_CHAIN_ID).toString(16); // '0x2105'
    
                if (chainId !== REQUIRED_CHAIN_HEX) {
                    try {
                        // Request the user to switch to the required network
                        console.log("Requesting user to switch to the Base Mainnet...");
                        await ethereum.request({
                            method: 'wallet_switchEthereumChain',
                            params: [{ chainId: REQUIRED_CHAIN_HEX }],
                        });
                    } catch (switchError) {
                        // This error code indicates that the chain has not been added to the Wallet
                        if (switchError.code === 4902) {
                            try {
                                // Add the chain to User's Wallet
                                await ethereum.request({
                                    method: 'wallet_addEthereumChain',
                                    params: [{
                                        chainId: REQUIRED_CHAIN_HEX,
                                        // Add other required parameters such as chainName, nativeCurrency, rpcUrls, blockExplorerUrls
                                    }],
                                });
                            } catch (addError) {
                                console.error(addError);
                            }
                        }
                        console.error(switchError);
                    }
                } else {
                    // If the correct chain is already selected
                    const accounts = await provider.listAccounts();
                    if (accounts.length > 0) {
                        console.log("Wallet successfully connected with address: " + accounts[0]);
                        updateButtonWithAddress(accounts[0]);
                        updateButtonWithLogo();
                        checkTokenBalance();
                    }
                }
            } catch (error) {
                console.error(error.message);
            }
        } else {
            console.error("Please install a Wallet!");
        }
    }
    // #endregion Manual Wallet Connection

    // Add click event listener to the play button
    playButton.addEventListener('click', async function(event) {
        if (window.ethereum) {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const accounts = await provider.listAccounts();
            const network = await provider.getNetwork();
            const chainId = network.chainId;
            if (accounts.length === 0 ) {
                event.preventDefault();
                playButton.textContent = "No Wallet Connected!";
                console.log("No wallet connected");
                return;
            }
            if (chainId !== REQUIRED_CHAIN_ID) {
                event.preventDefault();
                playButton.textContent = "Please switch to Base Mainnet!";
                console.log("Wrong chain");
                return;
            }
            if (chainId === REQUIRED_CHAIN_ID) {
                const balance = await checkTokenBalance();
    
                if (balance < minimumBalance) {
                    event.preventDefault();
                    playButton.textContent = `${minimumBalance} SYPHER tokens required!`;
                    console.log("Insufficient balance");
                    return;
                }
                else {
                    console.log("All wallet checks passed. Starting reCaptcha verification...");
                    reCaptchaVerification();
                }
            }
        } else {
            event.preventDefault();
            playButton.textContent = "No Wallet Installed!";
            console.log("Wallet is not installed");
            return;
        }
    });
    // If all the wallet checks pass, then perform the reCAPTCHA verification
    function reCaptchaVerification() {
        window.onSubmit = async function(token) {
            console.log("reCAPTCHA token generated:", token);
            try {
                console.log("Sending reCAPTCHA token to server...");
                const response = await fetch('/verify_recaptcha', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ token: token })
                });

                console.log("Received response from server:", response);
                const data = await response.json();
                if (data.success) {
                    console.log("reCAPTCHA verification successful, checking for token approval...");
                    // Check if the player has allowed the game smart contract to spend their tokens
                    const hasSufficientAllowance = await checkTokenAllowance();
                    if (!hasSufficientAllowance) {
                        console.log("Player has not approved token spend yet, attempting to get approval...");
                        const approvalSuccess = await approveTokenSpend();
                        if (!approvalSuccess) {
                            console.log("Token spend approval failed");
                            return; // Stop the flow if the user doesn't approve the spend
                        }
                    }

                    await startGame(); // Proceed to start the game if allowance is sufficient or after successful approval
                } else {
                    console.log("reCAPTCHA verification failed");
                }
            } catch (error) {
                console.error("Error during reCAPTCHA verification:", error);
            }
        }

        grecaptcha.execute();
    }

    // #region Updating Wallet Connect Button
    // Function to update the button text with the wallet address
    function updateButtonWithAddress(address) {
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
    function updateButtonWithLogo() {
        const baseLogo = document.getElementById('base-logo');
        baseLogo.style.display = 'block';

        console.log("Connected to base mainnet. Revealing Base logo.")
    }
    function UpdateButtonWithIncorrectChainMessage() {
        connectButton.textContent = 'Switch to Base Mainnet!';
        connectButton.style.borderColor = '#0052FF';
    }
    // #endregion Updating Wallet Connect Button

    // #region On Page Load Events for Connectivity/Network Checks
    if (window.ethereum) {
        ethereum.on("chainChanged", () => {window.location.reload();});
        
        ethereum.on("message", (message) => console.log(message));
    
        ethereum.on("connect", (connectInfo) => {
            console.log(`Connected to ${connectInfo.chainId} network`);
        });

        ethereum.on("disconnect", () => window.location.reload());
        ethereum.on("accountsChanged", (accounts) => {
            console.log('Attempting to switch accounts...');
            if (accounts.length > 0) {
                console.log(`Using account ${accounts[0]}`);
                connectButton.textContent = 'Connected: ' + accounts[0];
                tokenBalanceSection.style.display = '';
                window.location.reload();
            } else {
                console.error("0 accounts available!");
                tokenBalanceSection.style.display = 'none'; // Hide the token balance section if no accounts are connected
                window.location.reload();
            }
        });
    }
    // Check if wallet is already connected when the page loads, if it is, do stuff..
    window.addEventListener('load', async () => {
        if (window.ethereum) {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const network = await provider.getNetwork();
            const chainId = network.chainId;
            const accounts = await provider.listAccounts();
            if (chainId == REQUIRED_CHAIN_ID && accounts.length > 0) {
                console.log("Connected to base mainnet. Updating button with wallet address.")
                updateButtonWithAddress(accounts[0]); // Update the button if an account is already connected
                updateButtonWithLogo(); // Update the button with the logo
                tokenBalanceSection.style.display = '';
            } else {
                tokenBalanceSection.style.display = 'none'; // Hide the token balance section if no wallet is connected
            }
            if (chainId !== REQUIRED_CHAIN_ID) {
                UpdateButtonWithIncorrectChainMessage();
                console.error(`Please connect to the ${REQUIRED_CHAIN_ID} network`);
            }
            checkTokenBalance(); // Call the function to check the wallet balance
        } else {
            tokenBalanceSection.style.display = 'none'; // Hide the token balance section if a Wallet is not installed
        }
    });
    // #endregion On Page Load Events for Connectivity/Network Checks

    // #region Wallet Balance Check
    // Function to check the wallet balance
    async function checkTokenBalance() {
        if (!window.ethereum) {
            console.log("Ethereum not connected. Please install a Wallet.");
            return;
        }
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            
            // Check the network
            const network = await provider.getNetwork();
            if (network.chainId !== REQUIRED_CHAIN_ID) {
                console.error(`Wrong network connected. Please connect to network with chain ID ${REQUIRED_CHAIN_ID}.`);
                return;
            }
    
            // Check if any accounts are connected
            const accounts = await provider.listAccounts();
            if (accounts.length === 0) {
                console.log("No accounts connected. Please connect a wallet.");
                return; // Exit the function if no accounts are connected
            }
            
            const signer = provider.getSigner();
            console.log("Attempting to get signer address...");
            const tokenContract = new ethers.Contract(tokenContractAddress, tokenContractABI, signer);
            const balance = await tokenContract.balanceOf(await signer.getAddress());
            const decimals = await tokenContract.decimals();
            const adjustedBalance = ethers.utils.formatUnits(balance, decimals);
            console.log(`Signer address retrieved. Current Sypher balance: ${adjustedBalance}`);
                     
            updateWalletBalance(adjustedBalance);
            return adjustedBalance;

        } catch (error) {
            console.error("Error fetching token balance: " + error.message);
        }
    }
    function updateWalletBalance(balance) {
        console.log("Updating wallet balance display...");
        const formattedBalance = parseFloat(balance).toFixed(6); // Formatting for display
        document.getElementById('token-balance').textContent = formattedBalance; // Update UI
        console.log(`Wallet balance updated: ${formattedBalance}`);
    }

    // #endregion Wallet Balance Check

    // #region Token Allowance Check & Approval >>> !!! These functions need to be moved to the server side !!! <<<
    async function checkTokenAllowance() {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const tokenContract = new ethers.Contract(tokenContractAddress, tokenContractABI, signer);
        const playerAddress = await signer.getAddress();
        const allowance = await tokenContract.allowance(playerAddress, gameContractAddress);
    
        const costToPlay = ethers.utils.parseUnits("10", 18); // Update with the actual cost
    
        return allowance.gte(costToPlay); // Returns true if allowance is greater than or equal to cost
    }
    
    async function approveTokenSpend() {
        const signer = provider.getSigner();
        const tokenContract = new ethers.Contract(tokenContractAddress, tokenContractABI, signer);
        // Use maximum value for "unlimited" approval
        const maxUint256 = ethers.constants.MaxUint256;
        playButton.textContent = "Waiting on Approval...";
        try {
            const approvalTx = await tokenContract.approve(gameContractAddress, maxUint256);
            await approvalTx.wait();
            console.log("Approval transaction for token spend granted...");
            return true;
        } catch (error) {
            console.error("Approval transaction failed:", error);
            return false;
        }
    }

    async function startGame() {
        console.log("Approval to spend tokens successful. Initiating transaction to start the game...");
        playButton.textContent = "Waiting on transaction...";
        const signer = provider.getSigner();
        const gameContract = new ethers.Contract(gameContractAddress, gameContractABI, signer);
        try {
            const playGameTx = await gameContract.playGame(await signer.getAddress());
            showLoadingAnimation();
            console.log("Waiting for game transaction to be mined...");
            await playGameTx.wait();
            console.log("Game started successfully on blockchain");

            await checkTokenBalance(); // Update the token balance after the game transaction
    
            // Now that the game transaction is successful, notify the server to start a new game
            const response = await fetch('/start-game');
            const data = await response.json();
    
            if (data.success) {
                console.log("Server started a new game");
                  // Show the form
                  form.style.display = 'block';
                  hideLoadingAnimationForGameplay();
            } else {
                console.error("Failed to start a new game on the server");
            }
        } catch (error) {
            console.error("Failed to start the game on the blockchain:", error);
            playButton.textContent = "Transaction Failed! Click to Retry...";
            hideLoadingAnimation();
            // Show the play button because the transaction failed
            playButton.style.display = 'inline-block';
        }
    }
    // #endregion Token Allowance Check & Approval >>> !!! These functions need to be moved to the server side !!! <<<

    window.showLoadingAnimation = function() {
      if (loadingBar) {
        console.log("Showing loading bar...");
        loadingBar.style.display = 'inline-block'; // Show the loadingBar
          playButton.style.display = 'none'; // Hide the Play button
      } else {
          console.error('Loading Bar not found');
      }
    };

    window.hideLoadingAnimation = function() {
        if (loadingBar) {
            console.log("Hiding loading bar...");
            loadingBar.style.display = 'none'; // Hide the loadingBar
            playButton.style.display = 'inline-block'; // Show the Play button again
        } else {
            console.error('Loading Bar not found');
        }
    };

    window.hideLoadingAnimationForGameplay = function() {
        if (loadingBar) {
          console.log("Hiding loading bar because game started...");
          loadingBar.style.display = 'none'; // Hide the loadingBar
      } else {
          console.error('Loading Bar not found');
      }
    }
});