"use client";

import { LogOut } from "lucide-react";
import { useFormStatus } from "react-dom";
import { logout } from "@/actions/auth";

function SignOutButtonInner() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="flex items-center w-full">
      <LogOut className="mr-2 h-4 w-4" />
      Sign out
    </button>
  );
}

export function SignOutButton() {
  return (
    <form action={logout}>
      <SignOutButtonInner />
    </form>
  );
}