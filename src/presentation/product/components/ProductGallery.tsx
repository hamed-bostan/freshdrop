"use client";

import * as React from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import { Heart } from "lucide-react";
import { Button, Icon } from "@/src/presentation/design-system";
import { cn } from "@/src/lib/utils";

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

/**
 * Product-detail image carousel: a green-outlined frame with a Swiper of gallery
 * shots, custom progress dots, and a favorite toggle anchored to the corner.
 * The favorite state is local/UI-only for now (no favorites repository yet).
 */
export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isFavorite, setIsFavorite] = React.useState(false);

  return (
    <div className="relative">
      <div className="rounded-card-xl border border-primary p-4">
        <Swiper
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
                  index === activeIndex ? "w-4 bg-primary" : "w-1.5 bg-border",
                )}
              />
            ))}
          </div>
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        iconOnly
        size="sm"
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        aria-pressed={isFavorite}
        onClick={() => setIsFavorite((value) => !value)}
        className="absolute bottom-3 right-3 bg-background"
      >
        <Icon icon={Heart} size="sm" className={cn("text-primary", isFavorite && "fill-primary")} />
      </Button>
    </div>
  );
}
