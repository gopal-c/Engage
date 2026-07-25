import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { OnboardingModal } from "@/components/onboarding-modal";
import { isUserExcluded } from "@/lib/birthdayhub/storage";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isAdminOrHR = session.user.role === "admin" || session.user.role === "hr";
  let profileCompleted = true;
  let userExcluded = false;
  if (!isAdminOrHR) {
    const [rows, excluded] = await Promise.all([
      sql`SELECT profile_completed FROM auth.users WHERE id = ${session.user.id}`,
      isUserExcluded(session.user.id).catch(() => false),
    ]);
    profileCompleted = rows.length > 0 && (rows[0].profile_completed as boolean);
    userExcluded = excluded;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role={session.user.role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          user={{
            name: session.user.name ?? "User",
            email: session.user.email ?? "",
            image: session.user.image,
            role: session.user.role,
          }}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
      {!profileCompleted && <OnboardingModal canSkip={userExcluded} />}
    </div>
  );
}
