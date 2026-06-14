(function () {
  const DB_NAME = "app-gym-db";
  const DB_VERSION = 1;
  const STORE_NAME = "kv";
  const LOGS_KEY = "logs";
  const DRAFT_KEY = "draft";
  const FALLBACK_KEY = "app-gym-workouts";
  const FALLBACK_DRAFT_KEY = "app-gym-draft";

  const syncConfig = window.APP_SYNC_CONFIG || {
    enabled: false,
    endpoint: "",
    apiKey: "",
    pullOnStart: false
  };

  function openDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function withStore(mode, handler) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode);
      const store = tx.objectStore(STORE_NAME);
      const result = handler(store);

      tx.oncomplete = () => {
        db.close();
        resolve(result);
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  }

  async function readValue(key) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        db.close();
        resolve(request.result ?? null);
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  }

  async function writeValue(key, value) {
    return withStore("readwrite", (store) => {
      store.put(value, key);
    });
  }

  async function init() {
    const persisted = navigator.storage?.persist ? await navigator.storage.persist() : false;
    return { persisted };
  }

  async function getLogs() {
    try {
      const stored = await readValue(LOGS_KEY);
      if (Array.isArray(stored)) {
        return stored;
      }

      const fallback = localStorage.getItem(FALLBACK_KEY);
      return fallback ? JSON.parse(fallback) : [];
    } catch (error) {
      console.error("No se pudieron leer los entrenamientos", error);
      return [];
    }
  }

  async function saveLogs(logs) {
    await writeValue(LOGS_KEY, logs);
    localStorage.setItem(FALLBACK_KEY, JSON.stringify(logs));
    await pushRemote(logs);
  }

  async function getDraft() {
    try {
      const stored = await readValue(DRAFT_KEY);
      if (stored && typeof stored === "object") {
        return stored;
      }

      const fallback = localStorage.getItem(FALLBACK_DRAFT_KEY);
      return fallback ? JSON.parse(fallback) : null;
    } catch (error) {
      console.error("No se pudo leer el borrador del entrenamiento", error);
      return null;
    }
  }

  async function saveDraft(draft) {
    if (!draft) {
      await clearDraft();
      return;
    }

    await writeValue(DRAFT_KEY, draft);
    localStorage.setItem(FALLBACK_DRAFT_KEY, JSON.stringify(draft));
  }

  async function clearDraft() {
    await writeValue(DRAFT_KEY, null);
    localStorage.removeItem(FALLBACK_DRAFT_KEY);
  }

  async function clearLogs() {
    await saveLogs([]);
  }

  async function exportLogs() {
    const logs = await getLogs();
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      logs
    };
  }

  async function importLogs(payload) {
    const parsed = typeof payload === "string" ? JSON.parse(payload) : payload;
    const logs = Array.isArray(parsed) ? parsed : parsed.logs;
    if (!Array.isArray(logs)) {
      throw new Error("Formato de copia no valido");
    }

    await saveLogs(logs);
    return logs;
  }

  async function pushRemote(logs) {
    if (!syncConfig.enabled || !syncConfig.endpoint) {
      return { synced: false, reason: "disabled" };
    }

    try {
      const response = await fetch(syncConfig.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(syncConfig.apiKey ? { Authorization: `Bearer ${syncConfig.apiKey}` } : {})
        },
        body: JSON.stringify({
          updatedAt: new Date().toISOString(),
          logs
        })
      });

      if (!response.ok) {
        throw new Error(`Error remoto ${response.status}`);
      }

      return { synced: true };
    } catch (error) {
      console.error("No se pudo sincronizar en remoto", error);
      return { synced: false, reason: error.message };
    }
  }

  async function pullRemote() {
    if (!syncConfig.enabled || !syncConfig.endpoint || !syncConfig.pullOnStart) {
      return null;
    }

    try {
      const response = await fetch(syncConfig.endpoint, {
        method: "GET",
        headers: {
          ...(syncConfig.apiKey ? { Authorization: `Bearer ${syncConfig.apiKey}` } : {})
        }
      });

      if (!response.ok) {
        throw new Error(`Error remoto ${response.status}`);
      }

      const data = await response.json();
      const logs = Array.isArray(data) ? data : data.logs;
      if (Array.isArray(logs)) {
        await writeValue(LOGS_KEY, logs);
        localStorage.setItem(FALLBACK_KEY, JSON.stringify(logs));
        return logs;
      }
    } catch (error) {
      console.error("No se pudo recuperar la copia remota", error);
    }

    return null;
  }

  window.WorkoutStorage = {
    init,
    getLogs,
    saveLogs,
    getDraft,
    saveDraft,
    clearDraft,
    clearLogs,
    exportLogs,
    importLogs,
    pullRemote,
    syncConfig
  };
})();
