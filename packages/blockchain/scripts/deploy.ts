import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("\n[*] Starting contract deployment process...\n");

  // Get the Contract Factory
  console.log("[*] Loading GiftContract factory...");
  const GiftContract = await ethers.getContractFactory("GiftContract");
  console.log("[+] Contract factory loaded successfully\n");

  // Get the first signer (deployer)
  const [deployer] = await ethers.getSigners();
  console.log(`[*] Deploying contract with account: ${deployer.address}`);
  
  // Log deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`[*] Account balance: ${ethers.formatEther(balance)} ETH\n`);

  // For development, we'll use the same address for both charity and company wallets
  console.log("[*] Setting up contract parameters:");
  console.log(`   - Charity wallet: ${deployer.address}`);
  console.log(`   - Company wallet: ${deployer.address}\n`);

  // Deploy the contract
  console.log("[*] Deploying GiftContract...");
  console.log("[*] Waiting for deployment transaction to be mined...");
  const contract = await GiftContract.deploy(deployer.address, deployer.address);
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("[+] GiftContract deployed successfully!");
  console.log(`[*] Contract address: ${contractAddress}`);

  // Verify the contract is deployed
  const code = await ethers.provider.getCode(contractAddress);
  if (code === "0x") {
    throw new Error("Contract deployment failed - no code at address");
  }
  console.log("[+] Contract deployment verified\n");

  // Save the contract address to a file that can be read by the backend
  const addressPath = path.join(__dirname, "../contractAddress.json");
  fs.writeFileSync(
    addressPath,
    JSON.stringify({ address: contractAddress }, null, 2)
  );
  console.log(`[*] Contract address saved to: ${addressPath}\n`);

  // Log deployment summary
  console.log("[*] Deployment Summary:");
  console.log(`   - Network: ${process.env.HARDHAT_NETWORK || 'localhost'}`);
  console.log(`   - Contract address: ${contractAddress}`);
  console.log(`   - Deployer address: ${deployer.address}`);
  console.log(`   - Block number: ${await ethers.provider.getBlockNumber()}\n`);

  console.log("[+] Deployment completed successfully!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[!] Deployment failed:");
    console.error(error);
    process.exit(1);
  }); 