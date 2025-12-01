'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  MessageSquare,
  Reply,
  Edit2,
  Trash2,
  Loader2,
  Send,
  X,
  AtSign,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  fullName: string;
  email: string;
}

interface Comment {
  id: string;
  content: string;
  mentionedUserIds: string[];
  isEdited: boolean;
  parentCommentId: string | null;
  createdAt: string;
  updatedAt: string;
  user: User;
  replies?: Comment[];
}

interface CommentSectionProps {
  itemId: string;
}

export function CommentSection({ itemId }: CommentSectionProps) {
  const { data: session } = useSession() || {};
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionedUsers, setMentionedUsers] = useState<string[]>([]);

  useEffect(() => {
    fetchComments();
    fetchTeamMembers();
  }, [itemId]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/items/${itemId}/comments`);
      const data = await res.json();
      if (res.ok) {
        setComments(data.comments || []);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch comments',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const res = await fetch('/api/team');
      const data = await res.json();
      if (res.ok && data.teamMembers) {
        setTeamMembers(data.teamMembers.map((tm: any) => tm.user));
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@\[(.*?)\]\((.*?)\)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[2]); // Extract user ID from @[Name](userId)
    }
    return mentions;
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const mentions = extractMentions(newComment);
      const res = await fetch(`/api/items/${itemId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment,
          mentionedUserIds: mentions,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast({
          title: 'Success',
          description: 'Comment posted successfully',
        });
        setNewComment('');
        setMentionedUsers([]);
        fetchComments();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to post comment',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to post comment',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyText.trim()) return;

    setSubmitting(true);
    try {
      const mentions = extractMentions(replyText);
      const res = await fetch(`/api/items/${itemId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyText,
          mentionedUserIds: mentions,
          parentCommentId: parentId,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast({
          title: 'Success',
          description: 'Reply posted successfully',
        });
        setReplyText('');
        setReplyingTo(null);
        fetchComments();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to post reply',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to post reply',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editText.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/items/${itemId}/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editText }),
      });

      const data = await res.json();
      if (res.ok) {
        toast({
          title: 'Success',
          description: 'Comment updated successfully',
        });
        setEditingId(null);
        setEditText('');
        fetchComments();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to update comment',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update comment',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async () => {
    if (!commentToDelete) return;

    try {
      const res = await fetch(`/api/items/${itemId}/comments/${commentToDelete}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (res.ok) {
        toast({
          title: 'Success',
          description: 'Comment deleted successfully',
        });
        setDeleteDialogOpen(false);
        setCommentToDelete(null);
        fetchComments();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete comment',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete comment',
        variant: 'destructive',
      });
    }
  };

  const handleMention = (user: User, textSetter: (text: string) => void, currentText: string) => {
    const mention = `@[${user.fullName}](${user.id}) `;
    textSetter(currentText + mention);
    setShowMentionDropdown(false);
    setMentionSearch('');
    setMentionedUsers([...mentionedUsers, user.id]);
  };

  const renderMentions = (content: string) => {
    const mentionRegex = /@\[(.*?)\]\((.*?)\)/g;
    const parts = content.split(mentionRegex);
    return parts.map((part, i) => {
      // Every odd index is a mention name, and the next even index is the user ID
      if (i % 3 === 1) {
        return (
          <Badge key={i} variant="secondary" className="mx-1">
            @{part}
          </Badge>
        );
      } else if (i % 3 === 2) {
        return null; // Skip user IDs
      }
      return part;
    });
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const isAuthor = session?.user && (session.user as any).id === comment.user.id;
    const isEditing = editingId === comment.id;

    return (
      <div key={comment.id} className={cn('space-y-2', isReply && 'ml-8 border-l-2 border-gray-200 pl-4')}>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Avatar className="h-8 w-8 bg-blue-600 flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {comment.user.fullName.charAt(0)}
                </span>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-sm">{comment.user.fullName}</span>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </span>
                  {comment.isEdited && (
                    <Badge variant="outline" className="text-xs">
                      Edited
                    </Badge>
                  )}
                </div>
                {isEditing ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="min-h-[80px]"
                      placeholder="Edit your comment..."
                    />
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleEditComment(comment.id)}
                        disabled={submitting || !editText.trim()}
                      >
                        {submitting && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(null);
                          setEditText('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-700">{renderMentions(comment.content)}</p>
                )}
                <div className="flex items-center space-x-2">
                  {!isReply && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setReplyingTo(comment.id);
                        setReplyText('');
                      }}
                    >
                      <Reply className="mr-1 h-3 w-3" />
                      Reply
                    </Button>
                  )}
                  {isAuthor && !isEditing && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingId(comment.id);
                          setEditText(comment.content);
                        }}
                      >
                        <Edit2 className="mr-1 h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCommentToDelete(comment.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reply form */}
        {replyingTo === comment.id && (
          <Card className="ml-8">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Reply to {comment.user.fullName}</span>
                <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="relative">
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="min-h-[80px]"
                  placeholder="Write a reply..."
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => setShowMentionDropdown(!showMentionDropdown)}
                >
                  <AtSign className="h-4 w-4" />
                </Button>
                {showMentionDropdown && (
                  <Card className="absolute z-10 mt-1 max-h-48 w-64 overflow-y-auto">
                    <CardContent className="p-2">
                      {teamMembers
                        .filter((member) => member.id !== (session?.user as any)?.id)
                        .map((member) => (
                          <Button
                            key={member.id}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start"
                            onClick={() => handleMention(member, setReplyText, replyText)}
                          >
                            <Avatar className="mr-2 h-6 w-6 bg-blue-600 flex items-center justify-center">
                              <span className="text-white text-xs">{member.fullName.charAt(0)}</span>
                            </Avatar>
                            {member.fullName}
                          </Button>
                        ))}
                    </CardContent>
                  </Card>
                )}
              </div>
              <Button
                onClick={() => handleSubmitReply(comment.id)}
                disabled={submitting || !replyText.trim()}
                size="sm"
              >
                {submitting && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                <Send className="mr-2 h-3 w-3" />
                Post Reply
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-2">
            {comment.replies.map((reply) => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* New comment form */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-gray-500" />
            <span className="font-medium">Add a comment</span>
          </div>
          <div className="relative">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[100px]"
              placeholder="Share your thoughts or ask a question... Use @mention to tag team members"
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => setShowMentionDropdown(!showMentionDropdown)}
            >
              <AtSign className="h-4 w-4" />
            </Button>
            {showMentionDropdown && (
              <Card className="absolute z-10 mt-1 max-h-48 w-64 overflow-y-auto right-0">
                <CardContent className="p-2">
                  {teamMembers
                    .filter((member) => member.id !== (session?.user as any)?.id)
                    .map((member) => (
                      <Button
                        key={member.id}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => handleMention(member, setNewComment, newComment)}
                      >
                        <Avatar className="mr-2 h-6 w-6 bg-blue-600 flex items-center justify-center">
                          <span className="text-white text-xs">{member.fullName.charAt(0)}</span>
                        </Avatar>
                        {member.fullName}
                      </Button>
                    ))}
                </CardContent>
              </Card>
            )}
          </div>
          <Button onClick={handleSubmitComment} disabled={submitting || !newComment.trim()}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Send className="mr-2 h-4 w-4" />
            Post Comment
          </Button>
        </CardContent>
      </Card>

      {/* Comments list */}
      {comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2">No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => renderComment(comment))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete comment?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The comment and all its replies will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteComment}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
