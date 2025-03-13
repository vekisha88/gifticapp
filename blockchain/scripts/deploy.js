const { ethers } = require("hardhat");

async function main() {
    // Get the deployer account (Hardhat provides 20 test accounts locally)
    const [deployer] = await ethers.getSigners();

    // Log deployer details
    console.log("🚀 Deploying contract with account:", deployer.address);
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

    // Deploy the GiftContract
    console.log("⏳ Deploying GiftContract...");
    const GiftContract = await ethers.getContractFactory("GiftContract");
    const giftContract = await GiftContract.deploy();

    // Wait for deployment to be mined (locally, this is instant)
    await giftContract.waitForDeployment();

    // Get and log the contract address
    const contractAddress = await giftContract.getAddress();
    console.log("✅ GiftContract deployed at:", contractAddress);

    // Save the contract address for backend/frontend use
    console.log("🔗 Saving contract address to contractAddress.json...");
    const fs = require("fs");
    fs.writeFileSync(
        "./contractAddress.json",
        JSON.stringify({ contractAddress }, null, 2)
    );

    console.log("🎉 Local deployment complete! Ready for testing.");
}

main()
    .then(() => {
        console.log("🏁 Script finished successfully.");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });