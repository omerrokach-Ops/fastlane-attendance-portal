(function () {
  // --- Config ---
  const cfg = window.FL_CFG || {};
  // apiBase יכול להיות עם או בלי ?code=... — מטפלים בזה בהמשך
  const apiBase = cfg.apiBase;

  // כלי ליצירת URL עם פרמטרים נוספים בלי לשבור את ה-query הקיים
  const buildUrl = (q) => apiBase + (apiBase.includes("?") ? "&" : "?") + q;

  // --- DOM helpers ---
  const $ = (id) => document.getElementById(id);

  const courseTitle = $("courseTitle");
  const studentName = $("studentName");
  const loadingRow = $("loadingRow");
  const statusRow = $("statusRow");
  const errorRow = $("errorRow");
  const errorText = $("errorText");
  const currentStatusBadge = $("currentStatusBadge");
  const saveBtn = $("saveBtn");
  const message = $("message");

  const toastEl = $("toast");
  const toastBody = $("toastBody");
  const toast = (window.bootstrap) ? new bootstrap.Toast(toastEl, { delay: 2400 }) : null;

  // --- URL params ---
  const params = new URLSearchParams(location.search);
  const ticket = params.get("ticket");

  // --- UI helpers ---
  const STATUS_LABELS = {
    waiting:   { text: "ממתין/ה לאישור", badge: "badge-waiting"   },
    confirmed: { text: "מגיע",           badge: "badge-confirmed" },
    cancelled: { text: "לא מגיע",         badge: "badge-cancelled"}
  };

  function setBadge(status) {
    const def = STATUS_LABELS[status] || STATUS_LABELS.waiting;
    currentStatusBadge.className = "badge rounded-pill px-3 py-2 " + def.badge;
    currentStatusBadge.textContent = def.text;
  }

  function showError(msg) {
    loadingRow.classList.add("d-none");
    statusRow.classList.add("d-none");
    errorRow.classList.remove("d-none");
    errorText.textContent = msg;
  }

  // --- Load status (GET /api/attendance?code=...&ticket=...) ---
  async function loadStatus() {
    if (!apiBase) return showError("הגדרת apiBase חסרה ב-index.html");
    if (!ticket)  return showError("חסר פרמטר ticket בקישור שקיבלת.");

    try {
      const url = buildUrl(`ticket=${encodeURIComponent(ticket)}`);
      const res = await fetch(url, { headers: { "Accept": "application/json" } });

      // ננסה לפרש JSON גם במקרה של שגיאה כדי להציג הודעה מועילה
      let data = null;
      try { data = await res.json(); } catch { /* ignore */ }

      if (!res.ok) {
        const msg = (data && (data.error || data.message)) || `HTTP ${res.status}`;
        throw new Error(msg);
      }

      if (!data || data.ok !== true) {
        throw new Error((data && data.error) || "Response not ok");
      }

      // מילוי UI
      courseTitle.textContent = data.course || "קורס";
      studentName.textContent = data.student ? `היי ${data.student} 👋` : "";
      setBadge(data.status);

      // סימון בחירה ברדיו לפי סטטוס נוכחי
      document
        .querySelectorAll('input[name="status"]')
        .forEach(r => r.checked = (r.value === data.status));

      // הצגה
      loadingRow.classList.add("d-none");
      errorRow.classList.add("d-none");
      statusRow.classList.remove("d-none");

    } catch (err) {
      // "Failed to fetch" = לרוב CORS/URL שגוי/רשת
      showError(err.message || "Failed to fetch");
    }
  }

  // --- Save status (POST /api/attendance?code=...) ---
  async function saveStatus() {
    const choice = document.querySelector('input[name="status"]:checked')?.value;
    if (!choice) {
      message.textContent = "אנא בחר/י סטטוס קודם.";
      return;
    }
    saveBtn.disabled = true;
    message.textContent = "שומר…";

    try {
      const res = await fetch(apiBase, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ ticket, status: choice })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data || data.ok !== true) {
        const msg = (data && (data.error || data.message)) || `HTTP ${res.status}`;
        throw new Error(msg);
      }

      setBadge(choice);
      message.textContent = "";
      if (toast) {
        toastBody.textContent = "עודכן בהצלחה";
        toast.show();
      }
    } catch (e) {
      message.textContent = "⚠️ " + (e.message || "שגיאת רשת");
    } finally {
      saveBtn.disabled = false;
    }
  }

  saveBtn.addEventListener("click", saveStatus);
  loadStatus();
})();
