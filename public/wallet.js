var playerAddress = null;
var transactionHash = null;

document.addEventListener('DOMContentLoaded', function () {

  const gameLogo = document.getElementById('game-logo');
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
  const minimumBalance = 10; // Cost to play the game

  let reCaptchaInitialized = false;
  let keyboardHelperVisible = false;

  let rewardsButtonVisible = false;

  if (window.ethereum) {
    var provider = new ethers.providers.Web3Provider(window.ethereum);
    console.log("Wallet installed. Provider initialized.");
    setupTokenEventListener();
    rewardsBalanceEventListeners();
  }

  // Base Mainnet
  const REQUIRED_CHAIN_ID = 11155111; // Replace with 8453

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
  async function startGame(useExistingTransaction = false, existingTransactionHash = null) {
    try {
      if (!useExistingTransaction) {
        console.log("Approval to spend tokens successful. Initiating transaction to start the game...");
        playButton.textContent = "Waiting on transaction...";
        const signer = provider.getSigner();
        const gameContract = new ethers.Contract(gameContractAddress, gameContractABI, signer);
        try {
          playerAddress = await signer.getAddress();
          console.log("Player address:", playerAddress);
          const playGameTx = await gameContract.PlayGame(await signer.getAddress());
          showLoadingAnimation();
          console.log("Waiting for game transaction to be mined...");
          await playGameTx.wait();
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

      fetch('/game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerAddress, transactionHash, word }),
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

    } catch (error) { // This catch is now correctly positioned to handle errors from any part of the function
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
      const claimTx = await gameContract.ClaimRewards();
      await claimTx.wait();
      console.log("Rewards claimed successfully.");

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
      updateRewardsBalance();  // Update balance whenever a game is completed
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
    playButton.style.display = 'none';
    loadButton.style.animation = 'foldInRemove .25s forwards';
    loadButton.style.display = 'none';

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

      fetch('/verify-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionHash, signature }),
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
                  document.dispatchEvent(new Event('hideSessionRecoveryForm'));
                  startGame(true, transactionHash);
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
    keyboardHelper.style.display = keyboardHelperVisible ? 'flex' : 'none'; // Apply visibility state to CSS
    keyboardHelper.style.animation = keyboardHelperVisible ? 'tvScreenOn .25s forwards' : 'tvScreenOff .25s forwards'; // Apply animation based on visibility
    gameLogo.style.display = keyboardHelperVisible ? 'none' : 'block'; // Toggle game logo visibility opposite to keyboard helper
    gameLogo.style.animation = keyboardHelperVisible ? 'tvScreenOff .25s forwards' : 'tvScreenOn .25s forwards'; // Apply animation based on visibility
    Debug.Log("Keyboard helper visibility toggled to: " + (keyboardHelperVisible ? "Visible" : "Hidden"));
    Debug.Log("Game logo visibility set to: " + (keyboardHelperVisible ? "Hidden" : "Visible"));

    // Remove the glow/sheen animation on first click
    keyboardButton.style.animation = 'none';
    Debug.Log("Glow/sheen animation removed after first click.");
  });
  // #endregion Keyboard Helper Logic
});