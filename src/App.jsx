import React, { useEffect, useMemo, useRef, useState } from 'react';
import { RAW_QUESTIONS, RAW_EVENTS } from './questions';

const TOTAL = 30;
const START_HP = 100;
const CONFIG = {
  Facile: { base: 16, event: 10, hp: 4, time: 3, heal: 5 },
  Media: { base: 22, event: 12, hp: 6, time: 4, heal: 7 },
  Difficile: { base: 30, event: 15, hp: 8, time: 6, heal: 10 },
  Infame: { base: 40, event: 18, hp: 10, time: 8, heal: 14 }
};

const QUESTIONS = RAW_QUESTIONS.map(([tag, difficulty, text, options, explanation]) => ({ tag, difficulty, text, options, answer: 0, explanation }));
const EVENTS = RAW_EVENTS.map(([eventType, difficulty, text, options, explanation]) => ({ eventType, difficulty, text, options, answer: 0, explanation }));

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
  const plan = { Facile: 6, Media: 7, Difficile: 9, Infame: 8 };
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
  const boardRef = useRef(null);
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
  useEffect(() => { if (phase === 'play' && window.matchMedia('(max-width: 980px)').matches) boardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, [phase]);

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
    setPopup({ ok: false, title: `${event?.eventType || 'Evento'} fallito`, picked, correct: good, why: event?.explanation || `La risposta corretta era: ${good}.`, impact: `-${cfg.hp} HP / -${cfg.time}s`, tag: event?.eventType || 'Evento', diff: event?.difficulty || 'Media', source: 'event' });
    setEvent(null); beep('bad'); log(`☠ ${reason}: -${cfg.hp} HP / -${cfg.time}s`);
  };
  const answerEvent = (n) => {
    const opt = event.opts[n]; if (!opt) return;
    if (!opt.correct) return failEvent('Evento fallito', opt.text);
    const cfg = CONFIG[event.difficulty] || CONFIG.Media;
    const gain = 75 + cfg.base * 2 + combo * 8;
    setScore((s) => s + gain); beep('ok'); log(`⚡ ${event.eventType} superato: +${gain}`);
    if (event.eventType === 'Bonus') heal(cfg.heal, `Bonus ${event.difficulty}`);
    setPopup({ ok: true, title: `${event.eventType} superato`, picked: opt.text, correct: opt.text, why: event.explanation, impact: `+${gain} punti`, tag: event.eventType, diff: event.difficulty, source: 'event' });
    setEvent(null);
  };

  const rank = useMemo(() => score >= 3300 && correct >= 18 ? 'S-Rank: DBMS Demon Slayer' : score >= 2400 ? 'A-Rank: molto solido' : score >= 1500 ? 'B-Rank: buono' : score >= 900 ? 'C-Rank: ripasso necessario' : 'D-Rank: il database ti ha normalizzato male', [score, correct]);

  return <div className="app"><Background intensity={intensity} /><div className="scan" aria-hidden="true" />
    <main className="shell">
      <header className="top card"><div><p className="eyebrow">Sfida a tempo</p><h1>Quiz DBMS</h1></div><div className="actions"><button type="button" aria-pressed={sound} onClick={() => setSound(!sound)}>{sound ? 'Audio ON' : 'Audio OFF'}</button><button type="button" className="primary" onClick={start}>{phase === 'intro' ? 'Inizia' : 'Ricomincia'}</button></div></header>
      <section className="hud"><Stat label="Integrità" value={`${hp} HP`} pct={hp} /><Stat label="Tempo" value={formatTime(time)} pct={(time / maxTime) * 100} /><Stat label="Score" value={score} sub={`Combo ×${combo}`} /><Stat label="Domande" value={`${run.length ? index + 1 : 0}/${TOTAL}`} sub={`OK ${correct} · Malus ${malus} · Bonus ${bonus}`} /></section>
      <section className="grid"><article className="card board" ref={boardRef}>
        {phase === 'intro' && <div className="intro"><h2>Rispondi, sopravvivi, non farti fregare.</h2><p>{TOTAL} domande di difficoltà crescente. Rispondi, gestisci HP e tempo, e occhio agli eventi a sorpresa.</p><button type="button" className="primary big" onClick={start}>Inizia</button></div>}
        {phase === 'play' && q && <><div className="meta"><span>{q.tag}</span><span>{q.difficulty}</span></div><div className="question-box"><h2 className={qClass(q.text)}>{q.text}</h2></div><div className="answers">{q.opts.map((o, n) => <button type="button" key={o.text} disabled={confirmed || !!event} onClick={() => pick(n)} className={(confirmed ? o.correct ? 'ok' : selected === n ? 'bad' : 'dim' : selected === n ? 'sel' : '') + ' answer'}><b>{n + 1}</b><span>{o.text}</span></button>)}</div><div className="hint">{selected === null ? 'Scegli una risposta: tocca o usa i tasti 1-4. Puoi cambiare finché non confermi.' : confirmed ? 'Risultato nel popup, il tempo è in pausa.' : 'Risposta scelta. Conferma per procedere.'}</div><button type="button" className="primary next" disabled={selected === null || !!event} onClick={next}>{selected === null ? 'Scegli' : confirmed ? 'Vedi esito' : 'Conferma'}</button></>}
        {phase === 'end' && <div className="end"><h2>{rank}</h2><div className="summary"><Stat label="Score" value={score} /><Stat label="Corrette" value={correct} /><Stat label="Malus" value={malus} /><Stat label="Bonus" value={bonus} /></div><h3>Errori da ripassare</h3>{mistakes.length ? mistakes.slice(0, 8).map((m, x) => <div className="mistake" key={m.q}><b>{x + 1}. {m.q}</b><p>Corretta: {m.a}</p><small>{m.e}</small></div>) : <p className="good">Nessun errore principale. Mostruoso.</p>}<button type="button" className="primary big" onClick={start}>Nuova partita</button></div>}
      </article><aside><div className="card side"><h3>Battle Log</h3>{logs.map((l) => <p className="log" key={l.id}>{l.text}</p>)}</div><div className="card side"><h3>Regole</h3><p>Errore: -10 HP / -5s</p><p>Eventi: premio o malus variabile</p><p>Spiegazione: tempo in pausa</p><p>Combo ×4: +12 HP</p></div></aside></section>
    </main>
    {event && <div className="overlay panic"><div className="modal" role="dialog" aria-modal="true" aria-label={`Evento ${event.eventType}`} ref={eventRef} tabIndex={-1}><div className="modal-top"><span>{event.eventType} · {event.difficulty}</span><b>{eventTime}s</b></div><div className="question-box"><div className="qtop"><b>Evento rapido</b></div><h2 className={qClass(event.text)}>{event.text}</h2></div><div className="answers">{event.opts.map((o, n) => <button type="button" className="answer" onClick={() => answerEvent(n)} key={o.text}><b>{n + 1}</b><span>{o.text}</span></button>)}</div></div></div>}
    {popup && <div className="overlay"><div className={`modal result ${popup.ok ? 'right' : 'wrong'}`} role="dialog" aria-modal="true" aria-label={popup.title} ref={popupRef} tabIndex={-1}><div className="modal-top"><span>{popup.ok ? 'Giusto' : 'Sbagliato'} · {popup.tag} · {popup.diff}</span><b>{popup.impact}</b></div><h2>{popup.title}</h2><div className="result-grid"><div><small>Hai scelto</small><p>{popup.picked}</p></div>{!popup.ok && <div><small>Corretta</small><p>{popup.correct}</p></div>}<div><small>Perché</small><p>{popup.why}</p></div></div><p className="pause">Tempo in pausa. Premi Invio o continua.</p><button type="button" className="primary" onClick={closePopup}>{popup.source === 'event' ? 'Continua' : index + 1 >= run.length ? 'Termina' : 'Prossima domanda'}</button></div></div>}
  </div>;
}
