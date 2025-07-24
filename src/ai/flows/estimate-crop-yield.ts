
'use server';

/**
 * @fileOverview Estimates crop yield based on soil properties, crop type, and plot size,
 * and also estimates the total market value using a market price tool.
 *
 * - estimateCropYield - A function that estimates crop yield and value.
 * - EstimateCropYieldInput - The input type for the estimateCropYield function.
 * - EstimateCropYieldOutput - The return type for the estimateCropYield function.
 */

import {ai} from '@/ai/genkit';
import {getMarketPriceTool} from '@/ai/tools/get-market-price-tool';
import {z} from 'genkit';

const EstimateCropYieldInputSchema = z.object({
  cropType: z.string().describe('The type of crop to estimate yield for.'),
  plotSize: z.number().describe('The size of the land plot in acres.'),
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

const EstimateCropYieldOutputSchema = z.object({
  estimatedYield: z.number().describe('The total estimated crop yield in kilograms for the specified plot size.'),
  confidenceInterval: z
    .object({
      lower: z.number().describe('The lower bound of the confidence interval for yield.'),
      upper: z.number().describe('The upper bound of the confidence interval for yield.'),
    })
    .describe('The confidence interval for the yield estimation.'),
  marketPricePerKg: z.number().describe("The current market price per kilogram for the crop. THIS MUST BE THE EXACT NUMERIC 'price' VALUE AS RETURNED BY THE getMarketPrice TOOL."),
  currency: z.string().describe(
    "The currency for the market price. THIS MUST BE THE EXACT STRING VALUE FOR 'currency' AS RETURNED BY THE getMarketPrice TOOL. The tool is configured to return 'INR', so this field MUST be 'INR'."
  ),
  priceUnit: z.string().describe(
    "The unit for the market price. THIS MUST BE THE EXACT STRING VALUE FOR 'unit' AS RETURNED BY THE getMarketPrice TOOL. The tool typically returns 'kg'."
  ),
  estimatedTotalValue: z.number().describe('The total estimated market value of the crop yield, calculated as estimatedYield * marketPricePerKg, reflecting the INR currency.'),
  explanation: z.string().describe('An explanation of the factors influencing the yield and value estimation. If a photo was provided, include visual analysis of the photo in this explanation (e.g., color of soil, health of leaves). This explanation MUST reference the market price, currency (which will be INR), and unit as obtained directly from the getMarketPrice tool.'),
  suggestions: z.array(z.string()).describe('Actionable suggestions to improve soil quality and crop yield for the selected crop. Provide at least 2-3 specific recommendations.'),
});

export type EstimateCropYieldOutput = z.infer<typeof EstimateCropYieldOutputSchema>;

const PromptInputSchema = z.object({
  cropType: z.string().describe('The type of crop to estimate yield for.'),
  plotSize: z.number().describe('The size of the land plot in acres.'),
  photoDataUri: z.string().optional(),
  soilProperties: z.record(z.any()).describe('A key-value map of provided soil properties and their values.'),
});

export async function estimateCropYield(input: EstimateCropYieldInput): Promise<EstimateCropYieldOutput> {
  return estimateCropYieldFlow(input);
}

const prompt = ai.definePrompt({
  name: 'estimateCropYieldPrompt',
  input: {schema: PromptInputSchema},
  output: {schema: EstimateCropYieldOutputSchema},
  tools: [getMarketPriceTool],
  prompt: `You are an expert agricultural consultant and market analyst.
  Based on the provided crop type, plot size, soil properties, and the optional photo:
  1. If a photo is provided, analyze it for visual cues about soil quality, plant health, discoloration, pests, etc. Incorporate this visual analysis into your final 'explanation'.
  2. Estimate the total crop yield in kilograms.
  3. Use the 'getMarketPrice' tool to find the current market price for the specified '{{{cropType}}}'.
     The tool will return an object with 'price' (numeric), 'currency' (string, e.g., "INR"), and 'unit' (string, e.g., "kg") fields.
     IMPORTANT: The getMarketPrice tool is configured for the Indian market and will ALWAYS return the currency as 'INR'.
     When constructing your final JSON output:
       - The 'marketPricePerKg' field MUST be the exact numeric value from the tool's 'price' output.
       - The 'currency' field MUST be the exact string value from the tool's 'currency' output. Since the tool returns 'INR', this field MUST be 'INR'.
       - The 'priceUnit' field MUST be the exact string value from the tool's 'unit' output.
  4. Calculate the 'estimatedTotalValue' by multiplying the 'estimatedYield' (in kg) by the 'marketPricePerKg' (which is the tool's 'price' value). The total value should reflect the 'INR' currency.
  5. Provide a confidence interval for the yield estimation.
  6. Provide an explanation. This explanation MUST explicitly state the market price, currency (which will be INR), and unit exactly as obtained from the getMarketPrice tool. If a photo was analyzed, mention it here.
  7. As an expert agronomist, provide a list of 2-3 actionable 'suggestions' for improving the soil quality and crop yield based on the provided data. For example, if pH is low, suggest adding lime.
  
  Crop Type: {{{cropType}}}
  Plot Size: {{{plotSize}}} acres

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

  Please provide all fields as defined in the output schema.
  Ensure the 'currency' field in your output is 'INR', as per the tool's output.
  The estimatedTotalValue must be calculated using the 'price' from the tool and reflect 'INR'.
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
    const soilPropertiesForPrompt: Record<string, any> = {};
    for (const key in rawInput) {
      if (Object.prototype.hasOwnProperty.call(rawInput, key)) {
        if (key !== 'cropType' && key !== 'plotSize' && key !== 'photoDataUri') {
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
      promptArgs.photoDataUri = rawInput.photoDataUri;
    }

    const llmResponse = await prompt(promptArgs);

    if (!llmResponse.output) {
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
      } else if (rawText && (!rawText.trim().startsWith('{') || !rawText.trim().endsWith('}'))) {
         userMessage = 'The AI model response was not in the expected JSON format. It might be incomplete or contain extra text. Please check server logs.';
      }
      
      throw new Error(userMessage);
    }
    return llmResponse.output;
  }
);
