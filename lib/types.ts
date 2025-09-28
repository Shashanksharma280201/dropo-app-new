export type Address = {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number;
  longitude: number;
};

export type Palette = {
  primary100: string;
  primary200: string;
  primary300: string;
  primary400: string;
  primary500: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  palette: Palette;
};

export type ProductListItem = {
  id: string;
  slug: string;
  name: string;
  imageUrl: string;
  price: number;
};

export type ProductVariant = {
  id: string;
  name: string;
  price: string;
  isDefault: boolean;
};

export type ProductAddonOption = {
  id: string;
  name: string;
  priceDelta: string;
  isDefault: boolean;
};

export type ProductAddonGroup = {
  id: string;
  name: string;
  selectionType: "SINGLE" | "MULTI";
  minSelect: number;
  maxSelect: number;
  options: ProductAddonOption[];
};

export type ProductSuggestion = {
  id: string;
  slug: string;
  name: string;
  imageUrl: string;
};

export type ProductDetail = {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  nutrition: Record<string, string | number>;
  variants: ProductVariant[];
  addonGroups: ProductAddonGroup[];
  suggestions: ProductSuggestion[];
};

export type CartAddon = {
  id: string;
  name: string;
  priceDelta: number;
  group: { id: string; name: string };
};

export type CartItem = {
  id: string;
  quantity: number;
  notes?: string | null;
  unitPrice: number;
  lineTotal: number;
  product: { id: string; name: string; slug: string; imageUrl: string };
  variant: { id: string; name: string; price: number };
  addons: CartAddon[];
};

export type CartSummary = {
  subtotal: number;
  tax: number;
  deliveryFee: number;
  discount: number;
  total: number;
};

export type CartResponse = {
  items: CartItem[];
  summary: CartSummary;
};

export type OrderLineItem = {
  id: string;
  productName: string;
  variantName: string;
  quantity: number;
  unitPrice: string;
};

export type OrderResponse = {
  id: string;
  status: string;
  total: string;
  paymentStatus: string;
  createdAt: string;
  items: OrderLineItem[];
};

export type ProfileResponse = {
  id: string;
  name: string | null;
  phoneNumber: string;
  defaultAddressId: string | null;
  addresses: Address[];
};
