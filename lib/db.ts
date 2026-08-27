import { neon } from "@neondatabase/serverless";

export function sql(strings: TemplateStringsArray, ...values: unknown[]) {
  const client = neon(process.env.POSTGRES_URL!);
  return client(strings, ...values);
}

export function sqlRaw(query: string, params: unknown[] = []) {
  const client = neon(process.env.POSTGRES_URL!);
  return client.query(query, params);
}
