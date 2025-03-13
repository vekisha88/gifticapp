import { useCallback, useEffect, useRef } from "react";
import axios from "axios";
import { CURRENCY_OPTIONS } from "../constants/currencies";

const BINANCE_WS_BASE = "wss://stream.binance.com:9443/ws";
const COINGECKO_API = "https://api.coingecko.com/api/v3/simple/price";
const BACKUP_API = "https://min-api.cryptocompare.com/data/price";

const priceCache: { [key: string]: { price: number; timestamp: number } } = {};
const CACHE_DURATION = 10 * 60 * 1000; // Increased from 5 minutes to 10 minutes for simplicity
const COINGECKO_RATE_LIMIT_DELAY = 60 * 1000; // 1 minute
const RETRY_DELAY = 1000; // 1-second delay for simple retry

interface PriceResponse {
  [key: string]: { usd: number };
}

interface BinanceTradeData {
  s: string;
  p: string;
}

export const useLivePrice = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const priceListeners = useRef<{ [key: string]: number }>({});
  const reconnectionAttempts = useRef<number>(0);
  const lastCoinGeckoFetch = useRef<number>(0);
  const MAX_RECONNECTION_ATTEMPTS = 5;
  const RECONNECTION_DELAY = 2000;

  const getCachedPrice = (currency: string): number | null => {
    const cached = priceCache[currency];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.price;
    }
    return null;
  };

  const getBinanceStreams = (currencies: string[]): string[] => {
    return currencies
      .map((coinGeckoId) => {
        const option = CURRENCY_OPTIONS.find((opt) => opt.key === coinGeckoId);
        return option ? `${option.binanceSymbol.toLowerCase()}@trade` : null;
      })
      .filter(Boolean) as string[];
  };

  const fetchFromApi = async (
    apiUrl: string,
    currencies: string[],
    isBackup: boolean = false
  ): Promise<PriceResponse> => {
    const ids = currencies.join(",");
    if (apiUrl === COINGECKO_API && Date.now() - lastCoinGeckoFetch.current < COINGECKO_RATE_LIMIT_DELAY) {
      console.warn("Rate limit exceeded for CoinGecko. Waiting...");
      await new Promise((resolve) => setTimeout(resolve, COINGECKO_RATE_LIMIT_DELAY));
    }

    try {
      const response = await axios.get(`${apiUrl}?ids=${ids}&vs_currencies=usd`);
      if (apiUrl === COINGECKO_API) {
        lastCoinGeckoFetch.current = Date.now();
      }
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        console.error(`Rate limit exceeded for ${apiUrl}.`);
        throw error;
      }
      throw error;
    }
  };

  const setupWebSocket = useCallback((currencies: string[]) => {
    if (wsRef.current) return;

    const binanceStreams = getBinanceStreams(currencies);
    if (!binanceStreams.length) {
      console.warn("No valid Binance streams found for currencies:", currencies);
      return;
    }

    const wsUrl = `${BINANCE_WS_BASE}/${binanceStreams.join("/")}`;
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log("Binance WebSocket connected for:", currencies);
      reconnectionAttempts.current = 0;
    };

    wsRef.current.onmessage = (event) => {
      const data: BinanceTradeData = JSON.parse(event.data);
      const binanceSymbol = data.s.toUpperCase();
      const price = parseFloat(data.p);

      const currencyOptions = CURRENCY_OPTIONS.filter((opt) => opt.binanceSymbol === binanceSymbol);
      if (currencyOptions.length && price) {
        currencyOptions.forEach((option) => {
          const coinGeckoId = option.key;
          priceListeners.current[coinGeckoId] = price;
          priceCache[coinGeckoId] = { price, timestamp: Date.now() };
        });
      }
    };

    wsRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      reconnectWebSocket(currencies);
    };

    wsRef.current.onclose = () => {
      console.log("WebSocket closed");
      wsRef.current = null;
      reconnectWebSocket(currencies);
    };
  }, []);

  const reconnectWebSocket = (currencies: string[]) => {
    if (reconnectionAttempts.current < MAX_RECONNECTION_ATTEMPTS) {
      reconnectionAttempts.current += 1;
      console.log(`Reconnecting WebSocket (${reconnectionAttempts.current}/${MAX_RECONNECTION_ATTEMPTS})`);
      setTimeout(() => setupWebSocket(currencies), RECONNECTION_DELAY * reconnectionAttempts.current);
    } else {
      console.error("Max WebSocket reconnection attempts reached.");
    }
  };

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const fetchLivePrices = useCallback(
    async (currencies: string | string[], retries = 1): Promise<{ [key: string]: number | null }> => { // Simplified to 1 retry
      const currencyArray = Array.isArray(currencies) ? currencies : [currencies];
      const result: { [key: string]: number | null } = {};

      currencyArray.forEach((currency) => {
        const wsPrice = priceListeners.current[currency] || null;
        const cachedPrice = getCachedPrice(currency);
        result[currency] = wsPrice || cachedPrice || null;
      });

      const currenciesToFetch = currencyArray.filter((currency) => result[currency] === null);
      if (currenciesToFetch.length === 0) return result;

      const binanceSupportedCurrencies = currenciesToFetch.filter((currency) =>
        CURRENCY_OPTIONS.find((opt) => opt.key === currency && opt.binanceSymbol)
      );
      if (binanceSupportedCurrencies.length > 0) {
        setupWebSocket(binanceSupportedCurrencies);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        binanceSupportedCurrencies.forEach((currency) => {
          const wsPrice = priceListeners.current[currency] || null;
          if (wsPrice !== null) {
            result[currency] = wsPrice;
            priceCache[currency] = { price: wsPrice, timestamp: Date.now() };
          }
        });
      }

      const stillMissing = currenciesToFetch.filter((currency) => result[currency] === null);
      if (stillMissing.length === 0) return result;

      for (let i = 0; i < retries; i++) {
        try {
          const prices = await fetchFromApi(COINGECKO_API, stillMissing);
          stillMissing.forEach((currency) => {
            const price = prices[currency]?.usd || null;
            result[currency] = price;
            if (price !== null) {
              priceCache[currency] = { price, timestamp: Date.now() };
            }
          });
          return result;
        } catch (error) {
          console.error(`CoinGecko fetch failed (attempt ${i + 1}/${retries}):`, error);
          if (i === retries - 1) {
            try {
              const backupPrices = await fetchFromApi(BACKUP_API, stillMissing, true);
              stillMissing.forEach((currency) => {
                const price = backupPrices[currency]?.usd || null;
                result[currency] = price;
                if (price !== null) {
                  priceCache[currency] = { price, timestamp: Date.now() };
                }
              });
              return result;
            } catch (backupError) {
              console.error("Backup API fetch failed:", backupError);
              stillMissing.forEach((currency) => {
                if (result[currency] === null) result[currency] = priceListeners.current[currency] ?? null;
              });
              return result;
            }
          }
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY)); // Simple 1-second delay for retry
        }
      }
      return result;
    },
    [setupWebSocket]
  );

  return { fetchLivePrices };
};