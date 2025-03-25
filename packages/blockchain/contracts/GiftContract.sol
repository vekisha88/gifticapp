// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Define our own interface instead of relying on Chainlink
interface IAutomationCompatible {
    function checkUpkeep(bytes calldata checkData) external view returns (bool upkeepNeeded, bytes memory performData);
    function performUpkeep(bytes calldata performData) external;
}

contract GiftContract is ReentrancyGuard, IAutomationCompatible {
    struct Gift {
        uint256 giftAmount;  // The gift amount (what receiver gets)
        uint256 unlockTimestamp; // When the gift can be claimed
        uint256 totalRequired;   // Total amount required (giftAmount + feeAmount)
        bool isClaimed;          // If the gift has been claimed
        address tokenAddress;    // Token address (address(0) for native token)
    }

    address public immutable ownerAddress;
    address public charityWallet;
    address public companyWallet;
    mapping(address => Gift) public gifts; // Maps recipient wallet to Gift
    mapping(address => bool) public approvedTokens;

    event FundsLocked(
        address indexed paymentWallet,
        address indexed tokenAddress,
        uint256 giftAmount,
        address recipientWallet,
        uint256 unlockTimestamp
    );
    event FundsSentToCharity(
        address indexed sender,
        address indexed tokenAddress,
        uint256 amount,
        string reason
    );
    event GiftClaimed(address indexed recipientWallet);
    event FundsTransferred(
        address indexed paymentWallet,
        address indexed tokenAddress,
        uint256 amount,
        address recipientWallet
    );
    event TokenApproved(address indexed tokenAddress, bool approved);

    constructor() {
        ownerAddress = msg.sender;
        // Use default addresses for local testing
        charityWallet = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC;
        companyWallet = 0x90F79bf6EB2c4f870365E785982E1f101E93b906;
        // Approve native token
        approvedTokens[address(0)] = true; // MATIC/ETH
    }

    modifier onlyOwner() {
        require(msg.sender == ownerAddress, "Only owner");
        _;
    }

    function setCharityWallet(address newCharityWallet) external onlyOwner {
        require(newCharityWallet != address(0), "Invalid address");
        charityWallet = newCharityWallet;
    }

    function setCompanyWallet(address newCompanyWallet) external onlyOwner {
        require(newCompanyWallet != address(0), "Invalid address");
        companyWallet = newCompanyWallet;
    }

    function approveToken(address tokenToApprove, bool isApproved) external onlyOwner {
        approvedTokens[tokenToApprove] = isApproved;
        emit TokenApproved(tokenToApprove, isApproved);
    }

    function lockFunds(
        address tokenAddress,
        uint256 giftAmount,
        address recipientWallet,
        uint256 unlockTimestamp
    ) external payable {
        require(recipientWallet != address(0), "Invalid recipient address");
        require(unlockTimestamp > block.timestamp, "Unlock date in past");
        
        // For native currency (ETH/MATIC)
        if (tokenAddress == address(0)) {
            require(msg.value > 0, "Zero amount");
            giftAmount = msg.value; // For native currency, gift amount is msg.value
        } else {
            // For ERC20 tokens
            require(giftAmount > 0, "Zero amount");
            require(approvedTokens[tokenAddress], "Token not approved");
            require(msg.value == 0, "ETH sent with token function");
        }
        
        // Check if the wallet already has an existing gift
        Gift storage existingGift = gifts[recipientWallet];
        
        // If the gift is already claimed, we just add funds
        if (existingGift.isClaimed && existingGift.tokenAddress == tokenAddress) {
            existingGift.giftAmount += giftAmount;
            
            // For ERC20 tokens, transfer the tokens
            if (tokenAddress != address(0)) {
                IERC20(tokenAddress).transferFrom(msg.sender, address(this), giftAmount);
            }
            
            emit FundsLocked(
                msg.sender,
                tokenAddress,
                giftAmount,
                recipientWallet,
                existingGift.unlockTimestamp
            );
            return;
        }
        
        // For new gifts
        if (existingGift.giftAmount == 0) {
            // Create the new gift
            gifts[recipientWallet] = Gift({
                giftAmount: giftAmount,
                unlockTimestamp: unlockTimestamp,
                totalRequired: giftAmount,
                isClaimed: false,
                tokenAddress: tokenAddress
            });
            
            // For ERC20 tokens, transfer the tokens
            if (tokenAddress != address(0)) {
                IERC20(tokenAddress).transferFrom(msg.sender, address(this), giftAmount);
            }
            
            emit FundsLocked(
                msg.sender,
                tokenAddress,
                giftAmount,
                recipientWallet,
                unlockTimestamp
            );
            return;
        }
        
        // If we reach here, the wallet has an existing gift but payment isn't completed
        
        // Check token match
        if (existingGift.tokenAddress != tokenAddress) {
            // Wrong currency
            if (tokenAddress == address(0)) {
                // If trying to send native currency but gift is for a token
                _sendToCharity(msg.value, address(0), "Wrong currency");
            } else {
                // If trying to send a token but gift is for native currency or different token
                IERC20(tokenAddress).transferFrom(msg.sender, charityWallet, giftAmount);
                emit FundsSentToCharity(
                    msg.sender,
                    tokenAddress,
                    giftAmount,
                    "Wrong currency"
                );
            }
            return;
        }
        
        // Check if payment amount is correct
        if (giftAmount < existingGift.totalRequired) {
            // Underpayment - send to charity
            if (tokenAddress == address(0)) {
                _sendToCharity(msg.value, address(0), "Underpayment");
            } else {
                IERC20(tokenAddress).transferFrom(msg.sender, charityWallet, giftAmount);
                emit FundsSentToCharity(
                    msg.sender,
                    tokenAddress,
                    giftAmount,
                    "Underpayment"
                );
            }
            return;
        }
        
        // If payment is equal or greater than required, accept it
        // Update the existing gift
        existingGift.giftAmount = giftAmount;
        
        // For ERC20 tokens, transfer the tokens
        if (tokenAddress != address(0)) {
            IERC20(tokenAddress).transferFrom(msg.sender, address(this), giftAmount);
        }
        
        emit FundsLocked(
            msg.sender,
            tokenAddress,
            giftAmount,
            recipientWallet,
            existingGift.unlockTimestamp
        );
    }

    function _sendToCharity(uint256 amountToSend, address tokenToSend, string memory reason) private {
        if (tokenToSend == address(0)) {
            (bool success, ) = charityWallet.call{value: amountToSend}("");
            require(success, "Charity payment failed");
        } else {
            require(
                IERC20(tokenToSend).transfer(charityWallet, amountToSend),
                "Charity token transfer failed"
            );
        }
        
        emit FundsSentToCharity(
            msg.sender,
            tokenToSend,
            amountToSend,
            reason
        );
    }

    function batchLockFunds(
        address[] memory tokens,
        uint256[] memory amounts,
        address[] memory recipientWallets,
        uint256[] memory unlockTimestamps
    ) external payable nonReentrant {
        // Validate input arrays
        require(
            tokens.length == amounts.length && 
            amounts.length == recipientWallets.length && 
            recipientWallets.length == unlockTimestamps.length,
            "Array lengths must match"
        );
        
        uint256 totalNativeValue = 0;
        
        // Calculate total native value needed
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] == address(0)) {
                totalNativeValue += amounts[i];
            }
        }
        
        // Verify sufficient native currency was sent
        require(msg.value == totalNativeValue, "Incorrect native currency amount");
        
        uint256 nativeValueUsed = 0;
        
        // Process each gift
        for (uint256 i = 0; i < tokens.length; i++) {
            address tokenAddress = tokens[i];
            uint256 giftAmount = amounts[i];
            address recipientWallet = recipientWallets[i];
            uint256 unlockTimestamp = unlockTimestamps[i];
            
            // Skip invalid entries
            if (recipientWallet == address(0) || unlockTimestamp <= block.timestamp) {
                continue;
            }
            
            // For native currency
            if (tokenAddress == address(0)) {
                uint256 valueToUse = giftAmount;
                nativeValueUsed += valueToUse;
                
                // Create a new call context with the specific amount
                (bool success, ) = address(this).call{value: valueToUse}(
                    abi.encodeWithSelector(
                        this.lockFunds.selector,
                        tokenAddress,
                        valueToUse,
                        recipientWallet,
                        unlockTimestamp
                    )
                );
                require(success, "Batch native currency lock failed");
            } 
            // For ERC20 tokens
            else {
                require(approvedTokens[tokenAddress], "Token not approved");
                
                // Transfer tokens from sender to this contract
                require(
                    IERC20(tokenAddress).transferFrom(msg.sender, address(this), giftAmount),
                    "Token transfer failed"
                );
                
                // Call lockFunds without value
                (bool success, ) = address(this).call(
                    abi.encodeWithSelector(
                        this.lockFunds.selector,
                        tokenAddress,
                        giftAmount,
                        recipientWallet,
                        unlockTimestamp
                    )
                );
                require(success, "Batch token lock failed");
            }
        }
        
        // Ensure all native currency was used
        require(nativeValueUsed == totalNativeValue, "Not all native currency was used");
    }

    function claimGift(address walletToClaim) external {
        address wallet = walletToClaim == address(0) ? msg.sender : walletToClaim;
        
        // Only the contract owner can claim on behalf of someone else
        if (walletToClaim != address(0)) {
            require(msg.sender == ownerAddress, "Only contract owner can claim for others");
        }
        
        Gift storage giftToUpdate = gifts[wallet];
        require(giftToUpdate.giftAmount > 0, "Gift does not exist");
        require(!giftToUpdate.isClaimed, "Already claimed");
        giftToUpdate.isClaimed = true;
        emit GiftClaimed(wallet);
    }

    function transferFunds(address recipientWallet) external nonReentrant {
        Gift storage giftToTransfer = gifts[recipientWallet];
        require(giftToTransfer.giftAmount > 0, "Gift does not exist");
        require(giftToTransfer.isClaimed, "Not claimed");
        require(block.timestamp >= giftToTransfer.unlockTimestamp, "Unlock date not reached");

        uint256 amountToTransfer = giftToTransfer.giftAmount;
        address tokenToTransfer = giftToTransfer.tokenAddress;
        giftToTransfer.giftAmount = 0;

        if (tokenToTransfer == address(0)) {
            (bool success, ) = recipientWallet.call{value: amountToTransfer}("");
            require(success, "MATIC transfer failed");
        } else {
            require(
                IERC20(tokenToTransfer).transfer(recipientWallet, amountToTransfer),
                "Token transfer failed"
            );
        }
        emit FundsTransferred(msg.sender, tokenToTransfer, amountToTransfer, recipientWallet);
    }

    function getGift(address recipientWallet) external view returns (
        uint256 giftAmount,
        uint256 unlockTimestamp,
        uint256 totalRequired,
        bool isClaimed,
        address tokenAddress
    ) {
        Gift memory gift = gifts[recipientWallet];
        return (
            gift.giftAmount,
            gift.unlockTimestamp,
            gift.totalRequired,
            gift.isClaimed,
            gift.tokenAddress
        );
    }

    // Chainlink Keeper functions for automated fund release
    function checkUpkeep(bytes calldata /* checkData */) external view override returns (bool upkeepNeeded, bytes memory performData) {
        address[] memory eligibleWallets = new address[](20); // Limit batch size
        uint256 count = 0;

        // We can't iterate through all addresses, so we'll check gifts that have been registered
        // in a more efficient way in a real implementation
        // For now, let's check a few hardcoded test addresses
        address[3] memory testAddresses = [
            0x70997970C51812dc3A010C7d01b50e0d17dc79C8,
            0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC,
            0x90F79bf6EB2c4f870365E785982E1f101E93b906
        ];
        
        for (uint256 i = 0; i < testAddresses.length; i++) {
            address recipient = testAddresses[i];
            if (count >= 20) break; // Limit to prevent out-of-gas errors
            
            Gift storage gift = gifts[recipient];
            
            // Check if gift exists, is claimed, and unlock time has passed
            if (gift.giftAmount > 0 && 
                gift.isClaimed && 
                gift.unlockTimestamp <= block.timestamp) {
                eligibleWallets[count] = recipient;
                count++;
            }
        }
        
        // Prepare performData with eligible wallets
        if (count > 0) {
            address[] memory resultWallets = new address[](count);
            for (uint256 i = 0; i < count; i++) {
                resultWallets[i] = eligibleWallets[i];
            }
            
            upkeepNeeded = true;
            performData = abi.encode(resultWallets);
        } else {
            upkeepNeeded = false;
            performData = "";
        }
    }

    function performUpkeep(bytes calldata performData) external override {
        address[] memory walletsToProcess = abi.decode(performData, (address[]));
        
        for (uint256 i = 0; i < walletsToProcess.length; i++) {
            address recipient = walletsToProcess[i];
            Gift storage gift = gifts[recipient];
            
            // Double-check conditions before processing
            if (gift.giftAmount > 0 && 
                gift.isClaimed && 
                gift.unlockTimestamp <= block.timestamp) {
                
                // Transfer funds to recipient
                if (gift.tokenAddress == address(0)) {
                    // Native currency
                    (bool success, ) = recipient.call{value: gift.giftAmount}("");
                    if (success) {
                        emit FundsTransferred(
                            address(this),
                            gift.tokenAddress,
                            gift.giftAmount,
                            recipient
                        );
                        
                        // Reset gift amount to mark as processed
                        gift.giftAmount = 0;
                    }
                } else {
                    // ERC20 token
                    bool success = IERC20(gift.tokenAddress).transfer(recipient, gift.giftAmount);
                    if (success) {
                        emit FundsTransferred(
                            address(this),
                            gift.tokenAddress,
                            gift.giftAmount,
                            recipient
                        );
                        
                        // Reset gift amount to mark as processed
                        gift.giftAmount = 0;
                    }
                }
            }
        }
    }

    // Add a new function to get gift details for a recipient
    function getGiftsByRecipient(address recipientWallet) external view returns (
        uint256 giftAmount,
        uint256 unlockTimestamp,
        bool isClaimed,
        address tokenAddress
    ) {
        Gift memory gift = gifts[recipientWallet];
        return (
            gift.giftAmount,
            gift.unlockTimestamp,
            gift.isClaimed,
            gift.tokenAddress
        );
    }
}
