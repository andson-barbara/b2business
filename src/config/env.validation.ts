import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('production'),
  PORT: Joi.number().default(3000),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().port().required(),
  DB_USER: Joi.string().required(),
  DB_NAME: Joi.string().required(),

  DB_PASS: Joi.string().min(1).optional(),
  DB_PASSWORD: Joi.string().min(1).optional(),

  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),

  APP_URL: Joi.string().uri().optional(),
})
  .custom((value, helpers) => {
    const pass = value.DB_PASSWORD ?? value.DB_PASS;
    if (!pass || typeof pass !== 'string' || pass.trim().length === 0) {
      // ✅ compatível com TS/Joi sem briga de tipos
      return helpers.error('any.custom', { message: 'DB_PASS ou DB_PASSWORD deve estar preenchido' });
    }
    return value;
  }, 'DB password validation')
  .messages({
    'any.custom': '{{#message}}',
  });
