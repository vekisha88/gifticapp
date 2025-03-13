const { ethers } = require("hardhat");

// Hardcoded for local testing; update for testnet later if needed
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // From your Hardhat deployment
const GIFT_CONTRACT_ABI = require("../artifacts/contracts/GiftContract.sol/GiftContract.json").abi;

async function simulatePayment(giftCode, targetWallet, totalAmount, unlockDate) {
  try {
    // Get the first Hardhat signer (default account with 10000 ETH locally)
    const [signer] = await ethers.getSigners();
    console.log("Using signer address:", signer.address);

    // Connect to Hardhat's local node
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const contract = new ethers.Contract(CONTRACT_ADDRESS, GIFT_CONTRACT_ABI, signer.connect(provider));

    // Encode giftCode as bytes32
    const giftCodeBytes32 = ethers.encodeBytes32String(giftCode);
    console.log("Simulating payment for giftCode:", giftCode);

    // Use the provided targetWallet (paymentAddress from backend)
    console.log("Target wallet (paymentAddress):", targetWallet);

    // Convert unlockDate to Unix timestamp (assuming unlockDate is ISO string, e.g., "2025-02-26T18:00:00Z")
    const unlockTimestamp = Math.floor(new Date(unlockDate).getTime() / 1000);
    console.log("Unlock date set to:", new Date(unlockTimestamp * 1000).toISOString());

    // Convert totalAmount to wei (assuming totalAmount is a number or string like "1.05")
    const amountInWei = ethers.parseEther(totalAmount.toString());
    console.log("Sending amount (in wei):", amountInWei.toString());

    // Check signer balance
    const balance = await provider.getBalance(signer.address);
    console.log("Signer balance:", ethers.formatEther(balance), "ETH");
    if (balance < amountInWei) {
      throw new Error("Insufficient funds in signer account for the transaction.");
    }

    // Execute the lockMatic transaction
    console.log("Sending transaction to lock MATIC for gift...");
    const tx = await contract.lockMatic(giftCodeBytes32, targetWallet, unlockTimestamp, {
      value: amountInWei,
      gasLimit: 200000, // Adjustable for local testing
    });
    console.log("Transaction sent. Hash:", tx.hash, "Waiting for confirmation...");

    const receipt = await tx.wait();
    console.log("Payment simulation completed. Transaction confirmed.");
    console.log("Block number:", receipt.blockNumber, "Gas used:", receipt.gasUsed.toString());
  } catch (error) {
    console.error("❌ Payment simulation failed:", error.message);
    throw error;
  }
}

// Example usage (replace with actual values from your backend response)
const giftCode = "GIFT-CA0630B1"; // From /api/gift/create response
const targetWallet = "0xbf70FC8Bc1aB4cB26668B48b1c71e078dd9d347A"; // From paymentAddress
const totalAmount = "1.05"; // From totalAmount in response
const unlockDate = "2025-02-26T18:00:00Z"; // From unlockDate in response

simulatePayment(giftCode, targetWallet, totalAmount, unlockDate)
  .then(() => {
    console.log("✅ Simulation complete.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script execution failed:", error);
    process.exit(1);
  });