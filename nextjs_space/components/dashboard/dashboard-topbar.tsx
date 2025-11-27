'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface DashboardTopbarProps {
  userName?: string;
  userEmail?: string;
  organizationName?: string;
}

export function DashboardTopbar({ userName, userEmail, organizationName }: DashboardTopbarProps) {
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
    <div className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div>
        {organizationName && (
          <div className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{organizationName}</span>
          </div>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-100 transition-colors">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">{userName ?? 'User'}</div>
              <div className="text-xs text-gray-500">{userEmail ?? ''}</div>
            </div>
            <Avatar>
              <AvatarFallback className="bg-blue-900 text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
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
  );
}
