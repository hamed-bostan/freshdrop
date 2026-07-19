"use client";

import * as React from "react";
import Image from "next/image";
import { useLocale } from "next-intl";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import { getLangDir } from "@/src/i18n/direction";
import { cn } from "@/src/lib/utils";
import { stillWhenReduced } from "@/src/presentation/design-system";
import { FavoriteToggle } from "./FavoriteToggle";

interface ProductGalleryProps {
  images: string[];
  productName: string;
  productId: string;
  /** Whether the product is already favorited, resolved server-side per request. */
  initialFavorite: boolean;
}

/**
 * Product-detail image carousel: a green-outlined frame with a Swiper of gallery
 * shots, custom progress dots, and a {@link FavoriteToggle} anchored to the corner.
 */
export function ProductGallery({ images, productName, productId, initialFavorite }: ProductGalleryProps) {
  const locale = useLocale();
  const [activeIndex, setActiveIndex] = React.useState(0);

  return (
    <div className="relative">
      <div className="rounded-card-xl border border-primary p-4">
        <Swiper
          // Match the reading direction so the gallery swipes the natural way under `fa`.
          dir={getLangDir(locale)}
          onSlideChange={(instance: SwiperType) => setActiveIndex(instance.activeIndex)}
          className="w-full"
        >
          {images.map((src, index) => (
            <SwiperSlide key={`${src}-${index}`}>
              <div className="flex items-center justify-center">
                <Image
                  src={src}
                  alt={productName}
                  width={300}
                  height={260}
                  sizes="300px"
                  priority={index === 0}
                  className="h-64 w-auto object-contain"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {images.length > 1 && (
          <div className="mt-3 flex items-center justify-center gap-1.5">
            {images.map((src, index) => (
              <span
                key={`dot-${src}-${index}`}
                aria-hidden
                className={cn(
                  "h-1.5 rounded-full transition-all duration-200",
                  stillWhenReduced,
                  index === activeIndex ? "w-4 bg-primary" : "w-1.5 bg-border",
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* z-10 lifts the heart above Swiper's own `z-index: 1`, which would otherwise
          paint over the button and swallow its clicks where they overlap. */}
      <FavoriteToggle
        productId={productId}
        productName={productName}
        initialFavorite={initialFavorite}
        className="absolute bottom-3 end-3 z-10"
      />
    </div>
  );
}
