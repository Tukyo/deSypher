// This script handles the main portion of server-side functionality for the word game
// It serves the static files, and handles the game logic
const functions = require('firebase-functions');
const { Firestore } = require("firebase-admin/firestore");
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

const provider = new ethers.JsonRpcProvider(process.env.PROVIDER_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const config = require('./config.json');
const rateLimit = require("express-rate-limit");

const rateLimiter = rateLimit({
  windowMs: 1 * 1000,
  max: 1,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many requests from this IP, please try again...' });
  }
});

const recaptchaLimiter = rateLimit({
  windowMs: 10 * 1000,
  max: 1,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many reCAPTCHA requests, please try again after 10 seconds...' });
  }
});

const sypherGameAddress = config.game.address;
const sypherGameABI = config.game.abi;
const gameManagerAddress = config.gameManager.address;
const gameManagerABI = config.gameManager.abi;
const masterSypherAddress = config.mastersypher.address;
const masterSypherABI = config.mastersypher.abi;

const tokenAddress = config.token.address;
const tokenABI = config.token.abi;

const sypherGameContract = new ethers.Contract(sypherGameAddress, sypherGameABI, signer);
const gameManagerContract = new ethers.Contract(gameManagerAddress, gameManagerABI, provider);
const masterSypherContract = new ethers.Contract(masterSypherAddress, masterSypherABI, signer);

const recaptchaSecretKey = process.env.RECAPTCHA_SECRET_KEY;

const app = express();
app.use(express.json());

const maxAttempts = 4;

// Reward multipliers
const maxReward = 200;
const minReward = 150;

// #region Setup & CORS
const allowedOrigins = ["http://localhost:5000", "https://desypher.net", "https://desypher-6245f.web.app", "https://desypher-6245f.firebaseapp.com"];

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
app.post('/game', rateLimiter, async (req, res) => {
  const { playerAddress, transactionHash, word, sypherAllocation } = req.body;
  var sessionID = transactionHash;

  if (!sessionID) {
    return res.status(400).send({ error: 'No txHash provided' });
  }
  if (!sypherAllocation) {
    return res.status(400).send({ error: 'No sypher allocation provided' });
  }
  if (sypherAllocation < 1 || sypherAllocation > 1000) {
    return res.status(400).send({ error: 'Sypher allocation must be between 1 and 1000' });
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
      sypherAllocation: sypherAllocation
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
    const sypherAllocation = ethers.parseUnits(session.sypherAllocation.toString(), 18);
    switch (attempts) {
      case 1:
        {
          const sypherCache = await gameManagerContract.getSypherCache();
          if (sypherCache > 0) {
            rewardAmount = sypherCache;
          } else {
            rewardAmount = sypherAllocation + ethers.parseUnits("1", 18);
          }
        }
        break;
      case 2:
        rewardAmount = sypherAllocation * BigInt(maxReward) / BigInt(100);
        break;
      case 3:
        rewardAmount = sypherAllocation * BigInt(minReward) / BigInt(100);
        break;
      case 4:
        rewardAmount = sypherAllocation;
        break;
    }
  }

  if (isWin || session.guesses.length === maxAttempts) {
    // Submit the transaction to the blockchain and proceed without waiting
    const tx = await sypherGameContract.CompleteGame(playerAddress, ethers.parseUnits(sypherAllocation.toString(), 18), rewardAmount, isWin);

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

app.post('/verify-session', rateLimiter, async (req, res) => {
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
app.post('/get-sypher-allocation', async (req, res) => {
  const { transactionHash } = req.body;
  if (!transactionHash) {
    return res.status(400).send({ error: 'Transaction hash is required' });
  }

  try {
    const sessionDoc = await database.collection('sessions').doc(transactionHash).get();
    if (!sessionDoc.exists) {
      return res.status(404).send({ error: 'Session not found' });
    }
    const session = sessionDoc.data();
    if (session && session.sypherAllocation) {
      res.send({ sypherAllocation: session.sypherAllocation });
    } else {
      res.status(404).send({ error: 'Sypher allocation not found' });
    }
  } catch (error) {
    console.error(`Database error: ${error}`);
    res.status(500).send({ error: 'Failed to retrieve sypher allocation from the database' });
  }
});
app.get('/verify-playgame/:txHash', async (req, res) => {
  const { txHash } = req.params;
  try {
    const transaction = await provider.getTransaction(txHash);
    if (transaction) {
      const playGameMethodId = "0x676d7089"; // Method ID for PlayGame
      const isPlayGame = transaction.data.startsWith(playGameMethodId);
      if (isPlayGame) {
        res.send({ message: 'Valid PlayGame transaction', details: transaction });
      } else {
        res.status(400).send({ error: 'Not a PlayGame transaction' });
      }
    } else {
      res.status(404).send({ error: 'Transaction not found' });
    }
  } catch (error) {
    console.error(`Error verifying transaction: ${error}`);
    res.status(500).send({ error: 'Failed to verify transaction' });
  }
});
// #endregion Word Game Main Logic

// #region reCAPTCHA Verification
app.post('/verify_recaptcha', recaptchaLimiter, express.json(), async (req, res) => {
  const token = req.body.token;

  console.log("Received reCAPTCHA token from client:", token); // Log the received token

  try {
    console.log("Sending reCAPTCHA token to Google for verification..."); // Log before sending the token

    const response = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
      params: {
        secret: recaptchaSecretKey,
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

// #region Popular Words
app.get('/popular-words', async (req, res) => {
  try {
    const wordsSnapshot = await database.collection('words')
      .orderBy('timesGuessed', 'desc')
      .limit(5) // Get top 5 popular words
      .get();

    const popularWords = [];
    wordsSnapshot.forEach(doc => {
      popularWords.push({ word: doc.id, timesGuessed: doc.data().timesGuessed });
    });

    res.status(200).json(popularWords);
  } catch (error) {
    console.error("Failed to fetch popular words:", error);
    res.status(500).json({ message: "Failed to fetch popular words" });
  }
});
// #endregion Popular Words

// #region Top Players
app.get('/top-players', async (req, res) => {
    try {
        const snapshot = await admin.firestore().collection('players')
            .orderBy('netWins', 'desc')
            .limit(5)
            .get();

        const topPlayers = snapshot.docs.map(doc => ({
            address: doc.id,
            netWins: doc.data().netWins
        }));

        res.json(topPlayers);
    } catch (error) {
        console.error("Failed to fetch top players:", error);
        res.status(500).send("Error fetching top players"); 
    }
});
// #endregion Top Players

exports.updatePlayerWins = functions.firestore.document('sessions/{sessionId}').onWrite(async (change, context) => {
  if (change.after.exists && change.after.data().gameOver) {
    const playerAddress = change.after.data().playerAddress;
    const isWin = change.after.data().isWin;

    const playerDoc = await admin.firestore().collection('players').doc(playerAddress).get();
    let _netWins = playerDoc.exists ? (playerDoc.data().netWins || 0) + (isWin ? 1 : -1) : (isWin ? 1 : -1);
    let updates = {
      netWins: _netWins,
      wins: isWin ? (playerDoc.data().wins || 0) + 1 : (playerDoc.data().wins || 0),
      losses: !isWin ? (playerDoc.data().losses || 0) + 1 : (playerDoc.data().losses || 0)
    };

    if (!playerDoc.exists) {
      await playerDoc.ref.set(updates);
      console.log("Initialized player document with address: " + playerAddress);
    } else {
      await playerDoc.ref.update(updates);
      console.log("Updated wins/losses for player with address: " + playerAddress);
    }

    const masterSypherDoc = await admin.firestore().collection('masterSypher').doc('masterSypher').get();
    const currentTopPlayer = masterSypherDoc.exists ? masterSypherDoc.data().playerAddress : null;

    if (!masterSypherDoc.exists || playerAddress === masterSypherDoc.data().playerAddress) {
      await masterSypherDoc.ref.set({
        playerAddress: playerAddress,
        netWins: _netWins
      });
      console.log("Updated masterSypher with new top player address: " + playerAddress);

      if (currentTopPlayer !== playerAddress) {
        await transferMasterSypherToken(currentTopPlayer, playerAddress);
      }
    }
  }
});

async function transferMasterSypherToken(currentTopPlayer, newTopPlayer) {
  try {
    const transaction = await masterSypherContract.transferFrom(currentTopPlayer, newTopPlayer, 1);
    const receipt = await transaction.wait();
    console.log("Transaction successful: ", receipt.transactionHash);
    console.log("MasterSypher token transferred from " + currentTopPlayer + " to " + newTopPlayer);
  } catch (error) {
    console.error("Failed to transfer MasterSypher token:", error);
  }
}


// #region Faucet Section
app.post('/distribute-tokens', rateLimiter, async (req, res) => {
  const { recipientAddress, tokenAmount } = req.body;

  try {
    const cooldownStatus = await checkCooldown(recipientAddress);
    if (cooldownStatus.isWithinCooldown) {
      return res.status(429).json({
        error: 'Request too soon',
        message: `Please wait ${Math.ceil(cooldownStatus.timeRemaining / 60000)} minutes before requesting tokens again.`
      });
    }

    const tokenContract = new ethers.Contract(
      tokenAddress,
      tokenABI,
      signer
    );

    const tokenDecimalAmount = ethers.parseUnits(tokenAmount.toString(), 18);
    const tx = await tokenContract.transfer(recipientAddress, tokenDecimalAmount);

    // Wait for the transaction to be mined to ensure it's been processed by the network
    const receipt = await tx.wait();

    // Log the transaction in the database
    await recordTransaction(tx.hash, signer.address, recipientAddress, tokenAmount);

    console.log("Transaction successful with hash:", tx.hash);
    res.json({ transactionHash: tx.hash });
  } catch (error) {
    console.error("Failed to send transaction:", error);
    console.error("Detailed Error: ", error.message);
    res.status(500).json({ error: 'Transaction failed', details: error.message });
  }
});

async function recordTransaction(transactionHash, fromAddress, toAddress, amount) {
  const transactionRecord = {
    from: fromAddress,
    to: toAddress,
    amount,
    timestamp: Firestore.FieldValue.serverTimestamp()
  };

  await database.collection('faucet').doc(transactionHash).set(transactionRecord);
}

const ONE_HOUR = 3600000; // Milliseconds in one hour
const COOLDOWN_PERIOD = 24 * ONE_HOUR; // 24 hours

async function checkCooldown(recipientAddress) {
  const now = Date.now();
  try {
    const latestTransaction = await database.collection('faucet')
      .where('to', '==', recipientAddress)
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

    if (!latestTransaction.empty) {
      const lastTransactionTime = latestTransaction.docs[0].data().timestamp.toMillis();
      if (now - lastTransactionTime < COOLDOWN_PERIOD) {
        return {
          isWithinCooldown: true,
          timeRemaining: COOLDOWN_PERIOD - (now - lastTransactionTime)
        };
      }
    }
    return { isWithinCooldown: false };
  } catch (error) {
    console.error("Error checking cooldown:", error);
    throw error; // Propagate error
  }
}
// #endregion Faucet Section

exports.app = functions.https.onRequest(app);