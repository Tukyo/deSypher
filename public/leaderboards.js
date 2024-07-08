const mainnetProvider = new ethers.providers.JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/tbG9Ls0pfxJL1IGYyoi-eB0AMcgbjc-k');

document.addEventListener("DOMContentLoaded", function () {
    // #region Popular Words
    fetch('/popular-words')
        .then(response => response.json())
        .then(data => {
            const wordsListDiv = document.querySelector(".popular-words-list");
            wordsListDiv.innerHTML = "";

            const list = document.createElement("ol");
            wordsListDiv.appendChild(list);

            data.forEach((wordInfo, index) => {
                // Ignore words with timesGuessed equal to 0
                if (wordInfo.timesGuessed === 0) {
                    return;
                }

                const wordElement = document.createElement("li");
                let placeContent;

                switch (index) {
                    case 0:
                        placeContent = `${wordInfo.word} (guessed ${wordInfo.timesGuessed} times) <span class="leaderboard-icon"><i class="fa-solid fa-trophy"></i></span>`;
                        break;
                    case 1:
                        placeContent = `${wordInfo.word} (guessed ${wordInfo.timesGuessed} times) <span class="leaderboard-icon"><i class="fa-solid fa-medal"></i></span>`;
                        break;
                    case 2:
                        placeContent = `${wordInfo.word} (guessed ${wordInfo.timesGuessed} times) <span class="leaderboard-icon"><i class="fa-solid fa-award"></i></span>`;
                        break;
                    case 3:
                        placeContent = `${wordInfo.word} (guessed ${wordInfo.timesGuessed} times)`;
                        break;
                    case 4:
                        placeContent = `${wordInfo.word} (guessed ${wordInfo.timesGuessed} times)`;
                        break;
                }

                wordElement.innerHTML = placeContent;
                list.appendChild(wordElement);
            });
        })
        .catch(error => {
            console.error("Error fetching popular words from server:", error);
        });
    // #endregion Popular Words

    // #region Top Players
    fetch('/top-players')
        .then(response => response.json())
        .then(data => {
            const playersListDiv = document.querySelector(".top-players-list");
            playersListDiv.innerHTML = "";

            const list = document.createElement("ol");
            playersListDiv.appendChild(list);

            data.forEach((player, index) => {
                if (player.wins === 0) {
                    return;
                }
                const playerElement = document.createElement("li");
                const truncatedAddress = `${player.address.substring(0, 6)}...${player.address.substring(player.address.length - 4)}`;
                let playerContent;

                switch (index) {
                    case 0:
                        playerContent = `${truncatedAddress} (total wins: ${player.wins}) <span class="leaderboard-icon"><i class="fa-solid fa-trophy"></i></span>`;
                        playerElement.classList.add("top-player-container");

                        // const img = document.createElement("img");
                        // img.src = "assets/mastersypher_square.webp";
                        // img.id = "master-sypher-leaderboard-icon";
                        // playerElement.appendChild(img);

                        break;
                    case 1:
                        playerContent = `${truncatedAddress} (total wins: ${player.wins}) <span class="leaderboard-icon"><i class="fa-solid fa-medal"></i></span>`;
                        break;
                    case 2:
                        playerContent = `${truncatedAddress} (total wins: ${player.wins}) <span class="leaderboard-icon"><i class="fa-solid fa-award"></i></span>`;
                        break;
                    default:
                        playerContent = `${truncatedAddress} (total wins: ${player.wins})`;
                        break;
                }

                playerElement.innerHTML += playerContent; // Append playerContent to the existing innerHTML
                list.appendChild(playerElement);
            });
        })
        .catch(error => {
            console.error("Error fetching top players from server:", error);
        });
    // #endregion Top Players

    // #region Biggest Winners
    fetch('/biggest-winners')
        .then(response => response.json())
        .then(data => {
            const winnersListDiv = document.querySelector(".biggest-winners-list");
            winnersListDiv.innerHTML = "";

            const list = document.createElement("ol");
            winnersListDiv.appendChild(list);

            // Filter winners and sort in descending order
            const winners = data.filter(winner => winner.totalNetWin > 0).sort((a, b) => b.totalNetWin - a.totalNetWin);

            winners.forEach((winner, index) => {
                if (winner.playerAddress !== undefined) {
                    const winnerElement = document.createElement("li");
                    const truncatedAddress = `${winner.playerAddress.substring(0, 6)}...${winner.playerAddress.substring(winner.playerAddress.length - 4)}`;
                    let winnerContent;

                    switch (index) {
                        case 0:
                            winnerContent = `${truncatedAddress} (${winner.totalNetWin} SYPHER) <span class="leaderboard-icon"><i class="fa-solid fa-trophy"></i></span>`;
                            break;
                        case 1:
                            winnerContent = `${truncatedAddress} (${winner.totalNetWin} SYPHER) <span class="leaderboard-icon"><i class="fa-solid fa-medal"></i></span>`;
                            break;
                        case 2:
                            winnerContent = `${truncatedAddress} (${winner.totalNetWin} SYPHER) <span class="leaderboard-icon"><i class="fa-solid fa-award"></i></span>`;
                            break;
                        default:
                            winnerContent = `${truncatedAddress} (${winner.totalNetWin} SYPHER)`;
                            break;
                    }

                    winnerElement.innerHTML = winnerContent;
                    list.appendChild(winnerElement);
                }
            });
        })
        .catch(error => {
            console.error("Error fetching biggest winners from server:", error);
        });
    // #endregion Biggest Winners

    // #region Biggest Losers
    fetch('/biggest-winners')
        .then(response => response.json())
        .then(data => {
            const losersListDiv = document.querySelector(".biggest-losers-list");
            losersListDiv.innerHTML = "";

            const list = document.createElement("ol");
            losersListDiv.appendChild(list);

            // Filter losers and sort in ascending order
            const losers = data.filter(winner => winner.totalNetWin < 0).sort((a, b) => a.totalNetWin - b.totalNetWin);

            losers.forEach((loser, index) => {
                if (loser.playerAddress !== undefined) {
                    const loserElement = document.createElement("li");
                    const truncatedAddress = `${loser.playerAddress.substring(0, 6)}...${loser.playerAddress.substring(loser.playerAddress.length - 4)}`;
                    let loserContent;

                    switch (index) {
                        case 0:
                            loserContent = `${truncatedAddress} (${loser.totalNetWin} SYPHER) <span class="leaderboard-icon"><i class="fa-solid fa-trophy"></i></span>`;
                            break;
                        case 1:
                            loserContent = `${truncatedAddress} (${loser.totalNetWin} SYPHER) <span class="leaderboard-icon"><i class="fa-solid fa-medal"></i></span>`;
                            break;
                        case 2:
                            loserContent = `${truncatedAddress} (${loser.totalNetWin} SYPHER) <span class="leaderboard-icon"><i class="fa-solid fa-award"></i></span>`;
                            break;
                        default:
                            loserContent = `${truncatedAddress} (${loser.totalNetWin} SYPHER)`;
                            break;
                    }

                    loserElement.innerHTML = loserContent;
                    list.appendChild(loserElement);
                }
            });
        })
        .catch(error => {
            console.error("Error fetching biggest winners from server:", error);
        });
    // #endregion Biggest Losers
});