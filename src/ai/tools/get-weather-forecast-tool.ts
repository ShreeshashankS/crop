
/**
 * @fileOverview A Genkit tool to fetch a mock weather forecast.
 *
 * - getWeatherForecastTool - A tool that returns a weather forecast for a given location.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const getWeatherForecastTool = ai.defineTool(
  {
    name: 'getWeatherForecast',
    description: 'Returns the weather forecast for a specified location for the next 7 days.',
    inputSchema: z.object({
      location: z.string().describe('The city or region for which to fetch the weather forecast.'),
    }),
    outputSchema: z.object({
        forecast: z.string().describe("A summary of the 7-day weather forecast, including temperature ranges, precipitation chances, and general conditions."),
    }),
  },
  async (input) => {
    // In a real application, this would call an external weather API.
    // For this example, we'll return mock data.
    console.log(`[getWeatherForecastTool] Mock forecast for ${input.location}`);
    
    const forecasts = [
        "Sunny with highs around 30°C. Low chance of rain.",
        "Partly cloudy with a 40% chance of afternoon showers. Highs of 28°C.",
        "Heavy rainfall expected, totaling 50mm. Highs of 25°C.",
        "Clear skies and dry conditions. Highs around 32°C.",
        "Mixed sun and clouds, moderate temperatures. Highs of 27°C.",
    ];
    
    // Return a random forecast to simulate variability
    const forecast = forecasts[Math.floor(Math.random() * forecasts.length)];

    return {
      forecast,
    };
  }
);
