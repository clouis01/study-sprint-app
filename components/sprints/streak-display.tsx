"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Flame, Trophy, Target } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { UserStreak } from "@/types/sprints";

export function StreakDisplay() {
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    }
    loadUser();
  }, [supabase]);

  useEffect(() => {
    if (!userId) return;
    const uid = userId;

    async function loadStreak() {
      const { data, error } = await supabase
        .from("user_streaks")
        .select("*")
        .eq("user_id", uid)
        .single();

      if (error && error.code !== "PGRST116") {
        if (error.code === "42P01" || error.message?.includes("does not exist")) {
          setStreak(null);
          return;
        }
        console.error("Error loading streak:", error);
        return;
      }

      setStreak(data || null);
    }

    loadStreak();

    // Set up realtime subscription
    const channel = supabase
      .channel("user-streaks")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_streaks",
          filter: `user_id=eq.${uid}`,
        },
        () => {
          loadStreak();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  if (!streak) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-2">
          <Flame className="h-12 w-12 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Start your first sprint to begin your streak!
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-500/10">
            <Flame className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{streak.current_streak}</p>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-yellow-500/10">
            <Trophy className="h-5 w-5 text-yellow-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{streak.longest_streak}</p>
            <p className="text-xs text-muted-foreground">Best Streak</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{streak.total_sprints}</p>
            <p className="text-xs text-muted-foreground">Total Sprints</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
