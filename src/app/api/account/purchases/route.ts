import { NextResponse } from 'next/server';
import { authPool } from '@/lib/db';

type PurchaseRow = {
  id: number;
  account_id: number;
  item_id: number;
  item_name: string;
  currency: 'vp' | 'dp';
  price: number;
  character_guid: number | null;
  character_name: string;
  is_gift: number;
  created_at: string;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = Number(searchParams.get('accountId'));
    const limitParam = Number(searchParams.get('limit') || 50);
    const limit = Number.isInteger(limitParam) ? Math.min(Math.max(limitParam, 1), 200) : 50;

    if (!Number.isInteger(accountId) || accountId <= 0) {
      return NextResponse.json({ error: 'accountId invalido' }, { status: 400 });
    }

    const [rows] = await authPool.query(
      `SELECT id, account_id, item_id, item_name, currency, price, character_guid, character_name, is_gift, created_at
       FROM shop_purchases
       WHERE account_id = ?
       ORDER BY id DESC
       LIMIT ?`,
      [accountId, limit]
    );

    return NextResponse.json({ purchases: rows as PurchaseRow[] }, { status: 200 });
  } catch (error: any) {
    if (error?.code === 'ER_NO_SUCH_TABLE') {
      return NextResponse.json({ purchases: [] }, { status: 200 });
    }

    console.error('Account purchases API error:', error);
    return NextResponse.json(
      { error: 'Error del servidor', details: error.message },
      { status: 500 }
    );
  }
}
