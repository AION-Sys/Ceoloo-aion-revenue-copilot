"use client";

import { useActionState } from "react";
import { signInWithPassword, type SignInState } from "@/app/login/actions";

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
    <form className="auth-form" action={formAction}>
      <input type="hidden" name="next" value={nextPath} />
      <label className="field">
        <span>Email</span>
        <input
          autoComplete="email"
          defaultValue={demoEmail}
          name="email"
          required
          type="email"
        />
      </label>
      <label className="field">
        <span>Password</span>
        <input
          autoComplete="current-password"
          defaultValue={demoPassword}
          name="password"
          required
          type="password"
        />
      </label>
      {state.error ? <p className="form-error">{state.error}</p> : null}
      <button className="button" disabled={pending} type="submit">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
