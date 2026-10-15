/* LEGENDS Firebase migration draft v1.1.0. Supabase remains untouched on main. */
(() => {
  const $ = (s) => document.querySelector(s);
  const config = window.LEGENDS_FIREBASE_CONFIG;
  const loginView = $("#login-view"), appView = $("#app-view"), loginForm = $("#login-form");
  const loginMessage = $("#login-message"), status = $("#connection-status");
  let auth = null, store = null, currentUser = null, cases = [], language = localStorage.getItem("legends-language") === "fa" ? "fa" : "en";

  const aliases = {
    ASTRO: { email: "astro@legends.example.com", displayName: "ASTRO" },
    BROTEX: { email: "brotex@legends.invalid", displayName: "BROTEX" }
  };
  const words = {
    en: { "Overview":"Overview", "Terminal":"Terminal", "Black Files":"Black Files", "System Log":"System Log", "Mission Control":"Mission Control", "Cyber Terminal":"Cyber Terminal", "Sign out":"Sign out", "AUTHENTICATE":"AUTHENTICATE", "PASSWORD":"PASSWORD", "USERNAME":"USERNAME", "Enter member password":"Enter member password", "Choose member":"Choose member", "Operative Login":"Operative Login", "IDENTITY VERIFICATION":"IDENTITY VERIFICATION", "Two authorized members. One private workspace.":"Two authorized members. One private workspace.", "SYSTEM STANDBY":"SYSTEM STANDBY" },
    fa: { "Overview":"نمای کلی", "Terminal":"ترمینال", "Black Files":"پرونده‌های محرمانه", "System Log":"گزارش سیستم", "Mission Control":"مرکز مأموریت", "Cyber Terminal":"ترمینال سایبری", "Sign out":"خروج", "AUTHENTICATE":"ورود", "PASSWORD":"رمز عبور", "USERNAME":"نام کاربری", "Enter member password":"رمز عبور را وارد کنید", "Choose member":"عضو را انتخاب کنید", "Operative Login":"ورود اعضا", "IDENTITY VERIFICATION":"تأیید هویت", "Two authorized members. One private workspace.":"دو عضو مجاز؛ یک فضای کاری خصوصی.", "SYSTEM STANDBY":"آماده‌به‌کار" }
  };
  function say(key) { return (words[language] && words[language][key]) || key; }
  function setMessage(message) { loginMessage.textContent = message; }
  function configReady() {
    return config && config.apiKey && !config.apiKey.startsWith("REPLACE_") &&
      config.projectId && !config.projectId.startsWith("REPLACE_") &&
      config.appId && !config.appId.startsWith("REPLACE_");
  }
  function log(message) {
    const list = $("#activity-list");
    if (!list) return;
    const row = document.createElement("p");
    row.className = "activity-row";
    row.textContent = new Date().toLocaleTimeString() + " — " + message;
    list.prepend(row);
  }
  function showApp(user, member) {
    currentUser = user;
    loginView.classList.add("hidden");
    appView.classList.remove("hidden");
    $("#member-label").textContent = member.displayName;
    status.textContent = "SYSTEM ONLINE";
    log("Authenticated as " + member.displayName);
    loadCases();
    showPage("overview");
  }
  function showPage(page) {
    document.querySelectorAll(".page").forEach(el => el.classList.add("hidden"));
    $("#page-" + page)?.classList.remove("hidden");
    document.querySelectorAll(".nav-item").forEach(el => el.classList.toggle("active", el.dataset.page === page));
    const title = { overview: "Mission Control", terminal: "Cyber Terminal", files: "Black Files", logs: "System Log" }[page] || "Mission Control";
    $("#page-title").textContent = say(title) + ".";
    if (page === "files") loadCases();
  }
  async function loadCases() {
    if (!store || !currentUser) return;
    const list = $("#files-list");
    list.innerHTML = '<article class="panel file-card"><p class="muted">Loading authorized records…</p></article>';
    try {
      const snapshot = await store.collection("case_files").orderBy("createdAt", "desc").get();
      cases = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      $("#case-count").textContent = cases.length;
      $("#overview-case-count").textContent = cases.length;
      list.innerHTML = "";
      if (!cases.length) {
        list.innerHTML = '<div class="empty-state">NO CASE FILES FOUND.</div>';
      } else {
        cases.forEach(c => {
          const card = document.createElement("article");
          card.className = "panel file-card";
          const h = document.createElement("h3"); h.textContent = c.title || "Untitled";
          const p = document.createElement("p"); p.textContent = c.body || "No briefing attached.";
          const tag = document.createElement("span"); tag.className = "file-tag"; tag.textContent = c.classification || "RESTRICTED";
          card.append(tag, h, p); list.append(card);
        });
      }
      $("#files-message").textContent = "";
    } catch (err) {
      $("#files-message").textContent = "دسترسی پرونده‌ها رد شد. قوانین Firestore و سند اعضا را بررسی کن.";
      console.error("Firestore case read failed", err);
    }
  }
  function signOut() {
    if (auth) auth.signOut().catch(console.error);
    currentUser = null;
    cases = [];
    appView.classList.add("hidden");
    loginView.classList.remove("hidden");
    loginForm.reset();
    setMessage("");
    status.textContent = "SYSTEM STANDBY";
  }
  function applyLanguage() {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "fa" ? "rtl" : "ltr";
    const toggle = $("#language-toggle");
    if (toggle) toggle.textContent = language === "fa" ? "English" : "فارسی";
    const username = $("#username");
    if (username) username.placeholder = say("Choose member");
    const password = $("#password");
    if (password) password.placeholder = say("Enter member password");
    document.querySelectorAll("[data-page]").forEach(btn => {
      const raw = btn.dataset.page;
      const label = btn.querySelector("span")?.nextSibling;
      if (label && label.nodeType === Node.TEXT_NODE) label.nodeValue = " " + say(({ overview:"Overview", terminal:"Terminal", files:"Black Files", logs:"System Log" })[raw] || raw);
    });
    const title = $("#page-title");
    const active = document.querySelector(".nav-item.active");
    if (title && active) title.textContent = say(({ overview:"Mission Control", terminal:"Cyber Terminal", files:"Black Files", logs:"System Log" })[active.dataset.page] || "Mission Control") + ".";
  }

  if (!configReady() || !window.firebase) {
    status.textContent = "CONFIGURATION REQUIRED";
    setMessage("برای اتصال، ابتدا تنظیمات وب Firebase را در firebase-config.js وارد کن؛ هنوز هیچ پروژه‌ای متصل نشده است.");
  } else {
    try {
      if (!firebase.apps.length) firebase.initializeApp(config);
      auth = firebase.auth();
      store = firebase.firestore();
      status.textContent = "FIREBASE READY";
      auth.onAuthStateChanged(async user => {
        if (!user) return;
        try {
          const memberDoc = await store.collection("members").doc(user.uid).get();
          if (!memberDoc.exists) {
            await auth.signOut();
            setMessage("این حساب در فهرست اعضای مجاز نیست.");
            return;
          }
          const member = memberDoc.data();
          showApp(user, { displayName: member.displayName || user.email });
        } catch (err) {
          console.error(err);
          setMessage("ورود انجام شد، اما بررسی مجوز عضو ناموفق بود. قوانین Firestore را بررسی کن.");
          await auth.signOut();
        }
      });
    } catch (err) {
      status.textContent = "FIREBASE ERROR";
      setMessage("پیکربندی Firebase معتبر نیست. تنظیمات را بررسی کن.");
      console.error(err);
    }
  }

  loginForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (!auth) return setMessage("ابتدا پیکربندی Firebase را کامل کن.");
    const alias = ($("#username")?.value || "").trim().toUpperCase();
    const member = aliases[alias];
    const password = $("#password").value;
    if (!member) return setMessage("نام کاربری باید ASTRO یا BROTEX باشد.");
    const button = loginForm.querySelector('button[type="submit"]');
    button.disabled = true;
    setMessage("در حال بررسی اطلاعات ورود…");
    try {
      await auth.signInWithEmailAndPassword(member.email, password);
    } catch (err) {
      console.error("Firebase sign-in failed", err.code);
      setMessage("ورود ناموفق بود؛ نام کاربری، رمز و فعال بودن Email/Password را بررسی کن.");
    } finally {
      button.disabled = false;
    }
  });
  document.querySelectorAll("[data-page]").forEach(btn => btn.addEventListener("click", () => showPage(btn.dataset.page)));
  document.querySelectorAll("[data-go]").forEach(btn => btn.addEventListener("click", () => showPage(btn.dataset.go)));
  $("#logout-button")?.addEventListener("click", signOut);
  $("#refresh-files")?.addEventListener("click", loadCases);
  $("#clear-terminal")?.addEventListener("click", () => { $("#terminal-output").innerHTML = ""; });
  $("#command-form")?.addEventListener("submit", event => {
    event.preventDefault();
    const input = $("#command-input"), command = input.value.trim().toLowerCase();
    input.value = "";
    const out = $("#terminal-output");
    const p = document.createElement("p");
    const responses = { help:"Commands: help, status, profile, files, missions, clear, logout", status:"SESSION: " + (currentUser ? "AUTHENTICATED" : "OFFLINE"), profile:"MEMBER: " + (currentUser?.email || "UNKNOWN"), files:"Open BLACK FILES to load authorized records.", missions:"OPERATION ZERO :: Review the archive briefing.", logout:"Signing out…" };
    if (command === "clear") out.innerHTML = "";
    else { p.textContent = "AGENT@LEGENDS:~$ " + command + (responses[command] ? "\n" + responses[command] : command ? "\nUnknown command. Type help." : ""); p.style.whiteSpace = "pre-wrap"; out.append(p); }
    if (command === "logout") signOut();
    if (command === "files") showPage("files");
  });
  $("#language-toggle")?.addEventListener("click", () => {
    language = language === "en" ? "fa" : "en";
    localStorage.setItem("legends-language", language);
    applyLanguage();
  });
  applyLanguage();
})();
