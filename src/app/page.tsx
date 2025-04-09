"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useReadContract } from "wagmi";
import { FaucetPPT } from "@/contracts/FaucetPPT";
import { ethers } from "ethers";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Home() {
  const { address, isConnected } = useAccount();
  const [customAddress, setCustomAddress] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Contract interactions
  const { writeContract: requestFunds } = useWriteContract({
    mutation: {
      onError: (error) => {
        setError(error.message);
        setIsLoading(false);
      },
      onSuccess: () => {
        setIsLoading(false);
      },
    },
  });

  const { data: maxWithdrawAmount } = useReadContract({
    ...FaucetPPT,
    functionName: "MAX_WITHDRAW_AMOUNT",
  });

  const { data: requestGapLimiter } = useReadContract({
    ...FaucetPPT,
    functionName: "REQUEST_GAP_LIMITER",
  });

  const handleRequest = async () => {
    if (!isConnected) {
      setError("Please connect your wallet first");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      await requestFunds({
        ...FaucetPPT,
        functionName: "requestFunds",
        args: [address as `0x${string}`],
      });
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Faucet</h1>
          <p className="text-gray-600 mt-2">Get testnet tokens</p>
        </div>
        <div className="flex justify-center">
            <ConnectButton />
        </div>

        <div className="space-y-6">
          {/* Token Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Token
            </label>
            <select
              className="w-full px-3 py-2 border text-black border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              disabled
            >
              <option>PPT</option>
            </select>
          </div>

          {/* Wallet Address */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Wallet Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e)=>{setCustomAddress(e.target.value)}}
              disabled={isConnected && address != null}
              className="w-full px-3 py-2 border text-black border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50"
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Amount
            </label>
            <input
              type="text"
              value={ethers.formatEther(maxWithdrawAmount?.toString() || "0")}
              disabled
              className="w-full px-3 py-2 border text-black border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          {/* Request Button */}
          <button
            onClick={handleRequest}
            disabled={!isConnected || isLoading}
            className={`w-full py-2 px-4 rounded-md text-white font-medium ${
              !isConnected || isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {isLoading ? "Processing..." : "Request"}
          </button>

          {/* Additional Info */}
          <div className="text-center text-sm text-gray-500">
            <p>Cooldown period: {requestGapLimiter?.toString() || "30"} minutes</p>
            <p className="mt-2">
              Need more tokens? Contact us
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}