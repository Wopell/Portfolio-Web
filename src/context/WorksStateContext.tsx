import React, { createContext, useContext, useState } from 'react';

interface WorksStateContextType {
  isWorksActive: boolean;
  setIsWorksActive: (active: boolean) => void;
}

const WorksStateContext = createContext<WorksStateContextType>({
  isWorksActive: false,
  setIsWorksActive: () => {},
});

export function WorksStateProvider({ children }: { children: React.ReactNode }) {
  const [isWorksActive, setIsWorksActive] = useState(false);

  return (
    <WorksStateContext.Provider value={{ isWorksActive, setIsWorksActive }}>
      {children}
    </WorksStateContext.Provider>
  );
}

export function useWorksState() {
  return useContext(WorksStateContext);
}
