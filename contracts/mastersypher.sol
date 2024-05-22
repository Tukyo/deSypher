// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MasterSypher {
    address public admin;
    address public topPlayer;
    uint256 public constant tokenId = 1;
    uint256 public constant totalSupply = 1;

    string public constant name = "MasterSypher";
    string public constant symbol = "MSPHR";

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event AdminUpdated(address indexed newAdmin);
    event EtherWithdrawn(address indexed recipient, uint256 amount);

    constructor() {
        admin = msg.sender;
        topPlayer = msg.sender;
        emit Transfer(address(0), msg.sender, tokenId);
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only the admin can perform this action.");
        _;
    }

    // Functions
    function getTopPlayer(uint256 _tokenId) public view returns (address) {
        require(_tokenId == tokenId, "This token does not exist.");
        return topPlayer;
    }
    function getTotalSupply() public pure returns (uint256) {
        return totalSupply;
    }
    function tokenURI(uint256 _tokenId) public pure returns (string memory) {
        require(_tokenId == tokenId, "This token does not exist.");
        return "https://desypher.net/mastersypher.json";
    }

    // Admin Functions
    function updateAdmin(address newAdmin) public onlyAdmin {
        require(newAdmin != address(0), "Cannot transfer to the zero address.");
        admin = newAdmin;
        emit AdminUpdated(newAdmin);
    }
    function transferFrom(address from, address to, uint256 _tokenId) public onlyAdmin {
        require(_tokenId == tokenId, "This token does not exist.");
        require(from == topPlayer, "Not the owner of the token");
        require(to != address(0), "Cannot transfer to the zero address");

        emit Transfer(from, to, tokenId);
        topPlayer = to;
    }
    function withdrawETH() public onlyAdmin {
        uint256 balance = address(this).balance;
        payable(admin).transfer(balance);
        emit EtherWithdrawn(admin, balance);
    }
}