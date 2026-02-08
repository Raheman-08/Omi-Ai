import React, { createContext, useContext, type ReactNode } from 'react';
import { useOmiDevice } from '../hooks/useOmiDevice';

export type OmiDeviceContextValue = ReturnType<typeof useOmiDevice>;

const OmiDeviceContext = createContext<OmiDeviceContextValue | null>(null);

export function OmiDeviceProvider({ children }: { children: ReactNode }) {
  const value = useOmiDevice();
  return (
    <OmiDeviceContext.Provider value={value}>
      {children}
    </OmiDeviceContext.Provider>
  );
}

export function useOmiDeviceContext(): OmiDeviceContextValue {
  const ctx = useContext(OmiDeviceContext);
  if (ctx == null) {
    throw new Error('useOmiDeviceContext must be used within OmiDeviceProvider');
  }
  return ctx;
}
