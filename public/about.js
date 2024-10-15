function installMetamask() {
    window.open('https://metamask.io/', '_blank');
}
function installCoinbaseWallet() {
    window.open('https://wallet.coinbase.com/', '_blank');
}
function installRabby() {
    window.open('https://rabby.io/', '_blank');
}
function installRainbow() {
    wubdow.open('https://rainbow.me/', '_blank');
}
function installZerion() {
    window.open('https://zerion.io/', '_blank');
}
function installTrust() {
    window.open('https://trustwallet.com/', '_blank');
}
function openUniswap() {
    window.open('https://app.uniswap.org/#/swap?outputCurrency=0x21b9D428EB20FA075A29d51813E57BAb85406620', '_blank');
}
// Hover and click functionality for roadmap information reveal
document.querySelectorAll('.roadmap-item-container').forEach(function(container) {
    let typingTimer;
    let isTyping = false;
    let clickConfirmed = false; // State to track if text was confirmed by a click

    function typeOutDescription(element, text, speed) {
        if (isTyping) return;
        isTyping = true;
        element.style.visibility = 'visible'; // Ensure visibility
        element.style.opacity = 1; // Ensure full opacity
        element.innerHTML = ''; // Clear previous content to start fresh
        let visibleContent = '';
        let tag = false;
        let i = 0;

        function typeWriter() {
            if (i < text.length) {
                const char = text.charAt(i);
                if (char === '<') tag = true;
                if (!tag) {
                    visibleContent += char;
                } else {
                    visibleContent += char;
                    if (char === '>') tag = false;
                }
                element.innerHTML = visibleContent;
                i++;
                typingTimer = setTimeout(typeWriter, tag ? 0 : speed); // Continue typing
            } else {
                isTyping = false; // Reset typing flag when finished
            }
        }
        typeWriter();
    }
    function getTextContentExcludingChildren(element) {
        return Array.from(element.childNodes).filter(e => e.nodeType === Node.TEXT_NODE).map(e => e.textContent).join("");
    }
    function setDescriptionText(container) {
        const description = container.querySelector('.roadmap-item-description');
        const title = container.querySelector('h3');
        title.style.color = '#2dc60e';
        let titleText = getTextContentExcludingChildren(title);
        let textContent = '';
    
        switch (titleText.trim()) {
            case "$SYPHER Launch":
                textContent = "$SYPHER launched on April 28th, 2024 with a total supply of 1,000,000 tokens. Liquidity was added 24 hours later on April 29th, 2024. More information can be found on the <a href='/tokenomics.html' class='link'>tokenomics page <i class='fa-solid fa-arrow-up-right-from-square link'></i></a>.";
                break;
            case "deSypher Launch":
                textContent = "deSypher is currently live on Mainnet! Please navigate to the homepage to play the game. Or, join the <a href='https://t.me/tukyogames' class='link'>telegram <i class='fa-solid fa-arrow-up-right-from-square link'></i></a> to chat about the game and future developments.";
                break;
            case "Optimizations":
                textContent = "After the initial launch, we will be focusing on optimizing the game for a better user experience. This includes bug fixes, performance improvements, and QOL upgrades.";
                break;
            case "Game Modes":
                textContent = "We have plans to introduce new game modes to keep the game fresh and exciting. More information will be revealed in the coming weeks.";
                break;
            case "Token Updates":
                textContent = "There are multiple use-case improvements planned for $SYPHER. The first improvement will be an innovative mechanism introduced that allows players to earn rewards based on game outcomes, contributing to the overall stability of the game's reward system.";
                break;
            case "More Games??":
                textContent = "At Tukyo Games we prioritize player experience foremost, and see crypto as a tool to make that possible. Currently in development, we are already working on Super G.I.M.P. Girl and have plans to release more games in the future.";
                break;
        }

        if (!clickConfirmed && !isTyping) { // Only type out if not already confirmed by click and not currently typing
            typeOutDescription(description, textContent, 25);
        }
    }
    container.addEventListener('mouseenter', function() {
        setDescriptionText(container);
    });
    container.addEventListener('mouseleave', function() {
        const description = container.querySelector('.roadmap-item-description');
        const title = container.querySelector('h3');
        if (!clickConfirmed) {
            clearTimeout(typingTimer);
            description.innerHTML = "";
            description.style.visibility = 'hidden';
            description.style.opacity = 0;
            title.style.color = '';
            isTyping = false;
        }
    });
    container.addEventListener('click', function() {
        const description = container.querySelector('.roadmap-item-description');
        const title = container.querySelector('h3');
        if (clickConfirmed) {
            clickConfirmed = false; // Allow text to be cleared on mouse leave
            clearTimeout(typingTimer);
            description.innerHTML = '';
            description.style.visibility = 'hidden';
            description.style.opacity = 0;
            title.style.color = '';
            isTyping = false; // Stop typing immediately
        } else {
            clickConfirmed = true; // Confirm text, prevent it from being cleared on mouse leave
        }
    });
});

// #region Email Copy Section
document.addEventListener('DOMContentLoaded', function () {
    const emailSpan = document.querySelector('.link'); // Adjust to target the span with the email address
    const confirmTime = 2000; // Time until the copy icon changes back from a checkmark to a copy icon

    emailSpan.addEventListener('click', function () {
        const emailAddress = emailSpan.textContent.trim(); // Get the email text content
        navigator.clipboard.writeText(emailAddress).then(function () {
            console.log('Copying to clipboard was successful!');

            // Change the icon within the span to a check mark
            const copyIcon = emailSpan.querySelector('i');
            copyIcon.className = 'fa-solid fa-check';

            // Change the icon back to copy after confirmTime milliseconds
            setTimeout(function () {
                copyIcon.className = 'fa-regular fa-copy';
            }, confirmTime);
        }, function (err) {
            console.error('Could not copy text: ', err);
        });
    });
});
// #endregion Email Copy Section