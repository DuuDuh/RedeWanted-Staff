(() => {
  const form = document.getElementById("staffForm");
  const steps = [...document.querySelectorAll(".form-step")];
  const nextBtn = document.getElementById("nextBtn");
  const prevBtn = document.getElementById("prevBtn");
  const submitBtn = document.getElementById("submitBtn");
  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressText");
  const stepNumber = document.getElementById("stepNumber");
  const stepTitle = document.getElementById("stepTitle");
  const errorBox = document.getElementById("formError");
  const successState = document.getElementById("successState");
  const applicationCode = document.getElementById("applicationCode");

  let current = 0;
  const draftKey = "redewanted_staff_draft_v1";

  function render() {
    steps.forEach((step, index) => step.classList.toggle("active", index === current));

    const percent = Math.round(((current + 1) / steps.length) * 100);
    progressBar.style.width = `${percent}%`;
    progressText.textContent = `${percent}%`;
    stepNumber.textContent = current + 1;
    stepTitle.textContent = steps[current].dataset.title;

    prevBtn.disabled = current === 0;
    nextBtn.style.display = current === steps.length - 1 ? "none" : "inline-block";
    submitBtn.style.display = current === steps.length - 1 ? "inline-block" : "none";
    errorBox.textContent = "";

    window.scrollTo({ top: document.querySelector(".form-card").offsetTop - 100, behavior: "smooth" });
  }

  function fieldsInStep(step) {
    return [...step.querySelectorAll("input, textarea, select")];
  }

  function validateStep() {
    const fields = fieldsInStep(steps[current]);
    let firstInvalid = null;

    fields.forEach(field => {
      field.classList.remove("invalid");

      if (!field.checkValidity()) {
        field.classList.add("invalid");
        if (!firstInvalid) firstInvalid = field;
      }
    });

    if (firstInvalid) {
      errorBox.textContent = "Revise os campos obrigatórios antes de continuar.";
      firstInvalid.focus();
      return false;
    }

    return true;
  }

  nextBtn.addEventListener("click", () => {
    if (!validateStep()) return;
    if (current < steps.length - 1) {
      current++;
      saveDraft();
      render();
    }
  });

  prevBtn.addEventListener("click", () => {
    if (current > 0) {
      current--;
      render();
    }
  });

  function saveDraft() {
    const data = {};
    [...form.elements].forEach(el => {
      if (!el.name || el.type === "hidden") return;
      if (el.type === "checkbox") data[el.name] = el.checked;
      else data[el.name] = el.value;
    });
    localStorage.setItem(draftKey, JSON.stringify(data));
  }

  function loadDraft() {
    try {
      const saved = JSON.parse(localStorage.getItem(draftKey) || "{}");
      [...form.elements].forEach(el => {
        if (!el.name || !(el.name in saved)) return;
        if (el.type === "checkbox") el.checked = Boolean(saved[el.name]);
        else el.value = saved[el.name];
      });
    } catch (_) {}
  }

  form.addEventListener("input", () => {
    clearTimeout(window.__draftTimer);
    window.__draftTimer = setTimeout(saveDraft, 250);
  });

  function makeApplicationCode() {
    const now = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `WANTED-${now.slice(-5)}-${random}`;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!validateStep()) return;

    // BLOQUEIO DE SEGURANÇA:
    // Troque "SEU_FORM_ID" no index.html pelo ID real do seu formulário Formspree.
    if (form.action.includes("SEU_FORM_ID")) {
      errorBox.textContent = "O formulário ainda não foi conectado ao Formspree. Configure o SEU_FORM_ID antes de publicar.";
      return;
    }

    submitBtn.disabled = true;
    submitBtn.querySelector("span").textContent = "Enviando...";
    errorBox.textContent = "";

    const applicationId = makeApplicationCode();
    const formData = new FormData(form);
    formData.append("id_candidatura", applicationId);

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: formData,
        headers: { "Accept": "application/json" }
      });

      if (!response.ok) throw new Error("Falha no envio");

      localStorage.removeItem(draftKey);
      form.hidden = true;
      document.querySelector(".form-head").hidden = true;
      document.querySelector(".progress-track").hidden = true;
      successState.hidden = false;
      applicationCode.textContent = `ID DA CANDIDATURA: ${applicationId}`;
      successState.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (error) {
      errorBox.textContent = "Não foi possível enviar agora. Verifique sua conexão e tente novamente.";
      submitBtn.disabled = false;
      submitBtn.querySelector("span").textContent = "Enviar candidatura";
    }
  });

  loadDraft();
  render();
})();
