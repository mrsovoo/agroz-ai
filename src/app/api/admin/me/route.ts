import { adminEnabled, isAdminAuthenticated } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/** Admin panel holati: yoqilganmi, kim kirgan. */
export async function GET() {
  const authenticated = await isAdminAuthenticated();
  return Response.json({
    enabled: await adminEnabled(),
    authenticated,
    username: authenticated ? "admin" : null,
  });
}
