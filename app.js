(function () {
  const cfg = window.FL_CFG || {};
  const apiBase = cfg.apiBase;
  const $ = (id) => document.getElementById(id);

  const params = new URLSearchParams(location.search);
  const ticket = params.get("ticket");

  // Elements
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

  const STATUS_LABELS = {
    waiting: { text: "ממתין/ה לאישור", badge: "badge-waiting", outline: "btn-outline-secondary" },
    confirmed: { text: "מאשר/ת השתתפות", badge: "badge-confirmed", outline: "btn-outline-success" },
    cancelled: { text: "מבטל/ת השתתפות", badge: "badge-cancelled", outline: "btn-outline-danger" }
  };

  function setBadge(status) {
    // reset classes
    currentStatusBadge.className = "badge rounded-pill px-3 py-2";
    const def = STATUS_LABELS[status] || STATUS_LABELS.waiting;
    currentStatusBadge.classList.add(def.badge);
    currentStatusBadge.textContent = def.text;
  }

  async function loadStatus() {
    if (!ticket) {
      showError("חסר פרמטר ticket בכתובת הקישור.");
      return;
    }
    try {
      const url = `${apiBase}?ticket=${encodeURIComponent(ticket)}`;
      const res = await fetch(url, { headers: { "Accept": "application/json" }});
      const data = await res.json();

      if (!data.ok) throw new Error(data.error || "Invalid response");

      courseTitle.textContent = data.course || "קורס";
      studentName.textContent = data.student ? `היי ${data.student} 👋` : "";

      // Apply current status
      setBadge(data.status);
      document.querySelectorAll('input[name="status"]').forEach(r => {
        r.checked = (r.value === data.status);
      });

      loadingRow.classList.add("d-none");
      statusRow.classList.remove("d-none");
    } catch (err) {
      showError(err.message || "שגיאה בלתי צפויה");
    }
  }

  function showError(msg) {
    loadingRow.classList.add("d-none");
    errorRow.classList.remove("d-none");
    errorText.textContent = msg;
  }

  async function saveStatus() {
    const choice = document.querySelector('input[name="status"]:checked')?.value;
    if (!choice) {
      message.textContent = "אנא בחר/י סטטוס קודם";
      return;
    }
    saveBtn.disabled = true;
    message.textContent = "שומר…";
    try {
      const res = await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ ticket, status: choice })
      });
      const data = await res.json();
      if (data.ok) {
        setBadge(choice);
        message.textContent = "";
        if (toast) {
          toastBody.textContent = "עודכן בהצלחה";
          toast.show();
        }
      } else {
        message.textContent = "⚠️ לא הצלחנו לעדכן ("+(data.error||"שגיאה")+")";
      }
    } catch (e) {
      message.textContent = "שגיאת רשת: " + e.message;
    } finally {
      saveBtn.disabled = false;
    }
  }

  saveBtn.addEventListener("click", saveStatus);
  loadStatus();
})();
