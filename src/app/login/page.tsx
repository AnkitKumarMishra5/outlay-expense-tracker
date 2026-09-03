"use client";

import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="py-20 text-center text-sm text-muted">Loading…</p>}>
      <AuthForm mode="login" />
    </Suspense>
  );
}
