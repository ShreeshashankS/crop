
import { config } from 'dotenv';
config();

import '@/ai/flows/estimate-crop-yield.ts';
import '@/ai/tools/get-market-price-tool.ts';
import '@/ai/tools/get-weather-forecast-tool.ts';
