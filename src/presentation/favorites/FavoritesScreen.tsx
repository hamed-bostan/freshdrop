import Image from "next/image";
import Link from "next/link";
import { Button } from "@/src/presentation/design-system";
import { PageHeader } from "@/src/presentation/components/PageHeader";
import { favoriteList } from "@/src/shared/assets/images";

export default function FavoritesScreen() {
  return (
    <div className="flex min-h-dvh flex-col px-6 pb-10">
      <PageHeader title="Favorites" />

      <div className="flex flex-col items-center gap-8 pt-8">
        {/* Decorative — the empty-state copy below conveys the meaning. Design size 240×250. */}
        <Image src={favoriteList} alt="" sizes="240px" className="h-auto w-full max-w-60" />

        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-heading-h4 text-foreground">Your favorite list is empty.</h2>
          <p className="text-body-b4 text-muted-foreground">
            Start Adding Products To Your Favorites And Find Them Here Easily
          </p>
        </div>

        <Button asChild size="lg" className="mt-20 w-full">
          <Link href="/">Start Shopping</Link>
        </Button>
      </div>
    </div>
  );
}
