const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
    // Load the contract address from deployment
    const contractData = JSON.parse(fs.readFileSync("./contractAddress.json"));
    const contractAddress = contractData.contractAddress;

    console.log(`🔗 Using contract at: ${contractAddress}`);

    // Connect to deployed contract
    const giftContract = await ethers.getContractAt("GiftContract", contractAddress);

    // Signers
    const [deployer, recipient] = await ethers.getSigners();
    console.log(`🤖 Deployer: ${deployer.address}`);
    console.log(`🎁 Recipient: ${recipient.address}`);

    // Encode a unique gift code
    const giftCode = ethers.encodeBytes32String("test-gift-1");

    // Set unlock date (1 hour from now)
    const unlockDate = Math.floor(Date.now() / 1000) + 3600;
    console.log(`⏳ Unlock Date: ${new Date(unlockDate * 1000).toLocaleString()}`);

    // **MATIC Deposit Test**
    console.log("💰 Locking 1 MATIC...");
    const txMatic = await giftContract.lockMatic(giftCode, recipient.address, unlockDate, {
        value: ethers.parseEther("1.0"),
    });
    await txMatic.wait();
    console.log("✅ MATIC funds locked successfully!");

    // **Fetch Gift Details**
    console.log("🔍 Fetching gift details...");
    const giftDetails = await giftContract.gifts(giftCode); // Use mapping directly
    console.log(`🎁 Gift Details:`, {
        amount: giftDetails.amount.toString(),
        fee: giftDetails.fee.toString(),
        targetWallet: giftDetails.targetWallet,
        unlockDate: giftDetails.unlockDate.toString(),
        claimed: giftDetails.claimed,
        token: giftDetails.token,
    });

    // **Claiming Funds Test**
    console.log(`⏳ Waiting for unlock time... (Simulated)`);
    await new Promise((resolve) => setTimeout(resolve, 5000)); // Simulating time passage

    // Switch to recipient account & claim
    console.log("🎁 Claiming funds...");
    const recipientGiftContract = giftContract.connect(recipient);
    const claimTx = await recipientGiftContract.claimGift(giftCode);
    await claimTx.wait();
    console.log("✅ Funds claimed successfully!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Interaction failed:", error);
        process.exit(1);
    });