
'use server';

/**
 * @fileOverview Estimates crop yield based on soil properties, crop type, and plot size,
 * and also estimates the total market value using a market price tool.
 *
 * - estimateCropYield - A function that estimates crop yield and value.
 * - EstimateCropYieldInput - The input type for the estimateCropyield function.
 * - EstimateCropYieldOutput - The return type for the estimateCropYield function.
 */

import {ai} from '@/ai/genkit';
import {getMarketPriceTool} from '@/ai/tools/get-market-price-tool';
import {getWeatherForecastTool} from '@/ai/tools/get-weather-forecast-tool';
import {z} from 'genkit';

const EstimateCropYieldInputSchema = z.object({
  cropType: z.string().describe('The type of crop to estimate yield for.'),
  plotSize: z.number().describe('The size of the land plot in acres.'),
  location: z.string().describe('The geographical location (e.g., city, region) of the plot for weather forecasting.').optional(),
  photoDataUri: z.string().describe("An optional photo of the crop or soil, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'.").optional(),
  magnesium: z.number().describe('Magnesium content in the soil (ppm)').optional(),
  sodium: z.number().describe('Sodium content in the soil (ppm)').optional(),
  nitrogen: z.number().describe('Nitrogen content in the soil (ppm)').optional(),
  water: z.number().describe('Water content in the soil (%)').optional(),
  atmosphericGases: z.string().describe('Atmospheric gas composition').optional(),
  sunlight: z.number().describe('Average daily sunlight hours').optional(),
  pH: z.number().describe('pH level of the soil').optional(),
  phosphorus: z.number().describe('Phosphorus content in the soil (ppm)').optional(),
  potassium: z.number().describe('Potassium content in the soil (ppm)').optional(),
  calcium: z.number().describe('Calcium content in the soil (ppm)').optional(),
  sulfur: z.number().describe('Sulfur content in the soil (ppm)').optional(),
  iron: z.number().describe('Iron content in the soil (ppm)').optional(),
  manganese: z.number().describe('Manganese content in the soil (ppm)').optional(),
  zinc: z.number().describe('Zinc content in the soil (ppm)').optional(),
  copper: z.number().describe('Copper content in the soil (ppm)').optional(),
  boron: z.number().describe('Boron content in the soil (ppm)').optional(),
  molybdenum: z.number().describe('Molybdenum content in the soil (ppm)').optional(),
  chlorine: z.number().describe('Chlorine content in the soil (ppm)').optional(),
  nickel: z.number().describe('Nickel content in the soil (ppm)').optional(),
  aluminum: z.number().describe('Aluminum content in the soil (ppm)').optional(),
  silicon: z.number().describe('Silicon content in the soil (ppm)').optional(),
  cobalt: z.number().describe('Cobalt content in the soil (ppm)').optional(),
  vanadium: z.number().describe('Vanadium content in the soil (ppm)').optional(),
  selenium: z.number().describe('Selenium content in the soil (ppm)').optional(),
  iodine: z.number().describe('Iodine content in the soil (ppm)').optional(),
  arsenic: z.number().describe('Arsenic content in the soil (ppm)').optional(),
  lead: z.number().describe('Lead content in the soil (ppm)').optional(),
  cadmium: z.number().describe('Cadmium content in the soil (ppm)').optional(),
  mercury: z.number().describe('Mercury content in the soil (ppm)').optional(),
});

export type EstimateCropYieldInput = z.infer<typeof EstimateCropYieldInputSchema>;


// The full output type that the user's frontend will receive.
const EstimateCropYieldOutputSchema = z.object({
  estimatedYield: z.number().describe('The total estimated crop yield in kilograms for the specified plot size.'),
  confidenceInterval: z.object({
    lower: z.number(),
    upper: z.number(),
  }),
  marketPricePerKg: z.number(),
  currency: z.string(),
  priceUnit: z.string(),
  estimatedTotalValue: z.number(),
  explanation: z.string(),
  suggestions: z.array(z.string()),
});
export type EstimateCropYieldOutput = z.infer<typeof EstimateCropYieldOutputSchema>;

// This is what we now ask the AI to return. Notice it's per acre.
const AIOutputSchema = z.object({
    yieldPerAcre: z.number().describe('The estimated crop yield in kilograms for a single acre.'),
    confidenceIntervalPerAcre: z
      .object({
        lower: z.number().describe('The lower bound of the confidence interval for yield for a single acre.'),
        upper: z.number().describe('The upper bound of the confidence interval for yield for a single acre.'),
      })
      .describe('The confidence interval for the per-acre yield estimation.'),
    marketPricePerKg: z.number().describe("The current market price per kilogram for the crop. THIS MUST BE THE EXACT NUMERIC 'price' VALUE AS RETURNED BY THE getMarketPrice TOOL."),
    currency: z.string().describe("The currency for the market price. THIS MUST BE THE EXACT STRING VALUE FOR 'currency' AS RETURNED BY THE getMarketPrice TOOL. The tool is configured to return 'INR', so this field MUST be 'INR'."),
    priceUnit: z.string().describe("The unit for the market price. THIS MUST BE THE EXACT STRING VALUE FOR 'unit' AS RETURNED BY THE getMarketPrice TOOL. The tool typically returns 'kg'."),
    explanation: z.string().describe('An explanation of the factors influencing the yield and value estimation. If a photo was provided, include visual analysis of the photo. If a weather forecast was retrieved, mention how it impacts the estimation. This explanation MUST reference the market price, currency (which will be INR), and unit as obtained directly from the getMarketPrice tool.'),
    suggestions: z.array(z.string()).describe('Actionable suggestions to improve soil quality and crop yield for the selected crop. Provide at least 2-3 specific recommendations.'),
});
type AIOutput = z.infer<typeof AIOutputSchema>;


const PromptInputSchema = z.object({
  cropType: z.string().describe('The type of crop to estimate yield for.'),
  plotSize: z.number().describe('The size of the land plot in acres.'), // We still pass this for context
  location: z.string().optional(),
  photoDataUri: z.string().optional(),
  soilProperties: z.record(z.any()).describe('A key-value map of provided soil properties and their values.'),
});

export async function estimateCropYield(input: EstimateCropYieldInput): Promise<EstimateCropYieldOutput> {
  return estimateCropYieldFlow(input);
}

const prompt = ai.definePrompt({
  name: 'estimateCropYieldPrompt',
  input: {schema: PromptInputSchema},
  output: {schema: AIOutputSchema},
  tools: [getMarketPriceTool, getWeatherForecastTool],
  prompt: `You are an expert agricultural consultant. Your primary task is to determine a crop yield *per acre* in kilograms based on the provided data.

CRITICAL RULE: If the input for 'water' or 'sunlight' is 0, you MUST return a 'yieldPerAcre' of 0. Plants cannot grow without water or sunlight. The explanation should state this clearly.

Here is your process:
1.  Analyze all provided data: crop type, soil properties, location, and the optional photo.
2.  If a 'location' is provided, use the 'getWeatherForecast' tool to find the upcoming weather forecast. Factor this into your analysis.
3.  Based on all available information, determine a reasonable crop yield *for a single acre* in kilograms and a confidence interval for that estimate.
4.  Use the 'getMarketPrice' tool to find the current market price for '{{{cropType}}}'. The tool will return the price, currency (always 'INR'), and unit.
5.  In your final JSON output, you must populate all fields according to the schema.
    -   'yieldPerAcre' is your final determination for a single acre.
    -   'marketPricePerKg', 'currency', and 'priceUnit' MUST be the exact values from the tool.
    -   Provide a helpful 'explanation' and actionable 'suggestions'.

  Crop Type: {{{cropType}}}
  Plot Size: {{{plotSize}}} acres
  {{#if location}}
  Location: {{{location}}}
  {{/if}}

  {{#if photoDataUri}}
  Photo for Analysis:
  {{media url=photoDataUri}}
  {{/if}}

  Soil Properties (only provided values are listed):
  {{#each soilProperties as |propertyValue propertyKey|}}
    - {{propertyKey}}: {{{propertyValue}}}
  {{else}}
    No additional soil properties provided.
  {{/each}}

  You must output ONLY the valid JSON object defined in the schema, with no additional text or explanations outside of the JSON structure.
  `,
});

const estimateCropYieldFlow = ai.defineFlow(
  {
    name: 'estimateCropYieldFlow',
    inputSchema: EstimateCropYieldInputSchema,
    outputSchema: EstimateCropYieldOutputSchema,
  },
  async (rawInput: EstimateCropYieldInput): Promise<EstimateCropYieldOutput> => {
    // Hard-coded check for essential resources.
    if (rawInput.water === 0 || rawInput.sunlight === 0) {
      const reason = rawInput.water === 0 ? 'water' : 'sunlight';
      return {
        estimatedYield: 0,
        confidenceInterval: { lower: 0, upper: 0 },
        marketPricePerKg: 0,
        currency: 'INR',
        priceUnit: 'kg',
        estimatedTotalValue: 0,
        explanation: `The estimated yield is zero because crops cannot grow without ${reason}.`,
        suggestions: [`Provide a non-zero value for ${reason} to get a valid estimation.`],
      };
    }

    const soilPropertiesForPrompt: Record<string, any> = {};
    for (const key in rawInput) {
      if (Object.prototype.hasOwnProperty.call(rawInput, key)) {
        if (key !== 'cropType' && key !== 'plotSize' && key !== 'photoDataUri' && key !== 'location') {
          const value = rawInput[key as keyof EstimateCropYieldInput];
          if (value !== undefined && value !== null) {
            soilPropertiesForPrompt[key] = value;
          }
        }
      }
    }

    const promptArgs: z.infer<typeof PromptInputSchema> = {
      cropType: rawInput.cropType,
      plotSize: rawInput.plotSize,
      soilProperties: soilPropertiesForPrompt,
    };

    if (rawInput.photoDataUri) {
      promptArgs.photoDataUri = raw.photoDataUri;
    }
    if (rawInput.location) {
        promptArgs.location = rawInput.location;
    }

    const llmResponse = await prompt(promptArgs);
    const aiOutput = llmResponse.output;

    if (!aiOutput) {
      const rawText = llmResponse.text ?? "No raw text available from LLM.";
      const firstCandidate = llmResponse.candidates?.[0];
      const finishReason = firstCandidate?.finishReason ?? "Unknown";
      const safetyRatings = firstCandidate?.safetyRatings ?? [];
      
      console.error('LLM did not return valid structured output. Details:');
      console.error('  Raw text response from LLM:', rawText);
      console.error('  Finish reason:', finishReason);
      console.error('  Safety ratings:', JSON.stringify(safetyRatings, null, 2));
      console.error('  Input provided to LLM:', JSON.stringify(promptArgs, null, 2));
      console.error('  Tool calls made by LLM (history):', JSON.stringify(llmResponse.history, null, 2));


      let userMessage = 'The AI model did not return a valid estimation. Please check server logs for details.';
      if (finishReason === 'SAFETY') {
        userMessage = 'The AI model could not provide an estimation due to safety concerns. Please revise your input or check safety settings.';
      } else if (finishReason === 'MAX_TOKENS') {
        userMessage = 'The AI model response was too long. Please try with more specific inputs or a smaller plot size.';
      } else if (finishReason === 'STOP' && (!rawText || !rawText.trim().startsWith('{'))) { 
         userMessage = 'The AI model was unable to generate a response in the required format. It may have stopped prematurely or returned non-JSON text. Please check server logs.';
      } else if (['OTHER', 'UNKNOWN', 'UNSPECIFIED'].includes(finishReason)) {
        userMessage = 'An unexpected issue occurred with the AI model during generation. Please try again later or check server logs.';
      } else if (rawText && (!rawText.trim().startsWith('{') || !raw.trim().endsWith('}'))) {
         userMessage = 'The AI model response was not in the expected JSON format. It might be incomplete or contain extra text. Please check server logs.';
      }
      
      throw new Error(userMessage);
    }
    
    // Perform calculations in code to ensure accuracy
    const plotSize = rawInput.plotSize;
    const estimatedYield = aiOutput.yieldPerAcre * plotSize;
    const estimatedTotalValue = estimatedYield * aiOutput.marketPricePerKg;

    // Scale confidence interval
    const confidenceInterval = {
        lower: aiOutput.confidenceIntervalPerAcre.lower * plotSize,
        upper: aiOutput.confidenceIntervalPerAcre.upper * plotSize,
    };

    // Construct the final output object that the user will see
    const finalOutput: EstimateCropYieldOutput = {
        estimatedYield,
        estimatedTotalValue,
        confidenceInterval,
        marketPricePerKg: aiOutput.marketPricePerKg,
        currency: aiOutput.currency,
        priceUnit: aiOutput.priceUnit,
        explanation: aiOutput.explanation,
        suggestions: aiOutput.suggestions,
    };

    return finalOutput;
  }
);

    