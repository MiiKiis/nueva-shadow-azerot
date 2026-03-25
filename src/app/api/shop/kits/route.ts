
import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { authPool } from '@/lib/db';

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'blizzcms',
  password: process.env.DB_PASSWORD || process.env.DB_PASS || '',
  database: process.env.DB_WORLD || 'acore_world',
};

export async function GET(req: NextRequest) {
  try {
    const kitId = req.nextUrl.searchParams.get('kitId');
    if (!kitId) return NextResponse.json({ items: [] }, { status: 200 });

    const [kitRows]: any = await authPool.query(
      'SELECT service_data FROM shop_items WHERE id = ? LIMIT 1',
      [kitId]
    );

    if (!kitRows.length || !kitRows[0].service_data) {
      return NextResponse.json({ items: [] }, { status: 200 });
    }

    let itemIds: number[] = [];
    try {
      const parsed = JSON.parse(kitRows[0].service_data);
      if (Array.isArray(parsed)) {
        itemIds = parsed.map((i: any) => Number(i.id)).filter(id => id > 0);
      }
    } catch (e) {
      // Invalid JSON
    }

    if (!itemIds.length) {
      return NextResponse.json({ items: [] }, { status: 200 });
    }

    const conn = await mysql.createConnection(dbConfig);
    const [itemsRows] = await conn.query(
      `SELECT entry, name FROM item_template WHERE entry IN (${itemIds.join(',')})`
    ) as any[];
    await conn.end();

    // Obtener iconos desde Wowhead en paralelo
    const itemsWithIcons = await Promise.all(
      itemsRows.map(async (row: any) => {
        try {
          const res = await fetch(`https://nether.wowhead.com/tooltip/item/${row.entry}`);
          if (res.ok) {
            const data = await res.json();
            return { ...row, icon: data.icon || 'inv_misc_questionmark' };
          }
        } catch (e) {
          // Fallback en caso de error de red con wowhead
        }
        return { ...row, icon: 'inv_misc_questionmark' };
      })
    );

    return NextResponse.json({ items: itemsWithIcons }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ items: [], error: 'Error al consultar el kit' }, { status: 200 });
  }
}
