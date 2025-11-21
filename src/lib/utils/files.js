import fs from 'node:fs/promises';
import path from 'node:path';

export const readJson = async (filePath, defaultValue = null) => {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return defaultValue;
    }
    throw error;
  }
};

export const writeJson = async (filePath, data, options = {}) => {
  const dirMode = options.dirMode ?? 0o700;
  const fileMode = options.fileMode ?? 0o600;
  await fs.mkdir(path.dirname(filePath), { recursive: true, mode: dirMode });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, { encoding: 'utf8', mode: fileMode });
};

