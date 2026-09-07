'use client';

import React, { useEffect } from 'react';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('App Route Error caught by boundary:', error);
    // If it's a ChunkLoadError from a new deployment, auto reload to fetch new bundles
    if (
      error?.name === 'ChunkLoadError' ||
      error?.message?.includes('Loading chunk') ||
      error?.message?.includes('Failed to fetch dynamically imported module')
    ) {
      const lastReload = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('last_chunk_reload') : null;
      const now = Date.now();
      if (!lastReload || now - Number(lastReload) > 10000) {
        if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('last_chunk_reload', String(now));
        window.location.reload();
      }
    }
  }, [error]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      padding: '40px 20px',
      textAlign: 'center',
      color: 'var(--text-primary, #1e293b)'
    }}>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '12px' }}>
        Unable to Load Page Content
      </h2>
      <p style={{ color: '#64748b', marginBottom: '24px', maxWidth: '460px', fontSize: '14px' }}>
        An unexpected error occurred while rendering this page. Click below to reload.
      </p>
      <button
        onClick={() => {
          if (reset) reset();
          else window.location.reload();
        }}
        style={{
          padding: '10px 24px',
          background: 'var(--accent-crimson, #dc2626)',
          color: '#ffffff',
          borderRadius: '8px',
          fontWeight: 600,
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
        }}
      >
        Reload Page
      </button>
    </div>
  );
}
