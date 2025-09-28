import { Controller, Get, Param, Query } from '@nestjs/common';

import { CatalogService } from './catalog.service';
import { GetProductsDto } from './dto/get-products.dto';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('categories')
  listCategories() {
    return this.catalogService.listCategories();
  }

  @Get('products')
  listProducts(@Query() query: GetProductsDto) {
    return this.catalogService.listProducts(query);
  }

  @Get('products/:slug')
  getProduct(@Param('slug') slug: string) {
    return this.catalogService.getProductBySlug(slug);
  }
}
