interface ExchangeRateResponse {
  success: boolean;
  timestamp: number;
  base: string;
  date: string;
  rates: {
    [currency: string]: number;
  };
}

interface CachedRate {
  rate: number;
  timestamp: number;
  expiresAt: number;
}

class CurrencyService {
  private cache: Map<string, CachedRate> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
  private readonly API_URL = 'https://api.exchangeratesapi.io/v1/latest';
  private readonly API_KEY = process.env.EXCHANGE_RATE_API_KEY || 'free'; // Use 'free' for free tier

  /**
   * Get the current exchange rate from USD to CLP
   * Uses caching to avoid excessive API calls
   */
  async getUSDToCLPRate(): Promise<number> {
    const cacheKey = 'USD_TO_CLP';
    const cached = this.cache.get(cacheKey);

    // Return cached rate if it's still valid
    if (cached && Date.now() < cached.expiresAt) {
      console.log('Using cached exchange rate:', cached.rate);
      return cached.rate;
    }

    try {
      console.log('Fetching fresh exchange rate from API...');
      const response = await fetch(`${this.API_URL}?access_key=${this.API_KEY}&base=USD&symbols=CLP`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as ExchangeRateResponse;

      if (!data.success) {
        throw new Error('API returned unsuccessful response');
      }

      const rate = data.rates.CLP;
      if (!rate || rate <= 0) {
        throw new Error('Invalid exchange rate received');
      }

      // Cache the rate
      const now = Date.now();
      this.cache.set(cacheKey, {
        rate,
        timestamp: now,
        expiresAt: now + this.CACHE_DURATION
      });

      console.log('Fresh exchange rate fetched and cached:', rate);
      return rate;

    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      
      // Return cached rate even if expired, or fallback to approximate rate
      if (cached) {
        console.log('Using expired cached rate as fallback:', cached.rate);
        return cached.rate;
      }

      // Final fallback to approximate rate
      console.log('Using fallback exchange rate: 900');
      return 900;
    }
  }

  /**
   * Convert USD to CLP using real-time exchange rate
   */
  async convertUSDToCLP(usdAmount: number): Promise<number> {
    const rate = await this.getUSDToCLPRate();
    return Math.round(usdAmount * rate);
  }

  /**
   * Convert CLP to USD using real-time exchange rate
   */
  async convertCLPToUSD(clpAmount: number): Promise<number> {
    const rate = await this.getUSDToCLPRate();
    return clpAmount / rate;
  }

  /**
   * Get exchange rate info for display purposes
   */
  async getExchangeRateInfo(): Promise<{
    rate: number;
    lastUpdated: Date;
    source: string;
  }> {
    const rate = await this.getUSDToCLPRate();
    const cached = this.cache.get('USD_TO_CLP');
    
    return {
      rate,
      lastUpdated: cached ? new Date(cached.timestamp) : new Date(),
      source: 'ExchangeRate-API'
    };
  }

  /**
   * Clear the cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.cache.clear();
    console.log('Currency cache cleared');
  }
}

// Export singleton instance
export const currencyService = new CurrencyService();
export default currencyService;
