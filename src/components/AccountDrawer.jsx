"use client";

import React, { useEffect } from 'react';
import { 
  X, 
  Lock, 
  Mail, 
  Phone,
  Sparkles
} from 'lucide-react';
import AccountMenuItem from './AccountMenuItem';
import SubscriptionSection from './SubscriptionSection';

export default function AccountDrawer({ 
  isOpen, 
  onClose, 
  user, 
  isLoggedIn = true, 
  onLogout, 
  onOpenSubscribe,
  onOpenBookmarks,
  onOpenLogin,
  supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'customersupport@dailybrief.com',
  supportPhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE || '1800 102 1878'
}) {
  // ESC Key listener and Body Scroll Lock
  useEffect(() => {
    if (!isOpen) return;

    // Lock page background scrolling while drawer is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Handle ESC key press to close drawer
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isSubscriber = user?.isSubscriber || user?.isPremium || false;
  const userEmail = user?.email || user?.username || 'user@example.com';

  const benefitsList = [
    { id: 'investigations', name: 'Special Investigations', icon: <Lock size={16} color="#b91c1c" /> },
    { id: 'webinars', name: 'Webinars', icon: <Lock size={16} color="#b91c1c" /> },
    { id: 'newsletters', name: 'Newsletters', icon: <Lock size={16} color="#b91c1c" /> },
    { id: 'games', name: 'Games', icon: <Lock size={16} color="#b91c1c" /> },
    { id: 'digest', name: 'Monthly Digest', icon: <Lock size={16} color="#b91c1c" /> }
  ];


  const handleBenefitClick = (benefit) => {
    if (!isSubscriber && onOpenSubscribe) {
      onClose();
      onOpenSubscribe();
    } else {
      alert(`Opening ${benefit.name}... Available with Premium Subscription.`);
    }
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-label="Account Settings Drawer"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 999999,
        display: 'flex',
        justifyContent: 'flex-end',
        animation: 'fadeIn 0.25s ease-in-out'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '500px',
          height: '100vh',
          background: '#ffffff',
          color: '#0f172a',
          boxShadow: '-10px 0 35px rgba(0,0,0,0.35)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Section 1: Top Account Grey Card */}
        <div 
          style={{ 
            background: '#f3f4f6', 
            padding: '20px 24px 24px 24px', 
            borderBottom: '1px solid #e5e7eb' 
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4px' }}>
            <div>
              <div style={{ color: '#b91c1c', fontSize: '13px', fontWeight: 700, letterSpacing: '0.2px' }}>
                You are logged in
              </div>
              <div 
                style={{ 
                  color: '#0f172a', 
                  fontSize: '15px', 
                  fontWeight: 800, 
                  wordBreak: 'break-all', 
                  marginTop: '2px',
                  marginBottom: '16px' 
                }}
              >
                {userEmail}
              </div>
            </div>

            {/* Close Button */}
            <button 
              type="button"
              onClick={onClose}
              aria-label="Close account drawer"
              style={{
                background: 'none',
                border: 'none',
                color: '#475569',
                padding: '4px',
                cursor: 'pointer',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#0f172a'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#475569'}
            >
              <X size={22} />
            </button>
          </div>

          {/* Prominent OUTLINE LOGOUT Button */}
          {isLoggedIn && (
            <button
              type="button"
              onClick={() => {
                if (onLogout) onLogout();
                onClose();
              }}
              aria-label="Logout from account"
              style={{
                width: '100%',
                background: '#ffffff',
                border: '1px solid #0f172a',
                borderRadius: '2px',
                padding: '11px',
                color: '#0f172a',
                fontWeight: 800,
                fontSize: '13.5px',
                letterSpacing: '1px',
                cursor: 'pointer',
                marginBottom: '16px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#0f172a';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.color = '#0f172a';
              }}
            >
              LOGOUT
            </button>
          )}

          {/* Dynamic Subscription Status Section */}
          <SubscriptionSection
            isLoggedIn={isLoggedIn}
            isSubscriber={isSubscriber}
            onOpenSubscribe={onOpenSubscribe}
            onOpenLogin={onOpenLogin}
          />
        </div>

        {/* Section 2: Subscription Benefits List */}
        <div style={{ padding: '24px', flex: 1 }}>
          <div 
            style={{ 
              color: '#b91c1c', 
              fontSize: '13px', 
              fontWeight: 700, 
              lineHeight: '1.45', 
              marginBottom: '16px' 
            }}
          >
            Account subscription benefits alongside Premium Stories, Editorials, Opinions and more. Unlock these with Subscription
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {benefitsList.map((item) => (
              <AccountMenuItem
                key={item.id}
                icon={isSubscriber ? <Sparkles size={16} color="#059669" /> : item.icon}
                label={item.name}
                onClick={() => handleBenefitClick(item)}
              />
            ))}
          </div>

          {/* Section 3: Account Settings */}
          <div 
            style={{ 
              color: '#b91c1c', 
              fontSize: '13px', 
              fontWeight: 700, 
              marginTop: '28px', 
              marginBottom: '12px' 
            }}
          >
            Account Settings
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <AccountMenuItem
              label="Go to My Account"
              isSubtle={true}
              onClick={() => {
                alert(`My Account Settings\nEmail: ${userEmail}\nStatus: ${isSubscriber ? 'Premium Member' : 'Free Reader'}`);
              }}
            />

            <AccountMenuItem
              label="Bookmarks"
              isSubtle={true}
              onClick={() => {
                onClose();
                if (onOpenBookmarks) onOpenBookmarks();
                else alert("Your Saved Bookmarks opened.");
              }}
            />
          </div>

          {/* Section 4: Support Section */}
          <div 
            style={{ 
              color: '#b91c1c', 
              fontSize: '13px', 
              fontWeight: 700, 
              marginTop: '30px', 
              marginBottom: '14px' 
            }}
          >
            Need help with your subscription?
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '20px' }}>
            <a 
              href={`mailto:${supportEmail}`}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                color: '#0f172a', 
                textDecoration: 'none', 
                fontSize: '13.5px', 
                fontWeight: 600, 
                borderBottom: '1px solid #e2e8f0', 
                paddingBottom: '10px' 
              }}
            >
              <Mail size={18} color="#b91c1c" />
              <span>{supportEmail}</span>
            </a>

            <a 
              href={`tel:${supportPhone.replace(/\s+/g, '')}`} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                color: '#0f172a', 
                textDecoration: 'none', 
                fontSize: '14px', 
                fontWeight: 700 
              }}
            >
              <Phone size={18} color="#b91c1c" />
              <span>{supportPhone}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
