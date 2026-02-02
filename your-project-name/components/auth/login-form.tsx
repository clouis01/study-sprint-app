"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

/** Turn API error into a short, user-friendly message and optional hint. */
function loginErrorMessage(apiError: string): { message: string; hint?: string } {
	const lower = apiError.toLowerCase();
	if (lower.includes("email not confirmed"))
		return {
			message: "Email not confirmed",
			hint: "Check your inbox (and spam) for the confirmation link from Supabase, or turn off “Confirm email” in Supabase → Authentication → Providers → Email.",
		};
	if (lower.includes("rate") && lower.includes("exceeded"))
		return {
			message: "Too many attempts",
			hint: "Supabase limits emails per hour. Wait about an hour or turn off email confirmation in your Supabase project for development.",
		};
	if (lower.includes("invalid login") || lower.includes("invalid credentials"))
		return { message: "Invalid email or password", hint: "Check your email and password and try again." };
	return { message: apiError, hint: undefined };
}

export function LoginForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<{ message: string; hint?: string } | null>(null);

	// Show error from URL (e.g. after failed email confirm)
	useEffect(() => {
		const urlError = searchParams.get("error");
		if (urlError === "confirmation_failed")
			setError({
				message: "Confirmation link failed or expired",
				hint: "Try signing up again or use the link from your latest email.",
			});
	}, [searchParams]);

	async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setIsLoading(true);
		setError(null);

		const formData = new FormData(event.currentTarget);
		const email = formData.get("email") as string;
		const password = formData.get("password") as string;

		try {
			const response = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password }),
			});

			const data = await response.json();
			const apiError = data?.error as string | undefined;

			if (!response.ok) {
				const { message, hint } = loginErrorMessage(apiError || "Failed to log in");
				setError({ message, hint });
				toast.error(message);
				return;
			}

			toast.success("Welcome back!");
			router.push("/dashboard");
			router.refresh();
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			console.error("Login error:", err);
			setError({ message: msg || "Something went wrong. Please try again." });
			toast.error(msg || "Something went wrong. Please try again.");
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<Card className="w-full max-w-md">
			<CardHeader className="space-y-1">
				<CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
				<CardDescription>
					Enter your email and password to sign in
				</CardDescription>
			</CardHeader>
			<form onSubmit={onSubmit}>
				<CardContent className="space-y-4">
					{error && (
						<div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
							<div className="flex items-center gap-2 font-medium">
								<AlertCircle className="h-4 w-4 shrink-0" />
								{error.message}
							</div>
							{error.hint && (
								<p className="mt-2 text-muted-foreground">{error.hint}</p>
							)}
						</div>
					)}
					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							name="email"
							type="email"
							placeholder="you@example.com"
							required
							disabled={isLoading}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="password">Password</Label>
						<Input
							id="password"
							name="password"
							type="password"
							placeholder="Enter your password"
							required
							disabled={isLoading}
						/>
					</div>
				</CardContent>
				<CardFooter className="flex flex-col space-y-4 pt-2">
					<Button type="submit" className="w-full" disabled={isLoading}>
						{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Sign in
					</Button>
					<p className="text-sm text-muted-foreground text-center">
						Don&apos;t have an account?{" "}
						<Link href="/signup" className="text-primary hover:underline">
							Sign up
						</Link>
					</p>
				</CardFooter>
			</form>
		</Card>
	);
}
