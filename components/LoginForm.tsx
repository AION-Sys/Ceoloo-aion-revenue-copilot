"use client";

import { useActionState } from "react";
import { signInWithPassword, type SignInState } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type LoginFormProps = {
  nextPath: string;
  initialError?: string;
  demoEmail?: string;
  demoPassword?: string;
};

const initialState: SignInState = {};

export function LoginForm({
  nextPath,
  initialError,
  demoEmail,
  demoPassword,
}: LoginFormProps) {
  const [state, formAction, pending] = useActionState(signInWithPassword, {
    ...initialState,
    error: initialError,
  });

  return (
    <form className="space-y-4" action={formAction}>
      <input type="hidden" name="next" value={nextPath} />
      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">Email</span>
        <Input
          autoComplete="email"
          defaultValue={demoEmail}
          name="email"
          required
          type="email"
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">Password</span>
        <Input
          autoComplete="current-password"
          defaultValue={demoPassword}
          name="password"
          required
          type="password"
        />
      </label>
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      <Button className="w-full" disabled={pending} type="submit">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
