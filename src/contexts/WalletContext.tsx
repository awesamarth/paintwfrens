'use client'
import React, { createContext, useContext, ReactNode } from 'react';
import { useWallet } from '../hooks/useWallet';
import { COREKIT_STATUS, Web3AuthMPCCoreKit } from "@web3auth/mpc-core-kit";

interface WalletContextType {
  coreKitInstance: Web3AuthMPCCoreKit | null;
  coreKitStatus: COREKIT_STATUS;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const wallet = useWallet();
  
  return (
    <WalletContext.Provider value={wallet}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWalletContext = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return context;
};