import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  let accountId: string | null = null;
  try {
    const { searchParams } = new URL(request.url);
    accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json({ error: 'accountId is required' }, { status: 400 });
    }

    // Query characters from acore_characters
    // Note: We use acore_characters.characters (assumed name from AzerothCore default)
    const [rows]: any = await pool.query(
      `SELECT guid, name, race, class, gender, level, online, money,
              map, zone, xp, totaltime, leveltime, logout_time
       FROM acore_characters.characters
       WHERE account = ?`,
      [accountId]
    );

    return NextResponse.json({ characters: rows });
  } catch (error: any) {
    console.error('Characters API Error:', error);
    // If acore_characters.characters fails, try characters (maybe database name is different)
    try {
        const [rows]: any = await pool.query(
          `SELECT guid, name, race, class, gender, level, online, money,
                  map, zone, xp, totaltime, leveltime, logout_time
           FROM characters
           WHERE account = ?`,
          [accountId]
        );
        return NextResponse.json({ characters: rows });
    } catch (innerError: any) {
        try {
          // Final compatibility fallback for schemas missing extra columns.
          const [rows]: any = await pool.query(
            'SELECT guid, name, race, class, gender, level, online, money FROM characters WHERE account = ?',
            [accountId]
          );
          return NextResponse.json({ characters: rows });
        } catch (lastError: any) {
          return NextResponse.json({ error: 'Database error fetching characters', details: lastError.message }, { status: 500 });
        }
    }
  }
}
