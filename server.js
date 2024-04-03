// This script handles the main portion of server-side functionality for the word game
// It serves the static files, and handles the game logic

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000;

const maxAttempts = 4;
const fs = require('fs'); // For choosing the random word from the filesystem

let attempts = 0;

let guesses = [];

// Generate a random word when the server launches
// TODO: Change this to generate a new word for each game upon wallet transaction
let correctWord = chooseWord();

// #region Setup & CORS
// Define your website's origin
const allowedOrigins = ['http://localhost:3000']; // Add your website's domain here

// CORS options
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
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
app.get('/guess', (req, res) => {
    const guessedWord = req.query.word;

    if (!guessedWord) {
        return res.status(400).send({ error: 'No word provided' });
    }

    // Check if the word is in the word list
    const words = fs.readFileSync('public/assets/five-letter-words.txt', 'utf8').split('\n');
    const fiveLetterWords = words.map(word => word.replace('\r', '')).filter(word => word.length === 5);
    // console.log('Word list:', fiveLetterWords); // Print out the word list
    // console.log('Correct word:', correctWord.toLowerCase()); // Print out the correct word
    console.log('Guessed word:', guessedWord.toLowerCase()); // Print out the guessed word
    if (!fiveLetterWords.includes(guessedWord.toLowerCase())) {
        return res.send({ error: 'This word is not valid!' });
    }


    attempts++

    const result = checkWord(guessedWord.toLowerCase());
    const isWin = guessedWord.toLowerCase() === correctWord;

    // Store the guess and its result
    guesses.push({
        word: guessedWord.toLowerCase(),
        result: result,
        isWin: isWin
    });

    if (attempts >= maxAttempts || isWin) {
        return res.send({
            result, 
            gameOver: true,
            correctWord,
            isWin,
            attemptsLeft: maxAttempts - attempts
        });
    }

    res.send({
        result,
        guesses: guesses, // Send the guesses array in the response
        gameOver: false,
        isWin,
        attemptsLeft: maxAttempts - attempts
    });
});

// Function to generate a random word
function chooseWord() {
    const words = fs.readFileSync('public/assets/five-letter-words.txt', 'utf8').split('\n');
    const fiveLetterWords = words.filter(word => word.trim().replace('\r', '').length === 5);
    return fiveLetterWords[Math.floor(Math.random() * fiveLetterWords.length)].replace('\r', '').toLowerCase();
}

// Function that checks the guessed word based on the input word against the correct word
function checkWord(inputWord) {
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
// #endregion Word Game Main Logic

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});