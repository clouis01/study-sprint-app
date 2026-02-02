"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Timer, Users, Play } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Sprint, SprintWithParticipants } from "@/types/sprints";

function formatTimeRemaining(endsAt: string): string {
  const now = new Date().getTime();
  const end = new Date(endsAt).getTime();
  const diff = Math.max(0, end - now);
  
  const minutes = Math.floor(diff / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  if (minutes === 0) {
    return `${seconds}s`;
  }
  return `${minutes}m ${seconds}s`;
}

export function ActiveSprintsFeed() {
  const [sprints, setSprints] = useState<SprintWithParticipants[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [joining, setJoining] = useState<string | null>(null);
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

    async function loadActiveSprints() {
      const { data, error } = await supabase
        .from("sprints")
        .select(`
          *,
          sprint_participants(*)
        `)
        .eq("status", "active")
        .order("started_at", { ascending: false });

      if (error) {
        if (error.code === "42P01" || error.message?.includes("does not exist")) {
          setSprints([]);
          return;
        }
        console.error("Error loading sprints:", error);
        return;
      }

      // Transform data to include participant count
      const sprintsWithCounts = (data as any[]).map((sprint) => ({
        ...sprint,
        participant_count: sprint.sprint_participants?.length || 0,
      }));

      setSprints(sprintsWithCounts);
    }

    loadActiveSprints();

    // Set up realtime subscription for new sprints
    const channel = supabase
      .channel("active-sprints")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sprints",
          filter: "status=eq.active",
        },
        () => {
          loadActiveSprints();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sprint_participants",
        },
        () => {
          loadActiveSprints();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  // Update time remaining every second
  useEffect(() => {
    const interval = setInterval(() => {
      setSprints((prev) => [...prev]);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleJoinSprint = async (sprint: SprintWithParticipants) => {
    if (!userId) {
      toast.error("You must be logged in to join a sprint");
      return;
    }
    const uid = userId;
    setJoining(sprint.id);

    try {
      // Check if already a participant
      const { data: existing } = await supabase
        .from("sprint_participants")
        .select("*")
        .eq("sprint_id", sprint.id)
        .eq("user_id", uid)
        .single();

      if (existing) {
        toast.info("You're already in this sprint!");
        return;
      }

      // Join the sprint
      const { error } = await supabase
        .from("sprint_participants")
        .insert({
          sprint_id: sprint.id,
          user_id: uid,
        });

      if (error) throw error;

      toast.success(`Joined ${sprint.class_name} sprint!`);
      
    } catch (error) {
      console.error("Error joining sprint:", error);
      toast.error("Failed to join sprint");
    } finally {
      setJoining(null);
    }
  };

  const isUserInSprint = (sprint: SprintWithParticipants) => {
    if (!userId) return false;
    const participants = sprint.sprint_participants ?? sprint.participants ?? [];
    return participants.some((p) => p.user_id === userId);
  };

  if (sprints.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Timer className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">
          No active sprints right now. Start one to get going!
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Active Sprints</h2>
      
      <div className="grid gap-3">
        {sprints.map((sprint) => {
          const inSprint = isUserInSprint(sprint);
          const timeRemaining = formatTimeRemaining(sprint.ends_at);
          
          return (
            <Card key={sprint.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{sprint.class_name}</h3>
                    {inSprint && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        You're in
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Timer className="h-3.5 w-3.5" />
                      <span>{timeRemaining} left</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      <span>{sprint.participant_count} studying</span>
                    </div>
                  </div>
                </div>

                {!inSprint && (
                  <Button
                    size="sm"
                    onClick={() => handleJoinSprint(sprint)}
                    disabled={joining === sprint.id}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    {joining === sprint.id ? "Joining..." : "Join"}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
