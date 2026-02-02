import { createClient } from "@/lib/supabase/server";
import { ConditionalHeader } from "@/components/layout/conditional-header";

/** Protected routes use cookies and Supabase — must be dynamic, not statically prerendered. */
export const dynamic = "force-dynamic";

/**
 * Layout for protected pages (requires authentication).
 *
 * The middleware handles redirecting unauthenticated users,
 * so if we reach this layout, the user is logged in.
 */
export default async function ProtectedLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	let user: { email?: string } | null = null;
	// Only call Supabase when env vars are set (avoids build failure on Vercel if env not configured yet)
	if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
		try {
			const supabase = await createClient();
			const { data } = await supabase.auth.getUser();
			user = data?.user ?? null;
		} catch (err) {
			console.error("Protected layout auth error:", err);
		}
	}

	return (
		<div className="min-h-screen flex flex-col">
			<ConditionalHeader userEmail={user?.email} />
			<main className="flex-1">{children}</main>
		</div>
	);
}
