/* =========================================================
   Kush Goswami portfolio: script.js
   Sections:
   1. Helpers
   2. Theme toggle (dark / light)
  3. Terminal: typing intro + commands
  4. Contact form + "database" (localStorage)
   ========================================================= */

/* ---------- 1. HELPERS ---------- */
const $ = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- 2. THEME TOGGLE ----------
   The chosen theme is saved in localStorage so it is remembered on reload. */
function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  $("themeBtn").textContent = theme === "dark" ? "light mode" : "dark mode";
  try { localStorage.setItem("theme", theme); } catch (e) { /* storage blocked */ }
}
let savedTheme = "dark";
try { savedTheme = localStorage.getItem("theme") || "dark"; } catch (e) {}
setTheme(savedTheme);
$("themeBtn").addEventListener("click", () => {
  setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
});

/* ---------- 3. TERMINAL ---------- */
const out = $("termOut");
const input = $("termIn");

// add a line of HTML to the terminal
function print(html, className = "visitor-line") {
  const div = document.createElement("div");
  div.className = className;
  div.innerHTML = html;
  out.appendChild(div);
  out.scrollTop = out.scrollHeight;
}

// type text letter by letter into a new line
async function typeLine(html, speed = 28, className = "visitor-line") {
  const div = document.createElement("div");
  div.className = className;
  out.appendChild(div);
  if (reduceMotion) { div.innerHTML = html; return; }
  div.classList.add("cursor");
  // write plain letters; HTML tags are added at once so they do not break
  const parts = html.split(/(<[^>]+>)/);
  let shown = "";
  for (const part of parts) {
    if (part.startsWith("<")) { shown += part; div.innerHTML = shown; continue; }
    for (const ch of part) {
      shown += ch;
      div.innerHTML = shown;
      await sleep(speed);
    }
  }
  div.classList.remove("cursor");
}

// the commands visitors can type. Each one returns text to print.
const commands = {
  help: () => [
    "available commands:",
    "  about     who am I",
    "  skills    what I work with",
    "  projects  things I built",
    "  contact   how to reach me",
    "  messages  show saved contact messages",
    "  theme     switch dark / light",
    "  clear     clean the screen",
  ],
  about: () => ["Kush Goswami, 3rd year B.Tech CSE at Indus University.", "I chased computers for fun, not for code or jobs."],
  skills: () => ["python : Core Python, NumPy, Pandas, Scikit-learn, Matplotlib", "java   : Core Java, OOP, Swing, AWT, JavaFX", "sql    : SQL, MySQL queries", "tools  : GitHub, VS Code, IntelliJ IDEA, PyCharm"],
  projects: () => ["1. Multiplayer Chess (Java)", "2. Bank Management System (Python)", "scroll down to #projects for the links."],
  contact: () => ["email : goswamikush222@gmail.com", "phone : +91 97732 69057", "or use the form at the bottom of this page."],
  messages: () => {
    const n = loadMessages().length;
    return [n + " message(s) stored in this browser. See the 'messages table' near the contact form."];
  },
  theme: () => { $("themeBtn").click(); return ["theme switched."]; },
};

input.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  const cmd = input.value.trim().toLowerCase();
  input.value = "";
  if (!cmd) return;
  print('<span class="cmdline">visitor@kush:~$</span> ' + escapeHtml(cmd));
  if (cmd === "clear") {
    out.querySelectorAll(".visitor-line").forEach((line) => line.remove());
    return;
  }
  if (commands[cmd]) commands[cmd]().forEach((line) => print(escapeHtml(line)));
  else print('<span class="pk">command not found:</span> ' + escapeHtml(cmd) + ' (try "help")');
});

// opening animation: runs once when the page loads
async function intro() {
  await typeLine('<span class="cmdline">$</span> whoami', 60, "intro-line");
  print('<span class="big">Kush Goswami</span>', "intro-line");
  await sleep(250);
  await typeLine('<span class="cmdline">$</span> cat role.txt', 40, "intro-line");
  print("CSE Student | A child following computers", "intro-line");
  await sleep(250);
  await typeLine('<span class="cmdline">$</span> cat status.txt', 40, "intro-line");
  print('<span class="dim">Indus University, B.Tech CSE, Year 3, Semester 5</span>', "intro-line");
  print("", "intro-line");
  print('type <span class="cmdline">help</span> below to explore.', "intro-line");
}
intro();

/* ---------- 4. CONTACT FORM + DATABASE ----------
   The "database" is the browser's localStorage. We keep one key,
   "messages", that holds an array of message objects as JSON text.
   Create = push, Read = JSON.parse, Delete = filter / remove. */
const DB_KEY = "messages";

function loadMessages() {
  try { return JSON.parse(localStorage.getItem(DB_KEY)) || []; }
  catch (e) { return []; }
}
function saveMessages(list) {
  localStorage.setItem(DB_KEY, JSON.stringify(list));
}
// turn special characters into safe text so nobody can inject HTML
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function renderMessages() {
  const list = loadMessages();
  const ul = $("dbList");
  ul.innerHTML = "";
  $("dbCount").textContent = list.length + " rows";
  if (!list.length) {
    ul.innerHTML = '<li><span class="empty">No messages yet. Send one using the form.</span></li>';
    return;
  }
  list.slice().reverse().forEach((m) => {
    const li = document.createElement("li");
    const left = document.createElement("div");
    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = m.name + " <" + m.email + ">  " + new Date(m.time).toLocaleString();
    const body = document.createElement("div");
    body.textContent = m.message;           // textContent keeps it safe
    left.append(meta, body);
    const del = document.createElement("button");
    del.className = "btn small";
    del.textContent = "delete";
    del.addEventListener("click", () => {
      saveMessages(loadMessages().filter((x) => x.id !== m.id));
      renderMessages();
    });
    li.append(left, del);
    ul.appendChild(li);
  });
}

$("contactForm").addEventListener("submit", (e) => {
  e.preventDefault();                       // stop the page from reloading
  const f = e.target;
  const status = $("formStatus");
  const name = f.name.value.trim();
  const email = f.email.value.trim();
  const message = f.message.value.trim();

  // simple validation
  if (!name || !email || !message) { status.className = "status err"; status.textContent = "Fill in name, email and message."; return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { status.className = "status err"; status.textContent = "Enter a valid email address."; return; }

  try {
    const list = loadMessages();
    list.push({ id: Date.now(), name, email, message, time: new Date().toISOString() });
    saveMessages(list);
    f.reset();
    status.className = "status ok";
    status.textContent = "Message saved to the database.";
    renderMessages();
  } catch (err) {
    status.className = "status err";
    status.textContent = "Could not save. Browser storage may be blocked.";
  }
});

$("dbClear").addEventListener("click", () => {
  if (confirm("Delete all stored messages?")) { saveMessages([]); renderMessages(); }
});

renderMessages();
