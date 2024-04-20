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
    function setDescriptionText(container) {
        const description = container.querySelector('.roadmap-item-description');
        if (container.querySelector('h3').textContent === "$SYPHER Launch") {
            description.innerHTML = "$SYPHER was initially launched on [DATE] with a total supply of 1,000,000 tokens. More information can be found on the <a href='/tokenomics.html' class='roadmap-link'>tokenomics page </a><i class='fa-solid fa-arrow-up-right-from-square roadmap-link'></i>.";
        } else if (container.querySelector('h3').textContent === "deSypher Launch") {
            description.textContent = "deSypher will be launching shortly after the token. It is currently undergoing beta testing. If you are interested in trying the game on testnet, please reach out on telegram.";
        } else if (container.querySelector('h3').textContent === "Optimizations") {
            description.textContent = "After the initial launch, we will be focusing on optimizing the game for a better user experience. This includes bug fixes, performance improvements, and QOL upgrades.";
        } else if (container.querySelector('h3').textContent === "Game Modes") {
            description.textContent = "We have plans to introduce new game modes to keep the game fresh and exciting. More information will be revealed in the coming weeks.";
        } else if (container.querySelector('h3').textContent === "Token Updates") {
            description.textContent = "There are multiple use-case improvements planned for $SYPHER. The first being a novel staking mechanism that will provide yield for stakers, and stability for the game rewards mechanisms.";
        } else if (container.querySelector('h3').textContent === "Marketing") {
            description.textContent = "We have marketing plans for the community to participate in, and unique approaches to put gameplay in front of new audiences. We are excited to share more about this in the future.";
        }
    }
    container.addEventListener('mouseenter', function() {
        setDescriptionText(container);
    });
    container.addEventListener('mouseleave', function() {
        const description = container.querySelector('.roadmap-item-description');
        description.textContent = ""; // Clear the description when not hovering
    });
    container.addEventListener('click', function() {
        const description = container.querySelector('.roadmap-item-description');
        if (description.style.visibility === 'visible' && description.textContent !== "") {
            description.style.visibility = 'hidden';
            description.style.opacity = 0;
            description.textContent = ''; // Clear the description when closing
        } else {
            setDescriptionText(container);
            description.style.visibility = 'visible';
            description.style.opacity = 1;
        }
    });
});