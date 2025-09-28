import { Prisma, PrismaClient, SelectionType } from '@prisma/client';

const prisma = new PrismaClient();

const toDecimal = (value: number) => new Prisma.Decimal(value.toFixed(2));

const categorySeeds = [
  {
    name: 'Coffee',
    slug: 'coffee',
    description: 'Signature hot and cold coffees brewed fresh.',
    heroImageUrl: 'https://assets.dropo.dev/coffee/hero.png',
    palette: {
      primary100: '#ECE0D1',
      primary200: '#DBC1AC',
      primary300: '#967259',
      primary400: '#634832',
      primary500: '#38220F',
    },
    products: [
      {
        name: 'Classic Espresso',
        slug: 'classic-espresso',
        imageUrl: 'https://assets.dropo.dev/coffee/classic-espresso.png',
        description:
          'A rich and aromatic espresso shot pulled from freshly ground beans.',
        nutrition: {
          kcal: 60,
          protein: 1,
          carbs: 5,
          fat: 3,
        },
        isRecommended: true,
        variants: [
          { name: 'Single Shot', price: 160, isDefault: true },
          { name: 'Double Shot', price: 220 },
        ],
      },
      {
        name: 'Silky Cappuccino',
        slug: 'silky-cappuccino',
        imageUrl: 'https://assets.dropo.dev/coffee/silky-cappuccino.png',
        description: 'Velvety steamed milk over a bold espresso base.',
        nutrition: {
          kcal: 185,
          protein: 8,
          carbs: 17,
          fat: 7,
        },
        isRecommended: true,
        variants: [
          { name: 'Regular', price: 220, isDefault: true },
          { name: 'Large', price: 260 },
        ],
      },
      {
        name: 'Vanilla Latte',
        slug: 'vanilla-latte',
        imageUrl: 'https://assets.dropo.dev/coffee/vanilla-latte.png',
        description: 'Creamy latte infused with Madagascar vanilla.',
        nutrition: {
          kcal: 240,
          protein: 9,
          carbs: 24,
          fat: 9,
        },
        variants: [
          { name: 'Regular', price: 240, isDefault: true },
          { name: 'Large', price: 280 },
        ],
      },
      {
        name: 'Hazelnut Mocha',
        slug: 'hazelnut-mocha',
        imageUrl: 'https://assets.dropo.dev/coffee/hazelnut-mocha.png',
        description: 'Chocolatey mocha blended with roasted hazelnut syrup.',
        nutrition: {
          kcal: 320,
          protein: 8,
          carbs: 34,
          fat: 12,
        },
        variants: [
          { name: 'Regular', price: 260, isDefault: true },
          { name: 'Large', price: 310 },
        ],
      },
      {
        name: 'Americano',
        slug: 'americano',
        imageUrl: 'https://assets.dropo.dev/coffee/americano.png',
        description: 'Smooth espresso diluted with hot water for a lighter cup.',
        nutrition: {
          kcal: 25,
          protein: 1,
          carbs: 2,
          fat: 0,
        },
        variants: [
          { name: 'Regular', price: 180, isDefault: true },
          { name: 'Large', price: 210 },
        ],
      },
      {
        name: 'Signature Frappe',
        slug: 'signature-frappe',
        imageUrl: 'https://assets.dropo.dev/coffee/signature-frappe.png',
        description:
          'A chilled, blended coffee treat topped with whipped cream.',
        nutrition: {
          kcal: 563,
          protein: 9.3,
          carbs: 24,
          fat: 30,
        },
        isRecommended: true,
        variants: [
          { name: '350 ml', price: 250, isDefault: true },
          { name: '450 ml', price: 300 },
          { name: '650 ml', price: 350 },
        ],
      },
      {
        name: 'Cold Brew',
        slug: 'cold-brew',
        imageUrl: 'https://assets.dropo.dev/coffee/cold-brew.png',
        description: 'Slow steeped 16-hour cold brew served over ice.',
        nutrition: {
          kcal: 80,
          protein: 2,
          carbs: 10,
          fat: 0,
        },
        variants: [
          { name: 'Regular', price: 230, isDefault: true },
          { name: 'Large', price: 270 },
        ],
      },
    ],
  },
  {
    name: 'Tea',
    slug: 'tea',
    description: 'Comforting teas brewed with premium leaves and spices.',
    heroImageUrl: 'https://assets.dropo.dev/tea/hero.png',
    palette: {
      primary100: '#F1F4E8',
      primary200: '#DCE7BF',
      primary300: '#A9C07C',
      primary400: '#6F8C3F',
      primary500: '#3E5720',
    },
    products: [
      {
        name: 'Masala Chai',
        slug: 'masala-chai',
        imageUrl: 'https://assets.dropo.dev/tea/masala-chai.png',
        description: 'Strong Assam tea simmered with spices and milk.',
        nutrition: {
          kcal: 160,
          protein: 6,
          carbs: 22,
          fat: 5,
        },
        variants: [
          { name: 'Kulhad', price: 120, isDefault: true },
          { name: 'Pot for two', price: 200 },
        ],
      },
      {
        name: 'Jasmine Green Tea',
        slug: 'jasmine-green-tea',
        imageUrl: 'https://assets.dropo.dev/tea/jasmine-green.png',
        description: 'Lightly floral steamed green tea with jasmine petals.',
        nutrition: {
          kcal: 5,
          protein: 0,
          carbs: 1,
          fat: 0,
        },
        variants: [
          { name: 'Regular', price: 150, isDefault: true },
          { name: 'Large', price: 190 },
        ],
      },
      {
        name: 'Lemongrass Ginger Tea',
        slug: 'lemongrass-ginger-tea',
        imageUrl: 'https://assets.dropo.dev/tea/lemongrass-ginger.png',
        description: 'Zesty lemongrass and ginger infusion served hot or iced.',
        nutrition: {
          kcal: 40,
          protein: 0,
          carbs: 8,
          fat: 0,
        },
        variants: [
          { name: 'Hot', price: 160, isDefault: true },
          { name: 'Iced', price: 180 },
        ],
      },
      {
        name: 'Earl Grey Supreme',
        slug: 'earl-grey-supreme',
        imageUrl: 'https://assets.dropo.dev/tea/earl-grey.png',
        description: 'Black tea scented with bergamot and citrus.',
        nutrition: {
          kcal: 15,
          protein: 0,
          carbs: 3,
          fat: 0,
        },
        variants: [
          { name: 'Regular', price: 170, isDefault: true },
          { name: 'Large', price: 210 },
        ],
      },
      {
        name: 'Hibiscus Iced Tea',
        slug: 'hibiscus-iced-tea',
        imageUrl: 'https://assets.dropo.dev/tea/hibiscus-iced.png',
        description: 'Tangy hibiscus and berry iced tea.',
        nutrition: {
          kcal: 90,
          protein: 1,
          carbs: 20,
          fat: 0,
        },
        variants: [
          { name: 'Regular', price: 190, isDefault: true },
          { name: 'Pitcher', price: 320 },
        ],
      },
    ],
  },
  {
    name: 'Beverages',
    slug: 'beverages',
    description: 'Cold-pressed juices, smoothies and refreshers.',
    heroImageUrl: 'https://assets.dropo.dev/beverages/hero.png',
    palette: {
      primary100: '#F1F9FF',
      primary200: '#C7E8FF',
      primary300: '#79C0FF',
      primary400: '#3A8DDE',
      primary500: '#1F5AA6',
    },
    products: [
      {
        name: 'Mango Lassi Smoothie',
        slug: 'mango-lassi-smoothie',
        imageUrl: 'https://assets.dropo.dev/beverages/mango-lassi.png',
        description: 'Alphonso mango blended with yogurt and cardamom.',
        nutrition: {
          kcal: 260,
          protein: 7,
          carbs: 40,
          fat: 7,
        },
        variants: [
          { name: 'Regular', price: 220, isDefault: true },
          { name: 'Large', price: 260 },
        ],
      },
      {
        name: 'Berry Boost',
        slug: 'berry-boost',
        imageUrl: 'https://assets.dropo.dev/beverages/berry-boost.png',
        description: 'Blueberry, strawberry, and acai smoothie.',
        nutrition: {
          kcal: 240,
          protein: 5,
          carbs: 42,
          fat: 4,
        },
        variants: [
          { name: 'Regular', price: 230, isDefault: true },
          { name: 'Large', price: 270 },
        ],
      },
      {
        name: 'Citrus Cooler',
        slug: 'citrus-cooler',
        imageUrl: 'https://assets.dropo.dev/beverages/citrus-cooler.png',
        description: 'Orange, lime, and mint refresher.',
        nutrition: {
          kcal: 160,
          protein: 2,
          carbs: 36,
          fat: 0,
        },
        variants: [
          { name: 'Regular', price: 180, isDefault: true },
          { name: 'Large', price: 210 },
        ],
      },
      {
        name: 'Coconut Water Cooler',
        slug: 'coconut-water-cooler',
        imageUrl: 'https://assets.dropo.dev/beverages/coconut-water.png',
        description: 'Tender coconut water with lime and mint.',
        nutrition: {
          kcal: 90,
          protein: 2,
          carbs: 20,
          fat: 0,
        },
        variants: [
          { name: 'Regular', price: 170, isDefault: true },
          { name: 'Large', price: 210 },
        ],
      },
      {
        name: 'Peach Iced Tea Refresher',
        slug: 'peach-iced-tea-refresher',
        imageUrl: 'https://assets.dropo.dev/beverages/peach-iced-tea.png',
        description: 'Sweet peach tea brewed cold.',
        nutrition: {
          kcal: 140,
          protein: 1,
          carbs: 33,
          fat: 0,
        },
        variants: [
          { name: 'Regular', price: 190, isDefault: true },
          { name: 'Pitcher', price: 320 },
        ],
      },
      {
        name: 'Matcha Lemonade',
        slug: 'matcha-lemonade',
        imageUrl: 'https://assets.dropo.dev/beverages/matcha-lemonade.png',
        description: 'Uji matcha whisked into sparkling lemonade.',
        nutrition: {
          kcal: 120,
          protein: 3,
          carbs: 26,
          fat: 1,
        },
        variants: [
          { name: 'Regular', price: 210, isDefault: true },
          { name: 'Large', price: 250 },
        ],
      },
      {
        name: 'Pineapple Basil Cooler',
        slug: 'pineapple-basil-cooler',
        imageUrl: 'https://assets.dropo.dev/beverages/pineapple-basil.png',
        description: 'Pineapple, basil and lime refresher.',
        nutrition: {
          kcal: 170,
          protein: 2,
          carbs: 38,
          fat: 0,
        },
        variants: [
          { name: 'Regular', price: 180, isDefault: true },
          { name: 'Large', price: 220 },
        ],
      },
      {
        name: 'Salted Caramel Shake',
        slug: 'salted-caramel-shake',
        imageUrl: 'https://assets.dropo.dev/beverages/salted-caramel.png',
        description: 'Creamy caramel shake with flaky sea salt.',
        nutrition: {
          kcal: 410,
          protein: 9,
          carbs: 48,
          fat: 18,
        },
        variants: [
          { name: 'Regular', price: 260, isDefault: true },
          { name: 'Large', price: 310 },
        ],
      },
      {
        name: 'Watermelon Slush',
        slug: 'watermelon-slush',
        imageUrl: 'https://assets.dropo.dev/beverages/watermelon-slush.png',
        description: 'Frozen watermelon and lime slushie.',
        nutrition: {
          kcal: 150,
          protein: 1,
          carbs: 35,
          fat: 0,
        },
        variants: [
          { name: 'Regular', price: 170, isDefault: true },
          { name: 'Large', price: 210 },
        ],
      },
      {
        name: 'Dark Chocolate Shake',
        slug: 'dark-chocolate-shake',
        imageUrl: 'https://assets.dropo.dev/beverages/dark-chocolate.png',
        description: '70% dark chocolate shake with cocoa nibs.',
        nutrition: {
          kcal: 450,
          protein: 10,
          carbs: 50,
          fat: 20,
        },
        variants: [
          { name: 'Regular', price: 280, isDefault: true },
          { name: 'Large', price: 330 },
        ],
      },
      {
        name: 'Kokum Fizz',
        slug: 'kokum-fizz',
        imageUrl: 'https://assets.dropo.dev/beverages/kokum-fizz.png',
        description: 'Coastal kokum cooler with soda and rock salt.',
        nutrition: {
          kcal: 130,
          protein: 1,
          carbs: 29,
          fat: 0,
        },
        variants: [
          { name: 'Regular', price: 180, isDefault: true },
          { name: 'Large', price: 220 },
        ],
      },
    ],
  },
  {
    name: 'Snacks',
    slug: 'snacks',
    description: 'Fresh bakes and savoury bites to pair with your drink.',
    heroImageUrl: 'https://assets.dropo.dev/snacks/hero.png',
    palette: {
      primary100: '#FFF4E6',
      primary200: '#FFD9B3',
      primary300: '#FFB366',
      primary400: '#E68033',
      primary500: '#B34700',
    },
    products: [
      {
        name: 'Veg Puff',
        slug: 'veg-puff',
        imageUrl: 'https://assets.dropo.dev/snacks/veg-puff.png',
        description: 'Flaky puff pastry stuffed with spiced veggies.',
        nutrition: {
          kcal: 210,
          protein: 5,
          carbs: 28,
          fat: 9,
        },
        variants: [{ name: 'Single', price: 70, isDefault: true }],
      },
      {
        name: 'Almond Croissant',
        slug: 'almond-croissant',
        imageUrl: 'https://assets.dropo.dev/snacks/almond-croissant.png',
        description: 'Buttery croissant filled with almond frangipane.',
        nutrition: {
          kcal: 330,
          protein: 7,
          carbs: 32,
          fat: 18,
        },
        variants: [{ name: 'Single', price: 110, isDefault: true }],
      },
      {
        name: 'French Fries',
        slug: 'french-fries',
        imageUrl: 'https://assets.dropo.dev/snacks/french-fries.png',
        description: 'Crispy shoestring fries served with peri-peri seasoning.',
        nutrition: {
          kcal: 290,
          protein: 4,
          carbs: 34,
          fat: 15,
        },
        variants: [
          { name: 'Regular', price: 120, isDefault: true },
          { name: 'Large', price: 150 },
        ],
      },
      {
        name: 'Sourdough Sandwich',
        slug: 'sourdough-sandwich',
        imageUrl: 'https://assets.dropo.dev/snacks/sourdough-sandwich.png',
        description: 'Grilled sourdough with pesto, mozzarella and tomatoes.',
        nutrition: {
          kcal: 360,
          protein: 14,
          carbs: 36,
          fat: 16,
        },
        variants: [{ name: 'Single', price: 190, isDefault: true }],
      },
      {
        name: 'Chicken Tikka Wrap',
        slug: 'chicken-tikka-wrap',
        imageUrl: 'https://assets.dropo.dev/snacks/chicken-wrap.png',
        description: 'Grilled chicken tikka with mint chutney in a wheat wrap.',
        nutrition: {
          kcal: 420,
          protein: 25,
          carbs: 35,
          fat: 18,
        },
        variants: [{ name: 'Single', price: 210, isDefault: true }],
      },
      {
        name: 'Paneer Bhurji Slider',
        slug: 'paneer-bhurji-slider',
        imageUrl: 'https://assets.dropo.dev/snacks/paneer-slider.png',
        description: 'Soft slider buns filled with masala paneer scramble.',
        nutrition: {
          kcal: 280,
          protein: 12,
          carbs: 25,
          fat: 12,
        },
        variants: [{ name: 'Set of 2', price: 160, isDefault: true }],
      },
      {
        name: 'Falafel Bowl',
        slug: 'falafel-bowl',
        imageUrl: 'https://assets.dropo.dev/snacks/falafel-bowl.png',
        description: 'Falafel, hummus, and pickled veggies with pita chips.',
        nutrition: {
          kcal: 380,
          protein: 14,
          carbs: 40,
          fat: 16,
        },
        variants: [{ name: 'Single', price: 220, isDefault: true }],
      },
      {
        name: 'Chocolate Chunk Cookie',
        slug: 'chocolate-chunk-cookie',
        imageUrl: 'https://assets.dropo.dev/snacks/chocolate-cookie.png',
        description: 'Chewy cookie loaded with dark chocolate chunks.',
        nutrition: {
          kcal: 260,
          protein: 4,
          carbs: 32,
          fat: 12,
        },
        variants: [{ name: 'Single', price: 90, isDefault: true }],
      },
      {
        name: 'Herb Garlic Bread',
        slug: 'herb-garlic-bread',
        imageUrl: 'https://assets.dropo.dev/snacks/garlic-bread.png',
        description: 'Toasted baguette with herb garlic butter.',
        nutrition: {
          kcal: 210,
          protein: 6,
          carbs: 24,
          fat: 9,
        },
        variants: [{ name: 'Portion', price: 140, isDefault: true }],
      },
      {
        name: 'Cheese Nachos',
        slug: 'cheese-nachos',
        imageUrl: 'https://assets.dropo.dev/snacks/cheese-nachos.png',
        description: 'Nachos with cheddar sauce, pico and jalapeños.',
        nutrition: {
          kcal: 430,
          protein: 10,
          carbs: 42,
          fat: 22,
        },
        variants: [{ name: 'Sharing', price: 230, isDefault: true }],
      },
    ],
  },
];

type AddonOptionSeed = {
  name: string;
  priceDelta: number;
  isDefault?: boolean;
};

type AddonGroupSeed = {
  name: string;
  selectionType: SelectionType;
  minSelect: number;
  maxSelect: number;
  options: AddonOptionSeed[];
};

const defaultAddonGroups: Record<string, AddonGroupSeed> = {
  milk: {
    name: 'Milk Choice',
    selectionType: SelectionType.SINGLE,
    minSelect: 1,
    maxSelect: 1,
    options: [
      { name: 'Skimmed Milk', priceDelta: 0, isDefault: true },
      { name: 'Almond Milk', priceDelta: 50 },
      { name: 'Oat Milk', priceDelta: 70 },
    ],
  },
  sweetness: {
    name: 'Sweetness Level',
    selectionType: SelectionType.SINGLE,
    minSelect: 1,
    maxSelect: 1,
    options: [
      { name: 'Less Sweet', priceDelta: 0 },
      { name: 'Balanced', priceDelta: 0, isDefault: true },
      { name: 'Extra Sweet', priceDelta: 0 },
    ],
  },
  toppings: {
    name: 'Toppings',
    selectionType: SelectionType.MULTI,
    minSelect: 0,
    maxSelect: 3,
    options: [
      { name: 'Whipped Cream', priceDelta: 30 },
      { name: 'Chocolate Chips', priceDelta: 40 },
      { name: 'Espresso Shot', priceDelta: 60 },
    ],
  },
};

async function main() {
  console.log('🌱 Seeding Dropo database...');
  const productIdBySlug = new Map<string, string>();

  for (const category of categorySeeds) {
    const createdCategory = await prisma.productCategory.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        heroImageUrl: category.heroImageUrl,
        palette: category.palette,
      },
      create: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        heroImageUrl: category.heroImageUrl,
        palette: category.palette,
      },
    });

    for (const product of category.products) {
      const createdProduct = await prisma.product.upsert({
        where: { slug: product.slug },
        update: {
          name: product.name,
          description: product.description,
          imageUrl: product.imageUrl,
          nutrition: product.nutrition,
          isRecommended: product.isRecommended ?? false,
          categoryId: createdCategory.id,
        },
        create: {
          categoryId: createdCategory.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          imageUrl: product.imageUrl,
          nutrition: product.nutrition,
          isRecommended: product.isRecommended ?? false,
          variants: {
            create: product.variants.map((variant, index) => ({
              name: variant.name,
              price: toDecimal(variant.price),
              isDefault: variant.isDefault ?? index === 0,
            })),
          },
          addonGroups: {
            create:
              category.slug === 'coffee'
                ? [defaultAddonGroups.milk, defaultAddonGroups.toppings].map((group) => ({
                    name: group.name,
                    selectionType: group.selectionType,
                    minSelect: group.minSelect,
                    maxSelect: group.maxSelect,
                    options: {
                      create: group.options.map((option, optionIndex) => ({
                        name: option.name,
                        priceDelta: toDecimal(option.priceDelta),
                        isDefault: option.isDefault ?? optionIndex === 0,
                      })),
                    },
                  }))
                : category.slug === 'tea'
                ? [defaultAddonGroups.milk, defaultAddonGroups.sweetness].map((group) => ({
                    name: group.name,
                    selectionType: group.selectionType,
                    minSelect: group.minSelect,
                    maxSelect: group.maxSelect,
                    options: {
                      create: group.options.map((option, optionIndex) => ({
                        name: option.name,
                        priceDelta: toDecimal(option.priceDelta),
                        isDefault: option.isDefault ?? optionIndex === 0,
                      })),
                    },
                  }))
                : category.slug === 'snacks'
                ? [
                    {
                      name: 'Dips',
                      selectionType: SelectionType.MULTI,
                      minSelect: 0,
                      maxSelect: 2,
                      options: {
                        create: [
                          { name: 'Cheese Dip', priceDelta: toDecimal(30), isDefault: true },
                          { name: 'Sriracha Mayo', priceDelta: toDecimal(25) },
                          { name: 'Tomato Salsa', priceDelta: toDecimal(20) },
                        ],
                      },
                    },
                  ]
                : [defaultAddonGroups.sweetness].map((group) => ({
                    name: group.name,
                    selectionType: group.selectionType,
                    minSelect: group.minSelect,
                    maxSelect: group.maxSelect,
                    options: {
                      create: group.options.map((option, optionIndex) => ({
                        name: option.name,
                        priceDelta: toDecimal(option.priceDelta),
                        isDefault: option.isDefault ?? optionIndex === 0,
                      })),
                    },
                  })),
          },
        },
        include: {
          variants: true,
        },
      });

      productIdBySlug.set(product.slug, createdProduct.id);
    }
  }

  // Establish simple suggestions: recommended coffee pairs with snacks
  const signatureFrappeId = productIdBySlug.get('signature-frappe');
  const almondCroissantId = productIdBySlug.get('almond-croissant');
  const vegPuffId = productIdBySlug.get('veg-puff');

  if (signatureFrappeId && almondCroissantId) {
    await prisma.productSuggestion.upsert({
      where: {
        productId_suggestedProductId: {
          productId: signatureFrappeId,
          suggestedProductId: almondCroissantId,
        },
      },
      update: {},
      create: {
        productId: signatureFrappeId,
        suggestedProductId: almondCroissantId,
      },
    });
  }

  if (signatureFrappeId && vegPuffId) {
    await prisma.productSuggestion.upsert({
      where: {
        productId_suggestedProductId: {
          productId: signatureFrappeId,
          suggestedProductId: vegPuffId,
        },
      },
      update: {},
      create: {
        productId: signatureFrappeId,
        suggestedProductId: vegPuffId,
      },
    });
  }

  console.log('✅ Seed complete');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
