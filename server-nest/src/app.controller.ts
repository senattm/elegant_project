import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('health')
@Controller()
export class AppController {
  @Get('health')
  @ApiOperation({ summary: 'Sunucu sağlık kontrolü' })
  @ApiResponse({ status: 200, description: 'Sunucu çalışıyor' })
  getHealth() {
    return { status: 'OK', message: 'NestJS server çalışıyor' };
  }
}
