import { promises as fs } from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const dataFile = path.join(dataDir, 'account-avatars.json');
const avatarDir = path.join(process.cwd(), 'public', 'avatares');

type AvatarMap = Record<string, string>;

async function ensureDataFile() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, '{}', 'utf8');
  }
}

export async function readAvatarMap(): Promise<AvatarMap> {
  await ensureDataFile();
  const raw = await fs.readFile(dataFile, 'utf8');
  return JSON.parse(raw || '{}') as AvatarMap;
}

export async function writeAvatarMap(map: AvatarMap) {
  await ensureDataFile();
  await fs.writeFile(dataFile, JSON.stringify(map, null, 2), 'utf8');
}

export async function listAvailableAvatars() {
  const files = await fs.readdir(avatarDir);
  return files
    .filter((file) => /\.(gif|png|jpg|jpeg|webp)$/i.test(file))
    .sort((left, right) => left.localeCompare(right));
}
