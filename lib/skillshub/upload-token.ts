import { SignJWT, jwtVerify } from "jose";

function getSecret(): Uint8Array {
  const s = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error("AUTH_SECRET or NEXTAUTH_SECRET must be set");
  }
  return new TextEncoder().encode(s);
}

export async function signPreApprovalUploadToken(profileId: string): Promise<string> {
  return await new SignJWT({ scope: "pre-approval-upload" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(profileId)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyPreApprovalUploadToken(token: string | undefined | null): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
    if (payload.scope !== "pre-approval-upload") return null;
    if (typeof payload.sub !== "string") return null;
    return payload.sub;
  } catch {
    return null;
  }
}
