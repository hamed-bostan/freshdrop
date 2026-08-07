import { walletsServerApi } from "@/src/presentation/wallet/wallet-server-api";
import WalletScreen from "@/src/presentation/wallet/WalletScreen";

// The wallet is per-user data fetched from the REST API at request time (BFF).
export const dynamic = "force-dynamic";

export default async function WalletPage() {
  const wallet = await walletsServerApi.get();

  return <WalletScreen wallet={wallet} />;
}
