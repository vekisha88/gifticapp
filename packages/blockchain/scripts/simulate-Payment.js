const { ethers } = require("hardhat");

/**
 * Simulates a direct payment to a wallet address
 * @param {Object} options - Payment options
 * @param {string} options.walletAddress - Target wallet address to receive the payment
 * @param {string|number} options.amount - Amount to send
 * @param {string} options.currency - Currency type (e.g., 'ETH', 'MATIC')
 * @param {string} options.network - Network to use (e.g., 'localhost', 'polygon')
 */
async function simulatePayment({ walletAddress, amount, currency, network }) {
  try {
    // Get the first Hardhat signer (default account with ETH locally)
    const [signer] = await ethers.getSigners();
    console.log("Using signer address:", signer.address);

    // Connect to the specified network (default to Hardhat's local node)
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    console.log(`Connected to network: ${network || "localhost"}`);

    // Use the provided walletAddress
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

    // Execute the direct transfer transaction
    console.log(`Sending ${amount} ${currency} to ${walletAddress}...`);
    const tx = await signer.sendTransaction({
      to: walletAddress,
      value: amountInWei,
      gasLimit: 30000, // Simple transfer needs much less gas
    });
    console.log("Transaction sent. Hash:", tx.hash);

    const receipt = await tx.wait();
    console.log("Payment simulation completed. Transaction confirmed in block:", receipt.blockNumber);
    
    return {
      success: true,
      transactionHash: tx.hash,
      from: signer.address,
      to: walletAddress,
      amount,
      currency,
      network: network || "localhost",
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    console.error("❌ Payment simulation failed:", error.message);
    throw error;
  }
}

// Example usage with command line arguments
const args = process.argv.slice(2);
let options = {
  walletAddress: "0x009997e88445e1926d9002b80367dab5e8af23c6",  // Ensure this matches exactly the format in MongoDB
  amount: "1050",
  currency: "MATIC",
  network: "polygon"
};

// Parse command line arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  // Handle both formats: --wallet value and --wallet=value
  if (arg.startsWith('--wallet=') || arg.startsWith('-w=')) {
    options.walletAddress = arg.split('=')[1].replace(/"/g, '');
  } 
  else if (arg === '--wallet' || arg === '-w') {
    options.walletAddress = args[++i].replace(/"/g, '');
  }
  else if (arg.startsWith('--amount=') || arg.startsWith('-a=')) {
    options.amount = arg.split('=')[1].replace(/"/g, '');
  }
  else if (arg === '--amount' || arg === '-a') {
    options.amount = args[++i].replace(/"/g, '');
  }
  else if (arg.startsWith('--currency=') || arg.startsWith('-c=')) {
    options.currency = arg.split('=')[1].replace(/"/g, '');
  }
  else if (arg === '--currency' || arg === '-c') {
    options.currency = args[++i].replace(/"/g, '');
  }
  else if (arg.startsWith('--network=') || arg.startsWith('-n=')) {
    options.network = arg.split('=')[1].replace(/"/g, '');
  }
  else if (arg === '--network' || arg === '-n') {
    options.network = args[++i].replace(/"/g, '');
  }
}

console.log("Simulation options:", options);

simulatePayment(options)
  .then((result) => {
    console.log("✅ Simulation complete:", result);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script execution failed:", error);
    process.exit(1);
  });