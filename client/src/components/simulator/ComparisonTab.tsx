import React, { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useSimulation } from '@/contexts/SimulationContext';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export function ComparisonTab() {
  const { comparisonData } = useSimulation();
  const memoryChartRef = useRef<ChartJS>(null);
  const diskChartRef = useRef<ChartJS>(null);

  const hasMemoryData = comparisonData.lru !== null || comparisonData.arb !== null;
  const hasDiskData = comparisonData.cscan !== null || comparisonData.look !== null;

  // Memory chart data
  const memoryChartData = {
    labels: ['LRU', 'ARB'],
    datasets: [
      {
        label: 'Page Faults',
        data: [
          comparisonData.lru?.faults || 0,
          comparisonData.arb?.faults || 0
        ],
        backgroundColor: ['#f44336', '#3f51b5'],
      }
    ],
  };

  const memoryChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Page Faults Comparison',
      },
    },
  };

  // Disk chart data
  const diskChartData = {
    labels: ['C-SCAN', 'LOOK'],
    datasets: [
      {
        label: 'Seek Distance',
        data: [
          comparisonData.cscan?.seekDistance || 0,
          comparisonData.look?.seekDistance || 0
        ],
        backgroundColor: ['#f44336', '#3f51b5'],
      }
    ],
  };

  const diskChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Seek Distance Comparison',
      },
    },
  };

  // Calculate fault rates and efficiency percentages
  const calculateFaultRate = (faults: number, hits: number) => {
    if (faults + hits === 0) return 0;
    return (faults / (faults + hits)) * 100;
  };

  const calculateEfficiency = (seekDistance: number, cylinders: number) => {
    const maxPossible = cylinders * 2; // max theoretical seek distance
    if (maxPossible === 0) return 0;
    return ((1 - seekDistance / maxPossible) * 100);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="text-xl font-medium mb-6">Algorithm Comparison</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Memory Algorithm Comparison */}
          <div>
            <h3 className="text-lg font-medium mb-4">Virtual Memory Algorithms</h3>
            
            {!hasMemoryData ? (
              <div className="text-center py-6 text-[#757575] bg-gray-50 rounded-md">
                <p>Run memory simulations to see comparison</p>
              </div>
            ) : (
              <div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left">Algorithm</th>
                        <th className="px-4 py-2 text-right">Page Faults</th>
                        <th className="px-4 py-2 text-right">Page Hits</th>
                        <th className="px-4 py-2 text-right">Fault Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t">
                        <td className="px-4 py-3">LRU</td>
                        <td className="px-4 py-3 text-right">
                          {comparisonData.lru?.faults || '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {comparisonData.lru?.hits || '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {comparisonData.lru 
                            ? `${calculateFaultRate(comparisonData.lru.faults, comparisonData.lru.hits).toFixed(2)}%` 
                            : '-'}
                        </td>
                      </tr>
                      <tr className="border-t">
                        <td className="px-4 py-3">ARB</td>
                        <td className="px-4 py-3 text-right">
                          {comparisonData.arb?.faults || '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {comparisonData.arb?.hits || '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {comparisonData.arb 
                            ? `${calculateFaultRate(comparisonData.arb.faults, comparisonData.arb.hits).toFixed(2)}%` 
                            : '-'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-4 h-60">
                  <Bar 
                    ref={memoryChartRef}
                    data={memoryChartData} 
                    options={memoryChartOptions}
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Disk Algorithm Comparison */}
          <div>
            <h3 className="text-lg font-medium mb-4">Disk Scheduling Algorithms</h3>
            
            {!hasDiskData ? (
              <div className="text-center py-6 text-[#757575] bg-gray-50 rounded-md">
                <p>Run disk simulations to see comparison</p>
              </div>
            ) : (
              <div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left">Algorithm</th>
                        <th className="px-4 py-2 text-right">Seek Distance</th>
                        <th className="px-4 py-2 text-right">Efficiency</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t">
                        <td className="px-4 py-3">C-SCAN</td>
                        <td className="px-4 py-3 text-right">
                          {comparisonData.cscan?.seekDistance || '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {comparisonData.cscan 
                            ? `${calculateEfficiency(comparisonData.cscan.seekDistance, comparisonData.cscan.cylinders).toFixed(2)}%` 
                            : '-'}
                        </td>
                      </tr>
                      <tr className="border-t">
                        <td className="px-4 py-3">LOOK</td>
                        <td className="px-4 py-3 text-right">
                          {comparisonData.look?.seekDistance || '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {comparisonData.look 
                            ? `${calculateEfficiency(comparisonData.look.seekDistance, comparisonData.look.cylinders).toFixed(2)}%` 
                            : '-'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-4 h-60">
                  <Bar 
                    ref={diskChartRef}
                    data={diskChartData} 
                    options={diskChartOptions}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
