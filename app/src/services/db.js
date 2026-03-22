import { openDB } from "idb";

const DB_NAME = "rotasbrd-db";
const STORE_NAME = "app-store";
const KEY_NAME = "database";

export async function getAppDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

export async function saveDatabase(database) {
  const db = await getAppDB();
  await db.put(STORE_NAME, database, KEY_NAME);
}

export async function loadDatabase() {
  const db = await getAppDB();
  return db.get(STORE_NAME, KEY_NAME);
}

export async function clearDatabase() {
  const db = await getAppDB();
  await db.delete(STORE_NAME, KEY_NAME);
}
