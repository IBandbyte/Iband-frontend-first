import { chmodSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { chromium } from "playwright";

const CREDENTIAL_JSON = String(process.env.IBAND_LIVE_CREATOR_CREDENTIAL_JSON || "").trim();
const TOKEN_PATH = String(process.env.IBAND_LIVE_CREATOR_AUTH_TOKEN_FILE || "").trim();

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function readCredential() {
  if (!CREDENTIAL_JSON) {
    fail(
      "MOVIE_MENTOR_LIVE_CERTIFICATION_CREDENTIAL_REQUIRED",
      "Live Movie Mentor certification requires IBAND_LIVE_CREATOR_CREDENTIAL_JSON for the dedicated non-privileged creator."
    );
  }

  let parsed;
  try {
    parsed = JSON.parse(CREDENTIAL_JSON);
  } catch {
    fail(
      "MOVIE_MENTOR_LIVE_CERTIFICATION_CREDENTIAL_JSON_INVALID",
      "IBAND_LIVE_CREATOR_CREDENTIAL_JSON must be valid JSON."
    );
  }

  const frontendUrl = text(parsed?.frontendUrl);
  const identifier = text(parsed?.identifier);
  const password = text(parsed?.password);

  if (!frontendUrl || !identifier || !password) {
    fail(
      "MOVIE_MENTOR_LIVE_CERTIFICATION_CREDENTIAL_FIELDS_REQUIRED",
      "The live creator credential must contain frontendUrl, identifier, and password."
    );
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(frontendUrl);
  } catch {
    fail(
      "MOVIE_MENTOR_LIVE_CERTIFICATION_FRONTEND_URL_INVALID",
      "The live creator credential frontendUrl must be an absolute HTTPS URL."
    );
  }

  if (parsedUrl.protocol !== "https:" || parsedUrl.username || parsedUrl.password) {
    fail(
      "MOVIE_MENTOR_LIVE_CERTIFICATION_FRONTEND_URL_INVALID",
      "The live creator credential frontendUrl must be an absolute HTTPS URL without embedded credentials."
    );
  }

  if (parsed?.secretKey || parsed?.clerkSecretKey || parsed?.serviceKey || parsed?.apiKey) {
    fail(
      "MOVIE_MENTOR_LIVE_CERTIFICATION_PRIVILEGED_CREDENTIAL_FORBIDDEN",
      "Live creator certification forbids privileged Clerk or service credentials."
    );
  }

  return Object.freeze({
    frontendUrl: parsedUrl.origin,
    identifier,
    password,
  });
}

function requireTokenPath() {
  if (!TOKEN_PATH) {
    fail(
      "MOVIE_MENTOR_LIVE_CERTIFICATION_TOKEN_PATH_REQUIRED",
      "Live creator certification requires an ephemeral token file path."
    );
  }
  return TOKEN_PATH;
}

async function obtainFreshSessionToken({ frontendUrl, identifier, password }) {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(frontendUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForFunction(
      () => Boolean(window.Clerk?.client?.signIn && typeof window.Clerk?.setActive === "function"),
      null,
      { timeout: 60_000 }
    );

    return await page.evaluate(async ({ identifier: liveIdentifier, password: livePassword }) => {
      const clerk = window.Clerk;
      if (!clerk?.client?.signIn || typeof clerk?.setActive !== "function") {
        throw new Error("Clerk did not expose the production browser authentication surface.");
      }

      if (clerk.session && typeof clerk.signOut === "function") {
        await clerk.signOut();
      }

      const signIn = await clerk.client.signIn.create({ identifier: liveIdentifier });
      const attempted = await signIn.attemptFirstFactor({
        strategy: "password",
        password: livePassword,
      });

      if (attempted?.status !== "complete" || !attempted?.createdSessionId) {
        const status = attempted?.status || "unknown";
        throw new Error(`Dedicated live creator password sign-in did not complete (status: ${status}).`);
      }

      await clerk.setActive({ session: attempted.createdSessionId });

      const session =
        clerk.session ||
        clerk.client?.sessions?.find?.((candidate) => candidate?.id === attempted.createdSessionId) ||
        null;

      if (!session || typeof session.getToken !== "function") {
        throw new Error("Clerk created the live creator session but did not expose a token-capable active session.");
      }

      const token = await session.getToken();
      if (typeof token !== "string" || !token.trim()) {
        throw new Error("Clerk returned an empty live creator session token.");
      }

      return token.trim();
    }, { identifier, password });
  } finally {
    await browser.close();
  }
}

const credential = readCredential();
const tokenPath = requireTokenPath();
const token = await obtainFreshSessionToken(credential);

mkdirSync(dirname(tokenPath), { recursive: true });
writeFileSync(tokenPath, `${token}\n`, { encoding: "utf8", mode: 0o600 });
try { chmodSync(tokenPath, 0o600); } catch {}

console.log(`Fresh non-privileged Clerk creator session acquired for ${credential.frontendUrl}; token stored only in the ephemeral runner file.`);
