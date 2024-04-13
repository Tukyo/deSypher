// This script handles the main portion of server-side functionality for the word game
// It serves the static files, and handles the game logic
const admin = require('firebase-admin');
const { ethers } = require('ethers');
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

require('dotenv').config();

var serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const database = admin.firestore();

const provider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER_URL); // RPC_URL is your Ethereum node or gateway URL
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider); // PRIVATE_KEY of the account that deploys the contract or is authorized to call recordWin

const sypherGameAddress = '0x0Ded0311A80E39d822850A2cA358beDC4053E88E'; // Replace with the game's contract address
const sypherGameABI = [
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
const sypherGameContract = new ethers.Contract(sypherGameAddress, sypherGameABI, signer);

const app = express();
app.use(express.json());
const port = 3000;

const maxAttempts = 4;
const fs = require('fs'); // For choosing the random word from the filesystem

// let attempts = 0;

// let guesses = [];

// let currentGamePlayerAddress = '';

// #region Setup & CORS
// Define your website's origin
const allowedOrigins = ['http://localhost:3000', 'http://192.168.4.64:3000', "https://www.desypher.net/"]; // Add your website's domain here

// CORS options
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`Origin: ${origin} was not allowed by CORS!`); // Log the error origin
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200 // For legacy browser support
};

// Use CORS with predefined options for all routes
app.use(cors(corsOptions));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve the HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
// #endregion Setup & CORS

// #region Word Game Main Logic
// Getter function that handles the guess check, and the attempts of guesses
app.post('/guess', async (req, res) => {

  const { playerAddress, transactionHash, word } = req.body;
  var sessionID = transactionHash;


  if (!sessionID) {
    return res.status(400).send({ error: 'No txHash provided' });
  }

  var sessionDoc = await database.collection('sessions').doc(sessionID).get();
  var session = sessionDoc.data();
  var correctWord = null;

  // DOES THE SESSION EXIST?
  if (sessionDoc.exists) {

    if (sessionDoc.data().gameOver) {
      return res.send(sessionDoc.data())
    }

    // SESSION DOES NOT EXIST, START NEW GAME
  } else {
    console.log(`Starting new game for player: ${playerAddress}`);

    // Reset game state
    correctWord = chooseWord();

    session = {
      result: [],
      guesses: [], // Send the guesses array in the response
      gameOver: false,
      isWin: false,
      attemptsLeft: maxAttempts,
      correctWord: correctWord,
      playerAddress: playerAddress,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }

    await database.collection('sessions').doc(sessionID).set(session);

    console.log('New game started, correct word:', correctWord);
  }

  correctWord ??= session.correctWord;

  const guessedWord = word;
  var attempts = maxAttempts - session.attemptsLeft;
  var guesses = session.guesses;



  if (!guessedWord) {
    console.log('No word provided');
    delete session.correctWord;
    return res.send(session);
  }

  // Check if the word is in the word list
  const words = fs.readFileSync('./five-letter-words.txt', 'utf8').split('\n');
  const fiveLetterWords = words.map(word => word.replace('\r', '')).filter(word => word.length === 5);
  // console.log('Word list:', fiveLetterWords); // Print out the word list
  // console.log('Correct word:', correctWord.toLowerCase()); // Print out the correct word
  console.log('Guessed word:', guessedWord.toLowerCase()); // Print out the guessed word
  if (!fiveLetterWords.includes(guessedWord.toLowerCase())) {

    return res.send({ error: 'This word is not valid!' });
  }


  attempts++;

  const result = checkWord(guessedWord.toLowerCase(), correctWord);
  const isWin = guessedWord.toLowerCase() === correctWord;

  // Store the guess and its result
  guesses.push({
    word: guessedWord.toLowerCase(),
    result: result,
    isWin: isWin
  });

  // Check if the player has won and log the message based on the attempt
  if (isWin) {
    let rewardAmount;
    switch (attempts) {
      case 1:
        rewardAmount = ethers.utils.parseUnits("5000", 18);
        console.log("Player won on first attempt! Reward is 5000 SYPHER!");
        break;
      case 2:
        rewardAmount = ethers.utils.parseUnits("500", 18);
        console.log("Player won on second attempt! Reward is 500 SYPHER!");
        break;
      case 3:
        rewardAmount = ethers.utils.parseUnits("50", 18);
        console.log("Player won on third attempt! Reward is 50 SYPHER!");
        break;
      case 4:
        rewardAmount = ethers.utils.parseUnits("10", 18);
        console.log("Player won on fourth attempt! Reward is 10 SYPHER!");
        break;
    }

    if (rewardAmount) {
      // Replace 'playerAddress' with the actual player's Ethereum address
      const tx = await sypherGameContract.recordWin(playerAddress, rewardAmount);
      await tx.wait(); // Wait for the transaction to be mined
      console.log(`Reward recorded: ${attempts} attempt(s), ${rewardAmount.toString()} SYPHER tokens`);
    }
  }


  session = {
    result,
    guesses,
    gameOver: isWin || attempts >= maxAttempts,
    isWin,
    attemptsLeft: maxAttempts - attempts,
    correctWord: correctWord,
    playerAddress: playerAddress,
  };

  await database.collection('sessions').doc(sessionID).update(session);

  if (!session.gameOver) delete session.correctWord;

  res.send(session);
});

// Endpoint to start a new game
app.post('/start-game', (req, res) => {

  const { playerAddress } = req.body;
  console.log(`Starting new game for player: ${playerAddress}`);

  currentGamePlayerAddress = playerAddress;

  // Reset game state
  correctWord = chooseWord();
  attempts = 0;
  guesses = [];

  console.log('New game started, correct word:', correctWord); // For debugging
  res.json({ success: true, message: "New game started" });
});


// Function to grab a random word from the word list
function chooseWord() {
  const words = fs.readFileSync('./five-letter-words.txt', 'utf8').split('\n');
  const fiveLetterWords = words.filter(word => word.trim().replace('\r', '').length === 5);
  return fiveLetterWords[Math.floor(Math.random() * fiveLetterWords.length)].replace('\r', '').toLowerCase();
}

// Function that checks the guessed word based on the input word against the correct word
function checkWord(inputWord, correctWord) {
  let result = new Array(inputWord.length).fill(null).map(() => ({ letter: '', status: 'incorrect' }));
  const targetLetters = correctWord.split('');
  const inputLetters = inputWord.split('');

  // Mark correct letters in the correct position first
  inputLetters.forEach((letter, index) => {
    result[index].letter = letter; // Assign letter to result
    if (letter === targetLetters[index]) {
      result[index].status = 'correct';
      targetLetters[index] = null; // Prevent this letter from being matched again
    }
  });

  // Handle correct letters in incorrect positions
  inputLetters.forEach((letter, index) => {
    if (result[index].status !== 'correct') {
      const targetIndex = targetLetters.indexOf(letter);
      if (targetIndex !== -1 && targetIndex !== index) {
        result[index].status = 'misplaced';
        targetLetters[targetIndex] = null; // Mark this target letter as used
      }
    }
  });

  return result;
}
app.post('/verify-session', async (req, res) => {
  const { transactionHash, signature } = req.body;

  if (!transactionHash || !signature) {
    return res.status(400).send({ error: 'Missing required parameters: transactionHash and signature must be provided.' });
  }

  var sessionDoc = await database.collection('sessions').doc(transactionHash).get();
  if (!sessionDoc.exists) {
    return res.status(404).send({ error: 'Session not found for the provided transaction hash.' });
  }
  var session = sessionDoc.data();
  var storedPlayerAddress = session.playerAddress; // The original address that started the session

  const signerAddress = ethers.utils.verifyMessage("Verify ownership for session " + transactionHash, signature);

  if (signerAddress !== storedPlayerAddress) {
    console.log(`Failed verification: Signer ${signerAddress} does not match stored address ${storedPlayerAddress}`);
    return res.status(403).send({ error: 'Verification failed. You do not own this transaction.', details: `The address that signed the transaction (${signerAddress}) does not match the owner's address (${storedPlayerAddress}) associated with this session.` });
  }

  console.log('Session verified for player:', storedPlayerAddress);

  if (!session.gameOver) {
    delete session.correctWord;
  }

  res.send(session);
});





// #endregion Word Game Main Logic

// #region reCAPTCHA Verification
app.post('/verify_recaptcha', express.json(), async (req, res) => {
  const token = req.body.token;

  console.log("Received reCAPTCHA token from client:", token); // Log the received token

  try {
    console.log("Sending reCAPTCHA token to Google for verification..."); // Log before sending the token

    const response = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
      params: {
        secret: '6Ldq-60pAAAAAH3juNkbSpNZ34UBNoBksfXmiUgd',
        response: token
      }
    });

    console.log("Received response from Google:", response.data); // Log the received response

    const data = response.data;

    if (data.success) {
      console.log("reCAPTCHA verification successful"); // Log on successful verification
      res.json({ success: true });
    } else {
      console.log("reCAPTCHA verification failed"); // Log on failed verification
      res.json({ success: false });
    }
  } catch (error) {
    console.error("Error during reCAPTCHA verification:", error);
    res.status(500).json({ success: false });
  }
});
// #endregion reCAPTCHA Verification

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});