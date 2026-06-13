type StorageWriteResult = {
  ok: boolean;
  key?: string;
  error?: string;
};

type WscStorageService = {
  getJson?: <T>(key: string, fallback: T) => T;
  setJson?: (key: string, value: unknown) => StorageWriteResult;
};

function getStorageService(): WscStorageService | null {
  return window.WSC_STORAGE_SERVICE || null;
}

export function readJsonFromBrowserStorage<T>(key: string, fallback: T): T {
  const service = getStorageService();
  if (service?.getJson) {
    return service.getJson(key, fallback);
  }

  try {
    const saved = window.localStorage.getItem(key);
    return saved ? JSON.parse(saved) as T : fallback;
  } catch (_error) {
    return fallback;
  }
}

export function writeJsonToBrowserStorage(key: string, value: unknown): StorageWriteResult {
  const service = getStorageService();
  if (service?.setJson) {
    return service.setJson(key, value);
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return { ok: true, key };
  } catch (error) {
    return { ok: false, key, error: String(error instanceof Error ? error.message : error) };
  }
}
