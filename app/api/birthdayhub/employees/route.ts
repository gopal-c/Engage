import { NextResponse } from "next/server";
import { getEmployees } from "@/lib/birthdayhub/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const employees = await getEmployees();
  return NextResponse.json(employees);
}
