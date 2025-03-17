interface Transaction {
  amount: number;
  currency: string;
  walletAddress: string;
}

function simulateTransaction(transaction: Transaction): void {
  console.log(`Simulating transaction: ${transaction.amount} ${transaction.currency} to ${transaction.walletAddress}`);
} 