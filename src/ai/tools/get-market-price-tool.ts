
/**
 * @fileOverview A Genkit tool to fetch (mock) market prices for crops.
 *
 * - getMarketPrice - A tool that returns the market price for a given crop type.
 * - MarketPriceOutputSchema - The Zod schema for the output of the getMarketPrice tool.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const MarketPriceOutputSchema = z.object({
  price: z.number().describe('The market price of the crop.'),
  currency: z.string().describe('The currency of the price (e.g., USD, EUR).'),
  unit: z.string().describe('The unit for the price (e.g., kg, bushel, ton).'),
  cropType: z.string().describe('The type of crop for which the price is provided.'),
});
export type MarketPriceOutput = z.infer<typeof MarketPriceOutputSchema>;

export const getMarketPriceTool = ai.defineTool(
  {
    name: 'getMarketPrice',
    description: 'Returns the current market price for a specified crop type. This tool should be used to determine the monetary value of crops.',
    inputSchema: z.object({
      cropType: z.string().describe('The type of crop for which to fetch the market price (e.g., Corn, Wheat, Soybeans).'),
    }),
    outputSchema: MarketPriceOutputSchema,
  },
  async (input) => {
    // In a real application, this would call an external API to get live market data.
    // For this example, we'll return mock data.
    const crop = input.cropType.toLowerCase();
    let price = 0.2; // Default price
    const currency = 'USD';
    const unit = 'kg';

    if (crop.includes('corn') || crop.includes('maize')) {
      price = 0.22; // Fictional price for Corn
    } else if (crop.includes('wheat')) {
      price = 0.25; // Fictional price for Wheat
    } else if (crop.includes('soybean')) {
      price = 0.45; // Fictional price for Soybeans
    } else if (crop.includes('rice')) {
      price = 0.70;
    } else if (crop.includes('potatoes')) {
      price = 0.50;
    } else if (crop.includes('tomatoes')) {
      price = 1.50;
    }
    // Add more mock prices as needed

    console.log(`[getMarketPriceTool] Mock price for ${input.cropType}: ${price} ${currency}/${unit}`);
    return {
      price,
      currency,
      unit,
      cropType: input.cropType,
    };
  }
);
