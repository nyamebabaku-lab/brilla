// Recorded word audio lives in IndexedDB (too big for localStorage). Keys look like 'twi:greet0'.
const DB = 'brilla-audio';
const STORE = 'clips';

function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function tx(mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const out = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(out?.result);
    t.onerror = () => reject(t.error);
  });
}

export const putClip = (key, blob) => tx('readwrite', (s) => s.put(blob, key));
export const getClip = (key) => tx('readonly', (s) => s.get(key));
export const deleteClip = (key) => tx('readwrite', (s) => s.delete(key));

export const blobToDataURL = (blob) =>
  new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.readAsDataURL(blob);
  });
export const dataURLToBlob = (url) => fetch(url).then((r) => r.blob());
