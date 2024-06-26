// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// This contract manages the game state for "deSypher"
// https://desypher.net/

interface ISypherToken {
    function transfer(address to, uint256 value) external returns (bool);
    function totalSupply() external view returns (uint256);
}

contract GameManager {
    address public owner;
    address public gameContract;
    ISypherToken public sypherToken;

    event AdminTokenWithdraw(address indexed to, uint256 amount);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event MaxSypherCacheUpdated(uint256 newMaxSypherCache);
    event UpdateSypherCacheAndLiquidityPooling(uint256 newCacheAmount, uint256 newLiquidityPoolingAmount);
    event SetGameContract(address indexed _gameContract);
    event SetPlayerReward(address indexed player, uint256 amount);
    event SetSypherCache(uint256 amount);
    event SetLiquidityPooling(uint256 amount);

    // Mappings
    mapping(address => uint256) private playerRewards;
    uint256 private sypherCache;
    uint256 private liquidityPooling;
    uint256 private maxSypherCache;

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
        emit SetGameContract(_gameContract);
    }
    function setReward(address player, uint256 amount) external onlyGameContract {
        playerRewards[player] = amount;
        emit SetPlayerReward(player, amount);
    }
    function setSypherCache(uint256 amount) external onlyGameContract {
        sypherCache = amount;
        emit SetSypherCache(amount);
    }
    function setLiquidityPooling(uint256 amount) external onlyGameContract {
        liquidityPooling = amount;
        emit SetLiquidityPooling(amount);
    }
    function updateSypherCacheAndLiquidityPooling(uint256 newCacheAmount, uint256 newLiquidityPoolingAmount) external onlyGameContract() {
        sypherCache = newCacheAmount;
        liquidityPooling = newLiquidityPoolingAmount;
        emit UpdateSypherCacheAndLiquidityPooling(newCacheAmount, newLiquidityPoolingAmount);
    }
    function setMaxSypherCache(uint256 _newMaxSypherCache) external onlyGameContract() {
        require(_newMaxSypherCache > 0, "Max Sypher Cache must be greater than 0");
        maxSypherCache = _newMaxSypherCache;
        emit MaxSypherCacheUpdated(_newMaxSypherCache);
    }

    // Owner Functions
    function withdrawTokens(address to, uint256 amount) external onlyOwner {
        require(sypherToken.transfer(to, amount), "Transfer failed");
        emit AdminTokenWithdraw(to, amount);
    }
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address: new owner cannot be the zero address");
        owner = newOwner;
        emit OwnershipTransferred(owner, newOwner);
    }
}