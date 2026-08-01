(function () {
  "use strict";

  function busyLabelFor(label) {
    return /^Refresh\b/.test(label) ? label.replace(/^Refresh\b/, "Refreshing") : "Refreshing";
  }

  function run(button, onComplete, options = {}) {
    if (!(button instanceof HTMLButtonElement) || button.disabled || button.classList.contains("is-refreshing")) return false;

    const idleLabel = options.idleLabel || button.getAttribute("aria-label") || "Refresh";
    const idleTooltip = button.getAttribute("data-tooltip");
    const busyLabel = options.busyLabel || busyLabelFor(idleLabel);
    const duration = options.duration ?? 650;

    button.classList.add("is-refreshing");
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    button.setAttribute("aria-label", busyLabel);
    button.dataset.tooltip = busyLabel;

    window.setTimeout(() => {
      button.classList.remove("is-refreshing");
      button.disabled = false;
      button.removeAttribute("aria-busy");
      button.setAttribute("aria-label", idleLabel);
      if (idleTooltip === null) button.removeAttribute("data-tooltip");
      else button.dataset.tooltip = idleTooltip;
      onComplete?.();
    }, duration);

    return true;
  }

  window.KD_REFRESH = { run };
})();

export {};
