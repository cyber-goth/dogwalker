import { describe, expect, it } from "vitest";
import { signRole, verifySignedRole } from "./auth";

describe("auth", () => {
  const secret = "test-secret-123";
  it("round-trips owner role", async () => {
    expect(await verifySignedRole(await signRole("owner", secret), secret)).toBe(
      "owner"
    );
  });
  it("round-trips walker role", async () => {
    expect(await verifySignedRole(await signRole("walker", secret), secret)).toBe(
      "walker"
    );
  });
  it("rejects tampered value", async () => {
    expect(await verifySignedRole("owner.forged", secret)).toBeNull();
  });
  it("rejects wrong secret", async () => {
    expect(
      await verifySignedRole(await signRole("walker", secret), "other")
    ).toBeNull();
  });
  it("rejects empty/undefined", async () => {
    expect(await verifySignedRole(undefined, secret)).toBeNull();
    expect(await verifySignedRole("", secret)).toBeNull();
  });
});
