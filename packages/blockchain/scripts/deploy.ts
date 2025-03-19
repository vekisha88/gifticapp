import { ethers } from "hardhat";
import fs from "fs";
import { Contract } from "ethers";

async function main() {
    // Get the deployer account (Hardhat provides 20 test accounts locally)
    const [deployer] = await ethers.getSigners();

    // Log deployer details
    console.log("🚀 Deploying contract with account:", deployer.address);
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

    // Get test accounts for charity and company wallets
    const [, , charityWallet, companyWallet] = await ethers.getSigners();

    // Deploy the GiftContract
    console.log("⏳ Deploying GiftContract...");
    const GiftContract = await ethers.getContractFactory("GiftContract");
    const giftContract: Contract = await GiftContract.deploy();

    // Wait for deployment to be mined (locally, this is instant)
    await giftContract.waitForDeployment();

    // Get and log the contract address
    const contractAddress = await giftContract.getAddress();
    console.log("✅ GiftContract deployed at:", contractAddress);
    console.log("🏦 Charity Wallet:", charityWallet.address);
    console.log("💼 Company Wallet:", companyWallet.address);

    // Save the contract address for backend/frontend use
    console.log("🔗 Saving contract address to contractAddress.json...");
    fs.writeFileSync(
        "./contractAddress.json",
        JSON.stringify({ 
            contractAddress,
            charityWallet: charityWallet.address,
            companyWallet: companyWallet.address
        }, null, 2)
    );

    console.log("🎉 Local deployment complete! Ready for testing.");
}

main()
    .then(() => {
        console.log("🏁 Script finished successfully.");
        process.exit(0);
    })
    .catch((error: Error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });