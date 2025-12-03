'use client';

import { Menu } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { NotificationPanel } from '@/components/dashboard/notification-panel';

interface DashboardTopbarProps {
  userName?: string;
  userEmail?: string;
  organizationName?: string;
  onMobileMenuOpen?: () => void;
}

export function DashboardTopbar({ userName, userEmail, organizationName, onMobileMenuOpen }: DashboardTopbarProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const initials = userName
    ?.split(' ')
    ?.map((n) => n?.[0])
    ?.join('')
    ?.toUpperCase() ?? 'U';

  return (
    <div className="flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-sm px-4 lg:px-6 shadow-sm">
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        className="lg:hidden min-h-[44px] px-3 text-slate-700 hover:text-slate-900 hover:bg-slate-100"
        onClick={onMobileMenuOpen}
      >
        <Menu className="h-6 w-6" />
        <span className="sr-only">Open menu</span>
      </Button>

      {/* Organization Name */}
      <div className="hidden lg:block">
        {organizationName && (
          <div className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{organizationName}</span>
          </div>
        )}
      </div>

      {/* Right side - Notifications and User Menu */}
      <div className="flex items-center gap-2">
        {/* Notification Panel */}
        <NotificationPanel />

        {/* User Dropdown */}
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 lg:gap-3 rounded-lg p-2 hover:bg-slate-100 transition-colors duration-200 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-yellow-500">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-slate-900">{userName ?? 'User'}</div>
              <div className="text-xs text-slate-600">{userEmail ?? ''}</div>
            </div>
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-gradient-to-br from-slate-700 to-slate-800 text-white text-sm font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="text-slate-900">{userName ?? 'User'}</span>
              <span className="text-xs font-normal text-slate-600">{userEmail}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => router.push('/settings')}
            className="cursor-pointer text-slate-700 hover:text-slate-900 focus:text-slate-900"
          >
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleSignOut}
            className="cursor-pointer text-slate-700 hover:text-red-600 focus:text-red-600"
          >
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    </div>
  );
}
