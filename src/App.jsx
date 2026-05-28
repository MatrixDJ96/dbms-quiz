import React, { useEffect, useMemo, useRef, useState } from 'react';

const RAW_QUESTIONS = [
  ['DBMS','Facile','Quale componente consente a più utenti di lavorare sugli stessi dati riducendo conflitti e inconsistenze?',['Il sistema di gestione della concorrenza del DBMS','Il colore dell’interfaccia','La sola estensione .sql','La normalizzazione automatica del browser'],'Il DBMS gestisce accessi concorrenti tramite transazioni, lock, isolamento e controllo della concorrenza.'],
  ['DBMS','Media','Quale proprietà ACID garantisce che una transazione confermata sopravviva a un crash successivo?',['Durabilità','Atomicità','Isolamento','Minimalità'],'La durabilità assicura che gli effetti di una transazione confermata siano permanenti.'],
  ['DBMS','Difficile','Due transazioni aggiornano lo stesso saldo. Senza isolamento adeguato, una modifica può sovrascrivere l’altra. Che anomalia descrive meglio il caso?',['Lost update','Dipendenza parziale','Violazione della 1FN','Natural join implicito'],'Il lost update avviene quando un aggiornamento concorrente cancella o sovrascrive un altro aggiornamento.'],
  ['DBMS','Infame','Se sostituisci un indice B-tree con una struttura hash senza modificare schema logico né query applicative, quale proprietà stai sfruttando soprattutto?',['Indipendenza fisica dei dati','Integrità referenziale','Normalizzazione in BCNF','Specializzazione IS-A'],'Stai cambiando un dettaglio fisico di accesso, non la struttura logica visibile alle applicazioni.'],
  ['Schema/Istanza','Media','Quale coppia descrive correttamente schema e istanza?',['Schema = struttura; istanza = contenuto in un certo momento','Schema = dati correnti; istanza = vincoli permanenti','Schema e istanza sono sinonimi','Lo schema cambia a ogni INSERT'],'Lo schema è relativamente stabile; l’istanza cambia con inserimenti, modifiche e cancellazioni.'],
  ['Progettazione','Difficile','Correggere una cardinalità da 1:N a N:M perché l’analisi del dominio era errata significa correggere quale livello?',['Concettuale','Fisico','Di indicizzazione','Solo sintattico SQL'],'Le cardinalità descrivono regole del dominio, quindi appartengono al modello concettuale.'],
  ['Progettazione','Infame','Quale elemento puzza di errore se lo trovi in un modello concettuale E-R?',['Indice B-tree sull’attributo Cognome','Entità Studente','Associazione Sostiene tra Studente ed Esame','Cardinalità minima e massima'],'Un indice è una scelta fisica o prestazionale, non concettuale.'],
  ['Modelli logici','Facile','Quale modello logico rappresenta naturalmente strutture padre-figlio ad albero?',['Gerarchico','Relazionale','A oggetti','Colonnare'],'Il modello gerarchico organizza i record in una struttura ad albero.'],
  ['Modelli logici','Difficile','Quale modello NoSQL è concettualmente più vicino a nodi e archi, quindi utile per reti sociali o percorsi?',['Grafo','Chiave-valore puro','File sequenziale','Gerarchico rigido'],'Il modello a grafo rappresenta entità come nodi e relazioni come archi.'],
  ['Modelli logici','Infame','Quale frase è meno sbagliata sul confronto relazionale/NoSQL?',['La scelta dipende da requisiti, coerenza, schema, accessi e scalabilità','NoSQL batte sempre il relazionale','Il relazionale non scala mai','NoSQL impedisce la ridondanza'],'Non esiste un vincitore assoluto: contano carico, modello dati, consistenza e query richieste.'],
  ['E-R','Facile','Nel modello E-R, Studente è entità e “Mario Rossi, matricola 123” è:',['Istanza dell’entità','Attributo composto','Vincolo interrelazionale','Cardinalità massima'],'L’entità è la classe; il singolo oggetto reale rappresentato è un’istanza.'],
  ['E-R','Media','Un attributo derivato è un attributo che:',['Può essere calcolato da altri dati','È sempre chiave primaria','Non ha dominio','È obbligatoriamente multivalore'],'Per esempio l’età può essere derivata dalla data di nascita.'],
  ['E-R','Difficile','Una relazione N:M Iscrizione tra Studente e Corso, con attributo DataIscrizione, nel relazionale diventa tipicamente:',['Tabella associativa con le due foreign key e DataIscrizione','Foreign key in Studente e basta','Foreign key in Corso e basta','Colonna multivalore dentro Studente'],'La tabella ponte rappresenta l’associazione e conserva anche gli attributi propri dell’associazione.'],
  ['E-R','Infame','In una 1:1 Persona-Passaporto, con partecipazione totale di Passaporto e parziale di Persona, dove conviene mettere la FK per minimizzare NULL?',['In Passaporto verso Persona, spesso con UNIQUE','In Persona verso Passaporto, sempre nullable','In entrambe obbligatoriamente','In una tabella ponte sempre necessaria'],'Il lato a partecipazione totale è più naturale: ogni passaporto deve riferire una persona. UNIQUE mantiene l’uno-a-uno.'],
  ['Gerarchie','Infame','In una gerarchia IS-A totale e disgiunta, quale frase è corretta?',['Ogni istanza della superclasse appartiene ad almeno una sottoclasse e al massimo a una','Ogni istanza può appartenere a più sottoclassi','Possono esistere istanze solo nella superclasse','Non si può tradurre in schema relazionale'],'Totale = tutte coperte; disgiunta = non sovrapposte.'],
  ['Relazionale','Facile','Una tupla di una relazione corrisponde di solito a:',['Una riga','Una colonna','Un dominio','Un DBMS'],'Nella rappresentazione tabellare, le tuple sono righe.'],
  ['Relazionale','Media','Il grado di una relazione e la sua cardinalità indicano rispettivamente:',['Numero di attributi e numero di tuple','Numero di tuple e numero di attributi','Numero di chiavi e numero di vincoli','Numero di FK e numero di PK'],'Grado = colonne/attributi; cardinalità = righe/tuple.'],
  ['Relazionale','Difficile','Quale proprietà rende una chiave candidata “minimale”?',['Nessun suo sottoinsieme identifica ancora univocamente le tuple','È sempre composta da un solo attributo','Non può essere usata come primary key','Deve essere una foreign key'],'Se togli un attributo e resta identificante, allora non era minimale.'],
  ['Relazionale','Infame','Una superchiave differisce da una chiave candidata perché:',['Può contenere attributi superflui','Non identifica le tuple','È sempre esterna','È vietata in SQL'],'La chiave candidata è una superchiave minimale; una superchiave può non esserlo.'],
  ['Vincoli','Facile','NOT NULL impedisce:',['L’assenza di valore in un attributo','I duplicati tra righe','Ogni join','La cancellazione della tabella'],'NOT NULL richiede che l’attributo abbia un valore.'],
  ['Vincoli','Difficile','Quale vincolo è interrelazionale?',['Una foreign key tra Ordine.IdCliente e Cliente.IdCliente','CHECK Prezzo > 0','NOT NULL su Cognome','UNIQUE su Email'],'I vincoli referenziali coinvolgono almeno due relazioni.'],
  ['Vincoli','Infame','Se una foreign key è nullable, cosa significa correttamente?',['Il riferimento può essere assente, ma se presente deve essere valido','Il riferimento può puntare a tuple inesistenti','La chiave primaria referenziata può duplicarsi','Il vincolo referenziale è disattivato'],'NULL indica assenza di riferimento; i valori non nulli devono rispettare l’integrità referenziale.'],
  ['Normalizzazione','Facile','La normalizzazione serve principalmente a ridurre:',['Ridondanza e anomalie','Il numero di backup','La necessità di SQL','La presenza di chiavi primarie'],'Normalizzare aiuta a evitare duplicazioni inutili e anomalie operative.'],
  ['Normalizzazione','Difficile','In Esami(Matricola, CodCorso, NomeStudente, TitoloCorso, Voto), con PK(Matricola, CodCorso), NomeStudente dipende solo da Matricola. Che problema è?',['Dipendenza parziale, violazione della 2FN','Dipendenza transitiva, violazione della 3FN','Violazione automatica della 1FN','Violazione di integrità referenziale'],'Un attributo non chiave dipende solo da parte della chiave composta.'],
  ['Normalizzazione','Infame','Se in R(A,B,C) valgono A → B e B → A, puoi concludere che A è superchiave di R?',['No, non necessariamente: dovrebbe determinare anche C','Sì, sempre','Sì, se B è testuale','No, perché le dipendenze inverse sono vietate'],'Per essere superchiave, A deve determinare tutti gli attributi della relazione.'],
  ['Algebra','Facile','σ_{Età > 18}(Studenti) indica:',['Selezione di tuple','Proiezione di colonne','Ridenominazione','Divisione'],'La selezione filtra righe in base a una condizione.'],
  ['Algebra','Media','Nel modello insiemistico, π_Cognome(Studenti) restituisce:',['I cognomi senza duplicati','Le tuple complete','Solo righe con Cognome NULL','Il prodotto cartesiano dei cognomi'],'La proiezione seleziona attributi ed elimina duplicati nel modello insiemistico.'],
  ['Algebra','Infame','Perché il natural join può essere traditore?',['Perché unisce automaticamente attributi con lo stesso nome anche se semanticamente non c’entrano','Perché restituisce sempre il prodotto cartesiano puro','Perché non può mai eliminare colonne duplicate','Perché funziona solo con chiavi artificiali'],'Nomi uguali non garantiscono significati uguali. È una trappola molto reale.'],
  ['SQL','Facile','Quale funzione SQL calcola la media?',['AVG','SUM','COUNT','GROUP'],'AVG restituisce la media dei valori non nulli dell’espressione.'],
  ['SQL','Media','GROUP BY Reparto in una query sui dipendenti crea:',['Un gruppo di righe per ogni reparto','Una tabella fisica per reparto','Un indice per reparto','Una foreign key automatica'],'GROUP BY partiziona le righe in gruppi logici.'],
  ['SQL','Difficile','Per mostrare solo i gruppi con COUNT(*) > 3, quale clausola è corretta?',['HAVING COUNT(*) > 3','WHERE COUNT(*) > 3','FROM COUNT(*) > 3','JOIN COUNT(*) > 3'],'Le condizioni sugli aggregati vanno in HAVING.'],
  ['SQL','Infame','Dopo un LEFT JOIN tra A e B, aggiungere WHERE B.id IS NOT NULL tende a trasformare il risultato in:',['Qualcosa di equivalente a un INNER JOIN per quella condizione','Un FULL OUTER JOIN','Un CROSS JOIN','Una divisione relazionale'],'Elimini le righe preservate dal LEFT JOIN che non avevano match a destra.'],
  ['SQL','Infame','Quale ordine logico descrive meglio una SELECT con aggregazione?',['FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY','SELECT → FROM → HAVING → WHERE → GROUP BY','WHERE → SELECT → GROUP BY → FROM','GROUP BY → FROM → SELECT → WHERE'],'Non è l’ordine sintattico scritto, ma l’ordine logico di valutazione.'],
  ['SQL','Difficile','COUNT(DISTINCT Colonna) conta:',['I valori distinti non nulli della colonna','Tutte le righe incluse quelle nulle','Solo duplicati','Solo chiavi primarie'],'DISTINCT elimina duplicati, COUNT(colonna) ignora NULL.'],
  ['Anomalie','Media','Cancellando l’ultimo studente di un corso perdo anche il nome del corso. È un’anomalia di:',['Cancellazione','Inserimento','Proiezione','Isolamento'],'La cancellazione di una riga distrugge anche informazioni che dovevano restare.'],
  ['Anomalie','Difficile','Ripetere in molte righe il nome del docente associato allo stesso corso espone soprattutto a:',['Anomalia di modifica','Divisione relazionale','Outer join','Indipendenza fisica'],'Se il nome cambia, devi aggiornarlo in più punti, rischiando inconsistenza.']
];

const RAW_EVENTS = [
  ['Bonus','Facile','Bonus: ORDER BY serve a...',['Ordinare il risultato finale','Filtrare gruppi','Creare indici','Imporre 3FN']],
  ['Bonus','Media','Bonus: una N:M si traduce con...',['Tabella ponte','Colonna booleana','Indice','Vista obbligatoria']],
  ['Bonus','Difficile','Bonus: COUNT(DISTINCT X) conta...',['Valori distinti non nulli','Tutte le righe','Solo NULL','Solo duplicati']],
  ['Bonus','Infame','Bonus: A → B e B → A rendono A superchiave di R(A,B,C)?',['No, manca C','Sì sempre','Solo se A è numerico','Solo se C è NULL']],
  ['Malus','Facile','Panic: chi filtra gruppi aggregati?',['HAVING','WHERE','FROM','ORDER BY']],
  ['Malus','Media','Panic: COUNT(colonna) ignora...',['NULL','Tutte le righe','I duplicati sempre','I numeri']],
  ['Malus','Difficile','Malus: WHERE COUNT(*) > 1 è sbagliato perché...',['WHERE arriva prima delle aggregazioni','COUNT non esiste','HAVING filtra righe singole','ORDER BY crea gruppi']],
  ['Malus','Infame','Malus: natural join è rischioso perché...',['Usa automaticamente attributi con stesso nome','Non può usare condizioni','È sempre un full join','Ordina i risultati']]
];

const TOTAL = 25;
const START_HP = 100;
const CONFIG = {
  Facile: { base: 16, event: 10, hp: 4, time: 3, heal: 5 },
  Media: { base: 22, event: 12, hp: 6, time: 4, heal: 7 },
  Difficile: { base: 30, event: 15, hp: 8, time: 6, heal: 10 },
  Infame: { base: 40, event: 18, hp: 10, time: 8, heal: 14 }
};

const QUESTIONS = RAW_QUESTIONS.map(([tag, difficulty, text, options, explanation]) => ({ tag, difficulty, text, options, answer: 0, explanation }));
const EVENTS = RAW_EVENTS.map(([eventType, difficulty, text, options]) => ({ eventType, difficulty, text, options, answer: 0 }));

function shuffle(items) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function wordCount(s = '') { return s.trim().split(' ').filter(Boolean).length; }
function complexity(q) {
  const s = `${q.text} ${q.options.join(' ')}`.toUpperCase();
  return ['PK','FK','NULL','JOIN','WHERE','HAVING','GROUP BY','COUNT','BCNF','1FN','2FN','3FN','N:M','1:N','1:1','→','(',')','>','<','='].reduce((n, t) => n + s.split(t).length - 1, 0);
}
function readingSeconds(q) {
  const w = wordCount(`${q.text} ${q.options.join(' ')}`);
  const extra = { Facile: 2, Media: 4, Difficile: 7, Infame: 10 }[q.difficulty] || 4;
  return Math.max(10, Math.min(48, Math.ceil(w / 2.45 + complexity(q) * 0.8 + extra)));
}
function budgetSeconds(q) {
  const cfg = CONFIG[q.difficulty] || CONFIG.Media;
  return Math.max(34, Math.min(95, Math.round(readingSeconds(q) + cfg.base * 0.45 + wordCount(q.text) / 3)));
}
function hydrate(q) {
  const opts = shuffle(q.options.map((text, i) => ({ text, correct: i === q.answer })));
  return { ...q, opts, read: readingSeconds(q), budget: budgetSeconds(q), wordTotal: wordCount(`${q.text} ${q.options.join(' ')}`), cx: complexity(q) };
}
function makeRun() {
  const plan = { Facile: 4, Media: 7, Difficile: 9, Infame: 5 };
  return shuffle(Object.entries(plan).flatMap(([d, n]) => shuffle(QUESTIONS.filter((q) => q.difficulty === d)).slice(0, n))).slice(0, TOTAL).map(hydrate);
}
function formatTime(s) {
  const x = Math.max(0, Math.ceil(s));
  return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`;
}
function qClass(text) {
  const w = wordCount(text);
  if (w > 28) return 'question-title small';
  if (w > 18) return 'question-title medium';
  return 'question-title';
}

function Background({ intensity }) {
  const ref = useRef(null);
  const intensityRef = useRef(intensity);
  useEffect(() => { intensityRef.current = intensity; }, [intensity]);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let w = 0, h = 0, raf = 0, hue = 180;
    let dots = [];
    function resize() {
      const ratio = window.devicePixelRatio || 1;
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w * ratio; canvas.height = h * ratio;
      canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      dots = Array.from({ length: reduce ? 40 : 110 }, () => ({ x: Math.random() * w, y: Math.random() * h, r: 1 + Math.random() * 3, dx: -0.5 + Math.random(), dy: -0.5 + Math.random(), a: 0.2 + Math.random() * 0.7 }));
      if (reduce) draw();
    }
    function draw() {
      const intensity = intensityRef.current;
      if (!reduce) hue = (hue + 0.2 + intensity * 0.3) % 360;
      ctx.clearRect(0, 0, w, h);
      const g = ctx.createRadialGradient(w * 0.5, h * 0.25, 30, w * 0.5, h * 0.35, w * 0.85);
      g.addColorStop(0, `rgba(120,70,255,${0.22 + intensity * 0.18})`);
      g.addColorStop(0.45, `rgba(0,220,255,${0.08 + intensity * 0.1})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = `rgba(90,130,255,${0.06 + intensity * 0.04})`;
      for (let x = 0; x < w; x += 48) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y < h; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      dots.forEach((p) => {
        if (!reduce) { p.x += p.dx * (1 + intensity * 2); p.y += p.dy * (1 + intensity * 2); }
        if (p.x < -20) p.x = w + 20; if (p.x > w + 20) p.x = -20; if (p.y < -20) p.y = h + 20; if (p.y > h + 20) p.y = -20;
        ctx.beginPath(); ctx.fillStyle = `hsla(${hue},100%,65%,${p.a})`; ctx.shadowBlur = reduce ? 0 : 14; ctx.shadowColor = `hsla(${hue},100%,70%,${p.a})`; ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      });
      ctx.shadowBlur = 0;
      if (!reduce) raf = requestAnimationFrame(draw);
    }
    resize(); window.addEventListener('resize', resize); draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} className="bg-canvas" aria-hidden="true" />;
}

function Stat({ label, value, sub, pct }) {
  return <div className="card stat"><p>{label}</p>{pct !== undefined && <div className="bar"><i style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} /></div>}<strong>{value}</strong>{sub && <small>{sub}</small>}</div>;
}

export default function App() {
  const [phase, setPhase] = useState('intro');
  const [run, setRun] = useState([]);
  const [index, setIndex] = useState(0);
  const [hp, setHp] = useState(START_HP);
  const [time, setTime] = useState(900);
  const [maxTime, setMaxTime] = useState(900);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [malus, setMalus] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [selected, setSelected] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [popup, setPopup] = useState(null);
  const [event, setEvent] = useState(null);
  const [eventTime, setEventTime] = useState(10);
  const [logs, setLogs] = useState([{ id: 0, text: 'Sistema pronto. Premi Inizia.' }]);
  const [mistakes, setMistakes] = useState([]);
  const [sound, setSound] = useState(true);
  const audio = useRef(null);
  const logSeq = useRef(1);
  const popupRef = useRef(null);
  const eventRef = useRef(null);
  const q = run[index];
  const active = phase === 'play';
  const intensity = event ? 1 : hp < 30 ? 0.8 : combo >= 4 ? 0.55 : 0.25;

  const log = (m) => setLogs((x) => [{ id: logSeq.current++, text: m }, ...x].slice(0, 8));
  const beep = (kind) => {
    if (!sound) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!audio.current) audio.current = new AC();
    if (audio.current.state === 'suspended') audio.current.resume();
    const ctx = audio.current;
    const map = { ok: [660, 880, 1320], bad: [180, 120], pick: [520], bonus: [392, 523, 784], panic: [740, 520, 740] };
    (map[kind] || map.pick).forEach((f, n) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = kind === 'bad' || kind === 'panic' ? 'sawtooth' : 'triangle';
      o.frequency.value = f;
      g.gain.value = 0.0001;
      o.connect(g); g.connect(ctx.destination);
      const t = ctx.currentTime + n * 0.08;
      g.gain.exponentialRampToValueAtTime(0.06, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
      o.start(t); o.stop(t + 0.16);
    });
  };
  const heal = (amount, why) => { setHp((h) => Math.min(START_HP, h + amount)); setBonus((b) => b + 1); setScore((s) => s + amount * 6); beep('bonus'); log(`✚ ${why}: +${amount} HP`); };

  const start = () => {
    const r = makeRun();
    const totalTime = r.reduce((s, x) => s + x.budget, 0) + 120;
    setRun(r); setMaxTime(totalTime); setTime(totalTime); setIndex(0); setHp(START_HP); setScore(0); setCombo(0); setCorrect(0); setMalus(0); setBonus(0); setSelected(null); setConfirmed(false); setPopup(null); setEvent(null); setMistakes([]); setLogs([{ id: logSeq.current++, text: 'Run avviata. In bocca al lupo.' }]); setPhase('play'); beep('ok');
  };
  const finish = (reason) => { setPhase('end'); setEvent(null); setPopup(null); log(`☠ ${reason}`); beep('bad'); };

  useEffect(() => {
    if (!active || confirmed || popup || event) return;
    const t = setInterval(() => setTime((x) => Math.max(0, x - 1)), 1000);
    return () => clearInterval(t);
  }, [active, confirmed, popup, event]);
  useEffect(() => { if (active && time <= 0) finish('Tempo esaurito'); }, [time, active]);
  useEffect(() => { if (hp <= 0 && active) finish('Integrità azzerata'); }, [hp, active]);
  useEffect(() => {
    if (!active || event || popup || selected !== null) return;
    const t = setTimeout(() => {
      const e = hydrate(EVENTS[Math.floor(Math.random() * EVENTS.length)]);
      const dur = Math.max(12, Math.min(34, Math.round(readingSeconds(e) + (CONFIG[e.difficulty]?.event || 12) * 0.4)));
      setEvent(e); setEventTime(dur); log(`⚠ ${e.eventType} ${e.difficulty}: ${dur}s`); beep('panic');
    }, 30000 + Math.random() * 20000);
    return () => clearTimeout(t);
  }, [active, event, popup, selected, index]);
  useEffect(() => {
    if (!active || !event) return;
    const t = setInterval(() => setEventTime((x) => Math.max(0, x - 1)), 1000);
    return () => clearInterval(t);
  }, [active, event]);
  useEffect(() => { if (active && event && eventTime <= 0) failEvent('Tempo scaduto', 'Nessuna risposta'); }, [eventTime, active, event]);
  useEffect(() => {
    const h = (ev) => {
      if (!['1','2','3','4','Enter'].includes(ev.key)) return;
      if (popup && ev.key === 'Enter') return closePopup();
      if (event && ['1','2','3','4'].includes(ev.key)) return answerEvent(Number(ev.key) - 1);
      if (q && !confirmed && ['1','2','3','4'].includes(ev.key)) return pick(Number(ev.key) - 1);
      if (q && selected !== null && ev.key === 'Enter') return next();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [q, selected, confirmed, popup, event]);
  useEffect(() => { if (popup) popupRef.current?.focus(); }, [popup]);
  useEffect(() => { if (event) eventRef.current?.focus(); }, [event]);

  const pick = (n) => { if (!q || confirmed) return; setSelected(n); beep('pick'); };
  const confirm = () => {
    const opt = q.opts[selected]; if (!opt) return;
    setConfirmed(true);
    if (opt.correct) {
      const gain = 110 + combo * 22 + Math.floor(time / 30);
      setScore((s) => s + gain); setCorrect((c) => c + 1); setCombo((c) => c + 1); beep('ok'); log(`✔ Corretta: +${gain}`);
      setPopup({ ok: true, title: 'Risposta corretta', picked: opt.text, correct: opt.text, why: q.explanation, impact: `+${gain} punti`, tag: q.tag, diff: q.difficulty, source: 'main' });
      const nextCombo = combo + 1;
      if (nextCombo % 4 === 0) heal(12, 'Bonus combo x4'); else if (Math.random() < 0.22) heal(6, 'Bonus ripristino casuale');
    } else {
      const good = q.opts.find((o) => o.correct)?.text || '';
      setHp((h) => Math.max(0, h - 10)); setTime((t) => Math.max(0, t - 5)); setScore((s) => Math.max(0, s - 45)); setCombo(0); setMalus((m) => m + 1); setMistakes((m) => [...m, { q: q.text, a: good, e: q.explanation }]); beep('bad'); log('✘ Sbagliata: -10 HP / -5s');
      setPopup({ ok: false, title: 'Risposta sbagliata', picked: opt.text, correct: good, why: q.explanation, impact: '-10 HP / -5s / -45 punti', tag: q.tag, diff: q.difficulty, source: 'main' });
    }
  };
  const closePopup = () => {
    if (popup?.source === 'event') return setPopup(null);
    setPopup(null);
    if (index + 1 >= run.length) return finish('Run completata');
    setIndex((x) => x + 1); setSelected(null); setConfirmed(false);
  };
  const next = () => { if (selected === null) return; if (!confirmed) return confirm(); closePopup(); };
  const failEvent = (reason, picked) => {
    const cfg = CONFIG[event?.difficulty] || CONFIG.Media;
    const good = event?.opts.find((o) => o.correct)?.text || '';
    setHp((h) => Math.max(0, h - cfg.hp)); setTime((t) => Math.max(0, t - cfg.time)); setScore((s) => Math.max(0, s - 25 - cfg.hp * 3)); setCombo(0); setMalus((m) => m + 1);
    setPopup({ ok: false, title: `${event?.eventType || 'Evento'} fallito`, picked, correct: good, why: `La risposta corretta era: ${good}.`, impact: `-${cfg.hp} HP / -${cfg.time}s`, tag: event?.eventType || 'Evento', diff: event?.difficulty || 'Media', source: 'event' });
    setEvent(null); beep('bad'); log(`☠ ${reason}: -${cfg.hp} HP / -${cfg.time}s`);
  };
  const answerEvent = (n) => {
    const opt = event.opts[n]; if (!opt) return;
    if (!opt.correct) return failEvent('Evento fallito', opt.text);
    const cfg = CONFIG[event.difficulty] || CONFIG.Media;
    const gain = 75 + cfg.base * 2 + combo * 8;
    setScore((s) => s + gain); beep('ok'); log(`⚡ ${event.eventType} superato: +${gain}`);
    if (event.eventType === 'Bonus') heal(cfg.heal, `Bonus ${event.difficulty}`);
    setPopup({ ok: true, title: `${event.eventType} superato`, picked: opt.text, correct: opt.text, why: `Risposta corretta sull’evento: ${event.text}`, impact: `+${gain} punti`, tag: event.eventType, diff: event.difficulty, source: 'event' });
    setEvent(null);
  };

  const rank = useMemo(() => score >= 3300 && correct >= 18 ? 'S-Rank: DBMS Demon Slayer' : score >= 2400 ? 'A-Rank: molto solido' : score >= 1500 ? 'B-Rank: buono' : score >= 900 ? 'C-Rank: ripasso necessario' : 'D-Rank: il database ti ha normalizzato male', [score, correct]);

  return <div className="app"><Background intensity={intensity} /><div className="scan" aria-hidden="true" />
    <main className="shell">
      <header className="top card"><div><p className="eyebrow">Quiz di maturità · DBMS</p><h1>Maturità DBMS: Chaos Mode</h1></div><div className="actions"><button type="button" aria-pressed={sound} onClick={() => setSound(!sound)}>{sound ? 'Audio ON' : 'Audio OFF'}</button><button type="button" className="primary" onClick={start}>{phase === 'intro' ? 'Inizia' : 'Ricomincia'}</button></div></header>
      <section className="hud"><Stat label="Integrità" value={`${hp} HP`} pct={hp} /><Stat label="Tempo" value={formatTime(time)} pct={(time / maxTime) * 100} /><Stat label="Score" value={score} sub={`Combo ×${combo}`} /><Stat label="Domande" value={`${run.length ? index + 1 : 0}/${TOTAL}`} sub={`OK ${correct} · Malus ${malus} · Bonus ${bonus}`} /></section>
      <section className="grid"><article className="card board">
        {phase === 'intro' && <div className="intro"><h2>Rispondi, sopravvivi, non farti fregare.</h2><p>{TOTAL} domande di difficoltà crescente. Rispondi, gestisci HP e tempo, e occhio agli eventi a sorpresa.</p><button type="button" className="primary big" onClick={start}>Inizia</button></div>}
        {phase === 'play' && q && <><div className="meta"><span>{q.tag}</span><span>{q.difficulty}</span></div><div className="question-box"><h2 className={qClass(q.text)}>{q.text}</h2></div><div className="answers">{q.opts.map((o, n) => <button type="button" key={o.text} disabled={confirmed || !!event} onClick={() => pick(n)} className={(confirmed ? o.correct ? 'ok' : selected === n ? 'bad' : 'dim' : selected === n ? 'sel' : '') + ' answer'}><b>{n + 1}</b><span>{o.text}</span></button>)}</div><div className="hint">{selected === null ? 'Scegli una risposta: tocca o usa i tasti 1-4. Puoi cambiare finché non confermi.' : confirmed ? 'Risultato nel popup, il tempo è in pausa.' : 'Risposta scelta. Conferma per procedere.'}</div><button type="button" className="primary next" disabled={selected === null || !!event} onClick={next}>{selected === null ? 'Scegli' : confirmed ? 'Vedi esito' : 'Conferma'}</button></>}
        {phase === 'end' && <div className="end"><h2>{rank}</h2><div className="summary"><Stat label="Score" value={score} /><Stat label="Corrette" value={correct} /><Stat label="Malus" value={malus} /><Stat label="Bonus" value={bonus} /></div><h3>Errori da ripassare</h3>{mistakes.length ? mistakes.slice(0, 8).map((m, x) => <div className="mistake" key={m.q}><b>{x + 1}. {m.q}</b><p>Corretta: {m.a}</p><small>{m.e}</small></div>) : <p className="good">Nessun errore principale. Mostruoso.</p>}<button type="button" className="primary big" onClick={start}>Nuova partita</button></div>}
      </article><aside><div className="card side"><h3>Battle Log</h3>{logs.map((l) => <p className="log" key={l.id}>{l.text}</p>)}</div><div className="card side"><h3>Regole</h3><p>Errore: -10 HP / -5s</p><p>Eventi: premio o malus variabile</p><p>Spiegazione: tempo in pausa</p><p>Combo ×4: +12 HP</p></div></aside></section>
    </main>
    {event && <div className="overlay panic"><div className="modal" role="dialog" aria-modal="true" aria-label={`Evento ${event.eventType}`} ref={eventRef} tabIndex={-1}><div className="modal-top"><span>{event.eventType} · {event.difficulty}</span><b>{eventTime}s</b></div><div className="question-box"><div className="qtop"><b>Evento rapido</b></div><h2 className={qClass(event.text)}>{event.text}</h2></div><div className="answers">{event.opts.map((o, n) => <button type="button" className="answer" onClick={() => answerEvent(n)} key={o.text}><b>{n + 1}</b><span>{o.text}</span></button>)}</div></div></div>}
    {popup && <div className="overlay"><div className={`modal result ${popup.ok ? 'right' : 'wrong'}`} role="dialog" aria-modal="true" aria-label={popup.title} ref={popupRef} tabIndex={-1}><div className="modal-top"><span>{popup.ok ? 'Giusto' : 'Sbagliato'} · {popup.tag} · {popup.diff}</span><b>{popup.impact}</b></div><h2>{popup.title}</h2><div className="result-grid"><div><small>Hai scelto</small><p>{popup.picked}</p></div>{!popup.ok && <div><small>Corretta</small><p>{popup.correct}</p></div>}<div><small>Perché</small><p>{popup.why}</p></div></div><p className="pause">Tempo in pausa. Premi Invio o continua.</p><button type="button" className="primary" onClick={closePopup}>{popup.source === 'event' ? 'Continua' : index + 1 >= run.length ? 'Termina' : 'Prossima domanda'}</button></div></div>}
  </div>;
}
