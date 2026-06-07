// Tab Mover — background.js (Service Worker MV3)

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action !== "moveTabToNextWindow") return false;

  const currentTabId = sender.tab?.id;
  const currentWinId = sender.tab?.windowId;

  if (!currentTabId || !currentWinId) {
    sendResponse({ status: "error", detail: "Não foi possível identificar a aba." });
    return false;
  }

  console.log("[TabMover BG] Recebeu pedido. Tab:", currentTabId, "Win:", currentWinId);

  chrome.windows.getAll({ windowTypes: ["normal"] }, (windows) => {
    if (chrome.runtime.lastError) {
      sendResponse({ status: "error", detail: chrome.runtime.lastError.message });
      return;
    }

    const sorted = [...windows].sort((a, b) => a.id - b.id);
    const currentIdx = sorted.findIndex(w => w.id === currentWinId);

    // Candidatos: janelas após a atual + antes (ciclicamente), excluindo a própria
    const candidates = [
      ...sorted.slice(currentIdx + 1),
      ...sorted.slice(0, currentIdx),
    ];

    if (candidates.length === 0) {
      console.log("[TabMover BG] Só existe uma janela aberta.");
      sendResponse({ status: "no_other_window" });
      return;
    }

    tryMoveToWindow(currentTabId, candidates, 0, sendResponse);
  });

  return true; // Mantém canal aberto para sendResponse assíncrono
});

function tryMoveToWindow(tabId, candidates, index, sendResponse) {
  if (index >= candidates.length) {
    console.log("[TabMover BG] Nenhuma janela compatível encontrada.");
    sendResponse({ status: "no_other_window" });
    return;
  }

  const target = candidates[index];
  console.log("[TabMover BG] Tentando janela:", target.id);

  chrome.tabs.move(tabId, { windowId: target.id, index: -1 }, (movedTab) => {
    if (chrome.runtime.lastError) {
      const msg = chrome.runtime.lastError.message;
      console.warn("[TabMover BG] Janela", target.id, "recusou:", msg);

      // Janela de outro perfil — tenta a próxima
      if (msg.toLowerCase().includes("same profile")) {
        tryMoveToWindow(tabId, candidates, index + 1, sendResponse);
        return;
      }

      sendResponse({ status: "error", detail: msg });
      return;
    }

    chrome.windows.update(target.id, { focused: true }, () => {
      chrome.tabs.update(movedTab.id, { active: true }, () => {
        console.log("[TabMover BG] ✅ Aba movida com sucesso!");
        sendResponse({ status: "ok", targetWindowId: target.id });
      });
    });
  });
}

// Mantém o service worker acordado enquanto há abas abertas
// (evita o problema de MV3 onde o SW dorme e perde mensagens)
chrome.runtime.onInstalled.addListener(() => {
  console.log("[TabMover BG] Extensão instalada/atualizada.");
});
