import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Timer, ArrowRight, Users } from "lucide-react";

export default function HomePage() {
	return (
		<div className="min-h-screen flex flex-col">
			<header className="border-b">
				<div className="container flex h-14 items-center justify-between">
					<div className="flex items-center gap-2 font-bold">
						<Timer className="h-5 w-5" />
						<span>Study Sprint</span>
					</div>
					<nav className="flex items-center gap-2">
						<Link href="/dashboard">
							<Button variant="ghost">Dashboard</Button>
						</Link>
						<Link href="/login">
							<Button variant="ghost">Log in</Button>
						</Link>
						<Link href="/signup">
							<Button>Sign up</Button>
						</Link>
					</nav>
				</div>
			</header>

			<main className="flex-1 flex items-center justify-center">
				<div className="container flex flex-col items-center text-center gap-8">
					<div className="space-y-4 max-w-2xl">
						<h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
							Study together,
							<br />
							<span className="text-primary">stay accountable</span>
						</h1>
						<p className="text-lg text-muted-foreground max-w-lg mx-auto">
							See when friends are studying. Join their sprint instantly. Build streaks together—no pressure, just progress.
						</p>
					</div>

					<div className="flex items-center gap-8 text-sm text-muted-foreground">
						<div className="flex items-center gap-2">
							<Users className="h-4 w-4" />
							<span>Study with friends</span>
						</div>
						<div className="flex items-center gap-2">
							<Timer className="h-4 w-4" />
							<span>Shared timers</span>
						</div>
					</div>

					<div className="flex flex-col sm:flex-row gap-4">
						<Link href="/signup">
							<Button size="lg" className="gap-2">
								Get started
								<ArrowRight className="h-4 w-4" />
							</Button>
						</Link>
						<Link href="/login">
							<Button size="lg" variant="outline">
								I have an account
							</Button>
						</Link>
					</div>
				</div>
			</main>
		</div>
	);
}
