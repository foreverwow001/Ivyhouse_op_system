import 'reflect-metadata';

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

const defaultApiPort = 3000;
const defaultApiHost = '127.0.0.1';
const expectSupabaseEnvFlag = 'IVYHOUSE_EXPECT_SUPABASE';

type DatabaseRuntimeEvidence = {
  provider: 'supabase' | 'non-supabase';
  port: string;
  database: string;
};

function unwrapEnvValue(value: string) {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function loadLocalEnvFile() {
  const envFilePath = path.resolve(__dirname, '..', '.env');

  if (!existsSync(envFilePath)) {
    return;
  }

  const envFile = readFileSync(envFilePath, 'utf8');

  for (const rawLine of envFile.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');

    if (separatorIndex <= 0) {
      continue;
    }

    const rawKey = line.slice(0, separatorIndex).trim();
    const key = rawKey.startsWith('export ')
      ? rawKey.slice('export '.length).trim()
      : rawKey;

    if (!key || process.env[key] !== undefined) {
      continue;
    }

    const rawValue = line.slice(separatorIndex + 1);
    process.env[key] = unwrapEnvValue(rawValue);
  }
}

function collectDatabaseRuntimeEvidence(): DatabaseRuntimeEvidence {
  const rawDatabaseUrl = process.env.DATABASE_URL?.trim();

  if (!rawDatabaseUrl) {
    throw new Error('缺少 DATABASE_URL，無法啟動 API。');
  }

  const parsedUrl = new URL(unwrapEnvValue(rawDatabaseUrl));
  const normalizedHostname = parsedUrl.hostname.toLowerCase();
  const provider =
    normalizedHostname === 'supabase.com' ||
    normalizedHostname.endsWith('.supabase.com')
      ? 'supabase'
      : 'non-supabase';

  return {
    provider,
    port: parsedUrl.port || '5432',
    database: parsedUrl.pathname.replace(/^\//, '') || '(default)',
  };
}

async function bootstrap(): Promise<void> {
  loadLocalEnvFile();
  const databaseRuntimeEvidence = collectDatabaseRuntimeEvidence();

  if (
    process.env[expectSupabaseEnvFlag] === '1' &&
    databaseRuntimeEvidence.provider !== 'supabase'
  ) {
    throw new Error('本機啟動要求 Supabase DATABASE_URL，但目前讀到非 Supabase host。');
  }

  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  const port = process.env.PORT ? Number(process.env.PORT) : defaultApiPort;
  const host = defaultApiHost;

  await app.listen(port, host);

  console.info(
    `[ivyhouse/api] runtime ready host=${host} port=${port} provider=${databaseRuntimeEvidence.provider} database=${databaseRuntimeEvidence.database} dbPort=${databaseRuntimeEvidence.port}`,
  );
}

void bootstrap();