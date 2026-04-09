import { NextResponse } from 'next/server';
import { authPool } from '@/lib/db';
import { calculateVerifier, calculateVerifierLegacy } from '@/lib/srp6';
import { awardLevelRewardsForAccount } from '@/lib/estelasLevelRewards';
import { RowDataPacket } from 'mysql2';
import crypto from 'crypto';

function toBinaryBuffer(value: unknown): Buffer {
  if (!value) return Buffer.alloc(32);
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof Uint8Array) return Buffer.from(value);
  if (typeof value === 'object' && value !== null) {
    const maybeBuffer = value as { type?: string; data?: number[] };
    if (maybeBuffer.type === 'Buffer' && Array.isArray(maybeBuffer.data)) {
      return Buffer.from(maybeBuffer.data);
    }
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^[0-9a-fA-F]+$/.test(trimmed) && (trimmed.length === 64 || trimmed.length % 2 === 0)) {
      return Buffer.from(trimmed, 'hex');
    }
    return Buffer.from(trimmed, 'binary');
  }
  // Try to convert to string if it's something else
  try {
    const str = String(value);
    return Buffer.from(str, 'binary');
  } catch {
    throw new Error('Formato de credenciales SRP6 no soportado en base de datos');
  }
}

function calculateShaPassHash(username: string, password: string): string {
  return crypto
    .createHash('sha1')
    .update(`${username.toUpperCase()}:${password.toUpperCase()}`)
    .digest('hex')
    .toUpperCase();
}

function isValidSrpField(field: Buffer | null | undefined): boolean {
  return Boolean(field && field.length === 32);
}

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    const normalizedUsername = String(username || '').trim();

    if (!normalizedUsername || !password) {
      return NextResponse.json({ error: 'Faltan campos' }, { status: 400 });
    }

    // 1. Get account from acore_auth
    if (!authPool) {
      return NextResponse.json({ error: 'Base de datos de autenticación no disponible' }, { status: 500 });
    }

    interface AccountRow extends RowDataPacket {
      id: number;
      username: string;
      salt: string | Buffer;
      verifier: string | Buffer;
      sha_pass_hash?: string | null;
    }

    let rows: AccountRow[] = [];
    try {
      const [result] = await authPool.query<AccountRow[]>(
        'SELECT id, username, salt, verifier, sha_pass_hash FROM account WHERE UPPER(username) = UPPER(?)',
        [normalizedUsername]
      );
      rows = result;
    } catch {
      // Fallback for schemas without sha_pass_hash.
      const [result] = await authPool.query<AccountRow[]>(
        'SELECT id, username, salt, verifier FROM account WHERE UPPER(username) = UPPER(?)',
        [normalizedUsername]
      );
      rows = result;
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 401 });
    }

    const account = rows[0];

    let authenticated = false;

    // 2. Primary auth: SRP6 verifier (AzerothCore default)
    try {
      const storedSalt = toBinaryBuffer(account.salt);
      const storedVerifier = toBinaryBuffer(account.verifier);

      if (isValidSrpField(storedSalt) && isValidSrpField(storedVerifier)) {
        const calculatedVerifier = calculateVerifier(account.username, password, storedSalt);
        const legacyCalculatedVerifier = calculateVerifierLegacy(account.username, password, storedSalt);
        authenticated = calculatedVerifier.equals(storedVerifier) || legacyCalculatedVerifier.equals(storedVerifier);
      }
    } catch (cryptoError: unknown) {
      // Continue with legacy fallback instead of failing login with 500.
      console.error('SRP6 verification warning:', cryptoError);
    }

    // 3. Legacy fallback: sha_pass_hash (older TrinityCore-style accounts)
    if (!authenticated && account.sha_pass_hash) {
      const expected = String(account.sha_pass_hash || '').trim().toUpperCase();
      const calculated = calculateShaPassHash(account.username, password);
      authenticated = expected.length > 0 && expected === calculated;
    }

    if (!authenticated) {
      return NextResponse.json({ error: 'Código de acceso incorrecto' }, { status: 401 });
    }

    // Best effort: grant pending milestone estelas on login.
    awardLevelRewardsForAccount(Number(account.id)).catch((err) => {
      console.error('Estelas login award error:', err);
    });

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: account.id,
        username: account.username,
      }
    }, { status: 200 });

  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Error del servidor inesperado';
    console.error('Fatal Login Error:', error);
    return NextResponse.json({ 
      error: 'Error del servidor inesperado',
      details: errorMsg
    }, { status: 500 });
  }
}
