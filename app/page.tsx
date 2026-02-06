"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Users,
	Timer,
	Flame,
	Zap,
	BookOpen,
	Trophy,
	ArrowRight,
} from "lucide-react";

const fadeInUp = {
	initial: { opacity: 0, y: 20 },
	animate: { opacity: 1, y: 0 },
	transition: { duration: 0.5 },
};

const stagger = {
	animate: {
		transition: {
			staggerChildren: 0.1,
		},
	},
};

export default function LandingPage() {
	console.log("[v0] LandingPage rendering");
	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
				<div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
					<Link href="/" className="flex items-center gap-2">
						<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
							<Zap className="h-5 w-5 text-primary-foreground" />
						</div>
						<span className="font-[family-name:var(--font-heading)] text-xl font-bold text-foreground">
							Study Sprint
						</span>
					</Link>
					<nav className="flex items-center gap-3">
						<Button variant="ghost" asChild>
							<Link href="/dashboard">Dashboard</Link>
						</Button>
						<Button variant="ghost" asChild>
							<Link href="/login">Log in</Link>
						</Button>
						<Button asChild>
							<Link href="/signup">Sign up</Link>
						</Button>
					</nav>
				</div>
			</header>

			{/* Hero Section */}
			<main>
				<section className="relative overflow-hidden px-4 py-20 md:py-32">
					{/* Background decoration */}
					<div className="pointer-events-none absolute inset-0 overflow-hidden">
						<div className="absolute -top-40 right-0 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
						<div className="absolute bottom-0 left-0 h-60 w-60 rounded-full bg-secondary/20 blur-3xl" />
					</div>

					<motion.div
						className="relative mx-auto max-w-4xl text-center"
						initial="initial"
						animate="animate"
						variants={stagger}
					>
						<motion.div variants={fadeInUp}>
							<Badge
								variant="secondary"
								className="mb-6 bg-primary/10 px-4 py-2 text-sm text-primary hover:bg-primary/15"
							>
								<Flame className="mr-2 h-4 w-4" />
								Join 10,000+ students staying focused
							</Badge>
						</motion.div>

						<motion.h1
							className="font-[family-name:var(--font-heading)] text-4xl font-bold leading-tight tracking-tight text-foreground md:text-6xl lg:text-7xl"
							variants={fadeInUp}
						>
							<span className="text-balance">Study together,</span>
							<br />
							<span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
								stay accountable
							</span>
						</motion.h1>

						<motion.p
							className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl"
							variants={fadeInUp}
						>
							The social study app that makes grinding fun. Start sprints with
							friends, build streaks, and crush your study goals together.
						</motion.p>

						<motion.div
							className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
							variants={fadeInUp}
						>
							<Button size="lg" className="group w-full sm:w-auto" asChild>
								<Link href="/signup">
									Get started free
									<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
								</Link>
							</Button>
							<Button
								variant="outline"
								size="lg"
								className="w-full sm:w-auto bg-transparent"
								asChild
							>
								<Link href="/login">I have an account</Link>
							</Button>
						</motion.div>

						{/* Feature Pills */}
						<motion.div
							className="mt-12 flex flex-wrap items-center justify-center gap-3"
							variants={fadeInUp}
						>
							{[
								{ icon: Users, label: "Study with friends" },
								{ icon: Timer, label: "Shared timers" },
								{ icon: Flame, label: "Build streaks" },
							].map((feature) => (
								<div
									key={feature.label}
									className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground shadow-sm"
								>
									<feature.icon className="h-4 w-4 text-primary" />
									{feature.label}
								</div>
							))}
						</motion.div>
					</motion.div>
				</section>

				{/* Social Proof / Value Props */}
				<section className="border-y border-border bg-muted/30 px-4 py-20">
					<motion.div
						className="mx-auto max-w-6xl"
						initial={{ opacity: 0 }}
						whileInView={{ opacity: 1 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6 }}
					>
						<div className="mb-12 text-center">
							<h2 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-foreground md:text-4xl">
								<span className="text-balance">
									Why students love Study Sprint
								</span>
							</h2>
							<p className="mt-4 text-muted-foreground">
								Built for the way you actually study
							</p>
						</div>

						<div className="grid gap-6 md:grid-cols-3">
							{[
								{
									icon: Users,
									title: "Study with friends",
									description:
										"See when your friends are studying and join their sessions. Nothing beats accountability from people you care about.",
								},
								{
									icon: Timer,
									title: "Timed sprints",
									description:
										"Set 25, 50, or custom minute sprints. Watch the countdown, stay focused, and celebrate when you finish.",
								},
								{
									icon: Trophy,
									title: "Streak rewards",
									description:
										"Build daily study streaks and compete with friends. Your streak is your reputation—don't break the chain.",
								},
							].map((card, i) => (
								<motion.div
									key={card.title}
									className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
									initial={{ opacity: 0, y: 20 }}
									whileInView={{ opacity: 1, y: 0 }}
									viewport={{ once: true }}
									transition={{ delay: i * 0.1, duration: 0.5 }}
								>
									<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
										<card.icon className="h-6 w-6" />
									</div>
									<h3 className="font-[family-name:var(--font-heading)] text-xl font-semibold text-foreground">
										{card.title}
									</h3>
									<p className="mt-2 text-muted-foreground">
										{card.description}
									</p>
								</motion.div>
							))}
						</div>
					</motion.div>
				</section>

				{/* Feed Preview */}
				<section className="px-4 py-20">
					<motion.div
						className="mx-auto max-w-6xl"
						initial={{ opacity: 0 }}
						whileInView={{ opacity: 1 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6 }}
					>
						<div className="mb-12 text-center">
							<h2 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-foreground md:text-4xl">
								<span className="text-balance">
									Your study feed, reimagined
								</span>
							</h2>
							<p className="mt-4 text-muted-foreground">
								Like a social feed, but for getting things done
							</p>
						</div>

						<div className="mx-auto max-w-md space-y-4">
							{[
								{
									name: "Alex",
									subject: "Organic Chemistry",
									time: "23 min left",
									avatar: "A",
								},
								{
									name: "Jordan",
									subject: "Linear Algebra",
									time: "8 min left",
									avatar: "J",
								},
								{
									name: "Sam",
									subject: "Spanish 201",
									time: "45 min left",
									avatar: "S",
								},
							].map((friend, i) => (
								<motion.div
									key={friend.name}
									className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
									initial={{ opacity: 0, x: -20 }}
									whileInView={{ opacity: 1, x: 0 }}
									viewport={{ once: true }}
									transition={{ delay: i * 0.15, duration: 0.4 }}
								>
									<div className="relative">
										<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
											{friend.avatar}
										</div>
										<span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 animate-pulse rounded-full border-2 border-card bg-green-500" />
									</div>
									<div className="flex-1">
										<p className="font-medium text-foreground">
											{friend.name} is studying{" "}
											<span className="text-primary">{friend.subject}</span>
										</p>
										<p className="text-sm text-muted-foreground">
											{friend.time}
										</p>
									</div>
									<Button
										size="sm"
										variant="secondary"
										className="opacity-0 transition-opacity group-hover:opacity-100"
										asChild
									>
										<Link href="/dashboard">Join</Link>
									</Button>
								</motion.div>
							))}
						</div>
					</motion.div>
				</section>

				{/* CTA Section */}
				<section className="px-4 py-20">
					<motion.div
						className="mx-auto max-w-4xl rounded-3xl bg-primary p-8 text-center text-primary-foreground md:p-16"
						initial={{ opacity: 0, scale: 0.95 }}
						whileInView={{ opacity: 1, scale: 1 }}
						viewport={{ once: true }}
						transition={{ duration: 0.5 }}
					>
						<BookOpen className="mx-auto mb-6 h-12 w-12" />
						<h2 className="font-[family-name:var(--font-heading)] text-3xl font-bold md:text-4xl">
							<span className="text-balance">
								Ready to actually get stuff done?
							</span>
						</h2>
						<p className="mx-auto mt-4 max-w-lg text-primary-foreground/80">
							Join thousands of students who stopped procrastinating and started
							sprinting.
						</p>
						<Button
							size="lg"
							variant="secondary"
							className="mt-8 bg-card text-foreground hover:bg-card/90"
							asChild
						>
							<Link href="/signup">Start your first sprint</Link>
						</Button>
					</motion.div>
				</section>
			</main>

			{/* Footer */}
			<footer className="border-t border-border bg-muted/30 px-4 py-8">
				<div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
					<div className="flex items-center gap-2">
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
							<Zap className="h-4 w-4 text-primary-foreground" />
						</div>
						<span className="font-medium text-foreground">Study Sprint</span>
					</div>
					<p>Made for students, by students.</p>
				</div>
			</footer>
		</div>
	);
}
