
'use server';

/**
 * @fileOverview Suggests suitable crops based on soil and environmental conditions.
 *
 * - suggestSuitableCrop - A function that recommends crops.
 * - SuggestCropInput - The input type for the suggestSuitableCrop function.
 * - SuggestCropOutput - The return type for the suggestSuitableCrop function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input schema mirroring the soil/environmental properties from the main form
const SuggestCropInputSchema = z.object({
  location: z.string().optional(),
  magnesium: z.number().optional(),
  sodium: z.number().optional(),
  nitrogen: z.number().optional(),
  water: z.number().optional(),
  atmosphericGases: z.string().optional(),
  sunlight: z.number().optional(),
  pH: z.number().optional(),
  phosphorus: z.number().optional(),
  potassium: z.number().optional(),
  calcium: z.number().optional(),
  sulfur: z.number().optional(),
  iron: z.number().optional(),
  manganese: z.number().optional(),
  zinc: z.number().optional(),
  copper: z.number().optional(),
  boron: z.number().optional(),
  molybdenum: z.number().optional(),
  chlorine: z.number().optional(),
  nickel: z.number().optional(),
  aluminum: z.number().optional(),
  silicon: z.number().optional(),
  cobalt: z.number().optional(),
  vanadium: z.number().optional(),
  selenium: z.number().optional(),
  iodine: z.number().optional(),
  arsenic: z.number().optional(),
  lead: z.number().optional(),
  cadmium: z.number().optional(),
  mercury: z.number().optional(),
});
export type SuggestCropInput = z.infer<typeof SuggestCropInputSchema>;


const SuggestedCropSchema = z.object({
    cropName: z.string().describe('The common name of the suggested crop.'),
    reasoning: z.string().describe('A brief explanation of why this crop is suitable for the given soil and environmental conditions.'),
});

// The final output will be a list of these suggestions.
const SuggestCropOutputSchema = z.object({
    suggestions: z.array(SuggestedCropSchema).describe('A list of 3-5 suitable crop suggestions.'),
});

export type SuggestCropOutput = z.infer<typeof SuggestCropOutputSchema>;


export async function suggestSuitableCrop(input: SuggestCropInput): Promise<SuggestCropOutput> {
  return suggestSuitableCropFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSuitableCropPrompt',
  input: {schema: SuggestCropInputSchema},
  output: {schema: SuggestCropOutputSchema},
  prompt: `You are an expert agricultural consultant. Your task is to suggest a list of 3 to 5 suitable crops based on the provided soil and environmental data.

Analyze all the provided data points. For each suggested crop, provide a clear and concise reasoning explaining why it is a good fit for the given conditions.

  {{#if location}}
  Location: {{{location}}}
  {{/if}}

  Soil and Environmental Properties (only provided values are listed):
  {{#each this as |propertyValue propertyKey|}}
    - {{propertyKey}}: {{{propertyValue}}}
  {{else}}
    No soil or environmental properties were provided.
  {{/each}}

  You must output ONLY the valid JSON object defined in the schema, with no additional text or explanations outside of the JSON structure.
  `,
});


const suggestSuitableCropFlow = ai.defineFlow(
    {
        name: 'suggestSuitableCropFlow',
        inputSchema: SuggestCropInputSchema,
        outputSchema: SuggestCropOutputSchema,
    },
    async (input) => {
        const { output } = await prompt(input);

        if (!output) {
            throw new Error('The AI model was unable to suggest any crops for the given conditions.');
        }

        return output;
    }
);
