import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { DashboardLayoutWrapper } from '@/components/dashboard/dashboard-layout-wrapper';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/login');
  }

  const user = session?.user as any;

  return (
    <DashboardLayoutWrapper
      userRole={user?.role}
      userName={user?.name ?? undefined}
      userEmail={user?.email ?? undefined}
      organizationName={user?.organizationName ?? undefined}
    >
      {children}
    </DashboardLayoutWrapper>
  );
}
