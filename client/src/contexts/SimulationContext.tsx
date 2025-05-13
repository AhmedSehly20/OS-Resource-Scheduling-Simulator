import React, { createContext, useContext, useState, ReactNode } from 'react';
import { MemoryResult } from '@/lib/algorithms/memory';
import { DiskResult } from '@/lib/algorithms/disk';

interface ComparisonData {
  lru: { faults: number; hits: number } | null;
  arb: { faults: number; hits: number } | null;
  cscan: { seekDistance: number; cylinders: number } | null;
  look: { seekDistance: number; cylinders: number } | null;
}

interface SimulationContextType {
  comparisonData: ComparisonData;
  updateMemoryComparison: (algorithm: 'lru' | 'arb', result: MemoryResult) => void;
  updateDiskComparison: (algorithm: 'cscan' | 'look', result: DiskResult, cylinders: number) => void;
  activeTab: 'memory' | 'disk' | 'comparison';
  setActiveTab: (tab: 'memory' | 'disk' | 'comparison') => void;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [comparisonData, setComparisonData] = useState<ComparisonData>({
    lru: null,
    arb: null,
    cscan: null,
    look: null,
  });
  
  const [activeTab, setActiveTab] = useState<'memory' | 'disk' | 'comparison'>('memory');

  function updateMemoryComparison(algorithm: 'lru' | 'arb', result: MemoryResult) {
    setComparisonData(prev => ({
      ...prev,
      [algorithm]: {
        faults: result.faults,
        hits: result.hits,
      },
    }));
  }

  function updateDiskComparison(algorithm: 'cscan' | 'look', result: DiskResult, cylinders: number) {
    setComparisonData(prev => ({
      ...prev,
      [algorithm]: {
        seekDistance: result.seekDistance,
        cylinders,
      },
    }));
  }

  return (
    <SimulationContext.Provider
      value={{ 
        comparisonData, 
        updateMemoryComparison, 
        updateDiskComparison,
        activeTab,
        setActiveTab 
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const context = useContext(SimulationContext);
  if (context === undefined) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
}
