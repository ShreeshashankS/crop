
'use server';

import { estimateCropYield, type EstimateCropYieldInput, type EstimateCropYieldOutput } from '@/ai/flows/estimate-crop-yield';
import { z } from 'zod';
import { db } from '@/lib/firebase/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy } from 'firebase/firestore';

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

export type EstimationHistory = EstimateCropYieldOutput & {
  id: string;
  createdAt: string;
  cropType: string;
  plotSize: number;
};

async function saveEstimation(
  data: EstimateCropYieldOutput,
  input: EstimateCropYieldInput
): Promise<{ success: boolean; error?: string }> {
  try {
    await addDoc(collection(db, 'estimations'), {
      ...data,
      cropType: input.cropType,
      plotSize: input.plotSize,
      createdAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error saving estimation to Firestore:', error);
    // This error is not returned to the user to avoid interrupting the main flow
    return { success: false, error: 'Failed to save estimation history.' };
  }
}

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
    if (cleanedData.plotSize === undefined) {
      return { success: false, error: "Plot size is required." };
    }
    
    const result = await estimateCropYield(cleanedData);

    // Save the result to Firestore, but don't block the user if it fails
    saveEstimation(result, cleanedData);

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

export async function getEstimationHistory(): Promise<{
  success: boolean;
  data?: EstimationHistory[];
  error?: string;
}> {
  try {
    const q = query(collection(db, 'estimations'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const history: EstimationHistory[] = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Convert Firestore Timestamp to JSON-serializable string
        createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
      } as EstimationHistory;
    });
    return { success: true, data: history };
  } catch (error) {
    console.error('Error fetching estimation history:', error);
    return { success: false, error: 'Failed to fetch estimation history.' };
  }
}
