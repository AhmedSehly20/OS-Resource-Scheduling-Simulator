import React, { useState, useEffect, useRef } from "react";
import { MemoryResult, MemoryStep } from "@/lib/algorithms/memory";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronRight,
  RotateCw,
  ArrowRightCircle,
  RefreshCcw,
  Clock,
} from "lucide-react";

interface MemoryVisualizationProps {
  result: MemoryResult;
  algorithm: "lru" | "arb";
}

export function MemoryVisualization({
  result,
  algorithm,
}: MemoryVisualizationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const animationRef = useRef<number | null>(null);
  const [highlightedFrame, setHighlightedFrame] = useState<number | null>(null);
  const [showBitReset, setShowBitReset] = useState(false);

  const BASE_DELAY = 1000;

  useEffect(() => {
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

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

        if (currentStep < result.steps.length - 1) {
          setCurrentStep((prev) => prev + 1);
          animateStep(result.steps[currentStep + 1]);
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
  }, [isPlaying, currentStep, playbackSpeed, result.steps]);

  const animateStep = (step: MemoryStep) => {
    if (step.replacedFrame !== undefined) {
      setHighlightedFrame(step.replacedFrame);
    } else if (!step.isFault) {
      const frameIndex = step.framesAfter.indexOf(step.reference);
      setHighlightedFrame(frameIndex);
    }

    if (algorithm === "arb" && step.resetBits) {
      setShowBitReset(true);
      setTimeout(() => {
        setShowBitReset(false);
      }, 800);
    }

    setTimeout(() => {
      setHighlightedFrame(null);
    }, 500);
  };

  const handlePlay = () => {
    if (currentStep === result.steps.length - 1) {
      setCurrentStep(0);
    }
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };

  const handleStepForward = () => {
    if (currentStep < result.steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
      animateStep(result.steps[currentStep + 1]);
    }
  };

  const handleStepBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSliderChange = (value: number[]) => {
    setCurrentStep(value[0]);
    setIsPlaying(false);
  };

  const step = result.steps[currentStep];

  const currentFaults = result.steps
    .slice(0, currentStep + 1)
    .filter((s) => s.isFault).length;
  const currentHits = result.steps
    .slice(0, currentStep + 1)
    .filter((s) => !s.isFault).length;

  const getLRURank = (frameIndex: number) => {
    if (!step.orderOfUse || step.framesAfter[frameIndex] === -1) return null;
    const position = step.orderOfUse.indexOf(frameIndex);
    if (position === -1) return null;
    return position + 1;
  };

  const getFrameTooltip = (frameIndex: number) => {
    if (algorithm === "lru" && step.orderOfUse) {
      const rank = getLRURank(frameIndex);
      if (rank === null) return "";
      return `Usage rank: ${rank} of ${step.orderOfUse.length} (lower = less recently used)`;
    }
    return "";
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Current Status</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-[#757575]">Page Faults</p>
            <p className="text-2xl font-medium text-[#f44336]">
              {currentFaults}{" "}
              <span className="text-sm text-[#757575]">/ {result.faults}</span>
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-[#757575]">Page Hits</p>
            <p className="text-2xl font-medium text-[#4caf50]">
              {currentHits}{" "}
              <span className="text-sm text-[#757575]">/ {result.hits}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Simulation Visualization</h3>
          <div className="flex space-x-2">
            <div className="bg-[#e0e0e0] text-[#424242] text-sm py-1 px-2 rounded">
              Step {currentStep + 1} of {result.steps.length}
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
            value={[currentStep]}
            min={0}
            max={result.steps.length - 1}
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
            disabled={currentStep === 0}
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
            disabled={currentStep === result.steps.length - 1}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        <div className="overflow-x-auto bg-[#f9f9f9] p-4 rounded-md border border-gray-300">
          <div className="flex flex-col">
            <div className="flex mb-4">
              <div className="w-16 flex items-center justify-center font-medium">
                Ref
              </div>
              {step.frames.map((_, i) => (
                <div
                  key={`frame-header-${i}`}
                  className="w-[50px] mx-1 flex items-center justify-center font-medium"
                >
                  Frame {i}
                </div>
              ))}
              <div className="ml-4 w-24 flex items-center justify-center font-medium">
                Status
              </div>
            </div>

            <div className="border border-gray-200 rounded-md overflow-hidden">
              {result.steps
                .slice(0, currentStep + 1)
                .map((stepItem, stepIndex) => (
                  <div
                    key={`step-${stepIndex}`}
                    className={`flex py-2 ${
                      stepIndex === currentStep
                        ? "bg-blue-50"
                        : stepIndex % 2 === 0
                        ? "bg-white"
                        : "bg-gray-50"
                    }`}
                  >
                    <div className="w-16 flex items-center justify-center font-mono font-medium">
                      {stepItem.reference}
                    </div>

                    {stepItem.framesAfter.map((frame, frameIndex) => (
                      <div
                        key={`frame-${stepIndex}-${frameIndex}`}
                        className={`w-[50px] h-[50px] mx-1 flex items-center justify-center border font-mono relative ${
                          stepIndex === currentStep &&
                          frameIndex === highlightedFrame
                            ? "animate-pulse"
                            : ""
                        } ${
                          frame === stepItem.reference
                            ? "border-[#ff4081] border-2"
                            : "border-gray-300"
                        } ${
                          stepItem.isFault &&
                          stepIndex === currentStep &&
                          stepItem.replacedFrame === frameIndex
                            ? "bg-[#ffebee]"
                            : frame === -1
                            ? "bg-gray-100"
                            : "bg-[#e8f5e9]"
                        }`}
                        title={
                          stepIndex === currentStep
                            ? getFrameTooltip(frameIndex)
                            : ""
                        }
                      >
                        {frame === -1 ? "-" : frame}

                        {algorithm === "arb" &&
                          stepItem.refBitsAfter &&
                          frame !== -1 && (
                            <div
                              className={`w-[18px] h-[18px] text-xs flex items-center justify-center rounded-full absolute bottom-1 right-1
                            ${
                              showBitReset &&
                              stepIndex === currentStep &&
                              stepItem.resetBits
                                ? "animate-pulse"
                                : ""
                            }
                            ${
                              stepItem.refBitsAfter[frameIndex] === 1
                                ? "bg-[#4caf50] text-white"
                                : "bg-[#f5f5f5] border border-gray-300"
                            }`}
                            >
                              {stepItem.refBitsAfter[frameIndex]}
                            </div>
                          )}

                        {algorithm === "lru" &&
                          stepIndex === currentStep &&
                          frame !== -1 &&
                          stepItem.orderOfUse && (
                            <div className="w-[18px] h-[18px] text-xs flex items-center justify-center rounded-full absolute bottom-1 right-1 bg-purple-500 text-white">
                              {stepItem.orderOfUse.indexOf(frameIndex) + 1}
                            </div>
                          )}

                        {algorithm === "arb" &&
                          stepItem.pointerPositionAfter === frameIndex && (
                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                              <div className="text-xs font-bold text-[#ff9800]">
                                ▼
                              </div>
                            </div>
                          )}
                      </div>
                    ))}

                    <div className="ml-4 w-24 flex items-center justify-center">
                      {stepIndex === currentStep && (
                        <span
                          className={`px-2 py-1 text-xs rounded font-medium
                          ${
                            stepItem.isFault
                              ? "bg-[#f44336] bg-opacity-10 text-[#f44336]"
                              : "bg-[#4caf50] bg-opacity-10 text-[#4caf50]"
                          }`}
                        >
                          {stepItem.isFault ? "FAULT" : "HIT"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {algorithm === "arb" && (
        <div className="mb-4 p-4 bg-blue-50 rounded-md border border-blue-200">
          <h4 className="font-medium text-blue-800 mb-2">
            Additional Reference Bit (ARB) / Clock Algorithm Explanation
          </h4>
          <p className="text-sm text-blue-700 mb-2">
            This implementation of ARB uses a circular pointer (similar to the
            "Clock" algorithm):
          </p>
          <ul className="list-disc list-inside text-sm text-blue-700 mb-2">
            <li>Reference bit 1 = page was recently accessed</li>
            <li>Reference bit 0 = page has not been recently accessed</li>
            <li>
              The circular pointer{" "}
              <ArrowRightCircle className="h-4 w-4 inline text-[#ff9800]" />{" "}
              tracks the next frame to consider for replacement
            </li>
            <li>
              On a page fault, the algorithm looks for the first frame with
              reference bit = 0
            </li>
            <li>
              If no frame has a 0 bit, all bits are reset to 0 and the search
              starts again
            </li>
            <li>This gives pages a "second chance" before being replaced</li>
          </ul>
          <div className="flex items-center text-xs text-blue-700 bg-blue-100 p-2 rounded">
            <RefreshCcw className="h-4 w-4 mr-1 text-amber-700" />
            Watch for the reference bit reset animation when all frames have
            reference bit = 1
          </div>
        </div>
      )}

      {algorithm === "lru" && (
        <div className="mb-4 p-4 bg-purple-50 rounded-md border border-purple-200">
          <h4 className="font-medium text-purple-800 mb-2">
            Least Recently Used (LRU) Explanation
          </h4>
          <p className="text-sm text-purple-700 mb-2">
            The LRU algorithm replaces the page that hasn't been used for the
            longest time:
          </p>
          <ul className="list-disc list-inside text-sm text-purple-700">
            <li>
              When a page is referenced, it becomes the most recently used page
            </li>
            <li>
              The least recently used page is always at the beginning of the
              frame list
            </li>
            <li>
              When a page fault occurs, the least recently used page is replaced
            </li>
            <li>
              LRU keeps perfect track of usage history but is expensive to
              implement in real systems
            </li>
          </ul>
          <div className="flex items-center text-xs text-purple-700 bg-purple-100 p-2 rounded">
            <Clock className="h-4 w-4 mr-1 text-purple-700" />
            The numbers in the frames show the usage order (1 = least recently
            used, higher = more recently used)
          </div>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="flex items-center text-xs text-[#757575]">
          <span className="inline-block w-3 h-3 bg-[#ffebee] border border-[#f44336] mr-1"></span>
          Page fault
        </div>
        <div className="flex items-center text-xs text-[#757575]">
          <span className="inline-block w-3 h-3 bg-[#e8f5e9] border border-[#4caf50] mr-1"></span>
          Page hit
        </div>
        {algorithm === "arb" && (
          <div className="flex items-center text-xs text-[#757575]">
            <ArrowRightCircle className="h-4 w-4 mr-1 text-[#ff9800]" />
            Replacement pointer
          </div>
        )}
        {algorithm === "lru" && (
          <div className="flex items-center text-xs text-[#757575]">
            <div className="w-4 h-4 rounded-full bg-purple-500 text-white mr-1 flex items-center justify-center text-[10px]">
              1
            </div>
            Usage rank (lower = less recently used)
          </div>
        )}
      </div>
    </div>
  );
}
