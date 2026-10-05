"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSignOut() {
    setPending(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <button type="button" onClick={onSignOut} disabled={pending} className="qcms-btn">
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
