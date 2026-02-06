"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Timer, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const DURATION_OPTIONS = [
  { label: "25 min", value: 25 },
  { label: "50 min", value: 50 },
  { label: "90 min", value: 90 },
];

export function SprintForm() {
  const [className, setClassName] = useState("");
  const [duration, setDuration] = useState(25);
  const [isCreating, setIsCreating] = useState(false);
  const supabase = createClient();

  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!className.trim()) {
      toast.error("Please enter a class name");
      return;
    }

    setIsCreating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to start a sprint");
        return;
      }

      const startedAt = new Date();
      const endsAt = new Date(startedAt.getTime() + duration * 60 * 1000);

      const { error: sprintError, data: sprint } = await supabase
        .from("sprints")
        .insert({
          user_id: user.id,
          class_name: className,
          duration_minutes: duration,
          started_at: startedAt.toISOString(),
          ends_at: endsAt.toISOString(),
          status: "active",
        })
        .select()
        .single();

      if (sprintError) {
        const msg = sprintError.message || String(sprintError);
        const isMissingTable = msg.includes("does not exist") || msg.includes("relation") || sprintError.code === "42P01";
        toast.error(isMissingTable ? "Database not set up. Run the migration (see instructions below)." : msg);
        return;
      }

      if (!sprint) return;

      // Add user as participant (non-blocking)
      const { error: participantError } = await supabase
        .from("sprint_participants")
        .insert({
          sprint_id: sprint.id,
          user_id: user.id,
        });
      if (participantError) console.warn("Participant insert:", participantError.message);

      // Update or create user streak (non-blocking)
      const today = new Date().toISOString().split('T')[0];
      const { data: existingStreak } = await supabase
        .from("user_streaks")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!existingStreak?.id) {
        await supabase
          .from("user_streaks")
          .insert({
            user_id: user.id,
            current_streak: 1,
            longest_streak: 1,
            last_study_date: today,
            total_sprints: 1,
          });
      } else {
        let newStreak = existingStreak.current_streak;
        const lastDate = existingStreak.last_study_date;
        if (lastDate) {
          const daysSinceLastStudy = Math.floor(
            (new Date(today).getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysSinceLastStudy === 1) newStreak += 1;
          else if (daysSinceLastStudy > 1) newStreak = 1;
        } else {
          newStreak = 1;
        }
        await supabase
          .from("user_streaks")
          .update({
            current_streak: newStreak,
            longest_streak: Math.max(newStreak, existingStreak.longest_streak),
            last_study_date: today,
            total_sprints: existingStreak.total_sprints + 1,
          })
          .eq("user_id", user.id);
      }

      toast.success(`Sprint started! ${duration} minutes on ${className}`);
      setClassName("");
      
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("Error creating sprint:", error);
      toast.error(msg || "Failed to create sprint");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleCreateSprint} className="space-y-4">
        <div>
          <Label htmlFor="className">What are you studying?</Label>
          <Input
            id="className"
            placeholder="e.g. CS 101, Biology, Calculus..."
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            disabled={isCreating}
          />
        </div>

        <div>
          <Label>Duration</Label>
          <div className="flex gap-2 mt-2">
            {DURATION_OPTIONS.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={duration === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => setDuration(option.value)}
                disabled={isCreating}
                className="flex-1"
              >
                <Timer className="h-4 w-4 mr-1" />
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <Button type="submit" disabled={isCreating} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          {isCreating ? "Starting..." : "Start Sprint"}
        </Button>
      </form>
    </Card>
  );
}
