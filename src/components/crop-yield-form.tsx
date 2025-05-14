
'use client';

import type { EstimateCropYieldOutput } from '@/ai/flows/estimate-crop-yield';
import { handleEstimateCropYield } from '@/lib/actions';
import { DEFAULT_CROP_OPTIONS, SOIL_PROPERTIES_CONFIG, GENERAL_CROP_ICON, type SoilPropertyConfig } from '@/lib/constants';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, ChevronsUpDown, Loader2, BarChart3, Square } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, ErrorBar } from 'recharts';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const formSchemaObject = {
  cropType: z.string().min(1, 'Crop type is required.'),
  plotSize: z.coerce.number().min(0.01, "Plot size must be at least 0.01 acres."),
  ...Object.fromEntries(
    SOIL_PROPERTIES_CONFIG.map((prop) => [
      prop.id,
      prop.type === 'number'
        ? z.coerce.number().min(prop.min ?? -Infinity).max(prop.max ?? Infinity).optional()
        : z.string().optional(),
    ])
  ),
};

const FormSchema = z.object(formSchemaObject);
type CropYieldFormData = z.infer<typeof FormSchema>;

export function CropYieldForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [estimationResult, setEstimationResult] = useState<EstimateCropYieldOutput | null>(null);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<CropYieldFormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      cropType: '',
      plotSize: 2, // Default plot size
      ...Object.fromEntries(SOIL_PROPERTIES_CONFIG.map((prop) => [prop.id, prop.defaultValue])),
    },
  });

  async function onSubmit(data: CropYieldFormData) {
    setIsLoading(true);
    setEstimationResult(null);
    
    const result = await handleEstimateCropYield(data);
    setIsLoading(false);

    if (result.success && result.data) {
      setEstimationResult(result.data);
      toast({
        title: 'Estimation Successful',
        description: `Yield for ${data.cropType} on ${data.plotSize} acres estimated.`,
      });
    } else {
      toast({
        title: 'Estimation Failed',
        description: result.error || 'An unknown error occurred.',
        variant: 'destructive',
      });
    }
  }

  const currentPlotSize = form.watch('plotSize');

  const chartData = estimationResult
    ? [
        {
          name: estimationResult.estimatedYield > 10000 ? `Yield (Tons / ${currentPlotSize} ac)` : `Yield (kg / ${currentPlotSize} ac)`,
          value: estimationResult.estimatedYield > 10000 ? estimationResult.estimatedYield / 1000 : estimationResult.estimatedYield,
          confidence: estimationResult.estimatedYield > 10000 ? [estimationResult.confidenceInterval.lower / 1000, estimationResult.confidenceInterval.upper / 1000] : [estimationResult.confidenceInterval.lower, estimationResult.confidenceInterval.upper]
        },
      ]
    : [];
  
  const selectedCropLabel = form.watch('cropType');
  const SelectedCropIcon = DEFAULT_CROP_OPTIONS.find(c => c.value === selectedCropLabel || c.label === selectedCropLabel)?.icon || GENERAL_CROP_ICON;


  return (
    <div className="container mx-auto py-8 px-4 md:px-0">
      <Card className="max-w-4xl mx-auto shadow-xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Image src="https://placehold.co/80x80.png" alt="CropPredict Logo" width={80} height={80} className="rounded-lg mr-4" data-ai-hint="agriculture logo" />
            <div>
              <CardTitle className="text-3xl font-bold text-primary">CropPredict</CardTitle>
              <CardDescription className="text-lg">AI-Powered Crop Yield Estimator</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <FormField
                  control={form.control}
                  name="cropType"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="font-semibold text-lg mb-1">Select or Enter Crop Type</FormLabel>
                      <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                'w-full justify-between',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value
                                ? DEFAULT_CROP_OPTIONS.find(
                                    (crop) => crop.value === field.value || crop.label.toLowerCase() === field.value.toLowerCase()
                                  )?.label || field.value
                                : 'Select crop...'}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                          <Command>
                            <CommandInput 
                              placeholder="Search crop or type custom..."
                              onValueChange={(currentValue) => {
                                  // Allow free text entry by directly setting field value
                                  // Update: if a predefined option is not exactly matched, treat as custom input.
                                  const matchedOption = DEFAULT_CROP_OPTIONS.find(crop => crop.label.toLowerCase() === currentValue.toLowerCase());
                                  if (matchedOption) {
                                    field.onChange(matchedOption.label);
                                  } else {
                                    field.onChange(currentValue);
                                  }
                              }}
                            />
                            <CommandList>
                              <CommandEmpty>No crop found. Type to add custom.</CommandEmpty>
                              <CommandGroup>
                                {DEFAULT_CROP_OPTIONS.map((crop) => (
                                  <CommandItem
                                    value={crop.label}
                                    key={crop.value}
                                    onSelect={() => {
                                      form.setValue('cropType', crop.label);
                                      setComboboxOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        'mr-2 h-4 w-4',
                                        crop.label === field.value || crop.value === field.value ? 'opacity-100' : 'opacity-0'
                                      )}
                                    />
                                    {crop.icon && <crop.icon className="mr-2 h-4 w-4" />}
                                    {crop.label}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="plotSize"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="font-semibold text-lg mb-1 flex items-center">
                        <Square className="mr-2 h-5 w-5 text-primary" />
                        Plot Size (acres)
                      </FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} 
                         onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            field.onChange(isNaN(val) ? undefined : val);
                         }}
                         value={field.value === undefined || isNaN(field.value as number) ? '' : field.value}
                        />
                      </FormControl>
                       <FormDescription>Enter the total acreage of the plot.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl text-primary">Soil & Environmental Properties</CardTitle>
                  <CardDescription>Adjust the sliders or enter values directly for each property. These are optional.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                  {SOIL_PROPERTIES_CONFIG.map((prop: SoilPropertyConfig) => (
                    <FormField
                      key={prop.id}
                      control={form.control}
                      name={prop.id as keyof CropYieldFormData}
                      render={({ field }) => {
                        const IconComponent = prop.icon;
                        // Ensure field.value is treated as number for calculations, but handle NaN for display
                        const numericValue = typeof field.value === 'string' ? parseFloat(field.value) : field.value as number;

                        return (
                          <FormItem>
                            <FormLabel className="flex items-center">
                              {IconComponent && <IconComponent className="mr-2 h-5 w-5 text-primary" />}
                              {prop.label} {prop.unit && `(${prop.unit})`}
                            </FormLabel>
                            {prop.type === 'number' ? (
                              <>
                                <div className="flex items-center gap-2">
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step={prop.step}
                                      min={prop.min}
                                      max={prop.max}
                                      {...field}
                                      onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        // Pass undefined if NaN so Zod optional validation works correctly
                                        field.onChange(isNaN(val) ? undefined : val); 
                                      }}
                                      // Display empty string if value is undefined or NaN
                                      value={field.value === undefined || isNaN(field.value as number) ? '' : field.value}
                                      placeholder={(prop.defaultValue !== undefined) ? String(prop.defaultValue) : ''}
                                      className="w-24"
                                    />
                                  </FormControl>
                                  <Slider
                                    min={prop.min}
                                    max={prop.max}
                                    step={prop.step}
                                    value={!isNaN(numericValue) ? [numericValue] : (prop.defaultValue !== undefined ? [prop.defaultValue as number] : [prop.min ?? 0])}
                                    onValueChange={(value) => field.onChange(value[0])}
                                    className="flex-1"
                                    disabled={isNaN(numericValue)} 
                                  />
                                </div>
                              </>
                            ) : (
                              <FormControl>
                                <Textarea
                                  {...field}
                                  value={(field.value as string) ?? ''}
                                  placeholder={prop.description || `Enter ${prop.label}`}
                                />
                              </FormControl>
                            )}
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                </CardContent>
              </Card>

              <CardFooter className="flex justify-center pt-6">
                <Button type="submit" disabled={isLoading} size="lg" className="w-full md:w-auto text-lg px-8 py-6">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Estimating...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="mr-2 h-5 w-5" />
                      Get Yield Estimate
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>

      {estimationResult && (
        <Card className="max-w-4xl mx-auto mt-8 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-primary flex items-center">
              {SelectedCropIcon && <SelectedCropIcon className="mr-3 h-8 w-8" />}
              Estimated Yield for {selectedCropLabel || 'Selected Crop'} ({currentPlotSize} acres)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg">Numerical Results:</h3>
              <p className="text-xl">
                Estimated Yield: <strong className="text-accent">{estimationResult.estimatedYield.toLocaleString()} kg</strong>
              </p>
              <p>
                Confidence Interval: {estimationResult.confidenceInterval.lower.toLocaleString()} kg - {estimationResult.confidenceInterval.upper.toLocaleString()} kg
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Explanation:</h3>
              <p className="text-muted-foreground italic">{estimationResult.explanation}</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Yield Graph (Total for {currentPlotSize} acres):</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis 
                    label={{ 
                      value: estimationResult.estimatedYield > 10000 ? 'Yield (Tons)' : 'Yield (kg)', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { textAnchor: 'middle' }
                    }}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip 
                    formatter={(value, name, props) => {
                      if (name.startsWith('Yield') && props.payload.confidence) {
                         const unit = estimationResult.estimatedYield > 10000 ? 'Tons' : 'kg';
                         const formattedValue = (value as number).toLocaleString();
                         const confLower = props.payload.confidence[0].toLocaleString();
                         const confUpper = props.payload.confidence[1].toLocaleString();
                         return [`${formattedValue} ${unit}`, `Confidence: ${confLower} - ${confUpper} ${unit}`];
                      }
                      return value;
                    }}
                  />
                  <Legend />
                  <Bar dataKey="value" name={estimationResult.estimatedYield > 10000 ? "Est. Yield (Tons)" : "Est. Yield (kg)"} fill="var(--color-primary)" /* Changed from var(--chart-1) to var(--color-primary) */>
                    <ErrorBar dataKey="confidence" width={15} strokeWidth={2} stroke="var(--color-accent)" /* Changed from var(--chart-2) to var(--color-accent) */ direction="y" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

