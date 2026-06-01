// Tab Mover — background.js (Service Worker MV3)

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action !== "moveTabToNextWindow") return false;

  const currentTabId  = sender.tab?.id;
  const currentWinId  = sender.tab?.windowId;

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

    // Ordena as janelas por ID para ter uma ordem previsível
    const sorted = [...windows].sort((a, b) => a.id - b.id);

    if (sorted.length < 2) {
      console.log("[TabMover BG] Só existe uma janela aberta.");
      sendResponse({ status: "no_other_window" });
      return;
    }

    // Encontra o índice da janela atual e pega a próxima (ciclicamente)
    const currentIdx = sorted.findIndex(w => w.id === currentWinId);
    const nextIdx    = (currentIdx + 1) % sorted.length;
    const target     = sorted[nextIdx];

    console.log("[TabMover BG] Movendo para janela:", target.id, "(índice", nextIdx, ")");

    chrome.tabs.move(currentTabId, { windowId: target.id, index: -1 }, (movedTab) => {
      if (chrome.runtime.lastError) {
        console.error("[TabMover BG] Erro ao mover:", chrome.runtime.lastError.message);
        sendResponse({ status: "error", detail: chrome.runtime.lastError.message });
        return;
      }

      // Foca a janela destino e ativa a aba
      chrome.windows.update(target.id, { focused: true }, () => {
        chrome.tabs.update(movedTab.id, { active: true }, () => {
          console.log("[TabMover BG] ✅ Aba movida com sucesso!");
          sendResponse({ status: "ok", targetWindowId: target.id });
        });
      });
    });
  });

  return true; // Mantém canal aberto para sendResponse assíncrono
});

// Mantém o service worker acordado enquanto há abas abertas
// (evita o problema de MV3 onde o SW dorme e perde mensagens)
chrome.runtime.onInstalled.addListener(() => {
  console.log("[TabMover BG] Extensão instalada/atualizada.");
});
