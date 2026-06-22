type StorageParser<T> = (value: unknown) => T;
const APP_DATABASE_NAME = "psy-perspective-db";
const APP_DATABASE_VERSION = 1;
const APP_DATABASE_STORE = "kv";

function getBrowserStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function dispatchStorageEvent(eventName?: string) {
  if (!eventName || typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(eventName));
}

function openAppDatabase() {
  if (typeof window === "undefined" || typeof window.indexedDB === "undefined") {
    return Promise.resolve<IDBDatabase | null>(null);
  }

  return new Promise<IDBDatabase | null>((resolve) => {
    const request = window.indexedDB.open(APP_DATABASE_NAME, APP_DATABASE_VERSION);

    request.onerror = () => resolve(null);
    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(APP_DATABASE_STORE)) {
        database.createObjectStore(APP_DATABASE_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

function parseStoredValue<T>(
  rawValue: string | null | undefined,
  fallback: T,
  parse: StorageParser<T>
) {
  if (!rawValue) {
    return fallback;
  }

  try {
    return parse(JSON.parse(rawValue));
  } catch {
    return fallback;
  }
}

export function readStorageJSON<T>(
  key: string,
  fallback: T,
  parse: StorageParser<T>,
  options?: { clearInvalid?: boolean }
) {
  const storage = getBrowserStorage();

  if (!storage) {
    return fallback;
  }

  let rawValue: string | null = null;

  try {
    rawValue = storage.getItem(key);
  } catch {
    return fallback;
  }

  if (!rawValue) {
    return fallback;
  }

  try {
    return parse(JSON.parse(rawValue));
  } catch {
    if (options?.clearInvalid ?? true) {
      storage.removeItem(key);
    }

    return fallback;
  }
}

export function writeStorageJSON<T>(key: string, value: T, eventName?: string) {
  const storage = getBrowserStorage();

  if (!storage) {
    return;
  }

  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    return;
  }
  dispatchStorageEvent(eventName);
}

export async function readDatabaseJSON<T>(key: string, fallback: T, parse: StorageParser<T>) {
  const database = await openAppDatabase();

  if (!database) {
    return fallback;
  }

  return new Promise<T>((resolve) => {
    const transaction = database.transaction(APP_DATABASE_STORE, "readonly");
    const store = transaction.objectStore(APP_DATABASE_STORE);
    const request = store.get(key);

    request.onerror = () => resolve(fallback);
    request.onsuccess = () => resolve(parseStoredValue(typeof request.result === "string" ? request.result : null, fallback, parse));
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => database.close();
    transaction.onabort = () => database.close();
  });
}

export async function writeDatabaseJSON<T>(key: string, value: T, eventName?: string) {
  const database = await openAppDatabase();

  if (!database) {
    return;
  }

  await new Promise<void>((resolve) => {
    const transaction = database.transaction(APP_DATABASE_STORE, "readwrite");
    const store = transaction.objectStore(APP_DATABASE_STORE);

    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      resolve();
    };
    transaction.onabort = () => {
      database.close();
      resolve();
    };

    store.put(JSON.stringify(value), key);
  });

  dispatchStorageEvent(eventName);
}

export function readStorageText(key: string, fallback = "") {
  const storage = getBrowserStorage();

  if (!storage) {
    return fallback;
  }

  try {
    return storage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeStorageText(key: string, value: string, eventName?: string) {
  const storage = getBrowserStorage();

  if (!storage) {
    return;
  }

  try {
    storage.setItem(key, value);
  } catch {
    return;
  }
  dispatchStorageEvent(eventName);
}

export function removeStorageValue(key: string, eventName?: string) {
  const storage = getBrowserStorage();

  if (!storage) {
    return;
  }

  try {
    storage.removeItem(key);
  } catch {
    return;
  }
  dispatchStorageEvent(eventName);
}
