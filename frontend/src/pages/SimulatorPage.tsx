import React from 'react';
import { FarmSimulatorModal } from '../components/simulator/FarmSimulatorModal';

export const SimulatorPage: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-y-auto">
      <FarmSimulatorModal isOpen={true} onClose={() => {}} isStandalonePage={true} />
    </div>
  );
};
