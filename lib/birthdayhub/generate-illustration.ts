const ILLUSTRATION_COUNT = 10;

export function generateIllustrationUrl(): string {
  const index = Math.floor(Math.random() * ILLUSTRATION_COUNT) + 1;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://z-index-9999-engage.vercel.app";
  return `${baseUrl}/birthday/illustrations/bday-${index}.png`;
}
