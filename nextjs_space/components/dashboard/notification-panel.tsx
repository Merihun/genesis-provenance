'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import {
  Bell,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertCircle,
  UserPlus,
  FileText,
  Loader2,
  Check,
  Trash2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

export function NotificationPanel() {
  const router = useRouter();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async (silent = false) => {
    try {
      const res = await fetch('/api/notifications?limit=20');
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } else if (!silent) {
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch notifications',
          variant: 'destructive',
        });
      }
    } catch (error) {
      if (!silent) {
        console.error('Error fetching notifications:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
      });

      if (res.ok) {
        fetchNotifications(true);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
      });

      const data = await res.json();
      if (res.ok) {
        toast({
          title: 'Success',
          description: 'All notifications marked as read',
        });
        fetchNotifications(true);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to mark notifications as read',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark notifications as read',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchNotifications(true);
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleDeleteAllRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'DELETE',
      });

      const data = await res.json();
      if (res.ok) {
        toast({
          title: 'Success',
          description: `Deleted ${data.count} read notifications`,
        });
        fetchNotifications(true);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete notifications',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete notifications',
        variant: 'destructive',
      });
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id);
    }

    // Navigate if there's an action URL
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
      setOpen(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    const iconMap: Record<string, any> = {
      comment_mention: MessageSquare,
      comment_reply: MessageSquare,
      approval_requested: AlertCircle,
      approval_approved: CheckCircle2,
      approval_rejected: XCircle,
      item_status_changed: FileText,
      team_member_added: UserPlus,
      team_member_removed: UserPlus,
      item_shared: FileText,
      system_alert: AlertCircle,
    };

    const Icon = iconMap[type] || Bell;
    return <Icon className="h-4 w-4" />;
  };

  const getNotificationColor = (type: string, isRead: boolean) => {
    if (isRead) return 'text-gray-400';

    const colorMap: Record<string, string> = {
      comment_mention: 'text-blue-600',
      comment_reply: 'text-blue-600',
      approval_requested: 'text-orange-600',
      approval_approved: 'text-green-600',
      approval_rejected: 'text-red-600',
      item_status_changed: 'text-purple-600',
      team_member_added: 'text-teal-600',
      team_member_removed: 'text-gray-600',
      item_shared: 'text-indigo-600',
      system_alert: 'text-yellow-600',
    };

    return colorMap[type] || 'text-gray-600';
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
                <Check className="mr-1 h-3 w-3" />
                Mark all read
              </Button>
            )}
            {notifications.some((n) => n.isRead) && (
              <Button variant="ghost" size="sm" onClick={handleDeleteAllRead}>
                <Trash2 className="mr-1 h-3 w-3" />
                Clear read
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">No notifications</p>
              <p className="text-xs text-gray-500">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'p-4 hover:bg-gray-50 cursor-pointer transition-colors',
                    !notification.isRead && 'bg-blue-50/50'
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    <div className={cn('mt-0.5', getNotificationColor(notification.type, notification.isRead))}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <p
                          className={cn(
                            'text-sm font-medium leading-snug',
                            notification.isRead ? 'text-gray-600' : 'text-gray-900'
                          )}
                        >
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <div className="flex-shrink-0 ml-2">
                            <div className="h-2 w-2 bg-blue-600 rounded-full" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  {notification.isRead && (
                    <div className="mt-2 flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNotification(notification.id);
                        }}
                        className="h-auto p-1 text-xs text-gray-500 hover:text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
