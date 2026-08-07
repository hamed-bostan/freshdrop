"use client";

import { useLocale } from "next-intl";
import * as React from "react";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import { getLangDir } from "@/src/i18n/direction";
import { cn } from "@/src/lib/utils";
import { stillWhenReduced } from "@/src/presentation/design-system";

import { StatCard } from "./StatCard";

import type { StatCardProps } from "./StatCard";
import type { Swiper as SwiperType } from "swiper";

type StatCardCarouselProps = {
  /** One entry per KPI tile, same props `StatCard` itself takes. */
  cards: StatCardProps[];
};

/**
 * Narrow-viewport counterpart to the KPI grid: one tile per swipe with dot
 * pagination, rather than four tall cards stacked full-width down the screen.
 * A phone's viewport can show one tile's value, delta, and sparkline
 * comfortably; stacking all four pushes everything below (needs-attention,
 * the chart) below the fold before the page says anything actionable.
 *
 * Only rendered under the `sm` breakpoint — `DashboardOverviewScreen` keeps
 * the existing grid for `sm:` and up, hidden here via the wrapper's
 * responsive class rather than duplicated logic in this component.
 */
export function StatCardCarousel({ cards }: StatCardCarouselProps) {
  const locale = useLocale();
  const [activeIndex, setActiveIndex] = React.useState(0);

  return (
    <div>
      <Swiper
        dir={getLangDir(locale)}
        onSlideChange={(instance: SwiperType) => setActiveIndex(instance.activeIndex)}
        className="w-full"
      >
        {cards.map((card) => (
          <SwiperSlide key={card.label}>
            <StatCard {...card} />
          </SwiperSlide>
        ))}
      </Swiper>

      {cards.length > 1 ? (
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {cards.map((card, index) => (
            <span
              key={card.label}
              aria-hidden
              className={cn(
                "h-1.5 rounded-full transition-all duration-200",
                stillWhenReduced,
                index === activeIndex ? "w-4 bg-primary" : "w-1.5 bg-border",
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
