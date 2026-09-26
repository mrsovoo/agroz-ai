import { getCurrentUser } from "@/lib/session";
import NotificationsView from "@/components/NotificationsView";

export const metadata = {
  title: "Bildirishnomalar — Agroz AI",
  description: "Real agrometeorologik ogohlantirishlar, dehqonchilik va veterinariya tavsiyalari.",
};

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await getCurrentUser();

  return (
    <main className="mx-auto max-w-2xl px-4 py-5 sm:px-6">
      <NotificationsView userRegion={user?.region ?? "Toshkent"} />
    </main>
  );
}
