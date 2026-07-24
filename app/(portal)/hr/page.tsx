import { sql } from "@/lib/db";
import { UserManagement } from "@/components/user-management";

interface Stats {
  total_users: number;
  hr_count: number;
  manager_count: number;
  employee_count: number;
}

export default async function HRDashboardPage() {
  let stats: Stats = { total_users: 0, hr_count: 0, manager_count: 0, employee_count: 0 };
  try {
    const rows = await sql`
      SELECT
        COUNT(*)::int AS total_users,
        COUNT(*) FILTER (WHERE role = 'hr')::int AS hr_count,
        COUNT(*) FILTER (WHERE role = 'manager')::int AS manager_count,
        COUNT(*) FILTER (WHERE role = 'employee')::int AS employee_count
      FROM auth.users
    `;
    stats = rows[0] as Stats;
  } catch {
    // table may not exist yet
  }

  const cards = [
    { label: "Total Users", value: stats.total_users },
    { label: "HR", value: stats.hr_count },
    { label: "Managers", value: stats.manager_count },
    { label: "Employees", value: stats.employee_count },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-ink-800">HR Dashboard</h1>
        <p className="mt-1 text-ink-500">
          Manage users and team settings
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-ink-200/60 bg-ink-0/70 p-6 shadow-2 backdrop-blur-sm"
          >
            <p className="eyebrow">{card.label}</p>
            <p className="mt-1 text-3xl font-bold text-ink-800">{card.value}</p>
          </div>
        ))}
      </div>

      <UserManagement />
    </div>
  );
}
