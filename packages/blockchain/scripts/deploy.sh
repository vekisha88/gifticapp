#!/bin/bash

# Ensure Hardhat is installed
if ! command -v npx &> /dev/null
then
    echo "npx could not be found. Please install Node.js and npm."
    exit 1
fi

# Run the deployment script
echo "🚀 Deploying GiftContract..."
npx hardhat run scripts/deploy.js --network localhost

# Check if deployment was successful
if [ $? -eq 0 ]; then
    echo "✅ Deployment successful. Check contractAddress.json for the contract address."
else
    echo "❌ Deployment failed. Please check the Hardhat output for errors."
fi 