'use client';

import {
  Building2,
  Car,
  Home,
  Hotel,
  Landmark,
  MapPin,
  MapPinned,
  Music,
  Ship,
  ShoppingBag,
  Sparkles,
  Stethoscope,
  Trees,
  UtensilsCrossed,
} from 'lucide-react';

const STROKE = 1.65;

const LISTING_BY_TYPE = {
  hotel: Hotel,
  villa: Home,
  clinic: Stethoscope,
  transfer: Car,
  car: Car,
  tour: MapPinned,
  restaurant: UtensilsCrossed,
  boat: Ship,
};

/** Listing kartı / plan satırı — `type` alanına göre stroke ikon */
export function ListingTypeGlyph({ type, size = 22, color = 'var(--ta-sea)', style, ...rest }) {
  const Icon = LISTING_BY_TYPE[type] || Hotel;
  return <Icon size={size} strokeWidth={STROKE} color={color} style={style} aria-hidden {...rest} />;
}

const PLACE_BY_CATEGORY = {
  Restoran: UtensilsCrossed,
  Konaklama: Hotel,
  Müze: Landmark,
  Doğa: Trees,
  İbadet: Building2,
  Alışveriş: ShoppingBag,
  'Gece Hayatı': Music,
  Sağlık: Stethoscope,
  'Gezilecek Yer': MapPin,
};

/** Kayıtlı mekan / places API — Türkçe `category` */
export function PlaceCategoryGlyph({ category, size = 14, color = 'var(--ta-accent)', ...rest }) {
  const Icon = PLACE_BY_CATEGORY[category] || MapPin;
  return <Icon size={size} strokeWidth={STROKE} color={color} aria-hidden {...rest} />;
}

const BUDGET_BY_KEY = {
  accommodation: Hotel,
  transport: Car,
  activities: MapPinned,
  extras: Sparkles,
};

/** Bütçe satırı — `accommodation` | `transport` | `activities` | `extras` */
export function BudgetCategoryGlyph({ catKey, size = 16, color = 'var(--ta-sea)', ...rest }) {
  const Icon = BUDGET_BY_KEY[catKey] || MapPinned;
  return <Icon size={size} strokeWidth={STROKE} color={color} aria-hidden {...rest} />;
}
