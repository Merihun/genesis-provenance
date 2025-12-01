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
    <div className="flex h-16 items-center justify-between border-b bg-white px-4 lg:px-6">
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        className="lg:hidden min-h-[44px] px-3"
        onClick={onMobileMenuOpen}
      >
        <Menu className="h-6 w-6" />
        <span className="sr-only">Open menu</span>
      </Button>

      {/* Organization Name */}
      <div className="hidden lg:block">
        {organizationName && (
          <div className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{organizationName}</span>
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
          <button className="flex items-center gap-2 lg:gap-3 rounded-lg p-2 hover:bg-gray-100 transition-colors min-h-[44px]">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-gray-900">{userName ?? 'User'}</div>
              <div className="text-xs text-gray-500">{userEmail ?? ''}</div>
            </div>
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-blue-900 text-white text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span>{userName ?? 'User'}</span>
              <span className="text-xs font-normal text-gray-500">{userEmail}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push('/settings')}>
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    </div>
  );
}
