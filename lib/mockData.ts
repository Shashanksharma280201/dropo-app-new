import { COLORS } from "@/constants/Colors";
import type {
  CartResponse,
  Category,
  OrderResponse,
  ProductDetail,
  ProductListItem,
  ProfileResponse,
} from "@/lib/types";

const mockCategories: Category[] = [
  {
    id: "coffee",
    name: "Coffee",
    slug: "coffee",
    palette: {
      primary100: COLORS.primary100,
      primary200: COLORS.primary200,
      primary300: COLORS.primary300,
      primary400: COLORS.primary400,
      primary500: COLORS.primary500,
    },
  },
  {
    id: "tea",
    name: "Tea",
    slug: "tea",
    palette: {
      primary100: "#F3F2FF",
      primary200: "#D6D3FF",
      primary300: "#A59BFF",
      primary400: "#6C63FF",
      primary500: "#4B41CC",
    },
  },
  {
    id: "snacks",
    name: "Snacks",
    slug: "snacks",
    palette: {
      primary100: "#FFF4E6",
      primary200: "#FFD9A8",
      primary300: "#FFB347",
      primary400: "#FF8F1F",
      primary500: "#C86A00",
    },
  },
];

const mockProductsByCategory: Record<string, ProductListItem[]> = {
  coffee: [
    {
      id: "prod-cappuccino",
      slug: "classic-cappuccino",
      name: "Classic Cappuccino",
      imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=640&q=80",
      price: 210,
    },
    {
      id: "prod-iced-latte",
      slug: "iced-vanilla-latte",
      name: "Iced Vanilla Latte",
      imageUrl: "https://images.unsplash.com/photo-1527169402691-feff5539e52c?auto=format&fit=crop&w=640&q=80",
      price: 230,
    },
  ],
  tea: [
    {
      id: "prod-herbal-tea",
      slug: "herbal-green-tea",
      name: "Herbal Green Tea",
      imageUrl: "https://images.unsplash.com/photo-1502741126161-b048400d2045?auto=format&fit=crop&w=640&q=80",
      price: 140,
    },
    {
      id: "prod-masala-chai",
      slug: "masala-chai",
      name: "Masala Chai",
      imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=640&q=80",
      price: 120,
    },
  ],
  snacks: [
    {
      id: "prod-veggie-sandwich",
      slug: "veggie-sandwich",
      name: "Veggie Sandwich",
      imageUrl: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=640&q=80",
      price: 190,
    },
    {
      id: "prod-croissant",
      slug: "almond-croissant",
      name: "Almond Croissant",
      imageUrl: "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=640&q=80",
      price: 160,
    },
  ],
};

const mockProductDetails: Record<string, ProductDetail> = {
  "classic-cappuccino": {
    id: "prod-cappuccino",
    name: "Classic Cappuccino",
    slug: "classic-cappuccino",
    description: "Velvety espresso topped with steamed milk and a touch of cocoa.",
    imageUrl: mockProductsByCategory.coffee[0].imageUrl,
    nutrition: { calories: 180, caffeine: "150mg" },
    variants: [
      { id: "var-cap-small", name: "Small", price: "190", isDefault: false },
      { id: "var-cap-regular", name: "Regular", price: "210", isDefault: true },
      { id: "var-cap-large", name: "Large", price: "240", isDefault: false },
    ],
    addonGroups: [
      {
        id: "milk-choice",
        name: "Milk choice",
        selectionType: "SINGLE",
        minSelect: 0,
        maxSelect: 1,
        options: [
          { id: "milk-whole", name: "Whole milk", priceDelta: "0", isDefault: true },
          { id: "milk-oat", name: "Oat milk", priceDelta: "20", isDefault: false },
          { id: "milk-almond", name: "Almond milk", priceDelta: "25", isDefault: false },
        ],
      },
      {
        id: "extras",
        name: "Extras",
        selectionType: "MULTI",
        minSelect: 0,
        maxSelect: 3,
        options: [
          { id: "extra-shot", name: "Extra espresso shot", priceDelta: "30", isDefault: false },
          { id: "vanilla-syrup", name: "Vanilla syrup", priceDelta: "20", isDefault: false },
          { id: "cocoa-dust", name: "Cocoa dust", priceDelta: "0", isDefault: true },
        ],
      },
    ],
    suggestions: [
      {
        id: mockProductsByCategory.coffee[1].id,
        slug: mockProductsByCategory.coffee[1].slug,
        name: mockProductsByCategory.coffee[1].name,
        imageUrl: mockProductsByCategory.coffee[1].imageUrl,
      },
      {
        id: mockProductsByCategory.snacks[0].id,
        slug: mockProductsByCategory.snacks[0].slug,
        name: mockProductsByCategory.snacks[0].name,
        imageUrl: mockProductsByCategory.snacks[0].imageUrl,
      },
    ],
  },
  "iced-vanilla-latte": {
    id: "prod-iced-latte",
    name: "Iced Vanilla Latte",
    slug: "iced-vanilla-latte",
    description: "Chilled espresso with vanilla syrup and silky milk over ice.",
    imageUrl: mockProductsByCategory.coffee[1].imageUrl,
    nutrition: { calories: 160, sugar: "18g" },
    variants: [
      { id: "var-iced-regular", name: "Regular", price: "230", isDefault: true },
      { id: "var-iced-large", name: "Large", price: "260", isDefault: false },
    ],
    addonGroups: [
      {
        id: "sweetness",
        name: "Sweetness",
        selectionType: "SINGLE",
        minSelect: 0,
        maxSelect: 1,
        options: [
          { id: "sweet-regular", name: "Regular", priceDelta: "0", isDefault: true },
          { id: "sweet-light", name: "Light", priceDelta: "0", isDefault: false },
          { id: "sweet-extra", name: "Extra", priceDelta: "0", isDefault: false },
        ],
      },
    ],
    suggestions: [
      {
        id: mockProductsByCategory.snacks[1].id,
        slug: mockProductsByCategory.snacks[1].slug,
        name: mockProductsByCategory.snacks[1].name,
        imageUrl: mockProductsByCategory.snacks[1].imageUrl,
      },
      {
        id: mockProductsByCategory.tea[0].id,
        slug: mockProductsByCategory.tea[0].slug,
        name: mockProductsByCategory.tea[0].name,
        imageUrl: mockProductsByCategory.tea[0].imageUrl,
      },
    ],
  },
  "herbal-green-tea": {
    id: "prod-herbal-tea",
    name: "Herbal Green Tea",
    slug: "herbal-green-tea",
    description: "Soothing blend of steamed green tea leaves with mint and lemongrass.",
    imageUrl: mockProductsByCategory.tea[0].imageUrl,
    nutrition: { calories: 15, caffeine: "60mg" },
    variants: [
      { id: "var-tea-classic", name: "Classic", price: "140", isDefault: true },
      { id: "var-tea-honey", name: "With honey", price: "160", isDefault: false },
    ],
    addonGroups: [
      {
        id: "sweetener",
        name: "Sweetener",
        selectionType: "SINGLE",
        minSelect: 0,
        maxSelect: 1,
        options: [
          { id: "sweetener-none", name: "None", priceDelta: "0", isDefault: true },
          { id: "sweetener-honey", name: "Honey", priceDelta: "15", isDefault: false },
          { id: "sweetener-jaggery", name: "Jaggery", priceDelta: "10", isDefault: false },
        ],
      },
    ],
    suggestions: [
      {
        id: mockProductsByCategory.snacks[0].id,
        slug: mockProductsByCategory.snacks[0].slug,
        name: mockProductsByCategory.snacks[0].name,
        imageUrl: mockProductsByCategory.snacks[0].imageUrl,
      },
      {
        id: mockProductsByCategory.coffee[0].id,
        slug: mockProductsByCategory.coffee[0].slug,
        name: mockProductsByCategory.coffee[0].name,
        imageUrl: mockProductsByCategory.coffee[0].imageUrl,
      },
    ],
  },
  "masala-chai": {
    id: "prod-masala-chai",
    name: "Masala Chai",
    slug: "masala-chai",
    description: "Bold Assam tea simmered with ginger, cardamom, and warm spices.",
    imageUrl: mockProductsByCategory.tea[1].imageUrl,
    nutrition: { calories: 130, caffeine: "80mg" },
    variants: [
      { id: "var-chai-regular", name: "Regular", price: "120", isDefault: true },
      { id: "var-chai-strong", name: "Kadak", price: "130", isDefault: false },
    ],
    addonGroups: [],
    suggestions: [
      {
        id: mockProductsByCategory.snacks[1].id,
        slug: mockProductsByCategory.snacks[1].slug,
        name: mockProductsByCategory.snacks[1].name,
        imageUrl: mockProductsByCategory.snacks[1].imageUrl,
      },
    ],
  },
  "veggie-sandwich": {
    id: "prod-veggie-sandwich",
    name: "Veggie Sandwich",
    slug: "veggie-sandwich",
    description: "Wholegrain bread layered with roasted veggies and basil pesto.",
    imageUrl: mockProductsByCategory.snacks[0].imageUrl,
    nutrition: { calories: 320, protein: "12g" },
    variants: [
      { id: "var-sandwich-regular", name: "Regular", price: "190", isDefault: true },
      { id: "var-sandwich-cheese", name: "With cheese", price: "220", isDefault: false },
    ],
    addonGroups: [
      {
        id: "bread",
        name: "Bread",
        selectionType: "SINGLE",
        minSelect: 1,
        maxSelect: 1,
        options: [
          { id: "bread-multigrain", name: "Multigrain", priceDelta: "0", isDefault: true },
          { id: "bread-sourdough", name: "Sourdough", priceDelta: "15", isDefault: false },
        ],
      },
    ],
    suggestions: [
      {
        id: mockProductsByCategory.coffee[1].id,
        slug: mockProductsByCategory.coffee[1].slug,
        name: mockProductsByCategory.coffee[1].name,
        imageUrl: mockProductsByCategory.coffee[1].imageUrl,
      },
      {
        id: mockProductsByCategory.tea[0].id,
        slug: mockProductsByCategory.tea[0].slug,
        name: mockProductsByCategory.tea[0].name,
        imageUrl: mockProductsByCategory.tea[0].imageUrl,
      },
    ],
  },
  "almond-croissant": {
    id: "prod-croissant",
    name: "Almond Croissant",
    slug: "almond-croissant",
    description: "Buttery croissant filled with almond frangipane and toasted flakes.",
    imageUrl: mockProductsByCategory.snacks[1].imageUrl,
    nutrition: { calories: 250, sugar: "14g" },
    variants: [
      { id: "var-croissant-regular", name: "Regular", price: "160", isDefault: true },
      { id: "var-croissant-warm", name: "Warmed", price: "170", isDefault: false },
    ],
    addonGroups: [],
    suggestions: [
      {
        id: mockProductsByCategory.coffee[0].id,
        slug: mockProductsByCategory.coffee[0].slug,
        name: mockProductsByCategory.coffee[0].name,
        imageUrl: mockProductsByCategory.coffee[0].imageUrl,
      },
    ],
  },
};

const mockCart: CartResponse = {
  items: [
    {
      id: "cart-line-1",
      quantity: 1,
      unitPrice: 230,
      lineTotal: 230,
      product: {
        id: mockProductsByCategory.coffee[0].id,
        name: mockProductsByCategory.coffee[0].name,
        slug: mockProductsByCategory.coffee[0].slug,
        imageUrl: mockProductsByCategory.coffee[0].imageUrl,
      },
      variant: { id: "var-cap-regular", name: "Regular", price: 210 },
      addons: [
        {
          id: "milk-oat",
          name: "Oat milk",
          priceDelta: 20,
          group: { id: "milk-choice", name: "Milk choice" },
        },
      ],
      notes: null,
    },
  ],
  summary: {
    subtotal: 230,
    tax: 12,
    deliveryFee: 20,
    discount: 0,
    total: 262,
  },
};

const mockOrders: OrderResponse[] = [
  {
    id: "ord-202501",
    status: "Delivered",
    total: "420",
    paymentStatus: "PAID",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    items: [
      {
        id: "ord-202501-line1",
        productName: mockProductsByCategory.coffee[0].name,
        variantName: "Regular",
        quantity: 1,
        unitPrice: "210",
      },
      {
        id: "ord-202501-line2",
        productName: mockProductsByCategory.snacks[0].name,
        variantName: "With cheese",
        quantity: 1,
        unitPrice: "210",
      },
    ],
  },
  {
    id: "ord-202499",
    status: "Preparing",
    total: "230",
    paymentStatus: "COD",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    items: [
      {
        id: "ord-202499-line1",
        productName: mockProductsByCategory.tea[0].name,
        variantName: "With honey",
        quantity: 1,
        unitPrice: "160",
      },
      {
        id: "ord-202499-line2",
        productName: mockProductsByCategory.coffee[1].name,
        variantName: "Regular",
        quantity: 1,
        unitPrice: "230",
      },
    ],
  },
];

const mockProfile: ProfileResponse = {
  id: "user-demo",
  name: null,
  phoneNumber: "+91 98765 43210",
  defaultAddressId: "addr-home",
  addresses: [
    {
      id: "addr-home",
      label: "Home",
      line1: "221B Baker Street",
      line2: "Flat 2",
      city: "London",
      state: "London",
      postalCode: "NW16XE",
      latitude: 0,
      longitude: 0,
    },
    {
      id: "addr-office",
      label: "Office",
      line1: "15 Fleet Street",
      city: "London",
      state: "London",
      postalCode: "EC4Y 1AA",
      latitude: 0,
      longitude: 0,
    },
  ],
};

const clone = <T,>(data: T): T => JSON.parse(JSON.stringify(data));

export const getMockCategories = () => clone(mockCategories);

export const getMockProducts = (categorySlug?: string) => {
  if (!categorySlug) {
    return clone(Object.values(mockProductsByCategory).flat());
  }
  return clone(mockProductsByCategory[categorySlug] ?? []);
};

export const getMockProductDetail = (slug: string) => {
  const product = mockProductDetails[slug];
  return product ? clone(product) : null;
};

export const getMockCart = () => clone(mockCart);

export const getMockOrders = () => clone(mockOrders);

export const getMockProfile = () => clone(mockProfile);
