'use client';

import React from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

export function WalletConnectPill() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    const formatted = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    return (
      <div className="flex items-center gap-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-mono bg-neutral-900 border border-neutral-700 text-neutral-200 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{formatted}</span>
        </div>
        <button
          onClick={() => disconnect()}
          className="text-xs text-neutral-400 hover:text-neutral-200 underline"
          title="Disconnect wallet"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => {
        const injectedConnector = connectors[0];
        if (injectedConnector) {
          connect({ connector: injectedConnector });
        }
      }}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-100 border border-neutral-600 rounded-md transition-colors"
    >
      <span className="w-2 h-2 rounded-full bg-neutral-500" />
      Connect Wallet
    </button>
  );
}
