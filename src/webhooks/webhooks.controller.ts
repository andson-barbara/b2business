import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';

function toStr(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value === undefined || value === null) return '';
  return String(value);
}

function verifySignature(rawBody: string, secret: string, signatureHeader: string): boolean {
  const [algo, provided] = signatureHeader.split('=');
  if (algo !== 'sha256' || !provided) return false;

  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');

  const a = Buffer.from(provided, 'hex');
  const b = Buffer.from(expected, 'hex');
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}

@Controller('webhooks')
export class WebhooksController {
  @Post('n8n')
  @HttpCode(200)
  async receive(
    @Req() req: Request & { rawBody?: Buffer },
    @Body() body: Record<string, unknown>,
    @Headers('x-b2b-signature') signature: string | undefined,
    @Headers('x-b2b-event') event: string | undefined,
  ) {
    const secret = toStr(process.env.N8N_WEBHOOK_SECRET);
    if (!secret) throw new UnauthorizedException('N8N_WEBHOOK_SECRET não configurado');

    const sig = toStr(signature);

    const rawBody = req.rawBody?.toString('utf8') ?? '';
    if (!rawBody) throw new UnauthorizedException('rawBody ausente');

    if (!verifySignature(rawBody, secret, sig)) {
      throw new UnauthorizedException('Assinatura inválida');
    }

    return {
      ok: true,
      event: toStr(event) || 'unknown',
      receivedAt: new Date().toISOString(),
      body,
    };
  }
}
