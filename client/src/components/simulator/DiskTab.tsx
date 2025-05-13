import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Play,
  RefreshCw,
  AlertCircle,
  HardDrive,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { useSimulation } from "@/contexts/SimulationContext";
import { DiskResult, simulateLOOK, simulateCSCAN } from "@/lib/algorithms/disk";
import { validateDiskInput } from "@/lib/validators";
import { DiskVisualization } from "./DiskVisualization";
import { Switch } from "@/components/ui/switch";

// Define the available disk scheduling algorithms
type DiskAlgorithm = "look" | "cscan";

export function DiskTab() {
  const { updateDiskComparison } = useSimulation();
  const [algorithm, setAlgorithm] = useState<DiskAlgorithm>("look");
  const [totalCylinders, setTotalCylinders] = useState("");
  const [headPosition, setHeadPosition] = useState("");
  const [requestQueue, setRequestQueue] = useState("");
  const [initialDirection, setInitialDirection] = useState(true); // true = towards higher cylinders
  const [error, setError] = useState("");
  const [result, setResult] = useState<DiskResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [cylinderCount, setCylinderCount] = useState(0);

  const handleRun = () => {
    // Validate inputs
    const validation = validateDiskInput(
      totalCylinders,
      headPosition,
      requestQueue
    );
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    // Clear any previous errors
    setError("");

    // Run the selected algorithm
    let simulationResult: DiskResult;

    switch (algorithm) {
      case "look":
        simulationResult = simulateLOOK(
          validation.cylinders!,
          validation.start!,
          validation.requestArray!,
          initialDirection
        );
        break;
      case "cscan":
        simulationResult = simulateCSCAN(
          validation.cylinders!,
          validation.start!,
          validation.requestArray!,
          initialDirection
        );
        break;
      default:
        simulationResult = simulateLOOK(
          validation.cylinders!,
          validation.start!,
          validation.requestArray!,
          initialDirection
        );
    }

    // Update results
    setResult(simulationResult);
    setCylinderCount(validation.cylinders!);
    setShowResults(true);

    // Update comparison data
    updateDiskComparison(algorithm, simulationResult, validation.cylinders!);
  };

  const handleReset = () => {
    setTotalCylinders("");
    setHeadPosition("");
    setRequestQueue("");
    setError("");
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
            <Label
              htmlFor="diskAlgorithm"
              className="text-sm font-medium text-[#757575] mb-1"
            >
              Algorithm
            </Label>
            <Select
              value={algorithm}
              onValueChange={(value) => setAlgorithm(value as DiskAlgorithm)}
            >
              <SelectTrigger id="diskAlgorithm" className="w-full">
                <SelectValue placeholder="Select algorithm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="look">LOOK</SelectItem>
                <SelectItem value="cscan">C-SCAN (Circular SCAN)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mb-4">
            <Label
              htmlFor="initialDirection"
              className="text-sm font-medium text-[#757575] mb-1"
            >
              Initial Direction
            </Label>
            <div className="flex items-center justify-between mt-2 p-3 border rounded-md">
              <div className="flex items-center">
                {initialDirection ? (
                  <ArrowRight className="h-5 w-5 mr-2 text-[#3f51b5]" />
                ) : (
                  <ArrowLeft className="h-5 w-5 mr-2 text-[#3f51b5]" />
                )}
                <span>
                  {initialDirection
                    ? "Towards higher cylinder numbers"
                    : "Towards lower cylinder numbers"}
                </span>
              </div>
              <Switch
                id="initialDirection"
                checked={initialDirection}
                onCheckedChange={setInitialDirection}
              />
            </div>
          </div>

          <div className="mb-4">
            <Label
              htmlFor="totalCylinders"
              className="text-sm font-medium text-[#757575] mb-1"
            >
              Total Cylinders
            </Label>
            <Input
              id="totalCylinders"
              type="number"
              min="1"
              value={totalCylinders}
              onChange={(e) => setTotalCylinders(e.target.value)}
              placeholder="e.g., 200"
              className="w-full"
            />
            <p className="text-xs text-[#757575] mt-1">
              Enter a positive integer value
            </p>
          </div>

          <div className="mb-4">
            <Label
              htmlFor="headPosition"
              className="text-sm font-medium text-[#757575] mb-1"
            >
              Initial Head Position
            </Label>
            <Input
              id="headPosition"
              type="number"
              min="0"
              value={headPosition}
              onChange={(e) => setHeadPosition(e.target.value)}
              placeholder="e.g., 50"
              className="w-full"
            />
            <p className="text-xs text-[#757575] mt-1">
              Enter a non-negative integer within range
            </p>
          </div>

          <div className="mb-6">
            <Label
              htmlFor="requestQueue"
              className="text-sm font-medium text-[#757575] mb-1"
            >
              Request Queue
            </Label>
            <Input
              id="requestQueue"
              type="text"
              value={requestQueue}
              onChange={(e) => setRequestQueue(e.target.value)}
              placeholder="e.g., 82,170,43,140,24,16,190"
              className="w-full"
            />
            <p className="text-xs text-[#757575] mt-1">
              Enter comma-separated cylinder numbers
            </p>
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
              <HardDrive className="h-16 w-16 mx-auto mb-2 text-[#757575]" />
              <p>Configure parameters and click Run to start the simulation</p>
            </div>
          ) : (
            result && (
              <DiskVisualization
                result={result}
                cylinders={cylinderCount}
                algorithm={algorithm}
                initialDirection={initialDirection}
              />
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
