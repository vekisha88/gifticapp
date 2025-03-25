const hre = require("hardhat");
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  try {
    // Read contract address from file
    const contractAddressFile = path.join(__dirname, "../contractAddress.json");
    const contractAddressData = JSON.parse(fs.readFileSync(contractAddressFile, "utf8"));
    const contractAddress = contractAddressData.contractAddress;
    const charityWallet = contractAddressData.charityWallet;
    const companyWallet = contractAddressData.companyWallet;
    
    console.log("=== Account Balances ===");
    
    // Contract balance
    const contractBalance = await ethers.provider.getBalance(contractAddress);
    console.log(`Contract (${contractAddress}): ${ethers.formatEther(contractBalance)} ETH`);
    
    // Charity wallet balance
    const charityBalance = await ethers.provider.getBalance(charityWallet);
    console.log(`Charity Wallet (${charityWallet}): ${ethers.formatEther(charityBalance)} ETH`);
    
    // Company wallet balance
    const companyBalance = await ethers.provider.getBalance(companyWallet);
    console.log(`Company Wallet (${companyWallet}): ${ethers.formatEther(companyBalance)} ETH`);
    
    // Get the contract ABI and connect to the contract
    const artifactPath = path.join(__dirname, "../artifacts/contracts/GiftContract.sol/GiftContract.json");
    const contractArtifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const contractABI = contractArtifact.abi;
    const contract = new ethers.Contract(contractAddress, contractABI, ethers.provider);
    
    // Check for gifts in wallet wallets from MongoDB
    console.log("\n=== Check for specific gift addresses ===");
    
    // Add addresses of gift wallets you want to check
    const giftWallets = [
      "0x1fdce11c83f54e88d93e9b7321d0cc38e0560cea"
    ];
    
    for (const recipientWallet of giftWallets) {
      try {
        console.log(`\nChecking gift for recipient: ${recipientWallet}`);
        
        // Check wallet balance
        const walletBalance = await ethers.provider.getBalance(recipientWallet);
        console.log(`Wallet balance: ${ethers.formatEther(walletBalance)} ETH`);
        
        const gift = await contract.gifts(recipientWallet);
        
        if (gift.giftAmount == 0) {
          console.log(`No gift found for ${recipientWallet}`);
          continue;
        }
        
        console.log(`Gift amount: ${ethers.formatEther(gift.giftAmount)} ETH`);
        console.log(`Unlock timestamp: ${new Date(Number(gift.unlockTimestamp) * 1000).toLocaleString()}`);
        console.log(`Is claimed: ${gift.isClaimed}`);
        console.log(`Token address: ${gift.tokenAddress}`);
      } catch (error) {
        console.log(`Error checking gift for ${recipientWallet}: ${error.message}`);
      }
    }
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 