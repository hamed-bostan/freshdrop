import { GetWallet } from "@/src/domain/use-cases/wallet/GetWallet";
import { walletRepository } from "@/src/infrastructure/container";
import WalletScreen from "@/src/presentation/wallet/WalletScreen";

export default async function WalletPage() {
  const wallet = await new GetWallet(walletRepository).execute();

  return <WalletScreen wallet={wallet} />;
}
