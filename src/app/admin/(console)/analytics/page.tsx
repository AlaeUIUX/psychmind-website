import { redirect } from "next/navigation";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

// Analytics is the admin home now (/admin); old links land there, date range kept.
export default async function OldAdminAnalytics({ searchParams }: Props) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(await searchParams)) if (typeof v === "string") params.set(k, v);
  const query = params.toString();
  redirect(query ? `/admin?${query}` : "/admin");
}
