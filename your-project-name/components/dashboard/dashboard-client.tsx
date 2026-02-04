"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Zap, Play, Flame, Trophy, Target, Users, Circle } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { ActiveSprintTimer } from "@/components/sprints/active-sprint-timer";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { SprintWithParticipants } from "@/types/sprints";
import type { UserStreak } from "@/types/sprints";

function formatTimeRemaining(endsAt: string): string {
	const now = new Date().getTime();
	const end = new Date(endsAt).getTime();
	const diff = Math.max(0, end - now);
	const minutes = Math.floor(diff / (1000 * 60));
	const seconds = Math.floor((diff % (1000 * 60)) / 1000);
	if (minutes === 0) return `${seconds}s`;
	return `${minutes}m ${seconds}s`;
}

export function DashboardClient() {
	const [subject, setSubject] = useState("");
	const [duration, setDuration] = useState("5");
	const [hasActiveSprint, setHasActiveSprint] = useState<boolean | null>(null);
	const [refreshKey, setRefreshKey] = useState(0);
	const [friendsSprints, setFriendsSprints] = useState<SprintWithParticipants[]>([]);
	const [userStreak, setUserStreak] = useState<UserStreak | null>(null);
	const [userId, setUserId] = useState<string | null>(null);
	const [joining, setJoining] = useState<string | null>(null);
	const supabase = createClient();

	// Fetch user and active sprint
	useEffect(() => {
		async function load() {
			const { data: { user } } = await supabase.auth.getUser();
			setUserId(user?.id ?? null);
			if (!user?.id) {
				setHasActiveSprint(false);
				return;
			}
			const uid = user.id;
			const { data: participants } = await supabase
				.from("sprint_participants")
				.select("sprint_id")
				.eq("user_id", uid);
			if (!participants?.length) {
				setHasActiveSprint(false);
				return;
			}
			const { data: sprints } = await supabase
				.from("sprints")
				.select("id")
				.in("id", participants.map((p) => p.sprint_id))
				.eq("status", "active")
				.limit(1);
			setHasActiveSprint(sprints != null && sprints.length > 0);
		}
		load();
	}, [supabase, refreshKey]);

	// Fetch friends' active sprints
	useEffect(() => {
		if (!userId) return;
		async function load() {
			const { data, error } = await supabase
				.from("sprints")
				.select(`*, sprint_participants(*)`)
				.eq("status", "active")
				.order("started_at", { ascending: false });
			if (error?.code === "42P01" || error?.message?.includes("does not exist")) {
				setFriendsSprints([]);
				return;
			}
			const withCounts = (data ?? []).map((s: Record<string, unknown>) => ({
				...s,
				participant_count: Array.isArray(s.sprint_participants) ? s.sprint_participants.length : 0,
			})) as SprintWithParticipants[];
			setFriendsSprints(withCounts.filter((s) => s.user_id !== userId));
		}
		load();
		const channel = supabase
			.channel("dashboard-sprints")
			.on("postgres_changes", { event: "*", schema: "public", table: "sprints" }, () => load());
		return () => {
			supabase.removeChannel(channel);
		};
	}, [userId, supabase]);

	// Fetch streak
	useEffect(() => {
		if (!userId) return;
		const uid = userId;
		async function load() {
			const { data, error } = await supabase
				.from("user_streaks")
				.select("*")
				.eq("user_id", uid)
				.single();
			if (error && error.code !== "PGRST116") {
				if (error.code === "42P01") {
					setUserStreak(null);
					return;
				}
				return;
			}
			setUserStreak(data ?? null);
		}
		load();
		const channel = supabase
			.channel("dashboard-streaks")
			.on("postgres_changes", { event: "*", schema: "public", table: "user_streaks", filter: `user_id=eq.${uid}` }, () => load());
		return () => {
			supabase.removeChannel(channel);
		};
	}, [userId, supabase]);

	const startSprint = useCallback(async () => {
		if (!subject.trim() || !userId) return;
		const durationNum = Number.parseInt(duration, 10);

		const startedAt = new Date();
		const endsAt = new Date(startedAt.getTime() + durationNum * 60 * 1000);

		const { error: sprintError, data: sprint } = await supabase
			.from("sprints")
			.insert({
				user_id: userId,
				class_name: subject.trim(),
				duration_minutes: Number.parseInt(duration, 10),
				started_at: startedAt.toISOString(),
				ends_at: endsAt.toISOString(),
				status: "active",
			})
			.select()
			.single();

		if (sprintError) {
			const msg = sprintError.message ?? "";
			const isMissing = msg.includes("does not exist") || sprintError.code === "42P01";
			toast.error(isMissing ? "Database not set up. Run the migration." : msg);
			return;
		}

		await supabase.from("sprint_participants").insert({ sprint_id: sprint.id, user_id: userId });
		const today = new Date().toISOString().split("T")[0];
		const { data: existingStreak } = await supabase.from("user_streaks").select("*").eq("user_id", userId).single();
		if (!existingStreak?.id) {
			await supabase.from("user_streaks").insert({
				user_id: userId,
				current_streak: 1,
				longest_streak: 1,
				last_study_date: today,
				total_sprints: 1,
			});
		} else {
			let newStreak = existingStreak.current_streak ?? 0;
			const lastDate = existingStreak.last_study_date;
			if (lastDate) {
				const daysSinceLastStudy = Math.floor(
					(new Date(today).getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24),
				);
				if (daysSinceLastStudy === 1) newStreak += 1;
				else if (daysSinceLastStudy > 1) newStreak = 1;
			} else {
				newStreak = 1;
			}
			const longest = Math.max(newStreak, existingStreak.longest_streak ?? 0);
			await supabase
				.from("user_streaks")
				.update({
					current_streak: newStreak,
					longest_streak: longest,
					last_study_date: today,
					total_sprints: (existingStreak.total_sprints ?? 0) + 1,
					updated_at: new Date().toISOString(),
				})
				.eq("user_id", userId);
		}

		toast.success("Sprint started!");
		setHasActiveSprint(true);
		setRefreshKey((k) => k + 1);
	}, [subject, duration, userId, supabase]);

	const isUserInSprint = (sprint: SprintWithParticipants) => {
		if (!userId) return false;
		const participants = sprint.sprint_participants ?? sprint.participants ?? [];
		return participants.some((p: { user_id: string }) => p.user_id === userId);
	};

	const handleJoinSprint = async (sprint: SprintWithParticipants) => {
		if (!userId) return;
		setJoining(sprint.id);
		try {
			await supabase.from("sprint_participants").insert({ sprint_id: sprint.id, user_id: userId });
			toast.success(`Joined ${sprint.class_name}!`);
			setFriendsSprints((prev) => prev.map((s) => (s.id === sprint.id ? { ...s, participant_count: (s.participant_count ?? 0) + 1 } : s)));
		} catch {
			toast.error("Failed to join sprint");
		} finally {
			setJoining(null);
		}
	};

	const showStartForm = hasActiveSprint === false;
	const showDbTimer = hasActiveSprint === true;

	return (
		<div className="min-h-screen bg-background">
			<header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
				<div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
					<Link href="/dashboard" className="flex items-center gap-2">
						<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
							<Zap className="h-5 w-5 text-primary-foreground" />
						</div>
						<span className="font-[family-name:var(--font-heading)] text-xl font-bold text-foreground">
							Study Sprint
						</span>
					</Link>
					<div className="flex items-center gap-2">
						{hasActiveSprint === true && (
							<span className="flex items-center gap-1.5 rounded-full bg-green-500/15 px-2.5 py-1 text-xs font-medium text-green-700 dark:text-green-400">
								<Circle className="h-1.5 w-1.5 fill-current" />
								Live
							</span>
						)}
						<LogoutButton variant="ghost" size="sm" className="gap-2" />
					</div>
				</div>
			</header>

			<main className="mx-auto max-w-6xl px-4 py-8">
				<div className="grid gap-6 lg:grid-cols-3">
					<div className="space-y-6 lg:col-span-2">
						<AnimatePresence mode="wait">
							{showStartForm && (
								<motion.div
									key="start-form"
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -20 }}
									transition={{ duration: 0.3 }}
								>
									<Card className="border-border shadow-sm">
										<CardHeader>
											<CardTitle className="flex items-center gap-2 font-[family-name:var(--font-heading)]">
												<Play className="h-5 w-5 text-primary" />
												Start a Sprint
											</CardTitle>
											<p className="text-sm text-muted-foreground">
												Pick a subject and duration. Friends see you as active when you start.
											</p>
										</CardHeader>
										<CardContent className="space-y-4">
											<div className="flex flex-col gap-4 sm:flex-row">
												<div className="flex-1">
													<Input
														placeholder="What are you studying?"
														value={subject}
														onChange={(e) => setSubject(e.target.value)}
														className="h-12"
													/>
												</div>
												<Select value={duration} onValueChange={setDuration}>
													<SelectTrigger className="h-12 w-full sm:w-32">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="5">Just 5 min</SelectItem>
														<SelectItem value="25">25 min</SelectItem>
														<SelectItem value="50">50 min</SelectItem>
														<SelectItem value="90">90 min</SelectItem>
													</SelectContent>
												</Select>
											</div>
											<Button
												onClick={startSprint}
												disabled={!subject.trim()}
												className="h-12 w-full text-base"
												size="lg"
											>
												<Play className="mr-2 h-5 w-5" />
												Start Sprint
											</Button>
										</CardContent>
									</Card>
								</motion.div>
							)}

							{showDbTimer && (
								<motion.div
									key="active-timer"
									initial={{ opacity: 0, scale: 0.95 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0, scale: 0.95 }}
									transition={{ duration: 0.3 }}
								>
									<ActiveSprintTimer />
								</motion.div>
							)}
						</AnimatePresence>

						<Card className="border-border shadow-sm">
							<CardHeader>
								<CardTitle className="flex items-center gap-2 font-[family-name:var(--font-heading)]">
									<Users className="h-5 w-5 text-primary" />
									Friends Studying Now
								</CardTitle>
								<p className="text-sm text-muted-foreground">
									Join same timer • silent co-working. No chat needed.
								</p>
							</CardHeader>
							<CardContent className="space-y-3">
								{friendsSprints.length === 0 ? (
									<p className="text-sm text-muted-foreground">No active sprints right now. Start one!</p>
								) : (
									<>
										<p className="text-sm font-medium text-foreground">
											A friend started studying {friendsSprints[0].class_name} — join?
										</p>
										{friendsSprints.map((sprint, i) => {
										const inSprint = isUserInSprint(sprint);
										return (
											<motion.div
												key={sprint.id}
												className="group flex items-center gap-4 rounded-xl border border-border bg-muted/30 p-4 transition-all hover:border-primary/50 hover:shadow-sm"
												initial={{ opacity: 0, x: -20 }}
												animate={{ opacity: 1, x: 0 }}
												transition={{ delay: i * 0.1 }}
											>
												<div className="relative">
													<div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
														{sprint.class_name.charAt(0).toUpperCase()}
													</div>
													<motion.span
														className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-background bg-green-500"
														animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
														transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
													/>
												</div>
												<div className="min-w-0 flex-1">
													<p className="font-medium text-foreground">
														{sprint.class_name}
													</p>
													<p className="text-sm text-muted-foreground">
														{formatTimeRemaining(sprint.ends_at)} left
													</p>
												</div>
												{!inSprint && (
													<Button
														size="sm"
														variant="secondary"
														className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
														onClick={() => handleJoinSprint(sprint)}
														disabled={joining === sprint.id}
													>
														{joining === sprint.id ? "Joining..." : "Join"}
													</Button>
												)}
											</motion.div>
										);
									})}
									</>
								)}
							</CardContent>
						</Card>
					</div>

					<div className="space-y-6">
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.2 }}
						>
							<Card className="border-border shadow-sm">
								<CardHeader>
									<CardTitle className="flex items-center gap-2 font-[family-name:var(--font-heading)]">
										<Flame className="h-5 w-5 text-secondary" />
										Your Streak
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="mb-6 text-center">
										<motion.div
											className="inline-flex items-center justify-center"
											animate={{ scale: [1, 1.05, 1] }}
											transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
										>
											<div className="relative">
												<div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-secondary/20 to-secondary/5">
													<span className="font-[family-name:var(--font-heading)] text-4xl font-bold text-secondary">
														{userStreak?.current_streak ?? 0}
													</span>
												</div>
												<motion.div
													className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground"
													animate={{ rotate: [0, 10, -10, 0] }}
													transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
												>
													<Flame className="h-4 w-4" />
												</motion.div>
											</div>
										</motion.div>
										<p className="mt-2 text-sm text-muted-foreground">days in a row</p>
									</div>
									<div className="grid grid-cols-2 gap-4">
										<div className="rounded-xl bg-muted/50 p-4 text-center">
											<Trophy className="mx-auto mb-2 h-5 w-5 text-primary" />
											<p className="font-[family-name:var(--font-heading)] text-2xl font-bold text-foreground">
												{userStreak?.longest_streak ?? 0}
											</p>
											<p className="text-xs text-muted-foreground">Longest streak</p>
										</div>
										<div className="rounded-xl bg-muted/50 p-4 text-center">
											<Target className="mx-auto mb-2 h-5 w-5 text-primary" />
											<p className="font-[family-name:var(--font-heading)] text-2xl font-bold text-foreground">
												{userStreak?.total_sprints ?? 0}
											</p>
											<p className="text-xs text-muted-foreground">Total sprints</p>
										</div>
									</div>
								</CardContent>
							</Card>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.25 }}
						>
							<Card className="border-border bg-muted/30 shadow-sm">
								<CardContent className="pt-6">
									<div className="flex items-start gap-3">
										<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/10">
											<Users className="h-5 w-5 text-secondary" />
										</div>
										<div>
											<h3 className="font-semibold text-foreground">Gentle accountability</h3>
											<p className="mt-1 text-sm text-muted-foreground">
												When you start a sprint, friends see you're studying and can join. No punishments — just presence.
											</p>
										</div>
									</div>
								</CardContent>
							</Card>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.3 }}
						>
							<Card className="border-border bg-primary/5 shadow-sm">
								<CardContent className="pt-6">
									<div className="flex items-start gap-3">
										<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
											<Zap className="h-5 w-5 text-primary" />
										</div>
										<div>
											<h3 className="font-semibold text-foreground">Pro tip</h3>
											<p className="mt-1 text-sm text-muted-foreground">
												Try the 50-10 rule: 50 minutes of focused study followed by a 10-minute break. Your brain will thank you.
											</p>
										</div>
									</div>
								</CardContent>
							</Card>
						</motion.div>
					</div>
				</div>
			</main>
		</div>
	);
}
