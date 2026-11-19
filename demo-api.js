/** Isolated browser-only demonstration. NEVER calls live APIs or authenticates anyone.
 * All balances, identities, receipts and the sample 1:50 conversion are fictitious.
 */
// Generated from avatar02/manifest.json. Parity is enforced by tests/test_avatar.py.
const AVATAR02_ITEMS = {"skin-warm": "skin", "skin-deep": "skin", "hair-short": "hair", "top-plain": "top", "top-vest": "top", "bottom-shorts": "bottom", "hat-baseball": "hat", "glasses-round": "glasses", "body-crossbody": "body", "hand-mug": "hand", "shoes-sneakers": "shoes", "shoes-loafers": "shoes", "shoes-boots": "shoes", "body-mini-bag": "body", "body-headphones": "body", "hand-takeout-cup": "hand", "hand-book": "hand", "top-raglan": "top", "top-turtleneck": "top", "top-bomber": "top", "bottom-skirt-pleated": "bottom", "bottom-trousers-cargo": "bottom", "hair-curly-bob": "hair", "hair-pixie": "hair", "hair-pigtails": "hair", "hair-long-straight": "hair", "hair-braid": "hair", "hat-beanie": "hat", "hat-beret": "hat", "glasses-square": "glasses", "hair-buzz": "hair", "hair-afro": "hair", "hair-high-bun": "hair", "hair-side-ponytail": "hair", "top-tee-plain": "top", "top-tee-striped": "top", "top-shirt-blue": "top", "top-cardigan-rust": "top", "top-hoodie-lavender": "top", "top-vest-moss": "top", "top-overall-denim": "top", "bottom-shorts-charcoal": "bottom", "bottom-trousers-navy": "bottom", "bottom-skirt-coral": "bottom", "bottom-overall-denim": "bottom", "hat-bucket": "hat", "body-tote": "body", "hand-camera": "hand", "eyes-dot": "eyes", "eyes-sleepy": "eyes", "eyes-smile": "eyes"};
const AVATAR02_LENSES = ["charcoal", "green", "blue"];
function defaultAvatar02() { return {selection: {}, lens: 'charcoal'}; }
function validateAvatar02(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(k=>!['selection','lens'].includes(k))) fail('캐릭터 선택 형식을 확인해주세요');
  const selected = value.selection === undefined ? {} : value.selection;
  if (!selected || typeof selected !== 'object' || Array.isArray(selected)) fail('캐릭터 슬롯별 선택이 필요해요');
  const slots = new Set(Object.values(AVATAR02_ITEMS)), selection = {};
  for (const [slot,item] of Object.entries(selected)) {
    if (!slots.has(slot)) fail('지원하지 않는 캐릭터 슬롯이에요');
    if (item === null || item === '') continue;
    if (typeof item !== 'string' || !Object.hasOwn(AVATAR02_ITEMS,item) || AVATAR02_ITEMS[item] !== slot) fail('해당 슬롯의 캐릭터 파츠를 선택해주세요');
    selection[slot] = item;
  }
  const lens = value.lens === undefined ? 'charcoal' : value.lens;
  if (!AVATAR02_LENSES.includes(lens)) fail('지원하지 않는 렌즈 색이에요');
  return {selection, lens};
}

const STORAGE_KEY = "cafe-quest-demo-v1";
const copy = (value) => JSON.parse(JSON.stringify(value));
const id = (prefix) =>
  `demo-${prefix}-${globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)}`;
const time = (db) => Date.now() + (db.offset || 0);
const day = (db) => new Date(time(db) + 5 * 3600000).toISOString().slice(0, 10); // KST 04:00
const cycle = (db, q) =>
  q.kind === "cumulative" ? day(db).slice(0, 7) : day(db);
const obstacles = [
  [0.04, 0.13, 0.28, 0.52],
  [0.06, 0.76, 0.12, 0.16],
  [0.06, 0.88, 0.48, 0.07],
  [0.7, 0.3, 0.16, 0.09],
  [0.7, 0.56, 0.16, 0.09],
  [0.18, 0.77, 0.12, 0.07],
  [0.18, 0.88, 0.12, 0.07],
  [0.35, 0.88, 0.12, 0.07],
  [0.52, 0.88, 0.12, 0.07],
];
const blocked = (x, y) =>
  x < 0.03 ||
  x > 0.97 ||
  y < 0.08 ||
  y > 0.96 ||
  obstacles.some(
    ([a, b, w, h]) =>
      x >= a - 0.015 &&
      x <= a + w + 0.015 &&
      y >= b - 0.015 &&
      y <= b + h + 0.015,
  );
const config = {
  demo: true,
  prototype: true,
  kakaoEnabled: true,
  conversionEnabled: true,
  conversionRate: 50,
  conversionLabel: "데모 예시 비율 · 실제 운영과 무관",
  obstacles,
};
function freshUser(
  uid,
  nickname,
  color = "#a777be",
  linked = false,
  role = "guest",
) {
  return {
    id: uid,
    nickname,
    appearance: { color, avatar02: defaultAvatar02() },
    coins: 0,
    stamps: 0,
    linked,
    role,
    inventory: {},
    quests: [],
    visits: [],
    blocks: [],
    restricted: false,
    session: {
      mode: "remote",
      expiresAt: 0,
      visible: false,
      x: 0.5,
      y: 0.7,
      activity: "",
      drink: "",
      active: Date.now(),
    },
  };
}
function seed() {
  const db = {
    version: 1,
    current: null,
    customer: null,
    offset: 0,
    closed: false,
    users: {},
    items: [],
    definitions: [],
    ledger: [],
    audit: [],
    reports: [],
    requests: {},
    sources: [],
    orders: [],
    merges: {},
  };
  const items = [
    ["라벤더 모자", 30, "hat"],
    ["민트 모자", 30, "hat"],
    ["베이지 베레모", 40, "hat"],
    ["책 한 권", 20, "prop"],
    ["머그컵", 20, "prop"],
    ["작은 꽃", 25, "prop"],
    ["노란 셔츠", 30, "outfit"],
    ["초록 셔츠", 30, "outfit"],
    ["푸른 셔츠", 30, "outfit"],
    ["분홍 셔츠", 30, "outfit"],
  ];
  db.items = items.map(([name, price, slot], i) => ({
    id: `item${i}`,
    name,
    price,
    slot,
    version: 1,
    enabled: true,
    starts: null,
    ends: null,
  }));
  db.definitions = [
    ["visit", "오늘의 카페 참여", "QR 참여 영업일마다 한 번", 20, "visit"],
    ["plant", "새 화분 찾기", "오른쪽 화분을 살펴보세요", 15, "explore"],
    ["mood", "오늘의 기분", "기분은 공개하지 않아도 돼요", 10, "mood"],
    [
      "menu",
      "추천 메뉴 맛보기",
      "직원 역할에서 구매 승인을 체험해요",
      25,
      "purchase",
    ],
    [
      "monthly",
      "이번 달 세 번의 쉼",
      "서로 다른 영업일에 3회 참여",
      40,
      "cumulative",
    ],
  ].map(([qid, title, description, reward, kind]) => ({
    id: qid,
    title,
    description,
    reward,
    kind,
    version: 1,
    enabled: true,
    starts: null,
    ends: null,
  }));
  const mint = freshUser("demo-mint", "민트 · 예시 손님", "#789b66", true);
  mint.session = {
    ...mint.session,
    mode: "store",
    visible: true,
    x: 0.65,
    y: 0.43,
    activity: "독서",
    expiresAt: Date.now() + 5400000,
  };
  mint.stamps = 12;
  mint.coins = 70;
  const sky = freshUser("demo-sky", "하늘 · 원격 예시", "#709cb3", true);
  sky.session = { ...sky.session, visible: true, x: 0.61, y: 0.62 };
  const account = freshUser(
    "demo-account",
    "기존 계정 · 예시",
    "#c57c77",
    true,
  );
  account.coins = 80;
  account.stamps = 12;
  account.inventory = { item0: true, item3: false };
  db.users = {
    "demo-mint": mint,
    "demo-sky": sky,
    "demo-account": account,
    "demo-staff": freshUser(
      "demo-staff",
      "직원 체험",
      "#789b66",
      true,
      "staff",
    ),
    "demo-admin": freshUser(
      "demo-admin",
      "관리자 체험",
      "#709cb3",
      true,
      "admin",
    ),
  };
  return db;
}
let memory,
  memoryOnly = false;
function load() {
  if (memoryOnly && memory) return copy(memory);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.version === 1) return parsed;
    }
  } catch {}
  return memory ? copy(memory) : seed();
}
function save(db) {
  memory = copy(db);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    memoryOnly = false;
    return true;
  } catch {
    memoryOnly = true;
    return false;
  }
}
function fail(message) {
  throw Error(`데모: ${message}`);
}
function text(data, key, max = 300) {
  const value = data[key];
  if (typeof value !== "string" || !value.trim() || value.length > max)
    fail(`${key} 값을 확인해주세요`);
  return value.trim();
}
function integer(value, min = 1, max = 100000) {
  if (!Number.isInteger(value) || value < min || value > max)
    fail("수량을 확인해주세요");
  return value;
}
function enabled(db, item) {
  const now = time(db) / 1000;
  return (
    item.enabled !== false &&
    (item.starts == null || now >= item.starts) &&
    (item.ends == null || now < item.ends)
  );
}
function normalize(db, user) {
  const s = user.session,
    now = time(db);
  if (user.restricted) s.visible = false;
  if (s.mode === "store" && s.expiresAt <= now) {
    Object.assign(s, {
      mode: "remote",
      visible: false,
      drink: "",
      activity: "",
      expiresAt: 0,
    });
  } else if (s.mode === "remote" && now - s.active > 300000) s.visible = false;
}
function publicUser(db, user) {
  normalize(db, user);
  return {
    id: user.id,
    nickname: user.nickname,
    appearance: {
      ...user.appearance,
      equipped: Object.keys(user.inventory).filter((k) => user.inventory[k]),
    },
    mode: user.session.mode,
    x: user.session.x,
    y: user.session.y,
    activity: user.session.activity,
    drink: user.session.drink,
  };
}
function state(db) {
  const u = db.users[db.current];
  if (!u) return { user: null, config: { ...config } };
  normalize(db, u);
  const quests = db.definitions.map((def) => {
    const records = u.quests
      .filter((q) => q.id === def.id)
      .sort((a, b) => a.cycle.localeCompare(b.cycle));
    const row =
      records.find((q) => q.status === "complete") ||
      records.find((q) => q.status === "pending") ||
      records.find((q) => q.cycle === cycle(db, def));
    const effective = row?.snapshot || def;
    return {
      id: def.id,
      title: effective.title,
      description: effective.description,
      reward: row?.reward ?? def.reward,
      kind: effective.kind,
      status: row?.status || (enabled(db, def) ? "available" : "unavailable"),
      cycle: row?.cycle || cycle(db, def),
      available: def.enabled !== false && enabled(db, effective),
      starts: effective.starts,
      ends: effective.ends,
      note: row?.note || "",
    };
  });
  return {
    user: {
      id: u.id,
      nickname: u.nickname,
      appearance: publicUser(db, u).appearance,
      coins: u.coins,
      stamps: u.stamps,
      linked: u.linked,
      role: u.role,
    },
    session: { ...u.session },
    quests,
    items: db.items
      .filter((i) => enabled(db, i) || Object.hasOwn(u.inventory, i.id))
      .map((i) => ({
        ...i,
        owned: Object.hasOwn(u.inventory, i.id),
        equipped: !!u.inventory[i.id],
        available: enabled(db, i),
      })),
    guests: Object.values(db.users)
      .filter((g) => {
        normalize(db, g);
        return (
          g.id !== u.id &&
          g.session.visible &&
          !u.blocks.includes(g.id) &&
          !g.blocks.includes(u.id)
        );
      })
      .map((g) => publicUser(db, g)),
    ledger: db.ledger
      .filter((l) => l.uid === u.id)
      .slice()
      .reverse(),
    config: { ...config, customerId: db.customer, closed: db.closed },
  };
}
function ledger(db, u, currency, amount, reason, extra = {}) {
  if (
    !["coins", "stamps"].includes(currency) ||
    !Number.isInteger(amount) ||
    u[currency] + amount < 0
  )
    fail("잔액이 부족해요");
  u[currency] += amount;
  const row = {
    id: id("tx"),
    uid: u.id,
    currency,
    amount,
    reason,
    created: time(db) / 1000,
    ...extra,
  };
  db.ledger.push(row);
  return row;
}
function audit(db, actor, action, target, reason) {
  const a = {
    id: id("audit"),
    actor: actor.id,
    action,
    target,
    reason,
    created: time(db) / 1000,
  };
  db.audit.push(a);
  return a.id;
}
function requireStore(u) {
  if (u.session.mode !== "store") fail("QR 매장 모드에서 진행할 수 있어요");
}
function requireLinked(u) {
  if (!u.linked) fail("목 카카오 연결을 먼저 체험해주세요");
}
function requireStaff(u, admin = false) {
  if (
    !u.linked ||
    !["staff", "admin"].includes(u.role) ||
    (admin && u.role !== "admin")
  )
    fail("해당 직원 역할이 필요해요");
}
function target(db, uid) {
  const u = db.users[uid];
  if (!u) fail("손님을 찾을 수 없어요");
  return u;
}
function route(start, end) {
  if (!Number.isFinite(end.x + end.y) || blocked(end.x, end.y))
    fail("가구나 벽으로 이동할 수 없어요");
  const a = [Math.round(start.x * 100), Math.round(start.y * 100)],
    b = [Math.round(end.x * 100), Math.round(end.y * 100)];
  const key = (p) => p.join(","),
    queue = [a],
    parents = new Map([[key(a), null]]);
  let index = 0;
  while (index < queue.length && !parents.has(key(b))) {
    const p = queue[index++];
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const n = [p[0] + dx, p[1] + dy],
        k = key(n);
      if (!parents.has(k) && !blocked(n[0] / 100, n[1] / 100)) {
        parents.set(k, p);
        queue.push(n);
      }
    }
  }
  if (!parents.has(key(b))) fail("경로를 찾을 수 없어요");
  const out = [];
  let at = b;
  while (at) {
    out.push({ x: at[0] / 100, y: at[1] / 100 });
    at = parents.get(key(at));
  }
  return out.reverse();
}
function complete(db, u, qid) {
  const def = db.definitions.find((q) => q.id === qid),
    c = cycle(db, def);
  if (!u.quests.some((q) => q.id === qid && q.cycle === c))
    u.quests.push({
      id: qid,
      cycle: c,
      status: "complete",
      reward: def.reward,
      snapshot: copy(def),
    });
}
function dashboard(db, u) {
  requireStaff(u);
  const admin = u.role === "admin";
  return {
    demo: true,
    pending: Object.values(db.users).flatMap((g) =>
      g.quests
        .filter((q) => q.status === "pending")
        .map((q) => ({
          uid: g.id,
          nickname: g.nickname,
          qid: q.id,
          cycle: q.cycle,
          status: q.status,
          reward: q.reward,
        })),
    ),
    recentGrants: db.ledger
      .filter((l) => l.kind === "grant" && (admin || l.actor === u.id))
      .slice()
      .reverse(),
    users: admin
      ? Object.values(db.users).map((g) => ({
          id: g.id,
          nickname: g.nickname,
          linked: g.linked,
        }))
      : [],
    reports: admin ? db.reports.filter((r) => !r.resolved) : [],
    audit: admin ? db.audit.slice().reverse() : [],
    content: admin
      ? {
          items: db.items.map((i) => ({
            ...i,
            body: { name: i.name, price: i.price, slot: i.slot },
          })),
          quests: db.definitions.map((q) => ({
            ...q,
            body: {
              title: q.title,
              description: q.description,
              reward: q.reward,
              kind: q.kind,
            },
          })),
        }
      : undefined,
  };
}
function content(db, u, data) {
  requireStaff(u, true);
  const kind = data.kind,
    ident = text(data, "id", 50),
    body = data.body;
  if (!["item", "quest"].includes(kind) || !body || typeof body !== "object")
    fail("콘텐츠 형식을 확인해주세요");
  const list = kind === "item" ? db.items : db.definitions,
    prior = list.find((x) => x.id === ident);
  if (prior && ["visit", "cumulative"].includes(prior.kind))
    fail("자동 퀘스트는 편집할 수 없어요");
  if (kind === "item") {
    text(body, "name");
    integer(body.price, 0);
    if (!["hat", "prop", "outfit"].includes(body.slot))
      fail("슬롯을 확인해주세요");
  } else {
    text(body, "title");
    text(body, "description");
    integer(body.reward, 0, 10000);
    if (!["explore", "mood", "purchase"].includes(body.kind))
      fail("퀘스트 종류를 확인해주세요");
  }
  for (const key of ["starts", "ends"])
    if (data[key] != null && (!Number.isFinite(data[key]) || data[key] < 0))
      fail("기간을 확인해주세요");
  if (data.starts != null && data.ends != null && data.ends <= data.starts)
    fail("종료 시각은 시작 이후여야 해요");
  const next = {
    ...body,
    id: ident,
    version: (prior?.version || 0) + 1,
    enabled: data.enabled !== false,
    starts: data.starts ?? null,
    ends: data.ends ?? null,
  };
  if (prior) list.splice(list.indexOf(prior), 1, next);
  else list.push(next);
}
function operation(db, u, name, data) {
  requireStaff(u);
  const reason = text(data, "reason");
  let receipt = { operation: name, created: time(db) / 1000, demo: true };
  if (name === "grant") {
    const g = target(db, text(data, "uid"));
    requireLinked(g);
    const amount = integer(data.amount, 1, 100),
      source = text(data, "source_ref");
    if (db.sources.includes(source))
      fail("이미 적립한 데모 주문/이전 건이에요");
    const l = ledger(db, g, "stamps", amount, reason, {
      kind: "grant",
      actor: u.id,
      source_ref: source,
    });
    db.sources.push(source);
    Object.assign(receipt, { uid: g.id, ledgerId: l.id, amount });
  } else if (name === "reverse" || name === "restore") {
    const original = db.ledger.find((l) => l.id === text(data, "original_id"));
    if (!original) fail("원거래를 찾을 수 없어요");
    if (name === "restore") {
      requireStaff(u, true);
      if (
        original.currency !== "stamps" ||
        original.amount !== -10 ||
        original.kind !== "redeem"
      )
        fail("음료 사용 원거래만 복원해요");
    } else if (
      original.kind !== "grant" ||
      (u.role !== "admin" && original.actor !== u.id)
    )
      fail("직원은 본인 적립만 취소할 수 있어요");
    const amount = integer(data.amount),
      used = db.ledger
        .filter((l) => l.related === original.id && l.kind === name)
        .reduce((n, l) => n + Math.abs(l.amount), 0);
    if (amount + used > Math.abs(original.amount))
      fail("원거래 수량을 초과했어요");
    const signed = name === "reverse" ? -amount : amount,
      l = ledger(
        db,
        target(db, original.uid),
        original.currency,
        signed,
        reason,
        { kind: name, actor: u.id, related: original.id },
      );
    Object.assign(receipt, {
      uid: original.uid,
      ledgerId: l.id,
      amount: signed,
      originalId: original.id,
    });
  } else if (name === "coin-adjust") {
    requireStaff(u, true);
    const g = target(db, text(data, "uid")),
      amount = integer(data.amount, -100000, 100000);
    if (amount === 0) fail("0이 아닌 수량이 필요해요");
    const l = ledger(db, g, "coins", amount, reason, {
      kind: name,
      actor: u.id,
    });
    Object.assign(receipt, { uid: g.id, ledgerId: l.id, amount });
  } else if (name === "approve") {
    const g = target(db, text(data, "uid")),
      qid = data.qid || "menu",
      q = g.quests.find(
        (q) => q.id === qid && q.cycle === data.cycle && q.status === "pending",
      );
    if (!q) fail("승인 대기 건이 없어요");
    if (typeof data.approve !== "boolean") fail("승인 여부를 선택해주세요");
    if (data.approve) {
      const order = text(data, "order_ref");
      if (db.orders.includes(order)) fail("이미 승인한 주문 항목이에요");
      db.orders.push(order);
    }
    q.status = data.approve ? "complete" : "rejected";
    q.note = reason;
    Object.assign(receipt, {
      uid: g.id,
      qid,
      cycle: q.cycle,
      status: q.status,
    });
  } else if (["end", "hide", "unhide"].includes(name)) {
    requireStaff(u, true);
    const g = target(db, text(data, "uid"));
    if (name === "unhide") g.restricted = false;
    else {
      g.session.visible = false;
      g.session.drink = "";
      g.session.activity = "";
      if (name === "end") {
        g.session.mode = "remote";
        g.session.expiresAt = 0;
      } else g.restricted = true;
    }
    receipt.uid = g.id;
  } else if (name === "resolve") {
    requireStaff(u, true);
    const r = db.reports.find((r) => r.id === data.report_id && !r.resolved);
    if (!r || !["reviewed", "hidden", "dismissed"].includes(data.outcome))
      fail("신고 처리 값을 확인해주세요");
    r.resolved = true;
    r.outcome = data.outcome;
    r.resolution = reason;
    if (data.outcome === "hidden") {
      target(db, r.target).restricted = true;
      target(db, r.target).session.visible = false;
    }
    receipt.uid = r.target;
  } else if (name === "content") content(db, u, data);
  else if (name === "business") {
    requireStaff(u, true);
    if (typeof data.closed !== "boolean") fail("영업 참여 상태를 확인해주세요");
    db.closed = data.closed;
    if (db.closed)
      for (const g of Object.values(db.users))
        Object.assign(g.session, {
          mode: "remote",
          visible: false,
          expiresAt: 0,
          drink: "",
          activity: "",
        });
  } else fail("지원하지 않는 운영 기능이에요");
  receipt.auditId = audit(
    db,
    u,
    `staff/${name}`,
    receipt.uid || data.id || "cafe",
    reason,
  );
  return receipt;
}
function merge(db, guest, dest) {
  if (db.merges[guest.id]) return target(db, db.merges[guest.id]);
  // Coin-bearing claims identify the same quest cycle; remove only duplicate credit.
  const duplicate = guest.quests
    .filter(
      (q) =>
        q.status === "claimed" &&
        dest.quests.some(
          (d) => d.id === q.id && d.cycle === q.cycle && d.status === "claimed",
        ),
    )
    .reduce((sum, q) => sum + q.reward, 0);
  const transfer =
    Math.max(0, dest.coins + guest.coins - duplicate) - dest.coins;
  ledger(db, dest, "coins", transfer, "데모 게스트 진행 합치기", {
    kind: "merge",
  });
  for (const [item, equipped] of Object.entries(guest.inventory))
    if (!Object.hasOwn(dest.inventory, item)) dest.inventory[item] = false;
  const ranks = {
    available: 0,
    active: 1,
    rejected: 1,
    pending: 2,
    complete: 3,
    claimed: 4,
  };
  for (const q of guest.quests) {
    const prior = dest.quests.find((p) => p.id === q.id && p.cycle === q.cycle);
    if (!prior) dest.quests.push(copy(q));
    else if (ranks[q.status] > ranks[prior.status])
      Object.assign(prior, copy(q));
  }
  dest.visits = [...new Set([...dest.visits, ...guest.visits])];
  db.merges[guest.id] = dest.id;
  guest.session.visible = false;
  guest.retired = true;
  guest.coins = 0;
  db.customer = dest.id;
  db.current = dest.id;
  return dest;
}
function dispatch(db, path, data) {
  if (path === "demo/reset") {
    const next = seed();
    Object.keys(db).forEach((k) => delete db[k]);
    Object.assign(db, next);
    return state(db);
  }
  if (path === "state") return state(db);
  if (path === "health") return { ok: true, demo: true };
  if (path === "guest") {
    if (db.users[db.current]) return state(db);
    const name = text(data, "nickname", 16),
      uid = id("guest"),
      u = freshUser(
        uid,
        name,
        /^#[a-f0-9]{6}$/i.test(data.appearance?.color)
          ? data.appearance.color
          : undefined,
      );
    if (data.appearance?.avatar02 !== undefined) u.appearance.avatar02 = validateAvatar02(data.appearance.avatar02);
    db.users[uid] = u;
    db.current = uid;
    db.customer = uid;
    ledger(db, u, "coins", 100, "데모 시작 코인", { kind: "seed" });
    return state(db);
  }
  if (path === "demo/kakao" && data.mode === "restore") {
    const linked = db.users[db.customer];
    db.current = linked?.linked ? linked.id : "demo-account";
    if (!db.users[db.current])
      fail("복원할 목 계정이 없어요. 데모를 초기화해주세요");
    db.customer = db.current;
    return {
      ...state(db),
      demoNotice: "목 계정 복원입니다. 실제 카카오 로그인이 아닙니다.",
    };
  }
  if (path === "demo/role") {
    if (!db.customer) {
      const guest = freshUser("demo-customer", "내 카페 체험");
      db.users[guest.id] = guest;
      db.customer = guest.id;
      ledger(db, guest, "coins", 100, "데모 시작 코인", { kind: "seed" });
    }
    if (
      data.role === "guest" &&
      (!db.guestRoleId ||
        !db.users[db.guestRoleId] ||
        db.users[db.guestRoleId].retired)
    ) {
      const guest = freshUser(id("guest-role"), "새 게스트 체험");
      db.users[guest.id] = guest;
      db.guestRoleId = guest.id;
      ledger(db, guest, "coins", 100, "데모 시작 코인", { kind: "seed" });
    }
    const uid =
      data.role === "guest"
        ? db.guestRoleId
        : data.role === "customer"
          ? db.customer
          : data.role === "staff"
            ? "demo-staff"
            : data.role === "admin"
              ? "demo-admin"
              : null;
    if (!uid) fail("체험 역할을 선택해주세요");
    db.current = uid;
    return state(db);
  }
  let u = db.users[db.current];
  if (!u) fail("먼저 데모 캐릭터를 만들어주세요");
  normalize(db, u);
  if (path === "demo/advance") {
    integer(data.minutes, 0, 60 * 24 * 40);
    db.offset += data.minutes * 60000;
    return state(db);
  }
  if (path === "demo/kakao") {
    if (data.mode === "existing") {
      if (u.id !== "demo-account") u = merge(db, u, target(db, "demo-account"));
    } else if (data.mode === "new") {
      u.linked = true;
      db.customer = u.id;
    } else fail("목 연결 방식을 선택해주세요");
    return {
      ...state(db),
      demoNotice:
        "목 카카오 연결 체험입니다. 실제 개인정보·인증은 사용하지 않습니다.",
    };
  }
  if (path === "blocks")
    return u.blocks
      .filter((uid) => db.users[uid])
      .map((uid) => ({ id: uid, nickname: db.users[uid].nickname }));
  if (path === "staff/dashboard") return dashboard(db, u);
  if (path === "stamps/qr") {
    requireLinked(u);
    return {
      demo: true,
      uid: u.id,
      payload: `DEMO:${u.id}`,
      label: "체험용 식별값 · 실제 적립 불가",
    };
  }
  if (path === "logout") {
    u.session.visible = false;
    u.session.mode = "remote";
    db.current = null;
    return state(db);
  }
  if (path === "account/delete") {
    if (data.confirm !== true) fail("데모 계정 삭제를 확인해주세요");
    if (["demo-admin", "demo-staff", "demo-mint", "demo-sky"].includes(u.id))
      fail("예시 운영 계정은 초기화로만 삭제할 수 있어요");
    delete db.users[u.id];
    db.current = null;
    db.customer = null;
    return state(db);
  }
  if (path === "checkin") {
    if (db.closed) fail("데모 영업 참여가 종료되었어요");
    if (data.entry !== "cafe" && data.entry !== "demo")
      fail("데모 QR 링크로 참여해주세요");
    Object.assign(u.session, {
      mode: "store",
      expiresAt: time(db) + 5400000,
      visible: false,
      activity: "",
      drink: "",
      active: time(db),
    });
    complete(db, u, "visit");
    if (!u.visits.includes(day(db))) u.visits.push(day(db));
    if (u.visits.filter((d) => d.startsWith(day(db).slice(0, 7))).length >= 3)
      complete(db, u, "monthly");
  } else if (path === "checkout")
    Object.assign(u.session, {
      mode: "remote",
      visible: false,
      expiresAt: 0,
      activity: "",
      drink: "",
    });
  else if (path === "extend") {
    requireStore(u);
    u.session.expiresAt = time(db) + 5400000;
  } else if (path === "heartbeat") {
    if (data.foreground === true) u.session.active = time(db);
  } else if (path === "privacy") {
    if (data.visible && u.restricted)
      fail("운영자 체험에서 공개 제한된 프로필이에요");
    Object.assign(u.session, {
      visible: !!data.visible,
      activity: String(data.activity || "").slice(0, 30),
      drink: String(data.drink || "").slice(0, 40),
      active: time(db),
    });
  } else if (path === "avatar") {
    u.appearance = {...u.appearance, avatar02: validateAvatar02(data)};
  } else if (path === "profile") u.nickname = text(data, "nickname", 16);
  else if (path === "move") {
    const path = route(u.session, { x: Number(data.x), y: Number(data.y) });
    Object.assign(u.session, path[path.length - 1]);
    return { ...state(db), path };
  } else if (path === "quest") {
    const def = db.definitions.find((q) => q.id === data.id);
    if (!def) fail("퀘스트를 찾을 수 없어요");
    if (data.action === "claim") {
      const q = u.quests
        .filter((q) => q.id === def.id && q.status === "complete")
        .sort((a, b) => a.cycle.localeCompare(b.cycle))[0];
      if (!q) fail("수령할 보상이 없어요");
      q.status = "claimed";
      ledger(db, u, "coins", q.reward, q.snapshot.title, {
        kind: "reward",
        questId: q.id,
        cycle: q.cycle,
      });
    } else {
      requireStore(u);
      if (["visit", "cumulative"].includes(def.kind))
        fail("QR 참여 기록으로 자동 진행돼요");
      let q = u.quests.find(
        (q) => q.id === def.id && q.cycle === cycle(db, def),
      );
      if (!def.enabled || !enabled(db, q?.snapshot || def))
        fail("지금은 참여할 수 없는 퀘스트예요");
      if (!q) {
        q = {
          id: def.id,
          cycle: cycle(db, def),
          status: "active",
          reward: def.reward,
          snapshot: copy(def),
        };
        u.quests.push(q);
      }
      if (["complete", "claimed", "pending"].includes(q.status))
        fail("이미 진행을 마친 퀘스트예요");
      if (data.action === "progress") {
        if (q.snapshot.kind === "explore" && data.value !== "plant")
          fail("화분을 선택해주세요");
        if (
          q.snapshot.kind === "mood" &&
          !["happy", "calm", "tired", "focused"].includes(data.value)
        )
          fail("기분을 선택해주세요");
        q.status = q.snapshot.kind === "purchase" ? "pending" : "complete";
        q.note = "";
      } else if (data.action !== "start") fail("잘못된 동작이에요");
    }
  } else if (path === "buy") {
    const item = db.items.find((i) => i.id === data.id);
    if (!item || !enabled(db, item)) fail("판매 중인 상품이 아니에요");
    if (Object.hasOwn(u.inventory, item.id)) fail("이미 보유한 아이템이에요");
    ledger(db, u, "coins", -item.price, item.name + " 구매", {
      kind: "purchase",
    });
    u.inventory[item.id] = false;
  } else if (path === "equip") {
    const item = db.items.find((i) => i.id === data.id);
    if (!item || !Object.hasOwn(u.inventory, item.id))
      fail("보유 아이템만 착용할 수 있어요");
    const was = u.inventory[item.id];
    for (const i of db.items)
      if (i.slot === item.slot && Object.hasOwn(u.inventory, i.id))
        u.inventory[i.id] = false;
    u.inventory[item.id] = !was;
  } else if (path === "block") {
    const g = target(db, data.id);
    if (g.id === u.id) fail("본인을 차단할 수 없어요");
    if (!u.blocks.includes(g.id)) u.blocks.push(g.id);
  } else if (path === "unblock")
    u.blocks = u.blocks.filter((uid) => uid !== data.id);
  else if (path === "report") {
    const g = target(db, data.id);
    if (g.id === u.id) fail("본인을 신고할 수 없어요");
    db.reports.push({
      id: id("report"),
      uid: u.id,
      target: g.id,
      reason: text(data, "reason"),
      created: time(db) / 1000,
      resolved: false,
    });
  } else if (path === "stamps/redeem") {
    requireLinked(u);
    requireStore(u);
    const row = ledger(db, u, "stamps", -10, "무료 음료 사용", {
      kind: "redeem",
    });
    return {
      ...state(db),
      receipt: {
        id: row.id,
        created: row.created,
        amount: 10,
        demo: true,
        label: "실제 음료 교환 불가 · 데모 영수증",
      },
    };
  } else if (path === "stamps/convert") {
    requireLinked(u);
    const amount = integer(data.amount ?? data.stamps, 1, 100),
      coins = amount * 50;
    const stamp = ledger(db, u, "stamps", -amount, "데모 예시 코인 전환", {
      kind: "conversion",
    });
    const coin = ledger(db, u, "coins", coins, "데모 예시 코인 전환", {
      kind: "conversion",
      related: stamp.id,
    });
    stamp.related = coin.id;
    return {
      ...state(db),
      receipt: {
        id: stamp.id,
        created: stamp.created,
        amount,
        coins,
        demo: true,
        label: "예시 1:50 · 실제 전환 비율 아님",
      },
    };
  } else if (path.startsWith("staff/"))
    return { ...stateAfterOperation(db, u, path, data) };
  else fail("준비되지 않은 데모 동작이에요");
  return state(db);
}
function stateAfterOperation(db, u, path, data) {
  const receipt = operation(db, u, path.slice(6), data);
  return { ...state(db), receipt };
}
function run(path, data, key) {
  path = path.replace(/^\/api\//, "").replace(/^\//, "");
  if (path === 'avatar' && data !== undefined && (!data || typeof data !== 'object' || Array.isArray(data))) fail('캐릭터 선택 형식을 확인해주세요');
  const db = load();
  const signature = JSON.stringify([path, data]),
    scope = `${db.current || "anonymous"}:${key || ""}`;
  if (key && db.requests[scope]) {
    const prior = db.requests[scope];
    if (prior.signature !== signature)
      fail("다른 요청에 같은 거래키를 쓸 수 없어요");
    return copy(prior.result);
  }
  // Mutation works on a fresh copy and is persisted only after success.
  const result = dispatch(db, path, data || {});
  if (key) {
    db.requests[scope] = { signature, result: copy(result) };
    const keys = Object.keys(db.requests);
    if (keys.length > 400)
      for (const k of keys.slice(0, keys.length - 400)) delete db.requests[k];
  }
  const persisted = save(db);
  if (
    result &&
    typeof result === "object" &&
    !Array.isArray(result) &&
    result.config
  )
    result.config.storagePersistent = persisted;
  return copy(result);
}
export async function demoApi(path, data, key) {
  if (globalThis.navigator?.locks?.request)
    return navigator.locks.request(STORAGE_KEY, () => run(path, data, key));
  return run(path, data, key);
}
