'use client';

import { useState } from 'react';
import { DashboardSidebar } from './dashboard-sidebar';
import { DashboardTopbar } from './dashboard-topbar';

interface DashboardLayoutWrapperProps {
  children: React.ReactNode;
  userRole?: string;
  userName?: string;
  userEmail?: string;
  organizationName?: string;
}

export function DashboardLayoutWrapper({
  children,
  userRole,
  userName,
  userEmail,
  organizationName,
}: DashboardLayoutWrapperProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <DashboardSidebar
        userRole={userRole}
        isMobileMenuOpen={mobileMenuOpen}
        onCloseMobileMenu={() => setMobileMenuOpen(false)}
      />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <DashboardTopbar
          userName={userName}
          userEmail={userEmail}
          organizationName={organizationName}
          onMobileMenuOpen={() => setMobileMenuOpen(true)}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
