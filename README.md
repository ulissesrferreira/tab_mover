# Tab Mover

Extensão para Microsoft Edge que move a aba atual para a próxima janela com **duplo clique do botão do meio**.

![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue?logo=googlechrome&logoColor=white)
![Edge](https://img.shields.io/badge/Microsoft_Edge-compatible-0078D7?logo=microsoftedge&logoColor=white)

## Como usar

Com duas ou mais janelas do Edge abertas, dê **duplo clique do botão do meio** (scroll) em qualquer lugar da página — a aba é movida para a próxima janela ciclicamente.

Se não houver outra janela aberta, um toast aparece na página avisando.

## Instalação

1. Abra o Edge e acesse `edge://extensions`
2. Ative o **Modo de desenvolvedor** (canto inferior esquerdo)
3. Clique em **Carregar sem pacote** (Load unpacked)
4. Selecione a pasta desta extensão
5. Pronto — a extensão aparece na lista

## Como funciona

| Arquivo | Responsabilidade |
|---|---|
| `content.js` | Detecta o duplo clique do meio e envia mensagem ao background |
| `background.js` | Service worker MV3 — lista janelas abertas e move a aba via `chrome.tabs.move` |
| `manifest.json` | Configuração da extensão (Manifest V3) |

O `content.js` usa `pointerdown` + `mousedown` com deduplicação para garantir que cada clique físico seja contado uma única vez, mesmo em páginas que interceptam eventos. O botão do meio não ativa auto-scroll durante o duplo clique.

## Desinstalar

Em `edge://extensions`, clique em **Remover** na extensão.
