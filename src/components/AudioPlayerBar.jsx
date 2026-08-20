'use client';

import React, { useState } from 'react';
import { Play, Pause, Volume2, X, FastForward, Rewind } from 'lucide-react';

export function AudioPlayerBar() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <div className="audio-player-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button 
          onClick={() => setIsPlaying(!isPlaying)} 
          style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--accent-emerald)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: '2px' }} />}
        </button>

        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-emerald)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Daily Brief Audio Digest • Official Broadcast
          </div>

          <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
            Next-Gen Compute Models & Global Energy Grids Overview
          </div>
        </div>
      </div>

      {/* Progress Line */}
      <div style={{ flex: 1, maxWidth: '400px', margin: '0 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>1:14</span>
        <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', position: 'relative' }}>
          <div style={{ width: '35%', height: '100%', background: 'var(--accent-emerald)', borderRadius: '2px' }}></div>
        </div>
        <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>5:00</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button style={{ color: '#94a3b8' }} title="Speed">1.0x</button>
        <button onClick={() => setIsDismissed(true)} style={{ color: '#94a3b8' }}>
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
