const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000;

let attempts = 0;
const maxAttempts = 3;
const correctWord = "tokyo";

/* #region Setup & CORS */
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
/* #endregion Setup & CORS */

// Backend function call with CORS applied only to this route
app.get('/guess', (req, res) => {
    console.log(req.query.word);
    const guessedWord = req.query.word;

    if (!guessedWord) {
        return res.status(400).send({ error: 'No word provided' });
    }
    attempts++

    
    const result = checkWord(guessedWord.toLowerCase());

    if (attempts >= maxAttempts || guessedWord.toLowerCase() == correctWord) {
        res.send({
            result, 
            gameOver: true,
            correctWord,
            isWin: guessedWord.toLowerCase() == correctWord,
            attemptsLeft: maxAttempts - attempts
        })
    }
    res.send({ result, gameOver: false, isWin:  guessedWord.toLowerCase() == correctWord.toLowerCase(),  attemptsLeft: maxAttempts - attempts });
});

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
        if (result[index].status !== 'correct' && targetLetters.includes(letter)) {
            // Find the letter in the target, preferring incorrect positions first
            let targetIndex = targetLetters.findIndex((tl, ti) => tl === letter && ti !== index);
            if (targetIndex === -1) {
                targetIndex = targetLetters.findIndex((tl) => tl === letter);
            }

            if (targetIndex !== -1) {
                result[index].status = 'misplaced';
                targetLetters[targetIndex] = null; // Mark this target letter as used
            }
        }
    });

    // Final pass to update any remaining letters to 'incorrect' if not already marked
    result.forEach((res, index) => {
        if (res.status === 'incorrect' && correctWord.includes(inputLetters[index])) {
            // This handles the case for duplicate letters where one is correct, and others are not
            res.status = 'misplaced';
        } 
    });

    return result;
}


app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});
