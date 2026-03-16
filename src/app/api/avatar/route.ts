import { NextResponse } from 'next/server';
import { authPool } from '@/lib/db';
import { listAvailableAvatars, readAvatarMap, writeAvatarMap } from '@/lib/avatarStore';

async function getAccount(accountId: string) {
  const [rows]: any = await authPool.query('SELECT id, username FROM account WHERE id = ? LIMIT 1', [accountId]);
  return rows[0] || null;
}

function canEditAvatarAlways(username: string | null | undefined) {
  return String(username || '').trim().toUpperCase() === 'MIIKIIS';
}

const AVATAR_CHANGE_COST_DP = 1;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json({ error: 'accountId is required' }, { status: 400 });
    }

    const account = await getAccount(accountId);
    if (!account) {
      return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 });
    }

    const [avatars, avatarMap] = await Promise.all([
      listAvailableAvatars(),
      readAvatarMap(),
    ]);

    const selectedAvatar = avatarMap[accountId] || null;
    const editableAlways = canEditAvatarAlways(account.username);

    return NextResponse.json({
      avatars,
      selectedAvatar,
      locked: false,
      editableAlways,
      changeCostDp: AVATAR_CHANGE_COST_DP,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Error loading avatars', details: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { accountId, avatar } = await request.json();

    if (!accountId || !avatar) {
      return NextResponse.json({ error: 'accountId and avatar are required' }, { status: 400 });
    }

    const account = await getAccount(String(accountId));
    if (!account) {
      return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 });
    }

    const editableAlways = canEditAvatarAlways(account.username);

    const avatars = await listAvailableAvatars();
    if (!avatars.includes(String(avatar))) {
      return NextResponse.json({ error: 'Avatar no valido' }, { status: 400 });
    }

    const avatarMap = await readAvatarMap();
    const previousAvatar = avatarMap[String(accountId)] || null;
    const nextAvatar = String(avatar);
    const isChanging = previousAvatar !== null && previousAvatar !== nextAvatar;
    const requiresPayment = isChanging && !editableAlways;

    if (requiresPayment) {
      const [accountRows]: any = await authPool.query(
        'SELECT dp FROM account WHERE id = ? LIMIT 1',
        [accountId]
      );

      const currentDp = Number(accountRows?.[0]?.dp || 0);
      if (currentDp < AVATAR_CHANGE_COST_DP) {
        return NextResponse.json(
          { error: `Necesitas ${AVATAR_CHANGE_COST_DP} credito para cambiar el avatar` },
          { status: 400 }
        );
      }

      const [updateResult]: any = await authPool.query(
        'UPDATE account SET dp = dp - ? WHERE id = ? AND dp >= ?',
        [AVATAR_CHANGE_COST_DP, accountId, AVATAR_CHANGE_COST_DP]
      );

      if (!updateResult?.affectedRows) {
        return NextResponse.json(
          { error: `No tienes creditos suficientes para cambiar el avatar` },
          { status: 400 }
        );
      }
    }

    avatarMap[String(accountId)] = nextAvatar;
    try {
      await writeAvatarMap(avatarMap);
    } catch (writeError: any) {
      if (requiresPayment) {
        await authPool.query('UPDATE account SET dp = dp + ? WHERE id = ?', [AVATAR_CHANGE_COST_DP, accountId]);
      }
      throw writeError;
    }

    return NextResponse.json({
      success: true,
      selectedAvatar: nextAvatar,
      locked: false,
      editableAlways,
      chargedDp: requiresPayment ? AVATAR_CHANGE_COST_DP : 0,
      changeCostDp: AVATAR_CHANGE_COST_DP,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Error saving avatar', details: error.message }, { status: 500 });
  }
}
