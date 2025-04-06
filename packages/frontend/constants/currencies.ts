// src/constants/currencies.ts (unchanged from your last input)
import { CurrencyOption } from "@gifticapp/shared";

interface ExtendedCurrencyOption extends CurrencyOption {
  binanceSymbol: string;
}

export const CURRENCY_OPTIONS: ExtendedCurrencyOption[] = [
  {
    key: "matic-network",
    label: "MATIC",
    binanceSymbol: "MATICUSDT",
    icon: require("cryptocurrency-icons/128/color/matic.png"),
  },
  {
    key: "ethereum",
    label: "ETH",
    binanceSymbol: "ETHUSDT",
    icon: require("cryptocurrency-icons/128/color/eth.png"),
  },
  {
    key: "bitcoin",
    label: "BTC",
    binanceSymbol: "BTCUSDT",
    icon: require("cryptocurrency-icons/128/color/btc.png"),
  },
  {
    key: "usd-coin",
    label: "USDC",
    binanceSymbol: "USDCUSDT",
    icon: require("cryptocurrency-icons/128/color/usdc.png"),
  },
  {
    key: "tether",
    label: "USDT",
    binanceSymbol: "USDTBUSD", // Market-based USDT price
    icon: require("cryptocurrency-icons/128/color/usdt.png"),
  },
  {
    key: "dai",
    label: "DAI",
    binanceSymbol: "DAIUSDT",
    icon: require("cryptocurrency-icons/128/color/dai.png"),
  },
];