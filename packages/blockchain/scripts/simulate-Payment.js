const { ethers } = require("hardhat");

// Hardcoded for local testing; update for testnet later if needed
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // From your Hardhat deployment
const GIFT_CONTRACT_ABI = require("../artifacts/contracts/GiftContract.sol/GiftContract.json").abi;

/**
 * Simulates a payment to the gift contract
 * @param {Object} options - Payment options
 * @param {string} options.walletAddress - Target wallet address to receive the payment
 * @param {string|number} options.amount - Amount to send
 * @param {string} options.currency - Currency type (e.g., 'ETH', 'MATIC')
 */
async function simulatePayment({ walletAddress, amount, currency }) {
  try {
    // Get the first Hardhat signer (default account with 10000 ETH locally)
    const [signer] = await ethers.getSigners();
    console.log("Using signer address:", signer.address);

    // Connect to Hardhat's local node
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const contract = new ethers.Contract(CONTRACT_ADDRESS, GIFT_CONTRACT_ABI, signer.connect(provider));

    // Use the provided walletAddress (paymentAddress from backend)
    console.log("Target wallet:", walletAddress);

    // Convert amount to wei
    const amountInWei = ethers.parseEther(amount.toString());
    console.log("Amount in wei:", amountInWei.toString());

    // Check signer balance
    const balance = await provider.getBalance(signer.address);
    console.log("Signer balance:", ethers.formatEther(balance), currency);
    if (balance < amountInWei) {
      throw new Error("Insufficient funds in signer account for the transaction.");
    }

    // Generate a random gift code
    const randomBytes = ethers.randomBytes(8);
    const giftCode = Buffer.from(randomBytes).toString('hex').toUpperCase();
    const giftCodeBytes32 = ethers.encodeBytes32String(giftCode);
    console.log("Generated gift code:", giftCode);

    // Set unlock date to 1 hour from now
    const unlockDate = Math.floor(Date.now() / 1000) + 3600;
    console.log("Unlock date:", new Date(unlockDate * 1000).toISOString());

    // Execute the transaction
    console.log("Sending transaction...");
    const tx = await contract.lockMatic(giftCodeBytes32, walletAddress, unlockDate, {
      value: amountInWei,
      gasLimit: 200000,
    });
    console.log("Transaction sent. Hash:", tx.hash);

    const receipt = await tx.wait();
    console.log("Payment simulation completed. Transaction confirmed.");
    
    return {
      success: true,
      transactionHash: tx.hash,
      walletAddress,
      amount,
      currency,
      giftCode,
      unlockDate: new Date(unlockDate * 1000).toISOString()
    };
  } catch (error) {
    console.error("❌ Payment simulation failed:", error.message);
    throw error;
  }
}

// Example usage
const walletAddress = "0xbf70FC8Bc1aB4cB26668B48b1c71e078dd9d347A";
const amount = "0.1";
const currency = "ETH";

simulatePayment({
  walletAddress,
  amount,
  currency
})
  .then((result) => {
    console.log("✅ Simulation complete:", result);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script execution failed:", error);
    process.exit(1);
  });