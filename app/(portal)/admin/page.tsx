import Link from "next/link";
import { sql } from "@/lib/db";

interface Stats {
  total_users: number;
  admin_count: number;
  hr_count: number;
  employee_count: number;
}

export default async function AdminPage() {
  let stats: Stats = { total_users: 0, admin_count: 0, hr_count: 0, employee_count: 0 };
  try {
    const rows = await sql`
      SELECT
        COUNT(*)::int AS total_users,
        COUNT(*) FILTER (WHERE role = 'admin')::int AS admin_count,
        COUNT(*) FILTER (WHERE role = 'hr')::int AS hr_count,
        COUNT(*) FILTER (WHERE role = 'employee')::int AS employee_count
      FROM auth.users
    `;
    stats = rows[0] as Stats;
  } catch {
    // table may not exist yet
  }

  const cards = [
    { label: "Total Users", value: stats.total_users },
    { label: "Admins", value: stats.admin_count },
    { label: "HR", value: stats.hr_count },
    { label: "Employees", value: stats.employee_count },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-ink-800">Admin Dashboard</h1>
        <p className="mt-1 text-ink-500">
          Manage users and portal settings
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

      <div>
        <Link
          href="/admin/users"
          className="inline-flex items-center rounded-xl bg-indigo-deep px-5 py-2.5 text-sm font-medium text-white shadow-2 transition-all hover:bg-indigo-press hover:shadow-3 hover:-translate-y-px"
        >
          Manage Users
        </Link>
      </div>
    </div>
  );
}
