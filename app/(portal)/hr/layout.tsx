import { requireHR } from "@/lib/auth-guard";

export default async function HRLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireHR();
  return <>{children}</>;
}
