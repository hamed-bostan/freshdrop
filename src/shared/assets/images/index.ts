
import applePayIconSrc from "@/public/images/apple.svg";
import facebookIconSrc from "@/public/images/facebook.svg";
import googlePayIconSrc from "@/public/images/google.svg";
import linkedinIconSrc from "@/public/images/linkedin.svg";
import paypalIconSrc from "@/public/images/paypal.svg";
import xIconSrc from "@/public/images/x.svg";

import type { StaticImageData } from "next/image";

export { default as heroBanner } from "@/public/images/hero-banner.png";
export { default as aboutFreshDrop } from "@/public/images/about-freshdrop.png";
export { default as favoriteList } from "@/public/images/favorite-list.png";
export { default as emptyOrder } from "@/public/images/empty-order.png";
export { default as emptyCart } from "@/public/images/empty-cart.png";
export { default as orderConfirmed } from "@/public/images/order-confirmed.png";
export { default as addMoney } from "@/public/images/add-money.png";
export { default as onboarding1 } from "@/public/images/onboarding-1.png";
export { default as onboarding2 } from "@/public/images/onboarding-2.png";
export { default as onboarding3 } from "@/public/images/onboarding-3.png";
export { default as onboarding4 } from "@/public/images/onboarding-4.png";

// Next's generated declarations type SVG imports as `any`, while our fresh-CI
// declarations use StaticImageData. Normalize through unknown so this boundary
// stays typed in both environments without redundant assertions at each export.
function staticImage(source: unknown): StaticImageData {
  return source as StaticImageData;
}

export const facebookIcon = staticImage(facebookIconSrc);
export const XIcon = staticImage(xIconSrc);
export const linkedinIcon = staticImage(linkedinIconSrc);

export const paypalIcon = staticImage(paypalIconSrc);
export const applePayIcon = staticImage(applePayIconSrc);
export const googlePayIcon = staticImage(googlePayIconSrc);
