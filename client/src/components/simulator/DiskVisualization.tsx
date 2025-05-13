import React, { useState, useEffect, useRef } from "react";
import { DiskResult } from "@/lib/algorithms/disk";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCw,
  ArrowUp,
  ArrowDown,
  MoveHorizontal,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface DiskVisualizationProps {
  result: DiskResult;
  cylinders: number;
  algorithm: "cscan" | "look";
  initialDirection?: boolean; // true = towards higher cylinders, false = towards lower cylinders
}

export function DiskVisualization({
  result,
  cylinders,
  algorithm,
  initialDirection = true,
}: DiskVisualizationProps) {
  const [animationStep, setAnimationStep] = useState(1); // Start with 1 to include initial position
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const animationRef = useRef<number | null>(null);

  // Animation timing (in ms)
  const BASE_DELAY = 1000;

  // Stop animation when component unmounts
  useEffect(() => {
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Direction changes for algorithms
  const getDirectionChanges = () => {
    const directions: { position: number; type: "up" | "down" | "jump" }[] = [];
    const seq = result.sequence;

    // Add direction changes based on algorithm
    if (algorithm === "cscan") {
      // Find the jump from highest to lowest (wrap around) or lowest to highest
      for (let i = 1; i < seq.length; i++) {
        if (
          (initialDirection &&
            seq[i] < seq[i - 1] &&
            seq[i - 1] - seq[i] > cylinders / 2) ||
          (!initialDirection &&
            seq[i] > seq[i - 1] &&
            seq[i] - seq[i - 1] > cylinders / 2)
        ) {
          directions.push({ position: i, type: "jump" });
          break;
        }
      }
    } else if (algorithm === "look") {
      // Find the change in direction
      for (let i = 1; i < seq.length - 1; i++) {
        if (
          (initialDirection && seq[i] > seq[i - 1] && seq[i + 1] < seq[i]) ||
          (!initialDirection && seq[i] < seq[i - 1] && seq[i + 1] > seq[i])
        ) {
          directions.push({
            position: i,
            type: initialDirection ? "down" : "up",
          });
          break;
        }
      }
    }

    return directions;
  };

  const directionChanges = getDirectionChanges();

  // Handle play/pause animation
  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const startTime = Date.now();
    let lastStepTime = startTime;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - lastStepTime;
      const stepDelay = BASE_DELAY / playbackSpeed;

      if (elapsed >= stepDelay) {
        lastStepTime = now;

        // Go to next step or stop at the end
        if (animationStep < result.sequence.length) {
          setAnimationStep((prev) => prev + 1);
        } else {
          setIsPlaying(false);
          return;
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, animationStep, playbackSpeed, result.sequence.length]);

  const handlePlay = () => {
    if (animationStep >= result.sequence.length) {
      // If at the end, restart from beginning
      setAnimationStep(1);
    }
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setAnimationStep(1);
  };

  const handleStepForward = () => {
    if (animationStep < result.sequence.length) {
      setAnimationStep((prev) => prev + 1);
    }
  };

  const handleStepBack = () => {
    if (animationStep > 1) {
      setAnimationStep((prev) => prev - 1);
    }
  };

  const handleSliderChange = (value: number[]) => {
    setAnimationStep(value[0]);
    setIsPlaying(false);
  };

  // Generate chart data for animation
  const animatedData = result.sequence.slice(0, animationStep);
  let seekDistanceSoFar = 0;

  if (animationStep > 1) {
    // Calculate seek distance up to current step
    for (let i = 1; i < animationStep; i++) {
      seekDistanceSoFar += Math.abs(
        result.sequence[i] - result.sequence[i - 1]
      );
    }
  }

  // Highlight current request in the visualization
  const pointBackgroundColors = result.sequence.map((_, index) => {
    if (index === 0) return "#ff4081"; // Initial position is always highlighted
    if (index === animationStep - 1 && index > 0) return "#4caf50"; // Current request
    if (index < animationStep) return "#3f51b5"; // Already processed
    return "rgba(200, 200, 200, 0.5)"; // Not processed yet
  });

  const pointBorderColors = result.sequence.map((_, index) => {
    if (index === 0) return "#ff4081";
    if (index === animationStep - 1 && index > 0) return "#4caf50";
    if (index < animationStep) return "#3f51b5";
    return "rgba(200, 200, 200, 0.5)";
  });

  const pointRadiuses = result.sequence.map((_, index) => {
    if (index === 0) return 8; // Initial position
    if (index === animationStep - 1 && index > 0) return 8; // Current request
    if (index < animationStep) return 6; // Already processed
    return 4; // Not processed yet
  });

  // Draw the chart
  const chartData = {
    labels: Array.from(
      { length: result.sequence.length },
      (_, i) => `Step ${i}`
    ),
    datasets: [
      {
        label: algorithm === "cscan" ? "C-SCAN Path" : "LOOK Path",
        data: result.sequence,
        borderColor: "#3f51b5",
        backgroundColor: pointBackgroundColors,
        pointRadius: pointRadiuses,
        pointHoverRadius: 8,
        pointBorderColor: pointBorderColors,
        pointBorderWidth: 2,
        // Show line only for processed steps
        segment: {
          borderColor: (ctx: any) => {
            // If either point is beyond our current step, don't show line
            if (
              ctx.p0DataIndex >= animationStep ||
              ctx.p1DataIndex >= animationStep
            ) {
              return "rgba(0, 0, 0, 0)";
            }

            // Check for direction changes (for C-SCAN's jump)
            const jumpPoint = directionChanges.find(
              (d) =>
                d.type === "jump" &&
                ctx.p0DataIndex === d.position - 1 &&
                ctx.p1DataIndex === d.position
            );

            if (jumpPoint) {
              return "rgba(255, 64, 129, 0.7)"; // Jump line color
            }

            return "#3f51b5";
          },
          borderDash: (ctx: any) => {
            // If this segment is a jump in C-SCAN, make it dashed
            const jumpPoint = directionChanges.find(
              (d) =>
                d.type === "jump" &&
                ctx.p0DataIndex === d.position - 1 &&
                ctx.p1DataIndex === d.position
            );

            if (jumpPoint) {
              return [5, 5]; // Dashed line for jumps
            }

            return undefined; // Normal line
          },
        },
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: true,
          text: "Request Sequence",
        },
      },
      y: {
        title: {
          display: true,
          text: "Cylinder Position",
        },
        min: 0,
        max: cylinders - 1,
      },
    },
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: `${algorithm === "cscan" ? "C-SCAN" : "LOOK"} Disk Scheduling`,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `Cylinder: ${context.raw}`;
          },
        },
      },
    },
  };

  // Get the initial direction arrow
  const DirectionArrow = initialDirection ? ArrowRight : ArrowLeft;

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Current Status</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-[#757575]">Seek Distance So Far</p>
            <p className="text-2xl font-medium text-[#3f51b5]">
              {seekDistanceSoFar}{" "}
              <span className="text-sm text-[#757575]">
                / {result.seekDistance}
              </span>
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-[#757575]">Current Cylinder</p>
            <p className="text-2xl font-medium text-[#4caf50]">
              {animationStep > 0 ? result.sequence[animationStep - 1] : "-"}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-4 px-4 py-2 bg-blue-50 rounded-md border border-blue-200 flex items-center">
        <DirectionArrow className="h-5 w-5 mr-2 text-blue-600" />
        <span className="text-sm text-blue-700">
          Initial Direction:{" "}
          {initialDirection
            ? "Towards higher cylinder numbers"
            : "Towards lower cylinder numbers"}
        </span>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Disk Movement Visualization</h3>
          <div className="flex space-x-2">
            <div className="bg-[#e0e0e0] text-[#424242] text-sm py-1 px-2 rounded">
              Step {animationStep} of {result.sequence.length}
            </div>
            <select
              className="bg-white border border-gray-300 text-[#424242] text-sm p-1 rounded"
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            >
              <option value={0.5}>0.5x</option>
              <option value={1}>1x</option>
              <option value={2}>2x</option>
              <option value={4}>4x</option>
            </select>
          </div>
        </div>

        <div className="mb-4">
          <Slider
            value={[animationStep]}
            min={1}
            max={result.sequence.length}
            step={1}
            onValueChange={handleSliderChange}
          />
        </div>

        <div className="flex justify-center space-x-4 mb-6">
          <Button variant="outline" onClick={handleReset} size="icon">
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={handleStepBack}
            size="icon"
            disabled={animationStep <= 1}
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          {isPlaying ? (
            <Button onClick={handlePause} className="bg-primary text-white">
              <Pause className="h-4 w-4 mr-1" />
              Pause
            </Button>
          ) : (
            <Button onClick={handlePlay} className="bg-primary text-white">
              <Play className="h-4 w-4 mr-1" />
              Play
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleStepForward}
            size="icon"
            disabled={animationStep >= result.sequence.length}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        <div className="bg-gray-50 p-4 rounded-md" style={{ height: "300px" }}>
          {/* @ts-ignore - Chart.js typing issues */}
          <Line data={chartData} options={chartOptions} />
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="flex items-center text-xs text-[#757575]">
            <span className="inline-block w-3 h-3 rounded-full bg-[#ff4081] mr-1"></span>
            Initial head position
          </div>
          <div className="flex items-center text-xs text-[#757575]">
            <span className="inline-block w-3 h-3 rounded-full bg-[#4caf50] mr-1"></span>
            Current position
          </div>
          <div className="flex items-center text-xs text-[#757575]">
            <span className="inline-block w-3 h-3 rounded-full bg-[#3f51b5] mr-1"></span>
            Processed requests
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Request Sequence</h3>
        <div className="bg-gray-50 p-4 rounded-md overflow-x-auto">
          <div className="flex flex-wrap">
            {result.sequence.map((cylinder, index) => (
              <div
                key={`seq-${index}`}
                className={`
                  px-3 py-2 m-1 rounded font-mono text-sm flex items-center
                  ${
                    index === 0
                      ? "bg-[#ff4081] bg-opacity-20 text-[#ff4081]"
                      : ""
                  }
                  ${
                    index === animationStep - 1 && index > 0
                      ? "bg-[#4caf50] bg-opacity-20 text-[#4caf50] font-bold"
                      : ""
                  }
                  ${
                    index > 0 && index < animationStep - 1
                      ? "bg-[#3f51b5] bg-opacity-10 text-[#3f51b5]"
                      : ""
                  }
                  ${index >= animationStep ? "bg-gray-100 text-gray-400" : ""}
                `}
              >
                {index === 0 && <span className="mr-1 text-xs">Start</span>}
                {cylinder}
                {index > 0 && index < result.sequence.length - 1 && (
                  <>
                    {directionChanges.some(
                      (d) => d.position === index && d.type === "jump"
                    ) && (
                      <span className="ml-1 text-[#ff4081]">
                        <MoveHorizontal className="h-4 w-4" />
                      </span>
                    )}
                    {directionChanges.some(
                      (d) => d.position === index && d.type === "down"
                    ) && (
                      <span className="ml-1 text-[#3f51b5]">
                        <ArrowDown className="h-4 w-4" />
                      </span>
                    )}
                    {directionChanges.some(
                      (d) => d.position === index && d.type === "up"
                    ) && (
                      <span className="ml-1 text-[#3f51b5]">
                        <ArrowUp className="h-4 w-4" />
                      </span>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {algorithm === "cscan" && (
        <div className="mb-4 p-4 bg-purple-50 rounded-md border border-purple-200">
          <h4 className="font-medium text-purple-800 mb-2">
            C-SCAN Algorithm Explanation
          </h4>
          <p className="text-sm text-purple-700 mb-2">
            The C-SCAN (Circular SCAN) algorithm is designed to provide more
            uniform waiting time compared to SCAN:
          </p>
          <ul className="list-disc list-inside text-sm text-purple-700 mb-2">
            <li>
              The disk arm moves in one direction, servicing requests until it
              reaches the end
            </li>
            <li>
              Then it immediately returns to the other end (without servicing
              requests on the return trip)
            </li>
            <li>
              This "circular" motion gives all cylinders equal treatment,
              preventing starvation of requests
            </li>
            <li>
              Initial direction:{" "}
              {initialDirection
                ? "Towards higher cylinder numbers"
                : "Towards lower cylinder numbers"}
            </li>
          </ul>
          <div className="flex items-center text-xs text-purple-700">
            <span className="inline-block border-t border-dashed border-purple-400 w-4 mr-1"></span>
            The dashed line in the chart shows the "jump" back to the other end
          </div>
        </div>
      )}

      {algorithm === "look" && (
        <div className="mb-4 p-4 bg-blue-50 rounded-md border border-blue-200">
          <h4 className="font-medium text-blue-800 mb-2">
            LOOK Algorithm Explanation
          </h4>
          <p className="text-sm text-blue-700 mb-2">
            The LOOK algorithm is an improvement over SCAN that doesn't go all
            the way to the end:
          </p>
          <ul className="list-disc list-inside text-sm text-blue-700">
            <li>
              The disk arm services requests in one direction until no more
              requests exist in that direction
            </li>
            <li>
              The arm then reverses direction and services requests in the
              opposite direction
            </li>
            <li>
              This "look ahead" approach reduces unnecessary head movement to
              the disk boundaries
            </li>
            <li>
              Initial direction:{" "}
              {initialDirection
                ? "Towards higher cylinder numbers"
                : "Towards lower cylinder numbers"}
            </li>
          </ul>
          <div className="flex items-center text-xs text-blue-700 mt-2">
            {initialDirection ? (
              <ArrowDown className="h-4 w-4 mr-1 text-blue-700" />
            ) : (
              <ArrowUp className="h-4 w-4 mr-1 text-blue-700" />
            )}
            The arrow in the sequence shows where the direction reverses
          </div>
        </div>
      )}
    </div>
  );
}
