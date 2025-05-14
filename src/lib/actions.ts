'use server';

import { estimateCropYield, type EstimateCropYieldInput, type EstimateCropYieldOutput } from '@/ai/flows/estimate-crop-yield';
import { z } from 'zod';

const EstimateCropYieldInputSchema = z.object({
  cropType: z.string().min(1, "Crop type is required."),
  plotSize: z.coerce.number().min(0.01, "Plot size must be at least 0.01 acres."),
  magnesium: z.coerce.number().optional(),
  sodium: z.coerce.number().optional(),
  nitrogen: z.coerce.number().optional(),
  water: z.coerce.number().optional(),
  atmosphericGases: z.string().optional(),
  sunlight: z.coerce.number().optional(),
  pH: z.coerce.number().optional(),
  phosphorus: z.coerce.number().optional(),
  potassium: z.coerce.number().optional(),
  calcium: z.coerce.number().optional(),
  sulfur: z.coerce.number().optional(),
  iron: z.coerce.number().optional(),
  manganese: z.coerce.number().optional(),
  zinc: z.coerce.number().optional(),
  copper: z.coerce.number().optional(),
  boron: z.coerce.number().optional(),
  molybdenum: z.coerce.number().optional(),
  chlorine: z.coerce.number().optional(),
  nickel: z.coerce.number().optional(),
  aluminum: z.coerce.number().optional(),
  silicon: z.coerce.number().optional(),
  cobalt: z.coerce.number().optional(),
  vanadium: z.coerce.number().optional(),
  selenium: z.coerce.number().optional(),
  iodine: z.coerce.number().optional(),
  arsenic: z.coerce.number().optional(),
  lead: z.coerce.number().optional(),
  cadmium: z.coerce.number().optional(),
  mercury: z.coerce.number().optional(),
});


export async function handleEstimateCropYield(
  data: EstimateCropYieldInput
): Promise<{ success: boolean; data?: EstimateCropYieldOutput; error?: string }> {
  try {
    const validatedData = EstimateCropYieldInputSchema.parse(data);
    
    const cleanedData = Object.fromEntries(
        Object.entries(validatedData).filter(([_, v]) => v !== undefined)
    ) as EstimateCropYieldInput;


    if (!cleanedData.cropType) {
      return { success: false, error: "Crop type is required." };
    }
     if (cleanedData.plotSize === undefined) { // Should be caught by Zod, but as a safeguard
      return { success: false, error: "Plot size is required." };
    }
    
    const result = await estimateCropYield(cleanedData);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error in handleEstimateCropYield:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors.map(e => `${e.path.join('.')} - ${e.message}`).join(', ') };
    }
    if (error instanceof Error && error.message) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to estimate crop yield. Please try again.' };
  }
}
