import type { LucideIcon } from 'lucide-react';
import { Leaf, Droplets, Cloud, Sun, FlaskConical, Layers, Atom, AlertTriangle, TestTube2, Sprout, Tractor } from 'lucide-react';

export interface SoilPropertyConfig {
  id: string;
  label: string;
  unit?: string;
  icon?: LucideIcon;
  defaultValue: number | string;
  min?: number;
  max?: number;
  step?: number;
  type: 'number' | 'text' | 'textarea';
  description?: string;
}

export const SOIL_PROPERTIES_CONFIG: SoilPropertyConfig[] = [
  { id: 'nitrogen', label: 'Nitrogen', unit: 'ppm', icon: Leaf, defaultValue: 100, min: 0, max: 500, step: 1, type: 'number' },
  { id: 'phosphorus', label: 'Phosphorus', unit: 'ppm', icon: Layers, defaultValue: 20, min: 0, max: 100, step: 1, type: 'number' },
  { id: 'potassium', label: 'Potassium', unit: 'ppm', icon: Atom, defaultValue: 150, min: 0, max: 500, step: 1, type: 'number' },
  { id: 'pH', label: 'Soil pH', icon: TestTube2, defaultValue: 6.5, min: 0, max: 14, step: 0.1, type: 'number' },
  { id: 'water', label: 'Water Content', unit: '%', icon: Droplets, defaultValue: 25, min: 0, max: 100, step: 1, type: 'number' },
  { id: 'sunlight', label: 'Sunlight Hours', unit: 'hrs/day', icon: Sun, defaultValue: 6, min: 0, max: 24, step: 0.5, type: 'number' },
  { id: 'magnesium', label: 'Magnesium', unit: 'ppm', icon: FlaskConical, defaultValue: 50, min: 0, max: 200, step: 1, type: 'number' },
  { id: 'sodium', label: 'Sodium', unit: 'ppm', icon: FlaskConical, defaultValue: 30, min: 0, max: 200, step: 1, type: 'number' },
  { id: 'calcium', label: 'Calcium', unit: 'ppm', icon: FlaskConical, defaultValue: 1000, min: 0, max: 5000, step: 10, type: 'number' },
  { id: 'sulfur', label: 'Sulfur', unit: 'ppm', icon: FlaskConical, defaultValue: 20, min: 0, max: 100, step: 1, type: 'number' },
  { id: 'iron', label: 'Iron', unit: 'ppm', icon: FlaskConical, defaultValue: 5, min: 0, max: 50, step: 0.1, type: 'number' },
  { id: 'manganese', label: 'Manganese', unit: 'ppm', icon: FlaskConical, defaultValue: 2, min: 0, max: 20, step: 0.1, type: 'number' },
  { id: 'zinc', label: 'Zinc', unit: 'ppm', icon: FlaskConical, defaultValue: 1, min: 0, max: 10, step: 0.1, type: 'number' },
  { id: 'copper', label: 'Copper', unit: 'ppm', icon: FlaskConical, defaultValue: 0.5, min: 0, max: 5, step: 0.05, type: 'number' },
  { id: 'boron', label: 'Boron', unit: 'ppm', icon: FlaskConical, defaultValue: 0.5, min: 0, max: 5, step: 0.05, type: 'number' },
  { id: 'molybdenum', label: 'Molybdenum', unit: 'ppm', icon: FlaskConical, defaultValue: 0.1, min: 0, max: 1, step: 0.01, type: 'number' },
  { id: 'chlorine', label: 'Chlorine', unit: 'ppm', icon: FlaskConical, defaultValue: 10, min: 0, max: 100, step: 1, type: 'number' },
  { id: 'nickel', label: 'Nickel', unit: 'ppm', icon: FlaskConical, defaultValue: 0.1, min: 0, max: 1, step: 0.01, type: 'number' },
  { id: 'aluminum', label: 'Aluminum', unit: 'ppm', icon: FlaskConical, defaultValue: 5, min: 0, max: 50, step: 1, type: 'number' },
  { id: 'silicon', label: 'Silicon', unit: 'ppm', icon: FlaskConical, defaultValue: 20, min: 0, max: 100, step: 1, type: 'number' },
  { id: 'cobalt', label: 'Cobalt', unit: 'ppm', icon: FlaskConical, defaultValue: 0.05, min: 0, max: 0.5, step: 0.01, type: 'number' },
  { id: 'vanadium', label: 'Vanadium', unit: 'ppm', icon: FlaskConical, defaultValue: 0.05, min: 0, max: 0.5, step: 0.01, type: 'number' },
  { id: 'selenium', label: 'Selenium', unit: 'ppm', icon: FlaskConical, defaultValue: 0.02, min: 0, max: 0.2, step: 0.01, type: 'number' },
  { id: 'iodine', label: 'Iodine', unit: 'ppm', icon: FlaskConical, defaultValue: 0.01, min: 0, max: 0.1, step: 0.005, type: 'number' },
  { id: 'atmosphericGases', label: 'Atmospheric Gases', icon: Cloud, defaultValue: 'Standard Earth Atmosphere (Nitrogen, Oxygen, CO2, etc.)', type: 'textarea', description: 'Describe atmospheric gas composition if different from standard.' },
  { id: 'arsenic', label: 'Arsenic', unit: 'ppm', icon: AlertTriangle, defaultValue: 0.01, min: 0, max: 1, step: 0.01, type: 'number' },
  { id: 'lead', label: 'Lead', unit: 'ppm', icon: AlertTriangle, defaultValue: 0.1, min: 0, max: 5, step: 0.1, type: 'number' },
  { id: 'cadmium', label: 'Cadmium', unit: 'ppm', icon: AlertTriangle, defaultValue: 0.01, min: 0, max: 0.5, step: 0.01, type: 'number' },
  { id: 'mercury', label: 'Mercury', unit: 'ppm', icon: AlertTriangle, defaultValue: 0.001, min: 0, max: 0.1, step: 0.001, type: 'number' },
];

export const DEFAULT_CROP_OPTIONS: { value: string; label: string, icon?: LucideIcon }[] = [
  { value: 'corn', label: 'Corn', icon: Sprout },
  { value: 'wheat', label: 'Wheat', icon: Sprout },
  { value: 'rice', label: 'Rice', icon: Sprout },
  { value: 'soybeans', label: 'Soybeans', icon: Sprout },
  { value: 'potatoes', label: 'Potatoes', icon: Sprout },
  { value: 'tomatoes', label: 'Tomatoes', icon: Sprout },
  { value: 'cotton', label: 'Cotton', icon: Sprout },
  { value: 'barley', label: 'Barley', icon: Sprout },
  { value: 'sugarcane', label: 'Sugarcane', icon: Sprout },
  { value: 'apples', label: 'Apples', icon: Sprout },
  { value: 'carrots', label: 'Carrots', icon: Sprout },
  { value: 'maize', label: 'Maize', icon: Sprout },
];

export const GENERAL_CROP_ICON = Tractor;
