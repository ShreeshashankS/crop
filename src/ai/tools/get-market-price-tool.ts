
/**
 * @fileOverview A Genkit tool to fetch live market prices for crops from the data.gov.in API.
 *
 * - getMarketPriceTool - A tool that returns the market price for a given crop type.
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
    description: 'Returns the current market price for a specified crop type by fetching live data from the Indian government data portal (data.gov.in). This tool should be used to determine the monetary value of crops in INR.',
    inputSchema: z.object({
      cropType: z.string().describe('The type of crop for which to fetch the market price (e.g., Wheat, Paddy, Cotton). The crop name should be in English.'),
    }),
    outputSchema: MarketPriceOutputSchema,
  },
  async (input) => {
    console.log(`[getMarketPriceTool] Received request for: ${input.cropType}`);
    
    const API_KEY = process.env.DATA_GOV_IN_API_KEY;
    const API_URL = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${API_KEY}&format=json&limit=1000`;

    // A fallback default price in INR (approx $0.20) for demonstration purposes.
    let priceInINR = 16.60;
    const currency = 'INR';
    const unit = 'kg';

    if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
        console.log("[getMarketPriceTool] API key for data.gov.in is missing or a placeholder. Using default fallback price. Please set DATA_GOV_IN_API_KEY in your .env file.");
    } else {
        try {
            console.log(`[getMarketPriceTool] Attempting to fetch live data for ${input.cropType} from data.gov.in...`);
            const response = await fetch(API_URL);

            if (response.ok) {
                const data = await response.json() as any;
                const records = data?.records || [];
                
                // Filter records for the specific commodity, case-insensitive
                const cropRecords = records.filter(
                  (record: any) => record.commodity && record.commodity.toLowerCase() === input.cropType.toLowerCase()
                );

                if (cropRecords.length > 0) {
                    // Find the most recent record with a valid modal price
                    const validRecord = cropRecords.reverse().find((r: any) => r.modal_price && !isNaN(parseFloat(r.modal_price)) && parseFloat(r.modal_price) > 0);
                    
                    if (validRecord) {
                        const pricePerQuintal = parseFloat(validRecord.modal_price);
                        // Convert price from per Quintal (100 kg) to per kg
                        priceInINR = pricePerQuintal / 100;
                        console.log(`[getMarketPriceTool] Successfully fetched and converted price for ${input.cropType}: ₹${priceInINR.toFixed(2)}/kg. From market: ${validRecord.market}, State: ${validRecord.state}`);
                    } else {
                        console.log(`[getMarketPriceTool] Found records for ${input.cropType}, but none had a valid price. Using default.`);
                    }
                } else {
                    console.log(`[getMarketPriceTool] API did not return any records for ${input.cropType}. Using default.`);
                }
            } else {
                console.log(`[getMarketPriceTool] API request failed with status: ${response.status}. Using default. Response: ${await response.text()}`);
            }
        } catch (error) {
            console.error('[getMarketPriceTool] Error fetching or processing market data:', error);
            console.log("[getMarketPriceTool] An error occurred during the API call. Using default fallback price.");
        }
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
