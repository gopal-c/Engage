const ILLUSTRATION_COUNT = 10;

export function generateIllustrationUrl(): string {
  const index = Math.floor(Math.random() * ILLUSTRATION_COUNT) + 1;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://engage-portal.vercel.app";
  return `${baseUrl}/birthday/illustrations/bday-${index}.png`;
}
