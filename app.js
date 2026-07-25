/* =========================================================
   CodeWeb — app.js
   A browser-only code editor: write files, run a lightweight
   syntax check + live preview, and "publish" a project page.

   Notes on honesty of scope:
   - HTML / CSS / JS actually run, in a sandboxed iframe.
   - JSON is actually parsed and validated.
   - C++ and Lua are NOT compiled or executed (no real compiler
     ships in a browser tab). The Console for these two runs a
     lightweight, best-effort syntax check (bracket/quote
     balance, and for Lua a block/`end` count) so you still get
     green/red feedback per line — it is not a full compiler.
   - "Publish" and "CodeWeb Pro" are demo flows. Nothing is
     uploaded to a real server and no payment is charged; the
     Pro button only flips a flag in this page so you can see
     what the upgraded UI looks like.
========================================================= */

(() => {
  "use strict";

  /* ---------------------------------------------------------
     Icons (inline SVG — no emoji anywhere in this app)
  --------------------------------------------------------- */
  const ICONS = {
    html: `<svg viewBox="0 0 24 24" width="14" height="14"><path d="M8 8l-4 4 4 4M16 8l4 4-4 4M14 6l-4 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    css: `<svg viewBox="0 0 24 24" width="14" height="14"><path d="M4 3h16l-1.5 15L12 21l-6.5-3L4 3z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M7 7h10l-.4 4H8.6M8.2 13.5l.3 3 3.5 1 3.5-1 .4-4.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    js: `<svg viewBox="0 0 24 24" width="14" height="14"><rect x="3.5" y="3.5" width="17" height="17" rx="3" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M9 15.2c.3.6.9 1.1 1.7 1.1 1 0 1.5-.6 1.5-1.5v-4.3M14.5 10.5c.3-.4.9-.7 1.6-.7 1.1 0 1.7.6 1.7 1.4 0 2-3 1.4-3 3.3 0 .9.7 1.5 1.7 1.5.8 0 1.4-.3 1.7-.8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
    json: `<svg viewBox="0 0 24 24" width="14" height="14"><path d="M8 4c-2 0-2.5 1-2.5 2.5v3c0 1-.5 1.5-1.5 1.5 1 0 1.5.5 1.5 1.5v3C5.5 19 6 20 8 20M16 4c2 0 2.5 1 2.5 2.5v3c0 1 .5 1.5 1.5 1.5-1 0-1.5.5-1.5 1.5v3c0 2.5-.5 3.5-2.5 3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    cpp: `<svg viewBox="0 0 24 24" width="14" height="14"><rect x="4" y="4" width="16" height="16" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 12h2M9 11v2M13.5 9.5a2.5 2.5 0 100 5M20 12h2M21 11v2" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`,
    lua: `<svg viewBox="0 0 24 24" width="14" height="14"><path d="M14.5 4a8 8 0 100 16 7 7 0 010-16z" fill="currentColor"/></svg>`,
    close: `<svg viewBox="0 0 24 24" width="12" height="12"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
    star: `<svg viewBox="0 0 24 24" width="12" height="12"><path d="M12 2l2.6 6.6L21 9.3l-5 4.6L17.4 21 12 17.3 6.6 21 8 13.9l-5-4.6 6.4-.7L12 2z" fill="currentColor"/></svg>`,
    globe: `<svg viewBox="0 0 24 24" width="22" height="22"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M3 12h18M12 3c2.5 2.5 4 5.7 4 9s-1.5 6.5-4 9c-2.5-2.5-4-5.7-4-9s1.5-6.5 4-9z" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`,
    rocket: `<svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 2c3 2 4.5 5.5 4.5 9 0 2-1 4-2 5l-5 0c-1-1-2-3-2-5 0-3.5 1.5-7 4.5-9z" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="9" r="1.4" fill="currentColor"/><path d="M8 15l-2.5 4M16 15l2.5 4M10 19h4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
    spark: `<svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3z" fill="currentColor"/></svg>`,
    cube: `<svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M4.5 7.5L12 12l7.5-4.5M12 12v9" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`,
    layers: `<svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 3l8 4.5-8 4.5-8-4.5L12 3z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M4 12l8 4.5 8-4.5M4 16.5L12 21l8-4.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>`,
    bolt: `<svg viewBox="0 0 24 24" width="22" height="22"><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" fill="currentColor"/></svg>`,
    compass: `<svg viewBox="0 0 24 24" width="22" height="22"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M15 9l-2 6-4 0 2-6 4 0z" fill="currentColor"/></svg>`,
  };

  const TYPE_META = {
    html: { label: "HTML", ext: "html" },
    css:  { label: "CSS",  ext: "css"  },
    js:   { label: "JavaScript", ext: "js" },
    json: { label: "JSON", ext: "json" },
    cpp:  { label: "C++",  ext: "cpp"  },
    lua:  { label: "Lua",  ext: "lua"  },
  };

  const TEMPLATES = {
    html: `<!DOCTYPE html>\n<html>\n<head>\n  <title>My page</title>\n  <style>\n    /* CSS lives right here, so this page is styled on its own. */\n    body {\n      margin: 0;\n      min-height: 100vh;\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      flex-direction: column;\n      gap: 8px;\n      font-family: system-ui, sans-serif;\n      background: linear-gradient(160deg, #12131a, #1d1033);\n      color: #ecebf4;\n      text-align: center;\n    }\n    h1 {\n      margin: 0;\n      font-size: 2.2rem;\n      background: linear-gradient(90deg, #7c5cfc, #24d3c4);\n      -webkit-background-clip: text;\n      background-clip: text;\n      color: transparent;\n    }\n    p { color: #9a9bb0; max-width: 320px; line-height: 1.6; }\n    button {\n      margin-top: 12px;\n      padding: 10px 18px;\n      border-radius: 8px;\n      border: 1px solid #7c5cfc;\n      background: transparent;\n      color: #ecebf4;\n      cursor: pointer;\n    }\n    button:hover { background: #7c5cfc33; }\n  </style>\n</head>\n<body>\n  <h1>Hello from CodeWeb</h1>\n  <p>This page keeps its CSS right inside the &lt;style&gt; tag above, so it looks like this with no separate stylesheet at all.</p>\n  <button onclick="document.body.style.background='#0e0f14'">Click me</button>\n</body>\n</html>\n`,
    css: `body {\n  margin: 0;\n  font-family: sans-serif;\n  background: #12131a;\n  color: #ecebf4;\n  text-align: center;\n  padding-top: 60px;\n}\n`,
    js: `// Runs inside the preview.\nconsole.log("Hello from app.js");\n\ndocument.addEventListener("DOMContentLoaded", () => {\n  console.log("Page ready");\n});\n`,
    json: `{\n  "project": "CodeWeb",\n  "version": 1,\n  "files": ["index.html", "style.css", "app.js"]\n}\n`,
    cpp: `#include <iostream>\n\nint main() {\n  std::cout << "Hello from C++" << std::endl;\n  return 0;\n}\n`,
    lua: `-- Lua script\nlocal function greet(name)\n  print("Hello, " .. name)\nend\n\ngreet("CodeWeb")\n`,
  };

  /* ---------------------------------------------------------
     Leveling — one step per week since the account was created
     on this browser. Purely cosmetic, computed locally.
  --------------------------------------------------------- */
  const LEVELS = [
    "Beginner", "Noob", "Bronze", "Normal", "Good", "Gooder", "Great", "Greater",
    "Best", "Silver", "Every-month poster", "Greatest", "Goodest User", "Gold",
    "Golden Builder", "Level-80 user", "Copro", "Good Skill", "Great Skill",
    "Awesome Skill", "Best Skill", "Pro", "Beyond pro", "Goldensh user",
    "Premaster", "Great Pro", "Comaster", "Best Pro", "Master", "Grandmaster",
    "1-year User", "Likely Golden User Ever", "Golden User Ever",
    "Best Developer Ever", "Pneudeveloper",
  ];
  function computeLevel(joinedAt) {
    const weeks = Math.floor((Date.now() - joinedAt) / (7 * 24 * 60 * 60 * 1000));
    const idx = Math.max(0, Math.min(weeks, LEVELS.length - 1));
    return LEVELS[idx];
  }

  /* ---------------------------------------------------------
     State
  --------------------------------------------------------- */
  let files = [
    { id: uid(), name: "index.html", type: "html", content: TEMPLATES.html },
    { id: uid(), name: "style.css",  type: "css",  content: TEMPLATES.css },
    { id: uid(), name: "app.js",     type: "js",   content: TEMPLATES.js },
    { id: uid(), name: "data.json",  type: "json", content: TEMPLATES.json },
    { id: uid(), name: "main.cpp",   type: "cpp",  content: TEMPLATES.cpp },
    { id: uid(), name: "script.lua", type: "lua",  content: TEMPLATES.lua },
  ];
  let activeId = files[0].id;
  let isPro = false;
  let selectedNewType = "html";
  let selectedIconKey = "spark";
  let publishedSite = null;

  function uid() { return Math.random().toString(36).slice(2, 10); }
  function activeFile() { return files.find(f => f.id === activeId); }
  function slugify(s) {
    return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "my-site";
  }

  /* ---------------------------------------------------------
     Elements
  --------------------------------------------------------- */
  const el = (id) => document.getElementById(id);
  const fileTabsEl = el("fileTabs");
  const editorEl = el("editor");
  const gutterEl = el("gutter");
  const activeFileLabel = el("activeFileLabel");
  const activeFileType = el("activeFileType");
  const statusMsg = el("statusMsg");
  const proStatus = el("proStatus");
  const consoleLog = el("consoleLog");
  const previewFrame = el("previewFrame");
  const previewUrl = el("previewUrl");
  const toastEl = el("toast");

  /* ---------------------------------------------------------
     Toast
  --------------------------------------------------------- */
  let toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("is-visible"), 2400);
  }

  /* ---------------------------------------------------------
     Rendering: file tabs
  --------------------------------------------------------- */
  function renderTabs() {
    fileTabsEl.innerHTML = "";
    files.forEach(f => {
      const tab = document.createElement("button");
      tab.className = "file-tab" + (f.id === activeId ? " is-active" : "");
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-selected", f.id === activeId ? "true" : "false");
      tab.innerHTML = `
        <span class="tab-icon">${ICONS[f.type]}</span>
        <span>${escapeHtml(f.name)}</span>
        <span class="tab-status ${f.status || ""}"></span>
        <span class="tab-close" title="Close ${escapeHtml(f.name)}">${ICONS.close}</span>
      `;
      tab.addEventListener("click", (e) => {
        if (e.target.closest(".tab-close")) {
          e.stopPropagation();
          closeFile(f.id);
          return;
        }
        activeId = f.id;
        loadActiveFile();
      });
      fileTabsEl.appendChild(tab);
    });
  }

  function closeFile(id) {
    if (files.length <= 1) {
      toast("At least one file has to stay open.");
      return;
    }
    const idx = files.findIndex(f => f.id === id);
    files = files.filter(f => f.id !== id);
    if (activeId === id) {
      activeId = files[Math.max(0, idx - 1)].id;
    }
    renderTabs();
    loadActiveFile();
  }

  /* ---------------------------------------------------------
     Editor + gutter
  --------------------------------------------------------- */
  function loadActiveFile() {
    const f = activeFile();
    editorEl.value = f.content;
    activeFileLabel.textContent = f.name;
    activeFileType.textContent = TYPE_META[f.type].label;
    renderTabs();
    renderGutter(f.lineStatus || []);
    renderConsole(f.messages || null);
    statusMsg.textContent = "Ready.";
  }

  editorEl.addEventListener("input", () => {
    const f = activeFile();
    f.content = editorEl.value;
    f.status = null;
    f.lineStatus = null;
    renderTabs();
    renderGutter([]);
  });

  editorEl.addEventListener("scroll", () => {
    gutterEl.scrollTop = editorEl.scrollTop;
  });

  editorEl.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = editorEl.selectionStart, end = editorEl.selectionEnd;
      editorEl.value = editorEl.value.slice(0, start) + "  " + editorEl.value.slice(end);
      editorEl.selectionStart = editorEl.selectionEnd = start + 2;
      editorEl.dispatchEvent(new Event("input"));
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      runActiveFile();
    }
  });

  function renderGutter(lineStatus) {
    const lineCount = Math.max(editorEl.value.split("\n").length, 1);
    let html = "";
    for (let i = 1; i <= lineCount; i++) {
      const st = lineStatus[i - 1];
      const dotClass = st === "ok" ? "ok" : st === "bad" ? "bad" : "";
      html += `<div class="g-row"><span class="g-dot ${dotClass}"></span>${i}</div>`;
    }
    gutterEl.innerHTML = html;
    gutterEl.scrollTop = editorEl.scrollTop;
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ---------------------------------------------------------
     Lightweight syntax analysis
     Returns { lineStatus: [...], messages: [{type,text}] }
  --------------------------------------------------------- */
  function analyze(file) {
    const content = file.content;
    const lines = content.split("\n");
    const lineStatus = lines.map(() => "ok");
    const messages = [];
    const markBad = (lineIdx, text) => {
      if (lineIdx >= 0 && lineIdx < lineStatus.length) lineStatus[lineIdx] = "bad";
      messages.push({ type: "err", text: `Line ${lineIdx + 1}: ${text}` });
    };

    if (file.type === "json") {
      try {
        JSON.parse(content);
        messages.push({ type: "ok", text: "Valid JSON — no issues found." });
      } catch (e) {
        let lineIdx = 0;
        const m = /position (\d+)/.exec(e.message);
        if (m) lineIdx = content.slice(0, Number(m[1])).split("\n").length - 1;
        markBad(lineIdx, e.message.replace(/^JSON\.parse:\s*/, ""));
      }
      return { lineStatus, messages };
    }

    // Shared bracket + quote balance check for html / css / js / cpp / lua
    const stack = [];
    const pairs = { "(": ")", "[": "]", "{": "}" };
    const closers = { ")": "(", "]": "[", "}": "{" };

    lines.forEach((line, idx) => {
      // quote balance (ignore escaped quotes), skip lines that are comments
      const codePart = stripLineComment(line, file.type);
      const singleQuotes = (codePart.match(/(?<!\\)'/g) || []).length;
      const doubleQuotes = (codePart.match(/(?<!\\)"/g) || []).length;
      if (singleQuotes % 2 !== 0) markBad(idx, "Unterminated string (unmatched ').");
      else if (doubleQuotes % 2 !== 0) markBad(idx, 'Unterminated string (unmatched ").');

      for (const ch of codePart) {
        if (pairs[ch]) stack.push({ ch, idx });
        else if (closers[ch]) {
          const top = stack.pop();
          if (!top || top.ch !== closers[ch]) {
            markBad(idx, `Unexpected '${ch}' — no matching '${closers[ch]}'.`);
          }
        }
      }
    });
    stack.forEach(open => {
      markBad(open.idx, `'${open.ch}' is never closed.`);
    });

    // C++ heuristic: statement lines that likely need a trailing ';'
    if (file.type === "cpp") {
      const controlWords = /^(if|else|for|while|switch|case|default|do|namespace|class|struct|public:|private:|protected:|try|catch|extern\s*"C")\b/;
      lines.forEach((raw, idx) => {
        const line = raw.trim();
        if (!line) return;
        if (line.startsWith("//") || line.startsWith("/*") || line.startsWith("*")) return;
        if (line.startsWith("#")) return;
        if (/[;{}:]\s*$/.test(line)) return;
        if (controlWords.test(line)) return;
        if (lineStatus[idx] === "bad") return; // already flagged
        if (/[a-zA-Z0-9_\)\]]$/.test(line) && /[=(].*[a-zA-Z0-9_\)"]$/.test(line) === false && !/\)$/.test(line)) {
          // conservative: only flag lines that look like statements (contain '=' or end a call)
        }
        if (/(=|<<|>>)\s*[^;{}]+$/.test(line) && !/[,\\]$/.test(line)) {
          markBad(idx, "Statement may be missing a trailing ';'.");
        }
      });
    }

    // Lua heuristic: block openers vs 'end' count
    if (file.type === "lua") {
      const code = content.replace(/--\[\[[\s\S]*?\]\]/g, "").split("\n").map(l => stripLineComment(l, "lua")).join("\n");
      const openers = (code.match(/\b(function|if|for|while)\b/g) || []).length;
      const enders = (code.match(/\bend\b/g) || []).length;
      if (openers !== enders) {
        let lastCodeLine = lines.length - 1;
        while (lastCodeLine > 0 && !lines[lastCodeLine].trim()) lastCodeLine--;
        markBad(lastCodeLine, `${openers} block keyword(s) ("function"/"if"/"for"/"while") but ${enders} "end" — check your blocks.`);
      }
    }

    if (messages.length === 0) {
      messages.push({ type: "ok", text: "No issues found." });
    }
    return { lineStatus, messages };
  }

  function stripLineComment(line, type) {
    if (type === "js" || type === "cpp") return line.replace(/\/\/.*$/, "");
    if (type === "lua") return line.replace(/--(?!\[\[).*$/, "");
    if (type === "css") return line.replace(/\/\*.*?\*\//g, "");
    if (type === "html") return line;
    return line;
  }

  function renderConsole(analysis) {
    if (!analysis) {
      consoleLog.innerHTML = `<p class="console-empty">Click <strong>Run</strong> to check this file for issues.</p>`;
      return;
    }
    consoleLog.innerHTML = analysis.messages.map(m => `
      <div class="console-line ${m.type === "ok" ? "ok" : "err"}">
        <span class="cl-badge">${m.type === "ok" ? "OK" : "Issue"}</span>
        <span class="cl-text">${escapeHtml(m.text)}</span>
      </div>
    `).join("");
  }

  function appendRuntimeLog(kind, text) {
    const empty = consoleLog.querySelector(".console-empty");
    if (empty) empty.remove();
    const row = document.createElement("div");
    row.className = `console-line ${kind === "error" ? "err" : "ok"}`;
    row.innerHTML = `<span class="cl-badge">${kind === "error" ? "Runtime" : "Log"}</span><span class="cl-text">${escapeHtml(text)}</span>`;
    consoleLog.appendChild(row);
    consoleLog.scrollTop = consoleLog.scrollHeight;
  }

  /* ---------------------------------------------------------
     Output tabs
  --------------------------------------------------------- */
  document.querySelectorAll(".output-tab").forEach(tab => {
    tab.addEventListener("click", () => switchOutputView(tab.dataset.view));
  });
  function switchOutputView(view) {
    document.querySelectorAll(".output-tab").forEach(t => {
      const active = t.dataset.view === view;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-selected", active ? "true" : "false");
    });
    document.querySelectorAll(".output-view").forEach(v => {
      v.classList.toggle("is-active", v.id === `view-${view}`);
    });
  }

  /* ---------------------------------------------------------
     Preview build (HTML + CSS + JS) with console bridge
  --------------------------------------------------------- */
  function buildPreviewDoc() {
    const html = files.filter(f => f.type === "html").map(f => f.content).join("\n");
    const css = files.filter(f => f.type === "css").map(f => f.content).join("\n");
    const js = files.filter(f => f.type === "js").map(f => f.content).join("\n");

    const bridge = `
      <script>
        (function(){
          const send = (kind, args) => {
            try {
              parent.postMessage({ __codeweb: true, kind, text: args.map(a => {
                try { return typeof a === "string" ? a : JSON.stringify(a); }
                catch(e){ return String(a); }
              }).join(" ") }, "*");
            } catch(e){}
          };
          const orig = { log: console.log, error: console.error, warn: console.warn };
          console.log = (...a) => { send("log", a); orig.log.apply(console, a); };
          console.warn = (...a) => { send("log", a); orig.warn.apply(console, a); };
          console.error = (...a) => { send("error", a); orig.error.apply(console, a); };
          window.addEventListener("error", (e) => send("error", [e.message + " (line " + e.lineno + ")"]));
        })();
      <\/script>`;

    let doc = html.includes("<html") ? html : `<!DOCTYPE html><html><head></head><body>${html}</body></html>`;
    if (doc.includes("</head>")) {
      doc = doc.replace("</head>", `<style>${css}</style>${bridge}</head>`);
    } else {
      doc = bridge + `<style>${css}</style>` + doc;
    }
    if (doc.includes("</body>")) {
      doc = doc.replace("</body>", `<script>${js}<\/script></body>`);
    } else {
      doc += `<script>${js}<\/script>`;
    }
    return doc;
  }

  window.addEventListener("message", (e) => {
    if (e.data && e.data.__codeweb) {
      appendRuntimeLog(e.data.kind, e.data.text);
    }
  });

  function refreshPreview(urlLabel) {
    previewFrame.srcdoc = buildPreviewDoc();
    previewUrl.textContent = urlLabel || "preview";
  }

  /* ---------------------------------------------------------
     Run
  --------------------------------------------------------- */
  function runActiveFile() {
    const f = activeFile();
    const result = analyze(f);
    f.lineStatus = result.lineStatus;
    f.messages = result.messages;
    f.status = result.messages.some(m => m.type === "err") ? "err" : "ok";

    renderTabs();
    renderGutter(f.lineStatus);
    renderConsole(result);

    const hasIssues = f.messages.some(m => m.type === "err");
    statusMsg.textContent = hasIssues
      ? `Run finished — issues found in ${f.name}.`
      : `Run finished — ${f.name} looks good.`;

    if (["html", "css", "js"].includes(f.type)) {
      refreshPreview(slugify(f.name));
      switchOutputView("preview");
    } else {
      switchOutputView("console");
    }
  }
  el("runBtn").addEventListener("click", runActiveFile);

  /* ---------------------------------------------------------
     Add file modal
  --------------------------------------------------------- */
  const addFileOverlay = el("addFileOverlay");
  const typeGrid = el("typeGrid");
  const newFileName = el("newFileName");

  function renderTypeGrid() {
    typeGrid.innerHTML = "";
    Object.keys(TYPE_META).forEach(type => {
      const opt = document.createElement("div");
      opt.className = "type-option" + (type === selectedNewType ? " is-selected" : "");
      opt.innerHTML = `${ICONS[type]}<span>${TYPE_META[type].label}</span>`;
      opt.addEventListener("click", () => {
        selectedNewType = type;
        newFileName.placeholder = `e.g. file.${TYPE_META[type].ext}`;
        renderTypeGrid();
      });
      typeGrid.appendChild(opt);
    });
  }

  el("addFileBtn").addEventListener("click", () => {
    selectedNewType = "html";
    newFileName.value = "";
    renderTypeGrid();
    addFileOverlay.classList.add("is-open");
    newFileName.focus();
  });
  el("cancelAddFile").addEventListener("click", () => addFileOverlay.classList.remove("is-open"));
  addFileOverlay.addEventListener("click", (e) => { if (e.target === addFileOverlay) addFileOverlay.classList.remove("is-open"); });

  el("confirmAddFile").addEventListener("click", () => {
    let name = newFileName.value.trim();
    const ext = TYPE_META[selectedNewType].ext;
    if (!name) name = `untitled.${ext}`;
    if (!name.includes(".")) name += `.${ext}`;
    const nf = { id: uid(), name, type: selectedNewType, content: TEMPLATES[selectedNewType] };
    files.push(nf);
    activeId = nf.id;
    addFileOverlay.classList.remove("is-open");
    loadActiveFile();
    toast(`Added ${name}`);
  });

  /* ---------------------------------------------------------
     Pro modal
  --------------------------------------------------------- */
  const proOverlay = el("proOverlay");
  el("proBtn").addEventListener("click", () => proOverlay.classList.add("is-open"));
  el("cancelPro").addEventListener("click", () => proOverlay.classList.remove("is-open"));
  proOverlay.addEventListener("click", (e) => { if (e.target === proOverlay) proOverlay.classList.remove("is-open"); });
  el("confirmPro").addEventListener("click", () => {
    isPro = true;
    proOverlay.classList.remove("is-open");
    proStatus.textContent = "CodeWeb Pro";
    proStatus.classList.add("is-pro");
    updateDomainOptions();
    toast("CodeWeb Pro unlocked in this session (demo — no real charge was made).");
  });

  /* ---------------------------------------------------------
     Publish modal
  --------------------------------------------------------- */
  const publishOverlay = el("publishOverlay");
  const siteName = el("siteName");
  const siteSlug = el("siteSlug");
  const siteDomain = el("siteDomain");
  const siteDescription = el("siteDescription");
  const iconGrid = el("iconGrid");
  const domainHint = el("domainHint");

  const ICON_CHOICES = ["spark", "rocket", "cube", "layers", "bolt", "compass", "globe", "js", "html", "cpp", "lua", "css"];

  function renderIconGrid() {
    iconGrid.innerHTML = "";
    ICON_CHOICES.forEach(key => {
      const opt = document.createElement("div");
      opt.className = "icon-option" + (key === selectedIconKey ? " is-selected" : "");
      opt.innerHTML = ICONS[key];
      opt.title = key;
      opt.addEventListener("click", () => {
        selectedIconKey = key;
        renderIconGrid();
      });
      iconGrid.appendChild(opt);
    });
  }

  function updateDomainOptions() {
    Array.from(siteDomain.options).forEach(opt => {
      const needsPro = opt.dataset.pro === "1";
      opt.disabled = needsPro && !isPro;
      opt.textContent = needsPro && !isPro ? `${opt.value} (Pro)` : opt.value;
    });
    domainHint.textContent = isPro
      ? "Pro is unlocked — all domain endings are available."
      : "Pro domains are marked (Pro) above. Upgrade with the Pro button to unlock them.";
  }

  let slugTouched = false;
  siteName.addEventListener("input", () => {
    if (!slugTouched) siteSlug.value = slugify(siteName.value);
  });
  siteSlug.addEventListener("input", () => { slugTouched = true; });

  el("publishBtn").addEventListener("click", () => {
    requireBirthday(() => {
      requireAuth(() => {
        siteName.value = siteName.value || "My CodeWeb site";
        siteSlug.value = siteSlug.value || slugify(siteName.value);
        siteDescription.value = siteDescription.value || "Built with CodeWeb.";
        renderIconGrid();
        updateDomainOptions();
        publishOverlay.classList.add("is-open");
      });
    });
  });
  el("cancelPublish").addEventListener("click", () => publishOverlay.classList.remove("is-open"));
  publishOverlay.addEventListener("click", (e) => { if (e.target === publishOverlay) publishOverlay.classList.remove("is-open"); });

  el("confirmPublish").addEventListener("click", () => {
    const name = siteName.value.trim() || "My CodeWeb site";
    const slug = slugify(siteSlug.value || name);
    const domain = siteDomain.value;
    const description = siteDescription.value.trim() || "Built with CodeWeb.";

    publishedSite = { name, slug, domain, description, icon: selectedIconKey, files: JSON.parse(JSON.stringify(files)) };
    persistPublishedSite(publishedSite);

    el("publishedName").textContent = name;
    el("publishedDesc").textContent = description;
    el("publishedUrl").textContent = `${slug}${domain}`;
    el("publishedIcon").innerHTML = ICONS[selectedIconKey];
    el("publishedFrame").srcdoc = buildPreviewDoc();

    publishOverlay.classList.remove("is-open");
    el("publishedOverlay").classList.add("is-open");
    toast("Published (demo) — this preview is not hosted on a real domain.");
  });

  el("closePublished").addEventListener("click", closePublished);
  el("backToEditor").addEventListener("click", closePublished);
  function closePublished() { el("publishedOverlay").classList.remove("is-open"); }

  el("downloadProject").addEventListener("click", () => {
    if (!publishedSite) return;
    const payload = JSON.stringify({
      name: publishedSite.name,
      slug: publishedSite.slug,
      domain: publishedSite.domain,
      description: publishedSite.description,
      icon: publishedSite.icon,
      files: publishedSite.files.map(f => ({ name: f.name, type: f.type, content: f.content })),
    }, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${publishedSite.slug}.cwebproject`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast(`Downloaded ${publishedSite.slug}.cwebproject`);
  });

  /* ---------------------------------------------------------
     Published-sites storage + Quick Restore

     This is real, not a demo: every publish is saved to
     localStorage under "codeweb_sites", and a mirrored
     "codeweb_sites_backup" copy is taken at the same moment.
     Quick Restore compares the two. In normal use they always
     match, so it will almost always report "no issues" — that
     is the correct, honest result. A real mismatch only shows
     up if this browser's site storage actually gets wiped or
     partially cleared after a publish (e.g. the browser clears
     site data, or a bug corrupts one entry), in which case the
     backup copy is used to restore the missing/broken record.
  --------------------------------------------------------- */
  function loadSites() {
    try { return JSON.parse(localStorage.getItem("codeweb_sites") || "[]"); }
    catch (e) { return []; }
  }
  function saveSites(list) { localStorage.setItem("codeweb_sites", JSON.stringify(list)); }
  function loadSitesBackup() {
    try { return JSON.parse(localStorage.getItem("codeweb_sites_backup") || "[]"); }
    catch (e) { return []; }
  }
  function saveSitesBackup(list) { localStorage.setItem("codeweb_sites_backup", JSON.stringify(list)); }

  function persistPublishedSite(site) {
    const record = {
      slug: site.slug,
      domain: site.domain,
      name: site.name,
      description: site.description,
      icon: site.icon,
      files: site.files.map(f => ({ name: f.name, type: f.type, content: f.content })),
      publishedAt: Date.now(),
    };
    const list = loadSites();
    const idx = list.findIndex(s => s.slug === record.slug);
    if (idx >= 0) list[idx] = record; else list.push(record);
    saveSites(list);
    saveSitesBackup(list); // mirror the known-good state right after a successful publish
  }

  function siteLooksIntact(site) {
    if (!site || typeof site !== "object") return false;
    if (!Array.isArray(site.files) || site.files.length === 0) return false;
    return site.files.every(f => typeof f.content === "string");
  }

  function scanForMissingSites() {
    const primary = loadSites();
    const backup = loadSitesBackup();
    return backup.filter(b => {
      const match = primary.find(p => p.slug === b.slug);
      if (!match) return true;           // present in backup, gone from primary
      if (!siteLooksIntact(match)) return true; // present but corrupted
      return false;
    });
  }

  function restoreSiteFromBackup(record) {
    const primary = loadSites();
    const idx = primary.findIndex(p => p.slug === record.slug);
    if (idx >= 0) primary[idx] = record; else primary.push(record);
    saveSites(primary);
    saveSitesBackup(primary); // the restored state is now the known-good baseline
  }

  const quickRestoreOverlay = el("quickRestoreOverlay");
  function openQuickRestore() {
    quickRestoreOverlay.classList.add("is-open");
    runQuickRestoreScan();
  }
  function closeQuickRestore() { quickRestoreOverlay.classList.remove("is-open"); }
  el("closeQuickRestore").addEventListener("click", closeQuickRestore);
  quickRestoreOverlay.addEventListener("click", (e) => { if (e.target === quickRestoreOverlay) closeQuickRestore(); });
  el("quickRestoreBtn").addEventListener("click", () => requireAuth(openQuickRestore));

  async function runQuickRestoreScan() {
    const body = el("quickRestoreBody");
    body.innerHTML = `<div class="restore-scanning"><span class="spinner"></span> Checking your published sites for missing or damaged data…</div>`;
    await new Promise(r => setTimeout(r, 450)); // the check itself is instant; this just keeps the state readable
    renderQuickRestoreResult(scanForMissingSites());
  }

  function renderQuickRestoreResult(missing) {
    const body = el("quickRestoreBody");
    const total = loadSites().length;
    if (missing.length === 0) {
      body.innerHTML = `
        <div class="restore-clean">
          <p><strong>Everything checks out.</strong></p>
          <p class="hint">${total ? `Checked ${total} published site${total === 1 ? "" : "s"} in this browser — n` : "N"}o missing or damaged sites found.</p>
        </div>`;
      return;
    }
    const site = missing[0];
    body.innerHTML = `
      <div class="restore-alert">
        <p><strong>One of your sites got deleted.</strong></p>
        <p class="hint">"${escapeHtml(site.name)}" (${escapeHtml(site.slug + (site.domain || ""))}) is missing or damaged in your saved sites, but a backup copy from its last publish is still here.</p>
        <button class="btn btn-accent" id="restoreQuickBtn">Restore quickly</button>
      </div>`;
    el("restoreQuickBtn").addEventListener("click", () => {
      restoreSiteFromBackup(site);
      toast(`Restored "${site.name}" from its last saved backup.`);
      renderQuickRestoreResult(missing.slice(1));
    });
  }

  /* ---------------------------------------------------------
     Account / login (demo)
     There is no real backend here: OAuth buttons, the email +
     password form, and SSO don't contact Google/GitHub/Apple/
     DuckDuckGo or send real email. Signing in creates a small
     local profile (name, method, join date) saved to
     localStorage on this browser, purely so the level and the
     Tutorial gate have something to react to.
  --------------------------------------------------------- */
  function loadUser() {
    try {
      const raw = localStorage.getItem("codeweb_user");
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function saveUser(u) { localStorage.setItem("codeweb_user", JSON.stringify(u)); }
  function clearUser() { localStorage.removeItem("codeweb_user"); }

  let currentUser = loadUser();
  let pendingAction = null;
  let ssoGeneratedCode = null;
  let ssoEmailValue = "";

  const authOverlay = el("authOverlay");

  function renderAuthChip() {
    const avatar = el("authAvatar"), name = el("authName"), level = el("authLevel");
    if (currentUser) {
      avatar.innerHTML = avatarMarkup(currentUser);
      name.textContent = currentUser.name;
      level.textContent = computeLevel(currentUser.joinedAt);
      level.classList.add("is-set");
    } else {
      avatar.textContent = "G";
      name.textContent = "Guest";
      level.textContent = "Log in";
      level.classList.remove("is-set");
    }
  }

  const CODEWEB_KIDS_URL = "https://llrihova-droid.github.io/codeweb-kids/";

  function loginAs(name, method) {
    const age = Number(el("authAge").value);
    if (age >= 5 && age <= 8) {
      toast("Taking you to CodeWeb Kids…");
      window.location.href = CODEWEB_KIDS_URL;
      return;
    }
    const existing = loadUser();
    const joinedAt = existing ? existing.joinedAt : Date.now();
    currentUser = { name, method, joinedAt };
    saveUser(currentUser);
    renderAuthChip();
    closeAuth();
    toast(`Signed in as ${name} (demo — ${method}).`);
    if (pendingAction) { const fn = pendingAction; pendingAction = null; fn(); }
  }

  function requireAuth(action) {
    if (currentUser) { action(); return; }
    pendingAction = action;
    openAuth();
  }

  /* ---------------------------------------------------------
     Birthday verification (Publish gate)
     Deliberately separate from the OAuth/email/SSO login: this
     screen only ever asks for a birthday, nothing else. Ages
     5–8 get redirected to CodeWeb Kids, same as the age field
     in the main login. Once verified, it's remembered on this
     browser so it isn't asked again.
  --------------------------------------------------------- */
  const birthdayOverlay = el("birthdayOverlay");
  const bdayDay = el("bdayDay"), bdayMonth = el("bdayMonth"), bdayYear = el("bdayYear");
  let pendingBirthdayAction = null;

  const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  for (let d = 1; d <= 31; d++) bdayDay.innerHTML += `<option value="${d}">${d}</option>`;
  MONTH_NAMES.forEach((m, i) => { bdayMonth.innerHTML += `<option value="${i + 1}">${m}</option>`; });
  bdayDay.insertAdjacentHTML("afterbegin", `<option value="">Day</option>`);
  bdayMonth.insertAdjacentHTML("afterbegin", `<option value="">Month</option>`);
  bdayDay.value = ""; bdayMonth.value = "";

  function showBirthdayView(view) {
    document.querySelectorAll(".birthday-view").forEach(v => v.classList.toggle("is-active", v.id === `birthdayView-${view}`));
  }
  function openBirthdayGate(action) {
    pendingBirthdayAction = action;
    showBirthdayView("gate");
    birthdayOverlay.classList.add("is-open");
  }
  function closeBirthdayGate() {
    birthdayOverlay.classList.remove("is-open");
    pendingBirthdayAction = null;
  }
  function requireBirthday(action) {
    if (localStorage.getItem("codeweb_birthday_verified") === "1") { action(); return; }
    openBirthdayGate(action);
  }

  el("verifyAgeBtn").addEventListener("click", () => showBirthdayView("form"));
  el("cancelBirthdayGate").addEventListener("click", closeBirthdayGate);
  el("cancelBirthdayForm").addEventListener("click", closeBirthdayGate);
  birthdayOverlay.addEventListener("click", (e) => { if (e.target === birthdayOverlay) closeBirthdayGate(); });

  function computeAge(year, month, day) {
    const today = new Date();
    const birth = new Date(year, month - 1, day);
    let age = today.getFullYear() - birth.getFullYear();
    const hasHadBirthdayThisYear = (today.getMonth() > birth.getMonth()) ||
      (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
    if (!hasHadBirthdayThisYear) age--;
    return age;
  }

  el("submitBirthday").addEventListener("click", () => {
    const day = Number(bdayDay.value), month = Number(bdayMonth.value), year = Number(bdayYear.value);
    const currentYear = new Date().getFullYear();
    if (!day || !month || !year || year < 1900 || year > currentYear) {
      toast("Please enter a real, complete birthday.");
      return;
    }
    const birthDate = new Date(year, month - 1, day);
    if (birthDate.getMonth() !== month - 1 || birthDate.getDate() !== day || birthDate > new Date()) {
      toast("That date doesn't look right — please check it.");
      return;
    }

    const age = computeAge(year, month, day);
    localStorage.setItem("codeweb_birthday", JSON.stringify({ day, month, year }));

    if (age >= 5 && age <= 8) {
      localStorage.removeItem("codeweb_birthday_verified");
      toast("Taking you to CodeWeb Kids…");
      window.location.href = CODEWEB_KIDS_URL;
      return;
    }

    localStorage.setItem("codeweb_birthday_verified", "1");
    birthdayOverlay.classList.remove("is-open");
    const action = pendingBirthdayAction;
    pendingBirthdayAction = null;
    if (action) action();
  });

  function showAuthView(viewName) {
    document.querySelectorAll(".auth-view").forEach(v => v.classList.remove("is-active"));
    el(`authView-${viewName}`).classList.add("is-active");
  }
  function openAuth() { showAuthView("main"); authOverlay.classList.add("is-open"); }
  function closeAuth() { authOverlay.classList.remove("is-open"); }

  el("authChip").addEventListener("click", () => {
    if (currentUser) {
      openAccount();
    } else {
      pendingAction = null;
      openAuth();
    }
  });
  authOverlay.addEventListener("click", (e) => {
    if (e.target === authOverlay) { authOverlay.classList.remove("is-open"); pendingAction = null; }
  });

  document.querySelectorAll(".oauth-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const provider = btn.dataset.provider;
      const existing = loadUser();
      const name = existing ? existing.name : `${provider} user`;
      loginAs(name, provider);
    });
  });

  el("authSubmit").addEventListener("click", () => {
    const email = el("authEmail").value.trim();
    const username = el("authUsername").value.trim();
    if (!email && !username) { toast("Enter at least a username or an email."); return; }
    loginAs(username || email.split("@")[0], "email");
  });

  el("ssoLink").addEventListener("click", () => showAuthView("ssoEmail"));
  el("ssoBackFromEmail").addEventListener("click", () => showAuthView("main"));
  el("ssoBackFromCode").addEventListener("click", () => showAuthView("ssoEmail"));

  el("ssoSendCode").addEventListener("click", () => {
    ssoEmailValue = el("ssoEmail").value.trim();
    if (!ssoEmailValue) { toast("Enter an email first."); return; }
    ssoGeneratedCode = String(Math.floor(100000 + Math.random() * 900000));
    el("ssoEmailEcho").textContent = ssoEmailValue;
    el("ssoDemoCode").textContent = `Demo note: this static page can't actually send email, so here is the code instead of your inbox: ${ssoGeneratedCode}`;
    showAuthView("ssoCode");
  });

  el("ssoVerify").addEventListener("click", () => {
    const entered = el("ssoCode").value.trim();
    if (!ssoGeneratedCode || entered !== ssoGeneratedCode) {
      toast("That code doesn't match — check the demo code shown above.");
      return;
    }
    loginAs(ssoEmailValue.split("@")[0], "SSO");
  });

  /* ---------------------------------------------------------
     Tutorial panel
     The video is stored with IndexedDB, scoped to this browser
     only. There's no shared server, so "only one upload ever"
     is enforced per browser/device, not globally across every
     visitor — a real global single-slot upload would need an
     actual backend with a database.
  --------------------------------------------------------- */
  const DB_NAME = "codeweb_db", DB_VERSION = 1, STORE = "videos";
  function openVideoDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => { req.result.createObjectStore(STORE, { keyPath: "id" }); };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async function getVideoRecord() {
    const db = await openVideoDB();
    return new Promise((resolve, reject) => {
      const req = db.transaction(STORE, "readonly").objectStore(STORE).get(1);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }
  async function saveVideoRecord(record) {
    const db = await openVideoDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function renderTutorialBody() {
    const body = el("tutorialBody");
    body.innerHTML = `<p class="hint">Loading…</p>`;
    let rec = null;
    try { rec = await getVideoRecord(); } catch (e) { /* IndexedDB unavailable */ }

    if (rec && rec.blob) {
      const url = URL.createObjectURL(rec.blob);
      body.innerHTML = `
        <div class="tutorial-video-wrap">
          <video src="${url}" controls></video>
          <div class="tutorial-meta">
            <span class="lock-icon">${ICONS.star}</span>
            Uploaded by ${escapeHtml(rec.uploaderName)} — this slot is locked, it's the only tutorial video for this browser.
          </div>
        </div>`;
    } else {
      body.innerHTML = `
        <label class="upload-drop" id="uploadDrop">
          <svg viewBox="0 0 24 24" width="26" height="26"><path d="M12 16V4M7 9l5-5 5 5M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span>Upload a .mp4 here</span>
          <small>Only the first upload sticks — after that, this slot is locked for this browser.</small>
          <input type="file" accept="video/mp4" id="videoInput" style="display:none">
        </label>`;
      el("videoInput").addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.type !== "video/mp4" && !file.name.toLowerCase().endsWith(".mp4")) {
          toast("Please choose an .mp4 file.");
          return;
        }
        try {
          await saveVideoRecord({ id: 1, blob: file, uploaderName: currentUser.name, uploadedAt: Date.now() });
          toast("Uploaded — this video now stays in the Tutorial every time you reopen CodeWeb here.");
          renderTutorialBody();
        } catch (err) {
          toast("Couldn't save the video in this browser's storage.");
        }
      });
    }
  }

  function openTutorial() {
    el("tutorialOverlay").classList.add("is-open");
    renderTutorialBody();
  }
  el("tutorialBtn").addEventListener("click", () => requireAuth(openTutorial));
  el("closeTutorial").addEventListener("click", () => el("tutorialOverlay").classList.remove("is-open"));
  el("tutorialOverlay").addEventListener("click", (e) => {
    if (e.target === el("tutorialOverlay")) el("tutorialOverlay").classList.remove("is-open");
  });

  /* ---------------------------------------------------------
     Theme (light / dark)
     There's no real Google account connected here, so CodeWeb
     can't literally read a "your Google is light/dark" signal.
     What it does instead: follow the browser/OS light-dark
     preference (the same signal every app actually uses), with
     a manual Light/Dark override saved per browser.
  --------------------------------------------------------- */
  let themeMode = localStorage.getItem("codeweb_theme") || "auto";
  function systemPrefersLight() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
  }
  function applyTheme(mode) {
    const isLight = mode === "light" ? true : mode === "dark" ? false : systemPrefersLight();
    document.body.classList.toggle("theme-light", isLight);
    document.querySelectorAll(".theme-option").forEach(btn => {
      btn.classList.toggle("is-active", btn.dataset.theme === mode);
    });
  }
  function setThemeMode(mode) {
    themeMode = mode;
    localStorage.setItem("codeweb_theme", mode);
    applyTheme(mode);
  }
  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", () => {
      if (themeMode === "auto") applyTheme("auto");
    });
  }
  document.querySelectorAll(".theme-option").forEach(btn => {
    btn.addEventListener("click", () => setThemeMode(btn.dataset.theme));
  });

  /* ---------------------------------------------------------
     Account overlay: profile picture, display name, settings
  --------------------------------------------------------- */
  const accountOverlay = el("accountOverlay");
  const EMOJI_CHOICES = ["😀","😎","🚀","🔥","⭐","💡","🎮","🐱","🐉","🌙","⚡","🍀","🎧","🧠","🛠️","🌈","👾","🧩","🍕","🎯","🦊","🌟","🖥️","☕"];

  function openAccount() {
    if (!currentUser) return;
    switchAccountView("profile");
    renderProfilePreview();
    renderProfileIconGrid();
    el("accountNameInput").value = currentUser.name;
    renderAccountInfo();
    applyTheme(themeMode);
    accountOverlay.classList.add("is-open");
  }
  function closeAccount() { accountOverlay.classList.remove("is-open"); }
  el("closeAccount").addEventListener("click", closeAccount);
  accountOverlay.addEventListener("click", (e) => { if (e.target === accountOverlay) closeAccount(); });

  document.querySelectorAll(".account-menu-item[data-account-view]").forEach(btn => {
    btn.addEventListener("click", () => switchAccountView(btn.dataset.accountView));
  });
  function switchAccountView(view) {
    document.querySelectorAll(".account-menu-item[data-account-view]").forEach(b => b.classList.toggle("is-active", b.dataset.accountView === view));
    document.querySelectorAll(".account-view").forEach(v => v.classList.toggle("is-active", v.id === `accountView-${view}`));
  }

  function avatarMarkup(user) {
    if (user.profileImage) return `<img src="${user.profileImage}" alt="">`;
    if (user.iconKey && ICONS[user.iconKey]) return ICONS[user.iconKey];
    return escapeHtml(user.name.slice(0, 1).toUpperCase());
  }
  function renderProfilePreview() { el("profilePreview").innerHTML = avatarMarkup(currentUser); }

  function renderProfileIconGrid() {
    const grid = el("profileIconGrid");
    grid.innerHTML = "";
    ICON_CHOICES.forEach(key => {
      const opt = document.createElement("div");
      opt.className = "icon-option" + (currentUser.iconKey === key && !currentUser.profileImage ? " is-selected" : "");
      opt.innerHTML = ICONS[key];
      opt.addEventListener("click", () => {
        currentUser.iconKey = key;
        currentUser.profileImage = null;
        saveUser(currentUser);
        renderProfilePreview();
        renderProfileIconGrid();
        renderAuthChip();
      });
      grid.appendChild(opt);
    });
  }

  el("profileImageInput").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast("Please choose an image file.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      toast("Couldn't read that file — please try a different image.");
      e.target.value = "";
    };
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => {
        toast("This browser can't display that image format (e.g. HEIC from an iPhone) — try a JPG or PNG instead.");
        e.target.value = "";
      };
      img.onload = () => {
        try {
          // Downscale and re-encode as JPEG so a normal phone photo
          // (often several MB) fits comfortably in localStorage.
          const MAX = 256;
          let { width, height } = img;
          if (width > height && width > MAX) { height = Math.round(height * (MAX / width)); width = MAX; }
          else if (height >= width && height > MAX) { width = Math.round(width * (MAX / height)); height = MAX; }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          canvas.getContext("2d").drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

          currentUser.profileImage = dataUrl;
          currentUser.iconKey = null;
          saveUser(currentUser);
          renderProfilePreview();
          renderProfileIconGrid();
          renderAuthChip();
          toast("Profile photo updated.");
        } catch (err) {
          toast("Couldn't save that photo in this browser's storage.");
        } finally {
          e.target.value = "";
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  function renderEmojiGrid() {
    const grid = el("emojiGrid");
    grid.innerHTML = "";
    EMOJI_CHOICES.forEach(ch => {
      const opt = document.createElement("div");
      opt.className = "emoji-option";
      opt.textContent = ch;
      opt.addEventListener("click", () => {
        const input = el("accountNameInput");
        const start = input.selectionStart ?? input.value.length;
        const end = input.selectionEnd ?? input.value.length;
        input.value = input.value.slice(0, start) + ch + input.value.slice(end);
        input.focus();
        input.selectionStart = input.selectionEnd = start + ch.length;
      });
      grid.appendChild(opt);
    });
  }
  renderEmojiGrid();

  el("saveAccountName").addEventListener("click", () => {
    const name = el("accountNameInput").value.trim();
    if (!name) { toast("Enter a name first."); return; }
    currentUser.name = name;
    saveUser(currentUser);
    renderAuthChip();
    renderProfilePreview();
    toast("Name updated.");
  });

  function renderAccountInfo() {
    const joined = new Date(currentUser.joinedAt);
    el("accountInfoBox").innerHTML = `
      Signed in with <strong>${escapeHtml(currentUser.method)}</strong><br>
      Member since <strong>${joined.toLocaleDateString()}</strong><br>
      Current level: <strong>${escapeHtml(computeLevel(currentUser.joinedAt))}</strong>
    `;
  }

  el("accountLogout").addEventListener("click", () => {
    const ok = window.confirm(`Log out of ${currentUser.name}? This only clears the local demo session on this browser.`);
    if (ok) {
      currentUser = null;
      clearUser();
      renderAuthChip();
      closeAccount();
      toast("Logged out.");
    }
  });

  /* ---------------------------------------------------------
     Init
  --------------------------------------------------------- */
  loadActiveFile();
  renderTabs();
  refreshPreview("preview");
  renderAuthChip();
  applyTheme(themeMode);
})();
