'use client';

import React, { useEffect } from 'react';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('Global Root Error caught:', error);
    if (
      error?.name === 'ChunkLoadError' ||
      error?.message?.includes('Loading chunk') ||
      error?.message?.includes('Failed to fetch dynamically imported module')
    ) {
      window.location.reload();
    }
  }, [error]);

  return (
    <html lang="en">
      <body style={{
        background: '#0f172a',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        margin: 0,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        textAlign: 'center',
        padding: '20px'
      }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '12px' }}>
          Daily Brief - Session Refresh
        </h2>
        <p style={{ color: '#94a3b8', marginBottom: '24px', maxWidth: '460px', fontSize: '14px', lineHeight: 1.6 }}>
          A new version of the application was deployed. Click below to continue with the latest updates.
        </p>
        <button
          onClick={() => {
            if (reset) reset();
            else window.location.reload();
          }}
          style={{
            padding: '12px 28px',
            background: '#059669',
            color: '#ffffff',
            borderRadius: '8px',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            fontSize: '15px'
          }}
        >
          Reload Application
        </button>
      </body>
    </html>
  );
}
