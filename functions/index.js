// This script handles the main portion of server-side functionality for the word game
// It serves the static files, and handles the game logic
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const ethers = require('ethers');
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

const provider = new ethers.JsonRpcProvider(process.env.PROVIDER_URL); // RPC_URL is your Ethereum node or gateway URL
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider); // PRIVATE_KEY of the account that deploys the contract or is authorized to call recordWin

const config = require('./config.json');

const sypherGameAddress = config.game.address;
const sypherGameABI = config.game.abi;
const gameManagerAddress = config.gameManager.address;
const gameManagerABI = config.gameManager.abi;

const sypherGameContract = new ethers.Contract(sypherGameAddress, sypherGameABI, signer);
const gameManagerContract = new ethers.Contract(gameManagerAddress, gameManagerABI, provider);

const app = express();
app.use(express.json());

const maxAttempts = 4;

const maxReward = 5;
const minReward = 2;

// #region Setup & CORS
// Define your website's origin
const allowedOrigins = ["http://localhost:5000", "https://desypher.net", "https://desypher-6245f.web.app", "https://desypher-6245f.firebaseapp.com"]; // Add your website's domain here

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
app.use(express.static(path.join(__dirname, '../public')));

// Serve the HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});
// #endregion Setup & CORS

// #region Word Game Main Logic
// Getter function that handles the guess check, and the attempts of guesses
app.post('/game', async (req, res) => {
  const { playerAddress, transactionHash, word } = req.body;
  var sessionID = transactionHash;

  if (!sessionID) {
    return res.status(400).send({ error: 'No txHash provided' });
  }

  var sessionDoc = await database.collection('sessions').doc(sessionID).get();
  var session = sessionDoc.data() ?? {};
  var correctWord = null;

  // Check if the session exists
  if (sessionDoc.exists) {
    if (sessionDoc.data().gameOver) {
      return res.send(sessionDoc.data())
    }
  } else {
    console.log(`Starting new game for player: ${playerAddress}`);
    correctWord = await chooseWord();  // Select a new word for the game

    session = {
      result: [],
      guesses: [],
      gameOver: false,
      isWin: false,
      attemptsLeft: maxAttempts,
      correctWord: correctWord,
      playerAddress: playerAddress,
    };

    await database.collection('sessions').doc(sessionID).set(session);
    console.log('New game started, correct word:', correctWord);
  }

  // If the correct word is not set, set it to the session's correct word
  correctWord ??= session.correctWord;

  const guessedWord = word;

  if (!guessedWord) {
    console.log('No word provided');
    delete session.correctWord;
    return res.send(session);
  }

  var attempts = maxAttempts - session.attemptsLeft;
  var guesses = session.guesses;

  // Check if the word is in the word list
  let wordDoc = await database.collection('words').doc(guessedWord.trim().replace(' ', '').toLowerCase()).get();
  if (!wordDoc.exists) {
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

  // In your /game POST route
  const guessedWordRef = database.collection('words').doc(guessedWord.trim().replace(' ', '').toLowerCase());
  database.runTransaction(async (transaction) => {
    const doc = await transaction.get(guessedWordRef);
    if (doc.exists) {
      const newTimesGuessed = (doc.data().timesGuessed || 0) + 1;
      transaction.update(guessedWordRef, { timesGuessed: newTimesGuessed });
    }
  });

  let rewardAmount = ethers.parseUnits("0", 18);  // Default to no reward

  if (isWin) {
    const costToPlay = await sypherGameContract.costToPlay();
    switch (attempts) {
      case 1:
        {
          const sypherCache = await gameManagerContract.getSypherCache();
          if (sypherCache > 0) {
            rewardAmount = sypherCache;
          } else {
            rewardAmount = ethers.parseUnits("1", 18);
          }
        }
        break;
      case 2:
        rewardAmount = costToPlay * BigInt(maxReward);
        break;
      case 3:
        rewardAmount = costToPlay * BigInt(minReward);
        break;
      case 4:
        rewardAmount = costToPlay;
        break;
    }
    // console.log(`Player won on attempt ${attempts}! Reward is ${ethers.formatUnits(rewardAmount, 18)} SYPHER!`);
  }

  if (isWin || session.guesses.length === maxAttempts) {
    // Submit the transaction to the blockchain and proceed without waiting
    const tx = await sypherGameContract.CompleteGame(playerAddress, rewardAmount, isWin);

    // Log the transaction hash and handle it asynchronously
    console.log(`Transaction submitted: ${tx.hash}`);

    handleTransactionConfirmation(tx.hash);
  }

  session.gameOver = isWin || session.guesses.length >= maxAttempts;
  session.isWin = isWin;
  session.attemptsLeft = maxAttempts - session.guesses.length;
  session.result = result;
  session.guesses = guesses;
  session.correctWord = correctWord;
  session.playerAddress = playerAddress;

  await database.collection('sessions').doc(sessionID).update(session);

  if (!session.gameOver) delete session.correctWord;

  res.send(session);
});

async function handleTransactionConfirmation(txHash) {
  try {
    const receipt = await provider.waitForTransaction(txHash);
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
    // TODO Update the UI with the transaction status
  } catch (error) {
    console.error('Error during transaction confirmation:', error);
  }
}

// Function to grab a random word from the word list
async function chooseWord() {
  let configDoc = await database.collection('config').doc('wordConfig').get();
  let count = configDoc.data().count;

  let randomIndex = Math.floor(Math.random() * count);

  let wordDoc = (await database.collection('words').where('index', '==', randomIndex).get()).docs[0];

  return wordDoc.id;
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

  const signerAddress = ethers.verifyMessage("Verify ownership for session " + transactionHash, signature);

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

exports.app = functions.https.onRequest(app);