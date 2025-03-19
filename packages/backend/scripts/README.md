# Giftic Contract Fee Monitoring

This directory contains scripts to monitor and automatically withdraw fees from the Giftic contract when they reach a certain USD threshold.

## Features

- Monitors accumulated fees in the Giftic contract
- Automatically calculates USD values using CoinGecko price API
- Triggers withdrawals when fees exceed a configurable threshold (default $1,000)
- Can be scheduled to run automatically on a regular basis

## Setup

1. Install dependencies:
```bash
cd packages/backend/scripts
npm install
```

2. Make sure your `.env` file in the backend directory includes:
```
BLOCKCHAIN_RPC_URL=http://localhost:8545
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

## Usage

### Manual Monitoring

To manually check and withdraw fees:

```bash
npm run monitor
```

### Scheduled Monitoring

To set up automatic scheduled monitoring (using Windows Task Scheduler):

```powershell
# Daily at 9 AM (default)
.\setupScheduledTask.ps1

# Hourly starting at 8 AM
.\setupScheduledTask.ps1 -Frequency "HOURLY" -StartTime "08:00"

# Weekly on Monday at 10 AM
.\setupScheduledTask.ps1 -Frequency "WEEKLY" -StartTime "10:00" -TaskName "WeeklyGifticFeeMonitor"
```

## Configuration

You can modify the following settings in `monitorFees.js`:

- `WITHDRAWAL_THRESHOLD_USD`: The USD threshold at which to trigger withdrawals (default: $1,000)
- `TOKENS_TO_MONITOR`: List of tokens to monitor (add more as needed)

## Contract Logic

The current fee calculation logic:

1. When a buyer sends 105 MATIC:
   - Fee: (105 * 5) / 105 = 5 MATIC
   - Gift amount: 105 - 5 = 100 MATIC

2. The receiver gets exactly 100 MATIC
3. The company takes 5 MATIC as fee (5% of the gift amount)
4. Fees are accumulated in the contract until withdrawn

## Troubleshooting

If the script fails to connect to the blockchain:
- Make sure your local node is running
- Verify the RPC URL in your `.env` file
- Check that the contract address in `contractAddress.json` is correct

If price lookups fail:
- The CoinGecko API might be rate limited
- Verify the `coingeckoId` for each token in `TOKENS_TO_MONITOR` 