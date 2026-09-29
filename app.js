const tg = window.Telegram && window.Telegram.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  try {
    tg.setHeaderColor("#000000");
    tg.setBackgroundColor("#000000");
  } catch (e) {}
}

const TASKS_DATE = "29.09.26";
const MAX_TEXT = 100;
const MIN_WITHDRAW = 500;

const TASKS = [
  { id: 1, company: "Кофейня «Зерно»", icon: "coffee", reward: 340, brief: "Оцените атмосферу и вкус фирменного капучино", slots: 40, done: 27 },
  { id: 2, company: "Барбершоп «Бритва»", icon: "scissors", reward: 380, brief: "Расскажите о мастере и качестве стрижки", slots: 25, done: 11 },
  { id: 3, company: "Доставка «Лимон»", icon: "bike", reward: 310, brief: "Как быстро привезли заказ и всё ли было горячим", slots: 60, done: 44 },
  { id: 4, company: "Фитнес «Импульс»", icon: "dumbbell", reward: 360, brief: "Поделитесь впечатлением о зале и тренерах", slots: 30, done: 9 },
  { id: 5, company: "Автосервис «Мотор»", icon: "wrench", reward: 400, brief: "Оцените скорость ремонта и вежливость персонала", slots: 20, done: 14 },
  { id: 6, company: "Цветы «Пион»", icon: "flower-2", reward: 320, brief: "Насколько свежим был букет и понравилась ли упаковка", slots: 35, done: 18 },
  { id: 7, company: "Клиника «Улыбка»", icon: "heart-pulse", reward: 390, brief: "Расскажите о приёме и отношении врача", slots: 15, done: 6 },
  { id: 8, company: "Книжный «Переплёт»", icon: "book-open", reward: 300, brief: "Оцените ассортимент и помощь консультантов", slots: 30, done: 21 },
];

const METHODS = [
  { id: "СБП", icon: "zap", hint: "По номеру телефона, мгновенно", label: "Номер телефона", placeholder: "+7 900 000-00-00" },
  { id: "Карта РФ", icon: "credit-card", hint: "Мир, Visa, Mastercard банков РФ", label: "Номер карты", placeholder: "0000 0000 0000 0000" },
  { id: "Иностранная карта", icon: "globe", hint: "Карты зарубежных банков", label: "Номер карты", placeholder: "0000 0000 0000 0000" },
  { id: "Криптокошелёк", icon: "bitcoin", hint: "USDT (TRC-20)", label: "Адрес кошелька", placeholder: "T..." },
];

const STORAGE_KEY = "werx_state_v1";
const defaultState = {
  tasks: TASKS,
  completedIds: [],
  balance: 0,
  earned: 0,
  completedTotal: 0,
  withdrawals: [],
};

let state = load();
let tab = "tasks";
let openTaskId = null;
let form = { rating: 0, text: "", error: "" };
let participants = rand(100, 500);

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return s ? Object.assign({}, defaultState, s) : JSON.parse(JSON.stringify(defaultState));
  } catch (e) {
    return JSON.parse(JSON.stringify(defaultState));
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function rand(a, b) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

function rub(n) {
  return n.toLocaleString("ru-RU").replace(/,/g, " ");
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

function today() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return p(d.getDate()) + "." + p(d.getMonth() + 1) + "." + String(d.getFullYear()).slice(2);
}

function haptic(type) {
  try {
    tg && tg.HapticFeedback.notificationOccurred(type);
  } catch (e) {}
}

function icons() {
  lucide.createIcons();
}

function getUser() {
  const u = tg && tg.initDataUnsafe && tg.initDataUnsafe.user;
  return {
    nick: u
      ? u.username
        ? "@" + u.username
        : [u.first_name, u.last_name].filter(Boolean).join(" ")
      : "@werx_user",
    photo: u && u.photo_url,
  };
}

function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove("show"), 2600);
}

function available() {
  return state.tasks.reduce((s, t) => s + Math.max(t.slots - t.done, 0), 0);
}

function renderHeader() {
  document.getElementById("headerBalance").textContent = rub(state.balance) + " ₽";
}

function heroHTML() {
  return `
    <section class="hero fade">
      <div class="hero-icons">
        <i><i data-lucide="bell"></i></i>
        <i><i data-lucide="clock"></i></i>
        <i><i data-lucide="send"></i></i>
      </div>
      <div class="hero-row">
        <h2 class="big">Пиши</h2>
        <p class="cash-word">Получай<br>кеш</p>
      </div>
      <h2 class="big" style="margin-top:4px">отзывы</h2>
      <p class="hero-desc">В сервисе предоставлены задачи от разных компаний, которым нужны отзывы для дальнейшего продвижения в бизнесе.</p>
      <ul class="tiles">
        <li class="tile">
          <span class="tile-cap"><i class="dot"></i>сейчас</span>
          <div>
            <div class="tile-num" id="participants">${participants}</div>
            <div class="tile-lbl">участников</div>
          </div>
        </li>
        <li class="tile">
          <span class="tile-cap">ставка</span>
          <div>
            <div class="tile-num small">300–400<small> ₽</small></div>
            <div class="tile-lbl">за один отзыв</div>
          </div>
        </li>
        <li class="tile">
          <span class="tile-cap">на сегодня</span>
          <div>
            <div class="tile-num">${available()}</div>
            <div class="tile-lbl">заданий доступно</div>
          </div>
        </li>
      </ul>
    </section>`;
}

function taskHTML(t) {
  const left = Math.max(t.slots - t.done, 0);
  const out = left === 0;
  const completed = state.completedIds.includes(t.id);
  const disabled = completed || out;
  const open = openTaskId === t.id && !disabled;
  const pct = Math.min(100, Math.round((t.done / t.slots) * 100));

  const right = completed
    ? `<span class="done-badge"><i data-lucide="check"></i>готово</span>`
    : `<div class="reward">+${rub(t.reward)} ₽</div>${
        out ? "" : `<i data-lucide="chevron-down" class="chev ${open ? "open" : ""}"></i>`
      }`;

  const formHTML = open
    ? `
    <div class="task-form">
      <p>${esc(t.brief)}</p>
      <div class="stars">${[1, 2, 3, 4, 5]
        .map(
          (n) =>
            `<button data-star="${n}" class="${n <= form.rating ? "on" : ""}" aria-label="${n} из 5"><i data-lucide="star"></i></button>`
        )
        .join("")}</div>
      <div class="ta-wrap">
        <textarea id="reviewText" rows="3" maxlength="${MAX_TEXT}" placeholder="Ваш отзыв о компании…">${esc(form.text)}</textarea>
        <span class="ta-count" id="taCount">${form.text.length}/${MAX_TEXT}</span>
      </div>
      ${form.error ? `<p class="err">${form.error}</p>` : ""}
      <button class="btn-cash" data-submit="${t.id}">Отправить и получить ${rub(t.reward)} ₽</button>
    </div>`
    : "";

  return `
    <li class="task">
      <button class="task-top" data-task="${t.id}" ${disabled ? "disabled" : ""}>
        <span class="task-ico"><i data-lucide="${t.icon}"></i></span>
        <div class="task-mid">
          <h3 class="task-name">${esc(t.company)}</h3>
          <p class="task-brief">${esc(t.brief)}</p>
          <div class="task-meta">
            <span>выполнено ${t.done}</span>
            <i></i>
            <span class="left ${out ? "out" : ""}">осталось ${left}</span>
          </div>
        </div>
        <div class="task-right">${right}</div>
      </button>
      <div class="progress"><div style="width:${pct}%"></div></div>
      ${formHTML}
    </li>`;
}

function tasksHTML() {
  const done = state.tasks.reduce((s, t) => s + t.done, 0);
  return `
    <section>
      <div class="section-head">
        <h2 class="h2">Задания<br><span class="red">на ${TASKS_DATE}</span></h2>
        <div class="counters">
          <div class="counter"><b>${done}</b><span>выполнено</span></div>
          <div class="counter red"><b>${available()}</b><span>осталось</span></div>
        </div>
      </div>
      <ul class="tasks">${state.tasks.map(taskHTML).join("")}</ul>
    </section>`;
}

function profileHTML() {
  const u = getUser();
  const letter = esc(u.nick.replace("@", "").slice(0, 1).toUpperCase() || "W");
  const history = state.withdrawals.length
    ? `<ul class="history">${state.withdrawals
        .map(
          (w) => `
        <li>
          <span class="h-ico"><i data-lucide="arrow-up-right"></i></span>
          <div class="h-mid">
            <div>${esc(w.method)}</div>
            <div>${w.date}</div>
          </div>
          <div class="h-right">
            <b>−${rub(w.amount)} ₽</b>
            <div class="${w.status === "done" ? "ok" : ""}">${
              w.status === "done" ? "выплачено" : "в обработке"
            }</div>
          </div>
        </li>`
        )
        .join("")}</ul>`
    : `<p class="empty">Выводов пока не было</p>`;

  return `
    <section class="fade">
      <div class="profile-card">
        <div class="profile-top">
          <div class="avatar">${u.photo ? `<img src="${esc(u.photo)}" alt="">` : letter}</div>
          <div style="min-width:0">
            <div class="role">исполнитель</div>
            <h2 class="nick">${esc(u.nick)}</h2>
          </div>
        </div>
        <div class="earned">${rub(state.earned)} ₽</div>
        <div class="earned-lbl">заработано за всё время</div>
      </div>
      <div class="p-grid">
        <div class="p-box green"><span>баланс сейчас</span><b>${rub(state.balance)} ₽</b></div>
        <div class="p-box"><span>выполнено заданий</span><b>${state.completedTotal}</b></div>
      </div>
      <button class="btn-white" id="withdrawBtn">
        <i data-lucide="arrow-up-right"></i>Вывести средства
      </button>
      <h3 class="h2" style="margin-top:36px">История выводов</h3>
      ${history}
    </section>`;
}

function render() {
  renderHeader();
  document.getElementById("view").innerHTML =
    tab === "tasks" ? heroHTML() + tasksHTML() : profileHTML();
  document.querySelectorAll(".nav button").forEach((b) =>
    b.classList.toggle("active", b.dataset.tab === tab)
  );
  icons();
}

function submitReview(id) {
  const t = state.tasks.find((x) => x.id === id);
  if (!form.rating) {
    form.error = "Поставьте оценку от 1 до 5 звёзд";
    return render();
  }
  if (form.text.trim().length < 10) {
    form.error = "Напишите хотя бы 10 символов";
    return render();
  }
  t.done += 1;
  state.completedIds.push(id);
  state.balance += t.reward;
  state.earned += t.reward;
  state.completedTotal += 1;
  save();
  openTaskId = null;
  form = { rating: 0, text: "", error: "" };
  haptic("success");
  toast("Отзыв принят: +" + rub(t.reward) + " ₽");
  render();
}

document.getElementById("view").addEventListener("click", (e) => {
  const star = e.target.closest("[data-star]");
  if (star) {
    form.rating = +star.dataset.star;
    form.error = "";
    return render();
  }
  const sub = e.target.closest("[data-submit]");
  if (sub) return submitReview(+sub.dataset.submit);
  const task = e.target.closest("[data-task]");
  if (task) {
    const id = +task.dataset.task;
    openTaskId = openTaskId === id ? null : id;
    form = { rating: 0, text: "", error: "" };
    return render();
  }
  if (e.target.closest("#withdrawBtn")) openWithdraw();
});

document.getElementById("view").addEventListener("input", (e) => {
  if (e.target.id === "reviewText") {
    form.text = e.target.value.slice(0, MAX_TEXT);
    const counter = document.getElementById("taCount");
    if (counter) counter.textContent = form.text.length + "/" + MAX_TEXT;
  }
});

document.querySelectorAll(".nav button").forEach((b) =>
  b.addEventListener("click", () => {
    tab = b.dataset.tab;
    openTaskId = null;
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  })
);

const overlay = document.getElementById("overlay");
const sheet = document.getElementById("sheet");
let wMethod = null;

function openWithdraw() {
  wMethod = null;
  renderSheet();
  overlay.classList.add("show");
}

function closeWithdraw() {
  overlay.classList.remove("show");
}

function renderSheet(error) {
  const m = METHODS.find((x) => x.id === wMethod);
  const body = !m
    ? `<ul class="methods">${METHODS.map(
        (x) => `
      <li>
        <button class="method" data-method="${x.id}">
          <span class="m-ico"><i data-lucide="${x.icon}"></i></span>
          <span class="m-txt">${x.id}<span>${x.hint}</span></span>
          <i data-lucide="chevron-right"></i>
        </button>
      </li>`
      ).join("")}</ul>`
    : `
      <button class="back" id="wBack"><i data-lucide="chevron-left"></i>Другой способ</button>
      <div class="field">
        <label>${m.label} · ${m.id}</label>
        <input id="wReq" placeholder="${m.placeholder}" />
      </div>
      <div class="field">
        <label>Сумма, ₽ (от ${MIN_WITHDRAW})</label>
        <input id="wAmount" type="number" inputmode="numeric" placeholder="${MIN_WITHDRAW}" />
      </div>
      <button class="all" id="wAll">Вывести всё</button>
      ${error ? `<p class="err">${error}</p>` : ""}
      <button class="btn-cash" id="wSubmit">Вывести</button>`;

  sheet.innerHTML = `
    <div class="sheet-head">
      <h3>Вывод средств</h3>
      <button class="x" id="wClose"><i data-lucide="x"></i></button>
    </div>
    <p class="sheet-sub">Выберите удобный способ</p>
    <div class="w-balance">
      <span>Доступно к выводу</span>
      <b>${rub(state.balance)} ₽</b>
    </div>
    ${body}`;
  icons();
}

overlay.addEventListener("click", (e) => {
  if (e.target === overlay || e.target.closest("#wClose")) return closeWithdraw();
  const mb = e.target.closest("[data-method]");
  if (mb) {
    wMethod = mb.dataset.method;
    return renderSheet();
  }
  if (e.target.closest("#wBack")) {
    wMethod = null;
    return renderSheet();
  }
  if (e.target.closest("#wAll")) {
    const input = document.getElementById("wAmount");
    if (input) input.value = state.balance;
    return;
  }
  if (e.target.closest("#wSubmit")) {
    const req = document.getElementById("wReq").value.trim();
    const sum = Number(document.getElementById("wAmount").value);
    const keep = (msg) => {
      renderSheet(msg);
      document.getElementById("wReq").value = req;
      document.getElementById("wAmount").value = sum || "";
      haptic("error");
    };
    if (req.length < 6) return keep("Укажите реквизиты");
    if (!sum || sum < MIN_WITHDRAW) return keep("Минимальная сумма — " + MIN_WITHDRAW + " ₽");
    if (sum > state.balance) return keep("Недостаточно средств");
    state.balance -= sum;
    state.withdrawals.unshift({
      id: Date.now(),
      method: wMethod,
      requisites: req,
      amount: sum,
      date: today(),
      status: "pending",
    });
    save();
    closeWithdraw();
    haptic("success");
    toast("Заявка на вывод " + rub(sum) + " ₽ создана");
    render();
  }
});

setInterval(() => {
  participants = rand(100, 500);
  const el = document.getElementById("participants");
  if (el) {
    el.textContent = participants;
    el.classList.remove("fade");
    void el.offsetWidth;
    el.classList.add("fade");
  }
}, 60000);

render();
