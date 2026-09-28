import { getCurrentUser } from "@/lib/session";
import ProfileClientView from "@/components/ProfileClientView";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  return (
    <main>
      <ProfileClientView initialUser={user} />
    </main>
  );
}
