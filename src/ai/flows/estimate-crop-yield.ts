'use server';

/**
 * @fileOverview Estimates crop yield based on soil properties and crop type.
 *
 * - estimateCropYield - A function that estimates crop yield.
 * - EstimateCropYieldInput - The input type for the estimateCropYield function.
 * - EstimateCropYieldOutput - The return type for the estimateCropYield function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EstimateCropYieldInputSchema = z.object({
  cropType: z.string().describe('The type of crop to estimate yield for.'),
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
  estimatedYield: z.number().describe('The estimated crop yield in kilograms per 2-acre land space.'),
  confidenceInterval: z
    .object({
      lower: z.number().describe('The lower bound of the confidence interval.'),
      upper: z.number().describe('The upper bound of the confidence interval.'),
    })
    .describe('The confidence interval for the yield estimation.'),
  explanation: z.string().describe('An explanation of the factors influencing the yield estimation.'),
});

export type EstimateCropYieldOutput = z.infer<typeof EstimateCropYieldOutputSchema>;

export async function estimateCropYield(input: EstimateCropYieldInput): Promise<EstimateCropYieldOutput> {
  return estimateCropYieldFlow(input);
}

const prompt = ai.definePrompt({
  name: 'estimateCropYieldPrompt',
  input: {schema: EstimateCropYieldInputSchema},
  output: {schema: EstimateCropYieldOutputSchema},
  prompt: `You are an expert agricultural consultant. Based on the provided soil properties and crop type, estimate the crop yield for a 2-acre land space.

  Crop Type: {{{cropType}}}
  Soil Properties:
  {{#each this}}
    {{#if_not_empty this}}
      {{@key}}: {{{this}}}
    {{/if_not_empty}}
  {{/each}}

  Please provide:
  - estimatedYield: The estimated crop yield in kilograms.
  - confidenceInterval: A confidence interval (lower and upper bounds) for your estimation.
  - explanation: A brief explanation of the factors that influenced your estimation.

  You must output valid JSON.

  {{#each this}}
  {{#if_not_empty this}}
  {{/if_not_empty}}
  {{/each}}
  `,
  templateHelpers: {
    if_not_empty: function (this: any, conditional: any, options: any) {
      if (conditional) {
        return options.fn(this);
      } else {
        return options.inverse(this);
      }
    },
  },
});

const estimateCropYieldFlow = ai.defineFlow(
  {
    name: 'estimateCropYieldFlow',
    inputSchema: EstimateCropYieldInputSchema,
    outputSchema: EstimateCropYieldOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
