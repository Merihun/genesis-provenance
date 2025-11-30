'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, Settings, Users, LogOut, X } from 'lucide-react';
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
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'My Vault', href: '/vault', icon: Package },
    { name: 'Team', href: '/team', icon: Users },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  // Add admin link if user is admin
  if (userRole === 'admin') {
    navigation.push({ name: 'Admin', href: '/admin', icon: Users });
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
          className="fixed inset-0 z-40 bg-gray-900/80 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobileMenu}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'flex h-full w-64 flex-col bg-gray-900 text-white transition-transform duration-300 ease-in-out z-50',
          'lg:relative lg:translate-x-0',
          isMobileMenuOpen
            ? 'fixed inset-y-0 left-0 translate-x-0'
            : 'fixed inset-y-0 left-0 -translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo and Close Button */}
        <div className="flex h-16 items-center justify-between border-b border-gray-800 px-6">
          <Link
            href="/dashboard"
            className="text-xl font-serif font-bold"
            style={{ fontFamily: 'var(--font-playfair)' }}
            onClick={handleLinkClick}
          >
            Genesis Provenance
          </Link>
          {/* Close button for mobile */}
          <button
            onClick={onCloseMobileMenu}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={handleLinkClick}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors',
                  'min-h-[44px]', // Ensures minimum touch target size
                  isActive
                    ? 'bg-blue-900 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white active:bg-gray-700'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Sign Out */}
        <div className="border-t border-gray-800 p-3">
          <Button
            onClick={handleSignOut}
            variant="ghost"
            className="w-full justify-start text-gray-300 hover:bg-gray-800 hover:text-white min-h-[44px]"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </div>
    </>
  );
}
