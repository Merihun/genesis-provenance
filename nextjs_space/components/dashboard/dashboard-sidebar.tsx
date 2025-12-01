'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, Settings, Users, LogOut, X, BarChart3, Shield, Sparkles } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DashboardSidebarProps {
  userRole?: string;
  isMobileMenuOpen?: boolean;
  onCloseMobileMenu?: () => void;
}

export function DashboardSidebar({ userRole, isMobileMenuOpen, onCloseMobileMenu }: DashboardSidebarProps) {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, badge: null },
    { name: 'My Vault', href: '/vault', icon: Package, badge: null },
    { name: 'Analytics', href: '/analytics', icon: BarChart3, badge: 'New' },
    { name: 'Team', href: '/team', icon: Users, badge: null },
    { name: 'Settings', href: '/settings', icon: Settings, badge: null },
  ];

  // Add admin link if user is admin
  if (userRole === 'admin') {
    navigation.push({ name: 'Admin', href: '/admin', icon: Shield, badge: null });
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const handleLinkClick = () => {
    if (onCloseMobileMenu) {
      onCloseMobileMenu();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobileMenu}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'flex h-full w-64 flex-col bg-gradient-to-b from-slate-900 to-slate-800 border-r border-slate-700/50 text-white transition-transform duration-300 ease-in-out z-50',
          'lg:relative lg:translate-x-0',
          isMobileMenuOpen
            ? 'fixed inset-y-0 left-0 translate-x-0 shadow-2xl'
            : 'fixed inset-y-0 left-0 -translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo and Close Button */}
        <div className="flex h-16 items-center justify-between border-b border-slate-700/50 px-6 bg-slate-900/80">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xl font-serif font-bold text-white transition-colors hover:text-yellow-400"
            style={{ fontFamily: 'var(--font-playfair)' }}
            onClick={handleLinkClick}
          >
            <Sparkles className="h-5 w-5 text-yellow-500" />
            <span className="hidden sm:inline">Genesis</span>
          </Link>
          {/* Close button for mobile */}
          <button
            onClick={onCloseMobileMenu}
            className="lg:hidden text-gray-300 hover:text-white transition-colors p-1 rounded-md hover:bg-slate-700/50"
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 px-3 py-6 overflow-y-auto scrollbar-thin">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={handleLinkClick}
                className={cn(
                  'group flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                  'min-h-[44px]', // Ensures minimum touch target size
                  isActive
                    ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 text-yellow-400 shadow-md border border-yellow-500/30'
                    : 'text-gray-100 hover:bg-slate-700/50 hover:text-white active:bg-slate-700 hover:border hover:border-slate-600'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn(
                    "h-5 w-5 flex-shrink-0 transition-transform duration-200",
                    isActive ? "text-yellow-400" : "text-gray-300 group-hover:text-yellow-500",
                    "group-hover:scale-110"
                  )} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="badge-gold text-[10px] px-2 py-0.5">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sign Out */}
        <div className="border-t border-slate-700/50 p-3 bg-slate-900/80">
          <Button
            onClick={handleSignOut}
            variant="ghost"
            className="w-full justify-start text-gray-100 hover:bg-slate-700/50 hover:text-white min-h-[44px] transition-all duration-200 hover:border hover:border-slate-600 rounded-xl group"
          >
            <LogOut className="mr-3 h-5 w-5 text-gray-300 group-hover:text-red-400 transition-colors" />
            <span>Sign Out</span>
          </Button>
        </div>
      </div>
    </>
  );
}
