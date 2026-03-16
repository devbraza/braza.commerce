import { Controller, Get } from '@nestjs/common';
import { ApiResponse } from '@brazachat/shared';

@Controller('health')
export class HealthController {
  @Get()
  check(): ApiResponse<null> {
    return { status: 'ok' };
  }
}
