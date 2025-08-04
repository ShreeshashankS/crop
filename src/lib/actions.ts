
'use server';

import { estimateCropYield, type EstimateCropYieldInput, type EstimateCropYieldOutput } from '@/ai/flows/estimate-crop-yield';
import { suggestSuitableCrop, type SuggestCropInput, type SuggestCropOutput } from '@/ai/flows/suggest-suitable-crop';
import { z } from 'zod';
import { db } from '@/lib/firebase/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy } from 'firebase/firestore';

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
    // The incoming data from the form should already match the EstimateCropYieldInput type.
    // We can perform any final cleaning or validation here if necessary.
    const cleanedData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined && v !== '' && v !== null)
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

export async function handleSuggestCrop(
  data: SuggestCropInput
): Promise<{ success: boolean; data?: SuggestCropOutput; error?: string }> {
  try {
    const cleanedData = Object.fromEntries(
      Object.entries(data).filter(([key, v]) => 
        v !== undefined && v !== '' && v !== null && !['cropType', 'plotSize', 'photoDataUri'].includes(key)
      )
    ) as SuggestCropInput;

    const result = await suggestSuitableCrop(cleanedData);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error in handleSuggestCrop:', error);
    if (error instanceof Error && error.message) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to suggest crops. Please try again.' };
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
