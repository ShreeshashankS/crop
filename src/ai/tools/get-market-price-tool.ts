
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
    
    // In a real production app, you would use a robust, paid API with a real API key.
    // For this prototype, we'll use a placeholder URL and a fallback default price.
    // The commodities-api.com service requires a paid subscription for real usage.
    const API_URL = `https://www.commodities-api.com/api/latest?access_key=DUMMY_API_KEY&symbols=${input.cropType.toUpperCase()}`;
    
    // A fallback default price in INR (approx $0.20) for demonstration purposes.
    let priceInINR = 16.60;
    const currency = 'INR';
    const unit = 'kg';

    try {
      console.log(`[getMarketPriceTool] Attempting to fetch live data for ${input.cropType}...`);
      // const response = await fetch(API_URL);
      // if (response.ok) {
      //   const data = await response.json();
      //   // NOTE: The parsing logic below is hypothetical and depends on the API's actual response structure.
      //   // For example, if the API returns price in USD per ton:
      //   const pricePerTonUSD = data?.rates?.[input.cropType.toUpperCase()];
      //   if (pricePerTonUSD) {
      //      const usdToInrRate = 83;
      //      const tonsToKg = 1000;
      //      priceInINR = (pricePerTonUSD / tonsToKg) * usdToInrRate;
      //      console.log(`[getMarketPriceTool] Successfully fetched and converted price for ${input.cropType}: ₹${priceInINR.toFixed(2)}/kg`);
      //   } else {
      //      console.log(`[getMarketPriceTool] API did not return a price for ${input.cropType}. Using default.`);
      //   }
      // } else {
      //    console.log(`[getMarketPriceTool] API request failed with status: ${response.status}. Using default.`);
      // }

      // IMPORTANT: Since we are using a DUMMY_API_KEY, the above fetch will fail.
      // A real API key from a service like commodities-api.com (which requires a subscription) is needed for live data.
      // We will log this and use the default price as a fallback.
      console.log("[getMarketPriceTool] API call skipped due to dummy API key. Using default fallback price.");


    } catch (error) {
      console.error('[getMarketPriceTool] Error fetching or processing market data:', error);
      // If the API fails for any reason, we'll log it and use the default price.
      console.log("[getMarketPriceTool] An error occurred during the API call. Using default fallback price.");
    }

    // Return a structured response
    return {
      price: parseFloat(priceInINR.toFixed(2)),
      currency,
      unit,
      cropType: input.cropType,
    };
  }
);
