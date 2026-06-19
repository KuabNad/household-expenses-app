export const DEFAULT_CATEGORIES = [
  { name: 'Alimentación', icon: 'cart-outline', color: '#D28B5C' },
  { name: 'Alquiler / Hipoteca', icon: 'home-outline', color: '#315C4C' },
  { name: 'Servicios', icon: 'flash-outline', color: '#C5A53D' },
  { name: 'Transporte', icon: 'car-outline', color: '#6F8FA6' },
  { name: 'Niños', icon: 'happy-outline', color: '#A16E83' },
  { name: 'Salud', icon: 'medkit-outline', color: '#B85C5C' },
  { name: 'Iglesia / Donaciones', icon: 'heart-outline', color: '#7D9363' },
  { name: 'Entretenimiento', icon: 'film-outline', color: '#7B6FA6' },
  { name: 'Viajes', icon: 'airplane-outline', color: '#4F94A3' },
  { name: 'Otros', icon: 'ellipsis-horizontal-outline', color: '#777E7B' },
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
