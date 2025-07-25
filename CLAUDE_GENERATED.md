# Claude Generated Code

**Task**: Objective:
Audit the entire codebase and identify improvements in:

🔐 Security
Detect insecure patterns (e.g. unvalidated inputs, unsafe data handling)...

Suggest best practices (e.g. input sanitization, environment variable usage).

🛠️ Maintainability
Flag complex or duplicate code, unclear logic, poor naming.

Recommend modularization and better structure.

🚀 Performance
Spot inefficient loops, redundant logic, unnecessary API calls.

Suggest caching or optimization where needed.

🧹 Clean-up
Find dead code, unused variables/functions/imports.

List outdated or unnecessary dependencies.

**Generated on**: Fri Jul 25 18:34:35 UTC 2025

## Generated Content

```
Based on my audit of the codebase, I've identified several critical security, maintainability, performance, and cleanup issues. Here are the necessary improvements:

## 🔐 Security Issues Identified

1. **Hardcoded private keys exposure risk**
2. **Missing input validation and sanitization**
3. **Unhandled contract interaction errors**
4. **Missing rate limiting**
5. **Insufficient address validation**

## 🛠️ Maintainability Issues

1. **Poor error handling patterns**
2. **Mixed concerns in components**
3. **Missing TypeScript interfaces**
4. **Inconsistent naming conventions**

## 🚀 Performance Issues

1. **No React Query caching configuration**
2. **Missing loading states optimization**
3. **Redundant re-renders**

## 🧹 Cleanup Issues

1. **Dead/unused test files**
2. **Missing environment variable validation**
3. **Inconsistent project structure**

---

## CODE_CHANGES

### FILES_TO_CREATE

**1. `src/types/index.ts`** - Type definitions
```typescript
export interface ContractError extends Error {
  code?: string;
  reason?: string;
  data?: any;
}

export interface FaucetState {
  isLoading: boolean;
  error: string | null;
  lastRequestTime?: number;
}

export interface ContractConfig {
  address: `0x${string}`;
  maxRetries: number;
  retryDelay: number;
}

export interface Contribution {
  contributor: string;
  amount: bigint;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}
```

**2. `src/utils/validation.ts`** - Input validation utilities
```typescript
import { isAddress } from 'viem';

export const validateEthereumAddress = (address: string): ValidationResult => {
  if (!address.trim()) {
    return { isValid: false, error: 'Address is required' };
  }
  
  if (!isAddress(address)) {
    return { isValid: false, error: 'Invalid Ethereum address format' };
  }
  
  return { isValid: true };
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>\"']/g, '');
};

export const validateAmount = (amount: string): ValidationResult => {
  const numAmount = parseFloat(amount);
  
  if (isNaN(numAmount) || numAmount <= 0) {
    return { isValid: false, error: 'Amount must be a positive number' };
  }
  
  if (numAmount > Number.MAX_SAFE_INTEGER) {
    return { isValid: false, error: 'Amount is too large' };
  }
  
  return { isValid: true };
};
```

**3. `src/utils/constants.ts`** - Application constants
```typescript
export const APP_CONFIG = {
  CONTRACT: {
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    REQUEST_TIMEOUT: 30000,
  },
  RATE_LIMIT: {
    MAX_REQUESTS_PER_HOUR: 5,
    COOLDOWN_PERIOD: 3600000, // 1 hour in ms
  },
  UI: {
    TOAST_DURATION: 5000,
    LOADING_DEBOUNCE: 300,
  }
} as const;

export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet first',
  INVALID_ADDRESS: 'Please enter a valid Ethereum address',
  RATE_LIMITED: 'Too many requests. Please wait before trying again',
  CONTRACT_ERROR: 'Contract interaction failed. Please try again',
  NETWORK_ERROR: 'Network error. Please check your connection',
} as const;
```

**4. `src/hooks/useFaucet.ts`** - Custom hook for faucet operations
```typescript
import { useState, useCallback, useRef } from 'react';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { FaucetPPT } from '@/contracts/FaucetPPT';
import { validateEthereumAddress, sanitizeInput } from '@/utils/validation';
import { APP_CONFIG, ERROR_MESSAGES } from '@/utils/constants';
import type { FaucetState, ContractError } from '@/types';

export const useFaucet = () => {
  const { address, isConnected } = useAccount();
  const [state, setState] = useState<FaucetState>({
    isLoading: false,
    error: null,
  });
  
  const rateLimitRef = useRef<Map<string, number>>(new Map());

  const checkRateLimit = useCallback((userAddress: string): boolean => {
    const now = Date.now();
    const lastRequest = rateLimitRef.current.get(userAddress);
    
    if (lastRequest && (now - lastRequest) < APP_CONFIG.RATE_LIMIT.COOLDOWN_PERIOD) {
      return false;
    }
    
    return true;
  }, []);

  const { writeContract: requestFundsWrite } = useWriteContract({
    mutation: {
      onError: (error: ContractError) => {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error.reason || ERROR_MESSAGES.CONTRACT_ERROR,
        }));
      },
      onSuccess: () => {
        setState(prev => ({ ...prev, isLoading: false, error: null }));
        if (address) {
          rateLimitRef.current.set(address, Date.now());
        }
      },
    },
  });

  const { data: maxWithdrawAmount } = useReadContract({
    ...FaucetPPT,
    functionName: "MAX_WITHDRAW_AMOUNT",
  });

  const { data: recentContributions, refetch: refetchContributions } = useReadContract({
    ...FaucetPPT,
    functionName: "getRecentContributions",
  });

  const requestFunds = useCallback(async (targetAddress?: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      if (!isConnected) {
        throw new Error(ERROR_MESSAGES.WALLET_NOT_CONNECTED);
      }

      const addressToUse = targetAddress ? sanitizeInput(targetAddress) : address;
      
      if (!addressToUse) {
        throw new Error(ERROR_MESSAGES.INVALID_ADDRESS);
      }

      const validation = validateEthereumAddress(addressToUse);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      if (!checkRateLimit(addressToUse)) {
        throw new Error(ERROR_MESSAGES.RATE_LIMITED);
      }

      await requestFundsWrite({
        ...FaucetPPT,
        functionName: "requestFunds",
        args: [addressToUse as `0x${string}`],
      });

    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : ERROR_MESSAGES.CONTRACT_ERROR,
      }));
    }
  }, [isConnected, address, requestFundsWrite, checkRateLimit]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    requestFunds,
    clearError,
    maxWithdrawAmount,
    recentContributions,
    refetchContributions,
    isConnected,
    userAddress: address,
  };
};
```

**5. `src/components/ErrorBoundary.tsx`** - Error boundary component
```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
            <h2 className="text-xl font-semibold text-red-600 mb-4">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-4">
              We're sorry, but something unexpected happened.
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**6. `src/components/LoadingSpinner.tsx`** - Reusable loading component
```typescript
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  message 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center py-4">
      <div
        className={`${sizeClasses[size]} border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin`}
        role="status"
        aria-label="Loading"
      />
      {message && (
        <p className="mt-2 text-sm text-gray-600">{message}</p>
      )}
    </div>
  );
};
```

**7. `.env.example`** - Environment variables template
```
# RPC Configuration
RPC_URL=your_rpc_url_here
PRIVATE_KEY=your_private_key_here

# Application Configuration
NEXT_PUBLIC_CONTRACT_ADDRESS=0xBA01DF91c631A0E101902c6f5E96c39eab096C68
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_ENABLE_LOGGING=true
```

### FILES_TO_MODIFY

**1. `src/app/page.tsx`** - Refactored main page
```typescript
"use client";

import { useState, useCallback } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useFaucet } from "@/hooks/useFaucet";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { sanitizeInput } from "@/utils/validation";
import { formatEther } from "viem";

export default function Home() {
  const [customAddress, setCustomAddress] = useState<string>("");
  const {
    isLoading,
    error,
    requestFunds,
    clearError,
    maxWithdrawAmount,
    recentContributions,
    isConnected,
    userAddress,
  } = useFaucet();

  const handleAddressChange = useCallback((value: string) => {
    setCustomAddress(sanitizeInput(value));
    if (error) clearError();
  }, [error, clearError]);

  const handleRequestFunds = useCallback(async () => {
    await requestFunds(customAddress || userAddress);
  }, [requestFunds, customAddress, userAddress]);

  const formatContributions = useCallback(() => {
    if (!recentContributions || !Array.isArray(recentContributions)) {
      return [];
    }
    return recentContributions.slice(0, 5);
  }, [recentContributions]);

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-6">PPT Faucet</h1>
          <p className="text-gray-600 mb-6">
            Connect your wallet to request test tokens
          </p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            PPT Token Faucet
          </h1>
          <p className="text-gray-600">
            Request test tokens for development
          </p>
        </header>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Wallet Connection</h2>
            <ConnectButton />
          </div>

          {maxWithdrawAmount && (
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="text-blue-800">
                <strong>Max withdrawal:</strong>{" "}
                {formatEther(maxWithdrawAmount)} PPT
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="customAddress"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Recipient Address (optional)
              </label>
              <input
                id="customAddress"
                type="text"
                value={customAddress}
                onChange={(e) => handleAddressChange(e.target.value)}
                placeholder="0x... (leave empty to use your wallet)"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
                maxLength={42}
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to send tokens to your connected wallet
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <div className="flex justify-between items-start">
                  <span>{error}</span>
                  <button
                    onClick={clearError}
                    className="text-red-400 hover:text-red-600 ml-2"
                    aria-label="Dismiss error"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={handleRequestFunds}
              disabled={isLoading || !isConnected}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                isLoading || !isConnected
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Requesting Funds...</span>
                </div>
              ) : (
                "Request Funds"
              )}
            </button>
          </div>
        </div>

        {/* Recent Contributions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Contributions</h3>
          {formatContributions().length > 0 ? (
            <div className="space-y-2">
              {formatContributions().map((contribution, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded"
                >
                  <span className="font-mono text-sm">
                    {contribution.contributor.slice(0, 6)}...
                    {contribution.contributor.slice(-4)}
                  </span>
                  <span className="text-sm font-medium">
                    {formatEther(contribution.amount)} PPT
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No recent contributions
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
```

**2. `src/app/config.ts`** - Enhanced configuration
```typescript
"use client";
import { http, createConfig } from 'wagmi';
import { optimismSepolia } from 'wagmi/chains';

// Validate environment variables
const validateConfig = () => {
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  if (!contractAddress) {
    console.warn('NEXT_PUBLIC_CONTRACT_ADDRESS not set');
  }
  
  return {
    contractAddress,
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',
    enableLogging: process.env.NEXT_PUBLIC_ENABLE_LOGGING === 'true',
  };
};

export const appConfig = validateConfig();

export const config = createConfig({
  chains: [optimismSepolia],
  transports: {
    [optimismSepolia.id]: http(),
  },
  // Add connection timeout and retry configuration
  pollingInterval: 4000,
});
```

**3. `src/components/ClientProviders.tsx`** - Enhanced providers with error boundary
```typescript
"use client";

import { ReactNode } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '@/app/config';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { ErrorBoundary } from './ErrorBoundary';
import '@rainbow-me/rainbowkit/styles.css';

// Configure React Query with better defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
    },
  },
});

export default function ClientProviders({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ErrorBoundary>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider
            modalSize="compact"
            initialChain={config.chains[0]}
          >
            {children}
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ErrorBoundary>
  );
}
```

**4. `src/contracts/FaucetPPT.ts`** - Enhanced contract configuration
```typescript
import { appConfig } from '@/app/config';

// Use environment variable for contract address with fallback
const CONTRACT_ADDRESS = (appConfig.contractAddress || 
  "0xBA01DF91c631A0E101902c6f5E96c39eab096C68") as `0x${string}`;

export const FaucetPPT = {
  address: CONTRACT_ADDRESS,
  abi: [
    {
      "inputs": [{"internalType": "address", "name": "_token", "type": "address"}],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [{"internalType": "address", "name": "owner", "type": "address"}],
      "name": "OwnableInvalidOwner",
      "type": "error"
    },
    {
      "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
      "name": "OwnableUnauthorizedAccount",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "ReentrancyGuardReentrantCall",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {"indexed": true, "internalType": "address", "name": "account", "type": "address"},
        {"indexed": false, "internalType": "bool", "name": "blacklisted", "type": "bool"}
      ],
      "name": "BlacklistUpdated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {"indexed": true, "internalType": "address", "name": "contributor", "type": "address"},
        {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}
      ],
      "name": "ContributionMade",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {"indexed": true, "internalType": "address", "name": "receiver", "type": "address"},
        {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}
      ],
      "name": "FundsRequested",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {"indexed": false, "internalType": "uint256", "name": "balance", "type": "uint256"}
      ],
      "name": "MinThresholdReached",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {"indexed": true, "internalType": "address", "name": "previousOwner", "type": "address"},
        {"indexed": true, "internalType": "address", "name": "newOwner", "type": "address"}
      ],
      "name": "OwnershipTransferred",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "MAX_WITHDRAW_AMOUNT",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "MIN_BALANCE_THRESHOLD",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "REQUEST_GAP_LIMITER",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
      "name": "addToBlacklist",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "address[]", "name": "accounts", "type": "address[]"}],
      "name": "batchAddToBlacklist",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "address", "name": "", "type": "address"}],
      "name": "blacklist",
      "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
      "name": "contribute",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getRecentContributions",
      "outputs": [
        {
          "components": [
            {"internalType": "address", "name": "contributor", "type": "address"},
            {"internalType": "uint256", "name": "amount", "type": "uint256"}
          ],
          "internalType": "struct FaucetPPT.Contribution[]",
          "name": "",
          "type": "tuple[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [{"internalType": "address", "name": "", "type": "address"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "name": "recentContributions",
      "outputs": [
        {"internalType": "address", "name": "contributor", "type": "address"},
        {"internalType": "uint256", "name": "amount", "type": "uint256"}
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "address", "name": "", "type": "address"}],
      "name": "recentReceivers",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
      "name": "removeFromBlacklist",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "renounceOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "address", "name": "receiver", "type": "address"}],
      "name": "requestFunds",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "token",
      "outputs": [{"internalType": "contract IERC20", "name": "", "type": "address"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "address", "name": "newOwner", "type": "address"}],
      "name": "transferOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
      "name": "withdraw",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ],
} as const;
```

**5. `src/app/layout.tsx`** - Enhanced layout with metadata
```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/ClientProviders";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "PPT Token Faucet - Test Tokens for Development",
  description: "Request test PPT tokens for development and testing purposes on Optimism Sepolia",
  keywords: ["faucet", "test tokens", "PPT", "ethereum", "web3", "development"],
  authors: [{ name: "Your Team" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "noindex, nofollow", // Prevent indexing of test applications
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

**6. `contracts/hardhat.config.js`** - Enhanced security
```javascript
require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = ['RPC_URL', 'PRIVATE_KEY'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Validate private key format (basic check)
if (!process.env.PRIVATE_KEY.startsWith('0x')) {
  throw new Error('PRIVATE_KEY must start with 0x');
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.29",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    "op-sepolia": {
      url: process.env.RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      gasPrice: "auto",
      gas: "auto",
    },
    "op-mainnet": {
      url: process.env.RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      
```
