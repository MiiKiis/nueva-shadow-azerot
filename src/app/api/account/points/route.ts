import { NextResponse } from 'next/server';
import { authPool, cmsPool } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = Number(searchParams.get('accountId'));

    if (!Number.isInteger(accountId) || accountId <= 0) {
      return NextResponse.json({ error: 'accountId invalido' }, { status: 400 });
    }

    let rows, accessRows, cmsRows;
    try {
      rows = ((await (authPool as any).query(
        'SELECT id, vp, dp FROM account WHERE id = ? LIMIT 1',
        [accountId]
      )) as any[])[0];
    } catch (dbError: any) {
      return NextResponse.json({ error: 'Error en consulta account', details: dbError.message, code: dbError.code }, { status: 500 });
    }

    try {
      cmsRows = ((await (cmsPool as any).query(
        'SELECT role FROM users WHERE id = ? LIMIT 1',
        [accountId]
      )) as any[])[0];
    } catch (dbError: any) {
      console.warn('CmsPool error getting role:', dbError.message);
    }

    try {
      accessRows = ((await (authPool as any).query(
        'SELECT MAX(gmlevel) AS gmlevel FROM account_access WHERE id = ?',
        [accountId]
      )) as any[])[0];
    } catch (dbError: any) {
      return NextResponse.json({ error: 'Error en consulta access', details: dbError.message, code: dbError.code }, { status: 500 });
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 });
    }

    const row = rows[0];
    const dp = Number(row.dp || 0);
    const vp = Number(row.vp || 0);
    
    let gmlevel = Number(accessRows?.[0]?.gmlevel || 0);
    const roleDb = Number(cmsRows?.[0]?.role || 0);
    
    if (roleDb === 1 && gmlevel < 3) {
      gmlevel = 3; // Role 1 en blizzcms equivale a nivel 3+ en juego 
    }

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
    return NextResponse.json({ error: 'Error del servidor', details: error.message, code: error.code }, { status: 500 });
  }
}
