var playerAddress = null;
var transactionHash = null;
var sypherAllocation = null;

document.addEventListener('DOMContentLoaded', function () {

  const bufferSetTime = sessionStorage.getItem('bufferSetTime');

  if (bufferSetTime && (Date.now() - parseInt(bufferSetTime) > 1500)) {
    sessionStorage.removeItem('reloadBuffer');
    console.log("Stale reload buffer cleared.");
  }

  if (!sessionStorage.getItem('reloadBuffer')) {
    sessionStorage.setItem('reloadBuffer', 'true');
    sessionStorage.setItem('bufferSetTime', Date.now().toString());
    console.log("Reload buffer initialized.");

    setTimeout(() => {
      sessionStorage.removeItem('reloadBuffer');
      sessionStorage.removeItem('bufferSetTime');
      console.log("Reload buffer cleared.");
    }, 1500);
  }


  const mainnetProvider = new ethers.providers.JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/tbG9Ls0pfxJL1IGYyoi-eB0AMcgbjc-k');

  const gameLogo = document.getElementById('game-logo');
  const mobileGameLogo = document.getElementById('mobile-game-logo');
  const connectButton = document.getElementById('connect-button');
  const claimRewardsButton = document.getElementById('claim-rewards-button');
  const tokenBalanceSection = document.getElementById('token-balance-section');
  const rewardsBalanceSection = document.getElementById('rewards-balance-section');
  const playButton = document.getElementById('playButton');
  const loadButton = document.getElementById('load-button');
  const submitLoadButton = document.getElementById('submit-load-button');
  const cancelButton = document.getElementById('cancel-button');
  const retrieveTransaction = document.getElementById('retrieve-transaction');
  const loadingBar = document.querySelector('.loading-bar');
  const keyboardButton = document.getElementById('keyboard-button');
  const keyboardHelper = document.getElementById('keyboard-helper');
  const walletDetailsSection = document.getElementById('wallet-details-section');
  const walletConnectionSection = document.getElementById('wallet-connection-section');
  const connectButtonText = document.getElementById('connect-button-text');
  const minimumBalance = 10; // Cost to play the game

  const faucetButton = document.getElementById('faucet-container');

  const walletStylePresets = {
    default: { size: '150px', alignment: 'center' },
    incorrectChain: { size: '150px', alignment: 'right' },
    correctChain: { size: '175px', alignment: 'right' },
  };

  const REQUIRED_CHAIN_ID = 11155111; // Replace with 8453 "Base Mainnet"

  let reCaptchaInitialized = false;
  let keyboardHelperVisible = false;
  let rewardsButtonVisible = false;
  let walletDetailsSectionVisible = false;
  let returningPlayer = localStorage.getItem('returningPlayer') === 'true';

  if (window.ethereum) {
    var provider = new ethers.providers.Web3Provider(window.ethereum);
    console.log("Wallet installed. Provider initialized.");

    ethereum.on("chainChanged", (newChainId) => {
      console.log(`Chain ID changed to ${newChainId}`);
      // Check if reload buffer is active
      if (!sessionStorage.getItem('reloadBuffer')) {
        console.log("Reloading page due to chain change.");
        window.location.reload();
      } else {
        console.log("Reload buffer is active.");
      }
    });

    ethereum.on("message", (message) => console.log(message));

    ethereum.on("connect", (connectInfo) => {
      console.log(`Connected to ${connectInfo.chainId} network`);
    });

    ethereum.on("disconnect", () => {
      if (!sessionStorage.getItem('reloadBuffer')) {
        window.location.reload();
      }
    });
    ethereum.on("accountsChanged", (accounts) => {
      console.log('Attempting to switch accounts...');
      if (accounts.length > 0) {
        console.log(`Using account ${accounts[0]}`);
        connectButtonText.textContent = 'Connected: ' + accounts[0];
        walletDetailsSection.style.display = '';
        if (!sessionStorage.getItem('reloadBuffer')) {
          window.location.reload();
        }
      } else {
        console.error("0 accounts available!");
        walletDetailsSection.style.display = 'none'; // Hide the token balance section if no accounts are connected
        if (!sessionStorage.getItem('reloadBuffer')) {
          window.location.reload();
        }
      }
    });
    setupTokenEventListener();
    rewardsBalanceEventListeners();
  }

  updateWalletConnectionSectionStyle('default');

  // #region Manual Wallet Connection
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
        showWalletDetails();
      } else {
        hideWalletDetails();
      }
    } else {
      // Wallet is not connected, connect it
      connectWallet();
    }
  });
  function showWalletDetails() {
    walletDetailsSection.style.display = 'block';
    walletDetailsSection.style.animation = 'foldOut .25s forwards';
    walletDetailsSection.style.animationDelay = '0s';
    tokenBalanceSection.style.animationDelay = '.1s';
    rewardsBalanceSection.style.animationDelay = '.2s';
    claimRewardsButton.style.animationDelay = '.25s';

    console.log("Revealing wallet details section.");
    walletDetailsSectionVisible = true;
  }
  function hideWalletDetails() {
    // Listen for the end of the animation before setting display to none
    walletDetailsSection.style.animation = 'foldIn .25s forwards';
    walletDetailsSection.addEventListener('animationend', () => {
      walletDetailsSection.style.display = 'none';
    }, { once: true }); // Use { once: true } to ensure the event listener is removed after it fires
    console.log("Hiding wallet details section.");
    walletDetailsSectionVisible = false;
  }
  // Function to connect to the wallet
  async function connectWallet() {
    if (window.ethereum) {
      console.log("Checking for wallet connection...");
      try {
        await ethereum.request({ method: 'eth_requestAccounts' });
        const network = await provider.getNetwork();
        const chainId = network.chainId;
        console.log("Connected to chain ID:", chainId);

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

  // #region Game Buttons
  // Pass the specific button to the function "handleButtonClick" to handle the event
  playButton.addEventListener('click', (event) => handleButtonClick(playButton, event));
  loadButton.addEventListener('click', (event) => handleButtonClick(loadButton, event));

  function hidePlayButton() {
    playButton.style.animation = 'foldInRemove .25s forwards';
    playButton.style.display = 'none';
    console.log("Play button hidden...");
  }
  function hideLoadButton() {
    loadButton.style.animation = 'foldInRemove .25s forwards';
    loadButton.style.display = 'none';
    console.log("Load button hidden...");
  }
  function hideFaucetButton() {
    faucetButton.style.animation = 'foldInRemove .25s forwards';
    faucetButton.style.display = 'none';
    console.log("Faucet button hidden...");
  }
  // #endregion Game Buttons

  // #region NEW GAME / LOAD Game Button Processing
  async function handleButtonClick(button, event) {
    if (window.ethereum) {

      const accounts = await provider.listAccounts();
      const network = await provider.getNetwork();
      const chainId = network.chainId;

      if (accounts.length === 0) {
        event.preventDefault();
        document.dispatchEvent(new CustomEvent('appError', { detail: "No Wallet Connected!" }));
        console.log("No wallet connected");
        return;
      }
      if (chainId !== REQUIRED_CHAIN_ID) {
        event.preventDefault();
        document.dispatchEvent(new CustomEvent('appError', { detail: `Please connect to Base Mainnet!` }));
        console.log("Wrong chain");
        return;
      }
      if (chainId === REQUIRED_CHAIN_ID) {
        const balance = await checkTokenBalance();

        if (balance < minimumBalance) {
          event.preventDefault();
          if (button === playButton) {
            document.dispatchEvent(new CustomEvent('appError', { detail: `${minimumBalance} SYPHER tokens required!` }));
          }
          console.log("Insufficient balance");
          return;
        }
        else {
          console.log("All wallet checks passed. Starting reCaptcha verification...");
          playButton.disabled = true;
          loadButton.disabled = true;
          faucetButton.disabled = true;
        }
      }
    } else {
      event.preventDefault();
      document.dispatchEvent(new CustomEvent('appError', { detail: "No Wallet Installed!" }));
      console.log("Wallet is not installed");
      return;
    }
  };
  // #endregion NEW GAME / LOAD Game Button Processing

  // #region Game Start Processing
  window.startGame = async function (useExistingTransaction = false, existingTransactionHash = null) {
    const allocationContainer = document.querySelector('.sypher-allocation-container');
    const submitButton = document.getElementById('allocation-submit');
    const sypherAllocationInput = document.getElementById('sypher-allocation-input');

    allocationContainer.style.display = 'block';
    sypherAllocationInput.focus();

    playButton.textContent = "Waiting on Allocation...";
    hideLoadButton();
    hideFaucetButton();

    return new Promise((resolve, reject) => {
      submitButton.onclick = async () => {

        sypherAllocation = sypherAllocationInput.value || '0';  // Default to 0 if no input
        const sypherAllocationWei = ethers.utils.parseUnits(sypherAllocation, 'ether');

        if (sypherAllocation > 1000 || sypherAllocation < 1) {
          console.error("Invalid Sypher allocation amount:", sypherAllocation);
          document.dispatchEvent(new CustomEvent('appError', { detail: "SYPHER allocation must be between 1 and 1000." }));
          return;
        }

        allocationContainer.style.display = 'none';

        try {
          let transactionPreventClose = function (e) {
            e.preventDefault();
            e.returnValue = '';
            return '';
          };
          if (!useExistingTransaction) {
            console.log("Approval to spend tokens successful. Initiating transaction to start the game...");
            playButton.textContent = "Waiting on transaction...";
            const signer = provider.getSigner();
            const gameContract = new ethers.Contract(gameContractAddress, gameContractABI, signer);
            try {
              playerAddress = await signer.getAddress();
              console.log("Player address:", playerAddress);
              const playGameTx = await gameContract.PlayGame(playerAddress, sypherAllocationWei);
              showLoadingAnimation();
              console.log("Waiting for game transaction to be mined...");
              window.addEventListener('beforeunload', transactionPreventClose);
              await playGameTx.wait();
              window.removeEventListener('beforeunload', transactionPreventClose);
              console.log("Game started successfully on blockchain");

              transactionHash = playGameTx.hash;
              console.log("Transaction hash:", transactionHash);
            } catch (error) {
              console.error("Failed to start the game on the blockchain:", error);
              window.location.reload();
              return;
            }
          } else {
            // Use the existing transaction hash and do not initiate a new transaction
            console.log("Using existing transaction hash for game session:", existingTransactionHash);
            transactionHash = existingTransactionHash;
          }

          let word = null;

          window.dispatchEvent(gameStartEvent);

          fetch('/game', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ playerAddress, transactionHash, word, sypherAllocation }),
          })
            .then(response => response.json())
            .then(data => {
              console.log('Started game with data:', data);
            });


          await checkTokenBalance(); // Update the token balance after the game transaction

          console.log("Server started a new game");
          // Show the form
          form.style.display = 'block';
          hideLoadingAnimationForGameplay();
          // Clear the input fields for the new game
          resetGameInputs();
          showKeyboardHelperButton();
          if (!returningPlayer) {
            hintBox(true, 'Use the boxes below to input your guess!');
          }
          resolve();
        } catch (error) { // This catch is now correctly positioned to handle errors from any part of the function
          console.error("Failed to start the game on the blockchain:", error);
          window.location.reload();
          reject(error);
        }
      };
    });
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
    // Immediately set button text to shortened address
    connectButtonText.textContent = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    console.log("Displaying shortened address: " + connectButtonText.textContent);

    updateWalletButtonWithENS(address, connectButtonText.textContent);
  }
  function updateWalletButtonWithENS(address, originalText) {
    mainnetProvider.lookupAddress(address).then(ensName => {
      if (ensName) {
        // Check if ENS name is longer than 13 characters and truncate if necessary
        if (ensName.length > 13) {
          const truncatedEnsName = ensName.substring(0, 5) + '...' + ensName.substring(ensName.length - 5);
          connectButtonText.textContent = truncatedEnsName; // Display the truncated ENS name
          console.log("ENS name truncated and displayed: " + truncatedEnsName);
        } else {
          typeOutENSName(originalText, ensName, connectButtonText, 50);
          console.log("ENS name found and displayed: " + ensName);
        }
      }
      // If no ENS name found, the address display remains unchanged
    }).catch(error => {
      console.error("Error in ENS lookup: ", error.message);
      // In case of an error, the initial address display remains
    });
  }
  function typeOutENSName(originalText, ensName, element, typeTime) {
    let currentIndex = originalText.length - 1; // Start from the end of the original text
    let ensIndex = ensName.length - 1;           // Start from the end of the ENS name

    const typeInterval = setInterval(() => {
      if (ensIndex < 0) {
        clearInterval(typeInterval);
        element.textContent = ensName;
      } else {
        // Replace character by character
        originalText = originalText.substring(0, currentIndex) + ensName.charAt(ensIndex) + originalText.substring(currentIndex + 1);
        element.textContent = originalText;
        currentIndex--;
        ensIndex--;
      }
    }, typeTime);
  }
  function updateButtonWithLogo() {
    const baseLogo = document.getElementById('base-logo');
    baseLogo.style.display = 'block';

    console.log("Connected to base mainnet. Revealing Base logo.")
  }
  function UpdateButtonWithIncorrectChainMessage() {
    connectButtonText.textContent = 'Switch to Base!';
    connectButton.style.borderColor = '#0052FF';
  }
  function updateWalletConnectionSectionStyle(preset) {
    const { size, alignment } = walletStylePresets[preset] || walletStylePresets.default;

    if (window.innerWidth > 775) {
      walletConnectionSection.style.maxWidth = size;
      connectButton.style.textAlign = alignment;
    }
  }
  // #endregion Updating Wallet Connect Button

  // #region On Page Load Events for Connectivity/Network Checks
  async function updateWalletSection() {
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
        updateWalletConnectionSectionStyle('incorrectChain');
      } else {
        updateWalletConnectionSectionStyle('correctChain');
      }
      checkTokenBalance();
    } else {
      walletDetailsSection.style.display = 'none'; // Hide the token balance section if a Wallet is not installed
    }
    walletDetailsSectionVisible = walletDetailsSection.style.display !== 'none';

    updateRewardsBalance();
  }
  // Check if wallet is already connected when the page loads, if it is, do stuff..
  window.addEventListener('load', async () => {
    updateWalletSection();
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
        updateWalletConnectionSectionStyle('default');
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
  // Update the displayed wallet balance LIVE when a token transfer event is detected
  async function setupTokenEventListener() {
    if (!window.ethereum) {
      console.log("Ethereum not connected. Please install a Wallet.");
      return;
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const accounts = await provider.listAccounts();
    if (accounts.length === 0) {
      console.log("No accounts connected. Please connect a wallet.");
      return; // Exit the function if no accounts are connected
    }

    const signer = provider.getSigner();
    try {
      const address = await signer.getAddress(); // This throws an error if no accounts are connected
      const tokenContract = new ethers.Contract(tokenContractAddress, tokenContractABI, signer);

      console.log("Setting up token balance change listener...");

      tokenContract.on(tokenContract.filters.Transfer(address), async (from, to, amount, event) => {
        console.log("Detected token transfer event.");
        if (to === address || from === address) {
          // Re-check and update the balance if the current user's address is involved
          console.log("Token transfer involved current user. Updating balance...");
          const newBalance = await checkTokenBalance();
          console.log(`Balance updated: ${newBalance}`);
        }
      });

      console.log("Token event listener initialized.");
    } catch (error) {
      console.error("Error accessing the signer's address:", error);
    }
  }
  // #endregion Wallet Balance Section

  // #region Token Allowance Check & Approval >>> !!! These functions need to be moved to the server side !!! <<<
  async function checkTokenAllowance() {
    const signer = provider.getSigner();
    const tokenContract = new ethers.Contract(tokenContractAddress, tokenContractABI, signer);
    playerAddress = await signer.getAddress();
    const allowance = await tokenContract.allowance(playerAddress, gameContractAddress);

    const costToPlay = ethers.utils.parseUnits("10", 18); // Update with the actual cost

    return allowance.gte(costToPlay); // Returns true if allowance is greater than or equal to cost
  }
  async function approveTokenSpend() {
    const signer = provider.getSigner();
    const tokenContract = new ethers.Contract(tokenContractAddress, tokenContractABI, signer);
    const maxAllowance = ethers.utils.parseUnits("1000000", 18); // Update with the actual cost
    // Use maximum value for "unlimited" approval
    playButton.textContent = "Waiting on Approval...";
    try {
      const approvalTx = await tokenContract.approve(gameContractAddress, maxAllowance);
      await approvalTx.wait();
      console.log("Approval transaction for token spend granted...");
      return true;
    } catch (error) {
      console.error("Approval transaction failed:", error);
      window.location.reload();
      return false;
    }
  }
  // #endregion Token Allowance Check & Approval >>> !!! These functions need to be moved to the server side !!! <<<

  // #region Rewards Section
  document.getElementById('claim-rewards-button').addEventListener('click', async () => {
    claimRewards();
  });
  async function claimRewards() {
    const button = document.getElementById('claim-rewards-button');
    if (!window.ethereum) {
      console.log("Ethereum wallet not detected");
      return;
    }

    button.textContent = "PROCESSING...";

    try {
      const signer = provider.getSigner();
      const gameContract = new ethers.Contract(gameContractAddress, gameContractABI, signer);

      console.log("Claiming rewards...");
      const claimTx = await gameContract.ClaimRewards();
      await claimTx.wait();
      console.log("Rewards claimed successfully.");
      document.dispatchEvent(new CustomEvent('appError', { detail: "Reward Claim Success!" }));
      button.textContent = "CLAIM TOKENS";

    } catch (error) {
      console.error("Error claiming rewards:", error);
      document.dispatchEvent(new CustomEvent('appError', { detail: "Error Claiming Tokens..." }));
      button.textContent = "CLAIM TOKENS";
    }
  }
  async function updateRewardsBalance() {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (accounts.length > 0) {
      const account = accounts[0];
      try {
        const signer = provider.getSigner();
        const gameManagerContract = new ethers.Contract(gameManagerAddress, gameManagerABI, signer);
        const rewardsBalance = await gameManagerContract.getReward(account);
        console.log("Rewards balance:", rewardsBalance.toString());
        const formattedBalance = ethers.utils.formatUnits(rewardsBalance, 18);
        document.getElementById('rewards-balance').innerText = formattedBalance;

        // Check if rewards balance is greater than 0
        if (parseFloat(formattedBalance) > 0) {
          if (!rewardsButtonVisible) {
            console.log("Player has rewards to claim, revealing claim rewards button...");
            document.getElementById('claim-rewards-button').style.display = ''; // Show the claim rewards button
            rewardsButtonVisible = true;
          }
        } else {
          console.log("Player has no rewards to claim, hiding claim rewards button...");
          claimRewardsButton.style.display = 'none'; // Hide the claim rewards button if no rewards
          rewardsButtonVisible = false;
        }
      } catch (error) {
        console.error('Error fetching rewards balance:', error);
        claimRewardsButton.style.display = 'none'; // Also hide the button in case of an error
      }
    }
  }
  async function rewardsBalanceEventListeners() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const gameContract = new ethers.Contract(gameContractAddress, gameContractABI, provider);

    gameContract.on("GameCompleted", (player, won, rewardAmount, event) => {
      console.log("Game completed event detected", event);
      updateRewardsBalance();
      updateReturningPlayerStatus();
    });

    gameContract.on("RewardsClaimed", (player, amount, event) => {
      console.log("Rewards claimed event detected", event);
      updateRewardsBalance();  // Update balance after rewards are claimed
      checkTokenBalance(); // Update the token balance after rewards are claimed
    });
  }
  // #endregion Rewards Section

  // #region Loading Animation Functions
  window.showLoadingAnimation = function () {
    if (loadingBar) {
      if (playButton) {
        playButton.style.animation = 'foldInRemove .25s forwards';
        playButton.style.display = 'none';
      }
      if (loadButton) {
        loadButton.style.animation = 'foldInRemove .25s forwards';
        loadButton.style.display = 'none';
      }
      if (faucetButton) {
        faucetButton.style.animation = 'foldInRemove .25s forwards';
        faucetButton.style.display = 'none';
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
  window.revealSessionRecoveryForm = async function () {
    console.log("Revealing session recovery form...");
    // Hide the New Game/Load Game buttons
    hidePlayButton();
    hideLoadButton();
    hideFaucetButton();

    // Show the input field for the transaction hash
    retrieveTransaction.style.display = 'block';
    retrieveTransaction.style.animation = 'foldOut .25s forwards';
    retrieveTransaction.style.animationDelay = '.25s';

    cancelButton.style.display = 'block';
    cancelButton.style.animation = 'transitionLeft .25s forwards';
    cancelButton.style.animationDelay = '.5s';
    submitLoadButton.style.display = 'block';
    submitLoadButton.style.animation = 'transitionRight .25s forwards';
    submitLoadButton.style.animationDelay = '.75s';
  }
  retrieveTransaction.addEventListener('keypress', async function (event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      document.dispatchEvent(new CustomEvent('appSystemMessage', { detail: "Verifying ownership of transaction..." }));
      transactionVerification();
    }
  });
  // Attach event listener to the Cancel button for page reload
  cancelButton.addEventListener('click', function () {
    console.log("Page reload initiated by cancel button.");
    window.location.reload();
  });
  submitLoadButton.addEventListener('click', function () {
    document.dispatchEvent(new CustomEvent('appSystemMessage', { detail: "Verifying ownership of transaction..." }));
    transactionVerification();
  });
  async function transactionVerification() {
    transactionHash = retrieveTransaction.value;
    console.log("User submitted: " + transactionHash);

    // Regular expression to validate the transaction hash format
    const validHashRegex = /^0x[a-fA-F0-9]{64}$/;
    if (!validHashRegex.test(transactionHash)) {
      console.error("Invalid transaction hash format:", transactionHash);
      document.dispatchEvent(new Event('hideSystemMessage'));
      document.dispatchEvent(new CustomEvent('appError', { detail: "Invalid transaction hash format. Please check and try again." }));
      return; // Stop further execution if the hash is invalid
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      playerAddress = await signer.getAddress();
      const signature = await signer.signMessage("Verify ownership for session " + transactionHash);
      console.log("Signature: ", signature);

      sypherAllocation = await fetchSypherAllocationFromDB(transactionHash);

      fetch('/verify-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionHash, signature, sypherAllocation }),
      })
        .then(async response => {
          const data = await response.json();
          if (!response.ok) {
            console.error('Fetch error:', data.error, data.details || '');
            document.dispatchEvent(new CustomEvent('appError', { detail: data.error || "Error during session verification." }));
            // If the specific error is "Session not found", check if the transaction is a PlayGame transaction
            if (data.error === "Session not found for the provided transaction hash.") {
              checkIfPlayGameTransaction(transactionHash)
                .then(isPlayGame => {
                  console.log(`Is the transaction a 'PlayGame' transaction? ${isPlayGame}`);
                  if (isPlayGame) {
                    fetch(`/verify-playgame/${transactionHash}`)
                      .then(response => response.json())
                      .then(data => {
                        if (response.ok) {
                          console.log('Server confirmed PlayGame transaction:', data);
                          startGame(true, transactionHash);
                        } else {
                          console.error('Server validation failed:', data.error);
                          document.dispatchEvent(new CustomEvent('appError', { detail: data.error }));
                        }
                      })
                      .catch(error => {
                        console.error('Error during server verification:', error);
                        document.dispatchEvent(new CustomEvent('appError', { detail: "Failed to verify transaction on server." }));
                      });
                  }
                  else {
                    console.error('Not a PlayGame transaction: ', transactionHash);
                    document.dispatchEvent(new CustomEvent('appError', { detail: "The transaction is not valid for starting a game." }));
                  }
                })
                .catch(error => {
                  console.error("Error checking transaction type:", error);
                });
            }
            return;
          }
          console.log('Session verification:', data);
          document.dispatchEvent(new Event('hideSystemMessage'));
          triggerGameRestart(data);
        })
        .catch(error => {
          console.error('Fetch error:', error.message);
          document.dispatchEvent(new CustomEvent('appError', { detail: error.message || "Network error. Please try again." }));
        });

    } catch (error) {
      console.error('Error:', error);
      if (error.code === 4001) {
        document.dispatchEvent(new CustomEvent('appError', { detail: "User rejected the request." }));
      } else {
        document.dispatchEvent(new CustomEvent('appError', { detail: "An unexpected error occurred. Please try again." }));
      }
    }
  }
  async function fetchSypherAllocationFromDB(transactionHash) {
    try {
      const response = await fetch(`/get-sypher-allocation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ transactionHash })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch sypher allocation');
      }
      return data.sypherAllocation;
    } catch (error) {
      console.error("Error fetching sypher allocation from database:", error);
      throw error;  // Rethrowing the error to be caught by the caller
    }
  }
  function triggerGameRestart(data) {
    const gameRestartEvent = new CustomEvent('gameRestart', {
      detail: {
        reason: 'Session restored or new game started',
        sessionData: data  // Passing the actual game session data
      }
    });
    document.dispatchEvent(gameRestartEvent);
    console.log("Dispatched game restart event with data.");
    showKeyboardHelperButton();
  }
  async function checkIfPlayGameTransaction(transactionHash) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const transaction = await provider.getTransaction(transactionHash);

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    // Check if the transaction is to the game contract and is a PlayGame call
    const playGameMethodId = getMethodId("PlayGame"); // Ensure you have this function defined to get the method ID
    return transaction.to.toLowerCase() === gameContractAddress.toLowerCase() && transaction.data.startsWith(playGameMethodId);
  }
  function getMethodId(methodName) {
    const abi = new ethers.utils.Interface(gameContractABI);
    return abi.getSighash(methodName);
  }
  // #endregion Restore Game Session - LOAD GAME

  // #region reCAPTCHA Section
  window.onSubmitPlay = async function (token) {
    document.dispatchEvent(new CustomEvent('appSystemMessage', { detail: "reCaptcha Verification in Progress..." }));
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
        document.dispatchEvent(new Event('hideSystemMessage'));
        console.log("reCAPTCHA verification successful, checking for token approval...");
        const hasSufficientAllowance = await checkTokenAllowance();
        console.log("Token allowance check:", hasSufficientAllowance);
        if (!hasSufficientAllowance) {
          console.log("Player has not approved token spend yet, attempting to get approval...");
          const approvalSuccess = await approveTokenSpend();
          console.log("Token spend approval status:", approvalSuccess);
          if (!approvalSuccess) {
            console.log("Token spend approval failed");
            document.dispatchEvent(new Event('hideSystemMessage'));
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
    document.dispatchEvent(new Event('hideSystemMessage'));
  }
  window.onSubmitLoad = async function (token) {
    document.dispatchEvent(new CustomEvent('appSystemMessage', { detail: "reCaptcha Verification in Progress..." }));
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
        document.dispatchEvent(new Event('hideSystemMessage'));
        revealSessionRecoveryForm();
      } else {
        console.log("reCAPTCHA verification failed");
      }
    } catch (error) {
      console.error("Error during reCAPTCHA verification:", error);
    }
    document.dispatchEvent(new Event('hideSystemMessage'));
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
            'sitekey': '6LeUA9ApAAAAAClsfK-owv8_WzHOTx4OJZe5zU9k',
            'callback': onSubmitPlay
          });

          console.log("'playButton' reCAPTCHA rendering completed.");

          console.log("Starting to render reCAPTCHA for 'load-button'...");

          grecaptcha.render('load-button', {
            'sitekey': '6LeUA9ApAAAAAClsfK-owv8_WzHOTx4OJZe5zU9k',
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
  window.showKeyboardHelperButton = function () {
    console.log("Revealing keyboard helper button...");
    keyboardButton.style.display = 'block'; // Ensure button is visible
    keyboardButton.classList.add('glow-effect'); // Apply glow/sheen animation
  }
  keyboardButton.addEventListener('click', () => {
    keyboardHelperToggle();
  });
  function keyboardHelperToggle() {
    keyboardHelperVisible = !keyboardHelperVisible; // Toggle visibility state
    localStorage.setItem('keyboardHelperVisible', keyboardHelperVisible);

    // Toggle visibility based on keyboardHelperVisible and screen width
    const screenWidth = window.innerWidth;
    const useMobileLogo = screenWidth <= 485;

    keyboardHelper.style.display = keyboardHelperVisible ? 'flex' : 'none'; // Apply visibility state to CSS
    keyboardHelper.style.animation = keyboardHelperVisible ? 'tvScreenOn .25s forwards' : 'tvScreenOff .25s forwards'; // Apply animation based on visibility

    if (useMobileLogo) {
      mobileGameLogo.style.display = keyboardHelperVisible ? 'none' : 'block'; // Toggle mobile game logo visibility
      mobileGameLogo.style.animation = keyboardHelperVisible ? 'tvScreenOff .25s forwards' : 'tvScreenOn .25s forwards'; // Apply animation based on visibility
    } else {
      gameLogo.style.display = keyboardHelperVisible ? 'none' : 'block'; // Toggle main game logo visibility
      gameLogo.style.animation = keyboardHelperVisible ? 'tvScreenOff .25s forwards' : 'tvScreenOn .25s forwards'; // Apply animation based on visibility
    }

    console.log("Keyboard helper visibility toggled to: " + (keyboardHelperVisible ? "Visible" : "Hidden"));
    console.log("Game logo visibility set to: " + (keyboardHelperVisible ? "Hidden" : "Visible"));

    // Remove the glow/sheen animation on first click
    keyboardButton.style.animation = 'none';
    console.log("Glow/sheen animation removed after first click.");
  };
  window.addEventListener("gameStart", function () {
    // Check the status of the keyboard helper visibility in the local storage for persistence across sessions
    const storedVisibility = localStorage.getItem('keyboardHelperVisible');
    if (storedVisibility !== null) {
      keyboardHelperVisible = storedVisibility === 'true'; // Convert string to boolean
      keyboardHelper.style.display = keyboardHelperVisible ? 'flex' : 'none'; // Set initial display based on stored value
      console.log("Keyboard helper visibility restored from local storage:", keyboardHelperVisible);
      if (window.innerWidth > 485) {
        gameLogo.style.display = keyboardHelperVisible ? 'none' : 'block';
      } else {
        mobileGameLogo.style.display = keyboardHelperVisible ? 'none' : 'block';
      }
    }
  });
  // #endregion Keyboard Helper Logic

  // #region Data Persistence
  function updateReturningPlayerStatus() {
    localStorage.setItem('returningPlayer', 'true');
    returningPlayer = true;
    console.log("Player has completed a game, updating returningPlayer status to true.");
  }
  // #endregion Data Persistence

  // #region Faucet Distribution
  async function faucet() {
    faucetButton.addEventListener('click', async () => {
      let signer;
      let playerAddress;

      try {
        signer = provider.getSigner();
        playerAddress = await signer.getAddress();
      } catch (error) {
        console.error("Error obtaining signer or address:", error);
        document.dispatchEvent(new CustomEvent('appError', { detail: "Could not access user's address. Please ensure your wallet is connected." }));
        return; // Exit the function if we cannot get the signer or the address
      }

      const recipientAddress = playerAddress; // This should be the address obtained from the user's wallet connection

      // Check the ETH balance first
      const balance = await provider.getBalance(recipientAddress);
      if (balance.isZero()) {
        const noGasContainer = document.getElementById('no-gas-container');
        noGasContainer.style.display = 'block';

        setTimeout(() => {
          noGasContainer.style.display = 'none';
        }, 10000); // 10000 milliseconds = 10 seconds

        return;
      }

      const tokenAmount = 100; // Define the amount of tokens to send

      console.log("Requesting faucet distribution to:", recipientAddress);
      document.dispatchEvent(new CustomEvent('appSystemMessage', { detail: "Requesting faucet distribution..." }));

      fetch('/distribute-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ recipientAddress, tokenAmount })
      })
        .then(response => response.json().then(data => ({
          status: response.status,
          body: data
        })))
        .then(result => {
          if (result.status === 200) {
            console.log("Transaction submitted, hash:", result.body.transactionHash);
            document.dispatchEvent(new CustomEvent('appError', { detail: "Faucet distribution successful!" }));
          } else {
            // This handles custom errors from the server, like cooldown
            console.error("Error distributing tokens:", result.body.error);
            document.dispatchEvent(new CustomEvent('appError', { detail: result.body.message }));
          }
        })
        .catch(error => {
          console.error("Network or server error:", error);
          document.dispatchEvent(new CustomEvent('appError', { detail: "Error distributing tokens. Please try again." }));
        });
    });
  }
  faucet();
  // #endregion Faucet Distribution
});