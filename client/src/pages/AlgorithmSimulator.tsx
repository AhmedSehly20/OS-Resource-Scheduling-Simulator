import React from 'react';
import { Layout } from '@/components/Layout';
import { MemoryTab } from '@/components/simulator/MemoryTab';
import { DiskTab } from '@/components/simulator/DiskTab';
import { ComparisonTab } from '@/components/simulator/ComparisonTab';
import { useSimulation } from '@/contexts/SimulationContext';

export default function AlgorithmSimulator() {
  const { activeTab } = useSimulation();

  return (
    <Layout>
      {activeTab === 'memory' && <MemoryTab />}
      {activeTab === 'disk' && <DiskTab />}
      {activeTab === 'comparison' && <ComparisonTab />}
    </Layout>
  );
}
