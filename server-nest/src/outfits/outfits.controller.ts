import { Body, Controller, Get, Param, ParseIntPipe, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OutfitsService } from './outfits.service';
import { OutfitFeedbackDto } from './dto/outfit-feedback.dto';

@ApiTags('outfits')
@Controller('outfits')
export class OutfitsController {
  constructor(private readonly outfitsService: OutfitsService) {}

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Kullanıcının kaydedilmiş kombinlerini listele' })
  getMyOutfits(@Request() req) {
    return this.outfitsService.getUserOutfits(req.user.id);
  }

  @Post(':id/feedback')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Kombin geri bildirimi (beğen / beğenme)' })
  submitFeedback(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: OutfitFeedbackDto,
  ) {
    return this.outfitsService.submitFeedback(req.user.id, id, dto.feedback);
  }
}
