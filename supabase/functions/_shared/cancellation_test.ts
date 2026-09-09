import {
  generateCancellationToken,
  hashCancellationToken,
  isCancellationToken,
} from "./cancellation.ts";

const SECRET = "cancellation-test-secret-that-is-long-enough";

Deno.test("generates an unguessable URL-safe token", () => {
  const first = generateCancellationToken();
  const second = generateCancellationToken();

  if (!isCancellationToken(first)) throw new Error("invalid token format");
  if (first === second) {
    throw new Error("tokens should be independently random");
  }
});

Deno.test("creates a deterministic, token-specific HMAC", async () => {
  const token = generateCancellationToken();
  const first = await hashCancellationToken(SECRET, token);
  const second = await hashCancellationToken(SECRET, token);
  const different = await hashCancellationToken(
    SECRET,
    generateCancellationToken(),
  );

  if (first !== second) throw new Error("same token must produce same HMAC");
  if (first === different) {
    throw new Error("different tokens need different HMACs");
  }
  if (!/^[0-9a-f]{64}$/.test(first)) throw new Error("invalid HMAC format");
});
