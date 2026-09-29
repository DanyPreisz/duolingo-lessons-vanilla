const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || "0.0.0.0";
const ROOT = __dirname;
const PUBLIC = path.join(ROOT, "public");
const SEED = path.join(ROOT, "data", "db.json");
const DB = process.env.DB_PATH || path.join("/tmp", "duolingo-db.json");
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

function load() {
  try {
    if (fs.existsSync(DB)) return JSON.parse(fs.readFileSync(DB, "utf8"));
  } catch {}
  return JSON.parse(fs.readFileSync(SEED, "utf8"));
}

let store = load();

function read() {
  return store;
}

function write(db) {
  store = db;
  try {
    fs.writeFileSync(DB, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error("persist skipped", err.message);
  }
}

function send(res, status, body, type = TYPES[".json"]) {
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

function body(req) {
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (c) => {
      raw += c;
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function file(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) return send(res, 404, "No encontrado", "text/plain; charset=utf-8");
    send(res, 200, data, TYPES[path.extname(filePath)] || "application/octet-stream");
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const db = read();

  if (req.method === "GET" && (url.pathname === "/health" || url.pathname === "/healthz")) {
    return send(res, 200, { ok: true });
  }

  if (req.method === "GET" && url.pathname === "/api/lessons") {
    return send(res, 200, {
      xp: db.xp,
      lessons: db.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        done: db.done.includes(l.id),
      })),
    });
  }

  const one = url.pathname.match(/^\/api\/lessons\/([^/]+)$/);
  if (req.method === "GET" && one) {
    const lesson = db.lessons.find((l) => l.id === one[1]);
    return lesson ? send(res, 200, lesson) : send(res, 404, { error: "no" });
  }

  if (req.method === "POST" && url.pathname === "/api/complete") {
    const data = await body(req);
    const id = String(data.id || "");
    if (!db.lessons.some((l) => l.id === id)) return send(res, 404, { error: "no" });
    if (!db.done.includes(id)) {
      db.done.push(id);
      db.xp += 10;
      write(db);
    }
    return send(res, 200, { xp: db.xp, done: db.done });
  }

  const rel = url.pathname === "/" ? "/index.html" : url.pathname;
  const safe = path.normalize(rel).replace(/^(\.\.[/\\])+/, "");
  file(res, path.join(PUBLIC, safe));
});

server.listen(PORT, HOST, () => {
  console.log(`listening on http://${HOST}:${PORT}`);
});
