let sypherPrice = null; // Declare a top-level variable

async function getWETHPriceInUSD() {
    const apiUrl = `https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        return data.ethereum.usd;
    } catch (error) {
        console.error('Error fetching WETH price from CoinGecko:', error);
        throw error;
    }
}
async function getTokenPriceInWETH() {
    const apiUrl = `https://api.dexscreener.com/latest/dex/tokens/0x21b9d428eb20fa075a29d51813e57bab85406620`;

    console.log("Fetching SYPHER price...");

    try {
        // Make the API request using fetch
        const response = await fetch(apiUrl);
        const data = await response.json(); // Convert response to JSON

        if (data.pairs && data.pairs.length > 0) {
            // Filter to find the pair with WETH as the quote token
            const wethPair = data.pairs.find(pair => pair.quoteToken.symbol === 'WETH');

            if (wethPair) {
                console.log(`Price of the token in WETH: ${wethPair.priceNative}`);
                const wethPriceInUSD = await getWETHPriceInUSD();
                const tokenPriceInUSD = wethPair.priceNative * wethPriceInUSD;
                sypherPrice = tokenPriceInUSD; // Update the top-level variable
                document.getElementById('token-price').innerText = `SYPHER: $${tokenPriceInUSD.toFixed(2)}`;
                return tokenPriceInUSD;
            } else {
                console.log("No WETH pair found for this token.");
                return null;
            }
        } else {
            console.log("No pairs found for this token.");
            return null;
        }
    } catch (error) {
        console.error('Error fetching token price from DEX Screener:', error);
        throw error;
    }
}

getTokenPriceInWETH();
setInterval(getTokenPriceInWETH, 320000);