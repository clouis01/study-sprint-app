"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Timer, Users, X, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { SprintWithParticipants } from "@/types/sprints";

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function ActiveSprintTimer() {
  const [activeSprint, setActiveSprint] = useState<SprintWithParticipants | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [showExtend, setShowExtend] = useState(false);
  const [extending, setExtending] = useState(false);
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

    async function loadActiveSprint() {
      const { data: participants, error: participantsError } = await supabase
        .from("sprint_participants")
        .select("sprint_id")
        .eq("user_id", uid);

      if (participantsError?.code === "42P01" || participantsError?.message?.includes("does not exist")) {
        setActiveSprint(null);
        return;
      }
      if (!participants || participants.length === 0) {
        setActiveSprint(null);
        return;
      }

      const sprintIds = participants.map((p) => p.sprint_id);

      const { data: sprints } = await supabase
        .from("sprints")
        .select(`
          *,
          sprint_participants(*)
        `)
        .in("id", sprintIds)
        .eq("status", "active")
        .order("started_at", { ascending: false })
        .limit(1);

      if (sprints && sprints.length > 0) {
        const sprint = sprints[0] as any;
        setActiveSprint({
          ...sprint,
          participant_count: sprint.sprint_participants?.length || 0,
        });
      } else {
        setActiveSprint(null);
      }
    }

    loadActiveSprint();

    const interval = setInterval(loadActiveSprint, 5000);

    return () => clearInterval(interval);
  }, [userId, supabase]);

  useEffect(() => {
    if (!activeSprint) {
      setTimeRemaining(0);
      return;
    }

    const sprint = activeSprint;

    function updateTime() {
      const now = new Date().getTime();
      const end = new Date(sprint.ends_at).getTime();
      const remaining = Math.max(0, Math.floor((end - now) / 1000));
      
      setTimeRemaining(remaining);

      if (remaining === 0 && !completing && !showExtend) {
        setShowExtend(true);
      }
    }

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [activeSprint]);

  const completeSprint = useCallback(async () => {
    if (!activeSprint || completing) return;
    const sprint = activeSprint;
    setCompleting(true);
    setShowExtend(false);

    try {
      await supabase
        .from("sprints")
        .update({ status: "completed" })
        .eq("id", sprint.id);

      toast.success("Sprint completed! Great work! 🎉");
      setActiveSprint(null);
    } catch (error) {
      console.error("Error completing sprint:", error);
    } finally {
      setCompleting(false);
    }
  }, [activeSprint, completing, supabase]);

  const extendSprint = useCallback(async (extraMinutes: number) => {
    if (!activeSprint || extending) return;
    setExtending(true);
    try {
      const newEndsAt = new Date(Date.now() + extraMinutes * 60 * 1000).toISOString();
      const newDuration = (activeSprint.duration_minutes ?? 0) + extraMinutes;
      const { error } = await supabase
        .from("sprints")
        .update({ ends_at: newEndsAt, duration_minutes: newDuration })
        .eq("id", activeSprint.id);
      if (error) throw error;
      setActiveSprint({ ...activeSprint, ends_at: newEndsAt, duration_minutes: newDuration });
      setTimeRemaining(extraMinutes * 60);
      setShowExtend(false);
      toast.success(`Added ${extraMinutes} min — momentum!`);
    } catch (err) {
      console.error("Error extending sprint:", err);
      toast.error("Couldn't add time");
    } finally {
      setExtending(false);
    }
  }, [activeSprint, extending, supabase]);

  const handleEndEarly = async () => {
    if (!activeSprint || !userId) return;
    const uid = userId;

    try {
      const { error: deleteError } = await supabase
        .from("sprint_participants")
        .delete()
        .eq("sprint_id", activeSprint.id)
        .eq("user_id", uid);

      if (deleteError) {
        toast.error(deleteError.message || "Could not leave sprint");
        return;
      }

      const { data: remainingParticipants } = await supabase
        .from("sprint_participants")
        .select("id")
        .eq("sprint_id", activeSprint.id);

      if (!remainingParticipants || remainingParticipants.length === 0) {
        await supabase
          .from("sprints")
          .update({ status: "cancelled" })
          .eq("id", activeSprint.id);
      }

      toast.info("You left the sprint");
      setActiveSprint(null);
    } catch (error) {
      console.error("Error leaving sprint:", error);
      toast.error("Failed to leave sprint");
    }
  };

  if (!activeSprint) {
    return null;
  }

  const totalSeconds = (activeSprint.duration_minutes ?? 0) * 60;
  const progress = totalSeconds > 0 ? ((totalSeconds - timeRemaining) / totalSeconds) * 100 : 0;

  if (showExtend) {
    return (
      <Card className="p-6 bg-primary/5 border-primary/20">
        <div className="space-y-4">
          <h3 className="text-xl font-bold">{activeSprint.class_name}</h3>
          <p className="text-sm text-muted-foreground">
            Great start! Add more time and keep the momentum going.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => extendSprint(10)}
              disabled={extending}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              +10 min
            </Button>
            <Button
              size="sm"
              onClick={() => extendSprint(15)}
              disabled={extending}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              +15 min
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={completeSprint}
              disabled={completing}
            >
              I'm done
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-primary/5 border-primary/20">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-bold">{activeSprint.class_name}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              You're live — friends can join your timer
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEndEarly}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Timer className="h-4 w-4" />
              <span>Time Remaining</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{activeSprint.participant_count} studying</span>
            </div>
          </div>

          <div className="text-5xl font-mono font-bold text-center py-4">
            {formatTime(timeRemaining)}
          </div>

          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-1000"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Keep going! You've got this 💪
        </p>
      </div>
    </Card>
  );
}
