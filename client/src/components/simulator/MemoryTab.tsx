import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, RefreshCw, AlertCircle } from 'lucide-react';
import { useSimulation } from '@/contexts/SimulationContext';
import { MemoryResult, simulateLRU, simulateARB } from '@/lib/algorithms/memory';
import { validateMemoryInput } from '@/lib/validators';
import { MemoryVisualization } from './MemoryVisualization';

export function MemoryTab() {
  const { updateMemoryComparison } = useSimulation();
  const [algorithm, setAlgorithm] = useState<'lru' | 'arb'>('lru');
  const [frames, setFrames] = useState('');
  const [referenceString, setReferenceString] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<MemoryResult | null>(null);
  const [showResults, setShowResults] = useState(false);

  const handleRun = () => {
    // Validate inputs
    const validation = validateMemoryInput(frames, referenceString);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    // Clear any previous errors
    setError('');

    // Run the selected algorithm
    let simulationResult: MemoryResult;
    if (algorithm === 'lru') {
      simulationResult = simulateLRU(validation.frameCount!, validation.refArray!);
    } else {
      simulationResult = simulateARB(validation.frameCount!, validation.refArray!);
    }

    // Update results
    setResult(simulationResult);
    setShowResults(true);

    // Update comparison data
    updateMemoryComparison(algorithm, simulationResult);
  };

  const handleReset = () => {
    setFrames('');
    setReferenceString('');
    setError('');
    setShowResults(false);
    setResult(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Input Panel */}
      <Card className="lg:col-span-1">
        <CardContent className="pt-6">
          <h2 className="text-xl font-medium mb-4">Input Parameters</h2>
          
          <div className="mb-4">
            <Label htmlFor="memoryAlgorithm" className="text-sm font-medium text-[#757575] mb-1">Algorithm</Label>
            <Select 
              value={algorithm} 
              onValueChange={(value) => setAlgorithm(value as 'lru' | 'arb')}
            >
              <SelectTrigger id="memoryAlgorithm" className="w-full">
                <SelectValue placeholder="Select algorithm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lru">Least Recently Used (LRU)</SelectItem>
                <SelectItem value="arb">Additional Reference Bit (ARB)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="mb-4">
            <Label htmlFor="frames" className="text-sm font-medium text-[#757575] mb-1">Number of Frames</Label>
            <Input 
              id="frames" 
              type="number" 
              min="1" 
              value={frames}
              onChange={(e) => setFrames(e.target.value)}
              placeholder="Enter number of frames"
              className="w-full" 
            />
            <p className="text-xs text-[#757575] mt-1">Enter a positive integer value</p>
          </div>
          
          <div className="mb-6">
            <Label htmlFor="referenceString" className="text-sm font-medium text-[#757575] mb-1">Reference String</Label>
            <Input 
              id="referenceString" 
              type="text" 
              value={referenceString}
              onChange={(e) => setReferenceString(e.target.value)}
              placeholder="e.g., 7 0 1 2 0 3 0 4 2 3"
              className="w-full" 
            />
            <p className="text-xs text-[#757575] mt-1">Enter space-separated page numbers</p>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-[#f44336] bg-opacity-10 text-[#f44336] rounded-md flex">
              <AlertCircle className="h-5 w-5 mr-2" />
              <p className="text-sm">{error}</p>
            </div>
          )}
          
          <div className="flex space-x-4">
            <Button onClick={handleRun} className="bg-primary text-white">
              <Play className="h-4 w-4 mr-1" />
              Run
            </Button>
            <Button onClick={handleReset} variant="outline">
              <RefreshCw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Results Panel */}
      <Card className="lg:col-span-2">
        <CardContent className="pt-6">
          <h2 className="text-xl font-medium mb-4">Simulation Results</h2>
          
          {!showResults ? (
            <div className="text-center py-8 text-[#757575]">
              <Memory className="h-16 w-16 mx-auto mb-2 text-[#757575]" />
              <p>Configure parameters and click Run to start the simulation</p>
            </div>
          ) : result && (
            <MemoryVisualization result={result} algorithm={algorithm} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Memory(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 19v-3"></path>
      <path d="M10 19v-3"></path>
      <path d="M14 19v-3"></path>
      <path d="M18 19v-3"></path>
      <path d="M8 11V9"></path>
      <path d="M16 11V9"></path>
      <path d="M12 11V9"></path>
      <path d="M2 15h20"></path>
      <path d="M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1.1a2 2 0 0 0 0 3.837V17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-5.1a2 2 0 0 0 0-3.837Z"></path>
    </svg>
  );
}
