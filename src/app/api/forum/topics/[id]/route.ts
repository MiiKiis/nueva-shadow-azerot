import { NextResponse } from 'next/server';
import { authPool } from '@/lib/db';

async function isGM(userId: number): Promise<boolean> {
  const [rows]: any = await authPool.query(
    'SELECT MAX(gmlevel) AS gmlevel FROM account_access WHERE id = ?',
    [userId]
  );
  return Number(rows?.[0]?.gmlevel ?? 0) >= 3;
}

async function isStaff(userId: number): Promise<boolean> {
  const [rows]: any = await authPool.query(
    'SELECT MAX(gmlevel) AS gmlevel FROM account_access WHERE id = ?',
    [userId]
  );
  return Number(rows?.[0]?.gmlevel ?? 0) >= 1;
}

let ensureCompletedColumnPromise: Promise<void> | null = null;

async function ensureCompletedColumn(): Promise<void> {
  if (!ensureCompletedColumnPromise) {
    ensureCompletedColumnPromise = (async () => {
      const [rows]: any = await authPool.query(
        `SELECT 1 AS ok
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'forum_topics'
           AND COLUMN_NAME = 'completed'
         LIMIT 1`
      );

      if (!rows?.length) {
        await authPool.query(
          'ALTER TABLE forum_topics ADD COLUMN completed TINYINT(1) NOT NULL DEFAULT 0 AFTER locked'
        );
      }
    })().catch(() => {
      // Si falla la migración automática, mantenemos fallback en queries.
    });
  }

  await ensureCompletedColumnPromise;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureCompletedColumn();

    const { id: rawId } = await params;
    const id = Number(rawId);
    if (!id || id <= 0) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    // Increment view count
    await authPool.query('UPDATE forum_topics SET views = views + 1 WHERE id = ?', [id]);

    let rows: any[] = [];
    try {
      const [withCompleted]: any = await authPool.query(
        `SELECT
           t.id, t.title, t.category, t.pinned, t.locked, t.completed, t.views, t.created_at,
           t.author_id, COALESCE(a.username, '[Deleted]') AS author_username,
           MAX(aa.gmlevel) AS gmlevel
         FROM forum_topics t
         LEFT JOIN account a ON t.author_id = a.id
         LEFT JOIN account_access aa ON a.id = aa.id
         WHERE t.id = ?
         GROUP BY t.id, t.author_id, a.username`,
        [id]
      );
      rows = withCompleted;
    } catch {
      const [withoutCompleted]: any = await authPool.query(
        `SELECT
           t.id, t.title, t.category, t.pinned, t.locked, 0 AS completed, t.views, t.created_at,
           t.author_id, COALESCE(a.username, '[Deleted]') AS author_username,
           MAX(aa.gmlevel) AS gmlevel
         FROM forum_topics t
         LEFT JOIN account a ON t.author_id = a.id
         LEFT JOIN account_access aa ON a.id = aa.id
         WHERE t.id = ?
         GROUP BY t.id, t.author_id, a.username`,
        [id]
      );
      rows = withoutCompleted;
    }

    if (!rows.length) return NextResponse.json({ error: 'Tema no encontrado' }, { status: 404 });

    const t = rows[0];
    return NextResponse.json({
      topic: {
        id: t.id,
        title: t.title,
        category: t.category,
        pinned: !!t.pinned,
        locked: !!t.locked,
        completed: !!t.completed,
        views: t.views,
        created_at: t.created_at,
        author: {
          id: t.author_id,
          username: t.author_username,
        },
      },
    }, { status: 200 });
  } catch (e: any) {
    console.error('GET /api/forum/topics/[id] error:', e);
    return NextResponse.json({ error: 'Error cargando tema', details: e.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureCompletedColumn();

    const { id: rawId } = await params;
    const topicId = Number(rawId);
    if (!topicId || topicId <= 0) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    const body = await request.json();
    const userId = Number(body?.userId || 0);
    const completed = Boolean(body?.completed);

    if (!userId || userId <= 0) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const staff = await isStaff(userId);
    if (!staff) return NextResponse.json({ error: 'No tienes permisos para marcar tema' }, { status: 403 });

    const [topicRows]: any = await authPool.query('SELECT id FROM forum_topics WHERE id = ? LIMIT 1', [topicId]);
    if (!topicRows.length) return NextResponse.json({ error: 'Tema no encontrado' }, { status: 404 });

    await authPool.query(
      'UPDATE forum_topics SET completed = ?, updated_at = NOW() WHERE id = ? LIMIT 1',
      [completed ? 1 : 0, topicId]
    );

    return NextResponse.json({ success: true, completed }, { status: 200 });
  } catch (e: any) {
    const details = e?.message || 'Error desconocido';
    if (String(details).toLowerCase().includes('unknown column')) {
      return NextResponse.json(
        { error: 'La base de datos del foro necesita migración', details: 'Agrega la columna completed en forum_topics.' },
        { status: 500 }
      );
    }
    console.error('PATCH /api/forum/topics/[id] error:', e);
    return NextResponse.json({ error: 'Error actualizando estado del tema', details }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const conn = await authPool.getConnection();
  try {
    const { id: rawId } = await params;
    const topicId = Number(rawId);
    if (!topicId || topicId <= 0) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    const { searchParams } = new URL(request.url);
    const userId = Number(searchParams.get('userId') || 0);
    if (!userId || userId <= 0) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const gm = await isGM(userId);
    if (!gm) return NextResponse.json({ error: 'No tienes permisos para borrar temas' }, { status: 403 });

    const [topicRows]: any = await conn.query('SELECT id FROM forum_topics WHERE id = ? LIMIT 1', [topicId]);
    if (!topicRows.length) return NextResponse.json({ error: 'Tema no encontrado' }, { status: 404 });

    await conn.beginTransaction();
    await conn.query('DELETE FROM forum_comments WHERE topic_id = ?', [topicId]);
    await conn.query('DELETE FROM forum_topics WHERE id = ? LIMIT 1', [topicId]);
    await conn.commit();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e: any) {
    await conn.rollback();
    console.error('DELETE /api/forum/topics/[id] error:', e);
    return NextResponse.json({ error: 'Error eliminando tema', details: e.message }, { status: 500 });
  } finally {
    conn.release();
  }
}
