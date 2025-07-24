
import { getEstimationHistory, type EstimationHistory } from '@/lib/actions';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { History, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

export default async function HistoryPage() {
  const { success, data, error } = await getEstimationHistory();

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <Card className="max-w-6xl mx-auto shadow-xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center mb-4 sm:mb-0">
              <History className="mr-4 h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-3xl font-bold">Estimation History</CardTitle>
                <CardDescription>Review your past crop yield estimations.</CardDescription>
              </div>
            </div>
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Estimator
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && <p className="text-destructive text-center">{error}</p>}
          {!error && data && data.length === 0 && (
            <p className="text-muted-foreground text-center py-8">
              You have no saved estimations yet. Go back to the estimator to create one.
            </p>
          )}
          {data && data.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Crop Type</TableHead>
                    <TableHead>Plot Size (acres)</TableHead>
                    <TableHead>Estimated Yield</TableHead>
                    <TableHead>Market Price</TableHead>
                    <TableHead>Estimated Total Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item: EstimationHistory) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.createdAt ? format(new Date(item.createdAt), 'MMM d, yyyy, h:mm a') : 'N/A'}
                      </TableCell>
                      <TableCell>{item.cropType}</TableCell>
                      <TableCell>{item.plotSize}</TableCell>
                      <TableCell>{item.estimatedYield.toLocaleString()} kg</TableCell>
                      <TableCell>{item.marketPricePerKg.toLocaleString()} {item.currency} / {item.priceUnit}</TableCell>
                      <TableCell className="font-semibold">{item.estimatedTotalValue.toLocaleString()} {item.currency}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
