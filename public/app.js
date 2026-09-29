const nav = document.querySelector("#nav");
const quiz = document.querySelector("#quiz");
const qEl = document.querySelector("#q");
const opts = document.querySelector("#opts");
const msg = document.querySelector("#msg");
const xpEl = document.querySelector("#xp");
let lesson = null;
let i = 0;
let lock = false;

nav.addEventListener("click", async (event) => {
  const btn = event.target.closest("[data-id]");
  if (!btn) return;
  lesson = await (await fetch("/api/lessons/" + btn.dataset.id)).json();
  i = 0;
  quiz.hidden = false;
  paintQ();
});

opts.addEventListener("click", async (event) => {
  const btn = event.target.closest("[data-i]");
  if (!btn || lock) return;
  lock = true;
  const ok = Number(btn.dataset.i) === lesson.items[i].i;
  msg.textContent = ok ? "Bien" : `Era ${lesson.items[i].a[lesson.items[i].i]}`;
  setTimeout(async () => {
    i += 1;
    lock = false;
    if (i >= lesson.items.length) {
      await fetch("/api/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lesson.id }),
      });
      quiz.hidden = true;
      load();
      return;
    }
    paintQ();
  }, 600);
});

function paintQ() {
  const item = lesson.items[i];
  qEl.textContent = item.q;
  msg.textContent = `${i + 1}/${lesson.items.length}`;
  opts.innerHTML = item.a.map((t, idx) => `<button type="button" data-i="${idx}">${t}</button>`).join("");
}

async function load() {
  const data = await (await fetch("/api/lessons")).json();
  xpEl.textContent = data.xp;
  nav.innerHTML = data.lessons
    .map((l) => `<button type="button" data-id="${l.id}" class="${l.done ? "done" : ""}">${l.title}${l.done ? " · listo" : ""}</button>`)
    .join("");
}

load();
