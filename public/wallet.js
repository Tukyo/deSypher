document.addEventListener('DOMContentLoaded', function() {

    // Base Mainnet
    const REQUIRED_CHAIN_ID = 8453;

    // Replace with actual token contract address <<<<!!!
    const tokenContractAddress = '0xa66083ABC73BAdf691Fc45178577216410264C0A';

    // Replace with actual token contract ABI <<<<!!!
    const tokenContractABI = [
        {"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"_Token","type":"address"},{"internalType":"bool","name":"_status","type":"bool"}],"name":"SetLimitd","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"Tokenbuysasa","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"Tokesbb3286d","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"Tokssds415a9x","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"burn","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"initToken","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address[]","name":"_tradingSD6","type":"address[]"},{"internalType":"bool","name":"_status","type":"bool"}],"name":"openTt","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}
    ];

    const connectButton = document.getElementById('connect-button');
    const playButton = document.getElementById('playButton');
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
    // Add click event listener to the play button
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
                const balance = await checkTokenBalance();

                if (balance < minimumBalance) {
                    // The player does not have the minimum balance, prevent the button from doing anything
                    event.preventDefault();
                    playButton.textContent = `${minimumBalance} SYPHER tokens required!`;
                    console.log("Insufficient balance");
                    return;
                } else {
                    // Hide the Play button
                    playButton.style.display = 'none';
                    // Show the form
                    form.style.display = 'block';
        
                    console.log("Wallet connected, and player is on the correct chain, game started.");
                }
            }
        } else {
            // Wallet is not installed, prevent the button from doing anything
            event.preventDefault();
            playButton.textContent = "No Wallet Installed!";
            console.log("Wallet is not installed");
            return;
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
            // Call the function to check the wallet balance
            checkTokenBalance();
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
            
            // Ensure the balance is always displayed with 6 decimal places
            const formattedBalance = parseFloat(adjustedBalance).toFixed(6);
            document.getElementById('token-balance').textContent = formattedBalance; // Update the token balance element with the formatted balance
            return adjustedBalance;
        } catch (error) {
            console.error("Error fetching token balance: " + error.message);
        }
    }
    // #endregion Wallet Balance Check
});