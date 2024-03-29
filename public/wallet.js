const address = ""; // Contract address

const abi = // Contract ABI list

document.addEventListener('DOMContentLoaded', function(event) {
    if (window.ethereum) {
        ethereum.request({ method: 'eth_requestAccounts' })
        .then(() => document.getElementById("count").click())
        .catch((error) => console.error(error.message));

            ethereum.on("chainChanged", () => window.location.reload());

            ethereum.on("accountsChanged", (accounts) => {
                if (accounts.length > 0) {
                    console.log(`Using account ${accounts[0]}`);
                    window.location.reload();
                }
                else {
                    console.error("0 accounts available!");
                }
            });

            ethereum.on("message", (message) => console.log(message));

            ethereum.on("connect", (connectInfo) => {
                console.log(`Connected to ${connectInfo.chainId} network`);
            });

            ethereum.on("disconnect", (error) => {
                console.error(`Disconnected from the network: ${error.reason}`);
            });

            const provider = new ethers.providers.Web3Provider(window.ethereum);

            const signer = provider.getSigner();

            const contract = new ethers.Contract(address, abi, signer);
        }
        else {
            console.error("Please install MetaMask!");
    }
});