const mongoose = require('mongoose');
const morgan = require('morgan');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const cron = require('node-cron');
const { cleanupExpiredGifts } = require('./services/giftService');
const giftRoutes = require('./routes/gift');
const logger = require('./logger');
const ethers = require('ethers');
const { generateWallets } = require('./utils/walletGenerator');

const app = express();

const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const GiftContractABI = require('../blockchain/artifacts/contracts/GiftContract.sol/GiftContract.json').abi;

app.use(cors());
app.use(bodyParser.json());
app.use(morgan('combined'));

const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/giftic';
const connectDB = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected successfully');
  } catch (err) {
    logger.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};
connectDB();

// Pre-generate 10 wallets without mnemonics
generateWallets(10).then((wallets) => {
  wallets.forEach(wallet => {
    logger.info(`✅ Pre-generated wallet: ${wallet.address} (Index: ${wallet.index})`);
  });
  logger.info(`✅ Pre-generated ${wallets.length} wallets`);
}).catch(err => logger.error(`❌ Wallet generation failed: ${err.message}`));

const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
provider.pollingInterval = 500; // Poll every 0.5 seconds
provider.getBlockNumber()
  .then(block => logger.info(`Provider connected at block: ${block}`))
  .catch(err => logger.error(`Provider connection failed: ${err.message}`));
provider.on('error', (err) => logger.error(`JsonRpcProvider error: ${err.message}`));
const contract = new ethers.Contract(contractAddress, GiftContractABI, provider);
logger.info("Event listener subscribing to FundsLocked");
contract.on('FundsLocked', async (giftCode, token, amount, fee, targetWallet, unlockDate) => {
  logger.info(`FundsLocked event received: giftCode=${giftCode}, targetWallet=${targetWallet}, amount=${amount.toString()}`);
  try {
    const decodedGiftCode = ethers.utils.parseBytes32String(giftCode);
    logger.info(`Decoded giftCode: ${decodedGiftCode}`);
    const { confirmPayment } = require('./services/paymentService');
    const result = await confirmPayment(decodedGiftCode);
    if (!result.success) logger.warn(`Payment confirmation failed: ${result.error}`);
  } catch (error) {
    logger.error(`❌ Error processing FundsLocked event: ${error.message}`);
  }
});

app.use('/api/gift', giftRoutes);

cron.schedule('* * * * *', async () => {
  try {
    await cleanupExpiredGifts();
    logger.info('Expired gifts cleanup job executed');
  } catch (error) {
    logger.error(`Error in cleanupExpiredGifts: ${error.message}`);
  }
});

app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`);
  res.status(500).json({ success: false, error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});