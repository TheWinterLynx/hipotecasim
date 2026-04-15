import React, { useState, useMemo } from "react";

export default function HipotecaSim() {
  const monthIndex = (anio, mes = 1) => ((Math.max(1, Number(anio) || 1) - 1) * 12) + Math.min(12, Math.max(1, Number(mes) || 1));
  const monthLabel = (mesAbs) => {
    const anio = Math.ceil(mesAbs / 12);
    const mes = ((mesAbs - 1) % 12) + 1;
    return `Año ${anio}, M${mes}`;
  };
  const periodLabel = (ini, fin) => ini === fin ? monthLabel(ini) : `${monthLabel(ini)} → ${monthLabel(fin)}`;

  const [h, setH] = useState({
    capital: 500000, tipo: 2.2, plazo: 29,
    amortMensualExtra: 0, reducir: "cuota",
    amortMensualInicioAnio: 1, amortMensualInicioMes: 1,
    amortMensualFinAnio: 29, amortMensualFinMes: 12,
    ingresos: 7000, gastosFijos: 2350, cuotaSeguro: 165,
    ahorroInicial: 0,
    otrosGastosMensuales: 0,
  });

  const [amortPuntuales, setAmortPuntuales] = useState([]);
  const [cambiosTipo, setCambiosTipo] = useState([]);
  const [cambiosEcon, setCambiosEcon] = useState([]);
  const [vista, setVista] = useState("anual");
  const [anioExpandido, setAnioExpandido] = useState(null);

  const [newAmort, setNewAmort] = useState({ modo: "anual", anio: 1, mes: 1, importe: 10000, reducir: "cuota" });
  const [newCambio, setNewCambio] = useState({ modo: "anual", anio: 5, mes: 1, nuevoTipo: 2.5 });
  const [newEcon, setNewEcon] = useState({
    modo: "anual",
    anioInicio: 2,
    anioFin: 2,
    mesInicio: 1,
    mesFin: 12,
    campo: "ingresos",
    delta: 1000,
    frecuencia: "mensual",
    aplicacionAnual: "prorrateado",
  });

  const [inversiones, setInversiones] = useState([]);
  const [newInv, setNewInv] = useState({
    modo: "anual",
    anioInicio: 1,
    anioFin: 29,
    mesInicio: 1,
    mesFin: 12,
    saldoInicial: 0,
    aportacionMensual: 0,
    rentabilidadAnual: 4,
    rescateAutomatico: true,
  });

  const addAmort = () => {
    const mes = newAmort.modo === "mensual" ? monthIndex(newAmort.anio, newAmort.mes) : monthIndex(newAmort.anio, 1);
    setAmortPuntuales(prev => [...prev, {
      mes,
      importe: Number(newAmort.importe) || 0,
      reducir: newAmort.reducir,
      modo: newAmort.modo,
    }].sort((a, b) => a.mes - b.mes));
  };
  const removeAmort = (i) => setAmortPuntuales(prev => prev.filter((_, j) => j !== i));

  const addCambio = () => {
    const mes = newCambio.modo === "mensual" ? monthIndex(newCambio.anio, newCambio.mes) : monthIndex(newCambio.anio, 1);
    setCambiosTipo(prev => [...prev, {
      mes,
      nuevoTipo: Number(newCambio.nuevoTipo) || 0,
      modo: newCambio.modo,
    }].sort((a, b) => a.mes - b.mes));
  };
  const removeCambio = (i) => setCambiosTipo(prev => prev.filter((_, j) => j !== i));

  const addEcon = () => {
    const mesInicio = newEcon.modo === "mensual" ? monthIndex(newEcon.anioInicio, newEcon.mesInicio) : monthIndex(newEcon.anioInicio, 1);
    const mesFin = newEcon.modo === "mensual" ? monthIndex(newEcon.anioFin, newEcon.mesFin) : monthIndex(newEcon.anioFin, 12);
    setCambiosEcon(prev => [...prev, {
      mesInicio: Math.min(mesInicio, mesFin),
      mesFin: Math.max(mesInicio, mesFin),
      campo: newEcon.campo,
      delta: Number(newEcon.delta) || 0,
      frecuencia: newEcon.frecuencia,
      aplicacionAnual: newEcon.frecuencia === "anual" ? newEcon.aplicacionAnual : null,
      modo: newEcon.modo,
    }].sort((a, b) => a.mesInicio - b.mesInicio || a.mesFin - b.mesFin));
  };
  const removeEcon = (i) => setCambiosEcon(prev => prev.filter((_, j) => j !== i));

  const addInv = () => {
    const mesInicio = newInv.modo === "mensual" ? monthIndex(newInv.anioInicio, newInv.mesInicio) : monthIndex(newInv.anioInicio, 1);
    const mesFin = newInv.modo === "mensual" ? monthIndex(newInv.anioFin, newInv.mesFin) : monthIndex(newInv.anioFin, 12);
    setInversiones(prev => [...prev, {
      mesInicio: Math.min(mesInicio, mesFin),
      mesFin: Math.max(mesInicio, mesFin),
      modo: newInv.modo,
      saldoInicial: Math.max(0, Number(newInv.saldoInicial) || 0),
      aportacionMensual: Math.max(0, Number(newInv.aportacionMensual) || 0),
      rentabilidadAnual: Number(newInv.rentabilidadAnual) || 0,
      rescateAutomatico: !!newInv.rescateAutomatico,
    }].sort((a, b) => a.mesInicio - b.mesInicio || a.mesFin - b.mesFin));
  };
  const removeInv = (i) => setInversiones(prev => prev.filter((_, j) => j !== i));


  const resultado = useMemo(() => {
    let capitalReal = Number(h.capital) || 0;
    let capitalCuota = Number(h.capital) || 0;
    let tipoAnual = (Number(h.tipo) || 0) / 100;
    let im = tipoAnual / 12;

    let termCuota = Math.max(1, (Number(h.plazo) || 0) * 12);
    const totalMesesMax = termCuota;

    const calcCuota = (cap, i, n) => {
      if (n <= 0 || cap <= 0) return 0;
      if (Math.abs(i) < 1e-12) return cap / n;
      return cap * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
    };

    const calcN = (cap, i, cuota) => {
      if (cap <= 0 || cuota <= 0) return 0;
      if (Math.abs(i) < 1e-12) return cap / cuota;
      if (cuota <= cap * i) return Infinity;
      return Math.log(cuota / (cuota - cap * i)) / Math.log(1 + i);
    };

    const amountForChange = (c, mes) => {
      if (mes < c.mesInicio || mes > c.mesFin) return 0;
      if (c.frecuencia === "mensual") return c.delta;
      if (c.aplicacionAnual === "prorrateado") return c.delta / 12;
      const mesEnAnio = ((mes - 1) % 12) + 1;
      const mesInicioAplicacion = c.modo === "mensual" ? ((c.mesInicio - 1) % 12) + 1 : 1;
      return mesEnAnio === mesInicioAplicacion ? c.delta : 0;
    };

    const sumCampo = (campo, mes) => cambiosEcon
      .filter(c => c.campo === campo)
      .reduce((s, c) => s + amountForChange(c, mes), 0);

    const getEconomiaMes = (mes) => {
      const deltaIngresos = sumCampo("ingresos", mes);
      const deltaGastos = sumCampo("gastos", mes);
      const deltaSeguro = sumCampo("seguro", mes);
      const deltaOtros = sumCampo("otros", mes);
      const ingresosActual = (Number(h.ingresos) || 0) + deltaIngresos;
      const gastosActual = (Number(h.gastosFijos) || 0) + deltaGastos;
      const seguroActual = Math.max(0, (Number(h.cuotaSeguro) || 0) + deltaSeguro);
      const otrosActual = (Number(h.otrosGastosMensuales) || 0) + deltaOtros;
      const ajusteEconomicoNeto = deltaIngresos - deltaGastos - deltaSeguro - deltaOtros;
      return { ingresosActual, gastosActual, seguroActual, otrosActual, ajusteEconomicoNeto };
    };

    const amortMensualInicioAbs = monthIndex(h.amortMensualInicioAnio, h.amortMensualInicioMes);
    const amortMensualFinAbs = monthIndex(h.amortMensualFinAnio, h.amortMensualFinMes);
    const amortMensualRangoIni = Math.min(amortMensualInicioAbs, amortMensualFinAbs);
    const amortMensualRangoFin = Math.max(amortMensualInicioAbs, amortMensualFinAbs);
    const amortMensualActiva = (mes) =>
      (Number(h.amortMensualExtra) || 0) > 0 && mes >= amortMensualRangoIni && mes <= amortMensualRangoFin;

    const invStates = inversiones.map((inv, idx) => ({
      ...inv,
      idx,
      saldo: 0,
      started: false,
      closed: false,
      rateMensual: Math.pow(1 + (Number(inv.rentabilidadAnual) || 0) / 100, 1 / 12) - 1,
    }));

    let cuotaProgramada = calcCuota(capitalCuota, im, termCuota);
    let meses = [];
    let mesActual = 0;
    let ahorroAcumulado = Number(h.ahorroInicial) || 0;

    const rescueFromInvestments = (necesario) => {
      let rescatado = 0;
      if (necesario <= 0) return 0;
      for (const inv of invStates) {
        if (!inv.rescateAutomatico || inv.saldo <= 0) continue;
        const take = Math.min(inv.saldo, necesario - rescatado);
        if (take > 0) {
          inv.saldo -= take;
          rescatado += take;
          ahorroAcumulado += take;
        }
        if (rescatado >= necesario - 1e-9) break;
      }
      return rescatado;
    };

    while (capitalReal > 0.01 && mesActual < totalMesesMax + 240) {
      mesActual++;

      // activar inversiones al inicio de su periodo
      for (const inv of invStates) {
        if (!inv.started && mesActual >= inv.mesInicio) {
          inv.started = true;
          const mover = Math.min(Math.max(0, inv.saldoInicial || 0), Math.max(0, ahorroAcumulado));
          if (mover > 0) {
            ahorroAcumulado -= mover;
            inv.saldo += mover;
            inversionInicialMes += mover;
          }
        }
      }

      const cambioTipo = cambiosTipo.find(c => c.mes === mesActual);
      if (cambioTipo) {
        tipoAnual = (Number(cambioTipo.nuevoTipo) || 0) / 100;
        im = tipoAnual / 12;
        cuotaProgramada = calcCuota(capitalCuota, im, Math.max(1, termCuota));
      }

      const eco = getEconomiaMes(mesActual);

      const intereses = capitalReal * im;
      const cuotaMes = Math.min(cuotaProgramada, capitalReal + intereses);
      const capitalCuotaReal = Math.min(Math.max(0, cuotaMes - intereses), capitalReal);
      capitalReal = Math.max(0, capitalReal - capitalCuotaReal);

      const interesesLedger = capitalCuota * im;
      const capitalCuotaLedger = Math.min(Math.max(0, cuotaMes - interesesLedger), capitalCuota);
      capitalCuota = Math.max(0, capitalCuota - capitalCuotaLedger);

      let amortExtraMensual = 0;
      let amortPuntualMes = 0;
      let appliedCuotaExtra = 0;
      let appliedPlazoExtra = 0;
      let inversionInicialMes = 0;
      let inversionRendMes = 0;
      let inversionAportMes = 0;
      let inversionRescateMes = 0;
      let inversionLiquidacionMes = 0;

      if (amortMensualActiva(mesActual) && capitalReal > 0) {
        const solicitado = Math.min(Number(h.amortMensualExtra) || 0, capitalReal);
        if (solicitado > 0) {
          if (ahorroAcumulado < solicitado) {
            inversionRescateMes += rescueFromInvestments(solicitado - ahorroAcumulado);
          }
          const extra = Math.min(solicitado, Math.max(ahorroAcumulado, 0));
          if (extra > 0) {
            capitalReal -= extra;
            ahorroAcumulado -= extra;
            amortExtraMensual += extra;
            if (h.reducir === "cuota") {
              capitalCuota = Math.max(0, capitalCuota - extra);
              appliedCuotaExtra += extra;
            } else {
              appliedPlazoExtra += extra;
            }
          }
        }
      }

      const puntuales = amortPuntuales.filter(a => a.mes === mesActual);
      const puntualesAplicadas = [];
      for (const ap of puntuales) {
        if (capitalReal > 0) {
          const solicitado = Math.min(Number(ap.importe) || 0, capitalReal);
          if (ahorroAcumulado < solicitado) {
            inversionRescateMes += rescueFromInvestments(solicitado - ahorroAcumulado);
          }
          const extra = Math.min(solicitado, Math.max(ahorroAcumulado, 0));
          if (extra > 0) {
            capitalReal -= extra;
            ahorroAcumulado -= extra;
            amortPuntualMes += extra;
            if (ap.reducir === "cuota") {
              capitalCuota = Math.max(0, capitalCuota - extra);
              appliedCuotaExtra += extra;
            } else {
              appliedPlazoExtra += extra;
            }
          }
          puntualesAplicadas.push({ ...ap, aplicado: extra });
        }
      }

      const amortExtraTotal = amortExtraMensual + amortPuntualMes;
      termCuota = Math.max(0, termCuota - 1);

      if (capitalCuota > 0 && appliedCuotaExtra > 0) {
        cuotaProgramada = calcCuota(capitalCuota, im, Math.max(1, termCuota));
      }

      let mesesPlanReal = 0;
      if (capitalReal > 0 && cuotaProgramada > 0) {
        const nEstimadoReal = calcN(capitalReal, im, cuotaProgramada);
        mesesPlanReal = Number.isFinite(nEstimadoReal) && nEstimadoReal > 0
          ? Math.max(1, Math.ceil(nEstimadoReal))
          : Math.max(1, termCuota);
      }

      const cuotaMinimaSiguiente = capitalCuota * im;
      if (capitalCuota > 0 && cuotaProgramada <= cuotaMinimaSiguiente + 1e-9) {
        cuotaProgramada = calcCuota(capitalCuota, im, Math.max(1, termCuota));
      }

      const gastosMesTotales = cuotaMes + amortExtraTotal + eco.seguroActual + eco.gastosActual + eco.otrosActual;
      const ahorroMesBruto = eco.ingresosActual - gastosMesTotales;
      ahorroAcumulado += ahorroMesBruto;

      // gestión de inversiones al final del mes
      for (const inv of invStates) {
        if (!inv.started || inv.closed) continue;
        const activaEsteMes = mesActual >= inv.mesInicio && mesActual <= inv.mesFin;

        if (activaEsteMes && inv.saldo > 0) {
          const rend = inv.saldo * inv.rateMensual;
          inv.saldo += rend;
          inversionRendMes += rend;
        }

        if (activaEsteMes && inv.aportacionMensual > 0 && ahorroAcumulado > 0) {
          const aport = Math.min(inv.aportacionMensual, ahorroAcumulado);
          inv.saldo += aport;
          ahorroAcumulado -= aport;
          inversionAportMes += aport;
        }

        if (mesActual >= inv.mesFin) {
          if (inv.saldo > 0) {
            ahorroAcumulado += inv.saldo;
            inversionLiquidacionMes += inv.saldo;
            inv.saldo = 0;
          }
          inv.closed = true;
        }
      }

      const inversionSaldo = invStates.reduce((s, inv) => s + inv.saldo, 0);
      const patrimonioTotal = ahorroAcumulado + inversionSaldo;

      meses.push({
        mes: mesActual,
        anio: Math.ceil(mesActual / 12),
        mesEnAnio: ((mesActual - 1) % 12) + 1,
        cuota: cuotaMes,
        cuotaSiguiente: cuotaProgramada,
        intereses,
        capitalCuota: capitalCuotaReal,
        amortExtra: amortExtraTotal,
        amortExtraMensual,
        amortPuntualMes,
        capitalPendiente: capitalReal,
        tipo: tipoAnual * 100,
        ajusteEconomicoNeto: eco.ajusteEconomicoNeto,
        inversionRendMes,
        inversionAportMes,
        inversionRescateMes,
        inversionLiquidacionMes,
        inversionNeta: inversionRendMes + inversionAportMes - inversionRescateMes - inversionLiquidacionMes,
        inversionSaldo,
        patrimonioTotal,
        cajaFinal: ahorroAcumulado,
        ahorroMesBruto,
        mesesPlanRestantes: mesesPlanReal,
        puntualesAplicadas,
      });

      if (capitalReal <= 0.01) {
        capitalReal = 0;
        capitalCuota = 0;
        cuotaProgramada = 0;
        break;
      }
    }

    const mesesPost = Math.max(0, 30 * 12 - meses.length);
    for (let i = 0; i < mesesPost; i++) {
      mesActual++;
      const eco = getEconomiaMes(mesActual);

      let inversionInicialMes = 0;
      let inversionRendMes = 0;
      let inversionAportMes = 0;
      let inversionRescateMes = 0;
      let inversionLiquidacionMes = 0;

      const gastosMesTotales = eco.seguroActual + eco.gastosActual + eco.otrosActual;
      const ahorroMesBruto = eco.ingresosActual - gastosMesTotales;
      ahorroAcumulado += ahorroMesBruto;

      for (const inv of invStates) {
        if (!inv.started || inv.closed) continue;
        const activaEsteMes = mesActual >= inv.mesInicio && mesActual <= inv.mesFin;
        if (activaEsteMes && inv.saldo > 0) {
          const rend = inv.saldo * inv.rateMensual;
          inv.saldo += rend;
          inversionRendMes += rend;
        }
        if (activaEsteMes && inv.aportacionMensual > 0 && ahorroAcumulado > 0) {
          const aport = Math.min(inv.aportacionMensual, ahorroAcumulado);
          inv.saldo += aport;
          ahorroAcumulado -= aport;
          inversionAportMes += aport;
        }
        if (mesActual >= inv.mesFin) {
          if (inv.saldo > 0) {
            ahorroAcumulado += inv.saldo;
            inversionLiquidacionMes += inv.saldo;
            inv.saldo = 0;
          }
          inv.closed = true;
        }
      }

      const inversionSaldo = invStates.reduce((s, inv) => s + inv.saldo, 0);
      const patrimonioTotal = ahorroAcumulado + inversionSaldo;

      meses.push({
        mes: mesActual,
        anio: Math.ceil(mesActual / 12),
        mesEnAnio: ((mesActual - 1) % 12) + 1,
        cuota: 0,
        cuotaSiguiente: 0,
        intereses: 0,
        capitalCuota: 0,
        amortExtra: 0,
        capitalPendiente: 0,
        tipo: 0,
        ajusteEconomicoNeto: eco.ajusteEconomicoNeto,
        inversionRendMes,
        inversionAportMes,
        inversionRescateMes,
        inversionLiquidacionMes,
        inversionNeta: inversionRendMes + inversionAportMes - inversionRescateMes - inversionLiquidacionMes,
        inversionSaldo,
        patrimonioTotal,
        cajaFinal: ahorroAcumulado,
        ahorroMesBruto,
        postHipoteca: true,
        mesesPlanRestantes: 0,
      });
    }

    const anios = [...new Set(meses.map(m => m.anio))].map(a => {
      const ma = meses.filter(m => m.anio === a);
      return {
        anio: a,
        cuotaMensual: ma[0].cuota || 0,
        interesesTotal: ma.reduce((s, m) => s + m.intereses, 0),
        capitalTotal: ma.reduce((s, m) => s + m.capitalCuota, 0),
        amortExtraTotal: ma.reduce((s, m) => s + m.amortExtra, 0),
        capitalPendiente: ma[ma.length - 1].capitalPendiente,
        tipo: ma.find(m => m.tipo > 0)?.tipo || 0,
        meses: ma,
        cuotaMensualFinal: ma[ma.length - 1].cuotaSiguiente || ma[ma.length - 1].cuota,
        cajaFinal: ma[ma.length - 1].cajaFinal,
        inversionSaldo: ma[ma.length - 1].inversionSaldo,
        patrimonioTotal: ma[ma.length - 1].patrimonioTotal,
        ajusteEconomicoNeto: ma.reduce((s, m) => s + m.ajusteEconomicoNeto, 0),
        inversionNeta: ma.reduce((s, m) => s + m.inversionRendMes + m.inversionAportMes - m.inversionRescateMes - m.inversionLiquidacionMes, 0),
        inversionAportada: ma.reduce((s, m) => s + m.inversionAportMes, 0),
        postHipoteca: ma[0].postHipoteca || false,
      };
    });

    const totalIntereses = meses.filter(m => !m.postHipoteca).reduce((s, m) => s + m.intereses, 0);
    const totalPagado = meses.filter(m => !m.postHipoteca).reduce((s, m) => s + m.cuota + m.amortExtra, 0);
    const duracionReal = meses.filter(m => !m.postHipoteca).length;
    const inversionFinal = meses.length ? meses[meses.length - 1].inversionSaldo : 0;
    const patrimonioFinal = meses.length ? meses[meses.length - 1].patrimonioTotal : 0;
    const cajaFinal = meses.length ? meses[meses.length - 1].cajaFinal : Number(h.ahorroInicial) || 0;

    return {
      meses,
      anios,
      totalIntereses,
      totalPagado,
      duracionReal,
      cuotaInicial: meses.length > 0 ? meses[0].cuota : 0,
      ahorroFinal: cajaFinal,
      inversionFinal,
      patrimonioFinal,
    };
  }, [h, amortPuntuales, cambiosTipo, cambiosEcon, inversiones]);


  const fm = n => Math.round(n).toLocaleString("es-ES") + " €";
  const fd = n => n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
  const formatSigned = n => `${n >= 0 ? "+" : "−"}${fm(Math.abs(n))}`;

  const card = { background: "linear-gradient(135deg,#0f172a,#1e293b)", border: "1px solid #334155", borderRadius: "10px", padding: "22px", minWidth: 0 };
  const lbl = { color: "#94a3b8", fontSize: "13px" };
  const inp = { background: "#0f172a", border: "1px solid #334155", borderRadius: "4px", color: "#f59e0b", padding: "6px 10px", fontSize: "14px", fontFamily: "inherit", textAlign: "right" };

  return (
    <div className="no-print" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(440px, 1fr))", gap: "16px" }}>
        <div style={card}>
          <h3 style={{ color: "#64748b", marginTop: 0, marginBottom: "12px", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>🏦 Hipoteca</h3>
          {[["Capital", "capital", "€", 1000], ["Tipo interés", "tipo", "%", 0.1], ["Plazo (tras carencia)", "plazo", "años", 1], ["Amort. extra mensual", "amortMensualExtra", "€", 50]].map(([label, key, suf, step]) => (
            <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #1e293b" }}>
              <span style={lbl}>{label}</span>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <input type="number" value={h[key]} step={step} min={0}
                  onChange={e => setH(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                  style={{ ...inp, width: "110px" }} />
                <span style={{ color: "#475569", fontSize: "12px", width: "36px" }}>{suf}</span>
              </div>
            </div>
          ))}
          <div style={{ padding: "8px 0", borderBottom: "1px solid #1e293b" }}>
            <div style={{ ...lbl, marginBottom: "6px" }}>Periodo amort. extra mensual</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ ...lbl, fontSize: "12px" }}>Desde</span>
                <input type="number" value={h.amortMensualInicioAnio} min={1} step={1}
                  onChange={e => setH(prev => ({ ...prev, amortMensualInicioAnio: Number(e.target.value) }))}
                  style={{ ...inp, width: "58px" }} />
                <input type="number" value={h.amortMensualInicioMes} min={1} max={12} step={1}
                  onChange={e => setH(prev => ({ ...prev, amortMensualInicioMes: Number(e.target.value) }))}
                  style={{ ...inp, width: "52px" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ ...lbl, fontSize: "12px" }}>Hasta</span>
                <input type="number" value={h.amortMensualFinAnio} min={1} step={1}
                  onChange={e => setH(prev => ({ ...prev, amortMensualFinAnio: Number(e.target.value) }))}
                  style={{ ...inp, width: "58px" }} />
                <input type="number" value={h.amortMensualFinMes} min={1} max={12} step={1}
                  onChange={e => setH(prev => ({ ...prev, amortMensualFinMes: Number(e.target.value) }))}
                  style={{ ...inp, width: "52px" }} />
              </div>
            </div>
            <div style={{ color: "#64748b", fontSize: "11px", marginTop: "6px" }}>Formato: año / mes. La amortización mensual solo se aplica dentro de ese rango.</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #1e293b" }}>
            <span style={lbl}>Al amortizar extra:</span>
            <select value={h.reducir} onChange={e => setH(prev => ({ ...prev, reducir: e.target.value }))}
              style={{ ...inp, width: "140px", textAlign: "left" }}>
              <option value="cuota">Reducir cuota</option>
              <option value="plazo">Reducir plazo</option>
            </select>
          </div>
        </div>

        <div style={card}>
          <h3 style={{ color: "#64748b", marginTop: 0, marginBottom: "12px", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>👤 Economía Personal</h3>
          {[["Ingresos mensuales", "ingresos", "€", 100], ["Gastos fijos (vida)", "gastosFijos", "€", 50], ["Cuota seguro vida", "cuotaSeguro", "€", 10], ["Otros gastos recurrentes", "otrosGastosMensuales", "€", 50], ["Ahorro al empezar", "ahorroInicial", "€", 1000]].map(([label, key, suf, step]) => (
            <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #1e293b" }}>
              <span style={lbl}>{label}</span>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <input type="number" value={h[key]} step={step} min={0}
                  onChange={e => setH(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                  style={{ ...inp, width: "110px" }} />
                <span style={{ color: "#475569", fontSize: "12px", width: "36px" }}>{suf}</span>
              </div>
            </div>
          ))}
          <div style={{ padding: "10px 0", borderTop: "1px solid #475569", marginTop: "6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
              <span style={{ color: "#94a3b8" }}>Ahorro/mes estimado inicial</span>
              <span style={{ color: "#4ade80", fontWeight: 700 }}>{fm(h.ingresos - h.gastosFijos - h.cuotaSeguro - h.otrosGastosMensuales - resultado.cuotaInicial - h.amortMensualExtra)}</span>
            </div>
          </div>
        </div>

        <div style={card}>
          <h3 style={{ color: "#64748b", marginTop: 0, marginBottom: "12px", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>💸 Amortizaciones Puntuales</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, max-content))", gap: "8px 10px", alignItems: "center", marginBottom: "10px" }}>
            <select value={newAmort.modo} onChange={e => setNewAmort(prev => ({ ...prev, modo: e.target.value }))} style={{ ...inp, width: "95px", textAlign: "left", fontSize: "12px", whiteSpace: "nowrap" }}>
              <option value="anual">Anual</option>
              <option value="mensual">Mensual</option>
            </select>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" }}>
              <span style={{ ...lbl, fontSize: "12px" }}>Año:</span>
              <input type="number" value={newAmort.anio} min={1} step={1} onChange={e => setNewAmort(prev => ({ ...prev, anio: Number(e.target.value) }))} style={{ ...inp, width: "60px" }} />
            </div>
            {newAmort.modo === "mensual" && <div style={{ display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" }}>
              <span style={{ ...lbl, fontSize: "12px" }}>Mes:</span>
              <input type="number" value={newAmort.mes} min={1} max={12} step={1} onChange={e => setNewAmort(prev => ({ ...prev, mes: Number(e.target.value) }))} style={{ ...inp, width: "55px" }} />
            </div>}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" }}>
              <span style={{ ...lbl, fontSize: "12px" }}>Importe:</span>
              <input type="number" value={newAmort.importe} min={0} step={1000} onChange={e => setNewAmort(prev => ({ ...prev, importe: Number(e.target.value) }))} style={{ ...inp, width: "90px" }} />
            </div>
            <select value={newAmort.reducir} onChange={e => setNewAmort(prev => ({ ...prev, reducir: e.target.value }))} style={{ ...inp, width: "100px", textAlign: "left", fontSize: "12px", whiteSpace: "nowrap" }}>
              <option value="cuota">→ cuota</option>
              <option value="plazo">→ plazo</option>
            </select>
            <button onClick={addAmort} style={{ background: "#166534", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 12px", cursor: "pointer", fontSize: "12px", whiteSpace: "nowrap" }}>+ Añadir</button>
          </div>
          <p style={{ ...lbl, fontSize: "11px", color: "#64748b", margin: "0 0 6px" }}>Las amortizaciones puntuales salen del ahorro acumulado</p>
          {amortPuntuales.length === 0 && <p style={{ ...lbl, fontSize: "12px", fontStyle: "italic" }}>Sin amortizaciones puntuales</p>}
          {amortPuntuales.map((a, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: "1px solid #1e293b", fontSize: "13px" }}>
              <span style={lbl}>{periodLabel(a.mes, a.mes)}: {fm(a.importe)} → {a.reducir}</span>
              <button onClick={() => removeAmort(i)} style={{ background: "#7f1d1d", color: "#fca5a5", border: "none", borderRadius: "4px", padding: "2px 8px", cursor: "pointer", fontSize: "11px" }}>✕</button>
            </div>
          ))}
        </div>

        <div style={card}>
          <h3 style={{ color: "#64748b", marginTop: 0, marginBottom: "12px", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>📈 Cambios Tipo Interés</h3>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(120px, 140px) 1fr 1fr", gap: "10px", alignItems: "center", marginBottom: "10px" }}>
            <select value={newCambio.modo} onChange={e => setNewCambio(prev => ({ ...prev, modo: e.target.value }))} style={{ ...inp, width: "95px", textAlign: "left", fontSize: "12px" }}>
              <option value="anual">Anual</option>
              <option value="mensual">Mensual</option>
            </select>
            <span style={{ ...lbl, fontSize: "12px" }}>Año:</span>
            <input type="number" value={newCambio.anio} min={1} step={1} onChange={e => setNewCambio(prev => ({ ...prev, anio: Number(e.target.value) }))} style={{ ...inp, width: "60px" }} />
            {newCambio.modo === "mensual" && <>
              <span style={{ ...lbl, fontSize: "12px" }}>Mes:</span>
              <input type="number" value={newCambio.mes} min={1} max={12} step={1} onChange={e => setNewCambio(prev => ({ ...prev, mes: Number(e.target.value) }))} style={{ ...inp, width: "55px" }} />
            </>}
            <span style={{ ...lbl, fontSize: "12px" }}>Nuevo:</span>
            <input type="number" value={newCambio.nuevoTipo} min={0} step={0.1} onChange={e => setNewCambio(prev => ({ ...prev, nuevoTipo: Number(e.target.value) }))} style={{ ...inp, width: "80px" }} />
            <span style={{ ...lbl, fontSize: "12px" }}>%</span>
            <button onClick={addCambio} style={{ background: "#166534", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 12px", cursor: "pointer", fontSize: "12px" }}>+ Añadir</button>
          </div>
          {cambiosTipo.length === 0 && <p style={{ ...lbl, fontSize: "12px", fontStyle: "italic" }}>Sin cambios programados</p>}
          {cambiosTipo.map((c, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: "1px solid #1e293b", fontSize: "13px" }}>
              <span style={lbl}>{periodLabel(c.mes, c.mes)}: {c.nuevoTipo}%</span>
              <button onClick={() => removeCambio(i)} style={{ background: "#7f1d1d", color: "#fca5a5", border: "none", borderRadius: "4px", padding: "2px 8px", cursor: "pointer", fontSize: "11px" }}>✕</button>
            </div>
          ))}
        </div>

        <div style={card}>
          <h3 style={{ color: "#64748b", marginTop: 0, marginBottom: "12px", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>📅 Cambios Económicos Futuros</h3>

          <div style={{ display: "grid", gridTemplateColumns: "minmax(120px, 140px) minmax(150px, 1fr) minmax(110px, 130px)", gap: "10px", alignItems: "center", marginBottom: "10px" }}>
            <select value={newEcon.modo} onChange={e => setNewEcon(prev => ({ ...prev, modo: e.target.value }))} style={{ ...inp, width: "100%", textAlign: "left", fontSize: "12px" }}>
              <option value="anual">Anual</option>
              <option value="mensual">Mensual</option>
            </select>
            <select value={newEcon.campo} onChange={e => setNewEcon(prev => ({ ...prev, campo: e.target.value }))} style={{ ...inp, width: "100%", textAlign: "left", fontSize: "12px" }}>
              <option value="ingresos">Ingresos</option>
              <option value="gastos">Gastos vida</option>
              <option value="seguro">Seguro</option>
              <option value="otros">Otros gastos</option>
            </select>
            <select value={newEcon.frecuencia} onChange={e => setNewEcon(prev => ({ ...prev, frecuencia: e.target.value }))} style={{ ...inp, width: "100%", textAlign: "left", fontSize: "12px" }}>
              <option value="mensual">Mensual</option>
              <option value="anual">Anual</option>
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: newEcon.modo === "mensual" ? "1fr 1fr" : "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
              <span style={{ ...lbl, fontSize: "12px", whiteSpace: "nowrap" }}>Inicio</span>
              <input type="number" value={newEcon.anioInicio} min={1} step={1} onChange={e => setNewEcon(prev => ({ ...prev, anioInicio: Number(e.target.value) }))} style={{ ...inp, width: "64px" }} />
              {newEcon.modo === "mensual" && <input type="number" value={newEcon.mesInicio} min={1} max={12} step={1} onChange={e => setNewEcon(prev => ({ ...prev, mesInicio: Number(e.target.value) }))} style={{ ...inp, width: "58px" }} />}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
              <span style={{ ...lbl, fontSize: "12px", whiteSpace: "nowrap" }}>Fin</span>
              <input type="number" value={newEcon.anioFin} min={1} step={1} onChange={e => setNewEcon(prev => ({ ...prev, anioFin: Number(e.target.value) }))} style={{ ...inp, width: "64px" }} />
              {newEcon.modo === "mensual" && <input type="number" value={newEcon.mesFin} min={1} max={12} step={1} onChange={e => setNewEcon(prev => ({ ...prev, mesFin: Number(e.target.value) }))} style={{ ...inp, width: "58px" }} />}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: newEcon.frecuencia === "anual" ? "minmax(140px, 180px) minmax(120px, 1fr) auto" : "minmax(120px, 1fr) auto", gap: "10px", alignItems: "center", marginBottom: "10px" }}>
            {newEcon.frecuencia === "anual" && (
              <select value={newEcon.aplicacionAnual} onChange={e => setNewEcon(prev => ({ ...prev, aplicacionAnual: e.target.value }))} style={{ ...inp, width: "100%", textAlign: "left", fontSize: "12px" }}>
                <option value="prorrateado">Prorrateado</option>
                <option value="una_vez">1 vez/año</option>
              </select>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
              <span style={{ ...lbl, fontSize: "12px", whiteSpace: "nowrap" }}>Δ</span>
              <input type="number" value={newEcon.delta} step={100} onChange={e => setNewEcon(prev => ({ ...prev, delta: Number(e.target.value) }))} style={{ ...inp, width: "120px" }} />
              <span style={{ ...lbl, fontSize: "12px" }}>€</span>
            </div>
            <button onClick={addEcon} style={{ background: "#166534", color: "#fff", border: "none", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", fontSize: "12px", whiteSpace: "nowrap" }}>+ Añadir</button>
          </div>

          <p style={{ ...lbl, fontSize: "11px", color: "#64748b", margin: "0 0 6px", lineHeight: 1.6 }}>Mensual: se aplica cada mes. Anual: 1 vez/año o prorrateado en 12 meses.</p>
          {cambiosEcon.length === 0 && <p style={{ ...lbl, fontSize: "12px", fontStyle: "italic" }}>Sin cambios programados</p>}
          {cambiosEcon.map((c, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "10px", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #1e293b", fontSize: "13px" }}>
              <span style={{ ...lbl, lineHeight: 1.6 }}>{periodLabel(c.mesInicio, c.mesFin)} · {c.campo} · {c.frecuencia === "anual" ? (c.aplicacionAnual === "prorrateado" ? "anual prorrateado" : "anual 1 vez") : "mensual"} · {formatSigned(c.delta)}</span>
              <button onClick={() => removeEcon(i)} style={{ background: "#7f1d1d", color: "#fca5a5", border: "none", borderRadius: "4px", padding: "2px 8px", cursor: "pointer", fontSize: "11px" }}>✕</button>
            </div>
          ))}
        </div>

        <div style={card}>
          <h3 style={{ color: "#64748b", marginTop: 0, marginBottom: "12px", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>📈 Inversiones</h3>
          <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap", marginBottom: "10px" }}>
            <select value={newInv.modo} onChange={e => setNewInv(prev => ({ ...prev, modo: e.target.value }))} style={{ ...inp, width: "95px", textAlign: "left", fontSize: "12px" }}>
              <option value="anual">Anual</option>
              <option value="mensual">Mensual</option>
            </select>
            <span style={{ ...lbl, fontSize: "12px" }}>Ini:</span>
            <input type="number" value={newInv.anioInicio} min={1} step={1} onChange={e => setNewInv(prev => ({ ...prev, anioInicio: Number(e.target.value) }))} style={{ ...inp, width: "55px" }} />
            {newInv.modo === "mensual" && <input type="number" value={newInv.mesInicio} min={1} max={12} step={1} onChange={e => setNewInv(prev => ({ ...prev, mesInicio: Number(e.target.value) }))} style={{ ...inp, width: "50px" }} />}
            <span style={{ ...lbl, fontSize: "12px" }}>Fin:</span>
            <input type="number" value={newInv.anioFin} min={1} step={1} onChange={e => setNewInv(prev => ({ ...prev, anioFin: Number(e.target.value) }))} style={{ ...inp, width: "55px" }} />
            {newInv.modo === "mensual" && <input type="number" value={newInv.mesFin} min={1} max={12} step={1} onChange={e => setNewInv(prev => ({ ...prev, mesFin: Number(e.target.value) }))} style={{ ...inp, width: "50px" }} />}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={lbl}>Saldo inicial</span>
              <input type="number" value={newInv.saldoInicial} min={0} step={1000} onChange={e => setNewInv(prev => ({ ...prev, saldoInicial: Number(e.target.value) }))} style={{ ...inp, width: "95px" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={lbl}>Aport./mes</span>
              <input type="number" value={newInv.aportacionMensual} min={0} step={50} onChange={e => setNewInv(prev => ({ ...prev, aportacionMensual: Number(e.target.value) }))} style={{ ...inp, width: "95px" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={lbl}>Rentab. anual</span>
              <input type="number" value={newInv.rentabilidadAnual} step={0.1} onChange={e => setNewInv(prev => ({ ...prev, rentabilidadAnual: Number(e.target.value) }))} style={{ ...inp, width: "95px" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={lbl}>Rescate auto</span>
              <input type="checkbox" checked={!!newInv.rescateAutomatico} onChange={e => setNewInv(prev => ({ ...prev, rescateAutomatico: e.target.checked }))} />
            </div>
          </div>
          <button onClick={addInv} style={{ background: "#166534", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 12px", cursor: "pointer", fontSize: "12px" }}>+ Añadir</button>
          <p style={{ ...lbl, fontSize: "11px", color: "#64748b", margin: "10px 0 6px" }}>La inversión no crea caja por sí sola: mueve dinero entre caja e invertido, genera rentabilidad durante su periodo y al final se liquida a caja.</p>
          {inversiones.length === 0 && <p style={{ ...lbl, fontSize: "12px", fontStyle: "italic" }}>Sin inversiones programadas</p>}
          {inversiones.map((inv, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: "1px solid #1e293b", fontSize: "13px" }}>
              <span style={lbl}>{periodLabel(inv.mesInicio, inv.mesFin)} · inicial {fm(inv.saldoInicial)} · {fm(inv.aportacionMensual)}/mes · {inv.rentabilidadAnual}% · {inv.rescateAutomatico ? "rescate auto" : "sin rescate"}</span>
              <button onClick={() => removeInv(i)} style={{ background: "#7f1d1d", color: "#fca5a5", border: "none", borderRadius: "4px", padding: "2px 8px", cursor: "pointer", fontSize: "11px" }}>✕</button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px" }}>
        {[
          ["Cuota inicial", fd(resultado.cuotaInicial) + "/mes", "#38bdf8"],
          ["Duración hipoteca", Math.ceil(resultado.duracionReal / 12) + "a (" + resultado.duracionReal + "m)", "#c084fc"],
          ["Total intereses", fm(resultado.totalIntereses), "#f87171"],
          ["Total pagado", fm(resultado.totalPagado), "#fbbf24"],
          ["Ahorro acum. final", fm(resultado.ahorroFinal), "#4ade80"],
          ["Invertido final", fm(resultado.inversionFinal), "#60a5fa"],
          ["Patrimonio final", fm(resultado.patrimonioFinal), "#22c55e"],
        ].map(([label, val, col], i) => (
          <div key={i} style={{ ...card, padding: "14px", textAlign: "center" }}>
            <div style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", marginBottom: "6px" }}>{label}</div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: col }}>{val}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "4px", background: "#0f172a", borderRadius: "8px", padding: "4px", width: "fit-content" }}>
        {["anual", "mensual"].map(v => (
          <button key={v} onClick={() => setVista(v)}
            style={{ padding: "8px 20px", background: vista === v ? "#f59e0b" : "transparent", color: vista === v ? "#000" : "#64748b", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontFamily: "inherit", fontWeight: vista === v ? 700 : 400, textTransform: "capitalize" }}>
            {v}
          </button>
        ))}
      </div>

      {vista === "anual" && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #334155" }}>
                {["Año", "Cuota/m", "Tipo", "Intereses", "Capital", "Amort.ex", "Aj. econ.", "Inv. aport.", "Inv. neta", "Pendiente", "Caja", "Invertido", "Patrimonio"].map((h, i) => (
                  <th key={i} style={{ padding: "8px 5px", textAlign: i === 0 ? "left" : "right", color: "#64748b", fontSize: "10px", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {resultado.anios.map((a, i) => {
                const isExp = anioExpandido === a.anio;
                const isPost = a.postHipoteca;
                return (
                  <React.Fragment key={i}>
                    <tr onClick={() => setAnioExpandido(isExp ? null : a.anio)}
                      style={{ borderBottom: "1px solid #1e293b", cursor: "pointer", background: isExp ? "#1e293b" : isPost ? "#0a1a0a" : "transparent" }}>
                      <td style={{ padding: "7px 5px", fontWeight: 600, color: isPost ? "#4ade80" : "#e2e8f0" }}>{a.anio}{isPost ? " ✓" : ""}</td>
                      <td style={{ padding: "7px 5px", textAlign: "right", color: "#38bdf8" }}>{a.cuotaMensual > 0 ? fd(a.cuotaMensualFinal) : "—"}</td>
                      <td style={{ padding: "7px 5px", textAlign: "right", color: "#c084fc" }}>{a.tipo > 0 ? a.tipo.toFixed(2) + "%" : "—"}</td>
                      <td style={{ padding: "7px 5px", textAlign: "right", color: "#f87171" }}>{a.interesesTotal > 0 ? fm(a.interesesTotal) : "—"}</td>
                      <td style={{ padding: "7px 5px", textAlign: "right", color: "#4ade80" }}>{a.capitalTotal > 0 ? fm(a.capitalTotal) : "—"}</td>
                      <td style={{ padding: "7px 5px", textAlign: "right", color: a.amortExtraTotal > 0 ? "#fbbf24" : "#475569" }}>{a.amortExtraTotal > 0 ? fm(a.amortExtraTotal) : "—"}</td>
                      <td style={{ padding: "7px 5px", textAlign: "right", color: a.ajusteEconomicoNeto >= 0 ? "#4ade80" : "#f87171" }}>{a.ajusteEconomicoNeto !== 0 ? formatSigned(a.ajusteEconomicoNeto) : "—"}</td>
                      <td style={{ padding: "7px 5px", textAlign: "right", color: (a.inversionInicial + a.inversionAportada) > 0 ? "#93c5fd" : "#64748b" }}>{(a.inversionInicial + a.inversionAportada) !== 0 ? fm(a.inversionInicial + a.inversionAportada) : "—"}</td>
                      <td style={{ padding: "7px 5px", textAlign: "right", color: a.inversionNeta >= 0 ? "#60a5fa" : "#f87171" }}>{a.inversionNeta !== 0 ? formatSigned(a.inversionNeta) : "—"}</td>
                      <td style={{ padding: "7px 5px", textAlign: "right", fontWeight: 700, color: a.capitalPendiente > 0 ? (a.capitalPendiente < 100000 ? "#4ade80" : "#e2e8f0") : "#22c55e" }}>{a.capitalPendiente > 0 ? fm(a.capitalPendiente) : "✓ 0 €"}</td>
                      <td style={{ padding: "7px 5px", textAlign: "right", color: a.cajaFinal >= 0 ? "#4ade80" : "#f87171" }}>{fm(a.cajaFinal)}</td>
                      <td style={{ padding: "7px 5px", textAlign: "right", color: a.inversionSaldo > 0 ? "#60a5fa" : "#64748b" }}>{a.inversionSaldo > 0 ? fm(a.inversionSaldo) : "—"}</td>
                      <td style={{ padding: "7px 5px", textAlign: "right", fontWeight: 700, color: a.patrimonioTotal >= 0 ? "#22c55e" : "#ef4444" }}>{fm(a.patrimonioTotal)}</td>
                    </tr>
                    {isExp && a.meses.map((m, j) => (
                      <tr key={`m${j}`} style={{ background: "#0f172a", borderBottom: "1px solid #0f172a" }}>
                        <td style={{ padding: "3px 5px 3px 20px", color: "#64748b", fontSize: "11px" }}>M{m.mesEnAnio}</td>
                        <td style={{ padding: "3px 5px", textAlign: "right", fontSize: "11px", color: "#38bdf8" }}>{m.cuota > 0 ? fd(m.cuotaSiguiente || m.cuota) : "—"}</td>
                        <td style={{ padding: "3px 5px", textAlign: "right", fontSize: "11px", color: "#c084fc" }}>{m.tipo > 0 ? m.tipo.toFixed(2) + "%" : "—"}</td>
                        <td style={{ padding: "3px 5px", textAlign: "right", fontSize: "11px", color: "#f87171" }}>{m.intereses > 0 ? fd(m.intereses) : "—"}</td>
                        <td style={{ padding: "3px 5px", textAlign: "right", fontSize: "11px", color: "#4ade80" }}>{m.capitalCuota > 0 ? fd(m.capitalCuota) : "—"}</td>
                        <td style={{ padding: "3px 5px", textAlign: "right", fontSize: "11px", color: m.amortExtra > 0 ? "#fbbf24" : "#475569" }}>{m.amortExtra > 0 ? fd(m.amortExtra) : "—"}</td>
                        <td style={{ padding: "3px 5px", textAlign: "right", fontSize: "11px", color: m.ajusteEconomicoNeto >= 0 ? "#4ade80" : "#f87171" }}>{m.ajusteEconomicoNeto !== 0 ? formatSigned(m.ajusteEconomicoNeto) : "—"}</td>
                        <td style={{ padding: "3px 5px", textAlign: "right", fontSize: "11px", color: ((m.inversionInicialMes || 0) + m.inversionAportMes) > 0 ? "#93c5fd" : "#64748b" }}>{((m.inversionInicialMes || 0) + m.inversionAportMes) > 0 ? fd((m.inversionInicialMes || 0) + m.inversionAportMes) : "—"}</td>
                        <td style={{ padding: "3px 5px", textAlign: "right", fontSize: "11px", color: (m.inversionRendMes + m.inversionAportMes - m.inversionRescateMes - m.inversionLiquidacionMes) >= 0 ? "#60a5fa" : "#f87171" }}>{(m.inversionRendMes !== 0 || m.inversionAportMes !== 0 || m.inversionRescateMes !== 0 || m.inversionLiquidacionMes !== 0) ? formatSigned(m.inversionRendMes + m.inversionAportMes - m.inversionRescateMes - m.inversionLiquidacionMes) : "—"}</td>
                        <td style={{ padding: "3px 5px", textAlign: "right", fontSize: "11px" }}>{fm(m.capitalPendiente)}</td>
                        <td style={{ padding: "3px 5px", textAlign: "right", fontSize: "11px", color: m.cajaFinal >= 0 ? "#4ade80" : "#f87171" }}>{fm(m.cajaFinal)}</td>
                        <td style={{ padding: "3px 5px", textAlign: "right", fontSize: "11px", color: m.inversionSaldo > 0 ? "#60a5fa" : "#64748b" }}>{m.inversionSaldo > 0 ? fm(m.inversionSaldo) : "—"}</td>
                        <td style={{ padding: "3px 5px", textAlign: "right", fontSize: "11px", fontWeight: 600, color: m.patrimonioTotal > 0 ? "#22c55e" : "#ef4444" }}>{fm(m.patrimonioTotal)}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {vista === "mensual" && (
        <div style={{ overflowX: "auto", maxHeight: "600px", overflowY: "auto" }}>
          <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse" }}>
            <thead style={{ position: "sticky", top: 0, background: "#020617", zIndex: 1 }}>
              <tr style={{ borderBottom: "2px solid #334155" }}>
                {["Mes", "Año", "Cuota", "Tipo", "Intereses", "Capital", "Amort.ex", "Aj. econ.", "Inv. aport.", "Inv. neta", "Pendiente", "Caja", "Invertido", "Patrimonio"].map((h, i) => (
                  <th key={i} style={{ padding: "5px 4px", textAlign: i <= 1 ? "left" : "right", color: "#64748b", fontSize: "9px", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {resultado.meses.map((m, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #0f172a", background: m.amortExtra > 0 ? "#1a1a0a" : m.postHipoteca ? "#0a1a0a" : "transparent" }}>
                  <td style={{ padding: "3px 4px", fontWeight: 500 }}>{m.mesEnAnio}</td>
                  <td style={{ padding: "3px 4px", color: "#64748b" }}>{m.anio}</td>
                  <td style={{ padding: "3px 4px", textAlign: "right", color: "#38bdf8" }}>{m.cuota > 0 ? fd(m.cuota) : "—"}</td>
                  <td style={{ padding: "3px 4px", textAlign: "right", color: "#c084fc" }}>{m.tipo > 0 ? m.tipo.toFixed(1) + "%" : "—"}</td>
                  <td style={{ padding: "3px 4px", textAlign: "right", color: "#f87171" }}>{m.intereses > 0 ? fd(m.intereses) : "—"}</td>
                  <td style={{ padding: "3px 4px", textAlign: "right", color: "#4ade80" }}>{m.capitalCuota > 0 ? fd(m.capitalCuota) : "—"}</td>
                  <td style={{ padding: "3px 4px", textAlign: "right", color: m.amortExtra > 0 ? "#fbbf24" : "#475569" }}>{m.amortExtra > 0 ? fd(m.amortExtra) : "—"}</td>
                  <td style={{ padding: "3px 4px", textAlign: "right", color: m.ajusteEconomicoNeto >= 0 ? "#4ade80" : "#f87171" }}>{m.ajusteEconomicoNeto !== 0 ? formatSigned(m.ajusteEconomicoNeto) : "—"}</td>
                  <td style={{ padding: "3px 4px", textAlign: "right", color: (m.inversionRendMes + m.inversionAportMes - m.inversionRescateMes - m.inversionLiquidacionMes) >= 0 ? "#60a5fa" : "#f87171" }}>{(m.inversionRendMes !== 0 || m.inversionAportMes !== 0 || m.inversionRescateMes !== 0 || m.inversionLiquidacionMes !== 0) ? formatSigned(m.inversionRendMes + m.inversionAportMes - m.inversionRescateMes - m.inversionLiquidacionMes) : "—"}</td>
                  <td style={{ padding: "3px 4px", textAlign: "right", fontWeight: 500 }}>{m.capitalPendiente > 0 ? fm(m.capitalPendiente) : "✓"}</td>
                  <td style={{ padding: "3px 4px", textAlign: "right", color: m.cajaFinal >= 0 ? "#4ade80" : "#f87171" }}>{fm(m.cajaFinal)}</td>
                  <td style={{ padding: "3px 4px", textAlign: "right", color: m.inversionSaldo > 0 ? "#60a5fa" : "#64748b" }}>{m.inversionSaldo > 0 ? fm(m.inversionSaldo) : "—"}</td>
                  <td style={{ padding: "3px 4px", textAlign: "right", fontWeight: 600, color: m.patrimonioTotal > 0 ? "#22c55e" : "#ef4444" }}>{fm(m.patrimonioTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}