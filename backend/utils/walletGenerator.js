const { ethers } = require("ethers");
const { saveWalletToDatabase, getLastWalletIndex } = require("../services/walletService");
const logger = require("../logger");
require("dotenv").config({ path: __dirname + "/../.env" });

// Securely Load and Validate Master Mnemonic (optional, can remove if not used)
const MASTER_MNEMONIC = process.env.MASTER_MNEMONIC;

// Function to Generate Gift Code
function generateGiftCode() {
  try {
    const randomHex = ethers.utils.hexlify(ethers.utils.randomBytes(4)); // Generate 4 random bytes (8 hex chars)
    const giftCode = `GIFT-${randomHex.slice(2).toUpperCase()}`; // Remove '0x' and uppercase
    logger.info(`✅ Generated gift code: ${giftCode}`);
    return giftCode;
  } catch (error) {
    logger.error(`❌ Error generating gift code: ${error.message}`);
    throw error;
  }
}

// Function to Generate Wallets in Bulk (without mnemonics)
async function generateWallets(count) {
  try {
    const hdNode = ethers.utils.HDNode.fromMnemonic(MASTER_MNEMONIC || ethers.Wallet.createRandom().mnemonic.phrase); // Fallback to random if no MASTER_MNEMONIC
    const lastIndex = await getLastWalletIndex() || 0;
    let wallets = [];

    for (let i = lastIndex; i < lastIndex + count; i++) {
      const path = `m/44'/60'/0'/0/${i}`; // Standard derivation path
      const childWallet = hdNode.derivePath(path);
      const walletData = {
        index: i,
        address: childWallet.address,
      };

      await saveWalletToDatabase(walletData);
      wallets.push(walletData);

      logger.info(`✅ Wallet Generated: ${childWallet.address} (Index: ${i})`);
    }

    return wallets;
  } catch (error) {
    logger.error(`❌ Error generating wallets: ${error.message}`);
    throw error;
  }
}

// Function to Regenerate Wallet (without mnemonic, as it’s now generated on claim)
function regenerateWallet(walletIndex) {
  try {
    if (walletIndex < 0) {
      throw new Error("❌ Invalid wallet index.");
    }

    const hdNode = ethers.utils.HDNode.fromMnemonic(MASTER_MNEMONIC || ethers.Wallet.createRandom().mnemonic.phrase);
    const path = `m/44'/60'/0'/0/${walletIndex}`;
    const childWallet = hdNode.derivePath(path);

    logger.info(`✅ Wallet regenerated for wallet index: ${walletIndex}, Address: ${childWallet.address}`);
    return childWallet.address;
  } catch (error) {
    logger.error(`❌ Error regenerating wallet for index ${walletIndex}: ${error.message}`);
    throw error;
  }
}

module.exports = { generateGiftCode, generateWallets, regenerateWallet }; // Ensure this export includes generateGiftCode