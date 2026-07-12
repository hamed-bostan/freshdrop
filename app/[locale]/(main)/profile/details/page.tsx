import CompleteProfileScreen from "@/src/presentation/profile/CompleteProfileScreen";
import { profilesServerApi } from "@/src/presentation/profile/profile-server-api";

// Prefilled from per-user data read each request — never statically cached.
export const dynamic = "force-dynamic";

export default async function ProfileDetailsPage() {
  const user = await profilesServerApi.getMe();
  return <CompleteProfileScreen user={user} />;
}
