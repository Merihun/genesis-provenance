'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function MarketingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const navigation = [
    { name: 'Product', href: '/product' },
    { name: 'How It Works', href: '/how-it-works' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Use Cases', href: '/use-cases' },
    { name: 'Security', href: '/security' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/50 bg-white/95 backdrop-blur-md shadow-sm">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <div className="flex lg:flex-1">
            <Link href="/" className="-m-1.5 p-1.5 group">
              <span className="text-2xl font-serif font-bold text-slate-900 group-hover:text-yellow-600 transition-colors duration-200" style={{ fontFamily: 'var(--font-playfair)' }}>
                Genesis Provenance
              </span>
            </Link>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex lg:hidden">
            <button
              type="button"
              className="-m-2.5 inline-flex items-center justify-center rounded-lg p-2.5 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>

          {/* Desktop navigation */}
          <div className="hidden lg:flex lg:gap-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-semibold leading-6 text-slate-700 hover:text-yellow-600 transition-colors duration-200 relative group"
              >
                {item.name}
                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-yellow-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-center" />
              </Link>
            ))}
          </div>
          <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-4">
            <Link href="/auth/login">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0"
              >
                Get Started Free
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Mobile menu - Moved outside header for better z-index control */}
      <div className={`lg:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}>
        {/* Backdrop overlay */}
        <div 
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
        
        {/* Menu panel */}
        <div 
          className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-slate-900/10 shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile menu"
        >
          {/* Header with close button */}
          <div className="flex items-center justify-between mb-6">
            <Link href="/" className="-m-1.5 p-1.5" onClick={closeMobileMenu}>
              <span className="text-xl font-serif font-bold text-slate-900" style={{ fontFamily: 'var(--font-playfair)' }}>
                Genesis Provenance
              </span>
            </Link>
            <button
              type="button"
              className="-m-2.5 rounded-lg p-2.5 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              onClick={closeMobileMenu}
              aria-label="Close menu"
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          {/* Navigation links */}
          <div className="space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block rounded-lg px-3 py-3 text-base font-semibold text-slate-800 hover:bg-slate-50 hover:text-yellow-600 transition-colors"
                onClick={closeMobileMenu}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Divider */}
          <div className="my-6 border-t border-slate-200" />

          {/* Auth buttons */}
          <div className="space-y-3">
            <Link href="/auth/login" onClick={closeMobileMenu} className="block">
              <Button 
                variant="outline" 
                className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup" onClick={closeMobileMenu} className="block">
              <Button 
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white shadow-lg border-0"
              >
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
