// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract FaucetPPT is Ownable, ReentrancyGuard {
    uint256 public constant MAX_WITHDRAW_AMOUNT = 10 * 10**18;
    uint256 public constant REQUEST_GAP_LIMITER = 1 days;
    uint256 public constant MIN_BALANCE_THRESHOLD = 1000 * 10**18;
    
    IERC20 public token;
    struct Contribution {
        address contributor;
        uint256 amount;
    }
    
    Contribution[] public recentContributions;
    mapping(address => uint256) public recentReceivers;
    mapping(address => bool) public blacklist;
    
    event FundsRequested(address indexed receiver, uint256 amount);
    event ContributionMade(address indexed contributor, uint256 amount);
    event BlacklistUpdated(address indexed account, bool blacklisted);
    event MinThresholdReached(uint256 balance);
    
    constructor(address _token) Ownable(msg.sender) {
        require(_token != address(0), "Invalid token address");
        token = IERC20(_token);
    }
    
    function requestFunds(address receiver) external nonReentrant {
        require(!blacklist[msg.sender], "Account has been blacklisted!");
        require(token.balanceOf(address(this)) >= MAX_WITHDRAW_AMOUNT, "Insufficient contract balance");
        
        uint256 currentTime = block.timestamp;
        
        if (recentReceivers[receiver] != 0) {
            require(
                currentTime - recentReceivers[receiver] >= REQUEST_GAP_LIMITER,
                "You have to wait before requesting again!"
            );
        }
        
        recentReceivers[receiver] = currentTime;
        
        bool success = token.transfer(receiver, MAX_WITHDRAW_AMOUNT);
        require(success, "Transfer failed");
        
        emit FundsRequested(receiver, MAX_WITHDRAW_AMOUNT);
        
        if (token.balanceOf(address(this)) < MIN_BALANCE_THRESHOLD) {
            emit MinThresholdReached(token.balanceOf(address(this)));
        }
    }
    
    function addToBlacklist(address account) external onlyOwner {
        blacklist[account] = true;
        emit BlacklistUpdated(account, true);
    }
    
    function batchAddToBlacklist(address[] calldata accounts) external onlyOwner {
        for (uint256 i = 0; i < accounts.length; i++) {
            blacklist[accounts[i]] = true;
            emit BlacklistUpdated(accounts[i], true);
        }
    }
    
    function removeFromBlacklist(address account) external onlyOwner {
        blacklist[account] = false;
        emit BlacklistUpdated(account, false);
    }
    
    function contribute(uint256 amount) external {
        require(amount > 0, "Must send some tokens");
        
        bool success = token.transferFrom(msg.sender, address(this), amount);
        require(success, "Transfer failed");
        
        recentContributions.push(Contribution({
            contributor: msg.sender,
            amount: amount
        }));
        
        if (recentContributions.length > 10) {
            for (uint256 i = 0; i < recentContributions.length - 1; i++) {
                recentContributions[i] = recentContributions[i + 1];
            }
            recentContributions.pop();
        }
        
        emit ContributionMade(msg.sender, amount);
    }
    
    function getRecentContributions() external view returns (Contribution[] memory) {
        return recentContributions;
    }
    
    function withdraw(uint256 amount) external onlyOwner {
        require(amount <= token.balanceOf(address(this)), "Insufficient balance");
        bool success = token.transfer(owner(), amount);
        require(success, "Withdraw failed");
    }
}