import { NextResponse } from 'next/server';
import { authPool } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = Number(searchParams.get('accountId'));

    if (!Number.isInteger(accountId) || accountId <= 0) {
      return NextResponse.json({ error: 'accountId invalido' }, { status: 400 });
    }

    const [rows]: any = await authPool.query(
      'SELECT id, vp, dp FROM account WHERE id = ? LIMIT 1',
      [accountId]
    );

    const [accessRows]: any = await authPool.query(
      'SELECT MAX(gmlevel) AS gmlevel FROM account_access WHERE id = ?',
      [accountId]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 });
    }

    const row = rows[0];
    const dp = Number(row.dp || 0);
    const vp = Number(row.vp || 0);
    const gmlevel = Number(accessRows?.[0]?.gmlevel || 0);
    const role = gmlevel > 0 ? 'GM' : 'ADALID';

    return NextResponse.json({
      accountId,
      dp,
      vp,
      gmlevel,
      role,
      credits: dp,
    });
  } catch (error: any) {
    console.error('Account points API error:', error);
    return NextResponse.json({ error: 'Error del servidor', details: error.message }, { status: 500 });
  }
}
