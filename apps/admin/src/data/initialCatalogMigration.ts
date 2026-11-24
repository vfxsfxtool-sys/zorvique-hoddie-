import type { Product } from './types';

export interface StudioCollectionSeed {
  id: string;
  name: string;
  slug: string;
  order: number;
  visible: boolean;
  isSample: boolean;
}

export interface StudioProductSeed {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  fabric: string;
  price: number;
  compareAtPrice: number | null;
  badges: string[];
  collectionId: string;
  colourways: { name: string; hex: string; images: string[] }[];
  sizes: { label: string; stock: number }[];
  status: 'published';
  featured: boolean;
  showOnRack: boolean;
  rackOrder: number;
  seoTitle: string;
  seoDescription: string;
  isSample: false;
}

export const STUDIO_ASSET_PRESETS: { id: string; label: string; url: string }[] = [
  { id: 'studio-obsidian-arch', label: 'Obsidian Arch', url: '/assets/rack/rack_obsidian.jpg' },
  { id: 'studio-burnt-amber', label: 'Burnt Amber', url: '/assets/rack/rack_amber.jpg' },
  { id: 'studio-crimson-varsity', label: 'Crimson Studio', url: '/assets/rack/rack_crimson.jpg' },
  { id: 'studio-chalk-ivory', label: 'Chalk Ivory', url: '/assets/rack/rack_ivory.jpg' },
  { id: 'studio-acid-charcoal', label: 'Acid Charcoal', url: '/assets/rack/rack_charcoal.jpg' },
  { id: 'studio-espresso-heavy', label: 'Espresso Studio', url: '/assets/rack/rack_espresso.jpg' },
];

export const STUDIO_COLLECTION_SEED: StudioCollectionSeed = {
  id: 'drop-01',
  name: 'Drop 01 · Atelier Fleece',
  slug: 'drop-01',
  order: 0,
  visible: true,
  isSample: false,
};

export const INITIAL_STUDIO_PRODUCTS: StudioProductSeed[] = [
  {
    id: 'studio-obsidian-arch',
    name: 'Obsidian Arch Hoodie',
    slug: 'obsidian-arch-hoodie',
    sku: 'ZRV-01',
    description:
      'A heavyweight 500 gsm loopback cotton hoodie cut boxy with an architectural double-lined hood that holds its form from shoulder to crown.',
    fabric: '500 gsm organic cotton · Boxy drop-shoulder · Enzyme washed',
    price: 12500,
    compareAtPrice: 14500,
    badges: ['Limited Run'],
    collectionId: 'drop-01',
    colourways: [
      {
        name: 'Obsidian Black',
        hex: '#18181B',
        images: ['/assets/rack/rack_obsidian.jpg'],
      },
    ],
    sizes: [
      { label: 'S', stock: 8 },
      { label: 'M', stock: 12 },
      { label: 'L', stock: 10 },
      { label: 'XL', stock: 6 },
    ],
    status: 'published',
    featured: true,
    showOnRack: true,
    rackOrder: 0,
    seoTitle: 'Obsidian Arch Hoodie — Zorvique',
    seoDescription: "Heavyweight 500 gsm obsidian women's hoodie. Limited batch in Lahore.",
    isSample: false,
  },
  {
    id: 'studio-burnt-amber',
    name: 'Burnt Amber Fleece Hoodie',
    slug: 'burnt-amber-fleece-hoodie',
    sku: 'ZRV-02',
    description:
      'Brushed rust-amber fleece with tonal heavy cord ties and sculpted ribbed cuffs designed for crisp winter evenings across Lahore and Islamabad.',
    fabric: '480 gsm brushed fleece · Pre-shrunk combed cotton · Relaxed fit',
    price: 13200,
    compareAtPrice: null,
    badges: ['No Restocks'],
    collectionId: 'drop-01',
    colourways: [
      {
        name: 'Burnt Amber',
        hex: '#B45309',
        images: ['/assets/rack/rack_amber.jpg'],
      },
    ],
    sizes: [
      { label: 'S', stock: 6 },
      { label: 'M', stock: 9 },
      { label: 'L', stock: 8 },
      { label: 'XL', stock: 4 },
    ],
    status: 'published',
    featured: true,
    showOnRack: true,
    rackOrder: 1,
    seoTitle: 'Burnt Amber Fleece Hoodie — Zorvique',
    seoDescription: 'Burnt amber heavyweight fleece hoodie, small batch run.',
    isSample: false,
  },
  {
    id: 'studio-crimson-varsity',
    name: 'Crimson Studio Zip Hoodie',
    slug: 'crimson-studio-zip-hoodie',
    sku: 'ZRV-03',
    description:
      'Deep burgundy fleece contrasted with ecru rib trim, ecru hood lining, and a heavy-gauge brushed silver two-way zip.',
    fabric: '500 gsm French terry · Contrast ecru rib · Metal two-way zip',
    price: 14800,
    compareAtPrice: 16500,
    badges: ['Signature Piece'],
    collectionId: 'drop-01',
    colourways: [
      {
        name: 'Deep Crimson',
        hex: '#881337',
        images: ['/assets/rack/rack_crimson.jpg'],
      },
    ],
    sizes: [
      { label: 'S', stock: 5 },
      { label: 'M', stock: 7 },
      { label: 'L', stock: 5 },
      { label: 'XL', stock: 3 },
    ],
    status: 'published',
    featured: true,
    showOnRack: true,
    rackOrder: 2,
    seoTitle: 'Crimson Studio Zip Hoodie — Zorvique',
    seoDescription: 'Crimson contrast-rib full-zip heavyweight hoodie.',
    isSample: false,
  },
  {
    id: 'studio-chalk-ivory',
    name: 'Chalk Ivory Drop Hoodie',
    slug: 'chalk-ivory-drop-hoodie',
    sku: 'ZRV-04',
    description:
      'Unbleached raw chalk fleece featuring reverse-seam side panels and an unhurried oversized sleeve fall.',
    fabric: '460 gsm unbleached cotton · Reverse side gussets · Heavy rib',
    price: 12200,
    compareAtPrice: null,
    badges: ['Limited Run'],
    collectionId: 'drop-01',
    colourways: [
      {
        name: 'Chalk Ivory',
        hex: '#E7E5E4',
        images: ['/assets/rack/rack_ivory.jpg'],
      },
    ],
    sizes: [
      { label: 'S', stock: 9 },
      { label: 'M', stock: 11 },
      { label: 'L', stock: 7 },
      { label: 'XL', stock: 5 },
    ],
    status: 'published',
    featured: true,
    showOnRack: true,
    rackOrder: 3,
    seoTitle: 'Chalk Ivory Drop Hoodie — Zorvique',
    seoDescription: "Chalk cream heavyweight oversized women's hoodie.",
    isSample: false,
  },
  {
    id: 'studio-acid-charcoal',
    name: 'Acid Charcoal Full-Zip',
    slug: 'acid-charcoal-full-zip',
    sku: 'ZRV-05',
    description:
      'Mineral stone-washed charcoal fleece finished by hand so every piece carries subtle vintage depth along the seams.',
    fabric: '490 gsm mineral-wash terry · Oxidized zip · Split kangaroo pocket',
    price: 13900,
    compareAtPrice: null,
    badges: ['Numbered Batch'],
    collectionId: 'drop-01',
    colourways: [
      {
        name: 'Washed Charcoal',
        hex: '#3F3F46',
        images: ['/assets/rack/rack_charcoal.jpg'],
      },
    ],
    sizes: [
      { label: 'S', stock: 4 },
      { label: 'M', stock: 8 },
      { label: 'L', stock: 6 },
      { label: 'XL', stock: 4 },
    ],
    status: 'published',
    featured: false,
    showOnRack: true,
    rackOrder: 4,
    seoTitle: 'Acid Charcoal Full-Zip — Zorvique',
    seoDescription: 'Acid-washed charcoal heavyweight full-zip hoodie.',
    isSample: false,
  },
  {
    id: 'studio-espresso-heavy',
    name: 'Espresso Studio Hoodie',
    slug: 'espresso-studio-hoodie',
    sku: 'ZRV-06',
    description:
      'Cordless minimalist neckline in deep roasted espresso fleece. Tailored to drape smoothly without bulk at the waist.',
    fabric: '500 gsm combed fleece · Cordless hood · Reinforced stitchwork',
    price: 12900,
    compareAtPrice: null,
    badges: ['No Restocks'],
    collectionId: 'drop-01',
    colourways: [
      {
        name: 'Espresso Umber',
        hex: '#44332A',
        images: ['/assets/rack/rack_espresso.jpg'],
      },
    ],
    sizes: [
      { label: 'S', stock: 7 },
      { label: 'M', stock: 10 },
      { label: 'L', stock: 8 },
      { label: 'XL', stock: 5 },
    ],
    status: 'published',
    featured: false,
    showOnRack: true,
    rackOrder: 5,
    seoTitle: 'Espresso Studio Hoodie — Zorvique',
    seoDescription: 'Minimal cordless espresso heavyweight fleece hoodie.',
    isSample: false,
  },
];

export function analyzeStudioMigrationState(existingProducts: Product[]): {
  missingSeeds: StudioProductSeed[];
  svgPlaceholderProducts: { existing: Product; seed: StudioProductSeed }[];
} {
  const byId = new Map(existingProducts.map((p) => [p.id, p]));
  const missingSeeds: StudioProductSeed[] = [];
  const svgPlaceholderProducts: { existing: Product; seed: StudioProductSeed }[] = [];

  for (const seed of INITIAL_STUDIO_PRODUCTS) {
    const existing = byId.get(seed.id);
    if (!existing) {
      missingSeeds.push(seed);
      continue;
    }
    const firstImg = existing.colourways[0]?.images?.[0]?.trim() || '';
    if (!firstImg || firstImg.startsWith('data:image/svg+xml')) {
      svgPlaceholderProducts.push({ existing, seed });
    }
  }

  return { missingSeeds, svgPlaceholderProducts };
}
