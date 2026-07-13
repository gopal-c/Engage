import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { signOut } from "@/lib/auth";

const modules = [
  {
    title: "SkillsHub",
    description: "Track and develop your professional skills",
    icon: "🎯",
    color: "bg-blue-50 border-blue-200",
  },
  {
    title: "IdeaForge",
    description: "Share and vote on innovative ideas",
    icon: "💡",
    color: "bg-amber-50 border-amber-200",
  },
  {
    title: "BirthdayHub",
    description: "Celebrate team birthdays and milestones",
    icon: "🎂",
    color: "bg-pink-50 border-pink-200",
  },
];

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <h1 className="text-xl font-bold text-gray-900">Engage</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {session.user.name}
            </span>
            {session.user.image && (
              <img
                src={session.user.image}
                alt=""
                className="h-8 w-8 rounded-full"
              />
            )}
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900">
            Welcome back, {session.user.name?.split(" ")[0]}!
          </h2>
          <p className="mt-1 text-gray-600">
            Here&apos;s your engagement dashboard
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((mod) => (
            <div
              key={mod.title}
              className={`rounded-xl border p-6 ${mod.color} transition-shadow hover:shadow-md`}
            >
              <div className="mb-3 text-3xl">{mod.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900">
                {mod.title}
              </h3>
              <p className="mt-1 text-sm text-gray-600">{mod.description}</p>
              <div className="mt-4">
                <span className="inline-block rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-500">
                  Coming soon
                </span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
