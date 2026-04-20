import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { Loader2, MessageSquare, SendHorizonal } from "lucide-react";

type ProfileSummary = {
  name: string | null;
  avatar_url: string | null;
};

type CommunityMessageRow = {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  profiles: ProfileSummary | ProfileSummary[] | null;
};

type CommunityMessage = {
  id: string;
  userId: string;
  message: string;
  createdAt: string;
  authorName: string;
  authorAvatarUrl: string;
};

const formatTimestamp = (timestamp: string) =>
  new Date(timestamp).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

const Community = () => {
  const [currentUserId, setCurrentUserId] = useState("");
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);

  const loadMessages = async () => {
    const { data, error: messagesError } = await supabase
      .from("community_messages")
      .select(`
        id,
        user_id,
        message,
        created_at,
        profiles:profiles!community_messages_user_id_fkey(name, avatar_url)
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (messagesError) {
      setError(messagesError.message);
      return;
    }

    const mappedMessages = ((data || []) as CommunityMessageRow[])
      .map((item) => {
        const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
        const authorName = profile?.name?.trim() || "Member";
        const avatarSeed = encodeURIComponent(authorName);
        const fallbackAvatarUrl = `https://ui-avatars.com/api/?name=${avatarSeed}&background=111827&color=ffffff&bold=true`;

        return {
          id: item.id,
          userId: item.user_id,
          message: item.message,
          createdAt: item.created_at,
          authorName,
          authorAvatarUrl: profile?.avatar_url || fallbackAvatarUrl,
        };
      })
      .reverse();

    setMessages(mappedMessages);
    setError("");
  };

  useEffect(() => {
    let mounted = true;

    const loadCommunity = async () => {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (userError || !user) {
        setError(userError?.message || "Unable to verify user");
        setLoading(false);
        return;
      }

      setCurrentUserId(user.id);
      await loadMessages();

      if (!mounted) return;
      setLoading(false);
    };

    void loadCommunity();

    const channel = supabase
      .channel("community-messages-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "community_messages" },
        () => {
          void loadMessages();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const handleSendMessage = async () => {
    const trimmedMessage = messageInput.trim();
    if (!trimmedMessage || !currentUserId || sending) {
      return;
    }

    setSending(true);
    setError("");

    const { error: insertError } = await supabase.from("community_messages").insert({
      user_id: currentUserId,
      message: trimmedMessage,
    });

    if (insertError) {
      setError(insertError.message);
      setSending(false);
      return;
    }

    setMessageInput("");
    setSending(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await handleSendMessage();
  };

  const handleComposerKeyDown = async (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      await handleSendMessage();
    }
  };

  const emptyState = useMemo(() => !loading && !error && messages.length === 0, [error, loading, messages.length]);

  return (
    <DashboardLayout>
      <div className="mx-auto flex h-[calc(100dvh-3.5rem)] max-w-7xl flex-col p-2 sm:p-3 lg:p-4">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-border/70 bg-card shadow-sm">
          <div className="flex h-12 items-center justify-between border-b border-border/60 bg-card px-3 sm:px-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <MessageSquare size={16} className="text-primary" />
              <span>Community Discussion</span>
            </div>
            <div className="hidden text-xs text-muted-foreground sm:block">{messages.length} messages</div>
          </div>

          <div className="relative min-h-0 flex-1 bg-background">
            <div className="absolute inset-0 opacity-[0.04] [background-image:radial-gradient(circle,_currentColor_1px,_transparent_1px)] [background-size:22px_22px] text-foreground" />

            <div className="relative flex h-full min-h-0 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3 sm:px-5 sm:py-4">
                {loading && (
                  <div className="flex h-full min-h-[320px] items-center justify-center text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading discussion...
                  </div>
                )}

                {error && !loading && (
                    <div className="mx-auto max-w-2xl rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                    {error}
                  </div>
                )}

                {emptyState && (
                  <div className="flex h-full min-h-[320px] items-center justify-center">
                    <div className="rounded-2xl border border-dashed border-border/70 bg-card px-5 py-8 text-center text-sm text-muted-foreground">
                      No messages yet. Start the discussion.
                    </div>
                  </div>
                )}

                {!loading && !error && messages.length > 0 && (
                  <div className="mx-auto flex max-w-5xl flex-col gap-3">
                    {messages.map((item) => {
                      const isCurrentUser = item.userId === currentUserId;

                      return (
                        <div
                          key={item.id}
                          className={`flex items-end gap-2.5 ${isCurrentUser ? "justify-end" : "justify-start"}`}
                        >
                          {!isCurrentUser && (
                            <img
                              src={item.authorAvatarUrl}
                              alt={item.authorName}
                              className="h-9 w-9 self-start rounded-full border border-primary/25 object-cover"
                              referrerPolicy="no-referrer"
                            />
                          )}

                          <div
                            className={`max-w-[88%] rounded-2xl border px-3.5 py-3 shadow-sm sm:max-w-[min(84%,42rem)] sm:px-4 ${
                              isCurrentUser
                                ? "rounded-br-md border-primary bg-primary text-primary-foreground"
                                : "rounded-bl-md border-border/60 bg-muted text-foreground"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <p className={`text-sm font-semibold ${isCurrentUser ? "text-primary-foreground" : "text-foreground"}`}>
                                {item.authorName}
                              </p>
                              <span className={`text-[11px] ${isCurrentUser ? "text-primary-foreground/75" : "text-muted-foreground"}`}>
                                {formatTimestamp(item.createdAt)}
                              </span>
                            </div>
                            <p className={`mt-1.5 whitespace-pre-wrap break-words text-sm leading-6 ${isCurrentUser ? "text-primary-foreground" : "text-foreground/92"}`}>
                              {item.message}
                            </p>
                          </div>

                          {isCurrentUser && (
                            <img
                              src={item.authorAvatarUrl}
                              alt={item.authorName}
                              className="h-9 w-9 self-start rounded-full border border-primary/25 object-cover"
                              referrerPolicy="no-referrer"
                            />
                          )}
                        </div>
                      );
                    })}
                    <div ref={endOfMessagesRef} />
                  </div>
                )}
              </div>

              <div className="border-t border-border/60 bg-card px-2 py-2.5 sm:px-5 sm:py-3">
                <form className="mx-auto flex max-w-5xl items-end gap-2.5 sm:items-center sm:gap-3" onSubmit={(event) => void handleSubmit(event)}>
                  <div className="flex h-11 flex-1 items-center rounded-full border border-border bg-card px-3.5 shadow-sm sm:h-12 sm:px-4">
                    <textarea
                      value={messageInput}
                      onChange={(event) => setMessageInput(event.target.value)}
                      onKeyDown={(event) => void handleComposerKeyDown(event)}
                      placeholder="Write a message..."
                      rows={1}
                      maxLength={2000}
                      className="max-h-28 min-h-[22px] w-full resize-none bg-transparent text-[15px] leading-6 text-foreground outline-none placeholder:text-muted-foreground sm:text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sending || !messageInput.trim()}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full p-0 text-white disabled:opacity-50 sm:h-12 sm:w-12"
                    aria-label="Send message"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal size={17} />}
                  </button>
                </form>
                <div className="mx-auto mt-2 flex max-w-5xl items-center justify-end px-2 text-[11px] text-muted-foreground">
                  <span>{messageInput.length}/2000</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Community;
