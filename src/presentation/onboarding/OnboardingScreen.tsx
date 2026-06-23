"use client";

import * as React from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import { ArrowRight } from "lucide-react";
import { Button, Icon } from "@/src/presentation/design-system";
import { onboarding1, onboarding2, onboarding3, onboarding4 } from "@/src/shared/assets/images";
import { OnboardingDots } from "./components";
import { completeOnboarding } from "./actions";

const SPLASH_MS = 1800;

const SLIDES = [
  {
    image: onboarding2,
    title: "Join The Smart Shoppers",
    description: "Join Thousands Of Happy Shoppers And Start Your Smart Shopping Journey.",
  },
  {
    image: onboarding3,
    title: "Fast Delivery",
    description: "Get Your Groceries Delivered Fast & Fresh, Straight To Your Door.",
  },
  {
    image: onboarding4,
    title: "Easy Shopping",
    description: "Shop Anytime, Anywhere - Your Groceries At Your Fingertips.",
  },
];

export default function OnboardingScreen() {
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
    await completeOnboarding();
    window.location.href = "/";
  };
  const isLast = activeIndex === SLIDES.length - 1;

  if (showSplash) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-6">
        <Image src={onboarding1} alt="Fresh Drop" sizes="310px" className="h-auto w-full max-w-77.5" priority />
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
            <SwiperSlide key={slide.title}>
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
                    <h2 className="text-heading-h2 text-foreground">{slide.title}</h2>
                    <p className="text-body-b4 text-muted-foreground">{slide.description}</p>
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
              Back
            </Button>
            <Button size="md" className="px-6" onClick={finish}>
              Get started
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" className="text-muted-foreground" onClick={finish}>
              skip
            </Button>
            <Button iconOnly className="rounded-full" aria-label="Next slide" onClick={() => swiper?.slideNext()}>
              <Icon icon={ArrowRight} />
            </Button>
          </>
        )}
      </footer>
    </div>
  );
}
