import { profilesServerApi } from "@/src/presentation/profile/profile-server-api";
import ProfileScreen from "@/src/presentation/profile/ProfileScreen";

// The profile reflects per-user data read each request — never statically cached.
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await profilesServerApi.getMe();
  return <ProfileScreen user={user} />;
}
