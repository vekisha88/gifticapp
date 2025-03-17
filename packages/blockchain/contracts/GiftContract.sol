// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract GiftContract is ReentrancyGuard {
    struct Gift {
        uint256 amount;
        uint256 fee;
        address targetWallet;
        uint256 unlockDate;
        bool claimed;
        address token; // Address(0) for MATIC, otherwise ERC-20 token address
    }

    address public immutable owner;
    uint256 public feePercentage = 5; // 5% fee
    mapping(bytes32 => Gift) public gifts;
    mapping(address => bool) public approvedTokens; // Tracks approved ERC-20 tokens
    mapping(address => uint256) public totalFees; // Fees per token (address(0) for MATIC)

    event FundsLocked(
        bytes32 indexed giftCode,
        address indexed token,
        uint256 amount,
        uint256 fee,
        address targetWallet,
        uint256 unlockDate
    );
    event GiftClaimed(bytes32 indexed giftCode, address targetWallet);
    event FundsTransferred(
        bytes32 indexed giftCode,
        address indexed token,
        uint256 amount,
        address targetWallet
    );
    event FeesWithdrawn(address indexed token, uint256 amount);
    event TokenApproved(address indexed token, bool approved);

    constructor() {
        owner = msg.sender;
        // Approve some initial tokens for local testing (adjust for production)
        approvedTokens[address(0)] = true; // MATIC
        // Add testnet ERC-20 addresses here if needed for local testing
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    function setFeePercentage(uint256 newFeePercentage) external onlyOwner {
        require(newFeePercentage <= 10, "Fee too high");
        feePercentage = newFeePercentage;
    }

    function approveToken(address token, bool approved) external onlyOwner {
        approvedTokens[token] = approved;
        emit TokenApproved(token, approved);
    }

    function lockMatic(
        bytes32 giftCode,
        address targetWallet,
        uint256 unlockDate
    ) external payable {
        require(msg.value > 0, "Zero amount");
        require(unlockDate > block.timestamp, "Unlock date in past");
        require(gifts[giftCode].amount == 0, "Gift exists");

        uint256 fee = (msg.value * feePercentage) / 100;
        uint256 amount = msg.value; // Keep full amount for gift

        gifts[giftCode] = Gift({
            amount: amount,
            fee: fee,
            targetWallet: targetWallet,
            unlockDate: unlockDate,
            claimed: false,
            token: address(0)
        });

        totalFees[address(0)] += fee;
        emit FundsLocked(
            giftCode,
            address(0),
            amount,
            fee,
            targetWallet,
            unlockDate
        );
    }

    function lockToken(
        bytes32 giftCode,
        address token,
        uint256 totalAmount,
        address targetWallet,
        uint256 unlockDate
    ) external {
        require(totalAmount > 0, "Zero amount");
        require(unlockDate > block.timestamp, "Unlock date in past");
        require(gifts[giftCode].amount == 0, "Gift exists");
        require(approvedTokens[token], "Token not approved");

        uint256 fee = (totalAmount * feePercentage) / 100;
        uint256 amount = totalAmount - fee;

        gifts[giftCode] = Gift({
            amount: amount,
            fee: fee,
            targetWallet: targetWallet,
            unlockDate: unlockDate,
            claimed: false,
            token: token
        });

        totalFees[token] += fee;
        IERC20(token).transferFrom(msg.sender, address(this), totalAmount);
        emit FundsLocked(
            giftCode,
            token,
            amount,
            fee,
            targetWallet,
            unlockDate
        );
    }

    function claimGift(bytes32 giftCode) external {
        Gift storage gift = gifts[giftCode];
        require(gift.amount > 0, "Gift does not exist");
        require(!gift.claimed, "Already claimed");
        gift.claimed = true;
        emit GiftClaimed(giftCode, gift.targetWallet);
    }

    function transferFunds(bytes32 giftCode) external nonReentrant {
        Gift storage gift = gifts[giftCode];
        require(gift.amount > 0, "Gift does not exist");
        require(gift.claimed, "Not claimed");
        require(block.timestamp >= gift.unlockDate, "Unlock date not reached");

        uint256 amount = gift.amount;
        address token = gift.token;
        address targetWallet = gift.targetWallet;
        gift.amount = 0;

        if (token == address(0)) {
            (bool success, ) = targetWallet.call{value: amount}("");
            require(success, "MATIC transfer failed");
        } else {
            require(
                IERC20(token).transfer(targetWallet, amount),
                "Token transfer failed"
            );
        }
        emit FundsTransferred(giftCode, token, amount, targetWallet);
    }

    function withdrawFees(address token) external onlyOwner {
        uint256 amount = totalFees[token];
        require(amount > 0, "No fees to withdraw");
        totalFees[token] = 0;

        if (token == address(0)) {
            (bool success, ) = owner.call{value: amount}("");
            require(success, "MATIC withdrawal failed");
        } else {
            require(
                IERC20(token).transfer(owner, amount),
                "Token withdrawal failed"
            );
        }
        emit FeesWithdrawn(token, amount);
    }

    function getTotalFees(address token) external view returns (uint256) {
        return totalFees[token];
    }
}
