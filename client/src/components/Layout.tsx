import React, { ReactNode } from 'react';
import { useSimulation } from '@/contexts/SimulationContext';
import { MemoryStick, HardDrive, BarChart } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { activeTab, setActiveTab } = useSimulation();

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Header */}
      <header className="bg-primary text-white p-4 shadow-md">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <h1 className="text-2xl font-medium mb-2 md:mb-0 flex items-center">
            <MemoryStick className="mr-2 h-6 w-6" />
            Algorithm Simulator
          </h1>
          <div className="flex space-x-2">
            <button 
              className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-md transition duration-200 flex items-center"
            >
              <span className="mr-1">?</span>
              Help
            </button>
            <button 
              className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-md transition duration-200 flex items-center"
            >
              <span className="mr-1">i</span>
              About
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b border-gray-200">
            <button 
              className={`px-6 py-3 font-medium flex items-center ${
                activeTab === 'memory' ? 'text-primary border-b-2 border-primary' : 'text-[#757575] hover:text-primary'
              }`}
              onClick={() => setActiveTab('memory')}
            >
              <MemoryStick className="mr-1 h-5 w-5" />
              Virtual MemoryStick
            </button>
            <button 
              className={`px-6 py-3 font-medium flex items-center ${
                activeTab === 'disk' ? 'text-primary border-b-2 border-primary' : 'text-[#757575] hover:text-primary'
              }`}
              onClick={() => setActiveTab('disk')}
            >
              <HardDrive className="mr-1 h-5 w-5" />
              Disk Scheduling
            </button>
            <button 
              className={`px-6 py-3 font-medium flex items-center ${
                activeTab === 'comparison' ? 'text-primary border-b-2 border-primary' : 'text-[#757575] hover:text-primary'
              }`}
              onClick={() => setActiveTab('comparison')}
            >
              <BarChart className="mr-1 h-5 w-5" />
              Comparison
            </button>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
