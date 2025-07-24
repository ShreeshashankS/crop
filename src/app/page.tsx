
import { CropYieldForm } from '@/components/crop-yield-form';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { History } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <Button asChild variant="outline" size="icon">
          <Link href="/history">
            <History className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">View History</span>
          </Link>
        </Button>
        <ThemeToggle />
      </div>
      <CropYieldForm />
    </main>
  );
}
