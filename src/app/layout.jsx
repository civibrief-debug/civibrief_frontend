'use client';

import React, { useState } from 'react';
import './globals.css';
import { Header } from '../components/Header';
import { SearchOverlay } from '../components/SearchOverlay';
import { NewsletterModal } from '../components/NewsletterModal';
import { LoginModal } from '../components/LoginModal';
import { NavDrawer } from '../components/NavDrawer';
import { Footer } from '../components/Footer';
import { TranslationProvider } from '../context/TranslationContext';

export default function RootLayout({ children }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNewsletterOpen, setIsNewsletterOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
    setIsLoginOpen(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>DAILY BRIEF | Independent Tech, Business & Global News</title>
        <meta name="description" content="Daily Brief brings you authoritative intelligence on artificial intelligence, sovereign tech, global markets, and energy transitions." />
        <meta httpEquiv="x-dns-prefetch-control" content="on" />
        <link rel="preload" href="/videos/make-money-poster.jpg" as="image" fetchPriority="high" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body suppressHydrationWarning>
        <TranslationProvider>
          <Header 
            onOpenSearch={() => setIsSearchOpen(true)}
            onOpenNewsletter={() => setIsNewsletterOpen(true)}
            onOpenMenu={() => setIsMenuOpen(!isMenuOpen)}
            onCloseMenu={() => setIsMenuOpen(false)}
            isMenuOpen={isMenuOpen}
            onOpenLogin={() => setIsLoginOpen(true)}
            isLoggedIn={isLoggedIn}
            user={user}
            onLogout={handleLogout}
          />
          
          {children}

          <Footer />

          {isSearchOpen && (
            <SearchOverlay onClose={() => setIsSearchOpen(false)} />
          )}

          {isNewsletterOpen && (
            <NewsletterModal onClose={() => setIsNewsletterOpen(false)} />
          )}

          {isLoginOpen && (
            <LoginModal 
              onClose={() => setIsLoginOpen(false)}
              onLoginSuccess={handleLoginSuccess}
            />
          )}
        </TranslationProvider>
      </body>
    </html>
  );
}
