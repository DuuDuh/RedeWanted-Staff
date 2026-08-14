(() => {
  const form = document.getElementById("staffForm");
  const steps = [...document.querySelectorAll(".form-step")];
  const indicators = [...document.querySelectorAll(".step-nav-item")];

  const nextBtn = document.getElementById("nextBtn");
  const prevBtn = document.getElementById("prevBtn");
  const submitBtn = document.getElementById("submitBtn");
  const submitLabel = submitBtn.querySelector(".submit-label");

  const progressBar = document.getElementById("progressBar");
  const stepNumber = document.getElementById("stepNumber");
  const stepTitle = document.getElementById("stepTitle");
  const stepHint = document.getElementById("stepHint");
  const errorBox = document.getElementById("formError");

  const successState = document.getElementById("successState");
  const applicationCode = document.getElementById("applicationCode");

  const draftKey = "redewanted_staff_draft_pro_v1";
  let current = 0;

  function render({ scroll = true } = {}) {
    steps.forEach((step, index) => {
      step.classList.toggle("active", index === current);
    });

    indicators.forEach((item, index) => {
      item.classList.toggle("active", index === current);
      item.classList.toggle("done", index < current);
    });

    const percent = ((current + 1) / steps.length) * 100;

    progressBar.style.width = `${percent}%`;
    stepNumber.textContent = String(current + 1).padStart(2, "0");
    stepTitle.textContent = steps[current].dataset.title;
    stepHint.textContent = steps[current].dataset.hint;

    prevBtn.disabled = current === 0;
    nextBtn.style.display = current === steps.length - 1 ? "none" : "inline-flex";
    submitBtn.style.display = current === steps.length - 1 ? "inline-flex" : "none";

    errorBox.textContent = "";

    if (scroll) {
      document.querySelector(".application").scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }

  function currentFields() {
    return [...steps[current].querySelectorAll("input, textarea, select")];
  }

  function validateCurrentStep() {
    let firstInvalid = null;

    currentFields().forEach((field) => {
      field.classList.remove("invalid");

      if (!field.checkValidity()) {
        field.classList.add("invalid");
        if (!firstInvalid) firstInvalid = field;
      }
    });

    if (firstInvalid) {
      errorBox.textContent = "Confira os campos obrigatórios antes de continuar.";
      firstInvalid.focus();
      return false;
    }

    return true;
  }

  function saveDraft() {
    const data = {};

    [...form.elements].forEach((element) => {
      if (!element.name || element.type === "hidden") return;

      data[element.name] =
        element.type === "checkbox"
          ? element.checked
          : element.value;
    });

    localStorage.setItem(draftKey, JSON.stringify(data));
  }

  function restoreDraft() {
    try {
      const data = JSON.parse(localStorage.getItem(draftKey) || "{}");

      [...form.elements].forEach((element) => {
        if (!element.name || !(element.name in data)) return;

        if (element.type === "checkbox") {
          element.checked = Boolean(data[element.name]);
        } else {
          element.value = data[element.name];
        }
      });
    } catch (_) {
      // Se o navegador limpar ou corromper o rascunho, o formulário segue normalmente.
    }
  }

  function createProtocol() {
    const datePart = new Date()
      .toISOString()
      .slice(2, 10)
      .replaceAll("-", "");

    const random = Math.random()
      .toString(36)
      .slice(2, 7)
      .toUpperCase();

    return `RW-${datePart}-${random}`;
  }

  nextBtn.addEventListener("click", () => {
    if (!validateCurrentStep()) return;

    saveDraft();

    if (current < steps.length - 1) {
      current += 1;
      render();
    }
  });

  prevBtn.addEventListener("click", () => {
    if (current > 0) {
      current -= 1;
      render();
    }
  });

  form.addEventListener("input", () => {
    clearTimeout(window.__wantedDraftTimer);

    window.__wantedDraftTimer = setTimeout(() => {
      saveDraft();
    }, 220);
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!validateCurrentStep()) return;

    submitBtn.disabled = true;
    submitLabel.textContent = "Enviando...";
    errorBox.textContent = "";

    const protocol = createProtocol();
    const formData = new FormData(form);
    formData.append("protocolo", protocol);

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json"
        }
      });

      if (!response.ok) {
        throw new Error("Falha no envio");
      }

      localStorage.removeItem(draftKey);

      form.hidden = true;
      document.querySelector(".application-top").hidden = true;
      document.querySelector(".step-nav").hidden = true;
      document.querySelector(".progress-line").hidden = true;

      successState.hidden = false;
      applicationCode.textContent = protocol;

      document.querySelector(".application").scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    } catch (_) {
      errorBox.textContent =
        "Não foi possível enviar agora. Confira sua conexão e tente novamente.";

      submitBtn.disabled = false;
      submitLabel.textContent = "Enviar candidatura";
    }
  });

  restoreDraft();
  render({ scroll: false });
})();
