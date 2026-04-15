import React, { useState, useMemo, useCallback } from "react";
import { makeXLSX } from "./utils/xlsx";
import { calcular } from "./utils/calcularObra";
import HipotecaSim from "./components/HipotecaSim";

/* ═══════════════════════════════════════════════════════════
   XLSX GENERATOR — pure JS, zero deps
   ═══════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════
   MOTOR — calcula flujo de caja mes a mes
   ═══════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════
   SIMULADOR DE HIPOTECA — componente independiente
   ═══════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════
   APP
   ═══════════════════════════════════════════════════════════ */
export default function App() {
  const [p, setP] = useState({
    ahorros: 160000, hipotecaSuelo: 67000, hipoteca: 500000, tipoInteres: 2.2,
    primeraDisposicion: 50000, reservaBanco: 75000, presupuestoReal: 450000,
    presupuestoDeclarado: 535000, duracion: 12, numCerts: 12,
    gastosHipoteca: 10000, gastosBroker: 5000, arquitecto: 12000,
    adelantoConstructor: 12500, cocina: 20000, bano: 5000,
    imprevistos: 45000, ahorroMensual: 3000, alquiler: 1100, ingresos: 7000,
    seguroHombre: 5400, seguroMujer: 6500, seguroTotal: 11900,
    plazoSeguroMeses: 72, retencionConstructorPct: 5,
  });

  const set = useCallback((k, v) => {
    setP(prev => {
      const next = { ...prev, [k]: v };
      if (k === "seguroHombre" || k === "seguroMujer")
        next.seguroTotal = (k === "seguroHombre" ? v : prev.seguroHombre) + (k === "seguroMujer" ? v : prev.seguroMujer);
      if (k === "presupuestoReal") next.imprevistos = Math.round(v * 0.1);
      return next;
    });
  }, []);

  const data = useMemo(() => calcular({ ...p, tipoInteres: p.tipoInteres / 100 }), [p]);

  const [tab, setTab] = useState("params");
  const [sel, setSel] = useState(null);
  const [expR, setExpR] = useState(null);

  const fm = n => Math.round(n).toLocaleString("es-ES") + " €";
  const fi = n => Math.round(n).toLocaleString("es-ES");
  const maxS = Math.max(1, ...data.filas.map(m => Math.max(0, m.saldo)));

  const doExcel = () => {
    const s1 = [["HIPOTECA AUTOPROMOCIÓN"], [], ["Parámetro", "Valor"],
      ...Object.entries({
        "Ahorros": p.ahorros, "Cancel. suelo": p.hipotecaSuelo, "Fondos netos": data.fondosNetos,
        "Hipoteca": p.hipoteca, "Tipo interés": p.tipoInteres + "%", "1ª disposición": p.primeraDisposicion,
        "Reserva 15%": p.reservaBanco, "Presup. real": p.presupuestoReal, "Declarado": p.presupuestoDeclarado,
        "Duración": p.duracion, "Certs": p.numCerts, "Gastos hipo": p.gastosHipoteca,
        "Broker": p.gastosBroker, "Arquitecto": p.arquitecto, "Adelanto": p.adelantoConstructor,
        "Cocina": p.cocina, "Baño": p.bano, "Imprevistos": p.imprevistos,
        "Ahorro/mes": p.ahorroMensual, "Seguro": p.seguroTotal,
        "Cuota post": Math.round(data.cuotaHipo), "Gap": Math.round(data.gap),
      }).map(([k, v]) => [k, v])
    ];
    const hd = ["Periodo", "Entradas", "Salidas", "Saldo", "Dispuesto", "Int.Acum", "Constr.", "Imprev.", "Alertas"];
    const s2 = [["FLUJO DE CAJA"], [], hd, ...data.filas.map(r => [
      r.mes, Math.round(r.ent.reduce((s, e) => s + e[1], 0)), Math.round(r.sal.reduce((s, e) => s + e[1], 0)),
      Math.round(r.saldo), Math.round(r.capDisp), Math.round(r.intAcum), Math.round(r.pagConst), Math.round(r.impAcum), r.alertas.join(" ")
    ])];
    const s3 = [["DETALLE"], []];
    data.filas.forEach(r => {
      s3.push([r.mes, "", "", "Saldo: " + Math.round(r.saldo)]);
      r.ent.forEach(e => s3.push(["", "▲ " + e[0], Math.round(e[1])]));
      r.sal.forEach(e => s3.push(["", "▼ " + e[0], Math.round(e[1])]));
      s3.push([]);
    });
    const blob = makeXLSX([{ name: "Resumen", rows: s1 }, { name: "Flujo", rows: s2 }, { name: "Detalle", rows: s3 }]);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `hipoteca_${p.duracion}m_${p.numCerts}c.xlsx`;
    a.click();
  };

  // ── Input component ──
  const Inp = ({ label, k, suffix = "€", min = 0, step = 100 }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #1e293b", gap: "12px" }}>
      <label style={{ color: "#94a3b8", fontSize: "13px", flex: 1, minWidth: 0 }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
        <input type="number" value={p[k]} min={min} step={step}
          onChange={e => set(k, Number(e.target.value))}
          style={{ width: "110px", background: "#0f172a", border: "1px solid #334155", borderRadius: "4px", color: "#f59e0b", padding: "6px 10px", fontSize: "14px", fontFamily: "inherit", textAlign: "right" }} />
        <span style={{ color: "#475569", fontSize: "12px", width: "24px" }}>{suffix}</span>
      </div>
    </div>
  );

  // ── Styles ──
  const card = { background: "linear-gradient(135deg,#0f172a,#1e293b)", border: "1px solid #334155", borderRadius: "10px", padding: "20px" };
  const lbl = { color: "#94a3b8", fontSize: "13px" };

  const Row = ({ items }) => items.map((r, i) => (
    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "13px" }}>
      <span style={lbl}>{r[0]}</span>
      <span style={{ textAlign: "right", fontWeight: r[2] ? 600 : 400, ...(r[2] || {}) }}>{r[1]}</span>
    </div>
  ));

  const tabsDef = [
    { id: "params", l: "⚙️ Parámetros" }, { id: "resumen", l: "📊 Resumen" },
    { id: "flujo", l: "💰 Flujo de Caja" }, { id: "riesgos", l: "⚠️ Riesgos" },
    { id: "gap", l: "🚨 Gap 15/5%" }, { id: "post", l: "🏠 Post-obra" },
    { id: "hipoteca", l: "🏦 Simulador Hipoteca" },
  ];

  const riesgos = [
    { n: "CRÍTICO", c: "#ef4444", t: `Gap: banco ${fm(p.reservaBanco)} vs constructor ${fm(data.retencionConst)}`, d: `Diferencia de ${fm(data.gap)}. Si el constructor presiona antes del CFO o el banco tarda en liberar, necesitas puente.`, s: "Negociar retención 10-15% con constructor. Que CFO sea inmediato. Banco libere en 24-48h. Preparar puente." },
    { n: "ALTO", c: "#f97316", t: `Presupuesto ${fi(p.presupuestoDeclarado)}€ vs real ${fi(p.presupuestoReal)}€`, d: "Diferencia de " + fi(p.presupuestoDeclarado - p.presupuestoReal) + "€. Certificaciones deben cuadrar.", s: "Coordinar con arquitecto. Incluir extras en certs si posible." },
    { n: "ALTO", c: "#f97316", t: `Pico gasto: cocina (${fm(p.cocina)}) + baño (${fm(p.bano)}) = ${fm(p.cocina + p.bano)}`, d: `Fuera presupuesto constructor. Sale 100% de tu bolsillo. Mes cocina: ${data.mesCocina}, mes baño: ${data.mesBano}.`, s: "Verificar saldo esos meses. Negociar plazos con proveedores." },
    { n: "MEDIO", c: "#eab308", t: `Imprevistos: ${fm(p.imprevistos)} distribuidos meses ${data.mesInicioImprev}-${p.duracion}`, d: `${fm(data.imprevMes)}/mes × ${data.mesesImprev} meses. Sin colchón adicional si se superan.`, s: "Monitorizar mes a mes. Plan B: línea de crédito." },
    { n: "MEDIO", c: "#eab308", t: `Seguro prima única ~${fm(p.seguroTotal)} (${Math.round(data.cuotaSeg)}€/mes × ${p.plazoSeguroMeses}m)`, d: "Seguros bancarios suelen ser 30-50% más caros que mercado.", s: "Desistir en 30 días y contratar fuera si compensa." },
  ];

  return (
    <div style={{ fontFamily: "-apple-system, 'SF Mono', 'Fira Code', 'Cascadia Code', monospace", background: "#020617", color: "#e2e8f0", minHeight: "100vh", padding: "20px", boxSizing: "border-box" }}>
      {/* Print styles */}
      <style>{`
        * { box-sizing: border-box; }
        @media print {
          body { background: white !important; color: black !important; font-size: 10pt !important; }
          .no-print { display: none !important; }
          .print-section { display: block !important; }
          * { color: black !important; background: white !important; border-color: #999 !important; }
          table { border-collapse: collapse; width: 100%; } th, td { border: 1px solid #ccc; padding: 4px 6px; font-size: 9pt; }
          th { background: #eee !important; font-weight: bold; }
          @page { margin: 1.5cm; size: A4 landscape; }
        }
        @media screen { .print-section { display: none; } }
      `}</style>

      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0 }}>Hipoteca Autopromoción</h1>
            <p style={{ color: "#64748b", fontSize: "13px", margin: "4px 0 0" }}>
              {fi(p.hipoteca)}€ · {p.tipoInteres}% fijo · 30 años · Obra {fi(p.presupuestoReal)}€ · {p.duracion} meses · {p.numCerts} certificaciones
            </p>
          </div>
          <div className="no-print" style={{ display: "flex", gap: "8px" }}>
            <button onClick={doExcel} style={{ padding: "8px 18px", background: "#166534", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontFamily: "inherit", fontWeight: 600 }}>📥 Excel</button>
            <button onClick={() => window.print()} style={{ padding: "8px 18px", background: "#1e3a5f", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontFamily: "inherit", fontWeight: 600 }}>🖨 PDF (B/N)</button>
          </div>
        </div>

        {/* TABS */}
        <div className="no-print" style={{ display: "flex", gap: "4px", marginBottom: "20px", overflowX: "auto", paddingBottom: "4px" }}>
          {tabsDef.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setSel(null); setExpR(null); }}
              style={{ padding: "9px 16px", background: tab === t.id ? "#1e293b" : "transparent", color: tab === t.id ? "#f8fafc" : "#64748b", border: tab === t.id ? "1px solid #475569" : "1px solid transparent", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontFamily: "inherit", fontWeight: tab === t.id ? 600 : 400, whiteSpace: "nowrap" }}>
              {t.l}
            </button>
          ))}
        </div>

        {/* ══ PRINT SECTION ══ */}
        <div className="print-section">
          <h2>Resumen — {p.duracion} meses, {p.numCerts} certificaciones</h2>
          <table><tbody>
            {[["Ahorros", fm(p.ahorros)], ["Cancel. suelo", fm(p.hipotecaSuelo)], ["Fondos netos", fm(data.fondosNetos)], ["Hipoteca", fm(p.hipoteca)], ["Tipo", p.tipoInteres + "%"], ["1ª disp.", fm(p.primeraDisposicion)], ["Reserva 15%", fm(p.reservaBanco)], ["Presup. real", fm(p.presupuestoReal)], ["Declarado", fm(p.presupuestoDeclarado)], ["Imprevistos", fm(p.imprevistos)], ["Seguro", fm(p.seguroTotal)], ["Ahorro/mes", fm(p.ahorroMensual)], ["Cuota post", fm(data.cuotaHipo)], ["Gap", fm(data.gap)]].map(([l, v], i) => <tr key={i}><td style={{ fontWeight: 600 }}>{l}</td><td>{v}</td></tr>)}
          </tbody></table>
          <h2 style={{ marginTop: "16px" }}>Flujo de Caja</h2>
          <table>
            <thead><tr><th>Periodo</th><th>Entradas</th><th>Salidas</th><th>Saldo</th><th>Dispuesto</th><th>Constr.</th><th>Imprev.</th><th>Alertas</th></tr></thead>
            <tbody>{data.filas.map((r, i) => { const tE = r.ent.reduce((s, e) => s + e[1], 0); const tS = r.sal.reduce((s, e) => s + e[1], 0); return <tr key={i}><td>{r.mes}</td><td style={{ textAlign: "right" }}>{fi(tE)}</td><td style={{ textAlign: "right" }}>{fi(tS)}</td><td style={{ textAlign: "right", fontWeight: 700 }}>{fi(r.saldo)}</td><td style={{ textAlign: "right" }}>{fi(r.capDisp)}</td><td style={{ textAlign: "right" }}>{fi(r.pagConst)}</td><td style={{ textAlign: "right" }}>{fi(r.impAcum)}</td><td style={{ fontSize: "8pt" }}>{r.alertas.join(" ")}</td></tr> })}</tbody>
          </table>
        </div>

        {/* ══ PARÁMETROS ══ */}
        {tab === "params" && (
          <div className="no-print" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px" }}>
            <div style={card}>
              <h3 style={{ color: "#64748b", marginTop: 0, marginBottom: "10px", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>💰 Fondos y Financiación</h3>
              <Inp label="Ahorros iniciales" k="ahorros" />
              <Inp label="Hipoteca suelo (cancelar)" k="hipotecaSuelo" />
              <Inp label="Hipoteca total" k="hipoteca" />
              <Inp label="Tipo interés" k="tipoInteres" suffix="%" step={0.1} />
              <Inp label="1ª disposición" k="primeraDisposicion" />
              <Inp label="Reserva banco (15%)" k="reservaBanco" />
            </div>
            <div style={card}>
              <h3 style={{ color: "#64748b", marginTop: 0, marginBottom: "10px", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>🏗️ Obra</h3>
              <Inp label="Presupuesto real" k="presupuestoReal" />
              <Inp label="Presupuesto declarado" k="presupuestoDeclarado" />
              <Inp label="Duración obra" k="duracion" suffix="m" step={1} min={1} />
              <Inp label="Nº certificaciones" k="numCerts" suffix="" step={1} min={1} />
              <Inp label="Adelanto constructor (cert 1 y 2)" k="adelantoConstructor" />
              <Inp label="Imprevistos (auto 10%)" k="imprevistos" />
              <Inp label="% retención constructor" k="retencionConstructorPct" suffix="%" step={1} min={0} />
            </div>
            <div style={card}>
              <h3 style={{ color: "#64748b", marginTop: 0, marginBottom: "10px", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>📋 Gastos Extra</h3>
              <Inp label="Gastos hipoteca (tasas)" k="gastosHipoteca" />
              <Inp label="Broker + tasación" k="gastosBroker" />
              <Inp label="Arquitecto" k="arquitecto" />
              <Inp label="Cocina (extra)" k="cocina" />
              <Inp label="Baño (extra)" k="bano" />
            </div>
            <div style={card}>
              <h3 style={{ color: "#64748b", marginTop: 0, marginBottom: "10px", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>👤 Personal y Seguro</h3>
              <Inp label="Ingresos mensuales" k="ingresos" />
              <Inp label="Ahorro neto mensual" k="ahorroMensual" />
              <Inp label="Alquiler" k="alquiler" />
              <Inp label="Seguro hombre (45a, 135k)" k="seguroHombre" />
              <Inp label="Seguro mujer (49a, 135k)" k="seguroMujer" />
              <Inp label="Plazo préstamo seguro" k="plazoSeguroMeses" suffix="m" step={1} min={1} />
              <div style={{ padding: "10px 0", borderTop: "1px solid #334155", marginTop: "6px", display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                <span style={{ color: "#94a3b8", fontWeight: 600 }}>Total seguro</span>
                <span style={{ color: "#fbbf24", fontWeight: 700 }}>{fm(p.seguroTotal)}</span>
              </div>
            </div>
          </div>
        )}

        {/* ══ RESUMEN ══ */}
        {tab === "resumen" && (
          <div className="no-print" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px" }}>
            <div style={card}>
              <h3 style={{ color: "#64748b", marginTop: 0, marginBottom: "10px", fontSize: "12px", textTransform: "uppercase" }}>💳 Fondos Propios</h3>
              <Row items={[["Ahorros", "+" + fm(p.ahorros), { color: "#4ade80" }], ["Cancelación suelo", "−" + fm(p.hipotecaSuelo), { color: "#f87171" }]]} />
              <div style={{ borderTop: "1px solid #334155", margin: "6px 0", padding: "6px 0", display: "flex", justifyContent: "space-between", fontSize: "15px" }}>
                <span style={{ color: "#fbbf24", fontWeight: 700 }}>Fondos netos</span>
                <span style={{ color: "#fbbf24", fontWeight: 700 }}>{fm(data.fondosNetos)}</span>
              </div>
            </div>
            <div style={card}>
              <h3 style={{ color: "#64748b", marginTop: 0, marginBottom: "10px", fontSize: "12px", textTransform: "uppercase" }}>🏦 Disposiciones Banco</h3>
              <Row items={[
                ["1ª disposición", fm(p.primeraDisposicion)],
                [`Certs 1-${p.numCerts - 1} (≈${fi(data.dispPorCert)}€ c/u)`, fm(data.disponibleObra)],
                [`Cert.${p.numCerts} (última)`, "0 € (retenida)", { color: "#f87171" }],
                ["Reserva 15% (CFO)", fm(p.reservaBanco), { color: "#fb923c" }],
              ]} />
              <div style={{ borderTop: "1px solid #334155", margin: "6px 0", padding: "6px 0" }}>
                <Row items={[
                  ["Cuota post-carencia", fm(data.cuotaHipo) + "/mes", { color: "#38bdf8", fontWeight: 700 }],
                  ["Intereses carencia total", "≈" + fm(data.intAcum), { color: "#f87171" }],
                ]} />
              </div>
              <div style={{ marginTop: "8px", padding: "8px", background: "#0f172a", borderRadius: "6px", fontSize: "12px", color: "#64748b" }}>
                Certs programadas en meses: {data.certMonths.join(", ")}
              </div>
            </div>
            <div style={card}>
              <h3 style={{ color: "#64748b", marginTop: 0, marginBottom: "10px", fontSize: "12px", textTransform: "uppercase" }}>🛡️ Seguro Vida</h3>
              <Row items={[["Hombre 45a · 135k", "≈" + fm(p.seguroHombre)], ["Mujer 49a · 135k", "≈" + fm(p.seguroMujer)]]} />
              <div style={{ borderTop: "1px solid #334155", margin: "6px 0", padding: "6px 0" }}>
                <Row items={[["Total (ptmo 0%)", "≈" + fm(p.seguroTotal), { color: "#fbbf24", fontWeight: 700 }], [`Cuota ${p.plazoSeguroMeses}m`, "≈" + fm(data.cuotaSeg) + "/mes", { color: "#38bdf8" }]]} />
              </div>
            </div>
            <div style={card}>
              <h3 style={{ color: "#64748b", marginTop: 0, marginBottom: "10px", fontSize: "12px", textTransform: "uppercase" }}>🔧 Imprevistos</h3>
              <Row items={[["Total reservado", fm(p.imprevistos)], [`Meses ${data.mesInicioImprev}–${p.duracion} (${data.mesesImprev}m)`, fm(data.imprevMes) + "/mes", { color: "#f97316" }]]} />
            </div>
          </div>
        )}

        {/* ══ FLUJO DE CAJA ══ */}
        {tab === "flujo" && (
          <div className="no-print">
            {/* Chart */}
            <div style={{ ...card, marginBottom: "16px" }}>
              <h3 style={{ color: "#64748b", marginTop: 0, marginBottom: "12px", fontSize: "12px", textTransform: "uppercase" }}>
                Evolución del Saldo — {p.duracion} meses, {p.numCerts} certificaciones
              </h3>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: "160px" }}>
                {data.filas.map((m, i) => {
                  const h = maxS > 0 ? (Math.max(0, m.saldo) / maxS) * 100 : 50;
                  const isSel = sel === i;
                  const c = m.saldo < 0 ? "#ef4444" : m.saldo < 15000 ? "#f97316" : m.saldo < 30000 ? "#eab308" : "#22c55e";
                  return (
                    <div key={i} onClick={() => setSel(isSel ? null : i)}
                      style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%", cursor: "pointer", minWidth: "12px" }}>
                      <div style={{ width: "100%", minHeight: "4px", height: `${Math.max(h, 3)}%`, background: c, opacity: isSel ? 1 : 0.5, borderRadius: "3px 3px 0 0", border: isSel ? "2px solid #fff" : "none", transition: "all 0.15s" }} />
                      <span style={{ fontSize: "9px", color: "#475569", marginTop: "3px" }}>
                        {m.n <= p.duracion ? (m.n === 0 ? "Pre" : m.n) : m.mes.includes("CFO") ? "CFO" : "LPO"}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p style={{ fontSize: "11px", color: "#475569", marginTop: "6px", marginBottom: 0 }}>Toca una barra para ver el desglose</p>
            </div>

            {/* Detail panel */}
            {sel !== null && (() => {
              const m = data.filas[sel];
              const tE = m.ent.reduce((s, e) => s + e[1], 0);
              const tS = m.sal.reduce((s, e) => s + e[1], 0);
              return (
                <div style={{ ...card, borderColor: "#f59e0b", marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                    <h3 style={{ color: "#fbbf24", fontSize: "16px", fontWeight: 700, margin: 0 }}>{m.mes}</h3>
                    <span style={{ fontSize: "20px", fontWeight: 700, color: m.saldo < 0 ? "#ef4444" : "#22c55e" }}>Saldo: {fm(m.saldo)}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                      <div style={{ color: "#4ade80", fontSize: "11px", fontWeight: 600, marginBottom: "6px", textTransform: "uppercase" }}>▲ Entradas +{fm(tE)}</div>
                      {m.ent.map((e, j) => (
                        <div key={j} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "2px 0" }}>
                          <span style={lbl}>{e[0]}</span>
                          <span style={{ color: e[1] > 0 ? "#4ade80" : "#475569", marginLeft: "8px", whiteSpace: "nowrap" }}>{e[1] > 0 ? "+" + fm(e[1]) : "—"}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div style={{ color: "#f87171", fontSize: "11px", fontWeight: 600, marginBottom: "6px", textTransform: "uppercase" }}>▼ Salidas −{fm(tS)}</div>
                      {m.sal.map((e, j) => (
                        <div key={j} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "2px 0" }}>
                          <span style={lbl}>{e[0]}</span>
                          <span style={{ color: "#f87171", marginLeft: "8px", whiteSpace: "nowrap" }}>−{fm(e[1])}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ borderTop: "1px solid #334155", marginTop: "10px", paddingTop: "8px", display: "flex", justifyContent: "space-between", fontSize: "12px", flexWrap: "wrap", gap: "8px" }}>
                    <span style={{ color: "#475569" }}>Dispuesto: <span style={{ color: "#38bdf8" }}>{fm(m.capDisp)}</span></span>
                    <span style={{ color: "#475569" }}>Constructor: <span style={{ color: "#e2e8f0" }}>{fm(m.pagConst)}</span></span>
                    <span style={{ color: "#475569" }}>Imprevistos: <span style={{ color: "#f97316" }}>{fm(m.impAcum)}</span></span>
                  </div>
                  {m.alertas.map((a, j) => <p key={j} style={{ margin: "4px 0 0", fontSize: "12px", color: a.includes("🚨") ? "#ef4444" : "#f97316" }}>{a}</p>)}
                </div>
              );
            })()}

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #334155" }}>
                    <th style={{ padding: "8px 6px", textAlign: "left", color: "#64748b" }}>Periodo</th>
                    <th style={{ padding: "8px 6px", textAlign: "right", color: "#4ade80" }}>Entradas</th>
                    <th style={{ padding: "8px 6px", textAlign: "right", color: "#f87171" }}>Salidas</th>
                    <th style={{ padding: "8px 6px", textAlign: "right", color: "#fbbf24", fontWeight: 700 }}>Saldo</th>
                    <th style={{ padding: "8px 6px", textAlign: "center", width: "30px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {data.filas.map((m, i) => {
                    const tE = m.ent.reduce((s, e) => s + e[1], 0);
                    const tS = m.sal.reduce((s, e) => s + e[1], 0);
                    const c = m.saldo < 0 ? "#ef4444" : m.saldo < 15000 ? "#f97316" : m.saldo < 30000 ? "#eab308" : "#22c55e";
                    return (
                      <tr key={i} onClick={() => setSel(sel === i ? null : i)}
                        style={{ borderBottom: "1px solid #1e293b", cursor: "pointer", background: sel === i ? "#1e293b" : "transparent" }}>
                        <td style={{ padding: "7px 6px", fontWeight: 600 }}>{m.mes}</td>
                        <td style={{ padding: "7px 6px", textAlign: "right", color: "#4ade80" }}>{tE > 0 ? "+" + fi(tE) : "—"}</td>
                        <td style={{ padding: "7px 6px", textAlign: "right", color: "#f87171" }}>{tS > 0 ? "−" + fi(tS) : "—"}</td>
                        <td style={{ padding: "7px 6px", textAlign: "right", color: c, fontWeight: 700 }}>{fi(m.saldo)}</td>
                        <td style={{ textAlign: "center" }}>{m.alertas.length > 0 ? (m.alertas[0].includes("🚨") ? "🚨" : "⚠️") : "✅"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══ RIESGOS ══ */}
        {tab === "riesgos" && (
          <div className="no-print" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {riesgos.map((r, i) => (
              <div key={i} onClick={() => setExpR(expR === i ? null : i)}
                style={{ ...card, borderLeft: `4px solid ${r.c}`, cursor: "pointer", borderColor: expR === i ? r.c : "#334155" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, padding: "3px 10px", background: r.c, color: "#000", borderRadius: "4px" }}>{r.n}</span>
                  <span style={{ fontSize: "13px", fontWeight: 600, flex: 1 }}>{r.t}</span>
                  <span style={{ color: "#64748b" }}>{expR === i ? "▲" : "▼"}</span>
                </div>
                {expR === i && (
                  <div style={{ marginTop: "10px" }}>
                    <p style={{ fontSize: "13px", color: "#94a3b8", margin: "0 0 8px", lineHeight: 1.6 }}>{r.d}</p>
                    <p style={{ fontSize: "13px", color: "#4ade80", margin: 0, lineHeight: 1.6 }}>💡 {r.s}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ══ GAP ══ */}
        {tab === "gap" && (
          <div className="no-print" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ ...card, borderColor: "#ef4444" }}>
              <h2 style={{ color: "#ef4444", fontSize: "17px", marginTop: 0 }}>Secuencia Fin de Obra</h2>
              <div style={{ background: "#0f172a", padding: "16px", borderRadius: "8px", fontSize: "13px", lineHeight: 2.4 }}>
                {[["1", "Obra terminada", "#e2e8f0"], ["2", "Constructor→cobrar hasta " + (p.retencionConstructorPct) + "% = " + fm(data.retencionConst), "#f97316"], ["3", "Arquitecto firma CFO", "#38bdf8"], ["4", "Banco libera 15% = " + fm(p.reservaBanco), "#4ade80"], ["5", "Pagas constructor", "#e2e8f0"], ["6", "Solicitas LPO", "#c084fc"], ["7", "LPO → pagas " + (p.retencionConstructorPct) + "% = " + fm(data.retencionConst), "#f97316"]].map(arr => (
                  <div key={arr[0]} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <span style={{ background: "#334155", color: "#f8fafc", borderRadius: "50%", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, flexShrink: 0 }}>{arr[0]}</span>
                    <span style={{ color: arr[2] }}>{arr[1]}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ ...card, textAlign: "center" }}>
              <p style={{ color: "#94a3b8", fontSize: "13px", margin: "0 0 6px" }}>Si CFO → liberación rápida:</p>
              <span style={{ fontSize: "24px", color: "#22c55e", fontWeight: 700 }}>Sin gap — fluye</span>
            </div>
            <div style={{ ...card, textAlign: "center", borderColor: "#ef4444" }}>
              <p style={{ color: "#94a3b8", fontSize: "13px", margin: "0 0 6px" }}>Si hay desfase temporal:</p>
              <span style={{ fontSize: "24px", color: "#ef4444", fontWeight: 700 }}>Puente necesario: {fm(data.gap)}</span>
            </div>
          </div>
        )}

        {/* ══ POST-OBRA ══ */}
        {tab === "post" && (
          <div className="no-print" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px" }}>
            <div style={card}>
              <h3 style={{ color: "#64748b", marginTop: 0, marginBottom: "10px", fontSize: "12px", textTransform: "uppercase" }}>Gastos Mensuales Post-Obra</h3>
              <Row items={[
                ["Hipoteca (500k, " + p.tipoInteres + "%, 29a)", fm(data.cuotaHipo) + "/mes", { color: "#f87171", fontWeight: 700 }],
                ["Seguro vida", fm(data.cuotaSeg) + "/mes", { color: "#f87171" }],
                ["Alquiler", "0 € (vives en tu casa)", { color: "#22c55e" }],
                ["Hipoteca suelo", "0 € (cancelada)", { color: "#22c55e" }],
              ]} />
            </div>
            <div style={card}>
              <h3 style={{ color: "#64748b", marginTop: 0, marginBottom: "10px", fontSize: "12px", textTransform: "uppercase" }}>Ratio de Endeudamiento</h3>
              {(() => {
                const ct = data.cuotaHipo + data.cuotaSeg;
                const r = (ct / p.ingresos) * 100;
                const c = r < 30 ? "#22c55e" : r < 35 ? "#eab308" : "#ef4444";
                return (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", marginBottom: "8px" }}>
                      <span style={lbl}>(Hipoteca + seguro) / Ingresos</span>
                      <span style={{ color: c, fontWeight: 700 }}>{r.toFixed(1)}%</span>
                    </div>
                    <div style={{ background: "#1e293b", borderRadius: "6px", height: "20px", overflow: "hidden" }}>
                      <div style={{ width: `${Math.min(r, 100)}%`, height: "100%", background: c, borderRadius: "6px" }} />
                    </div>
                    <p style={{ fontSize: "12px", color: c, marginTop: "6px", marginBottom: 0 }}>
                      {r < 30 ? "✅ Dentro del 30% recomendado. Cómodo." : r < 35 ? "⚠️ Ligeramente por encima del 30%. Manejable." : "🚨 Por encima del 35%. Ajustado."}
                    </p>
                  </div>
                );
              })()}
            </div>
            <div style={card}>
              <h3 style={{ color: "#64748b", marginTop: 0, marginBottom: "10px", fontSize: "12px", textTransform: "uppercase" }}>Colchón Final</h3>
              <div style={{ background: "#0f172a", padding: "16px", borderRadius: "8px", textAlign: "center" }}>
                <span style={{ fontSize: "12px", color: "#64748b" }}>Saldo tras LPO (imprevistos consumidos al 100%):</span><br />
                <span style={{ fontSize: "26px", fontWeight: 700, color: data.filas[data.filas.length - 1].saldo > 0 ? "#22c55e" : "#ef4444" }}>
                  {fm(data.filas[data.filas.length - 1].saldo)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ══ SIMULADOR HIPOTECA ══ */}
        {tab === "hipoteca" && <HipotecaSim />}

        <div className="no-print" style={{ marginTop: "24px", borderTop: "1px solid #1e293b", paddingTop: "10px" }}>
          <p style={{ fontSize: "11px", color: "#475569", margin: 0 }}>
            ⚠ Simulación orientativa. Todos los parámetros editables en ⚙️ Parámetros. Recálculo en tiempo real. Excel genera .xlsx nativo. PDF = Ctrl+P / ⌘P (B/N, A4 apaisado).
          </p>
        </div>
      </div>
    </div>
  );
}
