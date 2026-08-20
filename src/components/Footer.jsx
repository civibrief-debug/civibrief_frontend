import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer style={{ background: 'var(--bg-dark-accent, #090d16)', color: '#f8fafc', padding: '60px 24px 30px', marginTop: '80px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
      <div style={{ maxWidth: 'var(--container-max, 1280px)', margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '40px', paddingBottom: '40px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div>
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ fontFamily: 'var(--font-serif, Georgia, serif)', fontSize: '30px', fontWeight: 900, marginBottom: '12px' }}>
              DAILY BRIEF
            </div>
          </Link>
          <p style={{ color: '#94a3b8', fontSize: '14px', maxWidth: '360px', lineHeight: 1.6 }}>
            Independent digital news & global intelligence. Delivering high-impact reporting across tech, markets, geopolitics, and deep-tech innovation.
          </p>
        </div>

        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.8px' }}>Sections</div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: '#cbd5e1', padding: 0, margin: 0 }}>
            <li><Link href="/" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Top Stories</Link></li>
            <li><Link href="/section/tech" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Tech & AI</Link></li>
            <li><Link href="/section/global" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Global Affairs</Link></li>
            <li><Link href="/section/markets" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Markets & Economy</Link></li>
            <li><Link href="/section/science" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Science & Climate</Link></li>
            <li><Link href="/section/sports" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Sports</Link></li>
          </ul>
        </div>

        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.8px' }}>Opinion & Deep Dives</div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: '#cbd5e1', padding: 0, margin: 0 }}>
            <li><Link href="/section/opinion" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Editorial Columns</Link></li>
            <li><Link href="/section/deep-dives" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Special Investigations 💎</Link></li>
            <li><Link href="/section/culture" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Culture & Design</Link></li>
          </ul>
        </div>


        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.8px' }}>Company</div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: '#cbd5e1', padding: 0, margin: 0 }}>
            <li><Link href="/" style={{ color: '#cbd5e1', textDecoration: 'none' }}>About Daily Brief</Link></li>
            <li><Link href="/" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Journalism Ethics</Link></li>
            <li><Link href="/" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Careers</Link></li>
            <li><Link href="/" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Press Room</Link></li>
          </ul>
        </div>
      </div>

      <div style={{ maxWidth: 'var(--container-max, 1280px)', margin: '24px auto 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', color: '#64748b' }}>
        <span>© 2026 Daily Brief Media Network. All rights reserved.</span>
        <span>Built with Next.js App Router</span>
      </div>
    </footer>
  );
}
