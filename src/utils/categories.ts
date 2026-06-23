import { CATEGORY_COLORS } from './categoryColors';

export const DEFAULT_CATEGORIES = [
  { name: 'Alimentación', icon: 'cart-outline', color: CATEGORY_COLORS[1] },
  { name: 'Alquiler / Hipoteca', icon: 'home-outline', color: CATEGORY_COLORS[3] },
  { name: 'Servicios', icon: 'flash-outline', color: CATEGORY_COLORS[2] },
  { name: 'Transporte', icon: 'car-outline', color: CATEGORY_COLORS[5] },
  { name: 'Niños', icon: 'happy-outline', color: CATEGORY_COLORS[8] },
  { name: 'Salud', icon: 'medkit-outline', color: CATEGORY_COLORS[0] },
  { name: 'Iglesia / Donaciones', icon: 'heart-outline', color: CATEGORY_COLORS[12] },
  { name: 'Entretenimiento', icon: 'film-outline', color: CATEGORY_COLORS[7] },
  { name: 'Viajes', icon: 'airplane-outline', color: CATEGORY_COLORS[4] },
  { name: 'Otros', icon: 'ellipsis-horizontal-outline', color: CATEGORY_COLORS[11] },
] as const;

export const DEFAULT_CATEGORY_TRANSLATIONS: Record<string, string> = {
  Food: 'Alimentación',
  'Rent / Mortgage': 'Alquiler / Hipoteca',
  Utilities: 'Servicios',
  Transport: 'Transporte',
  Kids: 'Niños',
  Health: 'Salud',
  'Church / Giving': 'Iglesia / Donaciones',
  Entertainment: 'Entretenimiento',
  Travel: 'Viajes',
  Other: 'Otros',
};
