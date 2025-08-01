
'use client';

import type { EstimateCropYieldOutput } from '@/ai/flows/estimate-crop-yield';
import { handleEstimateCropYield } from '@/lib/actions';
import { DEFAULT_CROP_OPTIONS, SOIL_PROPERTIES_CONFIG, GENERAL_CROP_ICON, type SoilPropertyConfig } from '@/lib/constants';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, ChevronsUpDown, Loader2, BarChart3, Square, Leaf, DollarSign, Info, Lightbulb, Beaker, Image as ImageIcon, X, MapPin } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
  location: z.string().optional(),
  photoDataUri: z.string().optional(),
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
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<CropYieldFormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      cropType: '',
      plotSize: 2, // Default plot size
      location: '',
      photoDataUri: undefined,
      ...Object.fromEntries(SOIL_PROPERTIES_CONFIG.map((prop) => [prop.id, prop.defaultValue])),
    },
  });
  
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setImagePreview(dataUri);
        form.setValue('photoDataUri', dataUri);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImagePreview(null);
    form.setValue('photoDataUri', undefined);
    // Reset the file input value
    const fileInput = document.getElementById('photo-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };


  async function onSubmit(data: CropYieldFormData) {
    setIsLoading(true);
    setEstimationResult(null);
    
    const result = await handleEstimateCropYield(data);
    setIsLoading(false);

    if (result.success && result.data) {
      setEstimationResult(result.data);
      toast({
        title: 'Estimation Successful',
        description: `Yield and value for ${data.cropType} on ${data.plotSize} acres estimated.`,
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
              <CardDescription className="text-lg">AI-Powered Crop Yield & Value Estimator</CardDescription>
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

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-lg mb-1 flex items-center">
                        <MapPin className="mr-2 h-5 w-5 text-primary" />
                        Location (Optional)
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Fresno, California" {...field} />
                      </FormControl>
                      <FormDescription>
                        Provide a location for a more accurate weather-based estimation.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              <Card>
                 <CardHeader>
                    <CardTitle className="text-xl text-primary flex items-center"><ImageIcon className="mr-2 h-5 w-5" />Visual Analysis (Optional)</CardTitle>
                    <CardDescription>Upload a photo of your soil or crop for a more detailed analysis.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="photoDataUri"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input id="photo-upload" type="file" accept="image/*" onChange={handleImageChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"/>
                          </FormControl>
                          {imagePreview && (
                            <div className="mt-4 relative w-48 h-48 border rounded-lg p-2">
                               <Image src={imagePreview} alt="Image preview" layout="fill" objectFit="cover" className="rounded-md" />
                               <Button
                                 type="button"
                                 variant="destructive"
                                 size="icon"
                                 className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                 onClick={clearImage}
                               >
                                 <X className="h-4 w-4" />
                               </Button>
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl text-primary flex items-center"><Beaker className="mr-2 h-5 w-5" />Soil & Environmental Properties</CardTitle>
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
                        const numericValue = typeof field.value === 'string' ? parseFloat(field.value) : (field.value as number);

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
                                      value={numericValue ?? ''}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        field.onChange(val === '' ? undefined : parseFloat(val));
                                      }}
                                      placeholder={(prop.defaultValue !== undefined) ? String(prop.defaultValue) : ''}
                                      className="w-24"
                                    />
                                  </FormControl>
                                  <Slider
                                    min={prop.min}
                                    max={prop.max}
                                    step={prop.step}
                                    value={!isNaN(numericValue) && numericValue !== undefined ? [numericValue] : undefined}
                                    onValueChange={(value) => field.onChange(value[0])}
                                    className="flex-1"
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
                      Get Yield & Value Estimate
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
              <SelectedCropIcon className="mr-3 h-8 w-8" />
              Estimated Yield & Value for {selectedCropLabel || 'Selected Crop'} ({currentPlotSize} acres)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-lg flex items-center mb-2">
                  <Leaf className="mr-2 h-5 w-5 text-green-600" />
                  Yield Estimation
                </h3>
                <p className="text-xl">
                  Estimated Yield: <strong className="text-accent">{estimationResult.estimatedYield.toLocaleString()} kg</strong>
                </p>
                <p className="text-sm text-muted-foreground">
                  Confidence Interval: {estimationResult.confidenceInterval.lower.toLocaleString()} kg - {estimationResult.confidenceInterval.upper.toLocaleString()} kg
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg flex items-center mb-2">
                   <DollarSign className="mr-2 h-5 w-5 text-yellow-500" />
                   Market Value Estimation
                </h3>
                <p className="text-xl">
                  Estimated Total Value: <strong className="text-accent">
                    {estimationResult.estimatedTotalValue.toLocaleString()} {estimationResult.currency}
                  </strong>
                </p>
                <p className="text-sm text-muted-foreground">
                  Market Price: {estimationResult.marketPricePerKg.toLocaleString()} {estimationResult.currency} / {estimationResult.priceUnit}
                </p>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg flex items-center mb-2">
                <Info className="mr-2 h-5 w-5 text-blue-500" />
                Explanation
              </h3>
              <p className="text-muted-foreground italic bg-muted p-3 rounded-md">{estimationResult.explanation}</p>
            </div>
            
            {estimationResult.suggestions && estimationResult.suggestions.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg flex items-center mb-2">
                  <Lightbulb className="mr-2 h-5 w-5 text-amber-500" />
                  Soil Improvement Suggestions
                </h3>
                <ul className="space-y-2 list-disc list-inside bg-muted p-4 rounded-md text-muted-foreground">
                  {estimationResult.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

    