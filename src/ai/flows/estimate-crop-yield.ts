
'use server';

/**
 * @fileOverview Estimates crop yield based on soil properties, crop type, and plot size.
 *
 * - estimateCropYield - A function that estimates crop yield.
 * - EstimateCropYieldInput - The input type for the estimateCropYield function.
 * - EstimateCropYieldOutput - The return type for the estimateCropYield function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { EstimateCropYieldInput as EstimateCropYieldInputType, EstimateCropYieldOutput as EstimateCropYieldOutputType } from '@/ai/flows/estimate-crop-yield';


const EstimateCropYieldInputSchema = z.object({
  cropType: z.string().describe('The type of crop to estimate yield for.'),
  plotSize: z.number().describe('The size of the land plot in acres.'),
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
      lower: z.number().describe('The lower bound of the confidence interval.'),
      upper: z.number().describe('The upper bound of the confidence interval.'),
    })
    .describe('The confidence interval for the yield estimation.'),
  explanation: z.string().describe('An explanation of the factors influencing the yield estimation.'),
});

export type EstimateCropYieldOutput = z.infer<typeof EstimateCropYieldOutputSchema>;

export async function estimateCropYield(input: EstimateCropYieldInputType): Promise<EstimateCropYieldOutputType> {
  return estimateCropYieldFlow(input);
}

const prompt = ai.definePrompt({
  name: 'estimateCropYieldPrompt',
  input: {schema: EstimateCropYieldInputSchema},
  output: {schema: EstimateCropYieldOutputSchema},
  prompt: `You are an expert agricultural consultant. Based on the provided crop type, plot size, and soil properties, estimate the total crop yield.

  Crop Type: {{{cropType}}}
  Plot Size: {{{plotSize}}} acres

  Soil Properties (only provided values are listed):
  {{#each this as |propertyValue propertyKey|}}
    {{#unless (or (eq propertyKey "cropType") (eq propertyKey "plotSize"))}}
      {{#is_present propertyValue}}
        - {{propertyKey}}: {{{propertyValue}}}
      {{/is_present}}
    {{/unless}}
  {{/each}}

  Please provide:
  - estimatedYield: The total estimated crop yield in kilograms for the {{{plotSize}}}-acre plot.
  - confidenceInterval: A confidence interval (lower and upper bounds) for your estimation in kilograms.
  - explanation: A brief explanation of the factors that influenced your estimation.

  You must output ONLY the valid JSON object defined in the schema, with no additional text or explanations outside of the JSON structure.`,
  templateHelpers: {
    eq: function (arg1: any, arg2: any, options: any) {
      return (String(arg1) == String(arg2)) ? options.fn(this) : options.inverse(this);
    },
    is_present: function(value: any, options: any) {
      if (value !== undefined && value !== null) {
        return options.fn(this); 
      }
      return options.inverse(this);
    },
    or: function(arg1: any, arg2: any, options: any) {
        return arg1 || arg2 ? options.fn(this) : options.inverse(this);
    }
  },
});

const estimateCropYieldFlow = ai.defineFlow(
  {
    name: 'estimateCropYieldFlow',
    inputSchema: EstimateCropYieldInputSchema,
    outputSchema: EstimateCropYieldOutputSchema,
  },
  async (input: EstimateCropYieldInputType): Promise<EstimateCropYieldOutputType> => {
    const llmResponse = await prompt(input);

    if (!llmResponse.output) {
      const rawText = llmResponse.text ?? "No raw text available from LLM.";
      const firstCandidate = llmResponse.candidates?.[0];
      const finishReason = firstCandidate?.finishReason ?? "Unknown";
      const safetyRatings = firstCandidate?.safetyRatings ?? [];
      
      console.error('LLM did not return valid structured output. Details:');
      console.error('  Raw text response from LLM:', rawText);
      console.error('  Finish reason:', finishReason);
      console.error('  Safety ratings:', JSON.stringify(safetyRatings, null, 2));
      console.error('  Input provided to LLM:', JSON.stringify(input, null, 2));


      let userMessage = 'The AI model did not return a valid estimation. Please check server logs for details.';
      if (finishReason === 'SAFETY') {
        userMessage = 'The AI model could not provide an estimation due to safety concerns. Please revise your input or check safety settings.';
      } else if (finishReason === 'MAX_TOKENS') {
        userMessage = 'The AI model response was too long. Please try with more specific inputs or a smaller plot size.';
      } else if (finishReason === 'STOP' && (!rawText || !rawText.trim().startsWith('{'))) { 
         userMessage = 'The AI model was unable to generate a response in the required format. It may have stopped prematurely or returned non-JSON text. Please check server logs.';
      } else if (['OTHER', 'UNKNOWN', 'UNSPECIFIED'].includes(finishReason)) {
        userMessage = 'An unexpected issue occurred with the AI model during generation. Please try again later or check server logs.';
      } else if (!rawText.trim().startsWith('{') || !rawText.trim().endsWith('}')) {
         userMessage = 'The AI model response was not in the expected JSON format. It might be incomplete or contain extra text. Please check server logs.';
      }
      
      throw new Error(userMessage);
    }
    return llmResponse.output;
  }
);
