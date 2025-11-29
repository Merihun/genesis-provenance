'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, Settings, Users, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DashboardSidebarProps {
  userRole?: string;
}

export function DashboardSidebar({ userRole }: DashboardSidebarProps) {
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

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900 text-white">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-gray-800 px-6">
        <Link href="/dashboard" className="text-xl font-serif font-bold" style={{ fontFamily: 'var(--font-playfair)' }}>
          Genesis Provenance
        </Link>
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
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-900 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon className="h-5 w-5" />
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
          className="w-full justify-start text-gray-300 hover:bg-gray-800 hover:text-white"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
