import { getSkillsHubSession } from "@/lib/skillshub/session";
import { getProfileByEmail } from "@/lib/skillshub/storage";
import { SkillsHubSubNav } from "@/components/skillshub/sub-nav";

export default async function SkillsHubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSkillsHubSession();
  if (!session) return <>{children}</>;

  let approved = false;
  if (session.role === "employee") {
    const isOrgUser = session.email.endsWith("@valueaddsofttech.com");
    const profile = await getProfileByEmail(session.email);
    approved = isOrgUser || profile?.status === "approved";
  }

  return (
    <>
      <SkillsHubSubNav role={session.role} approved={approved} />
      {children}
    </>
  );
}
