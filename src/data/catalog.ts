export type SheetView = 'side' | 'front' | 'back';
export type SizeOption = 'S' | 'M' | 'L' | 'XL';

export interface CropRect {
  y: number;
  h: number;
  hookX: number;
}

export interface GarmentSpec {
  k: number;
  name: string;
  price: number;
  fabricNote: string;
  crops: Record<SheetView, CropRect>;
}

export const SIZES: SizeOption[] = ['S', 'M', 'L', 'XL'];

const RAW_SHEET_URLS: Record<SheetView, string> = {
  side: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261113_115504_3ab92758-5854-4a1c-85db-ff8efd929e86.png',
  front: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261113_115743_54dc8c72-0be0-4858-bd0c-10ecb399c16c.png',
  back: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261113_115613_7d45aea6-1bea-41ff-b878-72d7c8bcb9da.png',
};

export const SHEET_URLS: Record<SheetView, string> = {
  side: `https://images.higgs.ai/?default=1&output=webp&url=${encodeURIComponent(RAW_SHEET_URLS.side)}&w=1360&q=85`,
  front: `https://images.higgs.ai/?default=1&output=webp&url=${encodeURIComponent(RAW_SHEET_URLS.front)}&w=1360&q=85`,
  back: `https://images.higgs.ai/?default=1&output=webp&url=${encodeURIComponent(RAW_SHEET_URLS.back)}&w=1360&q=85`,
};

export const GARMENTS: GarmentSpec[] = [
  {
    k: 0,
    name: 'Noir Tailored Blazer',
    price: 690,
    fabricNote: '100% virgin Italian barathea wool with horn buttons and cupro lining. Tailored to order in Milan.',
    crops: {
      side: { y: 44, h: 619, hookX: 185 },
      front: { y: 79, h: 552, hookX: 175 },
      back: { y: 76, h: 515, hookX: 176 },
    },
  },
  {
    k: 1,
    name: 'Ivory Belted Trench',
    price: 690,
    fabricNote: 'Double-faced bonded cotton gabardine with tonal horn buckle and storm flap. Tailored to order.',
    crops: {
      side: { y: 45, h: 860, hookX: 514 },
      front: { y: 76, h: 900, hookX: 511 },
      back: { y: 60, h: 890, hookX: 508 },
    },
  },
  {
    k: 2,
    name: 'Oxblood Silk Slip',
    price: 690,
    fabricNote: '19-momme bias-cut Como mulberry silk charmeuse with delicate rouleau straps.',
    crops: {
      side: { y: 45, h: 876, hookX: 834 },
      front: { y: 76, h: 913, hookX: 848 },
      back: { y: 60, h: 901, hookX: 845 },
    },
  },
  {
    k: 3,
    name: 'Taupe Wool Blazer',
    price: 690,
    fabricNote: 'Brushed merino twill single-breasted silhouette with soft architectural shoulders.',
    crops: {
      side: { y: 45, h: 606, hookX: 1169 },
      front: { y: 80, h: 550, hookX: 1179 },
      back: { y: 76, h: 520, hookX: 1180 },
    },
  },
  {
    k: 4,
    name: 'Champagne Bias Slip',
    price: 690,
    fabricNote: 'Lustrous champagne silk satin cut on a true 45-degree bias for fluid drape.',
    crops: {
      side: { y: 1024, h: 937, hookX: 177 },
      front: { y: 1024, h: 936, hookX: 177 },
      back: { y: 1026, h: 931, hookX: 175 },
    },
  },
  {
    k: 5,
    name: 'Pearl Silk Slip',
    price: 690,
    fabricNote: 'Heavyweight pearl mulberry silk crepe de chine with French-seamed hem.',
    crops: {
      side: { y: 1024, h: 936, hookX: 511 },
      front: { y: 1024, h: 940, hookX: 513 },
      back: { y: 1026, h: 929, hookX: 508 },
    },
  },
  {
    k: 6,
    name: 'Taupe Belted Trench',
    price: 690,
    fabricNote: 'Water-repellent Italian cotton-silk gabardine with elongated raglan sleeve.',
    crops: {
      side: { y: 1024, h: 907, hookX: 825 },
      front: { y: 1024, h: 894, hookX: 851 },
      back: { y: 1024, h: 901, hookX: 845 },
    },
  },
  {
    k: 7,
    name: 'Oxblood Satin Gown',
    price: 690,
    fabricNote: 'Floor-grazing duchesse silk satin gown with pleated fullness and invisible side zip.',
    crops: {
      side: { y: 1024, h: 962, hookX: 1166 },
      front: { y: 1024, h: 938, hookX: 1185 },
      back: { y: 1024, h: 934, hookX: 1184 },
    },
  },
];

export const RAIL_SEQUENCE: number[] = [
  0, 1, 2, 3, 4, 0, 5, 6, 7, 0, 4, 1, 2, 3, 5, 6, 7, 1, 4, 3,
];

export const TAG_ANGLES: number[] = [-5, 4, -3, 6, -4, 3, -6, 4, -3, 5];

export interface CartItem {
  id: string;
  k: number;
  size: SizeOption;
  qty: number;
  isNew?: boolean;
}

export const INITIAL_CART: CartItem[] = [
  { id: 'init-1', k: 3, size: 'M', qty: 1 },
  { id: 'init-2', k: 4, size: 'S', qty: 1 },
  { id: 'init-3', k: 1, size: 'M', qty: 1 },
];

export function formatMoney(amount: number): string {
  return `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function getCropStyle(k: number, view: SheetView, scale: number): React.CSSProperties {
  const { y, h, hookX } = GARMENTS[k].crops[view];
  return {
    width: `${340 * scale}px`,
    height: `${(h + 6) * scale}px`,
    left: `${-170 * scale}px`,
    top: '0px',
    backgroundImage: `url("${SHEET_URLS[view]}")`,
    backgroundSize: `${1360 * scale}px auto`,
    backgroundPosition: `${-(hookX - 170) * scale}px ${-y * scale}px`,
    backgroundRepeat: 'no-repeat',
  };
}
