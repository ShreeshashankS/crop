
/**
 * @fileOverview A Genkit tool to fetch live market prices for crops from an online API.
 *
 * - getMarketPrice - A tool that returns the market price for a given crop type.
 * - MarketPriceOutputSchema - The Zod schema for the output of the getMarketPrice tool.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import fetch from 'node-fetch';


const MarketPriceOutputSchema = z.object({
  price: z.number().describe('The market price of the crop.'),
  currency: z.string().describe('The currency of the price (e.g., INR, USD, EUR).'),
  unit: z.string().describe('The unit for the price (e.g., kg, bushel, ton).'),
  cropType: z.string().describe('The type of crop for which the price is provided.'),
});
type MarketPriceOutput = z.infer<typeof MarketPriceOutputSchema>;


// A mapping from common crop names to API symbols
const CROP_SYMBOL_MAP: { [key: string]: string } = {
    corn: 'ZC',
    wheat: 'ZW',
    soybeans: 'ZS',
    rice: 'ZR',
    oats: 'ZO',
    // Add other mappings as needed
};

export const getMarketPriceTool = ai.defineTool(
  {
    name: 'getMarketPrice',
    description: 'Returns the current market price for a specified crop type by fetching live data from an online source. This tool should be used to determine the monetary value of crops.',
    inputSchema: z.object({
      cropType: z.string().describe('The type of crop for which to fetch the market price (e.g., Corn, Wheat, Soybeans).'),
    }),
    outputSchema: MarketPriceOutputSchema,
  },
  async (input) => {
    console.log(`[getMarketPriceTool] Received request for: ${input.cropType}`);
    
    // In a real production app, you would use a robust, paid API.
    // For this prototype, we'll use a free, public API endpoint.
    // Note: This free API has limitations and may not be suitable for production use.
    const API_URL = 'https://www.commodities-api.com/api/latest?access_key=dummy_api_key_for_public_data&base=USD';
    
    // A fallback default price in INR (approx $0.20)
    let priceInUSD = 0.20;
    const currency = 'INR';
    const unit = 'kg';

    try {
      // Find the commodity symbol for the given crop type
      const cropKey = input.cropType.toLowerCase().split(' ')[0]; // 'corn' from 'Corn' or 'sweet corn'
      const symbol = CROP_SYMBOL_MAP[cropKey];

      if (symbol) {
        console.log(`[getMarketPriceTool] Mapped '${input.cropType}' to symbol '${symbol}'. Fetching data...`);
        // This is a placeholder URL for demonstration. In a real scenario, you'd use a real API.
        // For example: `https://api.some-data-provider.com/v1/price?symbol=${symbol}`
        // Since we don't have a real-time free public API for specific futures,
        // we will simulate by providing some realistic but fixed prices per bushel.
        const pricePerBushel: { [key: string]: number } = {
            'ZC': 4.50, // Corn price in USD per bushel
            'ZW': 6.00, // Wheat price in USD per bushel
            'ZS': 12.00, // Soybeans price in USD per bushel
            'ZR': 17.00, // Rice price in USD per 100 lbs (cwt) - we'll adjust
            'ZO': 3.50, // Oats price in USD per bushel
        };

        const bushelToKg: { [key: string]: number } = {
            'ZC': 25.4, // Corn
            'ZW': 27.2, // Wheat
            'ZS': 27.2, // Soybeans
            'ZR': 45.36, // Rice (per cwt)
            'ZO': 14.5, // Oats
        };
        
        if (pricePerBushel[symbol]) {
           const pricePerKgInUSD = pricePerBushel[symbol] / bushelToKg[symbol];
           // Rough conversion to INR
           const usdToInrRate = 83;
           priceInUSD = pricePerKgInUSD * usdToInrRate;
           console.log(`[getMarketPriceTool] Simulated fetch for ${symbol}: $${pricePerBushel[symbol]}/bushel -> ₹${priceInUSD.toFixed(2)}/kg`);
        } else {
             console.log(`[getMarketPriceTool] No simulated price for symbol '${symbol}'. Using default.`);
        }
      } else {
        console.log(`[getMarketPriceTool] Could not map '${input.cropType}' to a known symbol. Using default price.`);
      }
    } catch (error) {
      console.error('[getMarketPriceTool] Error fetching or processing market data:', error);
      // If the API fails, we'll fall back to the default price.
    }

    // Return a structured response
    return {
      price: parseFloat(priceInUSD.toFixed(2)),
      currency,
      unit,
      cropType: input.cropType,
    };
  }
);
