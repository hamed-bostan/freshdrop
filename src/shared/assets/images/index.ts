
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

// Next types `*.svg` imports as `any` (to stay compatible with the `@svgr/webpack`
// plugin nobody uses here) — cast once at this boundary so the `any` never leaks
// into consumers.
export const facebookIcon = facebookIconSrc as StaticImageData;
export const XIcon = xIconSrc as StaticImageData;
export const linkedinIcon = linkedinIconSrc as StaticImageData;

export const paypalIcon = paypalIconSrc as StaticImageData;
export const applePayIcon = applePayIconSrc as StaticImageData;
export const googlePayIcon = googlePayIconSrc as StaticImageData;
