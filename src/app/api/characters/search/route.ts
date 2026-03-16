import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name')?.trim() ?? '';

  if (name.length < 1) {
    return NextResponse.json({ error: 'Nombre muy corto (mínimo 1 caracter)' }, { status: 400 });
  }

  const pattern = `%${name}%`;

  const query = `SELECT guid, name, class, level, race
                 FROM characters
                 WHERE name LIKE ? COLLATE utf8mb4_general_ci
                 ORDER BY (name = ?) DESC, level DESC, name ASC
                 LIMIT 10`;

  try {
    const [rows]: any = await pool.query(query, [pattern, name]);
    return NextResponse.json({ characters: rows });
  } catch {
    try {
      const [rows]: any = await pool.query(
        `SELECT guid, name, class, level, race
         FROM acore_characters.characters
         WHERE name LIKE ? COLLATE utf8mb4_general_ci
         ORDER BY (name = ?) DESC, level DESC, name ASC
         LIMIT 10`,
        [pattern, name]
      );
      return NextResponse.json({ characters: rows });
    } catch (e: any) {
      return NextResponse.json(
        { error: 'Error buscando personaje', details: e.message },
        { status: 500 }
      );
    }
  }
}
