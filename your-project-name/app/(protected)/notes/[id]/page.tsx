import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NoteForm } from "@/components/notes/note-form";

interface NotePageProps {
	params: Promise<{ id: string }>;
}

export default async function NotePage({ params }: NotePageProps) {
	const { id } = await params;

	if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
		notFound();
	}

	const supabase = await createClient();

	const { data: note, error } = await supabase
		.from("notes")
		.select("*")
		.eq("id", id)
		.single();

	if (error || !note) {
		notFound();
	}

	return <NoteForm note={note} mode="edit" />;
}
