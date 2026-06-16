import Image from "next/image";
import { PageHeader } from "@/src/presentation/components/PageHeader";
import { aboutFreshDrop } from "@/src/shared/assets/images";

const PARAGRAPHS: string[] = [
  "This application is an online grocery marketplace with fast home delivery.",
  "Users can browse products through categories, add their desired items to the cart, and place orders easily.",
  "All orders are prepared from the nearest store and delivered right to the customer's doorstep.",
  "We make grocery shopping simple, fast, and convenient",
];

export default function AboutScreen() {
  return (
    <div className="flex min-h-dvh flex-col gap-8 px-6 pb-10">
      <PageHeader title="About Freshdrop" />

      <div className="flex justify-center">
        <Image src={aboutFreshDrop} alt="" sizes="270px" className="h-auto w-full max-w-67.5" />
      </div>

      <div className="flex flex-col gap-6 rounded-card-xl bg-linear-to-b from-surface to-surface/20 px-6 py-4 text-body-b2 text-foreground">
        {PARAGRAPHS.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </div>
  );
}
