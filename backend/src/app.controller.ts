import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ComplementService } from './complement/complement.service';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly complementService: ComplementService) {}

  @Get('health')
  @ApiOperation({ summary: 'Sunucu sağlık kontrolü' })
  @ApiResponse({ status: 200, description: 'Sunucu çalışıyor' })
  async getHealth() {
    const engine = await this.complementService.getEngineHealth();

    return {
      status: 'OK',
      message: 'NestJS server çalışıyor',
      python_engine: {
        reachable: engine.reachable,
        status: engine.status,
        products: engine.products,
      },
    };
  }
}
