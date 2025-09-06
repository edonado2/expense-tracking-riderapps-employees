# Exchange Rate API Integration

This application now uses real-time exchange rates for USD/CLP conversion instead of fixed rates.

## Setup Instructions

### 1. Get a Free API Key (Optional)

The application works with the free tier of ExchangeRate-API, but you can get an API key for higher limits:

1. Visit [ExchangeRate-API](https://exchangeratesapi.io/)
2. Sign up for a free account
3. Get your API key from the dashboard

### 2. Configure Environment Variables

Add your API key to your environment variables:

```bash
# In your .env file or environment
EXCHANGE_RATE_API_KEY=your-api-key-here
```

**Note:** If you don't provide an API key, the application will use the free tier (limited to 100 requests per month).

### 3. How It Works

#### Backend Features:
- **Real-time Exchange Rates**: Fetches current USD/CLP rates from ExchangeRate-API
- **Intelligent Caching**: Caches rates for 5 minutes to reduce API calls
- **Fallback System**: Uses cached rates or approximate rates (900 CLP = 1 USD) if API fails
- **Automatic Conversion**: Converts between USD and CLP when creating rides

#### Frontend Features:
- **Live Conversion Preview**: Shows real-time conversion as you type
- **Current Rate Display**: Shows the current exchange rate
- **Loading States**: Indicates when rates are being fetched

### 4. API Endpoints

#### Get Current Exchange Rate
```
GET /api/rides/exchange-rate
```

Returns:
```json
{
  "rate": 950.25,
  "lastUpdated": "2024-01-15T10:30:00.000Z",
  "source": "ExchangeRate-API"
}
```

### 5. Caching Strategy

- **Cache Duration**: 5 minutes
- **Cache Key**: `USD_TO_CLP`
- **Fallback**: Uses expired cache if API fails
- **Final Fallback**: Approximate rate (900 CLP = 1 USD)

### 6. Error Handling

The system gracefully handles:
- API failures
- Network timeouts
- Invalid responses
- Rate limiting

In all cases, it falls back to cached rates or approximate rates to ensure the application continues working.

### 7. Free Tier Limits

Without an API key:
- 100 requests per month
- Basic support

With a free API key:
- 1,000 requests per month
- Email support
- Historical data access

### 8. Production Considerations

For production use:
1. Get a paid API key for higher limits
2. Consider implementing rate limiting on your side
3. Monitor API usage
4. Set up alerts for API failures

### 9. Testing

You can test the integration by:
1. Adding a ride with CLP currency
2. Checking the conversion preview
3. Verifying the stored USD amount in the database
4. Checking the exchange rate endpoint

The system will log all API calls and cache hits to the console for debugging.
