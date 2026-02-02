import { SprintForm } from "@/components/sprints/sprint-form";
import { ActiveSprintsFeed } from "@/components/sprints/active-sprints-feed";
import { ActiveSprintTimer } from "@/components/sprints/active-sprint-timer";
import { StreakDisplay } from "@/components/sprints/streak-display";
import { DatabaseSetupBanner } from "@/components/sprints/database-setup-banner";

export default async function DashboardPage() {
	return (
		<div className="container max-w-6xl py-8 space-y-8">
			<div>
				<h1 className="text-3xl font-bold mb-2">Your Study Dashboard</h1>
				<p className="text-muted-foreground">
					Start a sprint, join friends, and build your streak.
				</p>
			</div>

			<DatabaseSetupBanner />

			<StreakDisplay />

			<ActiveSprintTimer />

			<div className="grid gap-8 lg:grid-cols-2">
				<div>
					<h2 className="text-xl font-semibold mb-4">Start a New Sprint</h2>
					<SprintForm />
				</div>

				<div>
					<ActiveSprintsFeed />
				</div>
			</div>
		</div>
	);
}
