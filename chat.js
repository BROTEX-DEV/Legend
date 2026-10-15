(() => {
  "use strict";
  const SUPABASE_URL = "https://pwwicgyrycaexjnnhseb.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_CiQbGJJx_WGbeGTPssoWYQ_kutyUJh9";
  const $ = selector => document.querySelector(selector);
  const stateBox = $("#chat-state"), appBox = $("#chat-app"), status = $("#chat-status");
  const messagesBox = $("#messages"), errorBox = $("#chat-error");
  let client, activeUser, activeMember, conversations = [], currentConversationId = null, messageChannel = null, memberNames = new Map();

  function setState(title, text, allowReturn = false) {
    $("#state-title").textContent = title;
    $("#state-text").textContent = text;
    $("#return-login").classList.toggle("hidden", !allowReturn);
    stateBox.classList.remove("hidden");
    appBox.classList.add("hidden");
  }
  function reportError(text) { errorBox.textContent = text || ""; }
  function safeText(value) { return String(value ?? ""); }
  function timeLabel(value) {
    const date = value ? new Date(value) : new Date();
    return Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  function addMessage(row, prepend = false) {
    const empty = messagesBox.querySelector(".empty-state");
    if (empty) empty.remove();
    const article = document.createElement("article");
    article.className = "message" + (row.sender_id === activeUser.id ? " own" : "");
    if (row.id) article.dataset.id = row.id;
    const meta = document.createElement("div"); meta.className = "message-meta";
    const name = document.createElement("strong");
    name.textContent = row.sender_id === activeUser.id ? (activeMember.display_name || "YOU") : (memberNames.get(row.sender_id) || "MEMBER");
    const marker = document.createElement("span"); marker.textContent = row.sender_id === activeUser.id ? "شما" : "عضو";
    meta.append(name, marker);
    const body = document.createElement("p"); body.className = "message-body"; body.textContent = safeText(row.content);
    const time = document.createElement("div"); time.className = "message-time"; time.textContent = timeLabel(row.created_at);
    article.append(meta, body, time);
    if (prepend) messagesBox.prepend(article); else messagesBox.append(article);
    return article;
  }
  function renderMessages(rows) {
    messagesBox.innerHTML = "";
    if (!rows.length) {
      const empty = document.createElement("div"); empty.className = "empty-state";
      empty.textContent = "هنوز پیامی نیست؛ گفتگو را شروع کن.";
      messagesBox.append(empty); return;
    }
    rows.forEach(row => addMessage(row));
    messagesBox.scrollTop = messagesBox.scrollHeight;
  }
  async function loadMessages(conversationId) {
    const { data, error } = await client.from("legends_chat_messages")
      .select("id,conversation_id,sender_id,content,created_at")
      .eq("conversation_id", conversationId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(100);
    if (error) throw error;
    renderMessages(data || []);
  }
  function subscribeMessages(conversationId) {
    if (messageChannel) client.removeChannel(messageChannel);
    messageChannel = client.channel("legends-chat-" + conversationId)
      .on("postgres_changes", { event: "*", schema: "public", table: "legends_chat_messages", filter: "conversation_id=eq." + conversationId }, async payload => {
        if (payload.eventType === "INSERT") {
          if (messagesBox.querySelector('[data-id="' + payload.new.id + '"]')) return;
          if (payload.new.deleted_at) return;
          addMessage(payload.new);
          messagesBox.scrollTop = messagesBox.scrollHeight;
        } else {
          try { await loadMessages(conversationId); } catch (e) { console.error(e); }
        }
      })
      .subscribe((state) => {
        if (state === "SUBSCRIBED") status.textContent = "همگام‌سازی زنده";
      });
  }
  function selectConversation(conversation) {
    currentConversationId = conversation.id;
    $("#conversation-title").textContent = conversation.title || (conversation.kind === "group" ? "گفتگوی عمومی" : "گفتگوی خصوصی");
    document.querySelectorAll(".conversation-item").forEach(el => el.classList.toggle("active", el.dataset.id === conversation.id));
    reportError("");
    loadMessages(conversation.id).then(() => subscribeMessages(conversation.id)).catch(err => {
      console.error("Load messages failed", err);
      reportError("پیام‌ها بارگذاری نشدند؛ دسترسی RLS و اتصال Supabase را بررسی کن.");
    });
  }
  async function initializeChat() {
    if (!window.supabase?.createClient) throw new Error("کتابخانه Supabase بارگذاری نشد.");
    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    if (sessionError) throw sessionError;
    activeUser = sessionData.session?.user;
    if (!activeUser) { setState("ورود لازم است", "ابتدا با حساب LEGENDS وارد شو.", true); status.textContent = "بدون نشست"; return; }

    const { data: member, error: memberError } = await client.from("legends_members")
      .select("user_id,display_name,role,is_active").eq("user_id", activeUser.id).maybeSingle();
    if (memberError || !member || !member.is_active) {
      await client.auth.signOut();
      setState("دسترسی رد شد", "این حساب عضو فعال LEGENDS نیست.", true);
      status.textContent = "دسترسی رد شد"; return;
    }
    activeMember = member;
    $("#member-name").textContent = member.display_name || activeUser.email || "MEMBER";
    $("#member-avatar").textContent = (member.display_name || "L").trim().slice(0, 1).toUpperCase();

    const { data: directory, error: directoryError } = await client.from("legends_members")
      .select("user_id,display_name").eq("is_active", true);
    if (!directoryError) (directory || []).forEach(item => memberNames.set(item.user_id, item.display_name || "MEMBER"));

    const { data: participations, error: participantsError } = await client.from("legends_chat_participants")
      .select("conversation_id").eq("user_id", activeUser.id);
    if (participantsError) throw participantsError;
    const ids = [...new Set((participations || []).map(item => item.conversation_id))];
    if (!ids.length) {
      setState("هنوز گفتگویی نداری", "برای این حساب هنوز گفتگویی ساخته نشده است. مدیر باید عضویت گفتگو را تنظیم کند.");
      status.textContent = "بدون گفتگو"; return;
    }
    const { data: convs, error: convError } = await client.from("legends_chat_conversations")
      .select("id,kind,title,created_at").in("id", ids).order("created_at", { ascending: true });
    if (convError) throw convError;
    conversations = convs || [];
    $("#conversation-list").innerHTML = "";
    conversations.forEach((conversation, index) => {
      const button = document.createElement("button");
      button.type = "button"; button.className = "conversation-item"; button.dataset.id = conversation.id;
      const icon = document.createElement("span"); icon.className = "room-icon"; icon.textContent = conversation.kind === "group" ? "#" : "↔";
      const labels = document.createElement("span");
      const title = document.createElement("strong"); title.textContent = conversation.title || (conversation.kind === "group" ? "گفتگوی عمومی" : "گفتگوی خصوصی");
      const sub = document.createElement("small"); sub.textContent = conversation.kind === "group" ? "گفتگوی اعضا" : "گفتگوی مستقیم";
      labels.append(title, sub); button.append(icon, labels);
      button.addEventListener("click", () => selectConversation(conversation));
      $("#conversation-list").append(button);
      if (index === 0) button.classList.add("active");
    });
    stateBox.classList.add("hidden"); appBox.classList.remove("hidden");
    status.textContent = "متصل به Supabase";
    if (conversations[0]) selectConversation(conversations[0]);
  }

  $("#message-form").addEventListener("submit", async event => {
    event.preventDefault();
    if (!client || !activeUser || !currentConversationId) return;
    const input = $("#message-input"), text = input.value.trim();
    if (!text || text.length > 4000) return;
    const button = $("#send-message");
    button.disabled = true; reportError("");
    const optimistic = addMessage({ sender_id: activeUser.id, content: text, created_at: new Date().toISOString() });
    messagesBox.scrollTop = messagesBox.scrollHeight;
    input.value = "";
    try {
      const { data, error } = await client.from("legends_chat_messages").insert({
        conversation_id: currentConversationId, sender_id: activeUser.id, content: text
      }).select("id,conversation_id,sender_id,content,created_at").single();
      if (error) throw error;
      optimistic.dataset.id = data.id;
      const stamp = optimistic.querySelector(".message-time"); if (stamp) stamp.textContent = timeLabel(data.created_at);
    } catch (err) {
      console.error("Message send failed", err);
      optimistic.remove();
      input.value = text;
      reportError("ارسال پیام انجام نشد؛ قوانین دسترسی یا اتصال را بررسی کن.");
    } finally {
      button.disabled = false;
      input.focus();
    }
  });
  $("#chat-logout").addEventListener("click", async () => {
    if (messageChannel) await client.removeChannel(messageChannel);
    await client.auth.signOut();
    window.location.replace("./index.html");
  });
  clientReady();
  async function clientReady() {
    try { await initializeChat(); }
    catch (error) {
      console.error("LEGENDS chat initialization failed", error);
      setState("خطا در اتصال", "ارتباط با Supabase برقرار نشد؛ اتصال اینترنت و مجوزهای جدول گفتگو را بررسی کن.", true);
      status.textContent = "خطای اتصال";
    }
  }
  window.addEventListener("pagehide", () => { if (messageChannel && client) client.removeChannel(messageChannel); });
})();