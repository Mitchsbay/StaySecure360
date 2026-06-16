'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header className="bg-dark-950/80 backdrop-blur-md border-b border-dark-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold text-white tracking-tight">
            Stay Secure <span className="text-primary-500">360</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-dark-300 hover:text-white transition-colors text-sm">Home</Link>
            <Link href="/categories" className="text-dark-300 hover:text-white transition-colors text-sm">Categories</Link>
            <Link href="/products" className="text-dark-300 hover:text-white transition-colors text-sm">Products</Link>
            <Link href="/articles" className="text-dark-300 hover:text-white transition-colors text-sm">Articles</Link>
            <Link href="/about" className="text-dark-300 hover:text-white transition-colors text-sm">About</Link>
            <Link href="/contact" className="text-dark-300 hover:text-white transition-colors text-sm">Contact</Link>
          </nav>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-dark-300 hover:text-white"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu — rendered as overlay below header, not pushing content */}
      {mobileOpen && (
        <div className="md:hidden absolute left-0 right-0 bg-dark-950 border-b border-dark-800 shadow-xl z-50">
          <nav className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            <Link href="/" className="block px-3 py-2 text-dark-300 hover:text-white hover:bg-dark-800 rounded-lg transition-colors text-sm">Home</Link>
            <Link href="/categories" className="block px-3 py-2 text-dark-300 hover:text-white hover:bg-dark-800 rounded-lg transition-colors text-sm">Categories</Link>
            <Link href="/products" className="block px-3 py-2 text-dark-300 hover:text-white hover:bg-dark-800 rounded-lg transition-colors text-sm">Products</Link>
            <Link href="/articles" className="block px-3 py-2 text-dark-300 hover:text-white hover:bg-dark-800 rounded-lg transition-colors text-sm">Articles</Link>
            <Link href="/about" className="block px-3 py-2 text-dark-300 hover:text-white hover:bg-dark-800 rounded-lg transition-colors text-sm">About</Link>
            <Link href="/contact" className="block px-3 py-2 text-dark-300 hover:text-white hover:bg-dark-800 rounded-lg transition-colors text-sm">Contact</Link>
          </nav>
        </div>
      )}
    </header>
  );
}
