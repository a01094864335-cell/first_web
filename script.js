const app = document.querySelector("#app"),
  sheet = document.querySelector("#sheet"),
  toastEl = document.querySelector("#toast");
let state = null,
  page = "cafe",
  wardrobeTab = "closet",
  offline = false,
  entryPending = new URLSearchParams(location.search).get("entry"),
  busy = false;
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const notify = (text) => {
  toastEl.textContent = text;
  toastEl.classList.add("show");
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => toastEl.classList.remove("show"), 4500);
};
async function api(path, data) {
  const res = await fetch("/api/" + path, {
    method: data === undefined ? "GET" : "POST",
    headers:
      data === undefined
        ? {}
        : {
            "Content-Type": "application/json",
            "Idempotency-Key": crypto.randomUUID(),
          },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw Error(result.error || "요청을 완료하지 못했어요.");
  return result;
}
async function refresh(render = true) {
  try {
    state = await api("state");
    offline = false;
    if (render) draw();
  } catch (e) {
    offline = true;
    if (state && render) draw();
    else if (!state)
      app.innerHTML =
        '<p class="loading">서버에 연결할 수 없어요.<br><button data-action="retry">다시 연결</button></p>';
    throw e;
  }
}
async function act(path, data, success) {
  if (busy) return;
  busy = true;
  try {
    const result = await api(path, data);
    await refresh();
    if (success) notify(success);
    return result;
  } catch (e) {
    notify(e.message);
  } finally {
    busy = false;
  }
}
const isStore = () => state?.session?.mode === "store";
const icons = { hat: "🧢", cup: "☕", accessory: "🌼", prop: "📖" };
function person(u, s, self = false) {
  const equipped = u.appearance?.equipped || [];
  const outfits = {item6:'#dfbf62',item7:'#789b66',item8:'#709cb3',item9:'#c57c77'};
  const color = outfits[equipped.find(i=>outfits[i])] || (/^#[0-9a-f]{6}$/i.test(u.appearance?.color) ? u.appearance.color : '#a777be');
  const hat = equipped.find(i=>['item0','item1','item2'].includes(i));
  const prop = equipped.find(i=>['item3','item4','item5'].includes(i));
  const props = {item3:'📖',item4:'☕',item5:'🌼'};
  return `<div class="person ${self ? "self" : ""} ${s.mode === "remote" ? "remote" : ""}" style="left:${(Number(s.x) || 0.55) * 100}%;top:${(Number(s.y) || 0.66) * 100}%;--shirt:${color};z-index:${Math.round((Number(s.y) || 0.66) * 100)}" ${self ? 'id="player"' : ""} aria-label="${esc(u.nickname)}${s.mode === "remote" ? " 원격" : ""}"><i class="head"></i><i class="body"></i><i class="feet"></i>${s.mode === "remote" ? '<span class="tag">원격</span>' : ""}${hat ? `<span class="hat ${hat}" aria-label="모자"></span>` : ""}${prop ? `<span class="prop">${props[prop]}</span>` : ""}</div>`;
}
function nav() {
  return `<nav class="bottom-nav" aria-label="주 메뉴">${[
    ["cafe", "⌂", "카페"],
    ["quests", "♧", "퀘스트"],
    ["character", "☺", "내 캐릭터"],
  ]
    .map(
      ([id, icon, label]) =>
        `<button data-page="${id}" class="${page === id ? "active" : ""}" ${page === id ? 'aria-current="page"' : ""}><span aria-hidden="true">${icon}</span>${label}</button>`,
    )
    .join("")}</nav>`;
}
function header() {
  return `<header><div><h1>THE CREDIT</h1><span class="mode">${isStore() ? "● 매장 모드" : "◌ 원격 모드"}</span></div><div class="header-actions"><button class="icon-button coin" data-action="ledger" aria-label="코인 내역">◉ ${state.user.coins}</button><button class="icon-button" data-action="profile" aria-label="내 프로필 및 설정">☺</button><button class="icon-button" data-action="hide" ${!state.session.visible ? "disabled" : ""}>숨기기</button></div></header>`;
}
function furnishing(name, x, y, w) {
  return `<img class="furniture" src="/public/assets/${name}.webp" alt="" style="left:${x}%;top:${y}%;width:${w}%;z-index:${Math.round(y)}" draggable="false">`;
}
function mapView() {
  const guests = state.guests || [];
  return `<div class="toolbar"><button data-action="guests">맵 참여 중 ${guests.length + (state.session.visible ? 1 : 0)}명 ›</button><button data-action="stamps">▣ 내 스탬프 ${state.user.stamps}</button></div><div class="map-wrap"><div class="map" id="map" role="application" aria-label="카페 맵. 클릭하여 이동하거나 아래 퀘스트 메뉴를 이용하세요." tabindex="0"><img class="map-bg" src="/public/assets/background.webp" alt="긴 직사각형 카페, 왼쪽 바와 아래쪽 ㄴ자 벤치" draggable="false">${furnishing("wall-shelf", 10, 65, 10)}${furnishing("bar-counter", 24, 65, 17)}${[31, 41, 51, 61].map((y) => furnishing("bar-stool", 36, y, 7)).join("")}${furnishing("l-bench", 31, 95, 50)}${[
    [78, 39],
    [78, 65],
    [24, 84],
    [24, 95],
    [41, 95],
    [58, 95],
  ]
    .map(([x, y]) => furnishing("round-table", x, y, 15))
    .join(
      "",
    )}${furnishing("plant", 85, 21, 15)}${furnishing("coffee-machine", 24, 35, 12)}<button class="plant-action" data-action="plant" aria-label="퀘스트 오브젝트: 새 화분 살펴보기">♧</button>${guests.map((g) => person(g, g.session || g)).join("")}${person(state.user, state.session, true)}</div></div><button class="quest-strip" data-page="quests">♧ 오늘의 작은 발견 · 퀘스트 보기 ›</button>`;
}
function questsView() {
  return `<section class="page"><h2>오늘의 작은 발견</h2><p class="muted page-intro">${isStore() ? "천천히 둘러보고 나만의 취향을 찾아보세요." : "원격에서는 미리보기만 가능해요. 매장 QR로 참여하면 진행할 수 있어요."}</p>${
    (state.quests || [])
      .map((q) => {
        const ready = ["complete", "completed", "claimable"].includes(q.status),
          claimed = ["claimed", "rewarded"].includes(q.status);
        return `<article class="card"><div class="row"><h3>${esc(q.title)}</h3><span class="status">◉ ${q.reward}</span></div><p>${esc(q.description)}</p><div class="actions"><span class="muted">${esc({ available: "시작 전", active: "진행 중", started: "진행 중", pending: "직원 승인 대기", complete: "완료", completed: "완료", claimed: "수령 완료", rejected: "승인 거절" }[q.status] || q.status)}</span>${claimed ? "" : ready ? `<button class="primary" data-quest="${esc(q.id)}" data-qaction="claim">보상 받기</button>` : q.status === "pending" ? "" : `<button data-quest="${esc(q.id)}" data-qaction="${q.status === "available" ? "start" : "progress"}" ${!isStore() ? "disabled" : ""}>${q.status === "available" ? "시작하기" : q.kind === "purchase" ? "직원 확인 요청" : q.kind === "mood" ? "기분 선택" : "확인하기"}</button>`}</div></article>`;
      })
      .join("") || '<p class="empty">등록된 퀘스트가 없어요.</p>'
  }</section>`;
}
function characterView() {
  const items = (state.items || []).filter(
    (i) => wardrobeTab === "shop" || i.owned,
  );
  return `<section class="page"><h2>${esc(state.user.nickname)}의 옷장</h2><p class="muted">내 취향대로, 천천히 모아가요.</p><div class="wardrobe-preview">${person(state.user, { mode: "store", x: 0.5, y: 0.5 }, true)}</div><div class="actions"><button data-action="privacy">공개 설정</button><button data-action="account">계정 · 복구 안내</button></div><div class="tabs"><button data-tab="closet" class="${wardrobeTab === "closet" ? "active" : ""}">내 아이템</button><button data-tab="shop" class="${wardrobeTab === "shop" ? "active" : ""}">꾸미기 상점</button></div><div class="grid">${items.map((i) => `<article class="card"><div class="item-icon">${icons[i.slot] || "✦"}</div><h3>${esc(i.name)}</h3><p class="muted">${i.owned ? "보유 중" : "◉ " + i.price}</p><div class="actions"><button data-item="${esc(i.id)}" data-iaction="${i.owned ? "equip" : "buy"}">${i.owned ? (i.equipped ? "해제" : "착용") : "구매"}</button></div></article>`).join("")}</div>${!items.length ? '<p class="empty">아직 모은 아이템이 없어요.<br>퀘스트로 코인을 모아 상점을 구경해보세요.</p>' : ""}</section>`;
}
function draw() {
  app.removeAttribute("aria-busy");
  if (!state?.user) {
    app.innerHTML =
      '<div class="loading"><h1>THE CREDIT</h1><p>카페에 머무는 또 하나의 방법</p><button data-action="onboard" class="primary">내 캐릭터 만들기</button></div>';
    return;
  }
  const remaining = new Date(state.session.expiresAt).getTime() - Date.now();
  app.innerHTML =
    header() +
    (offline
      ? '<div class="notice connection">연결이 끊겼어요. 최신 상태를 다시 확인해주세요.</div>'
      : "") +
    (isStore() && remaining > 0 && remaining < 600000
      ? '<div class="notice">아직 카페에 계신가요? <button data-action="extend">90분 연장</button></div>'
      : "") +
    (page === "cafe"
      ? mapView()
      : page === "quests"
        ? questsView()
        : characterView()) +
    nav();
}
function modal(title, body) {
  sheet.innerHTML = `<div class="sheet-header"><h2 id="sheet-title">${esc(title)}</h2><button data-action="close" aria-label="닫기">×</button></div><div class="sheet-content">${body}</div>`;
  if (!sheet.open) sheet.showModal();
}
function onboard() {
  modal(
    "처음 오셨네요 ☕",
    `<p>닉네임과 기본 색상을 골라주세요.</p><form id="onboard"><label>닉네임<input name="nickname" maxlength="16" required autocomplete="nickname" placeholder="카페에서 부를 이름"></label><label>기본 옷 색상<select name="appearance"><option value="0">라벤더</option><option value="1">세이지</option><option value="2">하늘</option><option value="3">코랄</option></select></label><p class="muted">진행도는 서버에 저장돼요. 카카오에 연결하지 않은 게스트는 브라우저 데이터를 삭제하거나 기기를 바꾸면 복구하기 어려울 수 있어요.</p><button class="primary" type="submit">카페 들어가기</button></form>`,
  );
}
function privacy() {
  modal(
    "내가 고르는 공개 범위",
    `<p class="muted">기본은 비공개예요. 공개하면 닉네임과 캐릭터가 보여요. 작은 매장에서는 공개 정보로 나를 알아볼 수 있어요.</p><form id="privacy"><label><input type="checkbox" name="visible" ${state.session.visible ? "checked" : ""}>맵과 손님 목록에 나를 공개</label><label>활동<select name="activity">${["", "독서", "작업", "휴식", "수다"].map((v) => `<option ${state.session.activity === v ? "selected" : ""} value="${v}">${v || "공개하지 않음"}</option>`).join("")}</select></label><label>오늘 고른 음료<input name="drink" maxlength="30" value="${esc(state.session.drink)}" placeholder="비워두면 공개하지 않아요"></label><button type="submit" class="primary">저장</button></form>`,
  );
}
function profile() {
  modal(
    "내 참여 상태",
    `<h3>${esc(state.user.nickname)}</h3><p>${isStore() ? "매장 QR로 참여 중" : "원격으로 둘러보는 중"} · ${state.session.visible ? "공개" : "비공개"}</p>${isStore() ? `<p class="muted">종료 예정 ${esc(new Date(state.session.expiresAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }))}. 실제 위치나 좌석 점유를 뜻하지 않아요.</p>` : ""}<div class="stack"><button data-action="privacy">공개 설정</button>${isStore() ? '<button data-action="extend">90분 연장</button><button data-action="checkout">매장 참여 종료</button>' : ""}<button data-action="account">계정 및 설정</button></div>`,
  );
}
function stamps() {
  modal(
    "내 스탬프",
    `<h3>${state.user.stamps}개</h3><div class="stamp-grid">${Array.from({ length: 10 }, (_, i) => `<span class="${i < state.user.stamps ? "filled" : ""}">${i < state.user.stamps ? "☕" : "·"}</span>`).join("")}</div><p>유료 음료 한 잔당 1개. 10개로 원하는 음료 한 잔을 교환해요.</p><p class="muted">웹 코인과 스탬프는 별개예요. 적립에는 카카오 계정 연결과 직원 확인이 필요해요.</p><div class="stack"><button data-action="account">${state.user.linked ? "연결 계정 확인" : "카카오 연결 안내"}</button><button disabled>무료 음료 사용 · 연결 준비 중</button><button disabled>코인 전환 · 비율 확정 후 제공</button></div>`,
  );
}
function guests() {
  modal(
    "함께 머무는 손님",
    `<p class="muted">맵에 공개 참여 중인 손님이에요. 실제 매장 인원이나 좌석 현황과 다를 수 있어요.</p>${(state.guests || []).map((g) => `<article class="card"><h3>${esc(g.nickname)} ${g.mode === "remote" ? "· 원격" : ""}</h3><p>${esc(g.activity || "")} ${esc(g.drink || "")}</p><div class="actions"><button data-guest="${esc(g.id)}" data-gaction="block">차단</button><button data-guest="${esc(g.id)}" data-gaction="report">신고</button></div></article>`).join("") || '<p class="empty">지금은 공개한 다른 손님이 없어요.<br>혼자서도 편안히 둘러보세요.</p>'}`,
  );
}
app.addEventListener("click", handle);
sheet.addEventListener("click", handle);
app.addEventListener("keydown", (e) => {
  if (e.target.id !== "map" || !state) return;
  const delta = {
    ArrowLeft: [-0.04, 0],
    ArrowRight: [0.04, 0],
    ArrowUp: [0, -0.04],
    ArrowDown: [0, 0.04],
  }[e.key];
  if (delta) {
    e.preventDefault();
    walk(state.session.x + delta[0], state.session.y + delta[1]);
  }
});
async function handle(e) {
  const b = e.target.closest("button");
  if (b) {
    if (b.dataset.page) {
      page = b.dataset.page;
      draw();
      return;
    }
    if (b.dataset.tab) {
      wardrobeTab = b.dataset.tab;
      draw();
      return;
    }
    if (b.dataset.quest) {
      const q = state.quests.find((q) => q.id === b.dataset.quest);
      if (b.dataset.qaction === "progress" && q.kind === "mood") {
        modal(
          "오늘의 기분",
          `<p>다른 손님에게 공개하지 않아도 괜찮아요.</p><div class="actions">${[
            ["calm", "편안해요"],
            ["focused", "집중하고 싶어요"],
            ["happy", "설레요"],
            ["tired", "쉬고 싶어요"],
          ]
            .map(
              ([v, label]) =>
                `<button data-mood="${v}" data-qid="${esc(q.id)}">${label}</button>`,
            )
            .join("")}</div>`,
        );
        return;
      }
      if (b.dataset.qaction === "progress" && q.kind === "explore") {
        page = "cafe";
        draw();
        notify("오른쪽 위 화분의 ♧ 버튼을 눌러주세요.");
        return;
      }
      await act(
        "quest",
        { id: b.dataset.quest, action: b.dataset.qaction },
        "퀘스트 상태를 업데이트했어요.",
      );
      return;
    }
    if (b.dataset.mood) {
      await act(
        "quest",
        { id: b.dataset.qid, action: "progress", value: b.dataset.mood },
        "오늘의 기분을 기록했어요.",
      );
      sheet.close();
      return;
    }
    if (b.dataset.item) {
      const item = state.items.find((i) => i.id === b.dataset.item);
      if (b.dataset.iaction === "buy") {
        modal(
          "구매 확인",
          `<h3>${esc(item.name)}</h3><p>${item.price} 코인을 사용해요. 남은 코인: ${state.user.coins - item.price}</p><button data-buy="${esc(item.id)}" class="primary" ${state.user.coins < item.price ? "disabled" : ""}>구매 확정</button>`,
        );
      } else await act("equip", { id: item.id }, "착용 상태를 저장했어요.");
      return;
    }
    if (b.dataset.buy) {
      if (await act("buy", { id: b.dataset.buy }, "내 아이템에 추가했어요."))
        sheet.close();
      return;
    }
    if (b.dataset.guest) {
      if (b.dataset.gaction === "block") {
        await act(
          "block",
          { id: b.dataset.guest },
          "서로의 손님 카드가 숨겨져요.",
        );
        guests();
      } else
        modal(
          "신고하기",
          `<form id="report" data-id="${esc(b.dataset.guest)}"><label>신고 사유<input name="reason" required maxlength="200"></label><button type="submit">신고 접수</button></form>`,
        );
      return;
    }
    const action = b.dataset.action;
    if (action === "close") sheet.close();
    if (action === "retry") {
      try {
        await refresh();
      } catch {
        notify("아직 연결할 수 없어요.");
      }
    }
    if (action === "onboard") onboard();
    if (action === "profile") profile();
    if (action === "privacy") privacy();
    if (action === "stamps") stamps();
    if (action === "guests") guests();
    if (action === "hide")
      await act(
        "privacy",
        { visible: false, activity: "", drink: "" },
        "모두에게 숨겼어요.",
      );
    if (action === "extend") {
      await act("extend", {}, "참여 시간을 연장했어요.");
      sheet.close();
    }
    if (action === "checkout") {
      modal(
        "매장 참여를 마칠까요?",
        `<p>공개가 숨겨지고 퀘스트 진행이 멈춰요. 보유 코인과 아이템은 그대로 남아요.</p><button data-action="confirm-checkout">참여 종료</button>`,
      );
    }
    if (action === "confirm-checkout") {
      await act("checkout", {}, "원격 모드로 전환했어요.");
      sheet.close();
    }
    if (action === "plant") {
      const q = state.quests.find((q) => q.kind === "explore");
      if (!q) {
        notify("탐색 퀘스트를 확인해주세요.");
        return;
      }
      if (!isStore()) {
        notify("매장 QR로 참여하면 탐색할 수 있어요.");
        return;
      }
      await act(
        "quest",
        {
          id: q.id,
          action: q.status === "available" ? "start" : "progress",
          value: "plant",
        },
        q.status === "available"
          ? "퀘스트를 시작했어요. 화분을 한 번 더 살펴보세요."
          : "화분을 살펴봤어요.",
      );
    }
    if (action === "account")
      modal(
        "계정과 데이터",
        `<p>${state.user.linked ? "카카오에 연결된 계정이에요." : "현재 게스트 계정이에요."}</p><p class="muted">이 브라우저에서 서버에 저장된 진행도를 이어갈 수 있어요. 미연결 게스트는 브라우저 데이터 삭제나 기기 변경 시 복구가 제한돼요.</p><p>카카오 로그인·계정 병합과 탈퇴 기능은 운영 설정이 완료된 뒤 제공돼요. 지금 연결된 것처럼 처리하지 않아요.</p><button disabled>카카오 연결 · 준비 중</button>`,
      );
    if (action === "ledger")
      modal(
        "코인 내역",
        `<p>꾸미기에 사용하는 웹 코인이에요. 스탬프·음료·현금으로 바꿀 수 없어요.</p>${(state.ledger || []).filter(l=>l.currency==="coins").map((l) => `<div class="ledger-row row"><span>${esc(l.reason || l.type)}<br><small>${esc(l.created ? new Date(l.created*1000).toLocaleString("ko-KR") : "")}</small></span><strong>${esc(l.amount)}</strong></div>`).join("") || '<p class="empty">아직 거래가 없어요.</p>'}`,
      );
    return;
  }
  if (e.target.closest("#map")) {
    const r = e.target.closest("#map").getBoundingClientRect();
    await walk((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
  }
}
sheet.addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target,
    d = new FormData(f);
  if (f.id === "onboard") {
    const r = await act("guest", {
      nickname: d.get("nickname"),
      appearance: {
        color: ["#a777be", "#789b66", "#709cb3", "#c57c77"][
          Number(d.get("appearance"))
        ],
      },
    });
    if (r) {
      sheet.close();
      await checkEntry();
    }
  }
  if (f.id === "privacy") {
    if (
      await act(
        "privacy",
        {
          visible: d.has("visible"),
          activity: d.get("activity"),
          drink: d.get("drink"),
        },
        "공개 설정을 저장했어요.",
      )
    )
      sheet.close();
  }
  if (f.id === "report") {
    await act(
      "report",
      { id: f.dataset.id, reason: d.get("reason") },
      "신고를 접수했어요.",
    );
    sheet.close();
  }
});
async function checkEntry() {
  if (entryPending && state?.user) {
    const entryCode = entryPending;
    entryPending = false;
    const checkedIn = await act(
      "checkin",
      {entry:entryCode},
      "매장 모드로 참여했어요. 공개는 직접 선택해주세요.",
    );
    history.replaceState(null, "", location.pathname);
    if (checkedIn) privacy();
  }
}
async function walk(x, y) {
  if (busy) return;
  busy = true;
  try {
    const result = await api("move", { x, y });
    const player = document.querySelector("#map #player");
    for (const pt of result.path || [{ x, y }]) {
      if (!player || !player.isConnected || page !== "cafe") break;
      const px = Array.isArray(pt) ? pt[0] : pt.x,
        py = Array.isArray(pt) ? pt[1] : pt.y;
      player.style.left = px * 100 + "%";
      player.style.top = py * 100 + "%";
      player.style.zIndex = Math.round(py * 100);
      await new Promise((r) => setTimeout(r, 90));
    }
    await refresh();
  } catch (e) {
    notify(e.message);
  } finally {
    busy = false;
  }
}
try {
  await refresh();
  await checkEntry();
} catch {}
setInterval(async () => {
  if (!document.hidden && !busy) {
    try {
      await api("heartbeat", { foreground: true });
      await refresh(!sheet.open);
    } catch {}
  }
}, 4000);
