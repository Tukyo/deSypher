// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IMasterSypher {
    function getTopPlayer(uint256 _tokenId) external view returns (address);
}
interface ISypherToken {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function transfer(address to, uint256 value) external returns (bool);
    function totalSupply() external view returns (uint256);
}
interface IGameManager {
    function getReward(address player) external view returns (uint256);
    function setReward(address player, uint256 amount) external;
    function getSypherCache() external view returns (uint256);
    function setSypherCache(uint256 amount) external;
    function getMaxSypherCache() external view returns (uint256);
    function setMaxSypherCache(uint256 amount) external;
    function getLiquidityPooling() external view returns (uint256);
    function setLiquidityPooling(uint256 amount) external;
    function updateSypherCacheAndLiquidityPooling(uint256 newCacheAmount, uint256 newLiquidityPoolingAmount) external;
}

contract deSypher {
    ISypherToken public sypherToken;
    IGameManager public gameManager;
    IMasterSypher public masterSypher;
    address public owner;
    uint256 public totalSupply;
    uint256 public maxSypherCache;

    bool private paused = false;

    // Events
    event GameStarted(address indexed player, uint256 sypherAllocation);
    event GameCompleted(address indexed player, bool won, uint256 rewardAmount);
    event RewardsClaimed(address indexed player, uint256 amount);
    event SypherCacheUpdated(uint256 newCacheAmount);
    event LiquidityPoolingUpdated(uint256 newLiquidityAmount);
    event TokensTransferredToTopPlayer(address indexed topPlayer, uint256 amount);
    event MasterSypherAddressUpdated(address indexed newMasterSypherAddress);

    // Admin Events
    event Paused(bool isPaused);
    event LiquidityPoolingWithdrawn(address indexed to, uint256 amount);
    event AdminTokenWithdraw(address indexed to, uint256 amount);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(address _sypherTokenAddress, address _gameManagerAddress, address _masterSypherAddress) {
        owner = msg.sender;
        sypherToken = ISypherToken(_sypherTokenAddress);
        gameManager = IGameManager(_gameManagerAddress);
        masterSypher = IMasterSypher(_masterSypherAddress);
        totalSupply = sypherToken.totalSupply();
        maxSypherCache = gameManager.getMaxSypherCache();
    }

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized: caller is not the owner");
        _;
    }
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    // Functions
    function PlayGame(address player, uint256 sypherAllocation) external whenNotPaused {
        require(
            sypherToken.transferFrom(player, address(this), sypherAllocation),
            "Payment failed"
        );
        emit GameStarted(player, sypherAllocation);
    }
    function ClaimRewards() external {
        uint256 reward = gameManager.getReward(msg.sender);
        require(reward > 0, "No rewards to claim");

        gameManager.setReward(msg.sender, 0);

        require(
            sypherToken.transfer(msg.sender, reward),
            "Reward transfer failed"
        );

        emit RewardsClaimed(msg.sender, reward);
    }
    function getTopPlayer(uint256 _tokenId) external view returns (address) {
        return masterSypher.getTopPlayer(_tokenId);
    }
    function isPaused() public view returns (bool) {
        return paused;
    }

    // Admin Functions
    function CompleteGame(address player, uint256 sypherAllocation, uint256 rewardAmount, bool won) external onlyOwner {
        uint256 cacheAmount = gameManager.getSypherCache();
        uint256 liquidityAmount = gameManager.getLiquidityPooling();
        uint256 currentMaxCache = gameManager.getMaxSypherCache();

        if (!won) {
            address topPlayer = masterSypher.getTopPlayer(1);
            require(topPlayer != address(0), "Invalid top player address");

            uint256 masterSypherAmount = (sypherAllocation * 1) / 100;
            uint256 newLiquidityAmount = (sypherAllocation * 24) / 100;
            uint256 newCacheAmount = (sypherAllocation * 25) / 100;

            gameManager.updateSypherCacheAndLiquidityPooling(cacheAmount + newCacheAmount, liquidityAmount + newLiquidityAmount);

            require(sypherToken.transfer(topPlayer, masterSypherAmount), "Transfer to top player failed");

            emit TokensTransferredToTopPlayer(topPlayer, masterSypherAmount);
            emit SypherCacheUpdated(cacheAmount + newCacheAmount);
            emit LiquidityPoolingUpdated(liquidityAmount + newLiquidityAmount);
            emit GameCompleted(player, false, 0);

            if (cacheAmount + newCacheAmount >= currentMaxCache) {
                uint256 increment = totalSupply / 1000;
                uint256 newMaxCache = currentMaxCache + increment;
                gameManager.setMaxSypherCache(newMaxCache);
                maxSypherCache = newMaxCache;

                uint256 reducedCacheAmount = (cacheAmount + newCacheAmount) / 2;
                gameManager.setSypherCache(reducedCacheAmount);
                emit SypherCacheUpdated(reducedCacheAmount);
            }
        } else {
            uint256 playerReward = gameManager.getReward(player);
            gameManager.setReward(player, playerReward + rewardAmount);
            emit GameCompleted(player, true, rewardAmount);
        }
    }
    function WithdrawTokens(address to, uint256 amount) external onlyOwner {
        require(sypherToken.transfer(to, amount), "Transfer failed");
        emit AdminTokenWithdraw(to, amount);
    }
    function WithdrawLiquidityPooling(address to, uint256 amount) external onlyOwner {
        uint256 liquidityAmount = gameManager.getLiquidityPooling();
        require(amount <= liquidityAmount, "Insufficient liquidity available");

        gameManager.setLiquidityPooling(liquidityAmount - amount);

        require(sypherToken.transfer(to, amount), "Transfer failed");
        emit LiquidityPoolingWithdrawn(to, amount);
    }
    function updateSypherCache(uint256 newCacheAmount) external onlyOwner {
        gameManager.setSypherCache(newCacheAmount);
        emit SypherCacheUpdated(newCacheAmount);
    }
    function updateMasterSypher(address _newMasterSypherAddress) external onlyOwner {
        masterSypher = IMasterSypher(_newMasterSypherAddress);
        emit MasterSypherAddressUpdated(_newMasterSypherAddress);
    }
    function pause() external onlyOwner {
        paused = true;
        emit Paused(true);
    }
    function unpause() external onlyOwner {
        paused = false;
        emit Paused(false);
    }
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "New owner is not a valid address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}