"use client";

import { usePathname } from "next/navigation";
import { Header } from "./header";

interface ConditionalHeaderProps {
	userEmail?: string;
}

export function ConditionalHeader({ userEmail }: ConditionalHeaderProps) {
	const pathname = usePathname();
	if (pathname === "/dashboard") return null;
	return <Header userEmail={userEmail} />;
}
