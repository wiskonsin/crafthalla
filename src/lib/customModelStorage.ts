import { openDB } from 'idb'

const DB_NAME = 'rts-custom-models'
const DB_VERSION = 2
const BLOB_STORE = 'fbx-blobs'
const TEXTURE_STORE = 'texture-blobs'
const CONFIG_STORE = 'config'

export async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(BLOB_STORE)) {
        db.createObjectStore(BLOB_STORE)
      }
      if (!db.objectStoreNames.contains(TEXTURE_STORE)) {
        db.createObjectStore(TEXTURE_STORE)
      }
      if (!db.objectStoreNames.contains(CONFIG_STORE)) {
        db.createObjectStore(CONFIG_STORE)
      }
    },
  })
}

export async function saveFbxBlob(id: string, blob: Blob): Promise<void> {
  const db = await getDB()
  await db.put(BLOB_STORE, blob, id)
}

export async function getFbxBlob(id: string): Promise<Blob | undefined> {
  const db = await getDB()
  return db.get(BLOB_STORE, id)
}

export async function deleteFbxBlob(id: string): Promise<void> {
  const db = await getDB()
  await db.delete(BLOB_STORE, id)
}

export async function saveTextureBlob(modelType: string, path: string, blob: Blob): Promise<void> {
  const db = await getDB()
  const key = `${modelType}::${path}`
  await db.put(TEXTURE_STORE, blob, key)
}

export async function getTextureBlob(modelType: string, path: string): Promise<Blob | undefined> {
  const db = await getDB()
  const key = `${modelType}::${path}`
  return db.get(TEXTURE_STORE, key)
}

export async function getAllTexturePaths(modelType: string): Promise<string[]> {
  try {
    const db = await getDB()
    const tx = db.transaction(TEXTURE_STORE, 'readonly')
    const store = tx.objectStore(TEXTURE_STORE)
    const keys = await store.getAllKeys()
    const prefix = `${modelType}::`
    return (keys as string[])
      .filter((k) => typeof k === 'string' && k.startsWith(prefix))
      .map((k) => (k as string).slice(prefix.length))
  } catch {
    return []
  }
}

export async function deleteTextureBlobs(modelType: string): Promise<void> {
  const db = await getDB()
  const paths = await getAllTexturePaths(modelType)
  const tx = db.transaction(TEXTURE_STORE, 'readwrite')
  const store = tx.objectStore(TEXTURE_STORE)
  for (const path of paths) {
    await store.delete(`${modelType}::${path}`)
  }
}

export async function saveConfig(config: Record<string, unknown>): Promise<void> {
  const db = await getDB()
  await db.put(CONFIG_STORE, config, 'main')
}

export async function loadConfig(): Promise<Record<string, unknown> | undefined> {
  const db = await getDB()
  return db.get(CONFIG_STORE, 'main')
}
