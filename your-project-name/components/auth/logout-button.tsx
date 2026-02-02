"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface LogoutButtonProps {
	variant?: "default" | "ghost" | "outline";
	showIcon?: boolean;
	size?: "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg";
	className?: string;
}

export function LogoutButton({
	variant = "ghost",
	showIcon = true,
	size,
	className,
}: LogoutButtonProps) {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);

	async function handleLogout() {
		setIsLoading(true);

		try {
			const response = await fetch("/api/auth/logout", {
				method: "POST",
			});

			if (!response.ok) {
				toast.error("Failed to log out");
				return;
			}

			toast.success("Logged out successfully");
			router.push("/");
			router.refresh();
		} catch {
			toast.error("Something went wrong. Please try again.");
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<Button
			variant={variant}
			size={size}
			onClick={handleLogout}
			disabled={isLoading}
			className={className ?? "w-full justify-start"}
		>
			{isLoading ? (
				<Loader2 className="mr-2 h-4 w-4 animate-spin" />
			) : showIcon ? (
				<LogOut className="mr-2 h-4 w-4" />
			) : null}
			Log out
		</Button>
	);
}
