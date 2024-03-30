document.addEventListener('DOMContentLoaded', function() {

    const REQUIRED_CHAIN_ID = 8453; // Base L2

    // #region Manual Wallet Connection
    // Add click event listener to the connect button
    document.getElementById('connect-button').addEventListener('click', connectWallet);
    // Function to connect to the wallet
    async function connectWallet() {
        if (window.ethereum) {
            console.log("Checking for wallet connection...");
            try {
                await ethereum.request({ method: 'eth_requestAccounts' });
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const network = await provider.getNetwork();
                const chainId = network.chainId;

                const REQUIRED_CHAIN_HEX = '0x' + (8453).toString(16); // '0x2105'
    
                if (chainId !== REQUIRED_CHAIN_HEX) {
                    try {
                        // Request the user to switch to the required network
                        console.log("Requesting user to switch to the Base Mainnet...");
                        await ethereum.request({
                            method: 'wallet_switchEthereumChain',
                            params: [{ chainId: REQUIRED_CHAIN_HEX }],
                        });
                    } catch (switchError) {
                        // This error code indicates that the chain has not been added to MetaMask
                        if (switchError.code === 4902) {
                            try {
                                // Add the chain to MetaMask
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
                }
            } catch (error) {
                console.error(error.message);
            }
        } else {
            console.error("Please install MetaMask!");
        }
    }
    // #endregion Manual Wallet Connection

    // #region Updating Wallet Connect Button
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
    function updateButtonWithLogo() {
        const baseLogo = document.getElementById('base-logo');
        baseLogo.style.display = 'block';

        console.log("Connected to base mainnet. Revealing Base logo.")
    }
    function UpdateButtonWithIncorrectChainMessage() {
        const connectButton = document.getElementById('connect-button');
        connectButton.textContent = 'Switch to Base Mainnet!';
        connectButton.style.borderColor = '#0052FF';
    }
    // #endregion Updating Wallet Connect Button

    // #region On Page Load Events for Connectivity/Network Checks
    if (window.ethereum) {
        ethereum.on("chainChanged", () => {
            if (!ethereum.isCoinbaseWallet) {
                window.location.reload();
            }
        });
        
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
    // Check if MetaMask is already connected when the page loads
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
            }
            if (chainId !== REQUIRED_CHAIN_ID) {
                UpdateButtonWithIncorrectChainMessage();
                console.error(`Please connect to the ${REQUIRED_CHAIN_ID} network`);
            }
        }
    });
    // #endregion On Page Load Events for Connectivity/Network Checks
});