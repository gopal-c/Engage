import { sql } from "@/lib/db";
import Link from "next/link";

interface Employee {
  id: string;
  name: string;
  email: string;
  department: string | null;
  birthday: string;
}

function getUpcomingBirthdays(employees: Employee[]) {
  const now = new Date();
  const todayMMDD = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  return employees
    .map((emp) => {
      const [mm, dd] = emp.birthday.split("-").map(Number);
      const thisYear = new Date(now.getFullYear(), mm - 1, dd);
      if (thisYear < now) thisYear.setFullYear(now.getFullYear() + 1);
      const daysUntil = Math.ceil((thisYear.getTime() - now.getTime()) / 86400000);
      const isToday = emp.birthday === todayMMDD;
      return { ...emp, daysUntil, isToday };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

export default async function BirthdayHubPage() {
  let employees: Employee[] = [];
  let thisMonthCount = 0;

  try {
    employees = (await sql`
      SELECT id, name, email, department, birthday
      FROM birthdayhub.employees
      ORDER BY birthday ASC
    `) as Employee[];

    const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");
    thisMonthCount = employees.filter((e) => e.birthday.startsWith(currentMonth)).length;
  } catch {
    // tables may not exist
  }

  const upcoming = getUpcomingBirthdays(employees).slice(0, 10);
  const todaysBirthdays = upcoming.filter((e) => e.isToday);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">BirthdayHub</h2>
          <p className="mt-1 text-muted-foreground">
            {employees.length} employees &middot; {thisMonthCount} birthdays this month
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/apps/birthdayhub/compose"
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Compose
          </Link>
          <Link
            href="/apps/birthdayhub/employees"
            className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Manage Employees
          </Link>
          <Link
            href="/apps/birthdayhub/settings"
            className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Settings
          </Link>
        </div>
      </div>

      {todaysBirthdays.length > 0 && (
        <div className="rounded-xl border-2 border-pink-300 bg-pink-50 p-6 dark:border-pink-700 dark:bg-pink-950/30">
          <h3 className="text-lg font-semibold">Today&apos;s Birthdays!</h3>
          <div className="mt-3 space-y-2">
            {todaysBirthdays.map((emp) => (
              <div key={emp.id} className="flex items-center gap-3">
                <span className="text-2xl">🎂</span>
                <div>
                  <p className="font-medium">{emp.name}</p>
                  <p className="text-sm text-muted-foreground">{emp.department || "—"}</p>
                </div>
                <Link
                  href={`/apps/birthdayhub/compose?employee=${emp.id}`}
                  className="ml-auto rounded-md bg-pink-600 px-3 py-1.5 text-sm text-white hover:bg-pink-700"
                >
                  Send Wish
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-4 text-lg font-semibold">Upcoming Birthdays</h3>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">No employees added yet</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Department</th>
                  <th className="px-4 py-3 text-left font-medium">Birthday</th>
                  <th className="px-4 py-3 text-right font-medium">Days Until</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((emp) => (
                  <tr key={emp.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">
                      {emp.isToday && <span className="mr-1">🎂</span>}
                      {emp.name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{emp.department || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {emp.birthday.replace("-", "/")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {emp.isToday ? (
                        <span className="rounded-full bg-pink-100 px-2 py-0.5 text-xs font-medium text-pink-700 dark:bg-pink-900 dark:text-pink-300">
                          Today!
                        </span>
                      ) : (
                        <span className="text-muted-foreground">{emp.daysUntil}d</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
