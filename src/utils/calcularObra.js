export function calcular(p) {
  const im = p.tipoInteres / 12;
  const fondosNetos = p.ahorros - p.hipotecaSuelo;
  const gastosPreObra = p.gastosHipoteca + p.gastosBroker;
  const disponibleObra = p.hipoteca - p.primeraDisposicion - p.reservaBanco;
  const retencionConst = p.presupuestoReal * (p.retencionConstructorPct / 100);
  const gap = p.reservaBanco - retencionConst;
  const cuotaSeg = p.seguroTotal / Math.max(p.plazoSeguroMeses, 1);

  // Programar certificaciones: distribuir numCerts certificaciones a lo largo de duracion meses
  // Cada cert cae en un mes concreto, repartidas equitativamente
  const certSchedule = []; // certSchedule[mes] = numero de cert (1-based) o 0
  const certMonths = []; // lista de meses en que hay cert
  for (let c = 1; c <= p.numCerts; c++) {
    const mes = Math.max(1, Math.min(p.duracion, Math.round(c * p.duracion / p.numCerts)));
    certMonths.push(mes);
  }

  const certsConDisp = p.numCerts - 1;
  const dispPorCert = disponibleObra / Math.max(certsConDisp, 1);
  const certMensual = p.presupuestoReal / Math.max(p.numCerts, 1);

  const mesInicioImprev = Math.ceil(p.duracion / 2);
  const mesesImprev = p.duracion - mesInicioImprev + 1;
  const imprevMes = p.imprevistos / Math.max(mesesImprev, 1);

  const mesArq1 = 1, mesArq2 = Math.ceil(p.duracion / 2), mesArq3 = p.duracion;
  const pagoArq = p.arquitecto / 3;
  const mesCocina = Math.max(1, Math.round(p.duracion * 0.7));
  const mesBano = Math.max(1, Math.round(p.duracion * 0.75));

  let filas = [];
  let saldo = fondosNetos, capDisp = 0, intAcum = 0, pagConst = 0, impAcum = 0;

  // PRE-OBRA
  saldo -= gastosPreObra;
  capDisp += p.primeraDisposicion;
  saldo += p.primeraDisposicion;
  filas.push({ mes: "Pre-obra", n: 0, ent: [["1ª disposición (10%)", p.primeraDisposicion]], sal: [["Gastos hipoteca", p.gastosHipoteca], ["Broker+tasación", p.gastosBroker]], saldo, capDisp, intAcum, pagConst, impAcum, alertas: [] });

  let certNum = 0;

  for (let m = 1; m <= p.duracion; m++) {
    let ent = [], sal = [], alertas = [];

    // Ahorro
    saldo += p.ahorroMensual;
    ent.push(["Ahorro neto", p.ahorroMensual]);

    // Intereses carencia
    const intM = capDisp * im;
    intAcum += intM;
    saldo -= intM;
    sal.push(["Intereses carencia", intM]);

    // Seguro
    saldo -= cuotaSeg;
    sal.push(["Cuota seguro", cuotaSeg]);

    // Certificación este mes?
    const certEstaAqui = certMonths.includes(m) && certNum < p.numCerts;
    if (certEstaAqui) {
      // Puede haber más de una cert este mes si numCerts > duracion
      while (certNum < p.numCerts && certMonths[certNum] === m) {
        certNum++;
        const esUltima = certNum === p.numCerts;

        // Disposición banco (todas menos la última)
        if (!esUltima) {
          capDisp += dispPorCert;
          saldo += dispPorCert;
          ent.push([`Disp. banco cert.${certNum}`, dispPorCert]);
        } else {
          ent.push([`Cert.${certNum}: banco retiene 15%`, 0]);
          alertas.push("⚠️ Última cert — banco retiene 15%");
        }

        // Pago constructor
        let pc = certMensual;
        if (certNum <= 2) {
          pc += p.adelantoConstructor;
          sal.push([`Cert.${certNum} constructor`, certMensual]);
          sal.push([`Adelanto cert.${certNum}`, p.adelantoConstructor]);
        } else {
          const totalAdelanto = 2 * p.adelantoConstructor;
          const certsRecup = Math.max(p.numCerts - 2, 1);
          const recup = totalAdelanto / certsRecup;
          pc -= recup;
          sal.push([`Cert.${certNum} (−${Math.round(recup).toLocaleString("es-ES")}€ recup.)`, pc]);
        }
        saldo -= pc;
        pagConst += pc;
      }
    }

    // Arquitecto
    if (m === mesArq1 || m === mesArq2 || m === mesArq3) {
      saldo -= pagoArq;
      sal.push(["Arquitecto", pagoArq]);
    }

    // Cocina / Baño
    if (m === mesCocina) { saldo -= p.cocina; sal.push(["Cocina", p.cocina]); }
    if (m === mesBano) { saldo -= p.bano; sal.push(["Baño", p.bano]); }

    // Imprevistos
    if (m >= mesInicioImprev) {
      saldo -= imprevMes;
      impAcum += imprevMes;
      sal.push(["Imprevistos", imprevMes]);
    }

    if (saldo < 0) alertas.push("🚨 CAJA NEGATIVA");
    else if (saldo < 10000) alertas.push("⚠️ Colchón <10k");
    else if (saldo < 20000) alertas.push("⚡ Colchón <20k");

    filas.push({ mes: `Mes ${m}`, n: m, ent, sal, saldo, capDisp, intAcum, pagConst, impAcum, alertas });
  }

  // FIN OBRA + CFO
  const pend = p.presupuestoReal - pagConst;
  const pagoFinal = Math.max(0, pend - retencionConst);
  const intFin = capDisp * im;
  intAcum += intFin;
  capDisp += p.reservaBanco;
  saldo += p.reservaBanco - pagoFinal - intFin;
  pagConst += pagoFinal;
  filas.push({ mes: "Fin obra+CFO", n: p.duracion + 1, ent: [["Banco libera 15%", p.reservaBanco]], sal: [["Pago constructor→5%", pagoFinal], ["Intereses", intFin]], saldo, capDisp, intAcum, pagConst, impAcum, alertas: ["ℹ️ CFO→banco libera→pago→LPO"] });

  // TRAS LPO
  saldo -= retencionConst;
  pagConst += retencionConst;
  filas.push({ mes: "Tras LPO", n: p.duracion + 2, ent: [], sal: [["Retención 5% constructor", retencionConst]], saldo, capDisp, intAcum, pagConst, impAcum, alertas: saldo < 0 ? ["🚨 CAJA NEGATIVA"] : [] });

  const N = 29 * 12; // 30 años menos 1 de carencia
  const cuotaHipo = p.hipoteca * (im * Math.pow(1 + im, N)) / (Math.pow(1 + im, N) - 1);

  return { filas, cuotaHipo, cuotaSeg, intAcum, fondosNetos, gastosPreObra, disponibleObra, dispPorCert, certMensual, gap, retencionConst, imprevMes, mesInicioImprev, mesesImprev, mesCocina, mesBano, certMonths };
}