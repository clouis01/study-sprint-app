"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function DatabaseSetupBanner() {
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function check() {
      const { error } = await supabase
        .from("sprints")
        .select("id")
        .limit(1);

      const missingTable = error?.code === "42P01" || (error?.message?.includes("does not exist") ?? false);
      setNeedsSetup(missingTable);
    }
    check();
  }, [supabase]);

  if (needsSetup !== true) return null;

  return (
    <Card className="p-4 border-amber-500/50 bg-amber-500/10">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-2">
          <p className="font-medium text-amber-800 dark:text-amber-200">
            Database not set up
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Run the Study Sprint migration so you can create sprints and track streaks.
          </p>
          <ol className="text-sm text-amber-700 dark:text-amber-300 list-decimal list-inside space-y-1 mt-2">
            <li>Open your Supabase project dashboard</li>
            <li>Go to <strong>SQL Editor</strong></li>
            <li>Copy the contents of <code className="bg-amber-200/50 dark:bg-amber-900/30 px-1 rounded">supabase/migrations/20240102000000_create_sprints.sql</code></li>
            <li>Paste and run the SQL</li>
          </ol>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
            Or from the project folder run: <code className="bg-amber-200/50 dark:bg-amber-900/30 px-1 rounded">supabase db push</code>
          </p>
        </div>
      </div>
    </Card>
  );
}
