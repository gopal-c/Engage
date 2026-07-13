import { neon } from "@neondatabase/serverless";

export function sql(strings: TemplateStringsArray, ...values: unknown[]) {
  const client = neon(process.env.POSTGRES_URL!);
  return client(strings, ...values);
}
