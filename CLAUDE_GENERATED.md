# Claude Generated Code

**Task**: Objective:
Help design and implement new features based on the current roadmap or project needs. Focus on clean, scalable, and testable code...

Claude Tasks:

🧩 Feature Implementation
Read the existing codebase and integrate new feature modules where appropriate.

Ensure new code follows existing patterns and conventions.

🗂️ Example Features (replace/add specifics as needed):
Add user role-based access control

Implement export to PDF

Add multi-language support

Enable dark mode toggle

🧪 Testing & Documentation
Add unit/integration tests for new functionality.

Update README or in-code comments if required.

**Generated on**: Fri Jul 25 18:45:22 UTC 2025

## Generated Content

```
I notice there's a mismatch between the task description (Ionic React TypeScript for government billing/invoicing) and the actual codebase (Next.js web3 faucet application). I'll work with the existing codebase and implement features that would be valuable for this web3 faucet application, adapting the requested features to fit the current context.

Let me implement **user role-based access control**, **dark mode toggle**, and **enhanced UI components** for the faucet application.

## FILES_TO_CREATE

1. `src/types/auth.ts`
2. `src/hooks/useAuth.ts`
3. `src/hooks/useTheme.ts`
4. `src/components/ui/Button.tsx`
5. `src/components/ui/Card.tsx`
6. `src/components/ui/Input.tsx`
7. `src/components/ui/Alert.tsx`
8. `src/components/ui/ThemeToggle.tsx`
9. `src/components/layout/Header.tsx`
10. `src/components/features/AdminPanel.tsx`
11. `src/components/features/ContributionHistory.tsx`
12. `src/utils/constants.ts`
13. `src/utils/formatters.ts`

## FILES_TO_MODIFY

1. `src/app/page.tsx`
2. `src/app/layout.tsx`
3. `src/app/globals.css`
4. `src/components/ClientProviders.tsx`
5. `package.json`

## CODE_CHANGES

### FILES_TO_CREATE

**src/types/auth.ts**
```typescript
export enum UserRole {
  ADMIN = 'admin',
  CONTRIBUTOR = 'contributor',
  USER = 'user'
}

export interface User {
  address: string;
  role: UserRole;
  isBlacklisted: boolean;
  lastRequestTime?: number;
  contributionCount: number;
  totalContributed: bigint;
}

export interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isContributor: boolean;
  checkUserRole: (address: string) => Promise<UserRole>;
  updateUserRole: (address: string, role: UserRole) => void;
}
```

**src/hooks/useAuth.ts**
```typescript
"use client";

import { useState, useEffect, createContext, useContext } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { FaucetPPT } from '@/contracts/FaucetPPT';
import { User, UserRole, AuthContextType } from '@/types/auth';

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function useAuthProvider() {
  const { address, isConnected } = useAccount();
  const [user, setUser] = useState<User | null>(null);

  // Check if user is contract owner (admin)
  const { data: owner } = useReadContract({
    ...FaucetPPT,
    functionName: 'owner',
  });

  // Check if user is blacklisted
  const { data: isBlacklisted } = useReadContract({
    ...FaucetPPT,
    functionName: 'blacklist',
    args: address ? [address] : undefined,
  });

  const checkUserRole = async (userAddress: string): Promise<UserRole> => {
    if (owner && userAddress.toLowerCase() === owner.toLowerCase()) {
      return UserRole.ADMIN;
    }
    
    // In a real app, you'd check contribution history from events or backend
    // For now, we'll use a simple heuristic
    const contributionCount = 0; // This would be fetched from contract events
    
    if (contributionCount > 0) {
      return UserRole.CONTRIBUTOR;
    }
    
    return UserRole.USER;
  };

  const updateUserRole = (userAddress: string, role: UserRole) => {
    // This would typically involve backend API calls
    console.log(`Updating role for ${userAddress} to ${role}`);
  };

  useEffect(() => {
    if (isConnected && address) {
      checkUserRole(address).then(role => {
        setUser({
          address,
          role,
          isBlacklisted: Boolean(isBlacklisted),
          contributionCount: 0,
          totalContributed: 0n,
        });
      });
    } else {
      setUser(null);
    }
  }, [address, isConnected, owner, isBlacklisted]);

  return {
    user,
    isAdmin: user?.role === UserRole.ADMIN,
    isContributor: user?.role === UserRole.CONTRIBUTOR,
    checkUserRole,
    updateUserRole,
  };
}

export { AuthContext };
```

**src/hooks/useTheme.ts**
```typescript
"use client";

import { useState, useEffect, createContext, useContext } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

export function useThemeProvider() {
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const initialTheme = savedTheme || systemTheme;
    
    setThemeState(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return {
    theme,
    toggleTheme,
    setTheme,
  };
}

export { ThemeContext };
```

**src/components/ui/Button.tsx**
```typescript
import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils/formatters';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', loading, disabled, children, ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background";
    
    const variants = {
      default: "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800",
      destructive: "bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800",
      outline: "border border-gray-300 bg-transparent hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800",
      secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700",
      ghost: "hover:bg-gray-100 dark:hover:bg-gray-800",
    };

    const sizes = {
      default: "h-10 py-2 px-4",
      sm: "h-9 px-3 text-sm",
      lg: "h-11 px-8",
    };

    return (
      <button
        className={cn(baseClasses, variants[variant], sizes[size], className)}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export { Button };
```

**src/components/ui/Card.tsx**
```typescript
import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/utils/formatters';

const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-2xl font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

export { Card, CardHeader, CardTitle, CardContent };
```

**src/components/ui/Input.tsx**
```typescript
import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/utils/formatters';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-400",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
```

**src/components/ui/Alert.tsx**
```typescript
import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/utils/formatters';

const Alert = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'destructive' | 'success' }>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: "border-gray-200 text-gray-900 dark:border-gray-800 dark:text-gray-100",
      destructive: "border-red-200 text-red-900 bg-red-50 dark:border-red-800 dark:text-red-100 dark:bg-red-950",
      success: "border-green-200 text-green-900 bg-green-50 dark:border-green-800 dark:text-green-100 dark:bg-green-950",
    };

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          "relative w-full rounded-lg border p-4",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Alert.displayName = "Alert";

export { Alert };
```

**src/components/ui/ThemeToggle.tsx**
```typescript
"use client";

import { useTheme } from '@/hooks/useTheme';
import { Button } from './Button';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="w-10 h-10 p-0"
    >
      {theme === 'light' ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )}
    </Button>
  );
}
```

**src/components/layout/Header.tsx**
```typescript
"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";

export function Header() {
  const { user, isAdmin } = useAuth();

  return (
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            PPT Faucet
          </h1>
          {isAdmin && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900 dark:text-blue-200">
              Admin
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
```

**src/components/features/AdminPanel.tsx**
```typescript
"use client";

import { useState } from 'react';
import { useWriteContract } from 'wagmi';
import { FaucetPPT } from '@/contracts/FaucetPPT';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/hooks/useAuth';
import { formatEther, parseEther, isAddress } from 'viem';

export function AdminPanel() {
  const { isAdmin } = useAuth();
  const [blacklistAddress, setBlacklistAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { writeContract: addToBlacklist, isPending: isBlacklisting } = useWriteContract({
    mutation: {
      onSuccess: () => {
        setSuccess('Address added to blacklist successfully');
        setBlacklistAddress('');
        setError('');
      },
      onError: (error) => {
        setError(error.message);
        setSuccess('');
      },
    },
  });

  const { writeContract: removeFromBlacklist, isPending: isUnblacklisting } = useWriteContract({
    mutation: {
      onSuccess: () => {
        setSuccess('Address removed from blacklist successfully');
        setBlacklistAddress('');
        setError('');
      },
      onError: (error) => {
        setError(error.message);
        setSuccess('');
      },
    },
  });

  const { writeContract: withdraw, isPending: isWithdrawing } = useWriteContract({
    mutation: {
      onSuccess: () => {
        setSuccess('Withdrawal successful');
        setWithdrawAmount('');
        setError('');
      },
      onError: (error) => {
        setError(error.message);
        setSuccess('');
      },
    },
  });

  if (!isAdmin) {
    return (
      <Alert variant="destructive">
        Access denied. Admin privileges required.
      </Alert>
    );
  }

  const handleBlacklist = (add: boolean) => {
    if (!isAddress(blacklistAddress)) {
      setError('Invalid address format');
      return;
    }

    const action = add ? addToBlacklist : removeFromBlacklist;
    action({
      ...FaucetPPT,
      functionName: add ? 'addToBlacklist' : 'removeFromBlacklist',
      args: [blacklistAddress as `0x${string}`],
    });
  };

  const handleWithdraw = () => {
    try {
      const amount = parseEther(withdrawAmount);
      withdraw({
        ...FaucetPPT,
        functionName: 'withdraw',
        args: [amount],
      });
    } catch (err) {
      setError('Invalid withdrawal amount');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin Panel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && <Alert variant="destructive">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Blacklist Management</h3>
            <div className="flex space-x-2">
              <Input
                placeholder="Enter address to blacklist/unblacklist"
                value={blacklistAddress}
                onChange={(e) => setBlacklistAddress(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={() => handleBlacklist(true)}
                loading={isBlacklisting}
                variant="destructive"
              >
                Add to Blacklist
              </Button>
              <Button
                onClick={() => handleBlacklist(false)}
                loading={isUnblacklisting}
                variant="outline"
              >
                Remove
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Withdraw Funds</h3>
            <div className="flex space-x-2">
              <Input
                placeholder="Amount to withdraw (ETH)"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="flex-1"
                type="number"
                step="0.01"
              />
              <Button
                onClick={handleWithdraw}
                loading={isWithdrawing}
                variant="outline"
              >
                Withdraw
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

**src/components/features/ContributionHistory.tsx**
```typescript
"use client";

import { useReadContract } from 'wagmi';
import { FaucetPPT } from '@/contracts/FaucetPPT';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { formatAddress, formatTokenAmount } from '@/utils/formatters';

export function ContributionHistory() {
  const { data: contributions, isLoading } = useReadContract({
    ...FaucetPPT,
    functionName: 'getRecentContributions',
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Contributions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Contributions</CardTitle>
      </CardHeader>
      <CardContent>
        {contributions && contributions.length > 0 ? (
          <div className="space-y-3">
            {contributions.map((contribution: any, index: number) => (
              <div
                key={index}
                className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
              >
                <div>
                  <p className="font-mono text-sm">
                    {formatAddress(contribution.contributor)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {formatTokenAmount(contribution.amount)} PPT
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No contributions yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

**src/utils/constants.ts**
```typescript
export const FAUCET_CONFIG = {
  MAX_WITHDRAW_AMOUNT: '1000000000000000000000', // 1000 PPT
  REQUEST_GAP_LIMITER: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  MIN_BALANCE_THRESHOLD: '10000000000000000000000', // 10,000 PPT
} as const;

export const UI_CONFIG = {
  THEME_STORAGE_KEY: 'ppt-faucet-theme',
  MAX_RECENT_CONTRIBUTIONS: 10,
} as const;

export const ERROR_MESSAGES = {
  INVALID_ADDRESS: 'Please enter a valid Ethereum address',
  INSUFFICIENT_BALANCE: 'Insufficient faucet balance',
  REQUEST_TOO_SOON: 'Please wait before making another request',
  BLACKLISTED: 'This address is blacklisted',
  NETWORK_ERROR: 'Network error. Please try again.',
} as const;
```

**src/utils/formatters.ts**
```typescript
import { formatEther } from 'viem';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwindcss-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAddress(address: string | undefined): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatTokenAmount(amount: bigint | string): string {
  if (typeof amount === 'string') {
    return parseFloat(formatEther(BigInt(amount))).toFixed(2);
  }
  return parseFloat(formatEther(amount)).toFixed(2);
}

export function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}
```

### FILES_TO_MODIFY

**package.json** (add dependencies)
```json
{
  "name": "faucet-ppt",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@rainbow-me/rainbowkit": "^2.2.4",
    "@tanstack/react-query": "^5.72.2",
    "clsx": "^2.0.0",
    "ethers": "^6.13.5",
    "next": "15.2.4",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tailwindcss-merge": "^2.2.0",
    "viem": "^2.26.2",
    "wagmi": "^2.14.16"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

**src/app/globals.css**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 0, 0, 0;
    --background-end-rgb: 0, 0, 0;
  }
}

.dark {
  color-scheme: dark;
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}
```

**src/components/ClientProviders.tsx**
```typescript
"use client"

import { ReactNode } from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from '@/app/config'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { AuthContext, useAuthProvider } from '@/hooks/useAuth'
import { ThemeContext, useThemeProvider } from '@/hooks/useTheme'
import '@rainbow-me/rainbowkit/styles.css'

const queryClient = new QueryClient()

function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuthProvider();
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useThemeProvider();
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export default function ClientProviders({
  children,
}: {
  children: ReactNode
}) {
  return (
    <ThemeProvider>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  )
}
```

**src/app/layout.tsx**
```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/ClientProviders";

const geistSans = Geist({
  variable: "--font-
```
