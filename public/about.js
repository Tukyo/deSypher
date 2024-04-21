function installMetamask() {
    window.open('https://metamask.io/', '_blank');
}
function installCoinbaseWallet() {
    window.open('https://wallet.coinbase.com/', '_blank');
}
function installRabby() {
    window.open('https://rabby.io/', '_blank');
}
function openUniswap() {
    window.open('https://app.uniswap.org/#/swap', '_blank');
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

    function setDescriptionText(container) {
        const description = container.querySelector('.roadmap-item-description');
        const title = container.querySelector('h3');
        title.style.color = '#2dc60e';
        let textContent = '';

        switch (title.textContent) {
            case "$SYPHER Launch":
                textContent = "$SYPHER was initially launched on [DATE] with a total supply of 1,000,000 tokens. More information can be found on the <a href='/tokenomics.html' class='roadmap-link'>tokenomics page</a> <i class='fa-solid fa-arrow-up-right-from-square roadmap-link'></i>.";
                break;
            case "deSypher Launch":
                textContent = "deSypher will be launching shortly after the token. It is currently undergoing beta testing. If you are interested in trying the game on testnet, please reach out on telegram.";
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
                textContent = "At Tukyo Games we priotize player experience foremost, and see crypto as a tool to make that possible. Currently in development, we are already working on Super G.I.M.P. Girl and have plans to release more games in the future.";
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

