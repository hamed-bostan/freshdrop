"use client";

import * as React from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import { ArrowRight } from "lucide-react";
import { Button, Icon } from "@/src/presentation/design-system";
import { routing } from "@/src/i18n/routing";
import { onboarding1, onboarding2, onboarding3, onboarding4 } from "@/src/shared/assets/images";
import { OnboardingDots } from "./components";
import { completeOnboarding } from "./actions";

const SPLASH_MS = 1800;

const SLIDES = [
  { image: onboarding2, titleKey: "slide1Title", descKey: "slide1Desc" },
  { image: onboarding3, titleKey: "slide2Title", descKey: "slide2Desc" },
  { image: onboarding4, titleKey: "slide3Title", descKey: "slide3Desc" },
] as const;

export default function OnboardingScreen() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [showSplash, setShowSplash] = React.useState(true);
  const [swiper, setSwiper] = React.useState<SwiperType | null>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);

  React.useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  const finish = async () => {
    // Server-set the onboarding cookie (httpOnly) so the middleware gate is
    // server-authoritative, then full-navigate so middleware re-runs with it.
    // Full reload (not the router) is required for the cookie to take effect, so
    // add the locale prefix by hand to land on the same-locale home.
    await completeOnboarding();
    window.location.href = locale === routing.defaultLocale ? "/" : `/${locale}`;
  };
  const isLast = activeIndex === SLIDES.length - 1;

  if (showSplash) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-6">
        <Image src={onboarding1} alt={t("splashAlt")} sizes="310px" className="h-auto w-full max-w-77.5" priority />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex flex-1 flex-col justify-center">
        <Swiper
          autoHeight
          onSwiper={setSwiper}
          onSlideChange={(instance) => setActiveIndex(instance.activeIndex)}
          className="w-full"
        >
          {SLIDES.map((slide, index) => (
            <SwiperSlide key={slide.titleKey}>
              <div className="flex flex-col items-center gap-8 px-6">
                <Image
                  src={slide.image}
                  alt=""
                  sizes="280px"
                  priority={index === 0}
                  className="h-auto w-full max-w-70"
                />

                <div className="flex flex-col items-center gap-6">
                  <OnboardingDots count={SLIDES.length} activeIndex={activeIndex} />

                  <div className="flex flex-col items-center gap-3 text-center">
                    <h2 className="text-heading-h2 text-foreground">{t(slide.titleKey)}</h2>
                    <p className="text-body-b4 text-muted-foreground">{t(slide.descKey)}</p>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <footer className="flex items-center justify-between px-6 pb-10 pt-4">
        {isLast ? (
          <>
            <Button variant="ghost" className="text-muted-foreground" onClick={() => swiper?.slidePrev()}>
              {t("back")}
            </Button>
            <Button size="md" className="px-6" onClick={finish}>
              {t("getStarted")}
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" className="text-muted-foreground" onClick={finish}>
              {t("skip")}
            </Button>
            <Button iconOnly className="rounded-full" aria-label={t("nextSlide")} onClick={() => swiper?.slideNext()}>
              <Icon icon={ArrowRight} />
            </Button>
          </>
        )}
      </footer>
    </div>
  );
}
