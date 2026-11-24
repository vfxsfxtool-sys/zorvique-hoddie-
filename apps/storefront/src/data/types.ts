export interface SiteColors {
  primary: string;
  background: string;
  surface: string;
}

export interface NavItem {
  label: string;
  href: string;
}

export interface SocialLinks {
  instagram: string;
  facebook: string;
  tiktok: string;
  whatsapp: string;
}

export interface ShippingConfig {
  flatByCity: Record<string, number>;
  freeThreshold: number;
}

export interface PaymentConfig {
  cod: { enabled: boolean };
  jazzcash: { enabled: boolean; account: string; instructions: string };
  easypaisa: { enabled: boolean; account: string; instructions: string };
}

export interface SeoConfig {
  title: string;
  description: string;
  ogImage: string;
}

export interface SiteSettings {
  brandName: string;
  logoUrl: string;
  colors: SiteColors;
  nav: NavItem[];
  footerLinks: NavItem[];
  social: SocialLinks;
  announcement: string;
  shipping: ShippingConfig;
  payments: PaymentConfig;
  seo: SeoConfig;
}

export interface HomepageSection {
  id: string;
  type: 'hero' | 'collection' | 'craft' | 'testimonials' | 'newsletter';
  visible: boolean;
  order: number;
  title: string;
  body: string;
}

export interface HomepageStat {
  value: string;
  label: string;
}

export interface CraftBlock {
  title: string;
  body: string;
  imageUrl: string;
}

export interface HomepageData {
  heroMode: 'carousel' | 'video';
  heroVideoUrl: string;
  heroPosterUrl: string;
  sections: HomepageSection[];
  stats: HomepageStat[];
  craft: CraftBlock;
}

export interface HeroSlide {
  id: string;
  order: number;
  productId: string;
  colourName: string;
  bgColor: string;
  headline: string;
  body: string;
  ctaLabel: string;
  ctaLink: string;
  imageUrl: string;
  active: boolean;
}

export interface ProductColourway {
  name: string;
  hex: string;
  images: string[];
}

export interface ProductSizeStock {
  label: string;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  fabric: string;
  price: number;
  compareAtPrice?: number | null;
  badges: string[];
  collectionId: string;
  colourways: ProductColourway[];
  sizes: ProductSizeStock[];
  status: 'draft' | 'published';
  featured: boolean;
  showOnRack?: boolean;
  rackOrder?: number;
  seoTitle: string;
  seoDescription: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  order: number;
  visible: boolean;
}

export interface Testimonial {
  id: string;
  name: string;
  city: string;
  rating: number;
  text: string;
  visible: boolean;
  isSample: boolean;
}

export interface CmsPage {
  slug: string;
  title: string;
  body: string;
  visible: boolean;
}

export interface OrderCustomer {
  name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  postalCode: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  size: string;
  colour: string;
  price: number;
  qty: number;
}

export type PaymentMethod = 'cod' | 'jazzcash' | 'easypaisa';

export interface Order {
  id?: string;
  orderNo: string;
  customer: OrderCustomer;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  discountCode?: string;
  total: number;
  paymentMethod: PaymentMethod;
  transactionId: string;
  paymentStatus: 'pending' | 'verification';
  status: 'new';
  courier: '';
  trackingNo: '';
  createdAt?: unknown;
}

export type OrderTrackingStatus = 'new' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderTrackingItemSummary {
  name: string;
  size: string;
  colour: string;
  qty: number;
}

export interface OrderTrackingRecord {
  orderNo: string;
  orderId: string;
  city: string;
  itemCount: number;
  itemSummary: OrderTrackingItemSummary[];
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'pending' | 'verification' | 'paid';
  status: OrderTrackingStatus;
  courier: '' | 'TCS' | 'Leopard' | 'Trax';
  trackingNo: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface DiscountCode {
  code: string;
  percent: number;
  usageLimit: number;
  usedCount: number;
  expiresAt: string | null;
  active: boolean;
}

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice?: number | null;
  size: string;
  colour: string;
  colourHex: string;
  imageUrl: string;
  qty: number;
  maxStock: number;
}

export type ReviewFitFeedback = '' | 'runs-small' | 'true-to-size' | 'oversized-drape';

export interface ProductReview {
  id: string;
  productId: string;
  productSlug: string;
  authorUid: string;
  authorName: string;
  city: string;
  rating: number;
  title: string;
  comment: string;
  fitFeedback: ReviewFitFeedback;
  createdAt?: unknown;
  updatedAt?: unknown;
}

