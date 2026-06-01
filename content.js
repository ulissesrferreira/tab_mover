// Tab Mover — duplo middle click move a aba para a próxima janela
const DOUBLE_CLICK_MS = 600;
let lastClickTime = 0;
let lastEventTime = 0;
let pendingFirst = false;

function handleMiddle(e) {
  if (e.button !== 1) return;

  // Sempre previne o auto-scroll do Edge (que consumia o 2º clique)
  e.preventDefault();

  // Deduplica pointerdown + mousedown do mesmo clique físico
  const now = Date.now();
  if (now - lastEventTime < 50) return;
  lastEventTime = now;

  if (pendingFirst && (now - lastClickTime) < DOUBLE_CLICK_MS) {
    // Segundo clique — duplo middle click confirmado!
    pendingFirst = false;
    e.stopImmediatePropagation();
    sendMove(3);
  } else {
    // Primeiro clique — aguarda o segundo
    pendingFirst = true;
    lastClickTime = now;
    setTimeout(() => { pendingFirst = false; }, DOUBLE_CLICK_MS + 50);
  }
}

window.addEventListener("pointerdown", handleMiddle, { capture: true, passive: false });
window.addEventListener("mousedown",   handleMiddle, { capture: true, passive: false });

// Bloqueia auxclick (abrir link) apenas quando fazendo duplo clique
window.addEventListener("auxclick", function(e) {
  if (e.button === 1 && !pendingFirst) {
    e.preventDefault();
    e.stopImmediatePropagation();
  }
}, { capture: true });

function sendMove(retries) {
  chrome.runtime.sendMessage({ action: "moveTabToNextWindow" }, function(response) {
    if (chrome.runtime.lastError) {
      if (retries > 0) {
        setTimeout(() => sendMove(retries - 1), 150);
      } else {
        showToast("❌ Falha na comunicação. Recarregue a página.");
      }
      return;
    }
    if (response?.status === "no_other_window") {
      showToast("⚠️ Abra outra janela primeiro (Ctrl+N)");
    } else if (response?.status === "error") {
      showToast("❌ " + (response.detail || "Erro desconhecido"));
    }
  });
}

function showToast(msg) {
  const old = document.getElementById("__tab_mover_host__");
  if (old) old.remove();

  const host = document.createElement("div");
  host.id = "__tab_mover_host__";
  host.style.cssText = "all:initial;position:fixed;bottom:0;left:0;width:100%;z-index:2147483647;pointer-events:none;";
  const shadow = host.attachShadow({ mode: "closed" });

  const toast = document.createElement("div");
  toast.textContent = msg;
  toast.style.cssText = `
    position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%);
    background: rgba(0,0,0,0.88); color: #fff; padding: 11px 24px;
    border-radius: 10px; font: 600 14px/1.4 -apple-system, sans-serif;
    z-index: 2147483647; pointer-events: none;
    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    opacity: 1; transition: opacity 0.35s ease;
  `;
  shadow.appendChild(toast);
  document.documentElement.appendChild(host);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => host.remove(), 400);
  }, 2500);
}
