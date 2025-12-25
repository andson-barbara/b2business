import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';

type AnyRecord = Record<string, unknown>;

function toStr(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value === undefined || value === null) return '';
  return String(value);
}

function verifySignature(rawBody: string, secret: string, signatureHeader: string): boolean {
  // padrão simples: header "x-b2b-signature" = "sha256=<hex>"
  const [algo, provided] = signatureHeader.split('=');
  if (algo !== 'sha256' || !provided) return false;

  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');

  // timing-safe compare
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
    @Body() body: AnyRecord,
    @Headers('x-b2b-signature') signature: string | undefined,
    @Headers('x-b2b-event') event: string | undefined,
  ) {
    const secret = toStr(process.env.N8N_WEBHOOK_SECRET);

    if (!secret) {
      throw new UnauthorizedException('N8N_WEBHOOK_SECRET não configurado');
    }

    const sig = toStr(signature);
    const rawBody = JSON.stringify(body);

    if (!sig || !verifySignature(rawBody, secret, sig)) {
      throw new UnauthorizedException('Assinatura inválida');
    }

    // Aqui você decide o roteamento por evento (multi-tenant no futuro)
    const evt = toStr(event) || 'unknown';

    return {
      ok: true,
      event: evt,
      receivedAt: new Date().toISOString(),
    };
  }
}
