import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/src/presentation/components/PageHeader";
import { aboutFreshDrop } from "@/src/shared/assets/images";

const PARAGRAPH_KEYS = ["p1", "p2", "p3", "p4"] as const;

export default async function AboutScreen() {
  const t = await getTranslations("about");

  return (
    <div className="flex min-h-dvh flex-col gap-8 px-6 pb-10">
      <PageHeader title={t("title")} />

      <div className="flex justify-center">
        <Image src={aboutFreshDrop} alt="" sizes="270px" className="h-auto w-full max-w-67.5" />
      </div>

      <div className="flex flex-col gap-6 rounded-card-xl bg-linear-to-b from-surface-sunken to-surface-sunken/20 px-6 py-4 text-body-b2 text-foreground">
        {PARAGRAPH_KEYS.map((key) => (
          <p key={key}>{t(key)}</p>
        ))}
      </div>
    </div>
  );
}
