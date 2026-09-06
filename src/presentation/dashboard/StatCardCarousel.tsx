"use client";

import { useLocale } from "next-intl";
import * as React from "react";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import { getLangDir } from "@/src/i18n/direction";
import { cn } from "@/src/lib/utils";
import { stillWhenReduced } from "@/src/presentation/design-system";

import type { Swiper as SwiperType } from "swiper";

type StatCardCarouselProps = {
  /**
   * One `StatCard` element per KPI, rendered by the (server) caller and passed
   * in as children — not raw props. `StatCard`'s `icon` prop is a Lucide
   * component, and Next only allows passing already-rendered elements, not
   * component references, from a Server Component across into a Client
   * Component's props.
   */
  children: React.ReactNode;
  /** Localized names enable keyboard-operable pagination for linked metrics. */
  slideLabels?: string[];
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
export function StatCardCarousel({ children, slideLabels }: StatCardCarouselProps) {
  const locale = useLocale();
  const [activeIndex, setActiveIndex] = React.useState(0);
  const cards = React.Children.toArray(children);
  const swiper = React.useRef<SwiperType | null>(null);

  return (
    <div>
      <Swiper
        dir={getLangDir(locale)}
        slidesPerView={1}
        onSwiper={(instance) => { swiper.current = instance; }}
        onSlideChange={(instance: SwiperType) => setActiveIndex(instance.activeIndex)}
        className="w-full"
      >
        {cards.map((card, index) => (
          <SwiperSlide key={index} inert={slideLabels && index !== activeIndex ? true : undefined}>{card}</SwiperSlide>
        ))}
      </Swiper>

      {cards.length > 1 ? (
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {cards.map((_, index) => slideLabels ? (
            <button
              key={index}
              type="button"
              aria-label={slideLabels[index]}
              aria-current={index === activeIndex ? "true" : undefined}
              className={cn(
                "h-1.5 shrink-0 rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                stillWhenReduced,
                index === activeIndex ? "w-4 bg-primary" : "w-1.5 bg-border",
              )}
              onClick={() => swiper.current?.slideTo(index, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 300)}
            />
          ) : (
            <span
              key={index}
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
