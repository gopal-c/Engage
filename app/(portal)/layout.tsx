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
      sql`
        SELECT u.date_of_birth,
               EXISTS(SELECT 1 FROM birthdayhub.about_me am WHERE am.user_id = u.id) AS has_about_me
        FROM auth.users u
        WHERE u.id = ${session.user.id}
      `,
      isUserExcluded(session.user.id).catch(() => false),
    ]);
    profileCompleted = rows.length > 0 && !!(rows[0].date_of_birth) && !!(rows[0].has_about_me);
    userExcluded = excluded;
  }

  return (
    <div className="relative flex flex-col h-screen overflow-hidden">
      {/* Decorative orb blobs matching design mock */}
      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        aria-hidden="true"
        style={{ background: "#FAFAFC" }}
      >
        <svg className="absolute" width="0" height="0">
          <defs>
            <filter id="orb-blur">
              <feGaussianBlur in="SourceGraphic" stdDeviation="80" />
            </filter>
          </defs>
        </svg>
        <div className="absolute" style={{ width: 760, height: 760, left: -180, top: -300, opacity: 0.3, background: "#8B7BE8", borderRadius: "50%", filter: "blur(120px)" }} />
        <div className="absolute" style={{ width: 680, height: 680, right: -200, top: 200, opacity: 0.24, background: "#7CD3C5", borderRadius: "50%", filter: "blur(120px)" }} />
        <div className="absolute" style={{ width: 620, height: 620, left: "30%", bottom: -340, opacity: 0.2, background: "#8B7BE8", borderRadius: "50%", filter: "blur(120px)" }} />
      </div>

      <Header
        user={{
          name: session.user.name ?? "User",
          email: session.user.email ?? "",
          image: session.user.image,
          role: session.user.role,
        }}
      />
      <div className="relative z-10 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[1440px] px-6">
          <Sidebar role={session.user.role} />
          <main className="flex-1 min-w-0 py-4 sm:py-6 md:pl-2">
            {children}
          </main>
        </div>
      </div>
      {!profileCompleted && <OnboardingModal canSkip={userExcluded} />}
    </div>
  );
}
