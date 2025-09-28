import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { GetProductsDto } from './dto/get-products.dto';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async listCategories() {
    const categories = await this.prisma.productCategory.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return categories.map(({ _count, ...rest }) => ({
      ...rest,
      productCount: _count.products,
    }));
  }

  async listProducts({ category, search, limit = 50 }: GetProductsDto) {
    const where: Prisma.ProductWhereInput = {};

    if (category) {
      where.category = {
        slug: category,
      };
    }

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const products = await this.prisma.product.findMany({
      where,
      include: {
        category: true,
        variants: true,
        addonGroups: {
          include: {
            options: true,
          },
        },
        suggestions: {
          include: {
            suggestedProduct: {
              select: {
                id: true,
                slug: true,
                name: true,
                imageUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
      take: limit,
    });

    return products.map((product) => ({
      ...product,
      suggestions: product.suggestions.map((suggestion) => suggestion.suggestedProduct),
    }));
  }

  async getProductBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        variants: true,
        addonGroups: {
          include: {
            options: true,
          },
        },
        suggestions: {
          include: {
            suggestedProduct: {
              select: {
                id: true,
                slug: true,
                name: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with slug '${slug}' not found`);
    }

    return {
      ...product,
      suggestions: product.suggestions.map((suggestion) => suggestion.suggestedProduct),
    };
  }
}
