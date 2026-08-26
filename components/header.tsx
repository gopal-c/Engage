import { signOut } from "@/lib/auth";
import { MobileSidebar } from "./sidebar";
import { NotificationBell } from "./notification-bell";
import { UserMenu } from "./user-menu";

interface HeaderProps {
  user: {
    name: string;
    email: string;
    image?: string | null;
    role?: string;
  };
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between px-4" style={{ background: "linear-gradient(180deg, rgba(255,255,255,.72), rgba(255,255,255,.46))", backdropFilter: "blur(26px) saturate(180%)", WebkitBackdropFilter: "blur(26px) saturate(180%)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div className="flex items-center gap-2">
        <MobileSidebar role={user.role} />
        <span className="text-lg font-bold">Engage</span>
      </div>
      <div className="flex items-center gap-2">
        <NotificationBell />
        <UserMenu
          name={user.name}
          email={user.email}
          image={user.image}
          role={user.role}
          signOutAction={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        />
      </div>
    </header>
  );
}
