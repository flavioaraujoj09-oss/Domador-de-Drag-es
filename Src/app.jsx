import React, { useState, useEffect, useRef, useCallback } from "react";
import { Sword, Shield, Flame, Zap, Coins, Star, Skull, Swords, ShieldAlert, ChevronRight, RotateCcw, Home, Briefcase, Trophy, Clock, User, BookOpen, Lock, Save, Users, MousePointerClick } from "lucide-react";
import "./storage.js"; // liga window.storage a um localStorage real do navegador

/* =========================================================
   CONFIG
   ========================================================= */
const STORAGE_KEY = "dragon-tamer-save-v12";
// Pasta onde ficam as artes reais (opcionais). Se a imagem não existir, o
// jogo usa automaticamente o desenho SVG como visual de reserva — nada quebra.
const IMG_BASE = "/images";
const PLAYER_ID_KEY = "dragon-tamer-player-id";
const LEADERBOARD_PREFIX = "hall-of-fame:";
const MAX_OFFLINE_SECONDS = 4 * 60 * 60;

const DRAGON_COLORS = [
  { id: "sangue", name: "Escama de Sangue", grad: "from-red-950 via-red-800 to-rose-950", glow: "shadow-red-900/70", ring: "ring-red-700", hex: "#7f1d1d", light: "#ef4444", dark: "#2b0a0a", eye: "#fde047" },
  { id: "abissal", name: "Escama Abissal", grad: "from-slate-950 via-purple-950 to-black", glow: "shadow-purple-900/70", ring: "ring-purple-800", hex: "#3b0764", light: "#a855f7", dark: "#150526", eye: "#e9d5ff" },
  { id: "veneno", name: "Escama Venenosa", grad: "from-emerald-950 via-lime-900 to-green-950", glow: "shadow-lime-900/70", ring: "ring-lime-700", hex: "#14532d", light: "#4ade80", dark: "#052e16", eye: "#fef08a" },
  { id: "gelido", name: "Escama Gélida", grad: "from-cyan-950 via-slate-800 to-blue-950", glow: "shadow-cyan-900/70", ring: "ring-cyan-700", hex: "#164e63", light: "#22d3ee", dark: "#082f36", eye: "#e0f2fe" },
  { id: "cinzas", name: "Escama de Cinzas", grad: "from-neutral-900 via-orange-950 to-neutral-950", glow: "shadow-orange-900/70", ring: "ring-orange-800", hex: "#431407", light: "#fb923c", dark: "#1c0a03", eye: "#fde68a" },
];

const CLASSES = [
  { id: "guerreiro", name: "Guerreiro", icon: "🗡️", desc: "Mais força bruta ao lutar", statBonus: { forca: 2 } },
  { id: "cacador", name: "Caçador", icon: "🏹", desc: "Mais precisão e velocidade", statBonus: { velocidade: 2 } },
  { id: "arcanista", name: "Arcanista", icon: "🔮", desc: "Fortalece a defesa mística", statBonus: { defesa: 2 } },
];

// Evolução: o ovo racha logo no início e o dragão evolui junto do domador —
// a cada 2 níveis do personagem, o dragão sobe 1 nível automaticamente.
const EVOLUTION_STAGES = [
  { min: 1, max: 1, name: "Ovo Adormecido", icon: "🥚", scale: 0.5, kind: "egg", imgKey: "egg" },
  { min: 2, max: 2, name: "Ovo Rachado", icon: "🥚", scale: 0.58, kind: "cracked", imgKey: "cracked" },
  { min: 3, max: 5, name: "Filhote Recém-Nascido", icon: "🐣", scale: 0.68, kind: "dragon", wingTier: 1, imgKey: "stage1" },
  { min: 6, max: 8, name: "Filhote das Sombras", icon: "🐲", scale: 0.78, kind: "dragon", wingTier: 1, imgKey: "stage2" },
  { min: 9, max: 11, name: "Jovem Predador", icon: "🐲", scale: 0.88, kind: "dragon", wingTier: 2, imgKey: "stage3" },
  { min: 12, max: 14, name: "Fera Sombria", icon: "🐉", scale: 0.98, kind: "dragon", wingTier: 2, imgKey: "stage4" },
  { min: 15, max: 17, name: "Predador Ancião", icon: "🐉", scale: 1.08, kind: "dragon", wingTier: 3, imgKey: "stage5" },
  { min: 18, max: 20, name: "Terror Ancestral", icon: "🐉", scale: 1.18, kind: "dragon", wingTier: 3, imgKey: "stage6" },
  { min: 21, max: 25, name: "Flagelo das Trevas", icon: "🐉", scale: 1.28, kind: "dragon", wingTier: 4, imgKey: "stage7" },
  { min: 26, max: 9999, name: "Wyrm Lendário", icon: "🐲", scale: 1.4, kind: "dragon", wingTier: 5, imgKey: "stage8" },
];

const WEAPONS = [
  { id: "adaga", name: "Adaga Amaldiçoada", icon: "🗡️", baseCost: 40, clickBonus: 1 },
  { id: "espada", name: "Espada Rúnica", icon: "⚔️", baseCost: 260, clickBonus: 3 },
  { id: "machado", name: "Machado Carrasco", icon: "🪓", baseCost: 1300, clickBonus: 7 },
  { id: "lanca_rubi", name: "Lança do Dragão Caído", icon: "🔱", baseCost: 7000, clickBonus: 18 },
  { id: "foice", name: "Foice do Ceifador", icon: "⚜️", baseCost: 32000, clickBonus: 50 },
  { id: "martelo_titan", name: "Martelo do Titã Caído", icon: "🔨", baseCost: 140000, clickBonus: 130 },
  { id: "chicote_alma", name: "Chicote Devora-Almas", icon: "⛓️", baseCost: 600000, clickBonus: 320 },
  { id: "cetro_negro", name: "Cetro Negro do Abismo", icon: "🖤", baseCost: 2500000, clickBonus: 780 },
];

const ARMORS = [
  { id: "couro", name: "Couro de Necrofauna", icon: "🥋", baseCost: 65, idlePercent: 0.03 },
  { id: "cota", name: "Cota Sombria", icon: "🛡️", baseCost: 420, idlePercent: 0.06 },
  { id: "placas", name: "Placas do Carrasco", icon: "🏰", baseCost: 2100, idlePercent: 0.11 },
  { id: "escama", name: "Escama de Wyrm Ancião", icon: "🐉", baseCost: 10000, idlePercent: 0.2 },
  { id: "abissal", name: "Manto Abissal", icon: "🌑", baseCost: 42000, idlePercent: 0.35 },
  { id: "carapaca_titan", name: "Carapaça do Titã", icon: "🦾", baseCost: 180000, idlePercent: 0.55 },
  { id: "vestes_eternas", name: "Vestes Eternas", icon: "🌌", baseCost: 750000, idlePercent: 0.8 },
  { id: "nucleo_caos", name: "Núcleo do Caos", icon: "🔮", baseCost: 3200000, idlePercent: 1.15 },
];

const ABILITIES = [
  { id: "sopro", name: "Sopro Necrótico", icon: "🔥", baseCost: 200, stat: "forca", gain: 1 },
  { id: "voo", name: "Voo das Trevas", icon: "🌬️", baseCost: 550, stat: "velocidade", gain: 1 },
  { id: "escamas", name: "Escamas Reforçadas", icon: "🛡️", baseCost: 1300, stat: "defesa", gain: 2 },
  { id: "rugido", name: "Rugido do Abismo", icon: "📣", baseCost: 4000, stat: "forca", gain: 4 },
  { id: "tempestade", name: "Tempestade Arcana", icon: "⚡", baseCost: 11000, stat: "velocidade", gain: 5 },
  { id: "carapaca", name: "Carapaça Espectral", icon: "💀", baseCost: 24000, stat: "defesa", gain: 7 },
  { id: "vida", name: "Vitalidade Sombria", icon: "❤️‍🔥", baseCost: 8000, stat: "vida", gain: 12 },
  { id: "garras", name: "Garras Ancestrais", icon: "🦇", baseCost: 55000, stat: "forca", gain: 9 },
  { id: "instinto", name: "Instinto Predador", icon: "👁️", baseCost: 95000, stat: "velocidade", gain: 10 },
  { id: "couraça", name: "Couraça do Abismo", icon: "🪨", baseCost: 160000, stat: "defesa", gain: 14 },
  { id: "furia", name: "Fúria Primordial", icon: "🌋", baseCost: 400000, stat: "forca", gain: 20 },
];

// Trabalhos: o domador se ausenta um tempo real e volta com recompensa
const JOBS = [
  { id: "caca", name: "Caçar suprimentos na floresta", icon: "🏹", durationSec: 30, gold: 40, xp: 3 },
  { id: "escolta", name: "Escoltar caravana", icon: "🐎", durationSec: 120, gold: 200, xp: 10 },
  { id: "mercenario", name: "Trabalho de mercenário", icon: "🗡️", durationSec: 300, gold: 550, xp: 22 },
  { id: "expedicao", name: "Expedição às ruínas antigas", icon: "🏛️", durationSec: 900, gold: 1900, xp: 60 },
  { id: "contrato", name: "Contrato da Guilda Negra", icon: "📜", durationSec: 1800, gold: 4800, xp: 140 },
];

// Vestimentas do personagem — puramente visual, monta o "sprite" do domador
const CLOTHING = {
  helmet: [
    { id: "capuz", name: "Capuz Surrado", icon: "🎭", baseCost: 45 },
    { id: "elmo_ferro", name: "Elmo de Ferro Negro", icon: "⛑️", baseCost: 380 },
    { id: "coroa_cranio", name: "Coroa de Crânio", icon: "👑", baseCost: 3200 },
  ],
  cloak: [
    { id: "manto_viajante", name: "Manto de Viajante", icon: "🧣", baseCost: 60 },
    { id: "capa_sombras", name: "Capa das Sombras", icon: "🥷", baseCost: 500 },
    { id: "manto_dracônico", name: "Manto Dracônico", icon: "🦇", baseCost: 4200 },
  ],
  weapon_visual: [
    { id: "cajado", name: "Cajado Rúnico", icon: "🪄", baseCost: 50 },
    { id: "espada_visual", name: "Espada à Cintura", icon: "🗡️", baseCost: 420 },
    { id: "tridente", name: "Tridente Sombrio", icon: "🔱", baseCost: 3600 },
  ],
};
const CLOTHING_SLOT_LABELS = { helmet: "Elmo", cloak: "Manto", weapon_visual: "Arma à mostra" };

// A saga: capítulos ligados a cada dificuldade de monstro
const CHAPTERS = [
  { tier: 1, title: "Capítulo I — O Chamado", text: "Lobos espectrais rondam a aldeia. A Ordem dos Domadores precisa saber se você e seu dragão estão prontos para o juramento." },
  { tier: 2, title: "Capítulo II — Sangue nos Pântanos", text: "Ogros corrompidos pela Legião das Escamas Negras destroem vilarejos inteiros. Seu primeiro teste de comando começa aqui." },
  { tier: 3, title: "Capítulo III — Sussurros do Vazio", text: "Criaturas do Vazio se infiltram no mundo através de fendas abertas pela Legião. Algo maior as está guiando." },
  { tier: 4, title: "Capítulo IV — Os Caídos", text: "Antigos cavaleiros da Ordem, corrompidos, agora servem ao inimigo. Derrotá-los é um fardo, não uma vitória." },
  { tier: 5, title: "Capítulo V — O Coração de Pedra", text: "Golens de obsidiana guardam as minas onde a Legião forja armaduras para seus dragões escravizados." },
  { tier: 6, title: "Capítulo VI — A Fenda Negra", text: "Uma hidra nascida da corrupção guarda a fenda que liga este mundo ao covil da Legião das Escamas Negras." },
  { tier: 7, title: "Capítulo VII — Pacto de Ferro", text: "Um general demoníaco da Legião oferece um pacto. Recusar significa guerra aberta — e é isso que você quer." },
  { tier: 8, title: "Capítulo VIII — A Alcateia Eterna", text: "Fenrir das Cinzas lidera os últimos batalhões antes das portas do covil ancestral. Seu exército de dragões começa a se formar." },
  { tier: 9, title: "Capítulo IX — O Wyrm Corrompido", text: "Um dragão irmão, corrompido há eras pela Legião, ataca. Vencê-lo é libertar uma alma, não apenas uma batalha." },
  { tier: 10, title: "Capítulo Final — O Devorador de Mundos", text: "A entidade que comanda a Legião das Escamas Negras desperta. Lidere seu exército de dragões domados nesta batalha final." },
];
const DECORATIONS = [
  { id: "fogueira", name: "Fogueira Ritual", icon: "🔥", baseCost: 100, idleBonus: 0.03 },
  { id: "ossario", name: "Ossário Decorativo", icon: "🦴", baseCost: 500, idleBonus: 0.05 },
  { id: "altar", name: "Altar Sombrio", icon: "🕯️", baseCost: 2200, idleBonus: 0.08 },
  { id: "trono", name: "Trono de Pedra Negra", icon: "🪑", baseCost: 9000, idleBonus: 0.12 },
];

// Monstros — curva de dificuldade bem mais íngreme
const MONSTERS = [
  { tier: 1, name: "Lobo Espectral", icon: "🐺", hp: 55, atk: 9, def: 3, goldMin: 50, goldMax: 80 },
  { tier: 2, name: "Ogro Podre", icon: "👹", hp: 130, atk: 16, def: 6, goldMin: 120, goldMax: 190 },
  { tier: 3, name: "Aranha do Vazio", icon: "🕷️", hp: 260, atk: 25, def: 10, goldMin: 260, goldMax: 380 },
  { tier: 4, name: "Cavaleiro Caído", icon: "💀", hp: 460, atk: 38, def: 16, goldMin: 480, goldMax: 700 },
  { tier: 5, name: "Golem de Obsidiana", icon: "🗿", hp: 780, atk: 52, def: 30, goldMin: 850, goldMax: 1200 },
  { tier: 6, name: "Hidra Negra", icon: "🐍", hp: 1250, atk: 72, def: 38, goldMin: 1500, goldMax: 2100 },
  { tier: 7, name: "Demônio de Ferro", icon: "😈", hp: 1900, atk: 95, def: 52, goldMin: 2600, goldMax: 3600 },
  { tier: 8, name: "Fenrir das Cinzas", icon: "🐺", hp: 2900, atk: 125, def: 68, goldMin: 4500, goldMax: 6200 },
  { tier: 9, name: "Wyrm Corrompido", icon: "🐉", hp: 4400, atk: 165, def: 90, goldMin: 8000, goldMax: 11000 },
  { tier: 10, name: "O Devorador de Mundos", icon: "👁️", hp: 6800, atk: 220, def: 120, goldMin: 15000, goldMax: 21000 },
];

// Batalhas de exército: seu dragão lidera aliados recrutados contra hordas em várias ondas
const ARMY_CAMPAIGNS = [
  {
    tier: 1,
    name: "Emboscada na Fronteira",
    waves: [
      { name: "Batedores Corrompidos", icon: "🐺", hp: 200, atk: 20, def: 8 },
      { name: "Arqueiros das Sombras", icon: "🏹", hp: 260, atk: 26, def: 10 },
      { name: "Capitão Renegado", icon: "🗡️", hp: 340, atk: 34, def: 14 },
    ],
    goldMin: 2000, goldMax: 2800,
  },
  {
    tier: 2,
    name: "Cerco ao Vale Negro",
    waves: [
      { name: "Legião de Ogros", icon: "👹", hp: 500, atk: 45, def: 20 },
      { name: "Golens de Guerra", icon: "🗿", hp: 650, atk: 55, def: 30 },
      { name: "General das Escamas", icon: "😈", hp: 850, atk: 70, def: 40 },
    ],
    goldMin: 6000, goldMax: 8500,
  },
  {
    tier: 3,
    name: "Queda do Bastião Ancestral",
    waves: [
      { name: "Guarda Dracônica Caída", icon: "🐍", hp: 1200, atk: 90, def: 55 },
      { name: "Hidras Gêmeas", icon: "🐉", hp: 1600, atk: 110, def: 70 },
      { name: "Comandante Wyrm", icon: "🐲", hp: 2200, atk: 140, def: 90 },
    ],
    goldMin: 16000, goldMax: 22000,
  },
];
const ALLY_BASE_COST = 800;
const ALLY_ATK_BONUS = 3;
const ALLY_DEF_BONUS = 2;
const AUTO_TRAINER_COST = 1500;

/* =========================================================
   HELPERS — curvas de progressão mais difíceis
   ========================================================= */
function costFor(baseCost, ownedCount) {
  return Math.round(baseCost * Math.pow(2.05, ownedCount));
}
// Curva de XP do JOGADOR (clique) — moderada
function xpToNext(level) {
  return Math.round(45 * Math.pow(1.5, level - 1));
}
// Curva de XP do DRAGÃO — muito mais dura: cada nível pede quase o dobro do anterior
function dragonXpToNext(level) {
  return Math.round(25 * Math.pow(1.72, level - 1));
}
function evolutionFor(level) {
  return EVOLUTION_STAGES.find((s) => level >= s.min && level <= s.max) || EVOLUTION_STAGES[EVOLUTION_STAGES.length - 1];
}
function dragonMaxHP(state) {
  return 50 + state.dragonLevel * 9 + state.dragonStats.vida * 3.5 + state.dragonStats.defesa * 1.5;
}
function playerClickPower(state) {
  const weaponBonus = WEAPONS.filter((w) => state.owned.weapons.includes(w.id)).reduce((s, w) => s + w.clickBonus, 0);
  return 1 + weaponBonus + Math.floor(state.playerLevel * 0.15);
}
function idleGoldPerSecond(state) {
  const armorMultiplier = ARMORS.filter((a) => state.owned.armors.includes(a.id)).reduce((s, a) => s + a.idlePercent, 0);
  const decoBonus = (state.owned.decorations || []).reduce((s, id) => {
    const d = DECORATIONS.find((x) => x.id === id);
    return s + (d ? d.idleBonus : 0);
  }, 0);
  const dragonPower = state.dragonStats.forca * 0.4 + state.dragonStats.velocidade * 0.25 + state.dragonLevel * 0.25;
  return dragonPower * (0.22 + armorMultiplier + decoBonus);
}
function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
// A cada 2 níveis do domador, o dragão ganha 1 nível
function dragonLevelFromPlayer(playerLevel) {
  return 1 + Math.floor((playerLevel - 1) / 2);
}
function formatSavedAgo(now, savedAt) {
  const diffSec = Math.max(0, Math.floor((now - savedAt) / 1000));
  if (diffSec < 5) return "agora mesmo";
  if (diffSec < 60) return `há ${diffSec}s`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH}h`;
  const d = new Date(savedAt);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) + " às " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function defaultState() {
  return {
    setupDone: false,
    playerName: "",
    dragonName: "",
    classId: "guerreiro",
    colorId: "sangue",
    gold: 25,
    playerLevel: 1,
    playerXP: 0,
    dragonLevel: 1,
    dragonXP: 0,
    dragonStats: { forca: 1, defesa: 1, velocidade: 1, vida: 0 },
    owned: { weapons: [], armors: [], abilities: {}, decorations: [], clothing: [], autoTrainer: false },
    autoTrainOn: true,
    equipped: { helmet: null, cloak: null, weapon_visual: null },
    highestTierCleared: 0,
    highestArmyTierCleared: 0,
    armyAllies: 0,
    battlesWon: 0,
    battlesLost: 0,
    activeJob: null, // { id, startTime, endTime }
    lastSeen: Date.now(),
  };
}

/* =========================================================
   MAIN COMPONENT
   ========================================================= */
export default function DragonTamerGame() {
  const [state, setState] = useState(defaultState());
  const [loaded, setLoaded] = useState(false);
  const [floatingTexts, setFloatingTexts] = useState([]);
  const [tab, setTab] = useState("lar");
  const [offlineReport, setOfflineReport] = useState(null);
  const [screen, setScreen] = useState("loading");
  const [battle, setBattle] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved | error
  const saveTimer = useRef(null);
  const floatId = useRef(0);

  useEffect(() => {
    (async () => {
      try {
        const idResult = await window.storage.get(PLAYER_ID_KEY, false);
        if (idResult && idResult.value) {
          setPlayerId(idResult.value);
        } else {
          const newId = uid();
          await window.storage.set(PLAYER_ID_KEY, newId, false);
          setPlayerId(newId);
        }
      } catch (e) {
        setPlayerId(uid());
      }

      try {
        const result = await window.storage.get(STORAGE_KEY, false);
        if (result && result.value) {
          const saved = JSON.parse(result.value);
          const merged = { ...defaultState(), ...saved };
          merged.owned = { ...defaultState().owned, ...(saved.owned || {}) };
          merged.dragonStats = { ...defaultState().dragonStats, ...(saved.dragonStats || {}) };

          const elapsedSec = Math.min(MAX_OFFLINE_SECONDS, Math.max(0, Math.floor((Date.now() - (saved.lastSeen || Date.now())) / 1000)));
          const gps = idleGoldPerSecond(merged);
          const earned = Math.floor(gps * elapsedSec);
          if (earned > 0 && merged.setupDone) {
            merged.gold += earned;
            setOfflineReport({ seconds: elapsedSec, gold: earned });
          }
          merged.lastSeen = Date.now();
          setState(merged);
          if (saved.lastSavedAt) setLastSavedAt(saved.lastSavedAt);
          setScreen(merged.setupDone ? "game" : "setup");
        } else {
          setScreen("setup");
        }
      } catch (e) {
        setScreen("setup");
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // clock tick (para trabalhos com contagem regressiva)
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!loaded || screen !== "game") return;
    const interval = setInterval(() => {
      setState((prev) => ({ ...prev, gold: prev.gold + idleGoldPerSecond(prev) / 4 }));
    }, 250);
    return () => clearInterval(interval);
  }, [loaded, screen]);

  const persistNow = useCallback(async () => {
    setSaveStatus("saving");
    try {
      const savedAt = Date.now();
      await window.storage.set(STORAGE_KEY, JSON.stringify({ ...stateRef.current, lastSeen: savedAt, lastSavedAt: savedAt }), false);
      setLastSavedAt(savedAt);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus((s) => (s === "saved" ? "idle" : s)), 2000);
    } catch (e) {
      setSaveStatus("error");
    }
    if (playerId && stateRef.current.setupDone) {
      try {
        await window.storage.set(
          LEADERBOARD_PREFIX + playerId,
          JSON.stringify({
            playerName: stateRef.current.playerName,
            dragonName: stateRef.current.dragonName,
            dragonLevel: stateRef.current.dragonLevel,
            playerLevel: stateRef.current.playerLevel,
            colorId: stateRef.current.colorId,
            battlesWon: stateRef.current.battlesWon,
            highestTierCleared: stateRef.current.highestTierCleared,
            updatedAt: Date.now(),
          }),
          true
        );
      } catch (e) {}
    }
  }, [playerId]);

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      persistNow();
    }, 900);
    return () => clearTimeout(saveTimer.current);
  }, [state, loaded, persistNow]);

  const loadLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    try {
      const listResult = await window.storage.list(LEADERBOARD_PREFIX, true);
      const keys = listResult?.keys || [];
      const entries = [];
      for (const k of keys.slice(0, 30)) {
        try {
          const r = await window.storage.get(k, true);
          if (r && r.value) entries.push(JSON.parse(r.value));
        } catch (e) {}
      }
      entries.sort((a, b) => (b.dragonLevel || 0) - (a.dragonLevel || 0));
      setLeaderboard(entries);
    } catch (e) {
      setLeaderboard([]);
    } finally {
      setLeaderboardLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "salao") loadLeaderboard();
  }, [tab, loadLeaderboard]);

  const addFloating = useCallback((text) => {
    const id = floatId.current++;
    const x = 38 + Math.random() * 24;
    setFloatingTexts((prev) => [...prev, { id, text, x }]);
    setTimeout(() => setFloatingTexts((prev) => prev.filter((f) => f.id !== id)), 900);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const derived = dragonLevelFromPlayer(state.playerLevel);
    if (state.dragonLevel !== derived) {
      setState((prev) => ({ ...prev, dragonLevel: dragonLevelFromPlayer(prev.playerLevel) }));
    }
  }, [state.playerLevel, state.dragonLevel, loaded]);

  const handleClick = () => {
    setState((prev) => {
      const power = playerClickPower(prev);
      let { playerXP, playerLevel } = prev;
      playerXP += 1;
      let leveled = false;
      while (playerXP >= xpToNext(playerLevel)) {
        playerXP -= xpToNext(playerLevel);
        playerLevel += 1;
        leveled = true;
      }
      addFloating(`+${power}${leveled ? "  ⭐" : ""}`);
      return { ...prev, gold: prev.gold + power, playerXP, playerLevel };
    });
  };

  const buyAutoTrainer = () =>
    setState((prev) => {
      if (prev.owned.autoTrainer || prev.gold < AUTO_TRAINER_COST) return prev;
      return { ...prev, gold: prev.gold - AUTO_TRAINER_COST, owned: { ...prev.owned, autoTrainer: true } };
    });

  useEffect(() => {
    if (!loaded || screen !== "game" || !state.owned.autoTrainer || !state.autoTrainOn) return;
    const t = setInterval(() => handleClick(), 1200);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, screen, state.owned.autoTrainer, state.autoTrainOn]);

  const buyWeapon = (w) =>
    setState((prev) => {
      if (prev.owned.weapons.includes(w.id)) return prev;
      const cost = costFor(w.baseCost, 0);
      if (prev.gold < cost) return prev;
      return { ...prev, gold: prev.gold - cost, owned: { ...prev.owned, weapons: [...prev.owned.weapons, w.id] } };
    });

  const buyArmor = (a) =>
    setState((prev) => {
      if (prev.owned.armors.includes(a.id)) return prev;
      const cost = costFor(a.baseCost, 0);
      if (prev.gold < cost) return prev;
      return { ...prev, gold: prev.gold - cost, owned: { ...prev.owned, armors: [...prev.owned.armors, a.id] } };
    });

  const buyDecoration = (d) =>
    setState((prev) => {
      if ((prev.owned.decorations || []).includes(d.id)) return prev;
      const cost = costFor(d.baseCost, 0);
      if (prev.gold < cost) return prev;
      return { ...prev, gold: prev.gold - cost, owned: { ...prev.owned, decorations: [...(prev.owned.decorations || []), d.id] } };
    });

  const buyClothing = (slot, item) =>
    setState((prev) => {
      const owns = (prev.owned.clothing || []).includes(item.id);
      const cost = costFor(item.baseCost, 0);
      if (!owns && prev.gold < cost) return prev;
      return {
        ...prev,
        gold: owns ? prev.gold : prev.gold - cost,
        owned: { ...prev.owned, clothing: owns ? prev.owned.clothing : [...(prev.owned.clothing || []), item.id] },
        equipped: { ...prev.equipped, [slot]: item.id },
      };
    });

  const trainAbility = (ab) =>
    setState((prev) => {
      const count = prev.owned.abilities[ab.id] || 0;
      const cost = costFor(ab.baseCost, count);
      if (prev.gold < cost) return prev;
      // Poderes só concedem atributos — o nível do dragão evolui exclusivamente em batalha
      return {
        ...prev,
        gold: prev.gold - cost,
        dragonStats: { ...prev.dragonStats, [ab.stat]: prev.dragonStats[ab.stat] + ab.gain },
        owned: { ...prev.owned, abilities: { ...prev.owned.abilities, [ab.id]: count + 1 } },
      };
    });

  // ---------- Trabalhos ----------
  const startJob = (job) => {
    setState((prev) => {
      if (prev.activeJob) return prev;
      return { ...prev, activeJob: { id: job.id, startTime: Date.now(), endTime: Date.now() + job.durationSec * 1000 } };
    });
  };
  const claimJob = () => {
    setState((prev) => {
      if (!prev.activeJob) return prev;
      const job = JOBS.find((j) => j.id === prev.activeJob.id);
      if (!job || Date.now() < prev.activeJob.endTime) return prev;
      let { playerXP, playerLevel } = prev;
      playerXP += job.xp;
      while (playerXP >= xpToNext(playerLevel)) {
        playerXP -= xpToNext(playerLevel);
