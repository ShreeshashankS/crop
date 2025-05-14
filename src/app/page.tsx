
import { CropYieldForm } from '@/components/crop-yield-form';
import { ThemeToggle } from '@/components/theme-toggle';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <CropYieldForm />
    </main>
  );
}
