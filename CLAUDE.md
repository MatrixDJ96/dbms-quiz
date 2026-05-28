# Maturità DBMS Chaos Mode

> **Per Claude Code**: questo file è caricato a ogni sessione. Tienilo snello (<300 righe).
> Le preferenze personali non condivise vanno in `CLAUDE.local.md` (già in `.claude/.gitignore` via `settings.local.json`; aggiungilo a un `.gitignore` di root se inizializzi git).

## Stack

- Linguaggio: JavaScript (ES modules) + JSX
- Framework: React 19
- Build tool: Vite 7 (`@vitejs/plugin-react`)
- Database / backend: nessuno — app statica interamente client-side
- Package manager: npm
- Test / lint / CI: nessuno configurato

## Architettura

Single-page a **componente unico**: l'intero gioco vive in `src/App.jsx`.

```
index.html       # entry HTML di Vite, monta #root (favicon SVG inline)
vite.config.js   # config Vite: base './' + plugin inline → dist/index.html single-file
src/
├── App.jsx      # TUTTO il gioco: dati domande, logica, timer, canvas, audio, fasi intro/play/end
├── main.jsx     # entrypoint React (createRoot su #root)
└── styles.css   # CSS unico, tokenizzato in :root (Vite lo minifica in build)
```

Stato di gioco gestito solo con `useState` in `App.jsx` (niente store esterno). Tre fasi: `intro` → `play` → `end`. Sottocomponenti interni: `Background` (canvas animato via `requestAnimationFrame`) e `Stat` (card della HUD).

## Gotcha critici — LEGGERE

- ⚠️ **La risposta corretta è SEMPRE la prima opzione** negli array sorgente `RAW_QUESTIONS` / `RAW_EVENTS` (`src/App.jsx`). La trasformazione (`App.jsx:62-63`) fissa `answer: 0` e `shuffle()` (`App.jsx:88`) randomizza solo l'ordine a video. Aggiungendo o modificando una domanda, metti la risposta giusta come **primo** elemento dell'array opzioni, altrimenti il gioco la valuterà come sbagliata senza errori visibili.
- ⚠️ **I tempi sono derivati, non hardcoded**: `complexity()`, `readingSeconds()`, `budgetSeconds()` (`App.jsx:74-86`) calcolano il timer per domanda dalla lunghezza del testo e dalla densità di token tecnici (`PK`, `FK`, `JOIN`, `HAVING`, `→`, ...). Per cambiare il ritmo modifica `CONFIG` (`App.jsx:55-60`) o queste funzioni, non singoli valori sparsi.
- ⚠️ **Composizione fissa della run**: `makeRun()` (`App.jsx:91-94`) pesca `Facile 4, Media 7, Difficile 9, Infame 5` per un totale `TOTAL = 25`. Se per una difficoltà non ci sono abbastanza domande in `RAW_QUESTIONS`, lo `slice()` ne produce silenziosamente meno.
- ⚠️ Le domande principali richiedono il campo **`explanation`**: viene mostrato nel popup di esito e nel riepilogo errori finale. Gli eventi (`RAW_EVENTS`) non lo hanno.

## Comandi

```bash
npm install      # prima esecuzione (node_modules assente di default)
npm run dev      # dev server Vite con HMR
npm run build    # build statica in dist/
npm run preview  # anteprima locale della build
```

## Convenzioni

- **Nessun test automatico**: la verifica è manuale nel browser. Golden path: `Start` → selezione opzione coi tasti `1-4` → `Invio` per confermare e avanzare → fine run; più gli eventi bonus/malus a tempo che compaiono durante il gioco e i timer (countdown principale, spawn evento, countdown evento).
- **Zero dipendenze runtime oltre a React**: canvas e audio sono nativi (Web Audio API). Non introdurre librerie grafiche o audio.
- Testo dell'app in **italiano**, incluse domande e messaggi.

## DA NON fare

- Non aggiungere dipendenze pesanti: l'app è volutamente leggera e condivisibile come `dist/` statica.
- Non editare `dist/` (artefatto di build): modifica sempre la sorgente.
- Non spostare la risposta corretta dalla posizione 0 nelle sorgenti (vedi gotcha sopra).

## Come lavorare qui (per Claude)

- **Verifica nel browser**: avvia `npm run dev` e prova davvero il flusso. Non esistono test su cui appoggiarsi — "compila" non significa "funziona".
- **Plan mode** per modifiche multi-file o al motore di gioco; salta la pianificazione per fix di una riga.
- **Causa, non sintomo**: se un comportamento è rotto, risali alla logica in `App.jsx`, non mascherare il sintomo.

---

*Ultimo aggiornamento: 2026-05-29*
*Prossima revisione: 2026-11-28*
