import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CompaniesModule } from './companies/companies.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CustomersModule } from './customers/customers.module';

import { ModulesModule } from './modules/modules.module';
import { CompanyModulesModule } from './company-modules/company-modules.module';
import { CompanyIntegrationsModule } from './company-integrations/company-integrations.module';

import { envValidationSchema } from './config/env.validation';

import { WebhooksModule } from './webhooks/webhooks.module';

function toStr(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value === undefined || value === null) return '';
  return String(value);
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.development'],
      cache: true,
      validationSchema: envValidationSchema,
    }),

    TypeOrmModule.forRootAsync({
      useFactory: async () => {
        // Compatibilidade: prioriza DB_PASSWORD, cai para DB_PASS
        const password = toStr(process.env.DB_PASSWORD ?? process.env.DB_PASS);

        if (!password) {
          throw new Error('DB password inválida: DB_PASSWORD/DB_PASS não encontrada ou vazia.');
        }

        return {
          type: 'postgres' as const,
          host: toStr(process.env.DB_HOST),
          port: Number(process.env.DB_PORT),
          username: toStr(process.env.DB_USER),
          password, 
          database: toStr(process.env.DB_NAME),

          autoLoadEntities: true,

          // produção: use migrations
          synchronize: false,

          // logs opcionais (ajuda debugging)
          // logging: ['error'],
        };
      },
    }),

    CompaniesModule,
    UsersModule,
    AuthModule,
    CustomersModule,
    ModulesModule,
    CompanyModulesModule,
    CompanyIntegrationsModule,
    WebhooksModule
  ],
})
export class AppModule {}

