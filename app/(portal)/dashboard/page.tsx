"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Loader2, Sparkles } from "lucide-react";
import FeedCard, { type FeedEvent } from "@/components/feed/FeedCard";
import RightSidebar from "@/components/feed/RightSidebar";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted ${className}`} />;
}

function FeedSkeleton() {
  return (
    <div className="bg-white p-5 space-y-3" style={{ borderRadius: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
      <div className="flex items-center gap-3">
        <Skeleton className="size-11 rounded-full" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export default function DashboardPage() {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserName, setCurrentUserName] = useState("You");
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [greetingText, setGreetingText] = useState("");
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchFeed = useCallback(async (p: number, append = false) => {
    if (p > 1) setLoadingMore(true);
    try {
      const res = await fetch(`/api/feed?page=${p}&limit=15`);
      const data = await res.json();
      const newEvents = (data.events ?? []) as FeedEvent[];
      setEvents((prev) => append ? [...prev, ...newEvents] : newEvents);
      setHasMore(p * (data.limit ?? 15) < (data.total ?? 0));
      if (data.currentUserId) setCurrentUserId(data.currentUserId);
      if (data.currentUserName) setCurrentUserName(data.currentUserName);
      if (data.currentUserAvatar !== undefined) setCurrentUserAvatar(data.currentUserAvatar);
    } catch { /* */ }
    setLoading(false);
    setLoadingMore(false);
  }, []);

  useEffect(() => {
    setGreetingText(getGreeting());
    fetchFeed(1);
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => setUserName(d.user?.name?.split(" ")[0] ?? ""))
      .catch(() => {});
  }, [fetchFeed]);

  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && hasMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchFeed(nextPage, true);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [page, hasMore, loadingMore, fetchFeed]);

  const refreshFeed = useCallback(() => {
    setPage(1);
    fetchFeed(1);
  }, [fetchFeed]);

  return (
    <div className="mx-auto max-w-6xl">
      {/* 2-column: feed + right sidebar */}
      <div className="flex gap-6">
        {/* Center: Greeting + Feed */}
        <div className="flex-1 min-w-0">
          {/* Greeting */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-ink-800">
              {greetingText}{userName ? ", " : ""}<span className="serif-italic text-indigo-deep">{userName}</span>
            </h1>
            <p className="text-sm text-ink-500 mt-0.5">
              Here&apos;s what&apos;s happening in your team
            </p>
          </div>

          <div className="space-y-5">
          {loading ? (
            <div className="space-y-5">
              <FeedSkeleton />
              <FeedSkeleton />
              <FeedSkeleton />
            </div>
          ) : events.length === 0 ? (
            <div className="bg-white p-10 text-center" style={{ borderRadius: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <p className="text-lg font-semibold text-ink-800 mb-2">No feed events yet</p>
              <p className="text-sm text-ink-500 mb-4">
                Be the first to contribute! Share an idea, add a milestone, or update your profile.
              </p>
              <Link
                href="/apps/ideahub/submit"
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-deep px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-press transition shadow-sm"
              >
                <Sparkles className="size-3.5" /> Submit an Idea
              </Link>
            </div>
          ) : (
            <>
              {events.map((event) => (
                <FeedCard
                  key={event.id}
                  event={event}
                  currentUserId={currentUserId}
                  currentUserName={currentUserName}
                  currentUserAvatar={currentUserAvatar}
                  onRefresh={refreshFeed}
                />
              ))}

              <div ref={sentinelRef} className="h-4" />

              {loadingMore && (
                <div className="flex justify-center py-4">
                  <Loader2 className="size-5 animate-spin text-ink-400" />
                </div>
              )}

              {!hasMore && events.length > 0 && (
                <p className="text-center text-xs text-ink-400 py-4">
                  You&apos;re all caught up!
                </p>
              )}
            </>
          )}
          </div>
        </div>

        {/* Right column (hidden on mobile) */}
        <div className="hidden lg:block w-72 shrink-0">
          <RightSidebar />
        </div>
      </div>
    </div>
  );
}
