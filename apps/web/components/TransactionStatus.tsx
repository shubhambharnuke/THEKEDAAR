'use client';

import React from 'react';

export type TxStep = 'idle' | 'awaiting_signature' | 'submitted' | 'mining' | 'confirmed' | 'reverted' | 'error';

interface TransactionStatusProps {
  step: TxStep;
  txHash?: string;
  blockNumber?: number;
  errorMessage?: string;
  className?: string;
}

export function TransactionStatus({
  step,
  txHash,
  blockNumber,
  errorMessage,
  className = '',
}: TransactionStatusProps) {
  if (step === 'idle') return null;

  const shortHash = txHash ? `${txHash.substring(0, 10)}...${txHash.substring(txHash.length - 8)}` : null;

  return (
    <div className={`p-3 rounded border text-xs font-mono transition-all ${className} ${
      step === 'confirmed'
        ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
        : step === 'reverted' || step === 'error'
        ? 'bg-rose-950/40 border-rose-800 text-rose-300'
        : 'bg-neutral-900 border-neutral-700 text-neutral-300'
    }`}>
      <div className="flex items-center gap-2">
        {step === 'awaiting_signature' && (
          <>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Awaiting signature in your wallet...</span>
          </>
        )}
        {step === 'submitted' && (
          <>
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span>Transaction submitted to Besu network. Waiting for consensus...</span>
          </>
        )}
        {step === 'mining' && (
          <>
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-spin" />
            <span>Consensus pending in QBFT round...</span>
          </>
        )}
        {step === 'confirmed' && (
          <>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Confirmed on-chain {blockNumber ? `in block #${blockNumber}` : ''}!</span>
          </>
        )}
        {step === 'reverted' && (
          <>
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Transaction reverted on-chain (e.g. slot conflict or unauthorized).</span>
          </>
        )}
        {step === 'error' && (
          <>
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Error: {errorMessage || 'Transaction failed.'}</span>
          </>
        )}
      </div>

      {shortHash && (
        <div className="mt-1 text-[11px] text-neutral-400">
          Tx Hash: <span className="text-neutral-200">{shortHash}</span>
        </div>
      )}
    </div>
  );
}
