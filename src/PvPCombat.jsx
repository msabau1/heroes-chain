import React, { useState, useRef, useEffect } from 'react'

const ICON_BASE = "https://game-icons.net/icons/ffffff/000000/1x1"
const ICONS = {
  Archer:     `${ICON_BASE}/lorc/bowman.svg`,
  Cavalier:   `${ICON_BASE}/skoll/mounted-knight.svg`,
  Angel:      `${ICON_BASE}/lorc/angel-wings.svg`,
  Skeleton:   `${ICON_BASE}/lorc/skeleton-inside.svg`,
  Vampire:    `${ICON_BASE}/delapouite/vampire-dracula.svg`,
  BoneDragon: `${ICON_BASE}/delapouite/spiked-dragon-head.svg`,
  Imp:        `${ICON_BASE}/lorc/imp-laugh.svg`,
  Efreet:     `${ICON_BASE}/lorc/daemon-skull.svg`,
  Devil:      `${ICON_BASE}/lorc/diablo-skull.svg`,
}

const STATS = {
  Archer:     { a:6,  d:3,  mn:2,  mx:3,  hp:10,  sp:4,  rng:true,  ab:"none",  sym:"🏹" },
  Cavalier:   { a:15, d:15, mn:15, mx:25, hp:100, sp:7,  rng:false, ab:"joust", sym:"🏇" },
  Angel:      { a:20, d:20, mn:50, mx:50, hp:200, sp:12, rng:false, ab:"hdev",  sym:"👼" },
  Skeleton:   { a:5,  d:4,  mn:1,  mx:3,  hp:6,   sp:4,  rng:false, ab:"none",  sym:"💀" },
  Vampire:    { a:10, d:9,  mn:5,  mx:8,  hp:30,  sp:6,  rng:false, ab:"noret", sym:"🧛" },
  BoneDragon: { a:17, d:15, mn:25, mx:50, hp:150, sp:9,  rng:false, ab:"none",  sym:"🦴" },
  Imp:        { a:2,  d:3,  mn:1,  mx:2,  hp:4,   sp:5,  rng:false, ab:"none",  sym:"😈" },
  Efreet:     { a:16, d:12, mn:16, mx:24, hp:90,  sp:9,  rng:false, ab:"none",  sym:"🔥" },
  Devil:      { a:19, d:21, mn:30, mx:40, hp:160, sp:11, rng:false, ab:"noret", sym:"😈" },
}

const COLS = 5, ROWS = 10
const cheb = (a, b) => Math.max(Math.abs(a.c - b.c), Math.abs(a.r - b.r))

let SID = 0
const mk = (name, cnt, c, r, own) => {
  const s = STATS[name]
  return { id: SID++, name, cnt, orig: cnt, c, r, own, hp: cnt * s.hp, ret: false, mv: 0 }
}

const freshStacks = () => {
  SID = 0
  return [
    mk("Archer",   5, 0, 0, 0), mk("Angel",    1, 2, 0, 0), mk("Cavalier", 2, 4, 0, 0),
    mk("Skeleton", 8, 0, 9, 1), mk("Vampire",  2, 2, 9, 1), mk("BoneDragon",1,4, 9, 1),
  ]
}

const getOrder = (stacks) =>
  [...stacks].filter(s => s.cnt > 0)
    .sort((a, b) => STATS[b.name].sp !== STATS[a.name].sp
      ? STATS[b.name].sp - STATS[a.name].sp : a.own - b.own)
    .map(s => s.id)

const calcDmg = (att, def) => {
  const us = STATS[att.name], ds = STATS[def.name]
  const base = (us.mn + us.mx) / 2
  const f = us.a >= ds.d ? Math.min(4, 1 + .05 * (us.a - ds.d)) : Math.max(.3, 1 - .025 * (ds.d - us.a))
  let d = base * att.cnt * f * (att.cnt / att.orig)
  if (att.name === "Angel" && def.name === "Devil") d *= 1.5
  if (us.ab === "joust" && att.mv > 0) d *= (1 + .05 * att.mv)
  if (us.rng) { const dist = cheb(att, def); if (dist === 1 || dist >= 7) d *= .5 }
  return Math.round(d * 10) / 10
}

const applyDmg = (s, dmg) => {
  const hp = Math.max(0, s.hp - dmg)
  return { ...s, hp, cnt: hp <= 0 ? 0 : Math.max(0, Math.ceil(hp / STATS[s.name].hp)) }
}

const getMoveCells = (stack, stacks) => {
  if (!stack) return []
  const occ = new Set(stacks.filter(s => s.cnt > 0).map(s => `${s.c},${s.r}`))
  const res = []
  for (let c = 0; c < COLS; c++)
    for (let r = 0; r < ROWS; r++) {
      const d = cheb(stack, { c, r })
      if (d > 0 && d <= STATS[stack.name].sp && !occ.has(`${c},${r}`)) res.push({ c, r })
    }
  return res
}

const getAtkTargets = (stack, stacks) => {
  if (!stack) return []
  const enemies = stacks.filter(s => s.own !== stack.own && s.cnt > 0)
  if (STATS[stack.name].rng) return enemies.map(e => e.id)
  return enemies.filter(e => cheb(stack, e) === 1).map(e => e.id)
}

const UnitIcon = ({ name, size = 28, bright = false }) => {
  const [src, setSrc] = useState(ICONS[name])
  const fallback = "data:image/svg+xml," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
    '<text y=".9em" font-size="80">' + (STATS[name]?.sym ?? "?") + '</text></svg>'
  )
  return (
    <img src={src} alt={name} width={size} height={size}
      onError={() => setSrc(fallback)}
      style={{ display: "block", borderRadius: 2, filter: bright ? "brightness(1.3)" : "none" }}
    />
  )
}

const S = {
  wrap:     { background: "#0f1219", color: "#e8d5a0", fontFamily: "Georgia,serif", maxWidth: 420, margin: "0 auto", padding: 8, minHeight: "100vh" },
  header:   { textAlign: "center", paddingBottom: 8, borderBottom: "1px solid #2a2a3a", marginBottom: 8 },
  topBar:   { display: "flex", alignItems: "center", gap: 6, marginBottom: 8 },
  pill:     (active) => ({ flex: 1, background: active ? "#1e2d50" : "#1a2035", border: `1px solid ${active ? "#4070d0" : "#2a3050"}`, borderRadius: 8, padding: "5px 8px" }),
  pillR:    (active) => ({ flex: 1, background: active ? "#2d1e1e" : "#201515", border: `1px solid ${active ? "#d04040" : "#2a1515"}`, borderRadius: 8, padding: "5px 8px" }),
  hpBar:    { height: 3, background: "#1a1a2a", borderRadius: 2, marginBottom: 4 },
  badge:    { background: "#1a1408", border: "1px solid #3a2810", borderRadius: 8, padding: "4px 8px", textAlign: "center", minWidth: 46 },
  activeBar:(own) => ({ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#181820", border: `1px solid ${own===0?"#4060c0":"#c04040"}`, borderRadius: 8, padding: "7px 10px", marginBottom: 8 }),
  gridWrap: { background: "#12141e", border: "1px solid #1e2030", borderRadius: 10, padding: 6, marginBottom: 8 },
  grid:     { display: "grid", gridTemplateColumns: `repeat(${COLS},1fr)`, gap: 3 },
  logBox:   { background: "#0a0c10", border: "1px solid #14161e", borderRadius: 8, padding: "6px 10px", marginBottom: 8 },
  winner:   { background: "#0f0c02", border: "1px solid #907018", borderRadius: 12, padding: 16, textAlign: "center", marginTop: 8 },
}

export default function PvPCombat() {
  const [stacks, setStacks] = useState(freshStacks)
  const [order,  setOrder]  = useState(() => getOrder(freshStacks()))
  const [idx,    setIdx]    = useState(0)
  const [phase,  setPhase]  = useState("select")
  const [log,    setLog]    = useState(["Battle starts! Tap your unit to select."])
  const [winner, setWinner] = useState(null)
  const [flash,  setFlash]  = useState(null)
  const logRef = useRef(null)

  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight }, [log])

  const stacksRef = useRef(stacks)
  const orderRef  = useRef(order)
  const idxRef    = useRef(idx)
  const phaseRef  = useRef(phase)
  useEffect(() => { stacksRef.current = stacks }, [stacks])
  useEffect(() => { orderRef.current  = order  }, [order])
  useEffect(() => { idxRef.current    = idx    }, [idx])
  useEffect(() => { phaseRef.current  = phase  }, [phase])

  const addLog = msg => setLog(p => [...p.slice(-15), msg])

  const activeId    = order[idx % Math.max(1, order.length)]
  const active      = stacks.find(s => s.id === activeId)
  const activeOwner = active?.own ?? 0
  const moveCells   = phase === "move"   ? getMoveCells(active, stacks)  : []
  const atkTargets  = (phase === "attack" || phase === "move") ? getAtkTargets(active, stacks) : []

  const advance = (ns, ord, i) => {
    const p0 = ns.some(s => s.own === 0 && s.cnt > 0)
    const p1 = ns.some(s => s.own === 1 && s.cnt > 0)
    if (!p0 || !p1) {
      const w = !p0 ? 1 : 0
      setWinner(w); setPhase("done"); setStacks(ns)
      setLog(p => [...p.slice(-15), `Player ${w+1} wins!`])
      return
    }
    const next = i + 1
    let fns = ns.map(s => ({ ...s, mv: 0 }))
    let newOrd = ord
    if (next % Math.max(1, ord.length) === 0) {
      fns = fns.map(s => ({ ...s, ret: false }))
      newOrd = getOrder(fns)
      setOrder(newOrd)
      setLog(p => [...p.slice(-15), `Round ${Math.floor(next / Math.max(1, ord.length)) + 2}`])
    }
    setStacks(fns); setIdx(next); setPhase("select")
    const nid = newOrd[next % Math.max(1, newOrd.length)]
    const ns2 = fns.find(s => s.id === nid)
    if (ns2) setLog(p => [...p.slice(-15), `${ns2.name}'s turn`])
  }

  const doAttack = (attId, defId, cs, ord, i) => {
    const att = cs.find(s => s.id === attId), def = cs.find(s => s.id === defId)
    if (!att || !def) return
    const dmg = calcDmg(att, def)
    let nd = applyDmg(def, dmg)
    const k = def.cnt - nd.cnt
    let msg = `${att.name}→${def.name}: ${dmg}dmg${k > 0 ? ` -${k}` : ""}`
    let ns = cs.map(s => s.id === def.id ? nd : s)
    if (STATS[att.name].ab !== "noret" && !STATS[att.name].rng && nd.cnt > 0 && !def.ret) {
      const rd = calcDmg({ ...nd, mv: 0 }, att)
      const na = applyDmg(att, rd)
      msg += ` | ret ${rd}dmg`
      ns = ns.map(s => s.id === att.id ? na : s.id === def.id ? { ...nd, ret: true } : s)
    }
    setLog(p => [...p.slice(-15), msg])
    setFlash(`${def.c},${def.r}`)
    setStacks(ns)
    setTimeout(() => { setFlash(null); advance(ns, ord, i) }, 400)
  }

  const handleCell = (c, r) => {
    const cs = stacksRef.current, ord = orderRef.current
    const i = idxRef.current, ph = phaseRef.current
    if (ph === "done" || ph === "attacking") return
    const aid  = ord[i % Math.max(1, ord.length)]
    const act  = cs.find(s => s.id === aid)
    if (!act) return
    const clicked = cs.find(s => s.c === c && s.r === r && s.cnt > 0)

    if (ph === "select") {
      if (clicked?.id === aid) { setPhase("move"); addLog(`${act.name} selected`) }
      return
    }
    if (ph === "move") {
      const mv = getMoveCells(act, cs)
      if (clicked && clicked.own !== act.own && STATS[act.name].rng && getAtkTargets(act, cs).includes(clicked.id)) {
        setPhase("attacking"); doAttack(aid, clicked.id, cs, ord, i); return
      }
      if (!clicked && mv.some(m => m.c === c && m.r === r)) {
        const dist = cheb(act, { c, r })
        const moved = { ...act, c, r, mv: dist }
        const ns = cs.map(s => s.id === aid ? moved : s)
        setStacks(ns); stacksRef.current = ns
        setFlash(`${c},${r}`); setTimeout(() => setFlash(null), 300)
        addLog(`${act.name}→(${c},${r})`); setPhase("attack"); return
      }
      if (clicked?.id === aid) { setPhase("attack"); return }
      return
    }
    if (ph === "attack") {
      const act2 = cs.find(s => s.id === aid); if (!act2) return
      const targets = getAtkTargets(act2, cs)
      if (clicked && clicked.own !== act2.own && targets.includes(clicked.id)) {
        setPhase("attacking"); doAttack(aid, clicked.id, cs, ord, i); return
      }
      if (!clicked || clicked.own === act2.own) { addLog(`${act2.name} skips`); advance(cs, ord, i) }
    }
  }

  const skipTurn = () => {
    const cs = stacksRef.current, ord = orderRef.current, i = idxRef.current
    const aid = ord[i % Math.max(1, ord.length)]
    const act = cs.find(s => s.id === aid)
    addLog(`${act?.name} skips`); advance(cs, ord, i)
  }

  const reset = () => {
    SID = 0; const s = freshStacks()
    setStacks(s); setOrder(getOrder(s)); setIdx(0); setPhase("select")
    setLog(["Battle starts! Tap your unit to select."])
    setWinner(null); setFlash(null)
  }

  const stackAt = (c, r) => stacks.find(s => s.c === c && s.r === r && s.cnt > 0)
  const p0 = stacks.filter(s => s.own === 0), p1 = stacks.filter(s => s.own === 1)
  const hp0 = p0.reduce((a, s) => a + s.hp, 0), mhp0 = p0.reduce((a, s) => a + s.orig * STATS[s.name].hp, 0)
  const hp1 = p1.reduce((a, s) => a + s.hp, 0), mhp1 = p1.reduce((a, s) => a + s.orig * STATS[s.name].hp, 0)
  const round = Math.floor(idx / Math.max(1, order.length)) + 1
  const hint = phase === "select" ? `Tap ${active?.name ?? "your unit"} to select`
    : phase === "move" ? "Tap green cell to move · tap self to skip move"
    : phase === "attack" ? "Tap enemy to attack · tap empty to skip" : ""

  const unitRow = (s, right) => (
    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2, flexDirection: right ? "row-reverse" : "row", opacity: s.cnt > 0 ? 1 : .35, background: s.id === activeId ? `rgba(${right?"180,60,60":"60,100,180"},.2)` : "transparent", borderRadius: 4, padding: "2px 3px" }}>
      <UnitIcon name={s.name} size={16} bright={s.id === activeId} />
      <div>
        <div style={{ fontSize: 10, lineHeight: 1, color: s.id === activeId ? (right ? "#ffb090" : "#90c0ff") : (right ? "#b09080" : "#8090b0"), textAlign: right ? "right" : "left" }}>{s.name}</div>
        <div style={{ fontSize: 9, color: "#506080" }}>{s.cnt > 0 ? `${s.cnt}·${s.hp}hp` : "☠"}</div>
      </div>
    </div>
  )

  return (
    <div style={S.wrap}>
      {/* Title */}
      <div style={S.header}>
        <div style={{ fontSize: 10, letterSpacing: 3, color: "#6a5020", textTransform: "uppercase" }}>Tactical Combat</div>
        <div style={{ fontSize: 16, fontWeight: "bold", color: "#d0a030" }}>⚔ Heroes of the Chain ⚔</div>
      </div>

      {/* Top bar */}
      <div style={S.topBar}>
        <div style={S.pill(activeOwner === 0 && !winner)}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: "#6080a0", textTransform: "uppercase", marginBottom: 2 }}>{activeOwner === 0 && !winner ? "▶ CASTLE" : "CASTLE"}</div>
          <div style={S.hpBar}><div style={{ height: "100%", borderRadius: 2, background: "#4090e0", width: `${mhp0 ? (hp0/mhp0)*100 : 0}%`, transition: "width .4s" }} /></div>
          {p0.map(s => unitRow(s, false))}
        </div>

        <div style={S.badge}>
          <div style={{ fontSize: 8, color: "#5a3a10", letterSpacing: 1, textTransform: "uppercase" }}>Rnd</div>
          <div style={{ fontSize: 20, color: "#d0a030", lineHeight: 1 }}>{round}</div>
          {!winner && <div style={{ fontSize: 9, marginTop: 2, color: phase === "move" ? "#50b050" : phase === "attack" ? "#c06050" : "#a09040" }}>{phase === "select" ? "SEL" : phase === "move" ? "MOV" : "ATK"}</div>}
        </div>

        <div style={S.pillR(activeOwner === 1 && !winner)}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: "#a06060", textTransform: "uppercase", marginBottom: 2, textAlign: "right" }}>{activeOwner === 1 && !winner ? "NECRO ◀" : "NECRO"}</div>
          <div style={S.hpBar}><div style={{ height: "100%", borderRadius: 2, background: "#d04040", width: `${mhp1 ? (hp1/mhp1)*100 : 0}%`, transition: "width .4s", marginLeft: "auto" }} /></div>
          {p1.map(s => unitRow(s, true))}
        </div>
      </div>

      {/* Active unit bar */}
      {active && !winner && (
        <div style={S.activeBar(activeOwner)}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <UnitIcon name={active.name} size={28} bright />
            <div>
              <div style={{ fontSize: 13, fontWeight: "bold", color: activeOwner === 0 ? "#90b0ff" : "#ff9070" }}>
                {active.name} <span style={{ fontSize: 9, color: "#504030" }}>P{activeOwner+1}</span>
              </div>
              <div style={{ fontSize: 10, color: "#505060" }}>{active.cnt}u · {active.hp}hp · SPD{STATS[active.name].sp} · {STATS[active.name].rng ? "Ranged" : "Melee"}</div>
            </div>
          </div>
          {phase !== "select" && <button onClick={skipTurn} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "1px solid #3a3020", background: "#1a1408", color: "#a08030", cursor: "pointer", fontFamily: "inherit" }}>Skip ⏭</button>}
        </div>
      )}

      {/* Grid — 5×10 portrait */}
      <div style={S.gridWrap}>
        <div style={S.grid}>
          {Array.from({ length: ROWS }, (_, r) =>
            Array.from({ length: COLS }, (_, c) => {
              const st      = stackAt(c, r)
              const isMv    = moveCells.some(m => m.c === c && m.r === r) && !st
              const isAtk   = st && atkTargets.includes(st.id)
              const isAct   = st?.id === activeId
              const isFlsh  = flash === `${c},${r}`
              const p1side  = r < 5
              let bg     = p1side ? "#12182a" : "#1e1212"
              let border = p1side ? "#1e2840" : "#2a1e1e"
              let shadow = "none"
              if (isMv)   { bg = "#0f2a0f"; border = "#2a6a2a" }
              if (isAtk)  { bg = "#2a0f0f"; border = "#8a2020" }
              if (isAct)  { bg = st.own===0?"#1a2d6a":"#6a1a1a"; border = st.own===0?"#4070e0":"#e04040"; shadow = `0 0 0 2px ${st.own===0?"#4070e0":"#e04040"}` }
              if (isFlsh) { bg = "#3a2a00"; border = "#c09000" }
              const clickable = !winner && (isMv || isAtk || isAct || (phase==="select" && st?.id===activeId) || (phase==="attack" && st && st.own!==activeOwner))
              const pct = st ? Math.max(4, (st.hp / (st.orig * STATS[st.name].hp)) * 100) : 0
              const hpCol = st ? (st.hp/(st.orig*STATS[st.name].hp) > .5 ? "#28a828" : st.hp/(st.orig*STATS[st.name].hp) > .25 ? "#b88000" : "#cc2020") : ""
              return (
                <div key={`${c},${r}`} onClick={() => handleCell(c, r)}
                  style={{ aspectRatio:"1", minHeight: 52, background: bg, border: `1px solid ${border}`, borderRadius: 5, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", cursor: clickable ? "pointer" : "default", transition: "background .1s,border .1s", boxShadow: shadow }}>
                  <span style={{ position:"absolute", top:1, left:2, fontSize:6, color:"rgba(255,255,255,.12)", lineHeight:1, pointerEvents:"none" }}>{c},{r}</span>
                  {isMv && <div style={{ width:8, height:8, borderRadius:"50%", background:"#2a8a2a" }} />}
                  {st && <>
                    <UnitIcon name={st.name} size={isAct ? 36 : 30} bright={isAct} />
                    <span style={{ position:"absolute", top:1, right:2, fontSize:10, fontWeight:"bold", color: st.own===0?"#6090e0":"#e06060", textShadow:"0 1px 3px #000" }}>{st.cnt}</span>
                    <div style={{ position:"absolute", bottom:2, left:2, right:2, height:3, background:"rgba(0,0,0,.5)", borderRadius:2, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${pct}%`, background:hpCol, borderRadius:2, transition:"width .3s" }} />
                    </div>
                    {isAtk && <span style={{ position:"absolute", top:1, left:2, fontSize:9, color:"#ff5050" }}>⚔</span>}
                  </>}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Hint */}
      {!winner && <div style={{ textAlign:"center", fontSize:11, color:"#4a4a60", fontStyle:"italic", marginBottom:6 }}>{hint}</div>}

      {/* Log */}
      <div style={S.logBox}>
        <div style={{ fontSize:8, color:"#2a2a20", letterSpacing:3, textTransform:"uppercase", marginBottom:3 }}>Battle Log</div>
        <div ref={logRef} style={{ maxHeight:72, overflowY:"auto", fontSize:11, lineHeight:1.7 }}>
          {log.map((e, i) => (
            <div key={i} style={{ color: e.includes("→")?"#c08050":e.includes("wins")?"#d0a020":e.includes("Round")?"#353550":"#605840", borderBottom:"1px solid rgba(255,255,255,.02)" }}>{e}</div>
          ))}
        </div>
      </div>

      {/* Winner */}
      {winner !== null && (
        <div style={S.winner}>
          <div style={{ fontSize:28, marginBottom:6 }}>🏆</div>
          <div style={{ fontSize:16, fontWeight:"bold", color:"#d0a030", marginBottom:4 }}>{winner===0?"Castle Triumphant":"Necropolis Victorious"}</div>
          <div style={{ fontSize:11, color:"#6a5020", marginBottom:12 }}>Player {winner+1} wins</div>
          <button onClick={reset} style={{ background:"#402800", border:"1px solid #b07018", borderRadius:8, color:"#e0b030", fontSize:12, padding:"8px 20px", cursor:"pointer", fontFamily:"inherit" }}>⚔ New Battle</button>
        </div>
      )}
    </div>
  )
}
