"use client";

import React from 'react';
import { CheckCircle, ShieldCheck } from 'lucide-react';

export default function SubscriptionSection({
  isLoggedIn,
  isSubscriber,
  onOpenSubscribe,
  onOpenLogin
}) {
  if (!isLoggedIn) {
    return (
      <div style={{ marginTop: '8px' }}>
        <div style={{ color: '#1e293b', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
          Welcome to Daily Brief News
        </div>
        <div style={{ color: '#64748b', fontSize: '12px', lineHeight: '1.45', marginBottom: '14px' }}>
          Sign in to access your saved articles, news preferences, bookmarks and active subscription.
        </div>
        <button
          type="button"
          onClick={onOpenLogin}
          aria-label="Login or Sign In to your account"
          style={{
            width: '100%',
            background: '#b91c1c',
            color: '#ffffff',
            border: 'none',
            borderRadius: '2px',
            padding: '12px',
            fontWeight: 800,
            fontSize: '14px',
            letterSpacing: '0.5px',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(185, 28, 28, 0.25)',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#991b1b'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#b91c1c'}
        >
          LOG IN / SIGN IN
        </button>
      </div>
    );
  }

  if (isSubscriber) {
    return (
      <div style={{ marginTop: '4px' }}>
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            background: 'rgba(16, 185, 129, 0.12)', 
            border: '1px solid rgba(16, 185, 129, 0.35)', 
            borderRadius: '4px', 
            padding: '12px 14px', 
            marginBottom: '14px' 
          }}
        >
          <CheckCircle size={20} color="#059669" />
          <div>
            <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#059669' }}>Your subscription is active.</div>
            <div style={{ fontSize: '11.5px', color: '#047857' }}>All Premium Stories, Deep Dives & Editorials unlocked</div>
          </div>
        </div>


        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            type="button"
            onClick={onOpenSubscribe}
            aria-label="View Subscription details"
            style={{
              width: '100%',
              background: '#ffffff',
              border: '1px solid #059669',
              color: '#059669',
              borderRadius: '2px',
              padding: '9px 8px',
              fontWeight: 700,
              fontSize: '12.5px',
              cursor: 'pointer'
            }}
          >
            View Plan
          </button>
          <button
            type="button"
            onClick={onOpenSubscribe}
            aria-label="Manage Subscription settings"
            style={{
              width: '100%',
              background: '#059669',
              border: 'none',
              color: '#ffffff',
              borderRadius: '2px',
              padding: '9px 8px',
              fontWeight: 700,
              fontSize: '12.5px',
              cursor: 'pointer'
            }}
          >
            Manage Plan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '4px' }}>
      <div style={{ color: '#1e293b', fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
        You don't have any Active Subscription.
      </div>

      <button
        type="button"
        onClick={onOpenSubscribe}
        aria-label="Subscribe now to unlock premium access"
        style={{
          width: '100%',
          background: '#b91c1c',
          color: '#ffffff',
          border: 'none',
          borderRadius: '2px',
          padding: '12px',
          fontWeight: 800,
          fontSize: '14px',
          letterSpacing: '0.75px',
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(185, 28, 28, 0.25)',
          transition: 'background 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = '#991b1b'}
        onMouseLeave={(e) => e.currentTarget.style.background = '#b91c1c'}
      >
        SUBSCRIBE NOW
      </button>

      <div style={{ color: '#64748b', fontSize: '12px', lineHeight: '1.45', marginTop: '12px' }}>
        Subscribed with another email? Logout and Login with that one.
      </div>
    </div>
  );
}
