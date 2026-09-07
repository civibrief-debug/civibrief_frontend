'use client';

import React, { useState } from 'react';
import { Header } from './Header';
import { SearchOverlay } from './SearchOverlay';
import { NewsletterModal } from './NewsletterModal';
import { LoginModal } from './LoginModal';
import { Footer } from './Footer';
import { TranslationProvider } from '../context/TranslationContext';

export function ClientLayout({ children }) {
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
  );
}
