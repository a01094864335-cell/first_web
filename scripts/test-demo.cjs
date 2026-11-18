/* Dependency-free isolated demo API regression tests. Never contacts a server. */
const assert = require("node:assert/strict");
(async () => {
  Object.defineProperty(globalThis, "navigator", {
    value: {},
    configurable: true,
  });
  const entries = new Map();
  global.localStorage = {
    getItem: (k) => entries.get(k) || null,
    setItem: (k, v) => entries.set(k, v),
  };
  global.fetch = () => {
    throw Error("Demo must never call network");
  };
  const { demoApi: api } = await import("../demo-api.js");
  let key = 0;
  const call = (path, data) =>
    api(path, data, data === undefined ? undefined : `test-${++key}`);
  async function reset() {
    await call("demo/reset", {});
    return call("guest", {
      nickname: "보리",
      appearance: { color: "#a777be" },
    });
  }
  async function rejects(path, data, pattern) {
    await assert.rejects(() => call(path, data), pattern);
  }
  let s = await reset();
  assert.equal(s.config.demo, true);
  assert.equal(s.user.coins, 100);
  assert.equal(s.user.linked, false);
  const customer = s.user.id;
  assert.equal(s.session.visible, false);
  await rejects("quest", { id: "plant", action: "start" }, /QR/);
  await call("checkin", { entry: "cafe" });
  s = await call("quest", { id: "visit", action: "claim" });
  assert.equal(s.user.coins, 120);
  assert.equal(s.user.stamps, 0);
  await call("checkout", {});
  await call("checkin", { entry: "cafe" });
  await rejects("quest", { id: "visit", action: "claim" }, /보상/);
  await call("quest", { id: "mood", action: "start" });
  await call("quest", { id: "mood", action: "progress", value: "happy" });
  await call("checkout", {});
  s = await call("quest", { id: "mood", action: "claim" });
  assert.equal(s.user.coins, 130);
  const bought = await api("buy", { id: "item3" }, "same-purchase");
  const again = await api("buy", { id: "item3" }, "same-purchase");
  assert.equal(bought.user.coins, 110);
  assert.equal(again.user.coins, 110);
  await assert.rejects(
    () => api("buy", { id: "item4" }, "same-purchase"),
    /거래키/,
  );
  s = await call("equip", { id: "item3" });
  assert(s.user.appearance.equipped.includes("item3"));
  await call("privacy", { visible: true, activity: "독서", drink: "" });
  await call("demo/advance", { minutes: 6 });
  s = await call("state");
  assert.equal(s.session.visible, false);
  await call("checkin", { entry: "cafe" });
  await call("privacy", { visible: true });
  await call("demo/advance", { minutes: 91 });
  s = await call("state");
  assert.equal(s.session.mode, "remote");
  assert.equal(s.session.visible, false);
  await rejects(
    "staff/grant",
    { uid: customer, amount: 1, source_ref: "a", reason: "test" },
    /직원/,
  );
  await call("demo/kakao", { mode: "new" });
  await call("demo/role", { role: "staff" });
  let granted = await call("staff/grant", {
    uid: customer,
    amount: 12,
    source_ref: "order1",
    reason: "데모 음료",
  });
  assert.equal(granted.receipt.amount, 12);
  await rejects(
    "staff/grant",
    { uid: customer, amount: 12, source_ref: "order1", reason: "duplicate" },
    /이미/,
  );
  await call("demo/role", { role: "customer" });
  s = await call("state");
  assert.equal(s.user.stamps, 12);
  await rejects("stamps/redeem", {}, /QR/);
  await call("checkin", { entry: "cafe" });
  const receipt = await api("stamps/redeem", {}, "one-drink");
  const replay = await api("stamps/redeem", {}, "one-drink");
  assert.equal(receipt.user.stamps, 2);
  assert.equal(receipt.receipt.id, replay.receipt.id);
  assert.equal(receipt.receipt.demo, true);
  await call("checkout", {});
  s = await call("stamps/convert", { amount: 1 });
  assert.equal(s.user.stamps, 1);
  assert.equal(s.receipt.coins, 50);
  assert.equal(s.config.conversionRate, 50);
  await call("demo/role", { role: "admin" });
  s = await call("staff/restore", {
    original_id: receipt.receipt.id,
    amount: 10,
    reason: "실수 체험",
  });
  assert.equal(s.receipt.amount, 10);
  await rejects(
    "staff/restore",
    { original_id: receipt.receipt.id, amount: 1, reason: "excess" },
    /초과/,
  );
  await call("staff/hide", { uid: customer, reason: "모더레이션" });
  await call("demo/role", { role: "customer" });
  await rejects("privacy", { visible: true }, /공개 제한/);
  await call("demo/role", { role: "admin" });
  await call("staff/unhide", { uid: customer, reason: "해제" });
  await call("staff/business", { closed: true, reason: "마감" });
  await call("demo/role", { role: "customer" });
  await rejects("checkin", { entry: "cafe" }, /종료/);
  await call("demo/role", { role: "admin" });
  await call("staff/business", { closed: false, reason: "개점" });
  await call("demo/role", { role: "customer" });
  await call("checkin", { entry: "cafe" });
  await call("quest", { id: "menu", action: "progress" });
  await call("demo/role", { role: "staff" });
  let dash = await call("staff/dashboard");
  assert.equal(dash.pending.length, 1);
  const pending = dash.pending[0];
  await call("staff/approve", {
    uid: customer,
    qid: pending.qid,
    cycle: pending.cycle,
    approve: true,
    order_ref: "paid-drink",
    reason: "확인",
  });
  await call("demo/role", { role: "customer" });
  await call("checkout", {});
  s = await call("quest", { id: "menu", action: "claim" });
  assert.equal(s.quests.find((q) => q.id === "menu").status, "claimed");
  await call("demo/role", { role: "admin" });
  await call("staff/content", {
    kind: "quest",
    id: "mood",
    body: { title: "새 기분", description: "new", reward: 100, kind: "mood" },
    enabled: true,
    starts: null,
    ends: null,
    reason: "버전",
  });
  dash = await call("staff/dashboard");
  assert.equal(dash.content.quests.find((q) => q.id === "mood").version, 2);
  await call("demo/role", { role: "customer" });
  const before = (await call("state")).user.coins;
  s = await call("demo/kakao", { mode: "existing" });
  assert.equal(s.user.nickname, "기존 계정 · 예시");
  assert.equal(s.user.coins, before + 80);
  assert.equal(s.user.id, "demo-account");
  const balance = s.user.coins;
  s = await call("demo/kakao", { mode: "existing" });
  assert.equal(s.user.coins, balance);
  await call("logout", {});
  s = await call("state");
  assert.equal(s.user, null);
  s = await call("demo/kakao", { mode: "restore" });
  assert.equal(s.user.id, "demo-account");
  await call("demo/role", { role: "guest" });
  s = await call("state");
  assert.equal(s.user.linked, false);
  await rejects("stamps/qr", undefined, /목 카카오/);
  await call("demo/role", { role: "customer" });
  const qr = await call("stamps/qr");
  assert(qr.payload.startsWith("DEMO:"));
  assert.equal(qr.demo, true);
  await call("account/delete", { confirm: true });
  s = await call("state");
  assert.equal(s.user, null);
  s = await reset();
  const path = await call("move", { x: 0.5, y: 0.2 });
  assert(path.path.length > 1);
  await rejects("move", { x: 0.1, y: 0.3 }, /가구/);
  // Cumulative progress is unique per demo business day and never issues stamps.
  await call("checkin", { entry: "cafe" });
  await call("demo/advance", { minutes: 1440 });
  await call("checkin", { entry: "cafe" });
  await call("demo/advance", { minutes: 1440 });
  await call("checkin", { entry: "cafe" });
  let month = await call("quest", { id: "monthly", action: "claim" });
  assert.equal(month.user.stamps, 0);
  await rejects("quest", { id: "monthly", action: "claim" }, /보상/);
  // New mock connection restores its own character rather than switching to the seeded account.
  await call("demo/kakao", { mode: "new" });
  let linkedId = (await call("state")).user.id;
  await call("logout", {});
  assert.equal(
    (await call("demo/kakao", { mode: "restore" })).user.id,
    linkedId,
  );
  // Same persisted data is restored by a new module instance, without a network request.
  const reloaded = await import("../demo-api.js?reload=" + Date.now());
  assert.equal((await reloaded.demoApi("state")).user.id, s.user.id);
  // A failed write must not resurrect an older persisted snapshot on the next call.
  const originalSet = localStorage.setItem;
  localStorage.setItem = () => {
    throw Error("quota");
  };
  const changed = await call("profile", { nickname: "메모리 유지" });
  assert.equal(changed.config.storagePersistent, false);
  assert.equal((await call("state")).user.nickname, "메모리 유지");
  localStorage.setItem = originalSet;
  assert.equal((await call("state")).user.nickname, "메모리 유지");
  console.log(
    "PASS demo API: isolated storage/no network, modes, quests, inventory, receipts, role operations, moderation, content, merge and restore",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
