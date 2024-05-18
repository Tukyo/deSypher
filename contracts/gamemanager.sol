// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ISypherToken {
    function transfer(address to, uint256 value) external returns (bool);
    function totalSupply() external view returns (uint256);
}

contract GameManager {
    address private owner;
    address private gameContract;
    ISypherToken private sypherToken;

    event AdminTokenWithdraw(address indexed to, uint256 amount);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event MaxSypherCacheUpdated(uint256 newMaxSypherCache);

    // Mappings
    mapping(address => uint256) private playerRewards;
    uint256 private sypherCache;
    uint256 private liquidityPooling;
    uint256 private maxSypherCache;
    uint256 private masterSypherCache;

    constructor(address tokenAddress) {
        owner = msg.sender;
        sypherToken = ISypherToken(tokenAddress);
        uint256 totalSupply = sypherToken.totalSupply();
        maxSypherCache = totalSupply / 100; 
    }

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized: caller is not the owner");
        _;
    }
    modifier onlyGameContract() {
        require(msg.sender == gameContract || msg.sender == owner, "Not authorized: caller is not the game contract nor owner");
        _;
    }

    // Functions
    function getReward(address player) external view returns (uint256) {
        return playerRewards[player];
    }
    function getSypherCache() external view returns (uint256) {
        return sypherCache;
    }
    function getLiquidityPooling() external view returns (uint256) {
        return liquidityPooling;
    }
    function getMaxSypherCache() external view returns (uint256) {
        return maxSypherCache;
    }
    function getGameData() public view returns (uint256 sypherCacheAmount, uint256 liquidityPoolAmount, uint256 maxCache) {
        sypherCacheAmount = sypherCache;
        liquidityPoolAmount = liquidityPooling;
        maxCache = maxSypherCache;
    }

    // Admin Functions
    function setGameContract(address _gameContract) external onlyGameContract {
        gameContract = _gameContract;
    }
    function setReward(address player, uint256 amount) external onlyGameContract {
        playerRewards[player] = amount;
    }
    function setSypherCache(uint256 amount) external onlyGameContract {
        sypherCache = amount;
    }
    function setLiquidityPooling(uint256 amount) external onlyGameContract {
        liquidityPooling = amount;
    }
    function updateSypherCacheAndLiquidityPooling(uint256 newCacheAmount, uint256 newLiquidityPoolingAmount) external onlyGameContract() {
        sypherCache = newCacheAmount;
        liquidityPooling = newLiquidityPoolingAmount;
    }
    function setMaxSypherCache(uint256 _newMaxSypherCache) external onlyGameContract() {
        require(_newMaxSypherCache > 0, "Max Sypher Cache must be greater than 0");
        maxSypherCache = _newMaxSypherCache;
        emit MaxSypherCacheUpdated(_newMaxSypherCache);
    }

    // Owner Functions
    function WithdrawTokens(address to, uint256 amount) external onlyOwner {
        require(sypherToken.transfer(to, amount), "Transfer failed");
        emit AdminTokenWithdraw(to, amount);
    }
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address: new owner cannot be the zero address");
        owner = newOwner;
        emit OwnershipTransferred(owner, newOwner);
    }
}