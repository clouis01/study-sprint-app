"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Timer, Users, X, Plus, Pause, Play } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { SprintWithParticipants } from "@/types/sprints";

function playEndBeep() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 523;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // ignore
  }
}

function triggerConfetti() {
  const colors = ["#22c55e", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6"];
  const container = document.createElement("div");
  container.className = "fixed inset-0 pointer-events-none z-50";
  container.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 40; i++) {
    const el = document.createElement("div");
    el.className = "absolute w-2 h-2 rounded-sm animate-confetti-fall";
    el.style.left = `${Math.random() * 100}vw`;
    el.style.top = "-10px";
    el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    el.style.animationDuration = `${2 + Math.random() * 2}s`;
    el.style.animationDelay = `${Math.random() * 0.5}s`;
    el.style.setProperty("--tw-rotate", `${Math.random() * 360}deg`);
    container.appendChild(el);
  }
  document.body.appendChild(container);
  setTimeout(() => container.remove(), 4000);
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

type Props = { onSprintEnd?: () => void };

export function ActiveSprintTimer({ onSprintEnd }: Props) {
  const [activeSprint, setActiveSprint] = useState<SprintWithParticipants | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [showExtend, setShowExtend] = useState(false);
  const [extending, setExtending] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [pausing, setPausing] = useState(false);
  const [showCompletionMoment, setShowCompletionMoment] = useState(false);
  const playedEndSound = useRef(false);
  const supabase = createClient();

  const isOwner = userId && activeSprint && activeSprint.user_id === userId;

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
      if (isPaused) return;
      const now = new Date().getTime();
      const end = new Date(sprint.ends_at).getTime();
      const remaining = Math.max(0, Math.floor((end - now) / 1000));
      
      setTimeRemaining(remaining);

      if (remaining === 0 && !completing && !showExtend && !showCompletionMoment) {
        setShowExtend(true);
      }
    }

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [activeSprint, isPaused, showCompletionMoment]);

  useEffect(() => {
    if (showExtend && !playedEndSound.current) {
      playedEndSound.current = true;
      playEndBeep();
    }
    if (!showExtend) playedEndSound.current = false;
  }, [showExtend]);

  const doCompleteSprint = useCallback(async () => {
    if (!activeSprint || completing) return;
    const sprint = activeSprint;
    setCompleting(true);
    setShowExtend(false);
    setShowCompletionMoment(false);

    try {
      await supabase
        .from("sprints")
        .update({ status: "completed" })
        .eq("id", sprint.id);

      setActiveSprint(null);
      onSprintEnd?.();
    } catch (error) {
      console.error("Error completing sprint:", error);
    } finally {
      setCompleting(false);
    }
  }, [activeSprint, completing, supabase, onSprintEnd]);

  const completeSprint = useCallback(() => {
    if (!activeSprint || completing) return;
    setShowCompletionMoment(true);
    triggerConfetti();
    setTimeout(() => {
      doCompleteSprint();
    }, 2200);
  }, [activeSprint, completing, doCompleteSprint]);

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

  const addTimeNow = useCallback((mins: number) => {
    if (!activeSprint || extending || !isOwner) return;
    const newEndsAt = new Date(new Date(activeSprint.ends_at).getTime() + mins * 60 * 1000).toISOString();
    const newDuration = (activeSprint.duration_minutes ?? 0) + mins;
    setExtending(true);
    supabase
      .from("sprints")
      .update({ ends_at: newEndsAt, duration_minutes: newDuration })
      .eq("id", activeSprint.id)
      .then(({ error }) => {
        if (error) {
          toast.error("Couldn't add time");
          setExtending(false);
          return;
        }
        setActiveSprint({ ...activeSprint, ends_at: newEndsAt, duration_minutes: newDuration });
        setTimeRemaining(Math.floor((new Date(newEndsAt).getTime() - Date.now()) / 1000));
        toast.success(`+${mins} min added`);
        setExtending(false);
      });
  }, [activeSprint, extending, isOwner, supabase]);

  const handlePause = useCallback(() => {
    setIsPaused(true);
    setPausedAt(Date.now());
    toast.info("Sprint paused");
  }, []);

  const handleResume = useCallback(async () => {
    if (pausedAt === null || !activeSprint || !isOwner || pausing) return;
    setPausing(true);
    const pauseDurationMs = Date.now() - pausedAt;
    const newEndsAt = new Date(new Date(activeSprint.ends_at).getTime() + pauseDurationMs).toISOString();
    const { error } = await supabase
      .from("sprints")
      .update({ ends_at: newEndsAt })
      .eq("id", activeSprint.id);
    if (error) {
      toast.error("Couldn't resume");
      setPausing(false);
      return;
    }
    setActiveSprint({ ...activeSprint, ends_at: newEndsAt });
    setIsPaused(false);
    setPausedAt(null);
    toast.success("Resumed");
    setPausing(false);
  }, [pausedAt, activeSprint, isOwner, pausing, supabase]);

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
      onSprintEnd?.();
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
  const isUnderOneMin = timeRemaining > 0 && timeRemaining < 60;

  if (showCompletionMoment) {
    return (
      <Card className="p-8 bg-primary/10 border-primary/30 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20">
            <svg className="h-10 w-10 text-green-600 dark:text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path strokeDasharray={24} strokeDashoffset={24} className="animate-[checkmark-draw_0.4s_ease-out_0.2s_forwards]" d="M5 12l5 5L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-foreground">Sprint complete!</h3>
            <p className="mt-1 text-sm text-muted-foreground">Great work 🎉</p>
          </div>
        </div>
      </Card>
    );
  }

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
              onClick={() => extendSprint(5)}
              disabled={extending}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              +5 min
            </Button>
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
              {isPaused ? "Paused" : "You're live — friends can join your timer"}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {isOwner && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => addTimeNow(5)}
                  disabled={extending}
                  className="text-muted-foreground hover:text-foreground gap-1"
                  title="Add 5 min"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">5 min</span>
                </Button>
                {isPaused ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResume}
                    disabled={pausing}
                    className="text-muted-foreground hover:text-foreground gap-1"
                  >
                    <Play className="h-4 w-4" />
                    <span className="hidden sm:inline">Resume</span>
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePause}
                    className="text-muted-foreground hover:text-foreground gap-1"
                  >
                    <Pause className="h-4 w-4" />
                    <span className="hidden sm:inline">Pause</span>
                  </Button>
                )}
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEndEarly}
              className="text-muted-foreground hover:text-foreground"
              title="Leave sprint"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
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

          <div className="relative flex items-center justify-center py-6">
            <svg className="absolute size-32 -rotate-90" viewBox="0 0 36 36">
              <path
                className="fill-none stroke-muted"
                strokeWidth="2"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="fill-none stroke-primary transition-all duration-1000"
                strokeWidth="2"
                strokeDasharray={`${progress}, 100`}
                strokeLinecap="round"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div
              className={`relative text-5xl font-mono font-bold tabular-nums ${isUnderOneMin ? "animate-[timer-pulse_1.5s_ease-in-out_infinite]" : ""}`}
            >
              {formatTime(timeRemaining)}
            </div>
          </div>

          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-1000"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          {isPaused ? "Tap Resume when you're back." : "Keep going! You've got this 💪"}
        </p>
      </div>
    </Card>
  );
}
