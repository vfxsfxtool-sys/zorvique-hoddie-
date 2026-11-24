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
  isSample?: boolean;
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
  isSample?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  order: number;
  visible: boolean;
  isSample?: boolean;
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

export type OrderStatus = 'new' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'verification' | 'paid';
export type CourierName = '' | 'TCS' | 'Leopard' | 'Trax';

export interface OrderItem {
  productId: string;
  name: string;
  size: string;
  colour: string;
  price: number;
  qty: number;
}

export interface Order {
  id: string;
  orderNo: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    city: string;
    address: string;
    postalCode: string;
  };
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  discountCode?: string;
  total: number;
  paymentMethod: 'cod' | 'jazzcash' | 'easypaisa';
  transactionId: string;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  courier: CourierName;
  trackingNo: string;
  createdAt?: unknown;
}

export interface DiscountCode {
  code: string;
  percent: number;
  usageLimit: number;
  usedCount: number;
  expiresAt: string | null;
  active: boolean;
}

export interface Subscriber {
  id: string;
  email: string;
  createdAt?: unknown;
}

export type AdminRole = 'owner' | 'admin' | 'member';

export interface AdminUser {
  email: string;
  role: AdminRole;
  createdAt?: unknown;
}

export interface MediaAsset {
  id: string;
  name: string;
  url: string;
  storagePath: string;
  contentType: string;
  size: number;
  createdAt?: unknown;
}
