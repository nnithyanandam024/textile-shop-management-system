/**
 * Phase 14 — ConnectionStatusIndicator Component
 * Clean, subtle status pill without raw emojis, utilizing normalized CSS dot indicators.
 */
import React from 'react';
import useConnectionStatus from '../../hooks/useConnectionStatus';

export const ConnectionStatusIndicator: React.FC = () => {
  const { isConnected, isConnecting, reconnect } = useConnectionStatus();

  let dotColor = 'bg-rose-500';
  let label = 'Offline';
  let title = 'Real-time connection offline. Click to reconnect.';

  if (isConnected) {
    dotColor = 'bg-emerald-500';
    label = 'Live';
    title = 'Real-time synchronization active';
  } else if (isConnecting) {
    dotColor = 'bg-amber-400 animate-pulse';
    label = 'Connecting...';
    title = 'Connecting to real-time service...';
  }

  return (
    <div
      onClick={!isConnected ? reconnect : undefined}
      title={title}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-default ${
        isConnected
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          : isConnecting
          ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
          : 'bg-rose-500/10 text-rose-400 border-rose-500/20 cursor-pointer hover:bg-rose-500/20'
      }`}
    >
      <span className={`w-2 h-2 rounded-full ${dotColor}`} />
      <span>{label}</span>
    </div>
  );
};

export default ConnectionStatusIndicator;
