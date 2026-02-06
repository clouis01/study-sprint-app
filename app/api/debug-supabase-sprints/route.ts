import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/debug-supabase-sprints
 *
 * Run this on your Vercel deployment to verify which Supabase project
 * the app uses and whether the sprints table is visible to the API.
 * Remove or restrict this route in production once you're done debugging.
 */
export async function GET() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const projectRef = url
		? url.replace(/^https:\/\//, "").replace(/\.supabase\.co.*$/, "")
		: "(missing)";

	if (!url || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
		return NextResponse.json({
			ok: false,
			message: "Missing Supabase env vars",
			projectRef,
		});
	}

	try {
		const supabase = await createClient();
		const { error } = await supabase
			.from("sprints")
			.select("id")
			.limit(1);

		if (error) {
			return NextResponse.json({
				ok: false,
				message: error.message,
				code: error.code,
				projectRef,
				hint: "In Supabase Dashboard, open the project that matches the projectRef above. In that project: SQL Editor → run apply-sprints-migration.sql, then run: NOTIFY pgrst, 'reload schema';",
			});
		}

		return NextResponse.json({
			ok: true,
			message: "sprints table is reachable",
			projectRef,
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return NextResponse.json({
			ok: false,
			message,
			projectRef,
		});
	}
}
