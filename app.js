(function () {
    const cfg = window.FL_CFG || {};
    const apiBase = cfg.apiBase;
    const $ = (id) => document.getElementById(id);
  
    const params = new URLSearchParams(location.search);
    const ticket = params.get("ticket");
  
    const courseTitle = $("courseTitle");
    const studentName = $("studentName");
    const statusBlock = $("statusBlock");
    const currentStatusEl = $("currentStatus");
    const saveBtn = $("saveBtn");
    const message = $("message");
    const errorBlock = $("errorBlock");
    const errorText = $("errorText");
  
    const STATUS_LABELS = {
      waiting: "ממתין/ה לאישור",
      confirmed: "מאשר/ת השתתפות",
      cancelled: "מבטל/ת השתתפות"
    };
  
    function setStatusLabel(el, val){
      el.textContent = STATUS_LABELS[val] || val || "—";
    }
  
    async function loadStatus() {
      if (!ticket) {
        courseTitle.textContent = "חסר פרמטר ticket בכתובת";
        errorText.textContent = "הקישור שגוי או חסר רכיב אבטחה (ticket).";
        errorBlock.classList.remove("hidden");
        return;
      }
      try {
        const url = `${apiBase}?ticket=${encodeURIComponent(ticket)}`;
        const res = await fetch(url, { headers: { "Accept": "application/json" }});
        const data = await res.json();
  
        if (!data.ok) throw new Error(data.error || "Invalid response");
  
        courseTitle.textContent = data.course || "קורס";
        studentName.textContent = data.student ? `היי ${data.student} 👋` : "";
        setStatusLabel(currentStatusEl, data.status);
        statusBlock.classList.remove("hidden");
  
        // Pre-select current status
        document.querySelectorAll('input[name="status"]').forEach(r=>{
          r.checked = (r.value === data.status);
        });
  
      } catch (err) {
        errorBlock.classList.remove("hidden");
        errorText.textContent = err.message;
      }
    }
  
    async function saveStatus() {
      const choice = document.querySelector('input[name="status"]:checked')?.value;
      if (!choice) {
        message.textContent = "אנא בחר/י סטטוס קודם";
        return;
      }
      message.textContent = "שומר…";
      saveBtn.disabled = true;
      try {
        const res = await fetch(apiBase, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify({ ticket, status: choice })
        });
        const data = await res.json();
        if (data.ok) {
          setStatusLabel(currentStatusEl, choice);
          message.textContent = "✅ הסטטוס עודכן בהצלחה";
          // TODO: כאן בעתיד אפשר לשלוח WhatsApp / לעדכן Pipedrive (ראה הערות בהמשך)
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
  