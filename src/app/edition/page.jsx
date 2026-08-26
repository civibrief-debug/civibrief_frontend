'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Download, ChevronLeft, ChevronRight, ArrowLeft, Lock, CheckCircle2 } from 'lucide-react';
import { downloadDigitalEditionPDF } from '../../utils/downloadPdf';
import { LoginModal } from '../../components/LoginModal';

export default function DigitalEditionPage() {
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownload = () => {
    if (!isLoggedIn) {
      setIsLoginOpen(true);
      return;
    }
    setDownloading(true);
    setTimeout(() => {
      const success = downloadDigitalEditionPDF(page);
      setDownloading(false);
      if (success) {
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 3000);
      }
    }, 400);
  };

  return (
    <main style={{ maxWidth: '1200px', margin: '30px auto', padding: '0 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <Link href="/" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={16} />
          <span>Return to Homepage</span>
        </Link>

        {isLoggedIn ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-secondary)', padding: '6px 14px', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: 600 }}>
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>
                <ChevronLeft size={16} color={page === 1 ? 'var(--text-muted)' : 'var(--text-primary)'} />
              </button>
              <span>Page {page} of 12</span>
              <button onClick={() => setPage(Math.min(12, page + 1))} disabled={page === 12}>
                <ChevronRight size={16} color={page === 12 ? 'var(--text-muted)' : 'var(--text-primary)'} />
              </button>
            </div>

            <button 
              onClick={handleDownload}
              disabled={downloading}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                background: downloadSuccess ? '#059669' : 'var(--accent-emerald)', 
                color: '#fff', 
                border: 'none',
                padding: '8px 18px', 
                borderRadius: 'var(--radius-sm)', 
                fontWeight: 700, 
                fontSize: '13px',
                cursor: downloading ? 'wait' : 'pointer'
              }}
            >
              {downloadSuccess ? <CheckCircle2 size={15} /> : <Download size={15} />}
              <span>{downloading ? 'Preparing PDF...' : downloadSuccess ? 'Downloaded!' : 'Download Edition PDF'}</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-crimson)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Lock size={13} />
              SUBSCRIBER ONLY 💎
            </span>
            <button
              onClick={() => setIsLoginOpen(true)}
              style={{
                background: 'var(--accent-crimson, #dc2626)',
                color: '#ffffff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Log In to Unlock 💎
            </button>
          </div>
        )}
      </div>

      {/* Subscriber Locked Gated View vs Digital Replica Frame */}
      {!isLoggedIn ? (
        <div style={{
          background: 'var(--bg-secondary, #1e293b)',
          borderRadius: 'var(--radius-lg, 12px)',
          padding: '60px 24px',
          textAlign: 'center',
          color: '#ffffff',
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{
            background: 'rgba(220, 38, 38, 0.15)',
            border: '1px solid rgba(220, 38, 38, 0.4)',
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <Lock size={34} color="#f87171" />
          </div>

          <div style={{ fontSize: '12px', fontWeight: 800, color: '#f87171', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
            SUBSCRIBER ONLY CONTENT 💎
          </div>

          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 900, marginBottom: '14px', color: '#ffffff' }}>
            Daily Brief Digital Edition & Downloadable PDF
          </h1>

          <p style={{ fontSize: '15px', color: '#cbd5e1', maxWidth: '580px', margin: '0 auto 28px', lineHeight: 1.6 }}>
            Access to our daily broadsheet replica edition and vector PDF downloads is reserved for paid subscribers and verified members. Log in or subscribe to get unlimited daily access.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <button
              onClick={() => setIsLoginOpen(true)}
              style={{
                background: '#dc2626',
                color: '#ffffff',
                border: 'none',
                fontSize: '15px',
                fontWeight: 800,
                padding: '12px 28px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(220,38,38,0.4)'
              }}
            >
              <Lock size={16} />
              <span>Log In as Subscriber 💎</span>
            </button>
          </div>
        </div>
      ) : (
        <div style={{ background: '#334155', borderRadius: 'var(--radius-lg)', padding: '40px', display: 'flex', justifyContent: 'center', overflow: 'auto', minHeight: '800px' }}>
          <div 
            style={{ 
              width: `${(760 * zoom) / 100}px`, 
              background: '#ffffff', 
              borderRadius: '4px', 
              padding: '48px', 
              boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
              color: '#0f172a',
              transition: 'width 0.2s ease-out'
            }}
          >
            {/* Replica Header */}
            <div style={{ textAlign: 'center', borderBottom: '3px double #0f172a', paddingBottom: '20px', marginBottom: '24px' }}>
              <div style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: '#64748b', marginBottom: '8px' }}>
                <span>GLOBAL DIGITAL EDITION</span>
                <span>MONDAY, AUGUST 3, 2026</span>
                <span>VOL. XII NO. 214</span>
              </div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '48px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.5px' }}>
                DAILY BRIEF
              </h1>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#059669', letterSpacing: '1px', marginTop: '4px' }}>
                SUBSCRIBER EXCLUSIVE DIGITAL REPLICA
              </div>
            </div>

            {/* Replica Page Content Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-emerald)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
                  FRONT PAGE FEATURE
                </div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 800, lineHeight: 1.25, marginBottom: '12px' }}>
                  The Architecture of Tomorrow: Next-Gen Compute Models Shift Global Tech Power
                </h2>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: '14px', lineHeight: 1.6, color: '#334155', marginBottom: '16px' }}>
                  Across cleanrooms in Silicon Saxony and Hsinchu, semiconductor physics is reaching its theoretical boundaries as 2nm nodes enter high-volume production...
                </p>
                <div style={{ height: '220px', background: '#f1f5f9', borderRadius: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '13px', gap: '12px' }}>
                  <span>[ Digital Edition BroadSheet View — Page {page} ]</span>
                  <button 
                    onClick={handleDownload}
                    style={{
                      background: '#059669',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 18px',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Download size={15} />
                    <span>Download BroadSheet PDF</span>
                  </button>
                </div>
              </div>

              <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '24px' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', fontWeight: 800, color: 'var(--accent-emerald)', marginBottom: '8px' }}>
                  Transcontinental Supergrids
                </h3>
                <p style={{ fontSize: '13px', lineHeight: 1.5, color: '#475569', marginBottom: '16px' }}>
                  High-voltage DC cables linking North Africa to Southern Europe promise round-the-clock solar generation...
                </p>
                <hr style={{ borderColor: '#e2e8f0', margin: '16px 0' }} />
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', fontWeight: 800, color: 'var(--accent-emerald)', marginBottom: '8px' }}>
                  Autonomous Freight Voyages
                </h3>
                <p style={{ fontSize: '13px', lineHeight: 1.5, color: '#475569' }}>
                  Electric cargo ships complete first unmanned transpacific voyage setting zero-emission trade standards...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {isLoginOpen && (
        <LoginModal 
          onClose={() => setIsLoginOpen(false)}
          onLoginSuccess={() => {
            setIsLoggedIn(true);
            setIsLoginOpen(false);
          }}
        />
      )}
    </main>
  );
}
