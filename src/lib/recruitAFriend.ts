import crypto from 'crypto';
import pool, { authPool } from '@/lib/db';
import { executeSoapCommand } from '@/lib/soap';

export const RAF_RECRUITER_REWARD_VP = 2;
export const RAF_RECRUIT_REWARD_VP = 3;
export const RAF_STARTER_BAG_ITEM = 21841;
export const RAF_STARTER_BAG_COUNT = 4;
export const RAF_STARTER_GOLD = 300;

export type RecruitReferralRow = {
  id: number;
  recruiter_account_id: number;
  recruiter_username: string;
  friend_name: string;
  friend_email: string;
  invite_token: string;
  status: 'invited' | 'registered' | 'rewarded';
  recruited_account_id: number | null;
  recruited_username: string | null;
  starter_bags_claimed: number;
  recruit_reward_given: number;
  accepted_at: string | null;
  created_at: string;
};

export function buildRecruitInviteToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

export async function ensureRecruitTables(connection: Awaited<ReturnType<typeof authPool.getConnection>> | typeof authPool) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS recruit_a_friend_referrals (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      recruiter_account_id INT UNSIGNED NOT NULL,
      recruiter_username VARCHAR(32) NOT NULL DEFAULT '',
      friend_name VARCHAR(64) NOT NULL DEFAULT '',
      friend_email VARCHAR(120) NOT NULL DEFAULT '',
      invite_token VARCHAR(96) NOT NULL,
      status ENUM('invited','registered','rewarded') NOT NULL DEFAULT 'invited',
      recruited_account_id INT UNSIGNED NULL,
      recruited_username VARCHAR(32) NULL,
      starter_bags_claimed TINYINT(1) NOT NULL DEFAULT 0,
      starter_bags_claimed_at TIMESTAMP NULL DEFAULT NULL,
      recruit_reward_given TINYINT(1) NOT NULL DEFAULT 0,
      recruit_reward_given_at TIMESTAMP NULL DEFAULT NULL,
      trigger_character_guid INT UNSIGNED NULL,
      accepted_at TIMESTAMP NULL DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_invite_token (invite_token),
      UNIQUE KEY uq_recruited_account (recruited_account_id),
      KEY idx_recruiter (recruiter_account_id, created_at),
      KEY idx_status (status, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  const [columnRows]: any = await connection.query('SHOW COLUMNS FROM recruit_a_friend_referrals');
  const existingColumns = new Set<string>((columnRows || []).map((row: any) => String(row?.Field || '')));

  const ensureColumn = async (name: string, definition: string) => {
    if (existingColumns.has(name)) return;
    await connection.query(`ALTER TABLE recruit_a_friend_referrals ADD COLUMN ${definition}`);
    existingColumns.add(name);
  };

  const runSafeAlter = async (sql: string) => {
    try {
      await connection.query(sql);
    } catch (error: any) {
      // Non-critical migration failures should not block API usage.
      console.warn('ensureRecruitTables migration warning:', error?.message || error);
    }
  };

  await ensureColumn('recruiter_username', "recruiter_username VARCHAR(32) NOT NULL DEFAULT '' AFTER recruiter_account_id");
  await ensureColumn('friend_name', "friend_name VARCHAR(64) NOT NULL DEFAULT '' AFTER recruiter_username");
  await ensureColumn('friend_email', "friend_email VARCHAR(120) NOT NULL DEFAULT '' AFTER friend_name");
  await ensureColumn('invite_token', 'invite_token VARCHAR(96) NOT NULL AFTER friend_email');
  await ensureColumn('status', "status ENUM('invited','registered','rewarded') NOT NULL DEFAULT 'invited' AFTER invite_token");
  await ensureColumn('recruited_account_id', 'recruited_account_id INT UNSIGNED NULL AFTER status');
  await ensureColumn('recruited_username', 'recruited_username VARCHAR(32) NULL AFTER recruited_account_id');
  await ensureColumn('starter_bags_claimed', 'starter_bags_claimed TINYINT(1) NOT NULL DEFAULT 0 AFTER recruited_username');
  await ensureColumn('starter_bags_claimed_at', 'starter_bags_claimed_at TIMESTAMP NULL DEFAULT NULL AFTER starter_bags_claimed');
  await ensureColumn('recruit_reward_given', 'recruit_reward_given TINYINT(1) NOT NULL DEFAULT 0 AFTER starter_bags_claimed_at');
  await ensureColumn('recruit_reward_given_at', 'recruit_reward_given_at TIMESTAMP NULL DEFAULT NULL AFTER recruit_reward_given');
  await ensureColumn('trigger_character_guid', 'trigger_character_guid INT UNSIGNED NULL AFTER recruit_reward_given_at');
  await ensureColumn('accepted_at', 'accepted_at TIMESTAMP NULL DEFAULT NULL AFTER trigger_character_guid');
  await ensureColumn('created_at', 'created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER accepted_at');

  // Ensure enum includes rewarded in existing installations.
  await runSafeAlter(
    "ALTER TABLE recruit_a_friend_referrals MODIFY COLUMN status ENUM('invited','registered','rewarded') NOT NULL DEFAULT 'invited'"
  );

  const [indexRows]: any = await connection.query('SHOW INDEX FROM recruit_a_friend_referrals');
  const existingIndexes = new Set<string>((indexRows || []).map((row: any) => String(row?.Key_name || '')));

  if (!existingIndexes.has('uq_invite_token')) {
    await runSafeAlter('ALTER TABLE recruit_a_friend_referrals ADD UNIQUE KEY uq_invite_token (invite_token)');
  }
  if (!existingIndexes.has('uq_recruited_account')) {
    await runSafeAlter('ALTER TABLE recruit_a_friend_referrals ADD UNIQUE KEY uq_recruited_account (recruited_account_id)');
  }
  if (!existingIndexes.has('idx_recruiter')) {
    await runSafeAlter('ALTER TABLE recruit_a_friend_referrals ADD KEY idx_recruiter (recruiter_account_id, created_at)');
  }
  if (!existingIndexes.has('idx_status')) {
    await runSafeAlter('ALTER TABLE recruit_a_friend_referrals ADD KEY idx_status (status, created_at)');
  }
}

function sanitizeMailText(input: string): string {
  return String(input || '').replace(/[\r\n]+/g, ' ').replace(/"/g, "'").trim();
}

async function getPrimaryCharacterName(accountId: number): Promise<string | null> {
  const [rows]: any = await pool.query(
    `SELECT name
     FROM characters
     WHERE account = ?
     ORDER BY level DESC, guid ASC
     LIMIT 1`,
    [accountId]
  );

  const characterName = String(rows?.[0]?.name || '').trim();
  return characterName || null;
}

async function getCharacterNameForAccountGuid(accountId: number, targetGuid: number): Promise<string | null> {
  const [rows]: any = await pool.query(
    `SELECT name
     FROM characters
     WHERE account = ? AND guid = ?
     LIMIT 1`,
    [accountId, targetGuid]
  );

  const characterName = String(rows?.[0]?.name || '').trim();
  return characterName || null;
}

export async function deliverRecruitStarterBags(accountId: number, targetCharacterGuid?: number): Promise<{ deliveredTo: string; gold: number }> {
  let characterName: string | null = null;

  if (Number.isInteger(Number(targetCharacterGuid)) && Number(targetCharacterGuid) > 0) {
    characterName = await getCharacterNameForAccountGuid(accountId, Number(targetCharacterGuid));
    if (!characterName) {
      throw new Error('El personaje seleccionado no pertenece a tu cuenta o no existe.');
    }
  } else {
    characterName = await getPrimaryCharacterName(accountId);
  }

  if (!characterName) {
    throw new Error('No se encontró un personaje en la cuenta reclutada para enviar el kit inicial.');
  }

  const subject = sanitizeMailText('Recluta un Amigo - Bienvenida');
  const body = sanitizeMailText('Gracias por unirte por invitacion. Aqui tienes 4 bolsas de bienvenida y 300 de oro.');
  await executeSoapCommand(
    `.send items ${characterName} "${subject}" "${body}" ${RAF_STARTER_BAG_ITEM}:${RAF_STARTER_BAG_COUNT}`
  );
  await executeSoapCommand(`.send money ${characterName} "${subject}" "${body}" ${RAF_STARTER_GOLD * 10000}`);

  return { deliveredTo: characterName, gold: RAF_STARTER_GOLD };
}

async function getHighestCharacterForAccount(accountId: number): Promise<{ guid: number; name: string; level: number } | null> {
  const [rows]: any = await pool.query(
    `SELECT guid, name, level
     FROM characters
     WHERE account = ?
     ORDER BY level DESC, guid ASC
     LIMIT 1`,
    [accountId]
  );

  if (!rows || rows.length === 0) return null;
  return {
    guid: Number(rows[0].guid || 0),
    name: String(rows[0].name || ''),
    level: Number(rows[0].level || 0),
  };
}

export async function claimRecruitLevel80Rewards(params: {
  requesterAccountId: number;
  referralId?: number;
}): Promise<{ awarded: boolean; message: string }> {
  let connection: Awaited<ReturnType<typeof authPool.getConnection>> | null = null;

  try {
    connection = await authPool.getConnection();
    await ensureRecruitTables(connection);
    await connection.beginTransaction();

    const requesterAccountId = Number(params.requesterAccountId || 0);
    const referralId = Number(params.referralId || 0);

    if (!Number.isInteger(requesterAccountId) || requesterAccountId <= 0) {
      await connection.rollback();
      return { awarded: false, message: 'Cuenta solicitante inválida.' };
    }

    let rows: any[] = [];
    if (Number.isInteger(referralId) && referralId > 0) {
      const [result]: any = await connection.query(
        `SELECT *
         FROM recruit_a_friend_referrals
         WHERE id = ?
           AND (recruiter_account_id = ? OR recruited_account_id = ?)
         LIMIT 1
         FOR UPDATE`,
        [referralId, requesterAccountId, requesterAccountId]
      );
      rows = result || [];
    } else {
      const [result]: any = await connection.query(
        `SELECT *
         FROM recruit_a_friend_referrals
         WHERE recruited_account_id = ?
         LIMIT 1
         FOR UPDATE`,
        [requesterAccountId]
      );
      rows = result || [];
    }

    if (!rows || rows.length === 0) {
      await connection.rollback();
      return { awarded: false, message: 'No hay referencia de reclutamiento válida para reclamar.' };
    }

    const referral = rows[0] as RecruitReferralRow;
    if (Number(referral.recruit_reward_given || 0) === 1) {
      await connection.rollback();
      return { awarded: false, message: 'Recompensa de nivel 80 ya otorgada.' };
    }

    const recruitedAccountId = Number(referral.recruited_account_id || 0);
    if (!Number.isInteger(recruitedAccountId) || recruitedAccountId <= 0) {
      await connection.rollback();
      return { awarded: false, message: 'El invitado aún no se registró con el enlace especial.' };
    }

    const topCharacter = await getHighestCharacterForAccount(recruitedAccountId);
    if (!topCharacter || topCharacter.level < 80) {
      await connection.rollback();
      return { awarded: false, message: 'El reclutado todavía no alcanza nivel 80.' };
    }

    await connection.query(
      'UPDATE account SET vp = vp + ? WHERE id = ?',
      [RAF_RECRUIT_REWARD_VP, recruitedAccountId]
    );
    await connection.query(
      'UPDATE account SET vp = vp + ? WHERE id = ?',
      [RAF_RECRUITER_REWARD_VP, Number(referral.recruiter_account_id)]
    );

    await connection.query(
      `UPDATE recruit_a_friend_referrals
       SET recruit_reward_given = 1,
           recruit_reward_given_at = NOW(),
           trigger_character_guid = ?,
           status = 'rewarded'
       WHERE id = ?`,
      [topCharacter.guid, Number(referral.id)]
    );

    await connection.commit();

    try {
      const recruiterChar = await getPrimaryCharacterName(Number(referral.recruiter_account_id));
      if (recruiterChar) {
        await executeSoapCommand(
          `.send mail ${recruiterChar} "Recluta un Amigo" "Tu reclutado llego a nivel 80. Recibiste ${RAF_RECRUITER_REWARD_VP} Estelas."`
        );
      }
      if (topCharacter.name) {
        await executeSoapCommand(
          `.send mail ${topCharacter.name} "Recluta un Amigo" "Felicidades por llegar a nivel 80. Recibiste ${RAF_RECRUIT_REWARD_VP} Estelas."`
        );
      }
    } catch {
      // Best-effort mail; reward already committed.
    }

    return { awarded: true, message: 'Recompensas de nivel 80 otorgadas.' };
  } catch (error: any) {
    if (connection) {
      try {
        await connection.rollback();
      } catch {
        // ignore rollback errors
      }
    }
    console.error('claimRecruitLevel80Rewards error:', error);
    return { awarded: false, message: 'Error recuperando recompensas de nivel 80.' };
  } finally {
    if (connection) connection.release();
  }
}
