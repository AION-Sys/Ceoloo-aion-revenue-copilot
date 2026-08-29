import { describe, expect, it } from "vitest";
import { isProtectedPath, isPublicPath } from "@/lib/auth/routes";

describe("auth routes", () => {
  it("treats login and auth callback paths as public", () => {
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/auth/callback")).toBe(true);
    expect(isPublicPath("/auth/signout")).toBe(true);
    expect(isPublicPath("/no-organization")).toBe(true);
  });

  it("protects workspace routes", () => {
    expect(isProtectedPath("/")).toBe(true);
    expect(isProtectedPath("/leads/abc")).toBe(true);
    expect(isProtectedPath("/login")).toBe(false);
    expect(isProtectedPath("/auth/callback")).toBe(false);
  });
});
