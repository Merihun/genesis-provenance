import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    const organizationId = user.organizationId;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 400 }
      );
    }

    const subscription = await prisma.subscription.findUnique({
      where: { organizationId },
    });

    if (!subscription) {
      // Return default trial status if no subscription exists
      return NextResponse.json({
        plan: 'collector',
        status: 'trialing',
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      });
    }

    return NextResponse.json({
      plan: subscription.plan,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      trialEnd: subscription.trialEnd,
      canceledAt: subscription.canceledAt,
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription data' },
      { status: 500 }
    );
  }
}
