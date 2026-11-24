import type { Order, OrderTrackingRecord, OrderTrackingStatus } from '../data/types';

export interface OrderTimelineStep {
  key: 'new' | 'confirmed' | 'shipped' | 'delivered';
  label: string;
  description: string;
  state: 'completed' | 'current' | 'upcoming' | 'cancelled';
}

export interface OrderTrackingStepModel {
  statusLabel: string;
  statusSummary: string;
  isCancelled: boolean;
  steps: OrderTimelineStep[];
}

const VALID_TRACKING_ID_RE = /^[a-zA-Z0-9_-]{3,40}$/;

export function normalizeOrderLookupId(raw: string): {
  valid: boolean;
  normalized: string;
  error?: string;
} {
  const cleaned = raw.trim().replace(/^#+/, '').trim();
  if (!cleaned) {
    return { valid: false, normalized: '', error: 'Enter your Order ID (e.g. ZRV-48129304).' };
  }
  const normalized = cleaned.startsWith('ord_') ? cleaned : cleaned.toUpperCase();
  if (!VALID_TRACKING_ID_RE.test(normalized)) {
    return {
      valid: false,
      normalized,
      error: 'Order IDs use letters, numbers, hyphens, or underscores (e.g. ZRV-48129304).',
    };
  }
  return { valid: true, normalized };
}

export function buildTrackingRecordFromOrder(
  order: Pick<
    Order,
    | 'id'
    | 'orderNo'
    | 'customer'
    | 'items'
    | 'total'
    | 'paymentMethod'
    | 'paymentStatus'
    | 'status'
    | 'courier'
    | 'trackingNo'
    | 'createdAt'
  >
): OrderTrackingRecord {
  const itemSummary = order.items.slice(0, 30).map((item) => ({
    name: item.name,
    size: item.size,
    colour: item.colour,
    qty: item.qty,
  }));
  const itemCount = itemSummary.reduce((sum, item) => sum + Math.max(1, item.qty), 0);

  return {
    orderNo: order.orderNo,
    orderId: order.id || '',
    city: order.customer.city,
    itemCount,
    itemSummary,
    total: order.total,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    status: order.status,
    courier: order.courier,
    trackingNo: order.trackingNo,
    createdAt: order.createdAt,
    updatedAt: order.createdAt,
  };
}

export function buildOrderTrackingStepModel(
  status: OrderTrackingStatus,
  courier: string,
  trackingNo: string
): OrderTrackingStepModel {
  const baseSteps: { key: OrderTimelineStep['key']; label: string; description: string }[] = [
    {
      key: 'new',
      label: 'Order Received',
      description: 'Logged in our Lahore studio queue for verification.',
    },
    {
      key: 'confirmed',
      label: 'Confirmed & Packed',
      description: 'Quality-checked, steamed, and reserved for dispatch.',
    },
    {
      key: 'shipped',
      label: 'Dispatched',
      description: courier
        ? `Handed to ${courier}${trackingNo ? ` (AWB: ${trackingNo})` : ''}.`
        : 'Assigned to Pakistan express courier.',
    },
    {
      key: 'delivered',
      label: 'Delivered',
      description: 'Completed delivery at your destination city.',
    },
  ];

  if (status === 'cancelled') {
    return {
      statusLabel: 'Cancelled',
      statusSummary: 'This order was cancelled and will not be dispatched.',
      isCancelled: true,
      steps: baseSteps.map((s) => ({ ...s, state: 'cancelled' })),
    };
  }

  const orderOrder: OrderTimelineStep['key'][] = ['new', 'confirmed', 'shipped', 'delivered'];
  const activeIdx = Math.max(0, orderOrder.indexOf(status));

  const statusMeta: Record<OrderTimelineStep['key'], { label: string; summary: string }> = {
    new: {
      label: 'Order Received',
      summary: 'Your order is in our Lahore atelier queue awaiting confirmation.',
    },
    confirmed: {
      label: 'Confirmed & Packing',
      summary: 'Your order is confirmed and being prepared for dispatch.',
    },
    shipped: {
      label: 'In Transit',
      summary: courier
        ? `Shipped via ${courier}${trackingNo ? ` · Tracking #${trackingNo}` : ''}.`
        : 'Dispatched for nationwide delivery across Pakistan.',
    },
    delivered: {
      label: 'Delivered',
      summary: 'Delivered. Thank you for wearing Zorvique.',
    },
  };

  return {
    statusLabel: statusMeta[orderOrder[activeIdx]].label,
    statusSummary: statusMeta[orderOrder[activeIdx]].summary,
    isCancelled: false,
    steps: baseSteps.map((step, idx) => ({
      ...step,
      state: idx < activeIdx ? 'completed' : idx === activeIdx ? 'current' : 'upcoming',
    })),
  };
}

export function formatOrderTimestamp(ts: unknown): string {
  if (!ts) return 'Just now';
  let date: Date | null = null;
  if (typeof ts === 'string' || typeof ts === 'number') {
    const parsed = new Date(ts);
    if (!Number.isNaN(parsed.getTime())) date = parsed;
  } else if (typeof (ts as { seconds?: number })?.seconds === 'number') {
    date = new Date((ts as { seconds: number }).seconds * 1000);
  }
  if (!date) return 'Just now';
  return date.toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
