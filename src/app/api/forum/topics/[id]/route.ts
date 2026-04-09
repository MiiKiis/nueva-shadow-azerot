import { NextResponse } from 'next/server';
import { authPool } from '@/lib/db';
import { getAccountAccessSchema, getGMLevel } from '@/lib/gmLevel';

async function ensureTopicColumns() {
  try {
    await authPool.query('ALTER TABLE forum_topics ADD COLUMN author_character VARCHAR(32) NULL DEFAULT NULL AFTER author_id');
  } catch {}
  try {
    await authPool.query('ALTER TABLE forum_topics ADD COLUMN in_review TINYINT(1) NOT NULL DEFAULT 0 AFTER completed');
  } catch {}
  try {
    await authPool.query('ALTER TABLE forum_topics ADD COLUMN denied TINYINT(1) NOT NULL DEFAULT 0 AFTER in_review');
  } catch {}
}

function normalizeLoose(input: string): string {
  return String(input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

type TopicStatus = 'pending' | 'review' | 'solved' | 'denied';

function isInSectionTree(startId: string, rootId: string, parentMap: Map<string, string | null>): boolean {
  let current = String(startId || '');
  const target = String(rootId || '');
  const guard = new Set<string>();

  while (current) {
    if (current === target) return true;
    if (guard.has(current)) break;
    guard.add(current);
    current = String(parentMap.get(current) || '');
  }
  return false;
}

async function resolveMigrationOutcomeCategory(currentCategory: string, nextStatus: TopicStatus): Promise<string | null> {
  const [rows]: any = await authPool.query('SELECT id, label, parent_id FROM forum_sections');
  const sections = Array.isArray(rows) ? rows : [];
  const parentMap = new Map<string, string | null>(
    sections.map((row: any) => [String(row?.id || ''), row?.parent_id ? String(row.parent_id) : null])
  );

  const migrationsParent = sections.find((row: any) => {
    const idNorm = normalizeLoose(String(row?.id || ''));
    const labelNorm = normalizeLoose(String(row?.label || ''));
    return idNorm === 'migrations' || idNorm.includes('migraciones') || labelNorm.includes('migraciones');
  });

  const migrationsParentId = migrationsParent?.id ? String(migrationsParent.id) : null;
  if (migrationsParentId) {
    await authPool.query(
      `INSERT IGNORE INTO forum_sections (id, label, description, icon, color, border, text_color, parent_id, order_index)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'migracion-aceptada',
        'Migración aceptada',
        'Solicitudes de migración aprobadas',
        'CheckCircle2',
        'from-emerald-700 to-emerald-900',
        'border-emerald-700/50',
        'text-emerald-300',
        migrationsParentId,
        80,
      ]
    );
  }

  const [rowsAfter]: any = await authPool.query('SELECT id, label, parent_id FROM forum_sections');
  const refreshedSections = Array.isArray(rowsAfter) ? rowsAfter : sections;
  const refreshedParentMap = new Map<string, string | null>(
    refreshedSections.map((row: any) => [String(row?.id || ''), row?.parent_id ? String(row.parent_id) : null])
  );
  const migrationAcceptedSection = refreshedSections.find((row: any) => {
    const idNorm = normalizeLoose(String(row?.id || ''));
    const labelNorm = normalizeLoose(String(row?.label || ''));
    return idNorm.includes('migracion-aceptada') || labelNorm.includes('migracion aceptada');
  });

  const deletedParent = refreshedSections.find((row: any) => {
    const idNorm = normalizeLoose(String(row?.id || ''));
    const labelNorm = normalizeLoose(String(row?.label || ''));
    return idNorm.includes('personajes-borrados') ||
      idNorm.includes('personajes_borrados') ||
      idNorm.includes('deleted-characters') ||
      labelNorm.includes('personajes borrados') ||
      labelNorm.includes('personajes eliminados');
  });

  if (!deletedParent?.id) return null;

  const deletedParentId = deletedParent?.id ? String(deletedParent.id) : '';
  const children = refreshedSections.filter((row: any) => String(row?.parent_id || '') === deletedParentId);
  const solvedChild = children.find((row: any) => {
    const idNorm = normalizeLoose(String(row?.id || ''));
    const labelNorm = normalizeLoose(String(row?.label || ''));
    return idNorm.includes('solucionado') || labelNorm.includes('solucionado');
  });
  const deniedChild = children.find((row: any) => {
    const idNorm = normalizeLoose(String(row?.id || ''));
    const labelNorm = normalizeLoose(String(row?.label || ''));
    return idNorm.includes('denegado') || labelNorm.includes('denegado');
  });

  const currentCategoryId = String(currentCategory || '');
  const inDeletedFlow = deletedParentId
    ? isInSectionTree(currentCategoryId, deletedParentId, refreshedParentMap)
    : false;

  const inMigrationsFlow = migrationsParentId
    ? isInSectionTree(currentCategoryId, migrationsParentId, refreshedParentMap)
    : false;

  if (nextStatus === 'solved' && migrationAcceptedSection?.id && (inMigrationsFlow || inDeletedFlow)) {
    return String(migrationAcceptedSection.id);
  }

  if (!inDeletedFlow) {
    if ((nextStatus === 'pending' || nextStatus === 'review') && migrationsParentId && migrationAcceptedSection?.id) {
      const acceptedId = String(migrationAcceptedSection.id);
      if (currentCategoryId === acceptedId) return migrationsParentId;
    }
    return null;
  }

  if (nextStatus === 'denied' && deniedChild?.id) return String(deniedChild.id);
  if ((nextStatus === 'pending' || nextStatus === 'review') && currentCategoryId !== deletedParentId) {
    return deletedParentId;
  }

  return null;
}

// Reutiliza la misma promise de migración del route padre para no duplicar checks
async function isGM(userId: number): Promise<boolean> {
  const lvl = await getGMLevel(userId);
  return lvl >= 3;
}

async function isStaff(userId: number): Promise<boolean> {
  const lvl = await getGMLevel(userId);
  return lvl >= 1;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureTopicColumns();

    const { id: rawId } = await params;
    const id = Number(rawId);
    if (!id || id <= 0) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    // Increment view count (fire-and-forget — no espera para no bloquear la respuesta)
    authPool.query('UPDATE forum_topics SET views = views + 1 WHERE id = ?', [id]).catch(() => {});

    const schema = await getAccountAccessSchema();

    const [rows]: any = await authPool.query(
      `SELECT
         t.id, t.title, t.category, t.pinned, t.locked,
         COALESCE(t.completed, 0) AS completed,
         COALESCE(t.in_review, 0) AS in_review,
         COALESCE(t.denied, 0) AS denied,
         t.views, t.created_at,
         t.author_id, COALESCE(NULLIF(t.author_character, ''), COALESCE(a.username, '[Deleted]')) AS author_username,
         MAX(aa.\`${schema.gmCol}\`) AS gmlevel
       FROM forum_topics t
       LEFT JOIN account a ON t.author_id = a.id
       LEFT JOIN account_access aa ON a.id = aa.\`${schema.idCol}\`
       WHERE t.id = ?
       GROUP BY t.id, t.author_id, a.username`,
      [id]
    );

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
        in_review: !!t.in_review,
        denied: !!t.denied,
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
    const { id: rawId } = await params;
    const topicId = Number(rawId);
    if (!topicId || topicId <= 0) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    await ensureTopicColumns();

    const body = await request.json();
    const userId    = Number(body?.userId || 0);
    const completed = Boolean(body?.completed);
    const inReview = Boolean(body?.inReview);
    const requestedStatus = String(body?.status || '').trim().toLowerCase();
    const targetCategory = String(body?.targetCategory || '').trim();

    if (!userId || userId <= 0) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const staff = await isStaff(userId);
    if (!staff) return NextResponse.json({ error: 'No tienes permisos para marcar tema' }, { status: 403 });

    const [topicRows]: any = await authPool.query(
      'SELECT id, category, COALESCE(completed,0) AS completed, COALESCE(in_review,0) AS in_review, COALESCE(denied,0) AS denied FROM forum_topics WHERE id = ? LIMIT 1',
      [topicId]
    );
    if (!topicRows.length) return NextResponse.json({ error: 'Tema no encontrado' }, { status: 404 });

    const currentRow = topicRows[0];
    let nextStatus: TopicStatus = Number(currentRow?.denied || 0) === 1
      ? 'denied'
      : Number(currentRow?.completed || 0) === 1
        ? 'solved'
        : Number(currentRow?.in_review || 0) === 1
          ? 'review'
          : 'pending';

    if (requestedStatus === 'pending' || requestedStatus === 'review' || requestedStatus === 'solved' || requestedStatus === 'denied') {
      nextStatus = requestedStatus;
    } else if (body && Object.prototype.hasOwnProperty.call(body, 'inReview')) {
      nextStatus = inReview ? 'review' : 'pending';
    } else if (body && Object.prototype.hasOwnProperty.call(body, 'completed')) {
      nextStatus = completed ? 'solved' : 'pending';
    }

    const nextCompleted = nextStatus === 'solved' ? 1 : 0;
    const nextInReview = nextStatus === 'review' ? 1 : 0;
    const nextDenied = nextStatus === 'denied' ? 1 : 0;

    const currentCategory = String(currentRow?.category || '');
    let nextCategory = await resolveMigrationOutcomeCategory(currentCategory, nextStatus);

    if (targetCategory) {
      const [sectionRows]: any = await authPool.query('SELECT id FROM forum_sections WHERE id = ? LIMIT 1', [targetCategory]);
      if (!sectionRows?.length) {
        return NextResponse.json({ error: 'La sección destino no existe.' }, { status: 400 });
      }
      nextCategory = targetCategory;
    }

    if (nextCategory && nextCategory !== currentCategory) {
      await authPool.query(
        'UPDATE forum_topics SET completed = ?, in_review = ?, denied = ?, category = ?, updated_at = NOW() WHERE id = ? LIMIT 1',
        [nextCompleted, nextInReview, nextDenied, nextCategory, topicId]
      );
    } else {
      await authPool.query(
        'UPDATE forum_topics SET completed = ?, in_review = ?, denied = ?, updated_at = NOW() WHERE id = ? LIMIT 1',
        [nextCompleted, nextInReview, nextDenied, topicId]
      );
    }

    return NextResponse.json({ success: true, status: nextStatus, completed: !!nextCompleted, in_review: !!nextInReview, denied: !!nextDenied }, { status: 200 });
  } catch (e: any) {
    console.error('PATCH /api/forum/topics/[id] error:', e);
    return NextResponse.json({ error: 'Error actualizando estado del tema', details: e.message }, { status: 500 });
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
