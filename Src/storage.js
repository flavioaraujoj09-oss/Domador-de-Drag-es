// Substitui o window.storage do ambiente de artefatos do Claude por um
// armazenamento real no navegador (localStorage), que persiste de verdade
// entre sessões, fechamentos de aba e reinicializações do computador.
//
// Mantém a MESMA assinatura de API (get/set/delete/list) para que o código
// do jogo (copiado do artefato) funcione sem nenhuma alteração.

const PREFIX = "dragon-tamer:";

function fullKey(key, shared) {
  return PREFIX + (shared ? "shared:" : "personal:") + key;
}

export const storage = {
  async get(key, shared = false) {
    try {
      const raw = localStorage.getItem(fullKey(key, shared));
      if (raw === null) return null;
      return { key, value: raw, shared };
    } catch (e) {
      return null;
    }
  },

  async set(key, value, shared = false) {
    try {
      localStorage.setItem(fullKey(key, shared), value);
      return { key, value, shared };
    } catch (e) {
      return null;
    }
  },

  async delete(key, shared = false) {
    try {
      localStorage.removeItem(fullKey(key, shared));
      return { key, deleted: true, shared };
    } catch (e) {
      return null;
    }
  },

  async list(prefix = "", shared = false) {
    const base = PREFIX + (shared ? "shared:" : "personal:");
    const full = base + prefix;
    const keys = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(full)) keys.push(k.slice(base.length));
      }
    } catch (e) {}
    return { keys, prefix, shared };
  },
};

// Compatibilidade: o código do jogo chama `window.storage.xxx` diretamente,
// exatamente como fazia dentro do artefato do Claude.
if (typeof window !== "undefined") {
  window.storage = storage;
}
