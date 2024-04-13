var playerAddress = null;
var transactionHash = null;

document.addEventListener('DOMContentLoaded', function () {

  const connectButton = document.getElementById('connect-button');
  const claimRewardsButton = document.getElementById('claim-rewards-button');
  const tokenBalanceSection = document.getElementById('token-balance-section');
  const rewardsBalanceSection = document.getElementById('rewards-balance-section');
  const playButton = document.getElementById('playButton');
  const loadButton = document.getElementById('load-button');
  const cancelButton = document.getElementById('cancel-button');
  const retrieveTransaction = document.getElementById('retrieve-transaction');
  const loadingBar = document.querySelector('.loading-bar');
  const keyboardButton = document.getElementById('keyboard-button');
  const keyboardHelper = document.getElementById('keyboard-helper');
  const walletDetailsSection = document.getElementById('wallet-details-section');
  const minimumBalance = 10; // Cost to play the game

  let reCaptchaInitialized = false;
  let keyboardHelperVisible = false;

  if (window.ethereum) {
    var provider = new ethers.providers.Web3Provider(window.ethereum);
    console.log("Wallet installed. Provider initialized.");
  }

  // Base Mainnet
  const REQUIRED_CHAIN_ID = 11155111; // Replace with 8453

  // Replace with actual token contract address <<<<!!!
  const tokenContractAddress = '0xb0292C7BcAD2196BE8e9534625Ca4B89b83c4e3F';

  // Replace with actual game smart contract address <<<<!!!
  const gameContractAddress = '0x0Ded0311A80E39d822850A2cA358beDC4053E88E';

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
          "indexed": true,
          "internalType": "address",
          "name": "player",
          "type": "address"
        }
      ],
      "name": "GameStarted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "player",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "rewardAmount",
          "type": "uint256"
        }
      ],
      "name": "PlayerWon",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "claimRewards",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
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
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "playerRewards",
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
          "name": "player",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "rewardAmount",
          "type": "uint256"
        }
      ],
      "name": "recordWin",
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

  let walletDetailsSectionVisible = false;

  // #region Manual Wallet Connection
  // Add click event listener to the connect button
  connectButton.addEventListener('click', async () => {
    if (!window.ethereum) {
      // Throw an error and redirect to wallet page if user tries to connect without a wallet installed
      console.error("No wallet installed!");
      window.location.href = "about.html";
      return;
    }

    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    const network = await provider.getNetwork();
    const chainId = network.chainId;

    if (accounts.length !== 0 && chainId === REQUIRED_CHAIN_ID) {
      // Wallet is already connected
      console.log("Wallet is already connected.");

      // Toggle visibility of wallet-details-section
      if (!walletDetailsSectionVisible) {
        walletDetailsSection.style.display = 'block';
        walletDetailsSection.style.animation = 'foldOut .25s forwards';
        walletDetailsSection.style.animationDelay = '0s';
        tokenBalanceSection.style.animationDelay = '.1s';
        rewardsBalanceSection.style.animationDelay = '.2s';
        claimRewardsButton.style.animationDelay = '.25s';

        console.log("Revealing wallet details section.");
        walletDetailsSectionVisible = true;
      } else {
        // Listen for the end of the animation before setting display to none
        walletDetailsSection.style.animation = 'foldIn .25s forwards';
        walletDetailsSection.addEventListener('animationend', () => {
          walletDetailsSection.style.display = 'none';
        }, { once: true }); // Use { once: true } to ensure the event listener is removed after it fires
        console.log("Hiding wallet details section.");
        walletDetailsSectionVisible = false;
      }
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
        const network = await provider.getNetwork();
        const chainId = network.chainId;

        const REQUIRED_CHAIN_HEX = '0x' + (REQUIRED_CHAIN_ID).toString(16);

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

  // #region Add Event Listeners to Game Buttons
  // Pass the specific button to the function "handleButtonClick" to handle the event
  playButton.addEventListener('click', (event) => handleButtonClick(playButton, event));
  loadButton.addEventListener('click', (event) => handleButtonClick(loadButton, event));
  // #endregion Add Event Listeners to Game Buttons

  // #region NEW GAME / LOAD Game Button Processing
  async function handleButtonClick(button, event) {
    if (window.ethereum) {

      const accounts = await provider.listAccounts();
      const network = await provider.getNetwork();
      const chainId = network.chainId;

      if (accounts.length === 0) {
        event.preventDefault();
        if (button === playButton) {
          playButton.textContent = "No Wallet Connected!";
        }
        if (button === loadButton) {
          loadButton.textContent = "No Wallet Connected!";
        }
        console.log("No wallet connected");
        return;
      }
      if (chainId !== REQUIRED_CHAIN_ID) {
        event.preventDefault();
        if (button === playButton) {
          playButton.textContent = "Please switch to Base Mainnet!";
        }
        if (button === loadButton) {
          loadButton.textContent = "Please switch to Base Mainnet!";
        }
        console.log("Wrong chain");
        return;
      }
      if (chainId === REQUIRED_CHAIN_ID) {
        const balance = await checkTokenBalance();

        if (balance < minimumBalance) {
          event.preventDefault();
          if (button === playButton) {
            playButton.textContent = `${minimumBalance} SYPHER tokens required!`;
          }
          console.log("Insufficient balance");
          return;
        }
        else {
          console.log("All wallet checks passed. Starting reCaptcha verification...");
          playButton.disabled = true;
          loadButton.disabled = true;
        }
      }
    } else {
      event.preventDefault();
      if (button === playButton) {
        playButton.textContent = "No Wallet Installed!";
      }
      if (button === loadButton) {
        loadButton.textContent = "No Wallet Installed!";
      }
      console.log("Wallet is not installed");
      return;
    }
  };
  // #endregion NEW GAME / LOAD Game Button Processing

  // #region Game Start Processing
  async function startGame() {
    console.log("Approval to spend tokens successful. Initiating transaction to start the game...");
    playButton.textContent = "Waiting on transaction...";
    const signer = provider.getSigner();
    const gameContract = new ethers.Contract(gameContractAddress, gameContractABI, signer);
    try {
      playerAddress = await signer.getAddress();
      console.log("Player address:", playerAddress);
      const playGameTx = await gameContract.playGame(await signer.getAddress());
      showLoadingAnimation();
      console.log("Waiting for game transaction to be mined...");
      await playGameTx.wait();
      console.log("Game started successfully on blockchain");

      transactionHash = playGameTx.hash;
      console.log("Transaction hash:", transactionHash);

      await checkTokenBalance(); // Update the token balance after the game transaction

      console.log("Server started a new game");
      // Show the form
      form.style.display = 'block';
      hideLoadingAnimationForGameplay();
      // Clear the input fields for the new game
      resetGameInputs();
      showKeyboardHelperButton();

    } catch (error) {
      console.error("Failed to start the game on the blockchain:", error);
      window.location.reload();
    }
  }

  function resetGameInputs() {
    const inputs = document.querySelectorAll('.puzzle-input');
    inputs.forEach(input => {
      input.value = ''; // Clear each input
    });
  }
  // #endregion Game Start Processing

  // #region Updating Wallet Connect Button
  // Function to update the button text with the wallet address
  function updateButtonWithAddress(address) {
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
    ethereum.on("chainChanged", () => { window.location.reload(); });

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
        walletDetailsSection.style.display = '';
        window.location.reload();
      } else {
        console.error("0 accounts available!");
        walletDetailsSection.style.display = 'none'; // Hide the token balance section if no accounts are connected
        window.location.reload();
      }
    });
  }
  // Check if wallet is already connected when the page loads, if it is, do stuff..
  window.addEventListener('load', async () => {
    if (window.ethereum) {
      const network = await provider.getNetwork();
      const chainId = network.chainId;
      const accounts = await provider.listAccounts();
      if (chainId == REQUIRED_CHAIN_ID && accounts.length > 0) {
        console.log("Connected to base mainnet. Updating button with wallet address.")
        updateButtonWithAddress(accounts[0]); // Update the button if an account is already connected
        updateButtonWithLogo(); // Update the button with the logo
        walletDetailsSection.style.display = '';
      } else {
        walletDetailsSection.style.display = 'none'; // Hide the token balance section if no wallet is connected
      }
      if (chainId !== REQUIRED_CHAIN_ID) {
        UpdateButtonWithIncorrectChainMessage();
        console.error(`Please connect to the ${REQUIRED_CHAIN_ID} network`);
      }
      checkTokenBalance(); // Call the function to check the wallet balance
    } else {
      walletDetailsSection.style.display = 'none'; // Hide the token balance section if a Wallet is not installed
    }
    walletDetailsSectionVisible = walletDetailsSection.style.display !== 'none';

    updateRewardsBalance();
  });
  // #endregion On Page Load Events for Connectivity/Network Checks

  // #region Wallet Balance Section
  // Function to check the wallet balance
  async function checkTokenBalance() {
    if (!window.ethereum) {
      console.log("Ethereum not connected. Please install a Wallet.");
      return;
    }
    try {
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

      if (!reCaptchaInitialized) {
        reCaptchaInitialization();
      }
      updateWalletBalance(adjustedBalance);
      return adjustedBalance;

    } catch (error) {
      console.error("Error fetching token balance: " + error.message);
    }
  }
  function updateWalletBalance(balance) {
    console.log("Updating wallet balance display...");
    const formattedBalance = parseFloat(balance).toFixed(1); // Formatting for display
    document.getElementById('token-balance').textContent = formattedBalance; // Update UI
    console.log(`Wallet balance updated: ${formattedBalance}`);
  }
  // #endregion Wallet Balance Section

  // #region Token Allowance Check & Approval >>> !!! These functions need to be moved to the server side !!! <<<
  async function checkTokenAllowance() {
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
  // #endregion Token Allowance Check & Approval >>> !!! These functions need to be moved to the server side !!! <<<

  // #region Rewards Section
  document.getElementById('claim-rewards-button').addEventListener('click', async () => {
    if (!window.ethereum) {
      console.log("Ethereum wallet not detected");
      return;
    }

    try {
      const signer = provider.getSigner();
      const gameContract = new ethers.Contract(gameContractAddress, gameContractABI, signer);

      console.log("Claiming rewards...");
      const claimTx = await gameContract.claimRewards();
      await claimTx.wait();
      console.log("Rewards claimed successfully.");

      // Optionally, update the UI to reflect the claimed rewards
      // For example, hide the claim button or update the displayed token balance
    } catch (error) {
      console.error("Error claiming rewards:", error);
    }
  });
  async function updateRewardsBalance() {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (accounts.length > 0) {
      const account = accounts[0];
      try {
        const signer = provider.getSigner();
        const gameContract = new ethers.Contract(gameContractAddress, gameContractABI, signer);
        // Call the automatically generated getter for the mapping
        const rewardsBalance = await gameContract.playerRewards(account);
        const formattedBalance = ethers.utils.formatUnits(rewardsBalance, 18);
        document.getElementById('rewards-balance').innerText = formattedBalance;

        // Check if rewards balance is greater than 0
        if (parseFloat(formattedBalance) > 0) {
          console.log("Player has rewards to claim, revealing claim rewards button...");
        } else {
          console.log("Player has no rewards to claim, hiding claim rewards button...");
          claimRewardsButton.style.display = 'none'; // Hide the claim rewards button if no rewards
        }
      } catch (error) {
        console.error('Error fetching rewards balance:', error);
        claimRewardsButton.style.display = 'none'; // Also hide the button in case of an error
      }
    }
  }
  // #endregion Rewards Section

  // #region Loading Animation Functions
  window.showLoadingAnimation = function () {
    if (loadingBar) {
      if (playButton) {
        playButton.style.animation = 'foldInRemove .25s forwards';
      }
      if (loadButton) {
        loadButton.style.animation = 'foldInRemove .25s forwards';
      }
      console.log("Showing loading bar...");
      loadingBar.style.display = 'inline-block'; // Show the loadingBar

    } else {
      console.error('Loading Bar not found');
    }
  };

  window.hideLoadingAnimation = function () {
    if (loadingBar) {
      console.log("Hiding loading bar...");
      loadingBar.style.display = 'none'; // Hide the loadingBar
      playButton.style.display = 'inline-block'; // Show the Play button again
    } else {
      console.error('Loading Bar not found');
    }
  };

  window.hideLoadingAnimationForGameplay = function () {
    if (loadingBar) {
      console.log("Hiding loading bar because game started...");
      loadingBar.style.display = 'none'; // Hide the loadingBar
    } else {
      console.error('Loading Bar not found');
    }
  }
  // #endregion Loading Animation Functions

  // #region Restore Game Session - LOAD GAME
  async function revealSessionRecoveryForm() {
    console.log("Revealing session recovery form...");
    // Hide the New Game/Load Game buttons
    playButton.style.animation = 'foldInRemove .25s forwards';
    loadButton.style.animation = 'foldInRemove .25s forwards';

    // Show the input field for the transaction hash
    retrieveTransaction.style.display = 'block';
    retrieveTransaction.style.animation = 'foldOut .25s forwards';
    retrieveTransaction.style.animationDelay = '.25s';

    cancelButton.style.animation = 'transitionUp .25s forwards';
    cancelButton.style.animationDelay = '.5s';
  }
  retrieveTransaction.addEventListener('keypress', async function (event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      const transactionHash = this.value;
      console.log("User submitted: " + transactionHash);

      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const signature = await signer.signMessage("Verify ownership for session " + transactionHash);
        console.log("Signature: ", signature);

        fetch('/verify-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactionHash, signature }),
        })
          .then(async response => {
            const data = await response.json(); // Parse JSON even in case of an error
            if (!response.ok) {
              console.error('Fetch error:', data.error, data.details || '');
              throw new Error(`Network response was not ok. Status: ${response.status}. ${data.error}`);
            }
            return data;
          })
          .then(data => {
            console.log('Session verification:', data);
            updateUI(data);
          })
          .catch(error => {
            console.error('Fetch error:', error.message);
            alert(error.message); // Optionally show error details to the user
          });

      } catch (error) {
        console.error('Error:', error);
      }
    }
  });
  // Attach event listener to the Cancel button for page reload
  cancelButton.addEventListener('click', function () {
    console.log("Page reload initiated by cancel button.");
    window.location.reload();
  });
  // #endregion Restore Game Session - LOAD GAME

  // #region reCAPTCHA Section
  window.onSubmitPlay = async function (token) {
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
      console.log("Server response data:", data);
      if (data.success) {
        console.log("reCAPTCHA verification successful, checking for token approval...");
        const hasSufficientAllowance = await checkTokenAllowance();
        console.log("Token allowance check:", hasSufficientAllowance);
        if (!hasSufficientAllowance) {
          console.log("Player has not approved token spend yet, attempting to get approval...");
          const approvalSuccess = await approveTokenSpend();
          console.log("Token spend approval status:", approvalSuccess);
          if (!approvalSuccess) {
            console.log("Token spend approval failed");
            return; // Stop the flow if the user doesn't approve the spend
          }
        }
        console.log("Proceeding to start the game...");
        await startGame(); // Proceed to start the game if allowance is sufficient or after successful approval
      } else {
        console.log("reCAPTCHA verification failed");
      }
    } catch (error) {
      console.error("Error during reCAPTCHA verification:", error);
    }
  }
  window.onSubmitLoad = async function (token) {
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
      console.log("Server response data:", data);
      if (data.success) {
        console.log("reCAPTCHA verification successful, revealing recovery form...");
        revealSessionRecoveryForm();
      } else {
        console.log("reCAPTCHA verification failed");
      }
    } catch (error) {
      console.error("Error during reCAPTCHA verification:", error);
    }
  }
  async function reCaptchaInitialization() {
    if (window.ethereum) {
      try {
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          // Adding 'g-recaptcha' class to both buttons if an account is connected
          playButton.classList.add("g-recaptcha");
          loadButton.classList.add("g-recaptcha");
          reCaptchaInitialized = true;
          console.log("Wallet detected and account is connected. Adding reCAPTCHA script to NEW GAME & LOAD GAME buttons...");

          console.log("Starting to render reCAPTCHA for 'playButton'...");

          grecaptcha.render('playButton', {
            'sitekey': '6Ldq-60pAAAAAJbK-itTDZpw06rHWyW5ND9Y-5bq', // Replace with your actual site key
            'callback': onSubmitPlay
          });

          console.log("'playButton' reCAPTCHA rendering completed.");

          console.log("Starting to render reCAPTCHA for 'load-button'...");

          grecaptcha.render('load-button', {
            'sitekey': '6Ldq-60pAAAAAJbK-itTDZpw06rHWyW5ND9Y-5bq', // Replace with your actual site key
            'callback': onSubmitLoad
          });

          console.log("'load-button' reCAPTCHA rendering completed.");
        } else {
          console.log("No wallet accounts connected. reCAPTCHA not added.");
        }
      } catch (error) {
        console.log("Error checking accounts:", error);
      }
    }
  }
  // #endregion reCAPTCHA Section

  // #region Keyboard Helper Logic
  function showKeyboardHelperButton() {
    console.log("Revealing keyboard helper button...");
    keyboardButton.style.display = 'block'; // Ensure button is visible
    keyboardButton.classList.add('glow-effect'); // Apply glow/sheen animation
  }
  keyboardButton.addEventListener('click', () => {
    keyboardHelperVisible = !keyboardHelperVisible; // Toggle visibility state
    keyboardHelper.style.display = keyboardHelperVisible ? 'block' : 'none'; // Apply visibility state to CSS
    console.log("Keyboard helper visibility toggled to: " + (keyboardHelperVisible ? "Visible" : "Hidden"));

    // Remove the glow/sheen animation on first click
    keyboardButton.style.animation = 'none';
    console.log("Glow/sheen animation removed after first click.");
  });
  // #endregion Keyboard Helper Logic
});