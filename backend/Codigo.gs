// =========================================
// CONSTANTES Y CONFIGURACIÓN DE CARPETAS
// =========================================
const SHEET_REPORTE = 'Reporte Taller';
const SHEET_INGRESO = 'Formulario INGRESO';
const SHEET_SALIDA  = 'Formulario SALIDA';
const PAGE_SIZE     = 50;
const CACHE_TTL     = 300;

const FOLDER_ID_INGRESO = '1rjR9HG1GWFVhohO-9bspUhXWAwrhnJvyMaLn5EFaMKXoWxvSeM2bZgvwxq9GYYD1k7mcCa_Y';
const FOLDER_ID_SALIDA  = '1LWZl5O6m6QK6qk0t0JQjdPB3M8O6IXcOlOzdTXhi-Z2ayq6TkRIk9uAPj2jLBTIRqiNrUlHt';
var CALIDAD_SPREADSHEET_ID = '1unOOb82U2T2cwolyjaOimkLHsLaJbR3bpiNhpMsu_Ds';


// =========================================
// ENTRY POINT
// =========================================
function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Sistema de Taller')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// =========================================
// CARGA COMBINADA INICIAL
// =========================================
function getInitialData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss.getSheetByName(SHEET_REPORTE)) throw new Error("No existe la hoja: " + SHEET_REPORTE);
    if (!ss.getSheetByName(SHEET_INGRESO)) throw new Error("No existe la hoja: " + SHEET_INGRESO);
    if (!ss.getSheetByName(SHEET_SALIDA))  throw new Error("No existe la hoja: " + SHEET_SALIDA);
    const reporte = getSheetObjects_(ss.getSheetByName(SHEET_REPORTE));
    const ingreso = getSheetObjects_(ss.getSheetByName(SHEET_INGRESO));
    const salida  = getSheetObjects_(ss.getSheetByName(SHEET_SALIDA));
    return {
      dashboard: buildDashboard_(reporte, ingreso, salida, null),
      equipos:   buildEquipos_(reporte, ingreso, salida, '', {}, {}, 1),
      filtros:   buildFiltros_(reporte)
    };
  } catch (e) {
    throw new Error("Error cargando base de datos: " + e.message);
  }
}

// =========================================
// DASHBOARD
// =========================================
function getDashboardData(rangoFechas) {
  try {
    const ss      = SpreadsheetApp.getActiveSpreadsheet();
    const reporte = getSheetObjects_(ss.getSheetByName(SHEET_REPORTE));
    const ingreso = getSheetObjects_(ss.getSheetByName(SHEET_INGRESO));
    const salida  = getSheetObjects_(ss.getSheetByName(SHEET_SALIDA));
    return buildDashboard_(reporte, ingreso, salida, rangoFechas);
  } catch(e) { throw new Error(e.message); }
}

function buildDashboard_(reporte, ingreso, salida, rangoFechas) {
    var fechaInicio = (rangoFechas && rangoFechas.desdeISO) ? parseISODate_(rangoFechas.desdeISO) : null;
    var fechaFin    = (rangoFechas && rangoFechas.hastaISO) ? parseISODate_(rangoFechas.hastaISO) : null;
  
    var dentroDeRango = function(fechaTexto) {
      if (!fechaInicio && !fechaFin) return true;
      var fecha = parseFlexibleDate_(fechaTexto);
      if (!fecha) return false;
      var t = fecha.getTime();
      if (fechaInicio && t < fechaInicio.getTime()) return false;
      if (fechaFin    && t > fechaFin.getTime())    return false;
      return true;
    };

      var reporteFiltrado = reporte.filter(function(r) {
        return dentroDeRango(r['Fecha de Ingreso'] || r['Fecha Ingreso'] || r['Fecha'] || '');
      });
      var ingresoFiltrado = ingreso.filter(function(r) {
        return dentroDeRango(r['Fecha de Llegada al Taller'] || '');
      });
      var salidaFiltrada = salida.filter(function(r) {
        return dentroDeRango(r['Fecha de Salida del Taller'] || '');
      });
    var reparadosParaTiempo = reporte.filter(function(r) {
      var fechaSalidaTexto =
        r['Fecha Final de Reparación'] ||
        r['Fecha de salida'] ||
        r['Fecha Salida'] ||
        '';
      if (!fechaSalidaTexto) return false;
      return dentroDeRango(fechaSalidaTexto);
    });

  var totalDiasReparacion = 0;
  var totalEquiposConTiempo = 0;
  var tiempoPorModeloMap = {};
    var totalReparadosEnPeriodo = reparadosParaTiempo.length;

  reparadosParaTiempo.forEach(function(r) {
    var dias = calcularDiasReparacion_(r);
    if (dias === null) return;

    var modelo = String(r['Modelo'] || 'Sin modelo').trim() || 'Sin modelo';

    totalDiasReparacion += dias;
    totalEquiposConTiempo++;

    if (!tiempoPorModeloMap[modelo]) {
      tiempoPorModeloMap[modelo] = {
        modelo: modelo,
        totalDias: 0,
        totalEquipos: 0
      };
    }

    tiempoPorModeloMap[modelo].totalDias += dias;
    tiempoPorModeloMap[modelo].totalEquipos++;
  });

  var promedioDiasReparacion = totalEquiposConTiempo > 0
    ? Math.round((totalDiasReparacion / totalEquiposConTiempo) * 10) / 10
    : 0;

  var promedioPorModelo = Object.keys(tiempoPorModeloMap).map(function(k) {
    var item = tiempoPorModeloMap[k];

  return {
    modelo: item.modelo,
    totalEquipos: item.totalEquipos,
    promedioDias: Math.round((item.totalDias / item.totalEquipos) * 10) / 10
  };
  }).sort(function(a, b) {
    return b.promedioDias - a.promedioDias;
  });



  var totalEquipos  = reporteFiltrado.length;
  var operativos    = 0;
  var enReparacion  = 0;
  var listosEntrega = 0;
  var retiroBaja    = 0;   // ← NUEVO grupo
 
  var desgloseMap = {
  total:        {},
  operativos:   {},
  enReparacion: {},
  listosEntrega:{},
  listosCierre: {},   // ← NUEVO
  retiroBaja:   {}
  };
  var porModeloMap = {}, porEstadoMap = {};
 
  reporteFiltrado.forEach(function(r) {
  var s         = normalize_(r['Status'] || r['Estado']);
  var model     = String(r['Modelo'] || 'Sin modelo').trim();
  var est       = String(r['Status'] || r['Estado'] || 'Sin estado').trim();
  var devolverRaw = String(r['Devolver a:'] || r['Devolver a'] || '').trim();
  var devolver    = (devolverRaw === '' || devolverRaw === '-') ? '' : devolverRaw;

  var grupo = null;

  // ── Clasificar por status (basado en fecha de INGRESO, ya filtrada arriba) ──
  if (s.includes('retiro') || s.includes('baja') || s.includes('desecho')) {
    retiroBaja++;
    grupo = 'retiroBaja';

    // Detectar si cerró en el mismo mes que ingresó o en uno posterior
    var fechaFin = parseFlexibleDate_(r['Fecha Final de Reparación'] || r['Fecha de salida'] || r['Fecha Salida'] || '');
    var fechaIng = parseFlexibleDate_(r['Fecha de Ingreso'] || r['Fecha Ingreso'] || r['Fecha'] || '');
    var mesesNombre = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

    var labelBaja;
    if (!fechaFin) {
      labelBaja = 'Sin fecha de cierre';
    } else if (fechaIng && fechaFin.getMonth() === fechaIng.getMonth() && fechaFin.getFullYear() === fechaIng.getFullYear()) {
      labelBaja = 'Cerrado en el mes';
    } else {
      labelBaja = 'Cerrado en ' + mesesNombre[fechaFin.getMonth()];
    }
    desgloseMap['retiroBaja'][labelBaja] = (desgloseMap['retiroBaja'][labelBaja] || 0) + 1;

  } else if (s.includes('espera') || s.includes('reparacion') || s.includes('reparación')) {
    enReparacion++;
    grupo = 'enReparacion';
    var clienteVal = normalize_(r['Cliente'] || '');
    var etiqueta   = clienteVal.includes('eden') ? 'Eden Agua' : 'Cliente';
    desgloseMap['enReparacion'][etiqueta] = (desgloseMap['enReparacion'][etiqueta] || 0) + 1;

  } else if (s.includes('listo') || (s.includes('operativo') && devolver !== '')) {
  listosEntrega++;
  grupo = 'listosEntrega';
  if (devolver === '') devolver = 'Sin clasificar';
  desgloseMap['listosEntrega'][devolver] = (desgloseMap['listosEntrega'][devolver] || 0) + 1;

  // ── Desglose por mes de finalización ──
  var fechaFinLog = parseFlexibleDate_(r['Fecha Final de Reparación'] || r['Fecha de salida'] || r['Fecha Salida'] || '');
  var fechaIngLog = parseFlexibleDate_(r['Fecha de Ingreso'] || r['Fecha Ingreso'] || r['Fecha'] || '');
  var mesesNombreLog = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  var labelCierreLog;
  if (!fechaFinLog) {
    labelCierreLog = 'Sin fecha de cierre';
  } else if (fechaIngLog && fechaFinLog.getMonth() === fechaIngLog.getMonth() && fechaFinLog.getFullYear() === fechaIngLog.getFullYear()) {
    labelCierreLog = 'Finalizados en el mes';
  } else {
    labelCierreLog = 'Finalizados en ' + mesesNombreLog[fechaFinLog.getMonth()];
  }
  desgloseMap['listosCierre'][labelCierreLog] = (desgloseMap['listosCierre'][labelCierreLog] || 0) + 1;
  }
 else if (s.includes('operativo') && devolver === '') {
    operativos++;
    grupo = 'operativos';
  }

  // Desglose total por cliente
  var clienteValTotal = normalize_(r['Cliente'] || '');
  var etiquetaTotal   = clienteValTotal.includes('eden') ? 'Eden Agua' : 'Cliente';
  desgloseMap['total'][etiquetaTotal] = (desgloseMap['total'][etiquetaTotal] || 0) + 1;

  porModeloMap[model] = (porModeloMap[model] || 0) + 1;
  porEstadoMap[est]   = (porEstadoMap[est]   || 0) + 1;
  });

  var ordenarDesglose = function(obj) {
  return Object.keys(obj).map(function(nombre) {
    return { nombre: nombre, total: obj[nombre] };
  }).sort(function(a, b) {
    var aEden = normalize_(a.nombre).includes('eden');
    var bEden = normalize_(b.nombre).includes('eden');
    if (aEden && !bEden) return -1;
    if (!aEden && bEden) return 1;
    return a.nombre.localeCompare(b.nombre, 'es');
  });
  };
// ── Finalizados en el mes actual + rezagados ──
var mesesNombreFin = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

var mesActualKey = null, mesActualLabel = '';
if (fechaFin) {
  mesActualKey = fechaFin.getFullYear() + '-' + String(fechaFin.getMonth()+1).padStart(2,'0');
  mesActualLabel = mesesNombreFin[fechaFin.getMonth()] + ' ' + fechaFin.getFullYear();
} else {
  var maxKey = '';
  reporte.forEach(function(r) {
    var fs = parseFlexibleDate_(r['Fecha Final de Reparación'] || r['Fecha de salida'] || r['Fecha Salida'] || '');
    if (!fs) return;
    var k = fs.getFullYear() + '-' + String(fs.getMonth()+1).padStart(2,'0');
    if (k > maxKey) { maxKey = k; mesActualKey = k; mesActualLabel = mesesNombreFin[fs.getMonth()] + ' ' + fs.getFullYear(); }
  });
}

// Columna del mes actual: TODOS los ingresos del período (reporteFiltrado)
var totalEquiposMesActualEden = 0, totalEquiposMesActualCli = 0;
reporteFiltrado.forEach(function(r) {
  if (normalize_(r['Cliente'] || '').includes('eden')) totalEquiposMesActualEden++;
  else totalEquiposMesActualCli++;
});
var finalizadosMesActual = {
  key: mesActualKey,
  label: mesActualLabel,
  total: reporteFiltrado.length,
  eden: totalEquiposMesActualEden,
  cliente: totalEquiposMesActualCli
};

// Rezagados: equipos que SALIERON en el mes actual pero INGRESARON en meses anteriores
var rezagadosPorIngreso = {};
reporte.forEach(function(r) {
  var fechaFinR = parseFlexibleDate_(r['Fecha Final de Reparación'] || r['Fecha de salida'] || r['Fecha Salida'] || '');
  if (!fechaFinR || !mesActualKey) return;
  var keyFin = fechaFinR.getFullYear() + '-' + String(fechaFinR.getMonth()+1).padStart(2,'0');
  if (keyFin !== mesActualKey) return;

  var fechaIngR = parseFlexibleDate_(r['Fecha de Ingreso'] || r['Fecha Ingreso'] || r['Fecha'] || '');
  if (!fechaIngR) return;
  var keyIng = fechaIngR.getFullYear() + '-' + String(fechaIngR.getMonth()+1).padStart(2,'0');
  if (keyIng >= mesActualKey) return; // solo meses anteriores

  var labelIng = mesesNombreFin[fechaIngR.getMonth()] + ' ' + fechaIngR.getFullYear();
  if (!rezagadosPorIngreso[keyIng]) {
    rezagadosPorIngreso[keyIng] = { key: keyIng, label: labelIng, total: 0, eden: 0, cliente: 0 };
  }
  rezagadosPorIngreso[keyIng].total++;
  if (normalize_(r['Cliente'] || '').includes('eden')) rezagadosPorIngreso[keyIng].eden++;
  else rezagadosPorIngreso[keyIng].cliente++;
});

var rezagadosMesActual = Object.keys(rezagadosPorIngreso)
  .sort().reverse()
  .map(function(k) { return rezagadosPorIngreso[k]; });

var totalFinalizadosMesActual = finalizadosMesActual.total + rezagadosMesActual.reduce(function(s, r) { return s + r.total; }, 0);

// ── Equipos que ingresaron en el mes actual pero salieron DESPUÉS ──
var salidaPosteriores = {};
reporte.forEach(function(r) {
  var fechaIngR = parseFlexibleDate_(r['Fecha de Ingreso'] || r['Fecha Ingreso'] || r['Fecha'] || '');
  if (!fechaIngR || !mesActualKey) return;
  var keyIng = fechaIngR.getFullYear() + '-' + String(fechaIngR.getMonth()+1).padStart(2,'0');
  if (keyIng !== mesActualKey) return;

  var fechaFinR = parseFlexibleDate_(r['Fecha Final de Reparación'] || r['Fecha de salida'] || r['Fecha Salida'] || '');
  if (!fechaFinR) return;
  var keyFin = fechaFinR.getFullYear() + '-' + String(fechaFinR.getMonth()+1).padStart(2,'0');
  if (keyFin <= mesActualKey) return;

  var labelFin = mesesNombreFin[fechaFinR.getMonth()] + ' ' + fechaFinR.getFullYear();
  if (!salidaPosteriores[keyFin]) {
    salidaPosteriores[keyFin] = { label: labelFin, total: 0 };
  }
  salidaPosteriores[keyFin].total++;
});

var finalizadosPosteriores = Object.keys(salidaPosteriores)
  .sort()
  .map(function(k) { return salidaPosteriores[k]; });


  // ── Entregados a logística: por mes de ingreso + desglose "Devolver a:" ──
var entregadosPorIngreso = {};
var totalEntregadosMesActual = 0;

reporte.forEach(function(r) {
  var s = normalize_(r['Status'] || r['Estado'] || '');
  var devolverRaw = String(r['Devolver a:'] || r['Devolver a'] || '').trim();
  var devolver = (devolverRaw === '' || devolverRaw === '-') ? '' : devolverRaw;

  var esEntregado = s.includes('listo') || (s.includes('operativo') && devolver !== '');
  if (!esEntregado) return;

  var fechaFinR = parseFlexibleDate_(r['Fecha Final de Reparación'] || r['Fecha de salida'] || r['Fecha Salida'] || '');
  if (!fechaFinR || !mesActualKey) return;
  var keyFin = fechaFinR.getFullYear() + '-' + String(fechaFinR.getMonth()+1).padStart(2,'0');
  if (keyFin !== mesActualKey) return;

  totalEntregadosMesActual++;

  var fechaIngR = parseFlexibleDate_(r['Fecha de Ingreso'] || r['Fecha Ingreso'] || r['Fecha'] || '');
  if (!fechaIngR) return;
  var keyIng = fechaIngR.getFullYear() + '-' + String(fechaIngR.getMonth()+1).padStart(2,'0');
  var labelIng = mesesNombreFin[fechaIngR.getMonth()] + ' ' + fechaIngR.getFullYear();

  if (!entregadosPorIngreso[keyIng]) {
    entregadosPorIngreso[keyIng] = { key: keyIng, label: labelIng, total: 0, devolver: {} };
  }
  entregadosPorIngreso[keyIng].total++;
  var dev = devolver === '' ? 'Sin clasificar' : devolver;
  entregadosPorIngreso[keyIng].devolver[dev] = (entregadosPorIngreso[keyIng].devolver[dev] || 0) + 1;
});

Object.keys(entregadosPorIngreso).forEach(function(k) {
  var d = entregadosPorIngreso[k].devolver;
  entregadosPorIngreso[k].desgloseDevolver = Object.keys(d).map(function(nombre) {
    return { nombre: nombre, total: d[nombre] };
  }).sort(function(a,b){ return b.total - a.total; });
});

var entregadosMesActual = entregadosPorIngreso[mesActualKey] || null;
var rezagadosEntregados = Object.keys(entregadosPorIngreso)
  .filter(function(k) { return k !== mesActualKey; })
  .sort().reverse()
  .map(function(k) { return entregadosPorIngreso[k]; });

  // ── En reparación: por tipo (Cliente / Eden Agua) + desglose por modelo ──
var reparacionCliente = { total: 0, modelos: {} };
var reparacionEden    = { total: 0, modelos: {} };

reporteFiltrado.forEach(function(r) {
  var s = normalize_(r['Status'] || r['Estado'] || '');
  if (!(s.includes('espera') || s.includes('reparacion') || s.includes('reparación'))) return;

  var modelo = String(r['Modelo'] || 'Sin modelo').trim();
  var esEden = normalize_(r['Cliente'] || '').includes('eden');
  var grupo = esEden ? reparacionEden : reparacionCliente;
  grupo.total++;
  grupo.modelos[modelo] = (grupo.modelos[modelo] || 0) + 1;
});

var _mapModelos = function(obj) {
  return Object.keys(obj.modelos).map(function(m) {
    return { nombre: m, total: obj.modelos[m] };
  }).sort(function(a, b) { return b.total - a.total; });
};

var reparacionDesglose = {
  cliente: { total: reparacionCliente.total, modelos: _mapModelos(reparacionCliente) },
  eden:    { total: reparacionEden.total,    modelos: _mapModelos(reparacionEden) }
};

// ── De Baja: mes actual + rezagados, desglose por modelo ──
var bajaPorIngreso = {};
var totalBajaMesActual = 0;

reporte.forEach(function(r) {
  var s = normalize_(r['Status'] || r['Estado'] || '');
  if (!(s.includes('retiro') || s.includes('baja') || s.includes('desecho'))) return;

  var fechaFinR = parseFlexibleDate_(r['Fecha Final de Reparación'] || r['Fecha de salida'] || r['Fecha Salida'] || '');
  if (!fechaFinR || !mesActualKey) return;
  var keyFin = fechaFinR.getFullYear() + '-' + String(fechaFinR.getMonth()+1).padStart(2,'0');
  if (keyFin !== mesActualKey) return;

  totalBajaMesActual++;

  var fechaIngR = parseFlexibleDate_(r['Fecha de Ingreso'] || r['Fecha Ingreso'] || r['Fecha'] || '');
  if (!fechaIngR) return;
  var keyIng = fechaIngR.getFullYear() + '-' + String(fechaIngR.getMonth()+1).padStart(2,'0');
  var labelIng = mesesNombreFin[fechaIngR.getMonth()] + ' ' + fechaIngR.getFullYear();

  if (!bajaPorIngreso[keyIng]) {
    bajaPorIngreso[keyIng] = { key: keyIng, label: labelIng, total: 0, modelos: {} };
  }
  bajaPorIngreso[keyIng].total++;
  var modelo = String(r['Modelo'] || 'Sin modelo').trim();
  bajaPorIngreso[keyIng].modelos[modelo] = (bajaPorIngreso[keyIng].modelos[modelo] || 0) + 1;
});

Object.keys(bajaPorIngreso).forEach(function(k) {
  var m = bajaPorIngreso[k].modelos;
  bajaPorIngreso[k].desgloseModelos = Object.keys(m).map(function(nombre) {
    return { nombre: nombre, total: m[nombre] };
  }).sort(function(a,b){ return b.total - a.total; });
});

var bajaMesActual = bajaPorIngreso[mesActualKey] || null;
var rezagadosBaja = Object.keys(bajaPorIngreso)
  .filter(function(k) { return k !== mesActualKey; })
  .sort().reverse()
  .map(function(k) { return bajaPorIngreso[k]; });

// ── Equipos finalizados fuera del mes: por mes de salida + Cliente/Eden + modelos ──
var fueraDelMesPorSalida = {};
var totalFueraDelMes = 0;

reporte.forEach(function(r) {
  var fechaIngR = parseFlexibleDate_(r['Fecha de Ingreso'] || r['Fecha Ingreso'] || r['Fecha'] || '');
  if (!fechaIngR || !mesActualKey) return;
  var keyIng = fechaIngR.getFullYear() + '-' + String(fechaIngR.getMonth()+1).padStart(2,'0');
  if (keyIng !== mesActualKey) return;

  var fechaFinR = parseFlexibleDate_(r['Fecha Final de Reparación'] || r['Fecha de salida'] || r['Fecha Salida'] || '');
  if (!fechaFinR) return;
  var keyFin = fechaFinR.getFullYear() + '-' + String(fechaFinR.getMonth()+1).padStart(2,'0');
  if (keyFin <= mesActualKey) return;

  totalFueraDelMes++;
  var labelFin = mesesNombreFin[fechaFinR.getMonth()] + ' ' + fechaFinR.getFullYear();
  if (!fueraDelMesPorSalida[keyFin]) {
    fueraDelMesPorSalida[keyFin] = { label: labelFin, total: 0, cliente: { total: 0, modelos: {} }, eden: { total: 0, modelos: {} } };
  }
  var entry = fueraDelMesPorSalida[keyFin];
  entry.total++;

  var modelo = String(r['Modelo'] || 'Sin modelo').trim();
  var esEden = normalize_(r['Cliente'] || '').includes('eden');
  var grupo = esEden ? entry.eden : entry.cliente;
  grupo.total++;
  grupo.modelos[modelo] = (grupo.modelos[modelo] || 0) + 1;
});

var fueraDelMesMeses = Object.keys(fueraDelMesPorSalida).sort().map(function(k) {
  var e = fueraDelMesPorSalida[k];
  var mapModelos = function(obj) {
    return Object.keys(obj.modelos).map(function(m) { return { nombre: m, total: obj.modelos[m] }; }).sort(function(a,b){ return b.total - a.total; });
  };
  return {
    label: e.label, total: e.total,
    cliente: { total: e.cliente.total, modelos: mapModelos(e.cliente) },
    eden: { total: e.eden.total, modelos: mapModelos(e.eden) }
  };
});
  return {
    resumen: {
      totalEquipos,
      operativos,
      enReparacion,
      listosEntrega,
      retiroBaja,
      promedioDiasReparacion: promedioDiasReparacion,
      totalEquiposConTiempo: totalEquiposConTiempo,
      promedioPorModelo: promedioPorModelo,
      desgloseTotal:      ordenarDesglose(desgloseMap.total),
      desgloseOperativos: ordenarDesglose(desgloseMap.operativos),
      desgloseReparacion: ordenarDesglose(desgloseMap.enReparacion),
      desgloseListos:     ordenarDesglose(desgloseMap.listosEntrega),
      desgloseListosCierre: ordenarDesglose(desgloseMap.listosCierre),
      desgloseRetiroBaja: ordenarDesglose(desgloseMap.retiroBaja),
      totalFinalizadosMesActual: totalFinalizadosMesActual,
      mesActualLabel: mesActualLabel,
      finalizadosMesActual: finalizadosMesActual,
      rezagadosMesActual: rezagadosMesActual,
      finalizadosPosteriores: finalizadosPosteriores,
      totalEntregadosMesActual: totalEntregadosMesActual,
      entregadosMesActual: entregadosMesActual,
      rezagadosEntregados: rezagadosEntregados,
      reparacionDesglose: reparacionDesglose,
      totalBajaMesActual: totalBajaMesActual,
      bajaMesActual: bajaMesActual,
      rezagadosBaja: rezagadosBaja,
      totalFueraDelMes: totalFueraDelMes,
          totalReparadosEnPeriodo: totalReparadosEnPeriodo,
      fueraDelMesMeses: fueraDelMesMeses
    },
    porModelo:       Object.keys(porModeloMap).map(function(k){ return { nombre:k, total:porModeloMap[k] }; }),
    porEstado:       Object.keys(porEstadoMap).map(function(k){ return { nombre:k, total:porEstadoMap[k] }; }),
    ultimosIngresos: ingresoFiltrado.slice(-10).reverse(),
    ultimasSalidas:  salidaFiltrada.slice(-10).reverse()
  };
}


// =========================================
// DATOS PARA GRÁFICOS
// =========================================
function getChartsData(rangoFechas) {
  try {
    const ss      = SpreadsheetApp.getActiveSpreadsheet();
    const reporte = getSheetObjects_(ss.getSheetByName(SHEET_REPORTE));
    const fechaInicio = (rangoFechas && rangoFechas.desdeISO) ? parseISODate_(rangoFechas.desdeISO) : null;
    const fechaFin    = (rangoFechas && rangoFechas.hastaISO) ? parseISODate_(rangoFechas.hastaISO) : null;
    const dentroDeRango = (fechaTexto) => {
      if (!fechaInicio && !fechaFin) return true;
      const fecha = parseFlexibleDate_(fechaTexto);
      if (!fecha) return false;
      const t = fecha.getTime();
      if (fechaInicio && t < fechaInicio.getTime()) return false;
      if (fechaFin    && t > fechaFin.getTime())    return false;
      return true;
    };
    const reporteFiltrado = reporte.filter(r => dentroDeRango(r['Fecha de Ingreso'] || r['Fecha Ingreso'] || r['Fecha'] || ''));

    // ── Dona: status de salida (todos los que SALIERON en el período) ──
    const devolverMap = {};
    reporte.forEach(r => {
      const devolver = String(r['Devolver a:'] || r['Devolver a'] || '').trim();
      if (!devolver || devolver === '-') return;
      const fechaRep = r['Fecha Final de Reparación'] || r['Fecha de salida'] || r['Fecha Salida'] || '';
      const f = parseFlexibleDate_(fechaRep);
      if (!f) return;
      const t = f.getTime();
      if (fechaInicio && t < fechaInicio.getTime()) return;
      if (fechaFin    && t > fechaFin.getTime())    return;
      devolverMap[devolver] = (devolverMap[devolver] || 0) + 1;
    });
    const donaData = Object.entries(devolverMap).map(([nombre, total]) => ({ nombre, total })).sort((a, b) => b.total - a.total);

    // ── Modelos ───────────────────────────────────────────────
    const modeloMap = {};
    reporteFiltrado.forEach(r => {
      const m = String(r['Modelo'] || '').trim();
      if (m && m !== '-') modeloMap[m] = (modeloMap[m] || 0) + 1;
    });
    const modelosData = Object.entries(modeloMap).map(([nombre, total]) => ({ nombre, total })).sort((a, b) => b.total - a.total);

    // ── Fallas (cuenta por mes de SALIDA, incluye rezagados) ──
    const fallaMap = {};
    const _excluirFalla = function(f) {
      const n = normalize_(f);
      return !f || f === '-' || n === 'ninguna' || n === '' ||
             n.includes('recuperacion de componentes') || n.includes('recuperación de componentes');
    };
    reporte.forEach(r => {
      const fSal = parseFlexibleDate_(r['Fecha Final de Reparación'] || r['Fecha de salida'] || r['Fecha Salida'] || '');
      if (!fSal) return;
      const t = fSal.getTime();
      if (fechaInicio && t < fechaInicio.getTime()) return;
      if (fechaFin    && t > fechaFin.getTime())    return;

      const f = String(r['Falla'] || '').trim();
      if (_excluirFalla(f)) return;
      fallaMap[f] = (fallaMap[f] || 0) + 1;
    });
    const fallasData = Object.entries(fallaMap).map(([nombre, total]) => ({ nombre, total })).sort((a, b) => b.total - a.total);
    // ── Motivos de ingreso: mes actual + rezagados (por mes de salida) ──
    var _mesActualKey = fechaFin
      ? fechaFin.getFullYear() + '-' + String(fechaFin.getMonth()+1).padStart(2,'0')
      : null;
    if (!_mesActualKey) {
      var _maxK = '';
      reporte.forEach(function(r) {
        var fs = parseFlexibleDate_(r['Fecha Final de Reparación'] || r['Fecha de salida'] || r['Fecha Salida'] || '');
        if (!fs) return;
        var k = fs.getFullYear() + '-' + String(fs.getMonth()+1).padStart(2,'0');
        if (k > _maxK) { _maxK = k; _mesActualKey = k; }
      });
    }

    var motivoMesActual = {};
    var motivoRezagados = {};

    reporte.forEach(function(r) {
      var m = String(r['Motivo de ingreso de dispensador usado'] || r['Motivo de ingreso'] || r['Motivo Ingreso'] || '').trim();
      if (!m || m === '-') return;

      var fIng = parseFlexibleDate_(r['Fecha de Ingreso'] || r['Fecha Ingreso'] || r['Fecha'] || '');
      var fSal = parseFlexibleDate_(r['Fecha Final de Reparación'] || r['Fecha de salida'] || r['Fecha Salida'] || '');
      if (!fIng) return;
      var kIng = fIng.getFullYear() + '-' + String(fIng.getMonth()+1).padStart(2,'0');

      if (kIng === _mesActualKey) {
        // Ingresó en el mes actual
        motivoMesActual[m] = (motivoMesActual[m] || 0) + 1;
      } else if (fSal) {
        // Ingresó antes pero salió en el mes actual = rezagado
        var kSal = fSal.getFullYear() + '-' + String(fSal.getMonth()+1).padStart(2,'0');
        if (kSal === _mesActualKey) {
          motivoRezagados[m] = (motivoRezagados[m] || 0) + 1;
        }
      }
    });

    var _toArr = function(obj) {
      return Object.keys(obj).map(function(nombre) { return { nombre: nombre, total: obj[nombre] }; }).sort(function(a,b){ return b.total - a.total; });
    };

    var motivosData = {
      mesActual: _toArr(motivoMesActual),
      rezagados: _toArr(motivoRezagados),
      totalMesActual: Object.keys(motivoMesActual).reduce(function(s,k){ return s + motivoMesActual[k]; }, 0),
      totalRezagados: Object.keys(motivoRezagados).reduce(function(s,k){ return s + motivoRezagados[k]; }, 0)
    };
    
    // ── Clientes vs Eden Agua vs Baja por mes de SALIDA (con rezagados) ──
    var ceMap = {};
    var _getCE = function(key) {
      if (!ceMap[key]) ceMap[key] = { cliMes:0, cliRez:0, edenMes:0, edenRez:0, bajaMes:0, bajaRez:0 };
      return ceMap[key];
    };

    reporte.forEach(function(r) {
      var fSal = parseFlexibleDate_(r['Fecha Final de Reparación'] || r['Fecha de salida'] || r['Fecha Salida'] || '');
      if (!fSal) return;
      var tSal = fSal.getTime();
      if (fechaInicio && tSal < fechaInicio.getTime()) return;
      if (fechaFin && tSal > fechaFin.getTime()) return;

      var key = fSal.getFullYear() + '-' + String(fSal.getMonth()+1).padStart(2,'0');
      var e = _getCE(key);

      var fIng = parseFlexibleDate_(r['Fecha de Ingreso'] || r['Fecha Ingreso'] || r['Fecha'] || '');
      var mismoMes = fIng && fIng.getFullYear() === fSal.getFullYear() && fIng.getMonth() === fSal.getMonth();

      var s = normalize_(r['Status'] || r['Estado'] || '');
      var esBaja = s.includes('retiro') || s.includes('baja') || s.includes('desecho');
      var esEden = normalize_(r['Cliente'] || '').includes('eden');

      if (esBaja) {
        if (mismoMes) e.bajaMes++; else e.bajaRez++;
      } else if (esEden) {
        if (mismoMes) e.edenMes++; else e.edenRez++;
      } else {
        if (mismoMes) e.cliMes++; else e.cliRez++;
      }
    });

    var _mCE = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    var clienteEdenData = Object.keys(ceMap).sort().slice(-12).map(function(k) {
      var p = k.split('-'); var d = ceMap[k];
      return {
        mes: _mCE[parseInt(p[1])-1] + ' ' + p[0].slice(2),
        cliMes: d.cliMes, cliRez: d.cliRez,
        edenMes: d.edenMes, edenRez: d.edenRez,
        bajaMes: d.bajaMes, bajaRez: d.bajaRez
      };
    });

    return { donaData, modelosData, fallasData, motivosData, clienteEdenData };
  } catch(e) { throw new Error(e.message); }
}

function getEquiposPorFalla(falla, rangoFechas) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var reporte = getSheetObjects_(ss.getSheetByName(SHEET_REPORTE));

    var fechaInicio = (rangoFechas && rangoFechas.desdeISO) ? parseISODate_(rangoFechas.desdeISO) : null;
    var fechaFin    = (rangoFechas && rangoFechas.hastaISO) ? parseISODate_(rangoFechas.hastaISO) : null;

    var dentroDeRango = function(fechaTexto) {
      if (!fechaInicio && !fechaFin) return true;
      var fecha = parseFlexibleDate_(fechaTexto);
      if (!fecha) return false;
      var t = fecha.getTime();
      if (fechaInicio && t < fechaInicio.getTime()) return false;
      if (fechaFin    && t > fechaFin.getTime())    return false;
      return true;
    };

    var fallaBuscada = normalize_(falla || '');
    var resultados = [];

    reporte.forEach(function(r) {
      var fechaIng = r['Fecha de Ingreso'] || r['Fecha Ingreso'] || r['Fecha'] || '';
      var fechaSal = r['Fecha Final de Reparación'] || r['Fecha de salida'] || r['Fecha Salida'] || '';
      if (!dentroDeRango(fechaSal)) return;
      if (normalize_(r['Falla'] || '') !== fallaBuscada) return;

      resultados.push({
        serie:        r['Nro Serie'] || r['N° Serie'] || r['Serie'] || '-',
        modelo:       r['Modelo'] || '-',
        cliente:      r['Cliente'] || '-',
        estado:       r['Status'] || r['Estado'] || '-',
        fechaIngreso: fechaIng || '-',
        fechaSalida:  fechaSal || '-'
      });
    });

    return resultados;
  } catch(e) { throw new Error('[getEquiposPorFalla] ' + e.message); }
}
function getEquiposReparadosPorMes(rangoFechas) {
  try {
    var ss      = SpreadsheetApp.getActiveSpreadsheet();
    var reporte = getSheetObjects_(ss.getSheetByName(SHEET_REPORTE));
    var mesesNombre = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

    var fechaInicio = (rangoFechas && rangoFechas.desdeISO) ? parseISODate_(rangoFechas.desdeISO) : null;
    var fechaFin    = (rangoFechas && rangoFechas.hastaISO) ? parseISODate_(rangoFechas.hastaISO) : null;

    var porMesSalida = {};
    reporte.forEach(function(r) {
      var fechaSal = parseFlexibleDate_(
        r['Fecha Final de Reparación'] || r['Fecha de salida'] || r['Fecha Salida'] || ''
      );
      if (!fechaSal) return;

      if (fechaInicio && fechaSal.getTime() < fechaInicio.getTime()) return;
      if (fechaFin    && fechaSal.getTime() > fechaFin.getTime())    return;

      var keySal = fechaSal.getFullYear() + '-' + String(fechaSal.getMonth()+1).padStart(2,'0');
      if (!porMesSalida[keySal]) porMesSalida[keySal] = [];
      porMesSalida[keySal].push(r);
    });

    var mesesSalida = Object.keys(porMesSalida).sort().slice(-12);

    return mesesSalida.map(function(keySal) {
      var equipos = porMesSalida[keySal];
      var parts   = keySal.split('-');
      var label   = mesesNombre[parseInt(parts[1])-1] + ' ' + parts[0].slice(2);

      var porIngreso = {};
      equipos.forEach(function(r) {
        var fechaIng = parseFlexibleDate_(r['Fecha de Ingreso'] || r['Fecha Ingreso'] || r['Fecha'] || '');
        if (!fechaIng) return;
        var keyIng = fechaIng.getFullYear() + '-' + String(fechaIng.getMonth()+1).padStart(2,'0');
        if (!porIngreso[keyIng]) porIngreso[keyIng] = { total: 0, eden: 0, cliente: 0 };
        porIngreso[keyIng].total++;
        var esEden = normalize_(r['Cliente'] || '').includes('eden');
        if (esEden) porIngreso[keyIng].eden++;
        else porIngreso[keyIng].cliente++;
      });

      var desglose = Object.keys(porIngreso).sort().map(function(k) {
        var p = k.split('-');
        var d = porIngreso[k];
        return {
          mes: mesesNombre[parseInt(p[1])-1] + ' ' + p[0].slice(2),
          key: k,
          total: d.total,
          eden: d.eden,
          cliente: d.cliente
        };
      });

      // Totales Eden/Cliente del mes de salida
      var totalEden = 0, totalCliente = 0;
      equipos.forEach(function(r) {
        if (normalize_(r['Cliente'] || '').includes('eden')) totalEden++;
        else totalCliente++;
      });

      return {
        mes: label, key: keySal, total: equipos.length,
        eden: totalEden, cliente: totalCliente,
        desglose: desglose
      };
    });
  } catch(e) { throw new Error(e.message); }
}
// =========================================
// EQUIPOS / BÚSQUEDA
// =========================================
function getEquipos(filtro, filtrosAvanzados, rangoFechas, page) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const hojaReporte = ss.getSheetByName(SHEET_REPORTE);
    if (!hojaReporte) throw new Error('No se encontró la hoja: ' + SHEET_REPORTE);
    const reporte = getSheetObjects_(hojaReporte);
    const fichaFiltroCruda  = normalize_((filtrosAvanzados && filtrosAvanzados.ficha) || '');
    const fichaFiltroLimpia = stripLeadingZeros_(fichaFiltroCruda);
    const needForms = fichaFiltroLimpia !== '';
    const ingreso = needForms ? getSheetObjects_(ss.getSheetByName(SHEET_INGRESO)) : [];
    const salida  = needForms ? getSheetObjects_(ss.getSheetByName(SHEET_SALIDA))  : [];
    return buildEquipos_(reporte, ingreso, salida, filtro, filtrosAvanzados, rangoFechas, page);
  } catch(e) { throw new Error(e.message); }
}

function buildEquipos_(reporte, ingreso, salida, filtro, filtrosAvanzados, rangoFechas, page) {
  const query         = normalize_(filtro || '');
  const currentPage   = Math.max(Number(page || 1), 1);
  const modeloFiltro      = normalize_((filtrosAvanzados && filtrosAvanzados.modelo)      || '');
  const estadoFiltro      = normalize_((filtrosAvanzados && filtrosAvanzados.estado)      || '');
  const fallaFiltro       = normalize_((filtrosAvanzados && filtrosAvanzados.falla)       || '');
  const tipoClienteFiltro = normalize_((filtrosAvanzados && filtrosAvanzados.tipoCliente) || '');
  const fichaFiltroCruda  = normalize_((filtrosAvanzados && filtrosAvanzados.ficha) || '');
  const fichaFiltroLimpia = stripLeadingZeros_(fichaFiltroCruda);
  const fechaInicio = (rangoFechas && rangoFechas.desdeISO) ? parseISODate_(rangoFechas.desdeISO) : null;
  const fechaFin    = (rangoFechas && rangoFechas.hastaISO) ? parseISODate_(rangoFechas.hastaISO) : null;

  const seriesEncontradasEnForms = new Map();
  if (fichaFiltroLimpia !== '') {
    ingreso.forEach(row => {
      const numFicha = stripLeadingZeros_(normalize_(row['Numero de Ficha de Ingreso'] || ''));
      if (numFicha === fichaFiltroLimpia) {
        const serie = String(row['Serie del Producto'] || row['Serie'] || '').trim();
        if (serie) seriesEncontradasEnForms.set(normalize_(serie), { serieVirtual: serie, tipo: 'ingreso', row });
      }
    });
    salida.forEach(row => {
      const numFicha = stripLeadingZeros_(normalize_(row['Numero de Ficha de Salida'] || row['Número de Ficha de Salida'] || ''));
      if (numFicha === fichaFiltroLimpia) {
        const serie = String(row['Serie del Producto'] || row['Serie'] || '').trim();
        if (serie) seriesEncontradasEnForms.set(normalize_(serie), { serieVirtual: serie, tipo: 'salida', row });
      }
    });
  }

  const seriesYaEnReporte = new Set();
  let filtrados = reporte.filter(r => {
    const fechaTexto = r['Fecha de Ingreso'] || r['Fecha Ingreso'] || r['Fecha'] || '';
    const serie      = r['Nro Serie'] || r['N° Serie'] || r['Serie'] || '';
    const serieNorm  = normalize_(serie);
    const modelo     = r['Modelo'] || '';
    const color      = r['Color']  || '';
    const status     = r['Status'] || r['Estado'] || '';
    const falla      = r['Falla']  || '';
    const tecnico    = r['Técnico que entrega equipo a Taller'] || r['Tecnico que entrega equipo a Taller'] || '';
    const cliente    = r['Cliente'] || '';

    if (modeloFiltro && normalize_(modelo) !== modeloFiltro) return false;
    if (estadoFiltro && normalize_(status) !== estadoFiltro) return false;
    if (fallaFiltro  && normalize_(falla)  !== fallaFiltro)  return false;
    if (tipoClienteFiltro === 'eden'    && !normalize_(cliente).includes('eden')) return false;
    if (tipoClienteFiltro === 'cliente' &&  normalize_(cliente).includes('eden')) return false;

    if (query) {
      const texto = [fechaTexto, cliente, serie, modelo, color, status, falla, tecnico].join(' | ');
      if (!normalize_(texto).includes(query)) return false;
    }

if (fichaFiltroLimpia !== '') {
  const fichaIng = stripLeadingZeros_(normalize_(
    r['Ficha de ingreso'] ||
    r['Ficha ingreso'] ||
    r['Ficha Ingreso'] ||
    r['Numero de Ficha de Ingreso'] ||
    ''
  ));

  const fichaSal = stripLeadingZeros_(normalize_(
    r['Ficha reparación'] ||
    r['Ficha de reparación'] ||
    r['Ficha Reparación'] ||
    r['Ficha Salida'] ||
    r['Numero de Ficha de Salida'] ||
    ''
  ));

  const coincideFichaIngreso = fichaIng === fichaFiltroLimpia;
  const coincideFichaSalida  = fichaSal === fichaFiltroLimpia;

  if (!coincideFichaIngreso && !coincideFichaSalida) return false;
}

    if (fechaInicio || fechaFin) {
      const fechaRegistro = parseFlexibleDate_(fechaTexto);
      if (!fechaRegistro) return false;
      const t = fechaRegistro.getTime();
      if (fechaInicio && t < fechaInicio.getTime()) return false;
      if (fechaFin    && t > fechaFin.getTime())    return false;
    }

    seriesYaEnReporte.add(normalize_(serie));
    return true;
  });

  if (fichaFiltroLimpia !== '') {
    seriesEncontradasEnForms.forEach((data, serieNorm) => {
      if (!seriesYaEnReporte.has(serieNorm)) {
        filtrados.push({
          'Fecha de Ingreso': '-', 'Cliente': data.row['Cliente o Eden Agua'] || '-',
          'Nro Serie': data.serieVirtual, 'Modelo': data.row['Modelo'] || '-',
          'Color': data.row['Color del equipo'] || data.row['Color'] || '-',
          'Status': 'Registro huérfano', 'Falla': '-',
          'Fecha de Salida del Taller': data.tipo === 'salida' ? (data.row['Fecha de Salida del Taller'] || '-') : '-',
          'Numero de Ficha de Ingreso': data.tipo === 'ingreso' ? (data.row['Numero de Ficha de Ingreso'] || '-') : '-',
          'Numero de Ficha de Salida':  data.tipo === 'salida'  ? (data.row['Numero de Ficha de Salida'] || data.row['Número de Ficha de Salida'] || '-') : '-'
        });
      }
    });
  }

  filtrados = filtrados.map(r => ({
    ...r,
    'Fecha de Salida del Taller': r['Fecha Final de Reparación'] || r['Fecha de salida'] || r['Fecha Salida'] || r['Fecha de Salida del Taller'] || '-',
    'Ficha Ingreso': formatFicha_(r['Ficha de ingreso'] || r['Ficha ingreso'] || r['Ficha Ingreso'] || r['Numero de Ficha de Ingreso']),
    'Ficha Salida':  formatFicha_(r['Ficha reparación'] || r['Ficha de reparación'] || r['Ficha Reparación'] || r['Ficha Salida'] || r['Numero de Ficha de Salida'])
  })).sort((a, b) => {
    const fA = parseFlexibleDate_(a['Fecha de Ingreso'] || a['Fecha Ingreso'] || a['Fecha'] || '');
    const fB = parseFlexibleDate_(b['Fecha de Ingreso'] || b['Fecha Ingreso'] || b['Fecha'] || '');
    if (fA && fB) return fA.getTime() - fB.getTime();
    return fA ? -1 : fB ? 1 : 0;
  });

  const total      = filtrados.length;
  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);
  const safePage   = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const endIndex   = Math.min(startIndex + PAGE_SIZE, total);

  return {
    rows: filtrados.slice(startIndex, endIndex),
    pagination: { page: safePage, pageSize: PAGE_SIZE, total, totalPages, start: total === 0 ? 0 : startIndex + 1, end: endIndex }
  };
}

// =========================================
// BÚSQUEDA PARA EDICIÓN
// =========================================
function buscarEquipoPorCriterio(query, mode) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const q = stripLeadingZeros_(normalize_(query));
    if (!q) return null;
    let serieEncontrada = null;

    if (mode === 'serie') {
      serieEncontrada = query;
    } else {
      const checkIngreso = (mode === 'ambas_fichas' || mode === 'ficha_ingreso');
      const checkSalida  = (mode === 'ambas_fichas' || mode === 'ficha_salida');
      if (checkIngreso && !serieEncontrada) {
        const ingreso = getSheetObjects_(ss.getSheetByName(SHEET_INGRESO));
        const row = ingreso.find(r => stripLeadingZeros_(normalize_(r['Numero de Ficha de Ingreso'] || '')).includes(q));
        if (row) serieEncontrada = row['Serie del Producto'] || row['Serie'];
      }
      if (checkSalida && !serieEncontrada) {
        const salida = getSheetObjects_(ss.getSheetByName(SHEET_SALIDA));
        const row = salida.find(r => stripLeadingZeros_(normalize_(r['Numero de Ficha de Salida'] || r['Número de Ficha de Salida'] || '')).includes(q));
        if (row) serieEncontrada = row['Serie del Producto'] || row['Serie'];
      }
      if (!serieEncontrada) {
        const rep = getSheetObjects_(ss.getSheetByName(SHEET_REPORTE));
        if (checkIngreso && !serieEncontrada) {
          const row = rep.find(r => stripLeadingZeros_(normalize_(r['Ficha de ingreso'] || r['Ficha ingreso'] || r['Ficha Ingreso'] || r['Numero de Ficha de Ingreso'] || '')).includes(q));
          if (row) serieEncontrada = row['Nro Serie'] || row['N° Serie'] || row['Serie'];
        }
        if (checkSalida && !serieEncontrada) {
          const row = rep.find(r => stripLeadingZeros_(normalize_(r['Ficha reparación'] || r['Ficha de reparación'] || r['Ficha Reparación'] || r['Ficha Salida'] || r['Numero de Ficha de Salida'] || '')).includes(q));
          if (row) serieEncontrada = row['Nro Serie'] || row['N° Serie'] || row['Serie'];
        }
      }
    }
    if (!serieEncontrada) return null;
    return getDetalleEquipo(String(serieEncontrada).trim(), mode !== 'serie' ? q : '');
  } catch(e) { throw new Error(e.message); }
}

// =========================================
// DETALLE EQUIPO
// =========================================
function getDetalleEquipo(serie, fichaBuscada) {
  fichaBuscada = fichaBuscada || '';
  try {
    const ss      = SpreadsheetApp.getActiveSpreadsheet();
    const reporte = getSheetObjects_(ss.getSheetByName(SHEET_REPORTE));
    const ingreso = getSheetObjects_(ss.getSheetByName(SHEET_INGRESO));
    const salida  = getSheetObjects_(ss.getSheetByName(SHEET_SALIDA));

    const serieBuscada     = String(serie || '').trim();
    const serieBuscadaNorm = serieBuscada.toLowerCase();

    const filasReporteSerie = reporte.filter(r =>
      String(r['Nro Serie'] || r['N° Serie'] || r['Serie'] || '').trim().toLowerCase() === serieBuscadaNorm
    );

    let equipo = null, ticketEncontrado = '';
    if (fichaBuscada) {
      const q = stripLeadingZeros_(normalize_(fichaBuscada));
      equipo = filasReporteSerie.find(r => {
        const fI = stripLeadingZeros_(normalize_(r['Ficha de ingreso'] || r['Ficha ingreso'] || r['Ficha Ingreso'] || r['Numero de Ficha de Ingreso'] || ''));
        const fS = stripLeadingZeros_(normalize_(r['Ficha reparación'] || r['Ficha de reparación'] || r['Ficha Reparación'] || r['Ficha Salida'] || r['Numero de Ficha de Salida'] || ''));
        return fI === q || fS === q;
      });
      if (equipo) ticketEncontrado = equipo['ID Ticket'] || equipo['Id Ticket'] || equipo['Ticket'] || '';
    }
    if (!equipo && filasReporteSerie.length > 0) {
      equipo = filasReporteSerie[filasReporteSerie.length - 1];
      ticketEncontrado = equipo['ID Ticket'] || equipo['Id Ticket'] || equipo['Ticket'] || '';
    }

    const fichaIngresoGeneral = formatFicha_(equipo ? (equipo['Ficha de ingreso'] || equipo['Ficha ingreso'] || equipo['Ficha Ingreso']) : '-');
    const fichaSalidaGeneral  = formatFicha_(equipo ? (equipo['Ficha reparación'] || equipo['Ficha de reparación'] || equipo['Ficha Reparación'] || equipo['Ficha Salida']) : '-');
    const fechaIngresoGeneral = equipo ? (equipo['Fecha de Ingreso'] || equipo['Fecha Ingreso'] || equipo['Fecha'] || '-') : '-';
    const fechaSalidaGeneral  = equipo ? (equipo['Fecha Final de Reparación'] || equipo['Fecha de salida'] || equipo['Fecha Salida'] || '-') : '-';

    const fichaIngresoPorFecha = {}, fichaSalidaPorFecha = {}, diasPorFechaSalida = {};
    filasReporteSerie.forEach(r => {
      const fIngKey = formatDateKey_(r['Fecha de Ingreso'] || r['Fecha Ingreso'] || r['Fecha'] || '');
      const fSalKey = formatDateKey_(r['Fecha Final de Reparación'] || r['Fecha de salida'] || r['Fecha Salida'] || '');
      const ficIng  = formatFicha_(r['Ficha de ingreso'] || r['Ficha ingreso'] || r['Ficha Ingreso']);
      const ficSal  = formatFicha_(r['Ficha reparación'] || r['Ficha de reparación'] || r['Ficha Reparación'] || r['Ficha Salida']);
      const dias    = r['Dias en Reparación'] || r['Días en Reparación'] || r['Dias Reparación'] || r['Días Reparación'] || '-';
      if (fIngKey) fichaIngresoPorFecha[fIngKey] = ficIng || '-';
      if (fSalKey) { fichaSalidaPorFecha[fSalKey] = ficSal || '-'; diasPorFechaSalida[fSalKey] = dias; }
    });

      const ingresos = ingreso.filter(r =>
        String(r['Serie del Producto'] || '').trim().toLowerCase() === serieBuscadaNorm
      ).map(r => {
      const fechaKey = formatDateKey_(r['Fecha de Llegada al Taller'] || '');
      r['Numero de Ficha de Ingreso'] = formatFicha_(r['Numero de Ficha de Ingreso']);
      return { ...r, 'Ficha Ingreso Historial': fichaIngresoPorFecha[fechaKey] || '-' };
    });

    // ✅ DESPUÉS — case-insensitive + normalizado
      const salidas = salida.filter(r =>
        String(r['Serie del Producto'] || '').trim().toLowerCase() === serieBuscadaNorm
      ).map(r => {
      const fechaKey = formatDateKey_(r['Fecha de Salida del Taller'] || '');
      r['Numero de Ficha de Salida'] = formatFicha_(r['Numero de Ficha de Salida'] || r['Número de Ficha de Salida']);
      return { ...r, 'Ficha Salida Historial': fichaSalidaPorFecha[fechaKey] || '-', 'Dias Reparacion Historial': diasPorFechaSalida[fechaKey] || '-' };
    });

    let currentIngreso = null, currentSalida = null;
    if (fichaBuscada) {
      const q = stripLeadingZeros_(normalize_(fichaBuscada));
      currentIngreso = ingresos.find(r => stripLeadingZeros_(normalize_(r['Numero de Ficha de Ingreso'] || '')) === q);
      currentSalida  = salidas.find(r => stripLeadingZeros_(normalize_(r['Numero de Ficha de Salida'] || r['Número de Ficha de Salida'] || '')) === q);
    }
    if (!currentIngreso) currentIngreso = findCurrentIngreso_(ingresos, fichaIngresoGeneral, fechaIngresoGeneral);
    if (!currentSalida)  currentSalida  = findCurrentSalida_(salidas, fichaSalidaGeneral, fechaSalidaGeneral);

    let detalleGeneral = { fechaDetalle: '-', ticket: ticketEncontrado, fichaIngreso: '-', fichaSalida: '-', diasReparacion: '-', fechaSalida: '-', motivoIngreso: '-', tecnicoReparacion: '-', bandeja: '-' };
    if (equipo) {
      detalleGeneral = {
        fechaDetalle:      equipo['Fecha de Ingreso'] || equipo['Fecha Ingreso'] || equipo['Fecha'] || '-',
        ticket:            ticketEncontrado,
        fichaIngreso:      fichaIngresoGeneral || '-',
        fichaSalida:       fichaSalidaGeneral  || '-',
        diasReparacion:    equipo['Dias en Reparación'] || equipo['Días en Reparación'] || equipo['Dias Reparación'] || equipo['Días Reparación'] || '-',
        fechaSalida:       equipo['Fecha Final de Reparación'] || equipo['Fecha de salida'] || equipo['Fecha Salida'] || '-',
        motivoIngreso:     equipo['Motivo de ingreso de dispensador usado'] || equipo['Motivo de ingreso'] || equipo['Motivo Ingreso'] || '-',
        tecnicoReparacion: equipo['Técnico responsable de reparación'] || equipo['Tecnico responsable de reparación'] || equipo['Supervisor a cargo'] || '-',
        bandeja:           equipo['Bandeja'] || '-'
      };
    }
    return { equipo, ingresos, salidas, detalleGeneral, currentIngreso, currentSalida };
  } catch(e) { throw new Error(e.message); }
}

// =========================================
// HELPERS DE CONVERSIÓN
// =========================================
function convertirFecha_(fechaStr) {
  // "19/04/2026" → "19/4/2026" (igual al formato de Google Forms)
  if (!fechaStr) return '';
  const partes = String(fechaStr).trim().split('/');
  if (partes.length !== 3) return fechaStr;
  const dia  = parseInt(partes[0], 10);
  const mes  = parseInt(partes[1], 10);
  const anio = partes[2].trim();
  if (isNaN(dia) || isNaN(mes)) return fechaStr;
  return dia + '/' + mes + '/' + anio;
}

function convertirHora_(horaStr) {
  // "20:23" → "8:23:00 p.m."  |  "08:05" → "8:05:00 a.m."
  if (!horaStr) return '';
  const h = String(horaStr).trim();
  // Si ya viene con a.m./p.m. devolverlo tal cual
  if (/[ap]\.?m\.?/i.test(h)) return h;
  const partes = h.split(':');
  if (partes.length < 2) return horaStr;
  let horas    = parseInt(partes[0], 10);
  const mins   = String(parseInt(partes[1], 10)).padStart(2, '0');
  const segs   = partes[2] ? String(parseInt(partes[2], 10)).padStart(2, '0') : '00';
  if (isNaN(horas)) return horaStr;
  const periodo = horas >= 12 ? 'p.m.' : 'a.m.';
  if (horas === 0)       horas = 12;
  else if (horas > 12)   horas = horas - 12;
  return horas + ':' + mins + ':' + segs + ' ' + periodo;
}

// =========================================
// REGISTRAR NUEVO EQUIPO
// =========================================
function registrarNuevoEquipo(tipo, datos, archivo) {
  // Lock para evitar que dos registros simultáneos peleen por la misma fila
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch(e) {
    throw new Error('El sistema está ocupado. Intenta en unos segundos.');
  }

  var pasoActual = 'inicio';
  try {
    pasoActual = 'obtener sheet';
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = tipo === 'ingreso' ? SHEET_INGRESO : SHEET_SALIDA;
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) throw new Error("No se encontró la hoja: " + sheetName);

    // ── 1. Subir foto al Drive ───────────────────────────────────
    pasoActual = 'subir foto';
    var fotoUrl = '';
    if (archivo && archivo.base64) {
      var folderId = tipo === 'ingreso' ? FOLDER_ID_INGRESO : FOLDER_ID_SALIDA;
      var folder = DriveApp.getFolderById(folderId);
      var blob = Utilities.newBlob(Utilities.base64Decode(archivo.base64), archivo.mimeType, archivo.filename);
      var file = folder.createFile(blob);
      try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch(e) {}
      fotoUrl = file.getUrl();
    }

    // ══════════════════════════════════════════════════════════════
    // 2. APPEND ROW ATÓMICO — Google Sheets garantiza orden cronológico
    //    Escribimos marca temporal + serie de una sola vez, así queda
    //    reservada la fila al final antes de que otro proceso la tome.
    // ══════════════════════════════════════════════════════════════
    pasoActual = 'reservar fila con appendRow';
    var marcaTemporal = new Date();
    var numCols = tipo === 'ingreso' ? 20 : 16;
    var filaMarcador = new Array(numCols).fill('');
    filaMarcador[0] = marcaTemporal;                                    // Col A = marca
    filaMarcador[1] = String(datos['Serie del Producto'] || '');        // Col B = serie

    sheet.appendRow(filaMarcador);
    SpreadsheetApp.flush();

    // La fila recién insertada siempre está en getLastRow()
    var nuevaFila = sheet.getLastRow();

    // Doble verificación: asegurar que esa fila tiene NUESTRA marca temporal
    pasoActual = 'verificar fila por marca temporal';
    var marcaEnFila = sheet.getRange(nuevaFila, 1).getValue();
    if (!(marcaEnFila instanceof Date) ||
        Math.abs(marcaEnFila.getTime() - marcaTemporal.getTime()) > 5000) {
      // Si no coincide (raro), buscar la fila con nuestra marca
      var dataA = sheet.getRange(1, 1, sheet.getLastRow(), 1).getValues();
      for (var k = dataA.length - 1; k >= 0; k--) {
        if (dataA[k][0] instanceof Date &&
            Math.abs(dataA[k][0].getTime() - marcaTemporal.getTime()) < 5000) {
          nuevaFila = k + 1;
          break;
        }
      }
    }

    // ── 3. Helpers para escribir las demás columnas ──────────────
    function safeSet(col, value, label) {
      pasoActual = 'setValue col ' + col + ' (' + label + ') fila ' + nuevaFila;
      if (value === null || value === undefined || value === '') return;
      sheet.getRange(nuevaFila, col).setValue(value);
    }

    function safeSetTexto(col, value, label) {
      pasoActual = 'setTexto col ' + col + ' (' + label + ') fila ' + nuevaFila;
      if (!value || String(value).trim() === '') return;
      var celda = sheet.getRange(nuevaFila, col);
      celda.setNumberFormat('@');
      celda.setValue(String(value).trim());
    }

    // ── 4. Escribir el resto de datos (Col A y B ya están) ───────
    if (tipo === 'ingreso') {
      // INGRESO: 20 columnas
      // A=Marca temporal ✓, B=Serie ✓, C=vacío, D=Técnico entrega, E=Color,
      // F=Bandeja, G=Ficha(texto), H=Cliente, I=Modelo, J=Color dup,
      // K=Bandeja dup, L=Motivo, M=Hora(Date), N=Fecha(Date),
      // O-S=vacío, T=Foto
      safeSet(4, String(datos['Técnico que entrega equipo'] || ''), 'tecnico');
      safeSet(5, String(datos['Color del equipo'] || ''), 'color');
      safeSet(6, String(datos['Tiene Bandeja'] || ''), 'bandeja');
      safeSetTexto(7, datos['Numero de Ficha de Ingreso'], 'ficha');
      safeSet(8, String(datos['Cliente o Eden Agua'] || ''), 'cliente');
      safeSet(9, String(datos['Modelo'] || ''), 'modelo');
      safeSet(10, String(datos['Color del equipo'] || ''), 'color dup');
      safeSet(11, String(datos['Tiene Bandeja'] || ''), 'bandeja dup');
      safeSet(12, String(datos['Detalle del Motivo a Taller'] || ''), 'motivo');

      var horaVal = datos['Hora de llegada al taller'];
      if (horaVal) { var h = parseHora_(horaVal); if (h) safeSet(13, h, 'hora'); }

      var fechaVal = datos['Fecha de Llegada al Taller'];
      if (fechaVal) { var d = parseFecha_(fechaVal); if (d) safeSet(14, d, 'fecha'); }

      if (fotoUrl) safeSet(20, fotoUrl, 'foto');

    } else {
      // SALIDA: 16 columnas
      // A=Marca temporal ✓, B=Serie ✓, C=Serie Comparativa(vacío), D=Técnico,
      // E=Cliente(vacío/fórmula), F=Fecha(Date), G=Hora Término(Date),
      // H=Procedimiento, I=Consumibles, J=Cliente o Eden Agua,
      // K=Foto, L=Hora Inicio(Date), M=Bandeja(vacío), N=Color(vacío),
      // O=Ficha(texto), P=Repuestos
      safeSet(4, String(datos['Técnico responsable de reparación'] || ''), 'tecnico');

      var fechaSal = datos['Fecha de Salida del Taller'];
      if (fechaSal) { var ds = parseFecha_(fechaSal); if (ds) safeSet(6, ds, 'fecha'); }

      var horaTerm = datos['Hora de Termino de Reparación'];
      if (horaTerm) { var ht = parseHora_(horaTerm); if (ht) safeSet(7, ht, 'hora termino'); }

      safeSet(8, String(datos['Procedimiento de Reparación'] || ''), 'procedimiento');
      safeSet(9, String(datos['Consumibles'] || ''), 'consumibles');
      safeSet(10, String(datos['Cliente o Eden Agua'] || ''), 'cliente');

      if (fotoUrl) safeSet(11, fotoUrl, 'foto');

      var horaIni = datos['Hora de Inicio de Reparación'];
      if (horaIni) { var hi = parseHora_(horaIni); if (hi) safeSet(12, hi, 'hora inicio'); }

      safeSetTexto(15, datos['Numero de Ficha de Salida'], 'ficha');
      safeSet(16, String(datos['Repuestos Utilizados'] || ''), 'repuestos');
    }

    SpreadsheetApp.flush();
    CacheService.getScriptCache().removeAll(['CACHE_' + SHEET_INGRESO, 'CACHE_' + SHEET_SALIDA, 'CACHE_' + SHEET_REPORTE]);
    return { ok: true, message: 'Registrado correctamente.' };
  } catch (e) {
    throw new Error('[' + pasoActual + '] ' + e.message);
  } finally {
    lock.releaseLock();
  }
}
// Helpers (agrégalos también si no los tienes)
function parseFecha_(str) {
  if (!str) return null;
  const p = String(str).trim().split('/');
  if (p.length !== 3) return null;
  const d = parseInt(p[0], 10), m = parseInt(p[1], 10) - 1, y = parseInt(p[2], 10);
  if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
  return new Date(y, m, d);
}

function parseHora_(str) {
  if (!str) return null;
  const s = String(str).trim();
  const match = s.match(/(\d+):(\d+)(?::(\d+))?\s*(a\.?m\.?|p\.?m\.?)?/i);
  if (!match) return null;
  let horas = parseInt(match[1], 10);
  const mins = parseInt(match[2], 10);
  const periodo = (match[4] || '').toLowerCase().replace(/\./g, '');
  if (periodo === 'pm' && horas < 12) horas += 12;
  if (periodo === 'am' && horas === 12) horas = 0;
  return new Date(1899, 11, 30, horas, mins, 0);
}

// =========================================
// GUARDAR CAMBIOS (EDICIÓN)
// =========================================
function guardarCambiosDetalle(payload) {
  if (!payload) throw new Error('El servidor no recibió los datos.');
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  try {
if (payload.ingreso && payload.ingreso.__rowNum) {
  updateSheetRowFromObject_(ss.getSheetByName(SHEET_INGRESO), Number(payload.ingreso.__rowNum), payload.ingreso);
  sincronizarFichaDesdeIngreso_(ss, payload);
}

if (payload.salida && payload.salida.__rowNum) {
  updateSheetRowFromObject_(ss.getSheetByName(SHEET_SALIDA), Number(payload.salida.__rowNum), payload.salida);
}
    if (payload.equipoRowNum && payload.ingreso && typeof payload.ingreso['_extraTicket'] !== 'undefined') {
      actualizarTicketEnReporte_(ss.getSheetByName(SHEET_REPORTE), Number(payload.equipoRowNum), payload.ingreso['_extraTicket']);
    }
    SpreadsheetApp.flush();
    CacheService.getScriptCache().removeAll(['CACHE_' + SHEET_INGRESO, 'CACHE_' + SHEET_SALIDA, 'CACHE_' + SHEET_REPORTE]);
    return { ok: true, message: 'Cambios guardados.' };
  } catch (e) { throw new Error(e.message); }
}

function actualizarTicketEnReporte_(sheet, rowNum, ticketVal) {
  if (!sheet || !rowNum) return;
  sheet.getRange(rowNum, 1).setValue(ticketVal);
}

// =========================================
// FILTROS
// =========================================
function getFiltrosOptions() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return buildFiltros_(getSheetObjects_(ss.getSheetByName(SHEET_REPORTE)));
}

function buildFiltros_(reporte) {
  const modelosSet = new Set(), estadosSet = new Set(), fallasSet = new Set();
  reporte.forEach(r => {
    const m = String(r['Modelo'] || '').trim(); if (m && m !== '-') modelosSet.add(m);
    const e = String(r['Status'] || r['Estado'] || '').trim(); if (e && e !== '-') estadosSet.add(e);
    const f = String(r['Falla']  || '').trim(); if (f && f !== '-') fallasSet.add(f);
  });
  const sorter = (a, b) => a.localeCompare(b, 'es');
  return { modelos: [...modelosSet].sort(sorter), estados: [...estadosSet].sort(sorter), fallas: [...fallasSet].sort(sorter) };
}

// =========================================
// UTILIDADES DE SHEET
// =========================================
function getSheetObjects_(sheet) {
  if (!sheet) return [];
  const cache = CacheService.getScriptCache(), cacheKey = 'CACHE_' + sheet.getName();
  const cached = cache.get(cacheKey);
  if (cached) return JSON.parse(cached);
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) return [];
  const headers = values[0].map(h => String(h).trim());
  const objects = values.slice(1).map((row, idx) => {
    const obj = { __rowNum: idx + 2 };
    headers.forEach((h, i) => { obj[h] = row[i] !== undefined ? String(row[i]).trim() : ''; });
    return obj;
  }).filter(r => Object.keys(r).some(k => k !== '__rowNum' && String(r[k]).trim() !== ''));
  try { cache.put(cacheKey, JSON.stringify(objects), CACHE_TTL); } catch (e) {}
  return objects;
}

function updateSheetRowFromObject_(sheet, rowNum, obj) {
  if (!sheet || !rowNum || !obj) return;

  var headers = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getDisplayValues()[0]
    .map(function(h) { return String(h || '').trim(); });

  var targetRange = sheet.getRange(rowNum, 1, 1, headers.length);
  var currentValues = targetRange.getValues()[0];

  function normalizar(t) {
    return String(t || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .toLowerCase()
      .trim();
  }

  var objNorm = {};

  Object.keys(obj).forEach(function(k) {
    if (k.indexOf('__') === 0 || k.indexOf('_extra') === 0) return;

    var val = obj[k];

    if (typeof val === 'string') {
      if (val.match(/^0\d+$/) || (normalizar(k).includes('ficha') && /^\d+$/.test(val))) {
        if (!val.startsWith("'")) val = "'" + val;
      }
    }

    objNorm[normalizar(k)] = val;
  });

  // Alias para columnas con nombres distintos o saltos de línea
  if (objNorm['color']) {
    objNorm['color del equipo'] = objNorm['color'];
  }

  if (objNorm['color del equipo']) {
    objNorm['color'] = objNorm['color del equipo'];
  }

  if (objNorm['bandeja']) {
    objNorm['tiene bandeja'] = objNorm['bandeja'];
  }

  if (objNorm['tiene bandeja']) {
    objNorm['bandeja'] = objNorm['tiene bandeja'];
  }

  var cambio = false;

  headers.forEach(function(h, i) {
    var hL = normalizar(h);

    if (hL in objNorm) {
      currentValues[i] = objNorm[hL];
      cambio = true;
    }
  });

  if (cambio) {
    targetRange.setValues([currentValues]);
  }
}

// =========================================
// UTILIDADES DE FECHA Y FORMATO
// =========================================
function formatFicha_(val) {
  let s = String(val || '').trim();
  if (s.startsWith("'")) s = s.substring(1);
  if (!s || s === '-') return '-';
  if (/^\d+$/.test(s) && s.length > 0 && s.length < 6) return s.padStart(6, '0');
  return s;
}
function findCurrentIngreso_(ingresos, fichaIngresoGeneral, fechaIngresoGeneral) {
  if (!ingresos || !ingresos.length) return null;
  let found = ingresos.find(r => sameId_(r['Numero de Ficha de Ingreso'] || '', fichaIngresoGeneral));
  if (!found) { const fk = formatDateKey_(fechaIngresoGeneral); found = ingresos.find(r => formatDateKey_(r['Fecha de Llegada al Taller'] || '') === fk); }
  return found || ingresos[ingresos.length - 1] || null;
}
function findCurrentSalida_(salidas, fichaSalidaGeneral, fechaSalidaGeneral) {
  if (!salidas || !salidas.length) return null;
  let found = salidas.find(r => sameId_(r['Numero de Ficha de Salida'] || r['Número de Ficha de Salida'] || '', fichaSalidaGeneral));
  if (!found) { const fk = formatDateKey_(fechaSalidaGeneral); found = salidas.find(r => formatDateKey_(r['Fecha de Salida del Taller'] || '') === fk); }
  return found || salidas[salidas.length - 1] || null;
}
function findHeaderIndex_(headerIndex, possibleHeaders) {
  for (let i = 0; i < possibleHeaders.length; i++) { if (possibleHeaders[i] in headerIndex) return headerIndex[possibleHeaders[i]]; }
  return -1;
}
function sameId_(a, b) { const x = stripLeadingZeros_(String(a||'').trim()), y = stripLeadingZeros_(String(b||'').trim()); return x !== '' && x === y; }
function stripLeadingZeros_(value) { const v = String(value||'').trim(); return v ? (v.replace(/^0+/,'') || '0') : ''; }
function parseISODate_(value) {
  if (!value) return null;
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? new Date(+m[1], +m[2]-1, +m[3]) : null;
}
function parseFlexibleDate_(value) {
  if (!value) return null;
  const text = String(value).trim();
  let m = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); if (m) return new Date(+m[3],+m[2]-1,+m[1]);
  m = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/); if (m) return new Date(+m[1],+m[2]-1,+m[3]);
  return null;
}
function formatDateKey_(value) { const d = parseFlexibleDate_(value); if (!d) return ''; return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function normalize_(value) { return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim(); }

function sincronizarFichaDesdeIngreso_(ss, payload) {
  if (!payload || !payload.ingreso) return;

  var sheet = ss.getSheetByName(SHEET_FICHAS2);
  if (!sheet || sheet.getLastRow() < 2) return;

  var ingreso = payload.ingreso;

  var serieNueva = String(
    ingreso['Serie del Producto'] ||
    ingreso['Serie'] ||
    ingreso['Nro Serie'] ||
    ''
  ).trim();

  var modeloNuevo = String(ingreso['Modelo'] || '').trim();

  var clienteNuevo = String(
    ingreso['Cliente o Eden Agua'] ||
    ingreso['Cliente'] ||
    ''
  ).trim();

  var fichaNueva = formatFicha_(
    ingreso['Numero de Ficha de Ingreso'] ||
    ingreso['Ficha de ingreso'] ||
    ingreso['Ficha Ingreso'] ||
    ''
  );

  var serieAnterior = String(
    ingreso['_oldSerie'] ||
    payload.serie ||
    serieNueva ||
    ''
  ).trim();

  var fichaAnterior = formatFicha_(
    ingreso['_oldFichaIngreso'] ||
    ''
  );

  if (!serieNueva && !serieAnterior && !fichaNueva && !fichaAnterior) return;

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];

  function norm(h) {
    return String(h || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  var hNorm = headers.map(norm);
  var iSerie = hNorm.indexOf('serie');
  var iModelo = hNorm.indexOf('modelo');
  var iCliente = hNorm.indexOf('cliente');
  var iFichaIng = hNorm.indexOf('ficha ingreso');

  if (iSerie < 0) return;

  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getDisplayValues();

  function sameSerie(a, b) {
    return String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
  }

  function sameFicha(a, b) {
    return stripLeadingZeros_(String(a || '').trim()) === stripLeadingZeros_(String(b || '').trim());
  }

  var filaEncontrada = -1;

  for (var i = 0; i < data.length; i++) {
    var rowSerie = iSerie >= 0 ? data[i][iSerie] : '';
    var rowFicha = iFichaIng >= 0 ? data[i][iFichaIng] : '';

    var coincideSerieAnterior = serieAnterior && sameSerie(rowSerie, serieAnterior);
    var coincideSerieNueva = serieNueva && sameSerie(rowSerie, serieNueva);
    var coincideFichaAnterior = fichaAnterior && sameFicha(rowFicha, fichaAnterior);
    var coincideFichaNueva = fichaNueva && sameFicha(rowFicha, fichaNueva);

    if (
      (coincideSerieAnterior && (coincideFichaAnterior || coincideFichaNueva || !fichaAnterior)) ||
      (coincideSerieNueva && (coincideFichaAnterior || coincideFichaNueva))
    ) {
      filaEncontrada = i + 2;
      break;
    }
  }

  if (filaEncontrada < 0) return;

  if (iSerie >= 0 && serieNueva) sheet.getRange(filaEncontrada, iSerie + 1).setValue(serieNueva);
  if (iModelo >= 0) sheet.getRange(filaEncontrada, iModelo + 1).setValue(modeloNuevo);
  if (iCliente >= 0) sheet.getRange(filaEncontrada, iCliente + 1).setValue(clienteNuevo);
  if (iFichaIng >= 0 && fichaNueva) sheet.getRange(filaEncontrada, iFichaIng + 1).setValue(fichaNueva);
}
// =========================================
// DIAGNÓSTICO (puedes borrar después)
// =========================================
function diagnosticarHeaders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetI = ss.getSheetByName(SHEET_INGRESO);
  const headersI = sheetI.getRange(1, 1, 1, sheetI.getLastColumn()).getDisplayValues()[0];
  Logger.log('=== INGRESO ===');
  headersI.forEach((h, i) => Logger.log('Col ' + (i+1) + ' (' + String.fromCharCode(65+i) + '): "' + h + '"'));
  const sheetS = ss.getSheetByName(SHEET_SALIDA);
  const headersS = sheetS.getRange(1, 1, 1, sheetS.getLastColumn()).getDisplayValues()[0];
  Logger.log('=== SALIDA ===');
  headersS.forEach((h, i) => Logger.log('Col ' + (i+1) + ': "' + h + '"'));
}

function testRegistrarIngreso() {
  const datos = {
    'Serie del Producto': 'TEST-001',
    'Fecha de Llegada al Taller': '19/04/2026',
    'Cliente o Eden Agua': 'Cliente',
    'Detalle del Motivo a Taller': 'Reparación en taller',
    'Numero de Ficha de Ingreso': '001231',
    'Hora de llegada al taller': '20:23',
    'Técnico que entrega equipo': 'PEDRO',
    'Modelo': 'Panamara',
    'Color del equipo': 'Blanco',
    'Tiene Bandeja': 'NO'
  };
  try {
    const resultado = registrarNuevoEquipo('ingreso', datos, null);
    Logger.log('Éxito: ' + JSON.stringify(resultado));
  } catch(e) {
    Logger.log('ERROR: ' + e.message);
    Logger.log('Stack: ' + e.stack);
  }
}

function setFichaTexto_(sheet, row, col, value) {
  if (!sheet || !row || !col) return;

  var ficha = formatFicha_(value);
  if (!ficha || ficha === '-') return;

  var cell = sheet.getRange(row, col);
  cell.setNumberFormat('@');
  cell.setValue("'" + ficha);
}

function verFilasReales() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_INGRESO);
  const lastRow = sheet.getLastRow();
  
  // Ver las últimas 3 filas con valores RAW (no display)
  const rangeRaw = sheet.getRange(lastRow - 2, 1, 3, 20).getValues();
  const rangeDisplay = sheet.getRange(lastRow - 2, 1, 3, 20).getDisplayValues();
  
  for (let r = 0; r < 3; r++) {
    Logger.log('=== FILA ' + (lastRow - 2 + r) + ' ===');
    for (let c = 0; c < 20; c++) {
      const raw = rangeRaw[r][c];
      const disp = rangeDisplay[r][c];
      if (raw !== '' || disp !== '') {
        Logger.log('Col ' + (c+1) + ': RAW=[' + typeof raw + '] "' + raw + '" | DISPLAY="' + disp + '"');
      }
    }
  }
}

function diagnosticarFilasFinales() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // INGRESO
  var sheetI = ss.getSheetByName('Formulario INGRESO');
  var lastRowI = sheetI.getLastRow();
  var maxRowsI = sheetI.getMaxRows();
  Logger.log('=== FORMULARIO INGRESO ===');
  Logger.log('getLastRow: ' + lastRowI);
  Logger.log('getMaxRows: ' + maxRowsI);
  
  // Ver las últimas 5 filas con datos + las 3 siguientes
  var startRow = Math.max(lastRowI - 2, 2);
  var endRow = Math.min(lastRowI + 5, maxRowsI);
  var range = sheetI.getRange(startRow, 1, endRow - startRow + 1, 5);
  var vals = range.getValues();
  var disps = range.getDisplayValues();
  for (var i = 0; i < vals.length; i++) {
    var rowNum = startRow + i;
    var a = disps[i][0], b = disps[i][1];
    var isEmpty = (String(a).trim() === '' && String(b).trim() === '');
    Logger.log('Fila ' + rowNum + ': A="' + a + '" B="' + b + '" ' + (isEmpty ? '← VACÍA' : '← DATOS'));
  }
  
  // SALIDA
  var sheetS = ss.getSheetByName('Formulario SALIDA');
  var lastRowS = sheetS.getLastRow();
  var maxRowsS = sheetS.getMaxRows();
  Logger.log('=== FORMULARIO SALIDA ===');
  Logger.log('getLastRow: ' + lastRowS);
  Logger.log('getMaxRows: ' + maxRowsS);
  
  var startRowS = Math.max(lastRowS - 2, 2);
  var endRowS = Math.min(lastRowS + 5, maxRowsS);
  var rangeS = sheetS.getRange(startRowS, 1, endRowS - startRowS + 1, 5);
  var valsS = rangeS.getValues();
  var dispsS = rangeS.getDisplayValues();
  for (var j = 0; j < valsS.length; j++) {
    var rowNumS = startRowS + j;
    var aS = dispsS[j][0], bS = dispsS[j][1];
    var isEmptyS = (String(aS).trim() === '' && String(bS).trim() === '');
    Logger.log('Fila ' + rowNumS + ': A="' + aS + '" B="' + bS + '" ' + (isEmptyS ? '← VACÍA' : '← DATOS'));
  }
  
  // REPORTE
  var sheetR = ss.getSheetByName('Reporte Taller');
  Logger.log('=== REPORTE TALLER ===');
  Logger.log('getLastRow: ' + sheetR.getLastRow());
  Logger.log('getMaxRows: ' + sheetR.getMaxRows());
}
function testOrdenFilas() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Formulario INGRESO');
  var maxRows = sheet.getMaxRows();
  var colA = sheet.getRange(1, 1, maxRows, 1).getDisplayValues();
  
  var ultimaConDatos = 0;
  for (var i = colA.length - 1; i >= 1; i--) {
    if (String(colA[i][0]).trim() !== '') {
      ultimaConDatos = i + 1;
      break;
    }
  }
  
  Logger.log('Última fila con datos en col A: ' + ultimaConDatos);
  Logger.log('Siguiente fila disponible: ' + (ultimaConDatos + 1));
  Logger.log('MaxRows: ' + maxRows);
  
  // Mostrar las últimas 5 filas
  for (var j = ultimaConDatos - 4; j <= ultimaConDatos + 2; j++) {
    if (j >= 1 && j <= maxRows) {
      var val = sheet.getRange(j, 1).getDisplayValue();
      var serie = sheet.getRange(j, 2).getDisplayValue();
      var ficha = sheet.getRange(j, 7).getDisplayValue();
      Logger.log('Fila ' + j + ': marca="' + val + '" serie="' + serie + '" ficha="' + ficha + '"');
    }
  }
}
function verificarLock() {
  var code = registrarNuevoEquipo.toString();
  Logger.log('Tiene LockService: ' + code.includes('LockService'));
  Logger.log('Tiene appendRow: ' + code.includes('appendRow'));
  Logger.log('Primeros 300 chars:');
  Logger.log(code.substring(0, 300));
}

function verFormulaReporte() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Reporte Taller');
  
  // Revisar celdas clave de la fila 2 (primera fila de datos)
  var cols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  for (var i = 0; i < cols.length; i++) {
    var c = cols[i];
    var formula = sheet.getRange(2, c).getFormula();
    var value = sheet.getRange(2, c).getDisplayValue();
    Logger.log('Col ' + c + ': formula="' + formula + '" | valor="' + value + '"');
  }
  
  // También revisar si hay ARRAYFORMULA en fila 1 o 2
  Logger.log('=== BUSCANDO ARRAYFORMULA ===');
  var range = sheet.getRange(1, 1, 3, 30).getFormulas();
  for (var r = 0; r < range.length; r++) {
    for (var c = 0; c < range[r].length; c++) {
      if (range[r][c] && range[r][c].toUpperCase().indexOf('ARRAYFORMULA') >= 0) {
        Logger.log('Fila ' + (r+1) + ' Col ' + (c+1) + ': ' + range[r][c].substring(0, 200));
      }
    }
  }
}
function verReporteFichas() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Reporte Taller');
  
  // Buscar las filas que contienen las series problemáticas
  var data = sheet.getRange(1, 1, sheet.getLastRow(), 32).getDisplayValues();
  var headers = data[0];
  Logger.log('=== HEADERS ===');
  for (var i = 0; i < headers.length; i++) {
    Logger.log('Col ' + (i+1) + ': "' + headers[i] + '"');
  }
  
  Logger.log('=== BUSCANDO ON2409053 y ON2409059 ===');
  for (var r = 1; r < data.length; r++) {
    var rowStr = data[r].join('|').toLowerCase();
    if (rowStr.indexOf('on2409053') >= 0 || rowStr.indexOf('on2409059') >= 0 || rowStr.indexOf('al2510116') >= 0) {
      Logger.log('--- Fila ' + (r+1) + ' ---');
      for (var c = 0; c < data[r].length; c++) {
        if (data[r][c] && String(data[r][c]).trim() !== '') {
          var formula = sheet.getRange(r+1, c+1).getFormula();
          Logger.log('  Col ' + (c+1) + ' (' + headers[c] + '): "' + data[r][c] + '"' + (formula ? ' [FORMULA: ' + formula.substring(0,80) + ']' : ''));
        }
      }
    }
  }
}
function verAnexoTaller() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Anexo Taller');
  if (!sheet) { Logger.log('NO EXISTE Anexo Taller'); return; }
  
  // Headers
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  Logger.log('=== HEADERS ANEXO TALLER ===');
  for (var i = 0; i < headers.length; i++) {
    Logger.log('Col ' + (i+1) + ' (' + String.fromCharCode(65+i) + '): "' + headers[i] + '"');
  }
  
  // Revisar filas 846, 847, 848
  Logger.log('=== FILAS 846, 847, 848 ===');
  for (var r = 846; r <= 848; r++) {
    Logger.log('--- Fila ' + r + ' ---');
    for (var c = 1; c <= Math.min(20, sheet.getLastColumn()); c++) {
      var formula = sheet.getRange(r, c).getFormula();
      var value = sheet.getRange(r, c).getDisplayValue();
      if (value || formula) {
        Logger.log('  Col ' + c + ' (' + headers[c-1] + '): "' + value + '"' + (formula ? ' [FORMULA: ' + formula.substring(0,120) + ']' : ''));
      }
    }
  }
  
  // Ver las últimas filas
  var lastRow = sheet.getLastRow();
  Logger.log('=== ÚLTIMAS 3 FILAS (' + lastRow + ') ===');
  for (var r2 = lastRow - 2; r2 <= lastRow; r2++) {
    var serie = sheet.getRange(r2, 5).getDisplayValue();
    var cliente = sheet.getRange(r2, 2).getDisplayValue();
    var fecha = sheet.getRange(r2, 1).getDisplayValue();
    var ficha = sheet.getRange(r2, 18).getDisplayValue(); // col R aprox
    Logger.log('Fila ' + r2 + ': fecha="' + fecha + '" cliente="' + cliente + '" serie="' + serie + '" ficha="' + ficha + '"');
  }
}

function verOrdenRealIngreso() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Formulario INGRESO');
  var lastRow = sheet.getLastRow();
  
  // Ver últimas 10 filas con marca temporal, serie, ficha
  Logger.log('=== ÚLTIMAS 10 FILAS DE FORMULARIO INGRESO ===');
  var start = Math.max(lastRow - 9, 2);
  for (var r = start; r <= lastRow; r++) {
    var marca = sheet.getRange(r, 1).getDisplayValue();
    var marcaRaw = sheet.getRange(r, 1).getValue();
    var serie = sheet.getRange(r, 2).getDisplayValue();
    var ficha = sheet.getRange(r, 7).getDisplayValue();
    var tipoMarca = Object.prototype.toString.call(marcaRaw);
    Logger.log('Fila ' + r + ': marca="' + marca + '" (' + tipoMarca + ') | serie="' + serie + '" | ficha="' + ficha + '"');
  }
}
function encontrarArrayFormula() {
  var anexo = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Anexo Taller');
  var col5 = anexo.getRange(1, 5, 300, 1).getFormulas();
  for (var i = 0; i < col5.length; i++) {
    if (col5[i][0] && col5[i][0].trim() !== '') {
      Logger.log('Fila ' + (i+1) + ': ' + col5[i][0].substring(0, 150));
    }
  }
}
function diagnosticarAnexo212() {
  var anexo = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Anexo Taller');
  
  Logger.log('=== FILAS 212-240 COLUMNA E ===');
  for (var r = 212; r <= 240; r++) {
    var formula = anexo.getRange(r, 5).getFormula();
    var value   = anexo.getRange(r, 5).getDisplayValue();
    var colA    = anexo.getRange(r, 1).getDisplayValue();
    Logger.log('Fila ' + r + ': A="' + colA + '" E_formula="' + formula + '" E_valor="' + value + '"');
  }
  
  // Ver cuántos registros hay en Formulario INGRESO desde fila 189
  var ingreso = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Formulario INGRESO');
  var count = 0;
  var lastRow = ingreso.getLastRow();
  for (var i = 189; i <= lastRow; i++) {
    if (ingreso.getRange(i, 2).getValue() !== '') count++;
  }
  Logger.log('=== Registros en INGRESO desde fila 189: ' + count + ' ===');
  Logger.log('=== INGRESO getLastRow: ' + lastRow + ' ===');
}

function verHojasDisponibles() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  Logger.log('=== HOJAS DISPONIBLES ===');
  sheets.forEach(function(s) {
    Logger.log('Hoja: "' + s.getName() + '" | Filas: ' + s.getLastRow() + ' | Cols: ' + s.getLastColumn());
  });
}
function getConfigTaller() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Config Taller');
    if (!sheet) throw new Error('No existe la hoja Config Taller');
    
    var data = sheet.getDataRange().getDisplayValues();
    var tecnicos = [], modelos = [], motivos = [], fallas = [];
    
    // Saltar header (fila 1), leer desde fila 2
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] && data[i][0].trim()) tecnicos.push(data[i][0].trim());
      if (data[i][1] && data[i][1].trim()) modelos.push(data[i][1].trim());
      if (data[i][2] && data[i][2].trim()) motivos.push(data[i][2].trim());
      if (data[i][3] && data[i][3].trim()) fallas.push(data[i][3].trim());
    }
    
    return { tecnicos, modelos, motivos, fallas };
  } catch(e) {
    throw new Error('Error cargando config: ' + e.message);
  }
}

// =========================================
// CONTROL DE CALIDAD — Code.gs v3
// Reemplaza el bloque CC anterior en Code.gs
// =========================================

var SHEET_CC2       = 'Control de Calidad';
var FOLDER_ID_CC2   = '1ci2GpjgH2CPBOkRM16qaoWTSM9lO9bev';
var CC_HEADERS_REQUERIDOS = [
  'ID','Fecha Registro','Serie','Modelo','Ficha Ingreso','Ficha Salida',
  'Tipo','Estado Producto','Comentario','Archivos','Estado'
];

// ── Helper: obtener índice de columna por nombre (1-based) ───────────────
function cc_colIdx_(sheet, nombreCol) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  for (var i = 0; i < headers.length; i++) {
    if (String(headers[i]).trim().toLowerCase() === String(nombreCol).trim().toLowerCase()) {
      return i + 1; // 1-based
    }
  }
  return -1;
}

// ── Helper: asegurar que la hoja tiene todas las columnas necesarias ──────
function cc_asegurarHoja_(ss) {
  var sheet = ss.getSheetByName(SHEET_CC2);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_CC2);
    sheet.getRange(1, 1, 1, CC_HEADERS_REQUERIDOS.length).setValues([CC_HEADERS_REQUERIDOS]);
    return sheet;
  }
  // Verificar que existan todas las columnas; agregar las que falten al final
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  var headersNorm = headers.map(function(h) { return String(h).trim().toLowerCase(); });
  CC_HEADERS_REQUERIDOS.forEach(function(req) {
    if (headersNorm.indexOf(req.toLowerCase()) < 0) {
      var newCol = sheet.getLastColumn() + 1;
      sheet.getRange(1, newCol).setValue(req);
    }
  });
  return sheet;
}

// ── Buscar equipo para CC ────────────────────────────────────────────────
function buscarEquipoCC(query, mode) {
  try {
    return buscarEquipoPorCriterio(query, mode || 'ambas_fichas');
  } catch(e) { throw new Error(e.message); }
}

// ── Guardar/Actualizar registro CC ────────────────────────────────────────
function guardarRegistroCC(payload, archivos) {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(30000); } catch(e) { throw new Error('Sistema ocupado. Intenta en unos segundos.'); }

  try {
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = cc_asegurarHoja_(ss);

    // ── 1. Subir archivos al Drive ───────────────────────────────────────
    var folder   = DriveApp.getFolderById(FOLDER_ID_CC2);
    var fecha    = new Date();
    var tz       = Session.getScriptTimeZone();
    // Formato: SERIE YYYY DD MM.ext  (con espacios)
    var fechaStr = Utilities.formatDate(fecha, tz, 'yyyy') + ' ' +
                   Utilities.formatDate(fecha, tz, 'dd')   + ' ' +
                   Utilities.formatDate(fecha, tz, 'MM');
    var urlsSubidos = [];

    if (archivos && archivos.length) {
      archivos.forEach(function(arch) {
        if (!arch || !arch.base64) return;
        var ext    = arch.ext || (arch.filename ? arch.filename.split('.').pop() : 'jpg');
        var fichaNum = payload.tipo === 'ingreso' 
        ? (payload.fichaIngreso || '') 
        : (payload.fichaSalida  || '');
        var tipoLabel = payload.tipo === 'ingreso' ? 'Ficha Ingreso' : 'Ficha Salida';
        var nombre = String(payload.serie || 'SIN_SERIE') + ' ' + tipoLabel + ' N' + String(fichaNum).padStart(6,'0') + ' ' + Utilities.formatDate(fecha, tz, 'yyyy dd MM') + '.' + arch.ext;
        var blob   = Utilities.newBlob(Utilities.base64Decode(arch.base64), arch.mimeType, nombre);
        var file   = folder.createFile(blob);
        try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch(e2) {}
        urlsSubidos.push({
          nombre: nombre,
          url:    file.getUrl(),
          id:     file.getId(),
          thumb:  'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w400'
        });
      });
    }

    // ── 2. Leer TODOS los datos de la hoja con cabeceras reales ──────────
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    var headers = sheet.getRange(1, 1, 1, lastCol).getDisplayValues()[0];
    // Normalizar para búsqueda
    var hNorm = headers.map(function(h) { return String(h).trim().toLowerCase(); });
    var iSerie        = hNorm.indexOf('serie');
    var iTipo         = hNorm.indexOf('tipo');
    var iEstProd      = hNorm.indexOf('estado producto');
    var iComentario   = hNorm.indexOf('comentario');
    var iArchivos     = hNorm.indexOf('archivos');
    var iEstado       = hNorm.indexOf('estado');
    var iFechaReg     = hNorm.indexOf('fecha registro');
    var iId           = hNorm.indexOf('id');
    var iModelo       = hNorm.indexOf('modelo');
    var iFichaIng     = hNorm.indexOf('ficha ingreso');
    var iFichaSal     = hNorm.indexOf('ficha salida');

    // ── 3. Buscar fila existente: misma serie + mismo tipo ───────────────
    var existenteRowNum = -1;
    var archivosExistentes = [];
    if (lastRow > 1) {
      var dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol).getDisplayValues();
      for (var i = 0; i < dataRange.length; i++) {
        var row = dataRange[i];
        var serieVal = iSerie >= 0 ? String(row[iSerie] || '').trim().toLowerCase() : '';
        var tipoVal  = iTipo  >= 0 ? String(row[iTipo]  || '').trim().toLowerCase() : '';
        if (serieVal === String(payload.serie || '').trim().toLowerCase()
         && tipoVal  === String(payload.tipo  || '').trim().toLowerCase()) {
          existenteRowNum = i + 2; // +2: fila 1 es header, array 0-based
          if (iArchivos >= 0) {
            try { archivosExistentes = JSON.parse(row[iArchivos] || '[]'); } catch(e3) { archivosExistentes = []; }
          }
          break;
        }
      }
    }

    // Combinar archivos existentes + nuevos
    var archivosJSON = JSON.stringify(archivosExistentes.concat(urlsSubidos));

    if (existenteRowNum > 0) {
      // Actualizar fila existente columna por columna por NOMBRE
      var updates = {};
      updates[iTipo + 1]       = payload.tipo           || '';
      updates[iEstProd + 1]    = payload.estadoProducto || '';
      updates[iComentario + 1] = payload.comentario     || '';
      updates[iArchivos + 1]   = archivosJSON;
      if (iEstado >= 0) updates[iEstado + 1] = 'Activo';

      Object.keys(updates).forEach(function(colNum) {
        var col = parseInt(colNum);
        if (col > 0) sheet.getRange(existenteRowNum, col).setValue(updates[colNum]);
      });
    } else {
      // Nueva fila: construir array alineado con cabeceras reales
      var newRow = [];
      for (var c = 0; c < lastCol; c++) { newRow.push(''); }
      var idVal = 'CC-' + Utilities.formatDate(fecha, Session.getScriptTimeZone(), 'yyyyMMddHHmmss');
      if (iId >= 0)         newRow[iId]         = idVal;
      if (iFechaReg >= 0)   newRow[iFechaReg]   = fecha;
      if (iSerie >= 0)      newRow[iSerie]       = payload.serie         || '';
      if (iModelo >= 0)     newRow[iModelo]      = payload.modelo        || '';
      if (iFichaIng >= 0)   newRow[iFichaIng]   = payload.fichaIngreso  || '';
      if (iFichaSal >= 0)   newRow[iFichaSal]   = payload.fichaSalida   || '';
      if (iTipo >= 0)       newRow[iTipo]        = payload.tipo          || '';
      if (iEstProd >= 0)    newRow[iEstProd]     = payload.estadoProducto|| '';
      if (iComentario >= 0) newRow[iComentario]  = payload.comentario    || '';
      if (iArchivos >= 0)   newRow[iArchivos]    = archivosJSON;
      if (iEstado >= 0)     newRow[iEstado]      = 'Activo';
      sheet.appendRow(newRow);
    }

    // ── 4. Actualizar Reporte Taller ─────────────────────────────────────
    cc_actualizarReporte_(ss, payload);

    SpreadsheetApp.flush();
    // Limpiar caché para que getCCPorSerie devuelva datos frescos
    CacheService.getScriptCache().remove('CACHE_' + SHEET_CC2);
    CacheService.getScriptCache().remove('CACHE_' + SHEET_REPORTE);
    return { ok: true, archivosSubidos: urlsSubidos, message: 'CC guardado.' };

  } catch(e) {
    throw new Error('[CC] ' + e.message);
  } finally {
    lock.releaseLock();
  }
}

// ── Leer registros CC por serie (siempre frescos, sin caché) ─────────────
function getCCPorSerie(serie) {
  try {
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_CC2);
    if (!sheet || sheet.getLastRow() < 2) return [];

    var lastCol = sheet.getLastColumn();
    var headers = sheet.getRange(1, 1, 1, lastCol).getDisplayValues()[0];
    var hNorm   = headers.map(function(h) { return String(h).trim().toLowerCase(); });
    var iSerie  = hNorm.indexOf('serie');
    if (iSerie < 0) return [];

    var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastCol).getDisplayValues();
    var sNorm = String(serie || '').trim().toLowerCase();
    var result = [];

    data.forEach(function(row, idx) {
      var val = String(row[iSerie] || '').trim().toLowerCase();
      if (val !== sNorm) return;
      // Construir objeto con nombres de columna reales
      var obj = { __rowNum: idx + 2 };
      headers.forEach(function(h, c) { obj[String(h).trim()] = row[c] || ''; });
      // Asegurar que 'Archivos' sea parseable (puede ser JSON o string)
      if (obj['Archivos']) {
        try { JSON.parse(obj['Archivos']); } catch(e) { obj['Archivos'] = '[]'; }
      } else {
        obj['Archivos'] = '[]';
      }
      result.push(obj);
    });
    return result;
  } catch(e) { throw new Error(e.message); }
}

// ── Actualizar Reporte Taller ─────────────────────────────────────────────
function cc_actualizarReporte_(ss, payload) {
  if (!payload.serie) return;
  var sheetR = ss.getSheetByName(SHEET_REPORTE);
  if (!sheetR) return;
  var headers = sheetR.getRange(1, 1, 1, sheetR.getLastColumn()).getDisplayValues()[0];
  var normalH = function(h) { return String(h||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim(); };
  var colSerie = -1, colDevolver = -1, colEstProd = -1;
  headers.forEach(function(h, i) {
    var hn = normalH(h);
    if (hn === 'nro serie' || hn === 'n° serie' || hn === 'serie') colSerie = i;
    if (hn === 'devolver a:' || hn === 'devolver a')               colDevolver = i;
    if (hn === 'estado del producto' || hn === 'estado producto')  colEstProd = i;
  });
  if (colSerie < 0) return;
  var data = sheetR.getRange(2, 1, sheetR.getLastRow() - 1, sheetR.getLastColumn()).getDisplayValues();
  var serieNorm = String(payload.serie || '').trim().toLowerCase();
  var ultimaFila = -1;
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][colSerie] || '').trim().toLowerCase() === serieNorm) {
      ultimaFila = i + 2;
    }
  }
  if (ultimaFila < 0) return;
  if (colDevolver >= 0 && payload.tipo)           sheetR.getRange(ultimaFila, colDevolver + 1).setValue(payload.tipo);
  if (colEstProd >= 0 && payload.estadoProducto)  sheetR.getRange(ultimaFila, colEstProd + 1).setValue(payload.estadoProducto);
}

// ── Proxy de imagen Drive (evita CORS) ────────────────────────────────────
function getImagenDriveBase64(fileId) {
  try {
    var file = DriveApp.getFileById(fileId);
    var mime = file.getMimeType();
    var b64  = Utilities.base64Encode(file.getBlob().getBytes());
    return { ok: true, dataUrl: 'data:' + mime + ';base64,' + b64 };
  } catch(e) { return { ok: false, error: e.message }; }
}

// ── Eliminar archivo de un registro CC ───────────────────────────────────
function eliminarArchivoCC(ccId, fileId) {
  try {
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_CC2);
    if (!sheet) throw new Error('Hoja CC no encontrada');
    var rows = getCCPorSerie('__all__');  // fallback: leer toda la hoja
    // Buscar por ID
    var headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getDisplayValues()[0];
    var hNorm = headers.map(function(h){return String(h).trim().toLowerCase();});
    var iId = hNorm.indexOf('id');
    var iArchivos = hNorm.indexOf('archivos');
    if (iId < 0 || iArchivos < 0) throw new Error('Columnas no encontradas');
    var data = sheet.getRange(2,1,sheet.getLastRow()-1,sheet.getLastColumn()).getDisplayValues();
    var filaNum = -1;
    var archivosActuales = [];
    for (var i = 0; i < data.length; i++) {
      if (String(data[i][iId]||'').trim() === ccId) {
        filaNum = i + 2;
        try { archivosActuales = JSON.parse(data[i][iArchivos]||'[]'); } catch(e2){}
        break;
      }
    }
    if (filaNum < 0) throw new Error('Registro no encontrado');
    try { DriveApp.getFileById(fileId).setTrashed(true); } catch(e3) {}
    archivosActuales = archivosActuales.filter(function(a){ return a.id !== fileId; });
    sheet.getRange(filaNum, iArchivos + 1).setValue(JSON.stringify(archivosActuales));
    SpreadsheetApp.flush();
    return { ok: true };
  } catch(e) { throw new Error(e.message); }
}
function buscarEquipoFichas(query, mode) {
  try {
    if (!query || !String(query).trim()) return null;

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var q  = String(query).trim();
    var qN = q.replace(/^0+/, '') || '0';

    var serieEncontrada = null;
    var fichaIngEncontrada = '';
    var fichaSalEncontrada = '';

    var checkIng = (mode === 'ambas_fichas' || mode === 'ficha_ingreso');
    var checkSal = (mode === 'ambas_fichas' || mode === 'ficha_salida');

    function normalizarHeader(h) {
      return String(h || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ');
    }

    function fichaNorm(v) {
      var s = String(v || '').trim();
      return s ? (s.replace(/^0+/, '') || '0') : '';
    }

    // 1. Buscar en Formulario INGRESO
    if (checkIng && !serieEncontrada) {
      var sheetIng = ss.getSheetByName(SHEET_INGRESO);
      if (sheetIng && sheetIng.getLastRow() > 1) {
        var headI = sheetIng.getRange(1, 1, 1, sheetIng.getLastColumn()).getDisplayValues()[0];
        var hNI = headI.map(normalizarHeader);

        var colFichaI = hNI.indexOf('numero de ficha de ingreso');
        var colSerieI = hNI.indexOf('serie del producto');

        if (colFichaI < 0) colFichaI = hNI.findIndex(function(h) {
          return h.includes('ficha') && h.includes('ingreso');
        });
        if (colSerieI < 0) colSerieI = hNI.findIndex(function(h) {
          return h.includes('serie');
        });

        if (colFichaI >= 0 && colSerieI >= 0) {
          var dataI = sheetIng.getRange(2, 1, sheetIng.getLastRow() - 1, sheetIng.getLastColumn()).getDisplayValues();

          for (var i = 0; i < dataI.length; i++) {
            var fichaVal = String(dataI[i][colFichaI] || '').trim();
            if (fichaNorm(fichaVal) === qN || fichaVal === q) {
              serieEncontrada = String(dataI[i][colSerieI] || '').trim();
              fichaIngEncontrada = formatFicha_(fichaVal);
              break;
            }
          }
        }
      }
    }

    // 2. Buscar en Formulario SALIDA
    if (checkSal && !serieEncontrada) {
      var sheetSal = ss.getSheetByName(SHEET_SALIDA);
      if (sheetSal && sheetSal.getLastRow() > 1) {
        var headS = sheetSal.getRange(1, 1, 1, sheetSal.getLastColumn()).getDisplayValues()[0];
        var hNS = headS.map(normalizarHeader);

        var colFichaS = hNS.indexOf('numero de ficha de salida');
        var colSerieS = hNS.indexOf('serie del producto');

        if (colFichaS < 0) colFichaS = hNS.findIndex(function(h) {
          return h.includes('ficha') && (h.includes('salida') || h.includes('reparacion'));
        });
        if (colSerieS < 0) colSerieS = hNS.findIndex(function(h) {
          return h.includes('serie');
        });

        if (colFichaS >= 0 && colSerieS >= 0) {
          var dataS = sheetSal.getRange(2, 1, sheetSal.getLastRow() - 1, sheetSal.getLastColumn()).getDisplayValues();

          for (var j = 0; j < dataS.length; j++) {
            var fichaSVal = String(dataS[j][colFichaS] || '').trim();
            if (fichaNorm(fichaSVal) === qN || fichaSVal === q) {
              serieEncontrada = String(dataS[j][colSerieS] || '').trim();
              fichaSalEncontrada = formatFicha_(fichaSVal);
              break;
            }
          }
        }
      }
    }

    // 3. Búsqueda directa por serie
    if (!serieEncontrada && mode === 'serie') {
      serieEncontrada = q;
    }

    if (!serieEncontrada) return null;

    // 4. Buscar en Reporte Taller
    var sheetR = ss.getSheetByName(SHEET_REPORTE);
    var equipo = null;
    var fichaIng = fichaIngEncontrada;
    var fichaSal = fichaSalEncontrada;

    if (sheetR && sheetR.getLastRow() > 1) {
      var headR = sheetR.getRange(1, 1, 1, sheetR.getLastColumn()).getDisplayValues()[0];
      var hNR = headR.map(normalizarHeader);

      var colSerieR = hNR.findIndex(function(h) {
        return h === 'nro serie' || h === 'n serie' || h === 'serie';
      });

      var colFichaIngR = hNR.findIndex(function(h) {
        return h.includes('ficha') && h.includes('ingreso');
      });

      var colFichaSalR = hNR.findIndex(function(h) {
        return h.includes('ficha') && (h.includes('reparacion') || h.includes('salida'));
      });

      if (colSerieR >= 0) {
        var dataR = sheetR.getRange(2, 1, sheetR.getLastRow() - 1, sheetR.getLastColumn()).getDisplayValues();
        var serieN = String(serieEncontrada || '').trim().toLowerCase();

        var filaExacta = null;
        var ultimaFilaSerie = null;

        for (var k = 0; k < dataR.length; k++) {
          var serieRow = String(dataR[k][colSerieR] || '').trim().toLowerCase();
          if (serieRow !== serieN) continue;

          ultimaFilaSerie = k;

          var fichaIngRow = colFichaIngR >= 0 ? dataR[k][colFichaIngR] : '';
          var fichaSalRow = colFichaSalR >= 0 ? dataR[k][colFichaSalR] : '';

          if (fichaNorm(fichaIngRow) === qN || fichaNorm(fichaSalRow) === qN) {
            filaExacta = k;
            break;
          }
        }

        var filaUsar = filaExacta !== null ? filaExacta : ultimaFilaSerie;

        if (filaUsar !== null) {
          var obj = { __rowNum: filaUsar + 2 };
          headR.forEach(function(h, c) {
            obj[String(h).trim()] = dataR[filaUsar][c] || '';
          });

          equipo = obj;

          fichaIng = formatFicha_(
            obj['Ficha de ingreso'] ||
            obj['Ficha ingreso'] ||
            obj['Ficha Ingreso'] ||
            obj['Numero de Ficha de Ingreso'] ||
            fichaIng ||
            ''
          );

          fichaSal = formatFicha_(
            obj['Ficha reparación'] ||
            obj['Ficha de reparación'] ||
            obj['Ficha Reparación'] ||
            obj['Ficha Salida'] ||
            obj['Numero de Ficha de Salida'] ||
            fichaSal ||
            ''
          );
        }
      }
    }

    return {
      equipo: equipo,
      ingresos: [],
      salidas: [],
      detalleGeneral: {
        fichaIngreso:  fichaIng || '-',
        fichaSalida:   fichaSal || '-',
        fechaDetalle:  equipo ? (equipo['Fecha de Ingreso'] || equipo['Fecha Ingreso'] || equipo['Fecha'] || '-') : '-',
        ticket:        equipo ? (equipo['ID Ticket'] || equipo['Id Ticket'] || '') : '',
        diasReparacion: equipo ? (equipo['Dias en Reparación'] || equipo['Días en Reparación'] || '-') : '-',
        fechaSalida:   equipo ? (equipo['Fecha Final de Reparación'] || equipo['Fecha de salida'] || equipo['Fecha Salida'] || '-') : '-',
        motivoIngreso: equipo ? (equipo['Motivo de ingreso de dispensador usado'] || equipo['Motivo de ingreso'] || '-') : '-',
        tecnicoReparacion: equipo ? (equipo['Técnico responsable de reparación'] || equipo['Tecnico responsable de reparación'] || '-') : '-',
        bandeja: equipo ? (equipo['Bandeja'] || '-') : '-'
      },
      currentIngreso: null,
      currentSalida: null
    };

  } catch(e) {
    throw new Error('[buscarEquipoFichas] ' + e.message);
  }
}
// =========================================
// FICHAS — guardar, leer, eliminar
// =========================================
var SHEET_FICHAS2     = 'Fichas';
var FOLDER_ID_FICHAS2 = '12ZMRwtNxJAmIgQGjQ_IcWjGySiE3EJJI';

function guardarFicha(payload, archivo, reemplazar) {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(30000); } catch(e) { throw new Error('Sistema ocupado.'); }
  try {
    var ss     = SpreadsheetApp.getActiveSpreadsheet();
    var folder = DriveApp.getFolderById(FOLDER_ID_FICHAS2);

    if (reemplazar) {
      var regActual = fichas_leerRegistro_(ss, payload.serie);
      if (regActual) {
        var campo = payload.tipo === 'ingreso' ? 'Archivo Ingreso' : 'Archivo Salida';
        var archStr = regActual[campo] || '';
        if (archStr) {
          try { var archAnterior = JSON.parse(archStr); if (archAnterior && archAnterior.id) DriveApp.getFileById(archAnterior.id).setTrashed(true); } catch(e2) {}
        }
      }
    }

    var tz       = Session.getScriptTimeZone();
    var fecha    = new Date();
    var fechaStr = Utilities.formatDate(fecha, tz, 'yyyy-MM-dd');
    var fichaNum  = payload.tipo === 'ingreso' ? (payload.fichaIngreso || '') : (payload.fichaSalida || '');
var tipoLabel = payload.tipo === 'ingreso' ? 'Ficha Ingreso' : 'Ficha Salida';
var nombre    = String(payload.serie || 'SIN_SERIE') + ' ' + tipoLabel + ' N' + String(fichaNum).padStart(6,'0') + ' ' + Utilities.formatDate(fecha, tz, 'yyyy dd MM') + '.' + archivo.ext;
    var blob     = Utilities.newBlob(Utilities.base64Decode(archivo.base64), archivo.mimeType, nombre);
    var file     = folder.createFile(blob);
    try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch(e3) {}

    var linkDirecto = 'https://drive.google.com/file/d/' + file.getId() + '/view?usp=sharing';
    var archJSONinterno = JSON.stringify({
      id:     file.getId(),
      url:    linkDirecto,
      nombre: nombre,
      thumb:  'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w400'
    });
// Guardar en Sheets solo la URL (para que se vea limpio)
fichas_guardarRegistro_(ss, payload, linkDirecto);
SpreadsheetApp.flush();
// Devolver el JSON completo al frontend para que pueda usarlo
return { ok: true, archivoJSON: archJSONinterno };
  } catch(e) {
    throw new Error('[guardarFicha] ' + e.message);
  } finally {
    lock.releaseLock();
  }
}

function getFichaPorSerie(serie) {
  try {
    var ss  = SpreadsheetApp.getActiveSpreadsheet();
    return fichas_leerRegistro_(ss, String(serie || '').trim()) || null;
  } catch(e) { throw new Error(e.message); }
}

function eliminarArchivoFicha(serie, tipo) {
  try {
    var ss  = SpreadsheetApp.getActiveSpreadsheet();
    var reg = fichas_leerRegistro_(ss, String(serie || '').trim());
    if (!reg) return { ok: true };
    var campo = tipo === 'ingreso' ? 'Archivo Ingreso' : 'Archivo Salida';
    var archStr = reg[campo] || '';
    if (archStr) {
      try { var arch = JSON.parse(archStr); if (arch && arch.id) DriveApp.getFileById(arch.id).setTrashed(true); } catch(e2) {}
    }
    fichas_guardarCampo_(ss, reg.__rowNum, campo, '');
    SpreadsheetApp.flush();
    return { ok: true };
  } catch(e) { throw new Error(e.message); }
}

function getImagenFichaBase64(fileId) {
  try {
    var file = DriveApp.getFileById(fileId);
    var mime = file.getMimeType();
    var b64  = Utilities.base64Encode(file.getBlob().getBytes());
    return { ok: true, dataUrl: 'data:' + mime + ';base64,' + b64 };
  } catch(e) { return { ok: false, error: e.message }; }
}

function fichas_asegurarHoja_(ss) {
  var sheet = ss.getSheetByName(SHEET_FICHAS2);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_FICHAS2);
    sheet.getRange(1, 1, 1, 9).setValues([['ID','Fecha Registro','Serie','Modelo','Cliente','Ficha Ingreso','Ficha Salida','Archivo Ingreso','Archivo Salida']]);
  }
  return sheet;
}

function fichas_leerRegistro_(ss, serie) {
  var sheet = ss.getSheetByName(SHEET_FICHAS2);
  if (!sheet || sheet.getLastRow() < 2) return null;
  
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  var hNorm   = headers.map(function(h) { return String(h).trim().toLowerCase(); });
  var iSerie  = hNorm.indexOf('serie');
  if (iSerie < 0) return null;
  
  var data    = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getDisplayValues();
  var sNorm   = serie.trim().toLowerCase();
  var ultimaFila = null; // ← guardamos la ÚLTIMA coincidencia

  for (var i = 0; i < data.length; i++) {
    if (String(data[i][iSerie] || '').trim().toLowerCase() === sNorm) {
      ultimaFila = { rowNum: i + 2, data: data[i] };
      // NO hacemos break → seguimos para encontrar la más reciente
    }
  }

  if (!ultimaFila) return null;

  var obj = { __rowNum: ultimaFila.rowNum };
  headers.forEach(function(h, c) { obj[h] = ultimaFila.data[c] || ''; });
  return obj;
}

function fichas_guardarRegistro_(ss, payload, archJSON) {
  var sheet   = fichas_asegurarHoja_(ss);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  var hNorm   = headers.map(function(h) { return String(h).trim().toLowerCase(); });

  var iId        = hNorm.indexOf('id');
  var iFechaReg  = hNorm.indexOf('fecha registro');
  var iSerie     = hNorm.indexOf('serie');
  var iModelo    = hNorm.indexOf('modelo');
  var iCliente   = hNorm.indexOf('cliente');
  var iFichaIng  = hNorm.indexOf('ficha ingreso');
  var iFichaSal  = hNorm.indexOf('ficha salida');
  var iArchIng   = hNorm.indexOf('archivo ingreso');
  var iArchSal   = hNorm.indexOf('archivo salida');

  function fichaTexto(val) {
    var f = formatFicha_(val);
    if (!f || f === '-') return '';
    return "'" + f;
  }

  function fichaNorm(val) {
    return String(val || '').trim().replace(/^'/, '').replace(/^0+/, '') || '0';
  }

  // Buscar fila existente por serie + ficha de ingreso
  var rowNum = -1;

  if (sheet.getLastRow() > 1) {
    var data  = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getDisplayValues();
    var sNorm = String(payload.serie || '').trim().toLowerCase();
    var fichaIngNorm = fichaNorm(payload.fichaIngreso);

    for (var i = 0; i < data.length; i++) {
      var serieCol    = iSerie >= 0 ? data[i][iSerie] : '';
      var fichaIngCol = iFichaIng >= 0 ? data[i][iFichaIng] : '';

      if (
        String(serieCol || '').trim().toLowerCase() === sNorm &&
        fichaNorm(fichaIngCol) === fichaIngNorm
      ) {
        rowNum = i + 2;
        break;
      }
    }
  }

  if (rowNum > 0) {
    // Actualizar fila existente
    if (payload.tipo === 'ingreso' && iArchIng >= 0) {
      sheet.getRange(rowNum, iArchIng + 1).setValue(archJSON);

      if (iFichaIng >= 0 && payload.fichaIngreso) {
        sheet.getRange(rowNum, iFichaIng + 1).setNumberFormat('@');
        sheet.getRange(rowNum, iFichaIng + 1).setValue(fichaTexto(payload.fichaIngreso));
      }

      if (iFichaSal >= 0 && payload.fichaSalida) {
        sheet.getRange(rowNum, iFichaSal + 1).setNumberFormat('@');
        sheet.getRange(rowNum, iFichaSal + 1).setValue(fichaTexto(payload.fichaSalida));
      }

    } else if (payload.tipo === 'salida' && iArchSal >= 0) {
      sheet.getRange(rowNum, iArchSal + 1).setValue(archJSON);

      if (iFichaIng >= 0 && payload.fichaIngreso) {
        sheet.getRange(rowNum, iFichaIng + 1).setNumberFormat('@');
        sheet.getRange(rowNum, iFichaIng + 1).setValue(fichaTexto(payload.fichaIngreso));
      }

      if (iFichaSal >= 0 && payload.fichaSalida) {
        sheet.getRange(rowNum, iFichaSal + 1).setNumberFormat('@');
        sheet.getRange(rowNum, iFichaSal + 1).setValue(fichaTexto(payload.fichaSalida));
      }
    }

  } else {
    // Nueva fila
    var tz    = Session.getScriptTimeZone();
    var fecha = new Date();
    var idVal = 'FI-' + Utilities.formatDate(fecha, tz, 'yyyyMMddHHmmss');

    var newRow = new Array(headers.length).fill('');

    if (iId       >= 0) newRow[iId]       = idVal;
    if (iFechaReg >= 0) newRow[iFechaReg] = Utilities.formatDate(fecha, tz, 'dd/MM/yyyy HH:mm:ss');
    if (iSerie    >= 0) newRow[iSerie]    = payload.serie   || '';
    if (iModelo   >= 0) newRow[iModelo]   = payload.modelo  || '';
    if (iCliente  >= 0) newRow[iCliente]  = payload.cliente || '';

    if (iFichaIng >= 0) newRow[iFichaIng] = fichaTexto(payload.fichaIngreso);
    if (iFichaSal >= 0) newRow[iFichaSal] = fichaTexto(payload.fichaSalida);

    if (payload.tipo === 'ingreso') {
      if (iArchIng >= 0) newRow[iArchIng] = archJSON;
    } else {
      if (iArchSal >= 0) newRow[iArchSal] = archJSON;
    }

    sheet.appendRow(newRow);

    var nuevaFila = sheet.getLastRow();

    if (iFichaIng >= 0) {
      sheet.getRange(nuevaFila, iFichaIng + 1).setNumberFormat('@');
    }

    if (iFichaSal >= 0) {
      sheet.getRange(nuevaFila, iFichaSal + 1).setNumberFormat('@');
    }
  }
}

function fichas_guardarCampo_(ss, rowNum, campo, valor) {
  var sheet = ss.getSheetByName(SHEET_FICHAS2);
  if (!sheet || !rowNum) return;
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  var hNorm   = headers.map(function(h) { return String(h).trim().toLowerCase(); });
  var idx     = hNorm.indexOf(campo.toLowerCase());
  if (idx >= 0) sheet.getRange(rowNum, idx + 1).setValue(valor);
}
// Array.prototype.findIndex polyfill para Apps Script (por si acaso)
if (!Array.prototype.findIndex) {
  Array.prototype.findIndex = function(predicate) {
    for (var i = 0; i < this.length; i++) {
      if (predicate(this[i], i, this)) return i;
    }
    return -1;
  };
}
 function getFichasMap() {
  try {
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_FICHAS2);
    if (!sheet || sheet.getLastRow() < 2) return {};

    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
    var hNorm   = headers.map(function(h) { return String(h).trim().toLowerCase(); });

    var iSerie   = hNorm.indexOf('serie');
    var iFichaIng = hNorm.indexOf('ficha ingreso');
    var iFichaSal = hNorm.indexOf('ficha salida');
    var iArchIng = hNorm.indexOf('archivo ingreso');
    var iArchSal = hNorm.indexOf('archivo salida');

    if (iSerie < 0) return {};

    var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getDisplayValues();
    var map  = {};

    function normSerie(v) {
      return String(v || '').trim().toLowerCase();
    }

    function normFicha(v) {
      return String(v || '').trim().replace(/^'/, '').replace(/^0+/, '') || '0';
    }

    data.forEach(function(row) {
      var serie = normSerie(row[iSerie]);
      if (!serie) return;

      var fichaIng = iFichaIng >= 0 ? normFicha(row[iFichaIng]) : '';
      var fichaSal = iFichaSal >= 0 ? normFicha(row[iFichaSal]) : '';

      var archIng = iArchIng >= 0 ? String(row[iArchIng] || '').trim() : '';
      var archSal = iArchSal >= 0 ? String(row[iArchSal] || '').trim() : '';

      var item = {
        idIng:  extraerFileId_(archIng),
        urlIng: extraerUrl_(archIng),
        idSal:  extraerFileId_(archSal),
        urlSal: extraerUrl_(archSal)
      };

      if (fichaIng) map[serie + '|ing|' + fichaIng] = item;
      if (fichaSal) map[serie + '|sal|' + fichaSal] = item;
      if (fichaIng && fichaSal) map[serie + '|both|' + fichaIng + '|' + fichaSal] = item;

      // fallback solo si no existe todavía
      if (!map[serie]) map[serie] = item;
    });

    return map;
  } catch(e) {
    return {};
  }
}

function extraerFileId_(archStr) {
  if (!archStr) return '';

  archStr = String(archStr).trim().replace(/^'/, '');

  if (archStr.charAt(0) === '{') {
    try {
      var j = JSON.parse(archStr);
      return j.id || '';
    } catch(e) {
      return '';
    }
  }

  var m = archStr.match(/\/d\/([a-zA-Z0-9_-]+)\//);
  return m ? m[1] : '';
}

function extraerUrl_(archStr) {
  if (!archStr) return '';

  archStr = String(archStr).trim().replace(/^'/, '');

  if (archStr.charAt(0) === '{') {
    try {
      var j = JSON.parse(archStr);
      return j.url || '';
    } catch(e) {
      return '';
    }
  }

  return archStr.indexOf('http') === 0 ? archStr : '';
}

function guardarImagenFichaRotada(fileIdAnterior, tipo, archivo) {
  try {
    if (!fileIdAnterior) throw new Error('No se recibió el ID del archivo anterior.');
    if (!archivo || !archivo.base64) throw new Error('No se recibió la imagen rotada.');

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_FICHAS2);
    if (!sheet) throw new Error('No existe la hoja Fichas.');

    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
    var hNorm = headers.map(function(h) {
      return String(h || '').trim().toLowerCase();
    });

    var iSerie = hNorm.indexOf('serie');
    var iFichaIng = hNorm.indexOf('ficha ingreso');
    var iFichaSal = hNorm.indexOf('ficha salida');

    var iArch = tipo === 'ingreso'
      ? hNorm.indexOf('archivo ingreso')
      : hNorm.indexOf('archivo salida');

    if (iArch < 0) throw new Error('No se encontró la columna de archivo.');

    var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getDisplayValues();

    var filaNum = -1;
    var filaData = null;

    for (var i = 0; i < data.length; i++) {
      var val = String(data[i][iArch] || '');

      if (val.indexOf(fileIdAnterior) >= 0) {
        filaNum = i + 2;
        filaData = data[i];
        break;
      }
    }

    if (filaNum < 0 || !filaData) {
      throw new Error('No se encontró el archivo en la hoja Fichas.');
    }

    function limpiarFicha_(value) {
      var s = String(value || '').trim().replace(/^'/, '');
      if (!s || s === '-') return '';
      if (/^\d+$/.test(s)) return s.padStart(6, '0');
      return s;
    }

    function extensionDesdeMime_(mime) {
      mime = String(mime || '').toLowerCase();
      if (mime.indexOf('png') >= 0) return 'png';
      if (mime.indexOf('webp') >= 0) return 'webp';
      return 'jpg';
    }

    var serie = iSerie >= 0 ? String(filaData[iSerie] || '').trim() : '';
    if (!serie) serie = 'SIN_SERIE';

    var ficha = '';
    var tipoLabel = '';

    if (tipo === 'ingreso') {
      ficha = iFichaIng >= 0 ? limpiarFicha_(filaData[iFichaIng]) : '';
      tipoLabel = 'Ficha Ingreso';
    } else {
      ficha = iFichaSal >= 0 ? limpiarFicha_(filaData[iFichaSal]) : '';
      tipoLabel = 'Ficha Salida';
    }

    if (!ficha) ficha = '000000';

    var tz = Session.getScriptTimeZone();
    var fecha = new Date();
    var fechaStr = Utilities.formatDate(fecha, tz, 'yyyy dd MM');
    var ext = extensionDesdeMime_(archivo.mimeType || 'image/jpeg');

    var nombre = serie + ' ' + tipoLabel + ' N' + ficha + ' ' + fechaStr + '.' + ext;

    var folder = DriveApp.getFolderById(FOLDER_ID_FICHAS2);

    try {
      DriveApp.getFileById(fileIdAnterior).setTrashed(true);
    } catch(e2) {}

    var blob = Utilities.newBlob(
      Utilities.base64Decode(archivo.base64),
      archivo.mimeType || 'image/jpeg',
      nombre
    );

    var nuevoFile = folder.createFile(blob);

    try {
      nuevoFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch(e3) {}

    var linkDirecto = 'https://drive.google.com/file/d/' + nuevoFile.getId() + '/view?usp=sharing';

    var nuevoJSON = JSON.stringify({
      id: nuevoFile.getId(),
      url: linkDirecto,
      nombre: nombre,
      thumb: 'https://drive.google.com/thumbnail?id=' + nuevoFile.getId() + '&sz=w400'
    });

    sheet.getRange(filaNum, iArch + 1).setValue(linkDirecto);
    SpreadsheetApp.flush();

    return {
      ok: true,
      archivoJSON: nuevoJSON,
      url: linkDirecto,
      nombre: nombre
    };

  } catch(e) {
    throw new Error('[guardarImagenFichaRotada] ' + e.message);
  }
}


function parseNumeroDias_(value) {
  if (value === null || value === undefined) return null;

  var text = String(value).trim();
  if (!text || text === '-') return null;

  text = text.replace(',', '.');

  var match = text.match(/-?\d+(\.\d+)?/);
  if (!match) return null;

  var n = Number(match[0]);
  return isNaN(n) ? null : n;
}

function calcularDiasReparacion_(r) {
  var diasDirecto = parseNumeroDias_(
    r['Dias en Reparación'] ||
    r['Días en Reparación'] ||
    r['Dias Reparación'] ||
    r['Días Reparación'] ||
    ''
  );

  if (diasDirecto !== null && diasDirecto >= 0) {
    return diasDirecto;
  }

  var fechaIngreso = parseFlexibleDate_(
    r['Fecha de Ingreso'] ||
    r['Fecha Ingreso'] ||
    r['Fecha'] ||
    ''
  );

  var fechaSalida = parseFlexibleDate_(
    r['Fecha Final de Reparación'] ||
    r['Fecha de salida'] ||
    r['Fecha Salida'] ||
    ''
  );

  if (!fechaIngreso || !fechaSalida) return null;

  var msDia = 24 * 60 * 60 * 1000;
  var dias = Math.round((fechaSalida.getTime() - fechaIngreso.getTime()) / msDia);

  return dias >= 0 ? dias : null;
}


function getKpiHorasReparacion(rangoFechas, segmento) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var reporte = getSheetObjects_(ss.getSheetByName(SHEET_REPORTE));
    var salida = getSheetObjects_(ss.getSheetByName(SHEET_SALIDA));

    segmento = segmento || 'global';

    var fechaInicio = rangoFechas && rangoFechas.desdeISO ? parseISODate_(rangoFechas.desdeISO) : null;
    var fechaFin = rangoFechas && rangoFechas.hastaISO ? parseISODate_(rangoFechas.hastaISO) : null;

    function perteneceSegmentoReporte(row) {
      if (segmento === 'global') return true;

      var cliente = normalize_(row['Cliente'] || '');
      var esEden = cliente.includes('eden');

      if (segmento === 'eden') return esEden;
      if (segmento === 'clientes') return !esEden;

      return true;
    }

    function dentroDeRangoIngresoYSalida(row) {
      if (!fechaInicio && !fechaFin) return true;

      var fechaIngreso = parseFlexibleDate_(
        row['Fecha de Ingreso'] ||
        row['Fecha Ingreso'] ||
        row['Fecha'] ||
        ''
      );

      var fechaSalida = parseFlexibleDate_(
        row['Fecha Final de Reparación'] ||
        row['Fecha de salida'] ||
        row['Fecha Salida'] ||
        ''
      );

      if (!fechaIngreso || !fechaSalida) return false;

      var tIngreso = fechaIngreso.getTime();
      var tSalida = fechaSalida.getTime();

      if (fechaInicio && tIngreso < fechaInicio.getTime()) return false;
      if (fechaFin && tIngreso > fechaFin.getTime()) return false;

      if (fechaInicio && tSalida < fechaInicio.getTime()) return false;
      if (fechaFin && tSalida > fechaFin.getTime()) return false;

      return true;
    }
    function dentroDeRangoSalida(row) {
      if (!fechaInicio && !fechaFin) return true;

      var fechaSalida = parseFlexibleDate_(
        row['Fecha Final de Reparación'] ||
        row['Fecha de salida'] ||
        row['Fecha Salida'] ||
        ''
      );

      if (!fechaSalida) return false;

      var tSalida = fechaSalida.getTime();
      if (fechaInicio && tSalida < fechaInicio.getTime()) return false;
      if (fechaFin && tSalida > fechaFin.getTime()) return false;

      return true;
    }
    function dentroDeMesIngresoYSalida(row, mesInicio, mesFin) {
      var fechaIngreso = parseFlexibleDate_(
        row['Fecha de Ingreso'] ||
        row['Fecha Ingreso'] ||
        row['Fecha'] ||
        ''
      );

      var fechaSalida = parseFlexibleDate_(
        row['Fecha Final de Reparación'] ||
        row['Fecha de salida'] ||
        row['Fecha Salida'] ||
        ''
      );

      if (!fechaIngreso || !fechaSalida) return false;

      if (fechaIngreso.getTime() < mesInicio.getTime()) return false;
      if (fechaIngreso.getTime() > mesFin.getTime()) return false;

      if (fechaSalida.getTime() < mesInicio.getTime()) return false;
      if (fechaSalida.getTime() > mesFin.getTime()) return false;

      return true;
    }

    function normSerie(v) {
      return String(v || '').trim().toLowerCase();
    }

    function normFicha(v) {
      var s = String(v || '').trim().replace(/^'/, '');
      if (!s || s === '-') return '';
      return s.replace(/^0+/, '') || '0';
    }

    function esBaja(row) {
      var status = normalize_(row['Status'] || row['Estado'] || '');
      return status.includes('retiro') || status.includes('baja') || status.includes('desecho');
    }

    var salidaPorSerieFicha = {};
    var salidaPorSerie = {};

    salida.forEach(function(row) {
      var serie = normSerie(row['Serie del Producto'] || row['Serie'] || '');
      var ficha = normFicha(row['Numero de Ficha de Salida'] || row['Número de Ficha de Salida'] || '');

      if (!serie) return;

      if (ficha) {
        salidaPorSerieFicha[serie + '|' + ficha] = row;
      }

      salidaPorSerie[serie] = row;
    });

    function obtenerSalidaRow(rowReporte) {
      var serie = normSerie(rowReporte['Nro Serie'] || rowReporte['N° Serie'] || rowReporte['Serie'] || '');
      if (!serie) return null;

      var fichaSalida = normFicha(
        rowReporte['Ficha reparación'] ||
        rowReporte['Ficha de reparación'] ||
        rowReporte['Ficha Reparación'] ||
        rowReporte['Ficha Salida'] ||
        rowReporte['Numero de Ficha de Salida'] ||
        ''
      );

      if (fichaSalida && salidaPorSerieFicha[serie + '|' + fichaSalida]) {
        return salidaPorSerieFicha[serie + '|' + fichaSalida];
      }

      return salidaPorSerie[serie] || null;
    }

    function calcularHorasDesdeSalida(salidaRow) {
      if (!salidaRow) return null;

      var horaInicio = parseHoraDisplay_(salidaRow['Hora de Inicio de Reparación'] || '');
      var horaTermino = parseHoraDisplay_(salidaRow['Hora de Termino de Reparación'] || '');

      if (!horaInicio || !horaTermino) return null;

      return calcularDiferenciaHoras_(horaInicio, horaTermino);
    }

    var totalHoras = 0;
    var totalEquipos = 0;
    var porModeloMap = {};
    var equiposDetalle = [];

    reporte.forEach(function(row) {
      if (!dentroDeRangoSalida(row)) return;
      if (!perteneceSegmentoReporte(row)) return;
      if (esBaja(row)) return;

      var salidaRow = obtenerSalidaRow(row);
      var horas = calcularHorasDesdeSalida(salidaRow);

      if (horas === null) return;

      var serieOriginal = String(row['Nro Serie'] || row['N° Serie'] || row['Serie'] || '').trim();
      var modelo = String(row['Modelo'] || 'Sin modelo').trim() || 'Sin modelo';
      var cliente = String(row['Cliente'] || '').trim() || '-';
      var fichaSalidaOriginal =
        row['Ficha reparación'] ||
        row['Ficha de reparación'] ||
        row['Ficha Reparación'] ||
        row['Ficha Salida'] ||
        row['Numero de Ficha de Salida'] ||
        '';

      var fechaSalida =
        row['Fecha Final de Reparación'] ||
        row['Fecha de salida'] ||
        row['Fecha Salida'] ||
        '-';

      totalHoras += horas;
      totalEquipos++;

      if (!porModeloMap[modelo]) {
        porModeloMap[modelo] = {
          modelo: modelo,
          totalHoras: 0,
          totalEquipos: 0
        };
      }

      porModeloMap[modelo].totalHoras += horas;
      porModeloMap[modelo].totalEquipos++;

      equiposDetalle.push({
        serie: serieOriginal,
        modelo: modelo,
        cliente: cliente,
        fichaSalida: formatFicha_(fichaSalidaOriginal),
        fechaSalida: fechaSalida,
        horaInicio: salidaRow['Hora de Inicio de Reparación'] || '',
        horaTermino: salidaRow['Hora de Termino de Reparación'] || '',
        horas: horas
      });
    });

    var promedioHoras = totalEquipos > 0
      ? Math.round((totalHoras / totalEquipos) * 10) / 10
      : 0;

    var porModelo = Object.keys(porModeloMap).map(function(k) {
      var item = porModeloMap[k];

      return {
        modelo: item.modelo,
        totalEquipos: item.totalEquipos,
        promedioHoras: Math.round((item.totalHoras / item.totalEquipos) * 10) / 10
      };
    }).sort(function(a, b) {
      if (b.totalEquipos !== a.totalEquipos) return b.totalEquipos - a.totalEquipos;
      return b.promedioHoras - a.promedioHoras;
    });

    equiposDetalle.sort(function(a, b) {
      if (b.horas !== a.horas) return b.horas - a.horas;
      return a.modelo.localeCompare(b.modelo, 'es');
    });

    var yearBase = fechaInicio ? fechaInicio.getFullYear() : new Date().getFullYear();
    var mesesNombre = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    var tendenciaMensual = [];

    var hoy = new Date();
var ultimoMes = yearBase === hoy.getFullYear() ? hoy.getMonth() : 11;

for (var mesIdx = 0; mesIdx <= ultimoMes; mesIdx++) {
      var mesInicio = new Date(yearBase, mesIdx, 1);
      var mesFin = new Date(yearBase, mesIdx + 1, 0);

      var totalHorasMes = 0;
      var totalEquiposMes = 0;

      reporte.forEach(function(row) {
        if (!perteneceSegmentoReporte(row)) return;
        if (esBaja(row)) return;
        if (!dentroDeMesIngresoYSalida(row, mesInicio, mesFin)) return;

        var salidaRow = obtenerSalidaRow(row);
        var horas = calcularHorasDesdeSalida(salidaRow);

        if (horas === null) return;

        totalHorasMes += horas;
        totalEquiposMes++;
      });

      tendenciaMensual.push({
        mes: mesesNombre[mesIdx],
        promedioHoras: totalEquiposMes > 0
          ? Math.round((totalHorasMes / totalEquiposMes) * 10) / 10
          : 0,
        totalEquipos: totalEquiposMes
      });
    }

    return {
      segmento: segmento,
      desde: rangoFechas && rangoFechas.desdeISO ? rangoFechas.desdeISO : '',
      hasta: rangoFechas && rangoFechas.hastaISO ? rangoFechas.hastaISO : '',
      promedioHoras: promedioHoras,
      totalEquipos: totalEquipos,
      porModelo: porModelo,
      equipos: equiposDetalle,
      tendenciaMensual: tendenciaMensual
    };

  } catch(e) {
    throw new Error('[getKpiHorasReparacion] ' + e.message);
  }
}
function parseHoraDisplay_(value) {
  if (!value) return null;

  var text = String(value).trim().toLowerCase();
  if (!text || text === '-') return null;

  text = text
    .replace(/\s+/g, ' ')
    .replace(/a\.?\s*m\.?/g, 'am')
    .replace(/p\.?\s*m\.?/g, 'pm');

  var m = text.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!m) return null;

  var h = parseInt(m[1], 10);
  var min = parseInt(m[2], 10);
  var sec = m[3] ? parseInt(m[3], 10) : 0;
  var periodo = m[4] || '';

  if (isNaN(h) || isNaN(min) || isNaN(sec)) return null;

  if (periodo === 'pm' && h < 12) h += 12;
  if (periodo === 'am' && h === 12) h = 0;

  if (h < 0 || h > 23 || min < 0 || min > 59 || sec < 0 || sec > 59) return null;

  return {
    h: h,
    m: min,
    s: sec,
    totalSegundos: h * 3600 + min * 60 + sec
  };
}

 function calcularDiferenciaHoras_(inicio, termino) {
  if (!inicio || !termino) return null;

  var diff = termino.totalSegundos - inicio.totalSegundos;

  // Si terminó después de medianoche.
  if (diff < 0) diff += 24 * 3600;

  var horas = diff / 3600;

  if (horas < 0 || horas > 24) return null;

  return Math.round(horas * 10) / 10;}

// =========================================
// STOCK PRODUCTOS — Sheets externo
// =========================================
var STOCK_SPREADSHEET_ID = '15FXL0jxx93yucWsyywts0xFxLlEg64hU8CbSgF-glqA';
var STOCK_SHEET_NAME     = 'Stock Productos Total';

function getStockProductos(query) {
  try {
    var ss    = SpreadsheetApp.openById(STOCK_SPREADSHEET_ID);
    var sheet = ss.getSheetByName(STOCK_SHEET_NAME);
    if (!sheet) throw new Error('No se encontró la hoja: ' + STOCK_SHEET_NAME);

    var values = sheet.getDataRange().getDisplayValues();
    if (values.length < 2) return { rows: [], total: 0 };

    var headers = values[0].map(function(h) { return String(h).trim().toLowerCase(); });

    var iProducto   = headers.indexOf('producto');
    var iSku        = headers.indexOf('sku');
    var iCategoria  = headers.indexOf('categoria');
    var iUbicacion  = headers.indexOf('ubicacion');
    var iDisponible = headers.indexOf('disponible');

    // fallbacks si el nombre varía levemente
    if (iProducto  < 0) iProducto  = headers.findIndex(function(h){ return h.includes('product'); });
    if (iSku       < 0) iSku       = headers.findIndex(function(h){ return h.includes('sku'); });
    if (iCategoria < 0) iCategoria = headers.findIndex(function(h){ return h.includes('categ'); });
    if (iUbicacion < 0) iUbicacion = headers.findIndex(function(h){ return h.includes('ubic'); });
    if (iDisponible< 0) iDisponible= headers.findIndex(function(h){ return h.includes('disp'); });

    var q = String(query || '').toLowerCase().trim();

    var rows = [];
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      var producto   = iProducto   >= 0 ? String(row[iProducto]   || '').trim() : '';
      var sku        = iSku        >= 0 ? String(row[iSku]        || '').trim() : '';
      var categoria  = iCategoria  >= 0 ? String(row[iCategoria]  || '').trim() : '';
      var ubicacion  = iUbicacion  >= 0 ? String(row[iUbicacion]  || '').trim() : '';
      var disponible = iDisponible >= 0 ? String(row[iDisponible] || '').trim() : '';

      if (!producto && !sku) continue;

      if (q) {
        var texto = (producto + ' ' + sku + ' ' + categoria + ' ' + ubicacion).toLowerCase();
        if (!texto.includes(q)) continue;
      }

      rows.push({
        producto:   producto,
        sku:        sku,
        categoria:  categoria,
        ubicacion:  ubicacion,
        disponible: disponible
      });
    }

    return { rows: rows, total: rows.length };
  } catch(e) {
    throw new Error('[Stock] ' + e.message);
  }
}
// =========================================
// CHECKLIST LOGÍSTICA
// =========================================
// =========================================
// CHECKLIST — Generación desde plantilla
// =========================================
var PLANTILLA_ID      = '1iQMNvaRR0j4EA0AputidUoGrD8ZMVbQZQrtHDi5HJJU';
var FOLDER_ID_CHECKLIST = '1d-MWpVHuQtjdU1EEA_abEmYuK_0J4EuR';
var CHECKLIST_SHEET   = 'Checklist Correlativo';

function generarChecklistWord(payload) {
  try {
    // ── 1. Correlativo ───────────────────────────────────────────
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CHECKLIST_SHEET);
    if (!sheet) {
      sheet = ss.insertSheet(CHECKLIST_SHEET);
      sheet.getRange(1,1).setValue(0);
    }
    // Usar el correlativo que escribió el usuario si existe
    var corrStr = String(payload.correlativo || '').trim();
    if (!corrStr) {
      // Si no vino del frontend, usar el auto-incremental
      var correlativo = parseInt(sheet.getRange(1,1).getValue() || 0, 10) + 1;
      sheet.getRange(1,1).setValue(correlativo);
      corrStr = String(correlativo).padStart(3, '0');
    } else {
      // Actualizar el contador con el valor usado si es mayor
      var numUsado = parseInt(corrStr, 10) || 0;
      var numActual = parseInt(sheet.getRange(1,1).getValue() || 0, 10);
      if (numUsado > numActual) {
        sheet.getRange(1,1).setValue(numUsado);
      }
    }

    // ── 2. Copiar plantilla ──────────────────────────────────────
    var plantillaFile = DriveApp.getFileById(PLANTILLA_ID);
    var folder        = DriveApp.getFolderById(FOLDER_ID_CHECKLIST);
    var tz = Session.getScriptTimeZone();
    var fechaHoy = new Date();
    var nombreDoc = 'CHECK LIST DE REPUESTOS TRANSFERENCIA A LOGISTICA ' +
      corrStr + '-JPMA-' +
      Utilities.formatDate(fechaHoy, tz, 'yyyy') + ' EDEN ' +
      Utilities.formatDate(fechaHoy, tz, 'dd.MM.yyyy');

    var copiaFile = plantillaFile.makeCopy(nombreDoc, folder);
    var doc       = abrirDocConReintentos_(copiaFile.getId());
    var body      = doc.getBody();

    // ── 3. Reemplazar marcadores simples ─────────────────────────
    var motivo1 = payload.motivo1 ? '☒' : '☐';
    var motivo2 = payload.motivo2 ? '☒' : '☐';
    var motivo3 = payload.motivo3 ? '☒' : '☐';

var filasPayload = payload.filas || [];

var reemplazos = {
  '{{CORRELATIVO}}': corrStr,
  '{{FECHA}}':       payload.fecha       || '',
  '{{AUTORIZADO}}':  payload.autorizado  || '',
  '{{TECNICO}}':     payload.tecnico     || '',
  '{{ANALISTA}}':    payload.analista    || '',
  '{{MOTIVO1}}':     motivo1,
  '{{MOTIVO2}}':     motivo2,
  '{{MOTIVO3}}':     motivo3,
  '{{MOTIVO_OTRO}}': payload.motivoOtro  || '',
  '{{DETALLE}}':     payload.detalle     || '',
  '{{TOTAL}}':       String(filasPayload.reduce(function(s, f) {
    return s + (parseInt(f.cantidad, 10) || 0);
  }, 0)),
  '{{EVAL_NOMBRE}}': payload.respEvalNombre || '',
  '{{EVAL_FECHA}}':  payload.respEvalFecha  || '',
  '{{AUT_NOMBRE}}':  payload.respAutNombre  || '',
  '{{AUT_FECHA}}':   payload.respAutFecha   || ''
};

    Object.keys(reemplazos).forEach(function(marcador) {
      body.replaceText(marcador, reemplazos[marcador]);
    });

    // ── 4. Tabla de repuestos dinámica ───────────────────────────
    // Buscar la tabla que contiene {{FILA_NUM}}
    var tablaRepuestos = null;
    var filaPlantilla  = -1;

    var tablas = body.getTables();
    for (var t = 0; t < tablas.length; t++) {
      var tbl = tablas[t];
      for (var r = 0; r < tbl.getNumRows(); r++) {
        var row = tbl.getRow(r);
        for (var c = 0; c < row.getNumCells(); c++) {
          if (row.getCell(c).getText().indexOf('{{FILA_NUM}}') >= 0) {
            tablaRepuestos = tbl;
            filaPlantilla  = r;
            break;
          }
        }
        if (tablaRepuestos) break;
      }
      if (tablaRepuestos) break;
    }

    if (tablaRepuestos && filaPlantilla >= 0) {
      var filas = filasPayload;

      // Guardar el estilo de la fila plantilla
      var filaBase = tablaRepuestos.getRow(filaPlantilla);

      // Insertar filas de datos (de atrás hacia adelante para mantener orden)
      for (var i = filas.length - 1; i >= 0; i--) {
        var f = filas[i];
        // Copiar fila plantilla
        tablaRepuestos.insertTableRow(filaPlantilla, filaBase.copy());
        var nuevaFila = tablaRepuestos.getRow(filaPlantilla);

        // Reemplazar marcadores en la nueva fila
        nuevaFila.getCell(0).editAsText().setText(String(i + 1));
        nuevaFila.getCell(1).editAsText().setText(f.modelo      || '');
        nuevaFila.getCell(2).editAsText().setText(f.descripcion || '');
        nuevaFila.getCell(3).editAsText().setText(String(f.cantidad || 1));
        nuevaFila.getCell(4).editAsText().setText(f.observaciones || 'Ninguna');

        // Centrar # y Cant
        var par0 = nuevaFila.getCell(0).getChild(0);
        if (par0 && par0.getType() === DocumentApp.ElementType.PARAGRAPH) {
          par0.asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);
        }
        var par3 = nuevaFila.getCell(3).getChild(0);
        if (par3 && par3.getType() === DocumentApp.ElementType.PARAGRAPH) {
          par3.asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);
        }
      }

      // Eliminar la fila plantilla con marcadores
      tablaRepuestos.removeRow(filaPlantilla + filas.length);
    }


      // ── 5. Insertar fotos donde está {{FOTOS}} ───────────────────
      var fotosBase64 = payload.fotosBase64 || [];

      // Primero usar replaceText para normalizar el marcador
      // (evita problemas con texto en itálica u otros formatos)
      body.replaceText('\\{\\{FOTOS\\}\\}', '___FOTOS___');

      var idxFotos = -1;
      var numElementos = body.getNumChildren();
      for (var e = 0; e < numElementos; e++) {
        var elem = body.getChild(e);
        try {
          if (elem.getType() === DocumentApp.ElementType.PARAGRAPH) {
            if (elem.asParagraph().getText().indexOf('___FOTOS___') >= 0) {
              idxFotos = e;
              break;
            }
          }
        } catch(eFotos) {}
      }

      if (idxFotos >= 0) {
        // Limpiar el párrafo del marcador
        var parFotos = body.getChild(idxFotos).asParagraph();
        try { parFotos.clear(); } catch(eClear) {
          try { body.replaceText('___FOTOS___', ''); } catch(eClear2) {}
        }

        // Insertar imágenes
        for (var fi = 0; fi < fotosBase64.length; fi++) {
          var fotoData = fotosBase64[fi];
          var mimeType = fotoData.mimeType || 'image/jpeg';
          var blob = Utilities.newBlob(Utilities.base64Decode(fotoData.base64), mimeType, 'foto_' + (fi + 1));

          var parImg = body.insertParagraph(idxFotos + fi + 1, '');
          parImg.setAlignment(DocumentApp.HorizontalAlignment.LEFT);
          var img = parImg.appendInlineImage(blob);

          var anchoDeseado = 255;
          var ratio = img.getHeight() / img.getWidth();
          img.setWidth(anchoDeseado);
          img.setHeight(Math.round(anchoDeseado * ratio));

          if (fi < fotosBase64.length - 1) {
            body.insertParagraph(idxFotos + fi + 2, '');
          }
        }
      } else {
        // Si no encontró el marcador, simplemente limpiarlo
        try { body.replaceText('___FOTOS___', ''); } catch(eF) {}
      }

    doc.saveAndClose();

    try {
      copiaFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch(e2) {}

    return {
      ok:          true,
      url:         copiaFile.getUrl(),
      nombre:      nombreDoc,
      correlativo: corrStr
    };

  } catch(e) {
    throw new Error('[Checklist] ' + e.message);
  }
}
function abrirDocConReintentos_(docId) {
  var ultimoError = null;

  for (var i = 0; i < 6; i++) {
    try {
      if (i > 0) Utilities.sleep(1500);
      return DocumentApp.openById(docId);
    } catch (e) {
      ultimoError = e;
    }
  }

  throw new Error(
    'No se pudo abrir la copia del documento. ID copia: ' +
    docId +
    ' | Error: ' +
    (ultimoError ? ultimoError.message : 'desconocido')
  );
}


// =========================================
// CHECKLIST BAJA DE EQUIPOS
// =========================================
var PLANTILLA_BAJA_ID    = '1KgZRhyxoTV3zxg8N4EowFw4_hZlhYSSbBN6lrjP42Ro';
var FOLDER_ID_BAJA       = '1ACYKH6OzCMmtboqDz-tnOSrn6j5FscYG';
var CHECKLIST_BAJA_SHEET = 'Checklist Baja Correlativo';

function getChecklistBajaCorrelativo() {
  try {
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CHECKLIST_BAJA_SHEET);
    if (!sheet) {
      sheet = ss.insertSheet(CHECKLIST_BAJA_SHEET);
      sheet.getRange(1,1).setValue(0);
    }
    return String(parseInt(sheet.getRange(1,1).getValue()||0,10)+1).padStart(3,'0');
  } catch(e) { return '001'; }
}

function generarChecklistBaja(payload) {
  try {
    // ── 1. Correlativo ───────────────────────────────────────────
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CHECKLIST_BAJA_SHEET);
    if (!sheet) {
      sheet = ss.insertSheet(CHECKLIST_BAJA_SHEET);
      sheet.getRange(1,1).setValue(0);
    }

    var corrStr = String(payload.correlativo || '').trim();
    if (!corrStr) {
      var correlativo = parseInt(sheet.getRange(1,1).getValue()||0,10)+1;
      sheet.getRange(1,1).setValue(correlativo);
      corrStr = String(correlativo).padStart(3,'0');
    } else {
      var numUsado  = parseInt(corrStr,10)||0;
      var numActual = parseInt(sheet.getRange(1,1).getValue()||0,10);
      if (numUsado > numActual) sheet.getRange(1,1).setValue(numUsado);
    }

    var modelo = payload.modelo || '';
    var serie  = payload.serie  || '';
    var fecha  = payload.fecha  || ''; // DD/MM/AAAA

    // Convertir fecha DD/MM/AAAA → DD.MM.AAAA para el nombre
    var fechaNombre = fecha.replace(/\//g, '.');

    // Año para el correlativo
    var anio = fecha ? fecha.split('/')[2] || new Date().getFullYear() : new Date().getFullYear();

    // ── 2. Nombre del archivo ────────────────────────────────────
    var nombreDoc = 'CHECK LIST DE BAJA EN TALLER ' +
      corrStr + '-JPMA-' + anio +
      ' EDEN ' + modelo + ' ' + serie +
      ' ' + fechaNombre;

    // ── 3. Copiar plantilla ──────────────────────────────────────
    var plantillaFile = DriveApp.getFileById(PLANTILLA_BAJA_ID);
    var folder        = DriveApp.getFolderById(FOLDER_ID_BAJA);
    var copiaFile     = plantillaFile.makeCopy(nombreDoc, folder);
    var doc           = abrirDocConReintentos_(copiaFile.getId());
    var body          = doc.getBody();

    // ── 4. Reemplazos simples ────────────────────────────────────
    var motivo1 = payload.motivo1 ? '☒' : '☐';
    var motivo2 = payload.motivo2 ? '☒' : '☐';
    var motivo3 = payload.motivo3 ? '☒' : '☐';
    var motivo4 = payload.motivo4 ? '☒' : '☐';
    var motivo5 = payload.motivo5 ? '☒' : '☐';

    var reemplazos = {
      '{{CORRELATIVO}}':   corrStr,
      '{{FECHA}}':         fecha,
      '{{AUTORIZADO}}':    payload.autorizado    || '',
      '{{TECNICO}}':       payload.tecnico       || '',
      '{{ANALISTA}}':      payload.analista      || '',
      '{{MODELO}}':        modelo,
      '{{COLOR}}':         payload.color         || '',
      '{{SERIE}}':         serie,
      '{{FECHA_INGRESO}}': payload.fechaIngreso  || '',
      '{{ESTADO}}':        payload.estado        || '',
      '{{MOTIVO1}}':       motivo1,
      '{{MOTIVO2}}':       motivo2,
      '{{MOTIVO3}}':       motivo3,
      '{{MOTIVO4}}':       motivo4,
      '{{MOTIVO5}}':       motivo5,
      '{{MOTIVO_OTRO}}':   payload.motivoOtro    || '',
      '{{DETALLE}}':       payload.detalle       || '',
      '{{EVAL_NOMBRE}}':   payload.evalNombre    || '',
      '{{EVAL_FECHA}}':    payload.evalFecha     || '',
      '{{AUT_NOMBRE}}':    payload.autNombre     || '',
      '{{AUT_FECHA}}':     payload.autFecha      || ''
    };

    Object.keys(reemplazos).forEach(function(m) {
      body.replaceText(m, reemplazos[m]);
    });

    // ── 5. Tabla Piezas retiradas dinámica ───────────────────────
    var piezas = payload.piezas || [];
    var tablas  = body.getTables();

    // Buscar tabla con {{PIEZA_DESC}}
    var tblPiezas = null, filaPiezaBase = -1;
    for (var t = 0; t < tablas.length; t++) {
      var tbl = tablas[t];
      for (var r = 0; r < tbl.getNumRows(); r++) {
        var rowTxt = tbl.getRow(r).getText();
        if (rowTxt.indexOf('{{PIEZA_DESC}}') >= 0) {
          tblPiezas     = tbl;
          filaPiezaBase = r;
          break;
        }
      }
      if (tblPiezas) break;
    }

    if (tblPiezas && filaPiezaBase >= 0) {
      var filaBasePieza = tblPiezas.getRow(filaPiezaBase);
      for (var i = piezas.length - 1; i >= 0; i--) {
        tblPiezas.insertTableRow(filaPiezaBase, filaBasePieza.copy());
        var nf = tblPiezas.getRow(filaPiezaBase);
        nf.getCell(0).editAsText().setText(piezas[i].descripcion || '');
        nf.getCell(1).editAsText().setText(piezas[i].observacion || 'Ninguna');
      }
      tblPiezas.removeRow(filaPiezaBase + piezas.length);
    }

    // ── 6. Tabla Partes descartadas dinámica ─────────────────────
    var partes = payload.partes || [];

    // Buscar tabla con {{PARTE_DESC}}
    var tblPartes = null, filaParteBase = -1;
    tablas = body.getTables(); // refrescar después de modificar
    for (var t2 = 0; t2 < tablas.length; t2++) {
      var tbl2 = tablas[t2];
      for (var r2 = 0; r2 < tbl2.getNumRows(); r2++) {
        if (tbl2.getRow(r2).getText().indexOf('{{PARTE_DESC}}') >= 0) {
          tblPartes    = tbl2;
          filaParteBase = r2;
          break;
        }
      }
      if (tblPartes) break;
    }

    if (tblPartes && filaParteBase >= 0) {
      var filaBaseParte = tblPartes.getRow(filaParteBase);
      for (var j = partes.length - 1; j >= 0; j--) {
        tblPartes.insertTableRow(filaParteBase, filaBaseParte.copy());
        var nfp = tblPartes.getRow(filaParteBase);
        nfp.getCell(0).editAsText().setText(partes[j].descripcion || '');
        nfp.getCell(1).editAsText().setText(partes[j].motivo      || '');
      }
      tblPartes.removeRow(filaParteBase + partes.length);
    }

    // ── 7. Foto evaluación técnica ───────────────────────────────
    body.replaceText('\\{\\{FOTO_EVALUACION\\}\\}', '___FOTO_EVAL___');
    var idxFotoEval = -1;
    var numElems = body.getNumChildren();
    for (var e = 0; e < numElems; e++) {
      try {
        if (body.getChild(e).getType() === DocumentApp.ElementType.PARAGRAPH) {
          if (body.getChild(e).asParagraph().getText().indexOf('___FOTO_EVAL___') >= 0) {
            idxFotoEval = e; break;
          }
        }
      } catch(ef) {}
    }

    if (idxFotoEval >= 0 && payload.fotoEval) {
      var parFotoEval = body.getChild(idxFotoEval).asParagraph();
      try { parFotoEval.clear(); } catch(ec) {
        try { body.replaceText('___FOTO_EVAL___', ''); } catch(ec2) {}
      }
      var blobEval = Utilities.newBlob(
        Utilities.base64Decode(payload.fotoEval.base64),
        payload.fotoEval.mimeType || 'image/jpeg',
        'foto_evaluacion'
      );
      var parEval = body.insertParagraph(idxFotoEval + 1, '');
      var imgEval = parEval.appendInlineImage(blobEval);
      var anchoEval = 255;
      var altoEval = Math.round(anchoEval * (imgEval.getHeight() / imgEval.getWidth()));
      var altoMaxEval = 340; // máximo alto permitido
      if (altoEval > altoMaxEval) {
        altoEval = altoMaxEval;
        anchoEval = Math.round(altoMaxEval * (imgEval.getWidth() / imgEval.getHeight()));
      }
      imgEval.setWidth(anchoEval);
      imgEval.setHeight(altoEval);
    } else {
      try { body.replaceText('___FOTO_EVAL___', ''); } catch(ef2) {}
    }

    // ── 8. Fotos evidencia (2 por fila en tabla) ─────────────────
// ── 8. Fotos evidencia ───────────────────────────────────────
    var fotosBase64 = payload.fotosBase64 || [];
    body.replaceText('\\{\\{FOTOS\\}\\}', '___FOTOS___');

    var idxFotos = -1;
    numElems = body.getNumChildren();
    for (var e2 = 0; e2 < numElems; e2++) {
      try {
        if (body.getChild(e2).getType() === DocumentApp.ElementType.PARAGRAPH) {
          if (body.getChild(e2).asParagraph().getText().indexOf('___FOTOS___') >= 0) {
            idxFotos = e2; break;
          }
        }
      } catch(ef3) {}
    }

    if (idxFotos >= 0) {
      var parFotos = body.getChild(idxFotos).asParagraph();
      try { parFotos.clear(); } catch(ec3) {
        try { body.replaceText('___FOTOS___', ''); } catch(ec4) {}
      }

      for (var fi = 0; fi < fotosBase64.length; fi++) {
        var fotoData = fotosBase64[fi];
        var mimeType = fotoData.mimeType || 'image/jpeg';
        var blob = Utilities.newBlob(Utilities.base64Decode(fotoData.base64), mimeType, 'foto_' + (fi + 1));

        var parImg = body.insertParagraph(idxFotos + fi + 1, '');
        parImg.setAlignment(DocumentApp.HorizontalAlignment.LEFT);
        var img = parImg.appendInlineImage(blob);

        var anchoDeseado = 255;
        var ratio = img.getHeight() / img.getWidth();
        img.setWidth(anchoDeseado);
        img.setHeight(Math.round(anchoDeseado * ratio));

        if (fi < fotosBase64.length - 1) {
          body.insertParagraph(idxFotos + fi + 2, '');
        }
      }
    } else {
      try { body.replaceText('___FOTOS___', ''); } catch(ef4) {}
    }

    doc.saveAndClose();
    try { copiaFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch(e3) {}
    return { ok: true, url: copiaFile.getUrl(), nombre: nombreDoc, correlativo: corrStr };
  } catch(e) {
    throw new Error('[ChecklistBaja] ' + e.message);
  }
}

// =========================================
// ALERTA DE TICKETS SAC
// =========================================
function getAlertaTicketsSAC() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Alerta de TICKET-SAC');
  return getSheetObjects_(sheet).map(function(r) {
    return {
      ticket:      String(r['Ticket-Odoo']            || '').trim() || '-',
      asesor:      String(r['Asesor']                  || '').trim() || '-',
      fecha:       String(r['Fecha']                   || '').trim() || '-',
      cliente:     String(r['Cliente']                 || '').trim() || '-',
      producto:    String(r['Tipo de Producto']         || '').trim() || '-',
      seguimiento: String(r['Seguimiento de SAC']       || '').trim() || '-',
      status:      String(r['STATUS']                  || '').trim() || '-',
      fechaRep:    String(r['Fecha de reparación']      || '').trim() || '-',
      garantia:    String(r['Garantia']                || '').trim() || '-',

      // ← ESTO ES LO QUE FALTA
      comentario:  String(
        r['Comentario del cliente'] ||
        r['Comentario del Cliente'] ||
        r['Comentario cliente']     ||
        r['Comentario']             || ''
      ).trim() || '-'
    };
  });
}
// =========================================
// HISTORIAL CLIENTE
// =========================================
var HISTORIAL_SHEET_NAME = 'Integracion';

function getHistorialCliente(query) {
  try {
    query = String(query || '').trim();
    if (!query || query.length < 2) return [];

    var ss    = SpreadsheetApp.openById(STOCK_SPREADSHEET_ID);
    var sheet = ss.getSheetByName(HISTORIAL_SHEET_NAME);
    if (!sheet) throw new Error('No se encontró la hoja: ' + HISTORIAL_SHEET_NAME);

    var values = sheet.getDataRange().getDisplayValues();
    if (values.length < 2) return [];

    var headers = values[0].map(function(h) {
      return String(h).trim().toLowerCase().replace(/\s+/g, '_');
    });

    function col(names) {
      for (var i = 0; i < names.length; i++) {
        var idx = headers.indexOf(names[i]);
        if (idx >= 0) return idx;
      }
      return -1;
    }

    var C = {
      cliente:  col(['odoo_customer']),
      nombre:   col(['odoo_name']),
      tracking: col(['simpliroute_tracking', 'simpliroute_trac_king']),
      fecha:    col(['simpliroute_planned_date', 'simpliroute_planned_date', 'odoo_create']), // ← agrega con _
      tipo:     col(['tipo_servicio_final']),
      status:   col(['simpliroute_status', 'odoo_stat']),
      tecnico:  col(['odoo_technician']),
      notas:    col(['simpliroute_notes']),
      comment:  col(['simpliroute_checkout_comment']),
      asesor:   col(['odoo_salesperson'])
    };

    var qNorm = query.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    var servicios = [];

    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      var clienteRaw = C.cliente >= 0
        ? String(row[C.cliente] || '').trim() : '';
      if (!clienteRaw) continue;

      var clienteNorm = clienteRaw.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (!clienteNorm.includes(qNorm)) continue;

      var notasTexto  = C.notas   >= 0
        ? String(row[C.notas]   || '').trim() : '';
      var commentText = C.comment >= 0
        ? String(row[C.comment] || '').trim() : '';

      var notesParsed = histParsearNotas_(notasTexto);
      var alertas     = histDetectarAlertas_(notasTexto + ' ' + commentText);

      servicios.push({
        cliente:  clienteRaw,
        nombre:   C.nombre   >= 0 ? String(row[C.nombre]   || '').trim() : '',
        tracking: C.tracking >= 0 ? String(row[C.tracking] || '').trim() : '', // ← nuevo
        fecha:    C.fecha    >= 0 ? String(row[C.fecha]    || '').trim() : '',
        tipo:     C.tipo     >= 0 ? String(row[C.tipo]     || '').trim() : '',
        status:   C.status   >= 0 ? String(row[C.status]   || '').trim() : '',
        tecnico:  C.tecnico  >= 0 ? String(row[C.tecnico]  || '').trim() : '',
        asesor:   C.asesor   >= 0 ? String(row[C.asesor]   || '').trim() : '',
        comment:  commentText,
        notas:    notesParsed,
        alertas:  alertas
      });
    }

    // Más reciente primero (dB - dA = descendente)
    servicios.sort(function(a, b) {
      var dA = histParseFecha_(a.fecha);
      var dB = histParseFecha_(b.fecha);
      if (dA && dB) return dB.getTime() - dA.getTime();
      if (dA) return -1;  // si solo A tiene fecha, va primero
      if (dB) return 1;   // si solo B tiene fecha, va primero
      return 0;
    });

    return servicios;

  } catch(e) {
    throw new Error('[Historial] ' + e.message);
  }
}

function histParseFecha_(str) {
  if (!str || String(str).trim() === '' || String(str).trim() === '-') return null;
  var s = String(str).trim();

  // DD/MM/YYYY o D/M/YYYY
  var m1 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m1) return new Date(+m1[3], +m1[2]-1, +m1[1]);

  // YYYY-MM-DD
  var m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m2) return new Date(+m2[1], +m2[2]-1, +m2[3]);

  // DD-MM-YYYY
  var m3 = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/);
  if (m3) return new Date(+m3[3], +m3[2]-1, +m3[1]);

  // Intento nativo como último recurso
  var d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function histParsearNotas_(texto) {
  if (!texto || String(texto).trim() === '') return {};

  var resultado = {
    distrito: '', descripcion: [], tipoServicio: '',
    productos: [], asesor: '', telefono: '', cobrar: '', notas: ''
  };

  var ETIQUETAS = [
    { pattern: /^Distrito\s*:/i,           key: 'distrito' },
    { pattern: /^Descripci[oó]n\s*:/i,     key: 'descripcion' },
    { pattern: /^Tipo de Servicio\s*:/i,   key: 'tipoServicio' },
    { pattern: /^Producto\s*:/i,           key: 'producto' },
    { pattern: /^Kit\s*:/i,               key: 'producto' },
    { pattern: /^Asesor\s*:/i,             key: 'asesor' },
    { pattern: /^Tel[eé]fono\s*:/i,        key: 'telefono' },
    { pattern: /^Cobrar\s*:/i,             key: 'cobrar' },
    { pattern: /^Notas?\s*:/i,             key: 'notas' },
    { pattern: /^Observaci[oó]n\s*:/i,     key: 'notas' },
    { pattern: /^OBSERVACIONES?\s*:/i,     key: 'notas' }
  ];

  function flush(key, valor) {
    if (!key || !String(valor).trim()) return;
    valor = String(valor).trim();
    if (key === 'producto') {
      var limpio = valor.replace(/^\[\s*\d+\s*\]\s*/, '').trim();
      if (limpio) resultado.productos.push(limpio);
    } else if (key === 'descripcion') {
      valor.split('\n').forEach(function(v) {
        var t = v.trim();
        if (t) resultado.descripcion.push(t);
      });
    } else if (key === 'notas') {
      resultado.notas = resultado.notas
        ? resultado.notas + ' ' + valor : valor;
    } else if (key in resultado) {
      resultado[key] = valor;
    }
  }

  var lineas = texto.split('\n');
  var campoActual = null, buffer = '';

  lineas.forEach(function(linea) {
    var raw = linea.trim();
    if (!raw) return;
    var matchEt = null;
    for (var i = 0; i < ETIQUETAS.length; i++) {
      if (ETIQUETAS[i].pattern.test(raw)) { matchEt = ETIQUETAS[i]; break; }
    }
    if (matchEt) {
      flush(campoActual, buffer);
      campoActual = matchEt.key;
      buffer = raw.replace(matchEt.pattern, '').replace(/^\s*:\s*/, '').trim();
    } else {
      buffer += (buffer ? '\n' : '') + raw;
    }
  });
  flush(campoActual, buffer);

  return resultado;
}

function histDetectarAlertas_(texto) {
  if (!texto) return [];
  var t = texto.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  var KEYS = [
    { re: /garanti/,                  label: '🛡️ Garantía',         color: '#1d4ed8', bg: '#dbeafe' },
    { re: /sali[oó] del taller/,      label: '🔧 Salió del taller', color: '#7c3aed', bg: '#ede9fe' },
    { re: /da[nñ]ad[ao]/,             label: '⚠️ Daño',             color: '#d97706', bg: '#fef3c7' },
    { re: /no funciona/,               label: '❌ No funciona',      color: '#dc2626', bg: '#fee2e2' },
    { re: /no est[aá] ingresando/,     label: '💧 Sin agua',         color: '#dc2626', bg: '#fee2e2' },
    { re: /cobrar/,                    label: '💰 Cobro',            color: '#d97706', bg: '#fef3c7' },
    { re: /llevar|traer/,              label: '📦 Traslado',         color: '#0f766e', bg: '#ccfbf1' },
    { re: /obstrucci[oó]n/,            label: '🚫 Obstrucción',      color: '#92400e', bg: '#fef3c7' }
  ];
  var alertas = [];
  KEYS.forEach(function(k) {
    if (k.re.test(t)) alertas.push({ label:k.label, color:k.color, bg:k.bg });
  });
  return alertas;
}


// =========================================
// HISTORIAL CLIENTE — GENERAR PDF (Google Doc)
// =========================================
var FOLDER_ID_HISTORIAL = 'TU_FOLDER_ID_AQUI'; // ← pega el ID de la carpeta Drive destino

// =========================================
// HISTORIAL CLIENTE — GENERAR HTML A DRIVE
// =========================================
function generarHistorialPDF(payload) {
  try {
    var cliente   = payload.cliente   || 'Sin nombre';
    var servicios = payload.servicios || [];
    var opciones  = payload.opciones  || {};
    var desde     = payload.desde     || '';
    var hasta     = payload.hasta     || '';

    var tz  = Session.getScriptTimeZone();
    var hoy = Utilities.formatDate(new Date(), tz, 'dd/MM/yyyy');

    if (desde || hasta) {
      servicios = servicios.filter(function(s) {
        var d = histParseFecha_(s.fecha);
        if (!d) return true;
        if (desde) { var dD = histParseFecha_(desde); if (dD && d < dD) return false; }
        if (hasta) { var dH = histParseFecha_(hasta); if (dH && d > dH) return false; }
        return true;
      });
    }

    if (!servicios.length) throw new Error('No hay servicios para el período seleccionado.');

    var nombreDoc = 'Historial ' + cliente + ' ' + hoy;
    var htmlContent = histBuildHtml_(cliente, servicios, opciones, hoy);

    // Guardar en Drive como respaldo (opcional)
    var blob = Utilities.newBlob(htmlContent, MimeType.HTML, nombreDoc + '.html');
    var file;
    if (FOLDER_ID_HISTORIAL && FOLDER_ID_HISTORIAL !== 'TU_FOLDER_ID_AQUI') {
      file = DriveApp.getFolderById(FOLDER_ID_HISTORIAL).createFile(blob);
    } else {
      file = DriveApp.createFile(blob);
    }
    try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch(e2) {}

    // Devolver el HTML directamente al frontend (se abre en el navegador)
    return { ok: true, html: htmlContent, driveUrl: file.getUrl(), nombre: nombreDoc };

  } catch(e) {
    throw new Error('[HistorialPDF] ' + e.message);
  }
}

function histBuildHtml_(cliente, servicios, opciones, hoy) {
  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function statusCfg(status) {
    var s = String(status||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    if (s.includes('completed')||s.includes('completado')||s.includes('finish'))
      return { label:'Completado', color:'#166534', bg:'#dcfce7', dot:'#16a34a' };
    if (s.includes('cancel'))
      return { label:'Cancelado', color:'#991b1b', bg:'#fee2e2', dot:'#ef4444' };
    return { label: status||'En proceso', color:'#92400e', bg:'#fef3c7', dot:'#d97706' };
  }

  // ── CSS ─────────────────────────────────────────────────────
var css = [
    '@import url("https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Mono:wght@400;500&display=swap");',
    '*{box-sizing:border-box;margin:0;padding:0;}',
    'body{font-family:"DM Sans",Arial,sans-serif;background:#f5f5f3;color:#0d0d0c;font-size:13px;-webkit-font-smoothing:antialiased;padding:28px 52px;}',
    '@media print{body{background:#fff;padding:14px 36px;}@page{margin:10mm 10mm;size:A4;}.no-print{display:none!important;}}',
    '.page{max-width:880px;margin:0 auto;}',
    '.report-title{font-size:22px;font-weight:700;color:#0d0d0c;letter-spacing:-0.4px;margin-bottom:3px;}',
    '.report-client{font-size:15px;font-weight:500;color:#0d0d0c;margin-bottom:2px;}',
    '.report-meta{font-size:11px;color:#9ca3af;margin-bottom:12px;}',
    '.report-sep{height:2px;background:#0d0d0c;margin-bottom:18px;}',
    '.summary-box{display:flex;gap:24px;background:#fff;border:0.5px solid #e5e5e3;border-radius:10px;padding:11px 16px;margin-bottom:18px;}',
    '.sum-label{font-size:8px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.7px;display:block;margin-bottom:2px;}',
    '.sum-value{font-size:13px;font-weight:700;color:#0d0d0c;font-family:"DM Mono",monospace;}',
    '.tl-item{display:flex;gap:12px;}',
    '.tl-col{display:flex;flex-direction:column;align-items:center;flex-shrink:0;width:18px;}',
    '.tl-dot{width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #f5f5f3;}',
    '.tl-line{flex:1;width:1px;background:#e5e5e3;margin:4px 0;min-height:12px;}',
    '.tl-body{flex:1;min-width:0;padding-bottom:18px;}',
    '.tl-body.last{padding-bottom:0;}',
    '.row1{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:3px;}',
    '.fecha-tag{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:5px;background:#f8f8f6;border:0.5px solid #d1d1cf;font-size:10px;font-family:"DM Mono",monospace;font-weight:500;}',
    '.s-badge{font-size:9px;font-weight:700;padding:2px 8px;border-radius:999px;}',
    '.row2{display:flex;align-items:center;gap:5px;flex-wrap:wrap;margin-bottom:7px;}',
    '.ref{font-size:10px;font-family:"DM Mono",monospace;color:#6b7280;}',
    '.sep{width:3px;height:3px;border-radius:50%;background:#d1d1cf;display:inline-block;}',
    '.tipo{font-size:11px;font-weight:600;color:#0d0d0c;}',
    '.alerts{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:7px;}',
    '.al{font-size:9px;font-weight:600;padding:2px 8px;border-radius:999px;}',
    '.dets{display:flex;flex-direction:column;gap:4px;margin-bottom:8px;}',
    '.det{display:flex;align-items:flex-start;gap:8px;}',
    '.det-l{font-size:8px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.6px;min-width:66px;flex-shrink:0;padding-top:1px;}',
    '.det-v{font-size:11px;color:#0d0d0c;line-height:1.35;}',
    '.det-green{font-weight:700;color:#166534;}',
    '.nota-card{padding:8px 12px;border-radius:0 8px 8px 0;margin-bottom:6px;}',
    '.nota-n{background:#f8f8f6;border:0.5px solid #e5e5e3;border-left:3px solid #94a3b8;}',
    '.nota-w{background:#fffbeb;border:0.5px solid #fde68a;border-left:3px solid #d97706;}',
    '.cierre-card{padding:8px 12px;border-radius:0 8px 8px 0;background:#f8f8f6;border:0.5px solid #e5e5e3;border-left:3px solid #22c55e;}',
    '.c-lbl{display:flex;align-items:center;gap:5px;margin-bottom:3px;}',
    '.c-lbl-t{font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;}',
    '.c-txt{font-size:11px;line-height:1.5;color:#0d0d0c;}',
    '.report-footer{margin-top:24px;padding-top:10px;border-top:0.5px solid #e5e5e3;font-size:9px;color:#9ca3af;text-align:center;}',
    '.print-btn{position:fixed;bottom:22px;right:22px;padding:10px 18px;background:#0d0d0c;color:#fff;border:none;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;font-family:"DM Sans",sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.2);z-index:99;}',
    '.print-btn:hover{background:#333;}'
  ].join('\n');

  // ── SVG icons ───────────────────────────────────────────────
  var icoCheck    = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>';
  var icoCirc     = '<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><circle cx="12" cy="12" r="4" fill="#fff"/></svg>';
  var icoCal      = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
  var icoChkCir   = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#15803d" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="20 6 9 17 4 12"/></svg>';

  function svgIco(path, w, h) {
    w = w||13; h = h||13;
    return '<svg width="'+w+'" height="'+h+'" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:1px">'+path+'</svg>';
  }
  var ICONS = {
    tec:  svgIco('<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>'),
    equ:  svgIco('<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>'),
    pin:  svgIco('<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>'),
    rep:  svgIco('<circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>'),
    cob:  svgIco('<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>'),
    ase:  svgIco('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'),
    doc:  '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round">'
  };

  function det(ico, lbl, val, cls) {
    if (!val || !String(val).trim()) return '';
    return '<div class="det">'+ico+'<span class="det-l">'+esc(lbl)+'</span>'
      +'<span class="det-v'+(cls?' '+cls:'')+'">'+esc(String(val).replace(/\.$/, '').trim())+'</span></div>';
  }

  // ── Body ────────────────────────────────────────────────────
  var b = '<div class="page">';

  // Header
  b += '<div class="report-title">HISTORIAL DE SERVICIOS EN CAMPO</div>';
  b += '<div class="report-client">'+esc(cliente)+'</div>';
  b += '<div class="report-meta">Eden Agua &nbsp;&middot;&nbsp; Generado el '+hoy+'</div>';
  b += '<div class="report-sep"></div>';

  // Summary
  if (opciones.mostrarResumen !== false) {
    b += '<div class="summary-box">';
    b += '<div><span class="sum-label">Total servicios</span><span class="sum-value">'+servicios.length+'</span></div>';
    if (servicios.length > 1) {
      b += '<div><span class="sum-label">Primer servicio</span><span class="sum-value">'+esc(servicios[servicios.length-1].fecha||'-')+'</span></div>';
      b += '<div><span class="sum-label">Último servicio</span><span class="sum-value">'+esc(servicios[0].fecha||'-')+'</span></div>';
    }
    b += '</div>';
  }

  // Timeline
  servicios.forEach(function(s, idx) {
    var sc       = statusCfg(s.status);
    var notas    = s.notas || {};
    var alertas  = s.alertas || [];
    var equipo   = (notas.descripcion || []).join(' · ') || '';
    var tNota    = notas.notas && notas.notas.trim();
    var tCierre  = s.comment && s.comment.trim();
    var esUlt    = idx === servicios.length - 1;
    var dotCol   = sc.label === 'Completado' ? '#16a34a' : '#d97706';
    var dotIco   = sc.label === 'Completado' ? icoCheck : icoCirc;

    b += '<div class="tl-item">';
    // Dot + line
    b += '<div class="tl-col">';
    b += '<div class="tl-dot" style="background:'+dotCol+';">'+dotIco+'</div>';
    if (!esUlt) b += '<div class="tl-line"></div>';
    b += '</div>';
    // Content
    b += '<div class="tl-body'+(esUlt?' last':'')+'>">';
    // Fila 1: fecha + badge
    b += '<div class="row1">';
    if (s.fecha) b += '<span class="fecha-tag">'+icoCal+'&nbsp;'+esc(s.fecha)+'</span>';
    b += '<span class="s-badge" style="background:'+sc.bg+';color:'+sc.color+';">'+esc(sc.label)+'</span>';
    b += '</div>';
    // Fila 2: SR · ALOFI · tipo
    b += '<div class="row2">';
    if (s.tracking) { b += '<span class="ref">'+esc(s.tracking)+'</span><span class="sep"></span>'; }
    if (s.nombre)   { b += '<span class="ref">'+esc(s.nombre)+'</span><span class="sep"></span>'; }
    b += '<span class="tipo">'+esc(s.tipo||'Sin tipo')+'</span>';
    b += '</div>';
    // Alertas
    if (alertas.length) {
      b += '<div class="alerts">';
      alertas.forEach(function(a) {
        b += '<span class="al" style="background:'+a.bg+';color:'+a.color+';">'+esc(a.label)+'</span>';
      });
      b += '</div>';
    }
    // Detalles
    b += '<div class="dets">';
    if (opciones.mostrarTecnico   !== false) b += det(ICONS.tec, 'Técnico',   s.tecnico);
    if (opciones.mostrarEquipo    !== false) b += det(ICONS.equ, 'Equipo',    equipo);
    if (notas.distrito)                      b += det(ICONS.pin, 'Distrito',  notas.distrito);
    if (opciones.mostrarRepuestos !== false && notas.productos && notas.productos.length)
      b += det(ICONS.rep, 'Repuestos', notas.productos.join(' · '));
    if (opciones.mostrarCobrar && notas.cobrar) b += det(ICONS.cob, 'Cobrar', notas.cobrar, 'det-green');
    if (opciones.mostrarAsesor && s.asesor)     b += det(ICONS.ase, 'Asesor', s.asesor);
    b += '</div>';
    // Nota card
    if (opciones.mostrarNotas !== false && tNota) {
      var esW     = alertas.length > 0;
      var lblCol  = esW ? '#92400e' : '#6b7280';
      var lblTxt  = esW ? 'Nota importante' : 'Nota';
      b += '<div class="nota-card '+(esW?'nota-w':'nota-n')+'">';
      b += '<div class="c-lbl">';
      b += '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="'+lblCol+'" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
      b += '<span class="c-lbl-t" style="color:'+lblCol+';">'+lblTxt+'</span>';
      b += '</div><div class="c-txt">'+esc(notas.notas)+'</div></div>';
    }
    // Cierre card
    if (opciones.mostrarCierre !== false && tCierre) {
      b += '<div class="cierre-card">';
      b += '<div class="c-lbl">'+icoChkCir+'<span class="c-lbl-t" style="color:#15803d;">Cierre del servicio</span></div>';
      b += '<div class="c-txt">'+esc(s.comment)+'</div></div>';
    }
    b += '</div></div>'; // tl-body + tl-item
  });

  b += '<div class="report-footer">Documento generado automáticamente · Sistema de Taller · Eden Agua</div>';
  b += '</div>'; // page

  // Botón imprimir (no aparece al imprimir)
  b += '<button class="print-btn no-print" onclick="window.print()">🖨 Imprimir / Exportar PDF</button>';

  return '<!DOCTYPE html><html lang="es"><head>'
    + '<meta charset="UTF-8">'
    + '<meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<title>Historial de Servicios en Campo – '+esc(cliente)+'</title>'
    + '<style>'+css+'</style>'
    + '</head><body>'+b+'</body></html>';
}

// =========================================
// HISTORIAL EQUIPO — GENERAR HTML
// =========================================
function generarHistorialEquipo(payload) {
  try {
    var tz  = Session.getScriptTimeZone();
    var hoy = Utilities.formatDate(new Date(), tz, 'dd/MM/yyyy');
    var html = equipoBuildHtml_(payload, hoy);
    return { ok: true, html: html };
  } catch(e) {
    throw new Error('[HistorialEquipo] ' + e.message);
  }
}

function equipoBuildHtml_(payload, hoy) {
  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  var serie       = payload.serie   || '-';
  var modelo      = payload.modelo  || '-';
  var color       = payload.color   || '-';
  var cliente     = payload.cliente || '-';
  var reps        = payload.reparaciones || [];

  // Resumen
  var fechasPrimera = reps.map(function(r){ return r.fechaIngreso; }).filter(function(f){ return f && f !== '-'; });
  var fechasUltima  = reps.map(function(r){ return r.fechaSalida;  }).filter(function(f){ return f && f !== '-'; });
  var primera = fechasPrimera.length ? fechasPrimera[fechasPrimera.length - 1] : '-';
  var ultima  = fechasUltima.length  ? fechasUltima[0] : '-';

  var css = [
    '@import url("https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Mono:wght@400;500&display=swap");',
    '*{box-sizing:border-box;margin:0;padding:0;}',
    'body{font-family:"DM Sans",Arial,sans-serif;background:#f5f5f3;color:#0d0d0c;font-size:13px;-webkit-font-smoothing:antialiased;padding:28px 52px;}',
    '@media print{body{background:#fff;padding:14px 36px;}@page{margin:10mm 10mm;size:A4;}.no-print{display:none!important;}}',
    '.page{max-width:880px;margin:0 auto;}',
    '.report-title{font-size:22px;font-weight:700;letter-spacing:-0.4px;margin-bottom:3px;}',
    '.report-sub{font-size:14px;font-weight:500;margin-bottom:2px;}',
    '.report-meta{font-size:11px;color:#9ca3af;margin-bottom:12px;}',
    '.report-sep{height:2px;background:#0d0d0c;margin-bottom:18px;}',
    '.summary-box{display:flex;gap:24px;background:#fff;border:0.5px solid #e5e5e3;border-radius:10px;padding:11px 16px;margin-bottom:18px;}',
    '.sum-label{font-size:8px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.7px;display:block;margin-bottom:2px;}',
    '.sum-value{font-size:13px;font-weight:700;color:#0d0d0c;font-family:"DM Mono",monospace;}',
    '.tl-item{display:flex;gap:12px;}',
    '.tl-col{display:flex;flex-direction:column;align-items:center;flex-shrink:0;width:18px;}',
    '.tl-dot{width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #f5f5f3;}',
    '.tl-line{flex:1;width:1px;background:#e5e5e3;margin:4px 0;min-height:12px;}',
    '.tl-body{flex:1;min-width:0;padding-bottom:18px;}',
    '.tl-body.last{padding-bottom:0;}',
    '.fecha-pair{display:flex;align-items:center;gap:10px;padding:8px 12px;background:#f8f8f6;border-radius:8px;margin-bottom:8px;}',
    '.fecha-block{display:flex;flex-direction:column;gap:2px;}',
    '.fecha-lbl{font-size:8px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.6px;}',
    '.fecha-val{font-size:12px;font-weight:500;font-family:"DM Mono",monospace;color:#0d0d0c;}',
    '.dias-badge{font-size:10px;font-weight:500;padding:2px 8px;border-radius:999px;background:#fff;border:0.5px solid #e5e5e3;color:#6b7280;white-space:nowrap;margin-left:auto;}',
    '.s-badge{font-size:9px;font-weight:700;padding:2px 8px;border-radius:999px;}',
    '.refs{display:flex;align-items:center;gap:5px;margin-bottom:7px;flex-wrap:wrap;}',
    '.ref{font-size:10px;font-family:"DM Mono",monospace;color:#6b7280;}',
    '.sep{width:3px;height:3px;border-radius:50%;background:#d1d1cf;display:inline-block;}',
    '.dets{display:flex;flex-direction:column;gap:3px;margin-bottom:7px;}',
    '.det{display:flex;align-items:flex-start;gap:8px;}',
    '.det-l{font-size:8px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;min-width:82px;flex-shrink:0;padding-top:1px;}',
    '.det-v{font-size:11px;color:#0d0d0c;line-height:1.35;}',
    '.proc-card{padding:8px 12px;border-radius:0 8px 8px 0;background:#f8f8f6;border:0.5px solid #e5e5e3;border-left:2px solid #94a3b8;}',
    '.proc-lbl{font-size:8px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.7px;margin-bottom:3px;}',
    '.proc-txt{font-size:11px;line-height:1.5;color:#0d0d0c;}',
    '.report-footer{margin-top:24px;padding-top:10px;border-top:0.5px solid #e5e5e3;font-size:9px;color:#9ca3af;text-align:center;}',
    '.print-btn{position:fixed;bottom:22px;right:22px;padding:10px 18px;background:#0d0d0c;color:#fff;border:none;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;font-family:"DM Sans",sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.2);z-index:99;}',
    '.print-btn:hover{background:#333;}'
  ].join('\n');

  var icoCheck = '<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
  var icoCal   = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
  var icoArr   = '→';

  function svgIco(path) {
    return '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:1px">' + path + '</svg>';
  }
  var ICONS = {
    tec: svgIco('<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>'),
    falla: svgIco('<polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'),
    rep: svgIco('<circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>'),
    mot: svgIco('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>')
  };

  function det(ico, lbl, val) {
    if (!val || !String(val).trim() || val === '-') return '';
    return '<div class="det">' + ico
      + '<span class="det-l">' + esc(lbl) + '</span>'
      + '<span class="det-v">' + esc(String(val).trim()) + '</span></div>';
  }

  var b = '<div class="page">';

  // Header
  b += '<div class="report-title">Historial de reparaciones</div>';
  b += '<div class="report-sub">' + esc(serie) + ' &nbsp;·&nbsp; ' + esc(modelo) + ' &nbsp;·&nbsp; ' + esc(color) + '</div>';
  b += '<div class="report-meta">' + esc(cliente) + ' &nbsp;·&nbsp; Eden Agua &nbsp;·&nbsp; Generado el ' + hoy + '</div>';
  b += '<div class="report-sep"></div>';

  // Summary
  b += '<div class="summary-box">';
  b += '<div><span class="sum-label">Reparaciones</span><span class="sum-value">' + reps.length + '</span></div>';
  if (primera && primera !== '-') b += '<div><span class="sum-label">Primera entrada</span><span class="sum-value">' + esc(primera) + '</span></div>';
  if (ultima  && ultima  !== '-') b += '<div><span class="sum-label">Última salida</span><span class="sum-value">' + esc(ultima) + '</span></div>';
  b += '</div>';

  // Timeline
  reps.forEach(function(r, idx) {
    var esUlt = idx === reps.length - 1;
    var dotCol = '#16a34a';

    b += '<div class="tl-item">';
    b += '<div class="tl-col">';
    b += '<div class="tl-dot" style="background:' + dotCol + ';">' + icoCheck + '</div>';
    if (!esUlt) b += '<div class="tl-line"></div>';
    b += '</div>';

    b += '<div class="tl-body' + (esUlt ? ' last' : '') + '">';

    // Bloque fecha ingreso → fecha salida
    b += '<div class="fecha-pair">';
    b += '<div class="fecha-block"><span class="fecha-lbl">Fecha ingreso</span><span class="fecha-val">' + esc(r.fechaIngreso || '-') + '</span></div>';
    b += '<span style="color:#9ca3af;font-size:13px;">' + icoArr + '</span>';
    b += '<div class="fecha-block"><span class="fecha-lbl">Fecha salida</span><span class="fecha-val">' + esc(r.fechaSalida || '-') + '</span></div>';
    if (r.dias && r.dias !== '-') b += '<span class="dias-badge">' + esc(r.dias) + ' día' + (r.dias != '1' ? 's' : '') + '</span>';
    b += '</div>';

    // Referencias: ticket · ficha ing · ficha sal
    b += '<div class="refs">';
    if (r.ticket && r.ticket !== '-' && r.ticket !== '') b += '<span class="ref">Ticket #' + esc(r.ticket) + '</span><span class="sep"></span>';
    if (r.fichaIngreso && r.fichaIngreso !== '-') b += '<span class="ref">Ficha ing. ' + esc(r.fichaIngreso) + '</span><span class="sep"></span>';
    if (r.fichaSalida  && r.fichaSalida  !== '-') b += '<span class="ref">Ficha sal. ' + esc(r.fichaSalida)  + '</span>';
    b += '</div>';

    // Detalles
    b += '<div class="dets">';
    b += det(ICONS.tec,   'Técnico rep.',  r.tecnico);
    b += det(ICONS.mot,   'Motivo',        r.motivoIngreso);
    b += det(ICONS.falla, 'Falla',         r.falla);
    b += det(ICONS.rep,   'Repuestos',     r.repuestos);
    b += '</div>';

    // Procedimiento
    if (r.procedimiento && r.procedimiento.trim()) {
      b += '<div class="proc-card">';
      b += '<div class="proc-lbl">Procedimiento</div>';
      b += '<div class="proc-txt">' + esc(r.procedimiento.trim()) + '</div>';
      b += '</div>';
    }

    b += '</div></div>';
  });

  b += '<div class="report-footer">Documento generado automáticamente · Sistema de Taller · Eden Agua</div>';
  b += '</div>';
  b += '<button class="print-btn no-print" onclick="window.print()">🖨 Imprimir / Exportar PDF</button>';

  return '<!DOCTYPE html><html lang="es"><head>'
    + '<meta charset="UTF-8">'
    + '<meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<title>Historial de reparaciones – ' + esc(serie) + '</title>'
    + '<style>' + css + '</style>'
    + '</head><body>' + b + '</body></html>';
}

// =========================================
// REPUESTOS CLIENTES
// =========================================
function getRepuestosClientes(filtros) {
  try {
    var ss    = SpreadsheetApp.openById(STOCK_SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Repuestos Clientes');
    if (!sheet) throw new Error('No se encontró la hoja: Repuestos Clientes');

    var values = sheet.getDataRange().getDisplayValues();
    if (values.length < 2) return { rows: [], opciones: {} };

    var headers = values[0].map(function(h) {
      return String(h).trim().toLowerCase().replace(/\s+/g, '_');
    });

    function col(names) {
      for (var i = 0; i < names.length; i++) {
        var idx = headers.indexOf(names[i]);
        if (idx >= 0) return idx;
      }
      return -1;
    }

    var C = {
      equipo:       col(['modelo_equip', 'modelo_equipo', 'equipo']),
      producto:     col(['producto']),
      fecha:        col(['fecha_definitiva', 'fecha_definitiv']),
      cliente:      col(['cliente_os', 'cliente']),
      asesor:       col(['asesor']),
      tipoServicio: col(['tipo_servicio']),
      tipoEntrega:  col(['tipo_entrega']),
      referencia:   col(['referencia']),
      os:           col(['os']),
      cantidad:     col(['cantidad']),
      precio:       col(['precio_cobrado_clien', 'precio_cobrado_cliente', 'precio']),
      estadoOs:     col(['estado_os', 'estado_odoo']),
      estadoSr:     col(['estado_simplirout', 'estado_simpli', 'estado_simpliroute'])
    };

    var f    = filtros || {};
    var rows = [];

    // Para opciones de filtros
    var equiposSet = {}, tiposSet = {}, estOsSet = {}, estSrSet = {};

    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      if (!row.some(function(v) { return v && String(v).trim(); })) continue;

      var equipo       = C.equipo       >= 0 ? String(row[C.equipo]       || '').trim() : '';
      var producto     = C.producto     >= 0 ? String(row[C.producto]     || '').trim() : '';
      var fecha        = C.fecha        >= 0 ? String(row[C.fecha]        || '').trim() : '';
      var cliente      = C.cliente      >= 0 ? String(row[C.cliente]      || '').trim() : '';
      var asesor       = C.asesor       >= 0 ? String(row[C.asesor]       || '').trim() : '';
      var tipoServicio = C.tipoServicio >= 0 ? String(row[C.tipoServicio] || '').trim() : '';
      var tipoEntrega  = C.tipoEntrega  >= 0 ? String(row[C.tipoEntrega]  || '').trim() : '';
      var referencia   = C.referencia   >= 0 ? String(row[C.referencia]   || '').trim() : '';
      var os           = C.os           >= 0 ? String(row[C.os]           || '').trim() : '';
      var cantidad     = C.cantidad     >= 0 ? String(row[C.cantidad]     || '').trim() : '';
      var precio       = C.precio       >= 0 ? String(row[C.precio]       || '').trim() : '';
      var estadoOs     = C.estadoOs     >= 0 ? String(row[C.estadoOs]     || '').trim() : '';
      var estadoSr     = C.estadoSr     >= 0 ? String(row[C.estadoSr]     || '').trim() : '';

      // Acumular opciones
      if (equipo)       equiposSet[equipo]       = 1;
      if (tipoServicio) tiposSet[tipoServicio]   = 1;
      if (estadoOs)     estOsSet[estadoOs]       = 1;
      if (estadoSr)     estSrSet[estadoSr]       = 1;

      // Filtros
      if (f.equipo       && equipo.toLowerCase()       !== f.equipo.toLowerCase())       continue;
      if (f.tipoServicio && tipoServicio.toLowerCase() !== f.tipoServicio.toLowerCase()) continue;
      if (f.estadoOs     && estadoOs.toLowerCase()     !== f.estadoOs.toLowerCase())     continue;
      if (f.estadoSr     && estadoSr.toLowerCase()     !== f.estadoSr.toLowerCase())     continue;

      if (f.query) {
        var q = String(f.query).toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        var hay = (equipo + ' ' + producto + ' ' + cliente + ' ' + referencia + ' ' + os)
          .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (!hay.includes(q)) continue;
      }

      if (f.desde || f.hasta) {
        var dRow = repParseFecha_(fecha);
        if (f.desde) { var dD = repParseFecha_(f.desde); if (dRow && dD && dRow < dD) continue; }
        if (f.hasta) { var dH = repParseFecha_(f.hasta); if (dRow && dH && dRow > dH) continue; }
      }

      rows.push({
        equipo: equipo, producto: producto, fecha: fecha,
        cliente: cliente, asesor: asesor,
        tipoServicio: tipoServicio, tipoEntrega: tipoEntrega,
        referencia: referencia, os: os,
        cantidad: cantidad, precio: precio,
        estadoOs: estadoOs, estadoSr: estadoSr
      });
    }

    return {
      rows: rows,
      opciones: {
        equipos:       Object.keys(equiposSet).sort(),
        tiposServicio: Object.keys(tiposSet).sort(),
        estadosOs:     Object.keys(estOsSet).sort(),
        estadosSr:     Object.keys(estSrSet).sort()
      }
    };

  } catch(e) {
    throw new Error('[Repuestos] ' + e.message);
  }
}

function repParseFecha_(str) {
  if (!str || !str.trim()) return null;
  var p = String(str).trim().split('/');
  if (p.length === 3 && p[2].length === 4)
    return new Date(+p[2], +p[1]-1, +p[0]);
  var d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}


// =========================================
// KPI TÉCNICOS — desde "Reporte Taller"
// =========================================
function getKpiTecnicos(params) {
  try {
    params = params || {};
    var segmento = params.segmento || 'global';
    var desdeStr = params.desde || '';
    var hastaStr = params.hasta || '';

    var ss = SpreadsheetApp.openById(CALIDAD_SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Reporte Taller');
    if (!sheet) throw new Error('No se encontró la hoja Reporte Taller');

    var data = sheet.getDataRange().getDisplayValues();
    if (data.length < 2) return { tecnicos:[], tendencia:[], resumen:{} };

    var H = data[0].map(function(h){ return String(h).trim().toLowerCase().replace(/\s+/g,'_'); });
    function c(n){ return H.indexOf(n); }

    var C = {
      tecnico:  c('técnico_responsable_de_reparación'),
      fechaIng: c('fecha_de_ingreso'),
      fechaFin: c('fecha_final_de_reparación'),
      dias:     c('dias_en_reparación'),
      destino:  c('devolver_a:'),
      serie:    c('nro_serie'),
      cliente:  c('cliente'),
      modelo:   c('modelo'),
      falla:    c('falla'),
      fichaIng: c('ficha_de_ingreso'),
      fichaRep: c('ficha_reparación')
    };

    function parseD(s){
      if(!s||!s.trim()||s==='-')return null;
      var p=s.trim().split('/');
      if(p.length===3&&p[2].length===4)return new Date(+p[2],+p[1]-1,+p[0]);
      var d=new Date(s); return isNaN(d.getTime())?null:d;
    }

    var dDesde = parseD(desdeStr), dHasta = parseD(hastaStr);
    var repairs = [];

    for (var i=1; i<data.length; i++) {
      var row = data[i];
      if (!row.some(function(v){return v&&v.trim();})) continue;

      var tec = C.tecnico>=0 ? String(row[C.tecnico]||'').trim() : '';
      if (!tec) continue;

      var dest = C.destino>=0 ? String(row[C.destino]||'').trim() : '';
      if (dest.toLowerCase().indexOf('baja') >= 0) continue; // excluir baja

      var cliente = C.cliente>=0 ? String(row[C.cliente]||'').trim() : '';
      var serie   = C.serie>=0   ? String(row[C.serie]||'').trim()   : '';
      var modelo  = C.modelo>=0  ? String(row[C.modelo]||'').trim()  : '';
      var falla   = C.falla>=0   ? String(row[C.falla]||'').trim()   : '';

      var fechaIng = C.fechaIng>=0 ? String(row[C.fechaIng]||'').trim() : '';
      var fechaFin = C.fechaFin>=0 ? String(row[C.fechaFin]||'').trim() : '';
      var dIng = parseD(fechaIng);
      var dFin = parseD(fechaFin);

      var diasVal = C.dias>=0 ? String(row[C.dias]||'').trim() : '';
      var dias = diasVal!=='' && !isNaN(parseInt(diasVal,10)) ? parseInt(diasVal,10) : (dIng&&dFin?Math.max(0,Math.round((dFin-dIng)/86400000)):null);

      // Filtro fechas: ingreso Y salida dentro del período
      if (dDesde || dHasta) {
        if (!dIng || !dFin) continue;
        if (dDesde && (dIng < dDesde || dFin < dDesde)) continue;
        if (dHasta && (dIng > dHasta || dFin > dHasta)) continue;
      }

      // Segmento
      if (segmento==='clientes' && cliente.toLowerCase().indexOf('eden')>=0) continue;
      if (segmento==='eden' && cliente.toLowerCase().indexOf('eden')<0) continue;

      repairs.push({
        tec:tec, serie:serie, cliente:cliente, modelo:modelo,
        fechaIng:fechaIng, dIng:dIng, fechaFin:fechaFin, dFin:dFin,
        dias:dias, falla:falla,
        fichaIng: C.fichaIng>=0 ? String(row[C.fichaIng]||'').trim() : '',
        fichaRep: C.fichaRep>=0 ? String(row[C.fichaRep]||'').trim() : ''
      });
    }

    // Reincidencia < 30 días (mismo cliente + serie)
    var sorted = repairs.slice().sort(function(a,b){ return (a.dFin?a.dFin.getTime():0)-(b.dFin?b.dFin.getTime():0); });
    var reinc = {};
    for (var r=0; r<sorted.length; r++) {
      var rep = sorted[r];
      if (!rep.dFin||!rep.serie||!rep.cliente) continue;
      var lim = new Date(rep.dFin.getTime()+30*86400000);
      for (var r2=r+1; r2<sorted.length; r2++) {
        var rep2 = sorted[r2];
        if (rep2.dIng && rep2.dIng > lim) break;
        if (rep2.serie===rep.serie && rep2.cliente===rep.cliente) {
          reinc[rep.tec] = (reinc[rep.tec]||0)+1; break;
        }
      }
    }

    // Agrupar por técnico
    var tecMap = {};
    repairs.forEach(function(rep){
      if (!tecMap[rep.tec]) tecMap[rep.tec]={count:0,diasArr:[]};
      tecMap[rep.tec].count++;
      if (rep.dias!==null&&rep.dias!==undefined) tecMap[rep.tec].diasArr.push(rep.dias);
    });

    var tecnicos = Object.keys(tecMap).map(function(n){
      var t=tecMap[n];
      return {
        nombre:n, count:t.count,
        avgHoras: t.diasArr.length>0 ? Math.round(t.diasArr.reduce(function(s,v){return s+v;},0)/t.diasArr.length*10)/10 : null,
        avgDias:  t.diasArr.length>0 ? Math.round(t.diasArr.reduce(function(s,v){return s+v;},0)/t.diasArr.length*10)/10 : null,
        reincidencia: reinc[n]||0
      };
    }).sort(function(a,b){return b.count-a.count;});

    // Tendencia mensual (por fecha fin)
    var mesMap = {};
    repairs.forEach(function(rep){
      if (!rep.dFin) return;
      var k=rep.dFin.getFullYear()+'-'+String(rep.dFin.getMonth()+1).padStart(2,'0');
      if(!mesMap[k])mesMap[k]={};
      mesMap[k][rep.tec]=(mesMap[k][rep.tec]||0)+1;
    });
    var MN=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    var tendencia=Object.keys(mesMap).sort().map(function(k){
      var pp=k.split('-'), e={mes:MN[+pp[1]-1]+' '+pp[0]};
      Object.keys(mesMap[k]).forEach(function(t){e[t]=mesMap[k][t];});
      return e;
    });

    var allD=repairs.filter(function(r){return r.dias!==null&&r.dias!==undefined;}).map(function(r){return r.dias;});
    var avgGen=allD.length>0?Math.round(allD.reduce(function(s,v){return s+v;},0)/allD.length*10)/10:0;

    return {
      tecnicos:tecnicos, tendencia:tendencia,
      resumen:{
        totalReparaciones:repairs.length,
        tecnicosActivos:tecnicos.length,
        avgHorasGeneral:avgGen,
        totalReincidencias:Object.keys(reinc).reduce(function(s,k){return s+reinc[k];},0)
      }
    };
  } catch(e){ throw new Error('[KpiTecnicos] '+e.message); }
}

function getKpiTecnicoDetalle(tecnico, params) {
  try {
    params = params || {};
    var segmento = params.segmento || 'global';
    var dDesde = kpiParseD_(params.desde||'');
    var dHasta = kpiParseD_(params.hasta||'');

    var ss = SpreadsheetApp.openById(CALIDAD_SPREADSHEET_ID);
    var data = ss.getSheetByName('Reporte Taller').getDataRange().getDisplayValues();
    var H = data[0].map(function(h){return String(h).trim().toLowerCase().replace(/\s+/g,'_');});
    function c(n){return H.indexOf(n);}

    var C = {
      tecnico:c('técnico_responsable_de_reparación'), fechaIng:c('fecha_de_ingreso'),
      fechaFin:c('fecha_final_de_reparación'), dias:c('dias_en_reparación'),
      destino:c('devolver_a:'), serie:c('nro_serie'), cliente:c('cliente'),
      modelo:c('modelo'), falla:c('falla'), fichaIng:c('ficha_de_ingreso'),
      fichaRep:c('ficha_reparación'), repuesto:c('repuesto_utilizado'),
      proc:c('procedimiento_de_reparacion'), estado:c('status')
    };

    // Cargar Formulario SALIDA para cruzar horas por serie+fecha
    var horasBy = {};
    try {
      var sal = ss.getSheetByName('Formulario SALIDA');
      if (sal) {
        var sd = sal.getDataRange().getDisplayValues();
        var SH = sd[0].map(function(h){return String(h).trim().toLowerCase().replace(/\s+/g,'_');});
        function sc(n){return SH.indexOf(n);}
        var sSerie=sc('serie_del_producto'), sFSal=sc('fecha_de_salida_del_taller'),
            sHIni=sc('hora_de_inicio_de_reparación'), sHFin=sc('hora_de_termino_de_reparación');
        for (var i=1; i<sd.length; i++) {
          var se = sSerie>=0 ? String(sd[i][sSerie]||'').trim() : '';
          var fs = sFSal>=0  ? String(sd[i][sFSal]||'').trim()  : '';
          if (!se || !fs) continue;
          var key = se + '|' + fs;
          horasBy[key] = {
            ini: sHIni>=0 ? String(sd[i][sHIni]||'').trim() : '',
            fin: sHFin>=0 ? String(sd[i][sHFin]||'').trim() : ''
          };
        }
      }
    } catch(e) {}

    function calcHoras(ini, fin) {
      if (!ini || !fin) return null;
      var pt = function(t) {
        t = String(t).trim().toLowerCase().replace(/\./g,'');
        var esPm = t.indexOf('p')>=0, esAm = t.indexOf('a')>=0;
        t = t.replace(/[ap]m?/g,'').trim();
        var pp = t.split(':');
        if (pp.length<2) return null;
        var h = parseInt(pp[0],10), m = parseInt(pp[1],10);
        if (isNaN(h)||isNaN(m)) return null;
        if (esPm && h<12) h += 12;
        if (esAm && h===12) h = 0;
        return h*60 + m;
      };
      var m1=pt(ini), m2=pt(fin);
      if (m1===null||m2===null) return null;
      var d = m2 - m1;
      if (d<0) d += 1440;
      return Math.round(d/60*10)/10;
    }

    var equipos=[], diasArr=[], horasArr=[];

    for (var i=1; i<data.length; i++) {
      var row=data[i];
      if(!row.some(function(v){return v&&v.trim();}))continue;
      var tec=C.tecnico>=0?String(row[C.tecnico]||'').trim():'';
      if(tec!==tecnico)continue;
      var dest=C.destino>=0?String(row[C.destino]||'').trim():'';
      if(dest.toLowerCase().indexOf('baja')>=0)continue;

      var cliente=C.cliente>=0?String(row[C.cliente]||'').trim():'';
      var fechaIng=C.fechaIng>=0?String(row[C.fechaIng]||'').trim():'';
      var fechaFin=C.fechaFin>=0?String(row[C.fechaFin]||'').trim():'';
      var dIng=kpiParseD_(fechaIng), dFin=kpiParseD_(fechaFin);

      if(dDesde||dHasta){
        if(!dIng||!dFin)continue;
        if(dDesde&&(dIng<dDesde||dFin<dDesde))continue;
        if(dHasta&&(dIng>dHasta||dFin>dHasta))continue;
      }
      if(segmento==='clientes'&&cliente.toLowerCase().indexOf('eden')>=0)continue;
      if(segmento==='eden'&&cliente.toLowerCase().indexOf('eden')<0)continue;

      var serie = C.serie>=0?String(row[C.serie]||'').trim():'';
      var diasVal=C.dias>=0?String(row[C.dias]||'').trim():'';
      var dias=diasVal!==''&&!isNaN(parseInt(diasVal,10))?parseInt(diasVal,10):(dIng&&dFin?Math.max(0,Math.round((dFin-dIng)/86400000)):null);
      if(dias!==null)diasArr.push(dias);

      // Buscar horas del Formulario SALIDA
      var horas=null, horaIni='', horaFin='';
      var horasData = horasBy[serie + '|' + fechaFin];
      if (horasData) {
        horaIni = horasData.ini;
        horaFin = horasData.fin;
        horas = calcHoras(horaIni, horaFin);
        if (horas!==null) horasArr.push(horas);
      }

      equipos.push({
        serie: serie,
        modelo:C.modelo>=0?String(row[C.modelo]||'').trim():'',
        cliente:cliente, fechaIng:fechaIng, fechaSal:fechaFin, dias:dias,
        horas:horas, horaIni:horaIni, horaFin:horaFin,
        falla:C.falla>=0?String(row[C.falla]||'').trim():'',
        fichaIng:C.fichaIng>=0?String(row[C.fichaIng]||'').trim():'',
        fichaSal:C.fichaRep>=0?String(row[C.fichaRep]||'').trim():'',
        repuesto:C.repuesto>=0?String(row[C.repuesto]||'').trim():'',
        proc:C.proc>=0?String(row[C.proc]||'').trim():'',
        destino: dest
      });
    }

    equipos.sort(function(a,b){var da=kpiParseD_(a.fechaIng),db=kpiParseD_(b.fechaIng);if(!da)return 1;if(!db)return -1;return db-da;});
    var avgD=diasArr.length>0?Math.round(diasArr.reduce(function(s,v){return s+v;},0)/diasArr.length*10)/10:null;
    var avgH=horasArr.length>0?Math.round(horasArr.reduce(function(s,v){return s+v;},0)/horasArr.length*10)/10:null;

    return { equipos:equipos, stats:{count:equipos.length, avgHoras:avgH, avgDias:avgD} };
  } catch(e){ throw new Error('[KpiTecDetalle] '+e.message); }
}

function kpiParseD_(s){
  if(!s||!s.trim()||s==='-')return null;
  var t = s.trim();
  // Formato YYYY-MM-DD (input date nativo)
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    var pp = t.split('-');
    return new Date(+pp[0], +pp[1]-1, +pp[2]);
  }
  // Formato DD/MM/YYYY
  var p = t.split('/');
  if (p.length===3 && p[2].length===4) return new Date(+p[2], +p[1]-1, +p[0]);
  var d = new Date(t); return isNaN(d.getTime())?null:d;
}


function debugPedroRT() {
  var ss = SpreadsheetApp.openById(CALIDAD_SPREADSHEET_ID);
  var data = ss.getSheetByName('Reporte Taller').getDataRange().getDisplayValues();
  var H = data[0].map(function(h){return String(h).trim().toLowerCase().replace(/\s+/g,'_');});
  function c(n){return H.indexOf(n);}
  var cTec=c('técnico_responsable_de_reparación'),cFIng=c('fecha_de_ingreso'),cFFin=c('fecha_final_de_reparación'),cDest=c('devolver_a:'),cSerie=c('nro_serie'),cCli=c('cliente');
  function pd(s){if(!s||!s.trim())return null;var p=s.trim().split('/');if(p.length===3&&p[2].length===4)return new Date(+p[2],+p[1]-1,+p[0]);return null;}
  var d1=new Date(2026,5,1),d2=new Date(2026,5,30);
  var count=0,out=[],destinos={};
  for(var i=1;i<data.length;i++){
    var tec=String(data[i][cTec]||'').trim();
    if(tec.toLowerCase().indexOf('pedro')<0)continue;
    var dest=String(data[i][cDest]||'').trim().toLowerCase();
    if(dest.indexOf('baja')>=0)continue;
    var dIng=pd(String(data[i][cFIng]||'').trim());
    var dFin=pd(String(data[i][cFFin]||'').trim());
    if(!dIng||!dFin||dIng<d1||dIng>d2||dFin<d1||dFin>d2)continue;
    count++;
    destinos[dest]=(destinos[dest]||0)+1;
    out.push(count+') '+String(data[i][cSerie]||'').trim()+' | '+String(data[i][cCli]||'').trim()+' | ing:'+String(data[i][cFIng]||'').trim()+' fin:'+String(data[i][cFFin]||'').trim()+' | '+dest);
  }
  out.unshift('TOTAL Pedro junio: '+count+'\nDestinos: '+JSON.stringify(destinos)+'\n');
  Logger.log(out.join('\n'));
  return count;
}

function getModelosBaja(rangoFechas) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var reporte = getSheetObjects_(ss.getSheetByName(SHEET_REPORTE));

    var fechaInicio = (rangoFechas && rangoFechas.desdeISO) ? parseISODate_(rangoFechas.desdeISO) : null;
    var fechaFin    = (rangoFechas && rangoFechas.hastaISO) ? parseISODate_(rangoFechas.hastaISO) : null;

    var dentroDeRango = function(fechaTexto) {
      if (!fechaInicio && !fechaFin) return true;
      var fecha = parseFlexibleDate_(fechaTexto);
      if (!fecha) return false;
      var t = fecha.getTime();
      if (fechaInicio && t < fechaInicio.getTime()) return false;
      if (fechaFin    && t > fechaFin.getTime())    return false;
      return true;
    };

    var modeloMap = {};
    reporte.forEach(function(r) {
      var status = normalize_(r['Status'] || r['Estado'] || '');
      if (!status.includes('retiro') && !status.includes('baja') && !status.includes('desecho')) return;
      var fechaIng = r['Fecha de Ingreso'] || r['Fecha Ingreso'] || r['Fecha'] || '';
      if (!dentroDeRango(fechaIng)) return;
      var modelo = String(r['Modelo'] || '-').trim();
      if (!modeloMap[modelo]) modeloMap[modelo] = 0;
      modeloMap[modelo]++;
    });

    return Object.keys(modeloMap).map(function(m) {
      return { modelo: m, total: modeloMap[m] };
    }).sort(function(a, b) { return b.total - a.total; });

  } catch(e) { throw new Error('[getModelosBaja] ' + e.message); }
}

function getIngresosVsSalidas(rangoFechas) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var reporte = getSheetObjects_(ss.getSheetByName(SHEET_REPORTE));
    var _m = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

    var fechaInicio = (rangoFechas && rangoFechas.desdeISO) ? parseISODate_(rangoFechas.desdeISO) : null;
    var fechaFin    = (rangoFechas && rangoFechas.hastaISO) ? parseISODate_(rangoFechas.hastaISO) : null;

    var meses = {};
    var getEntry = function(key) {
      if (!meses[key]) meses[key] = {
        ingInv: 0, ingCli: 0,
        salInvMes: 0, salInvRez: 0, salCliMes: 0, salCliRez: 0
      };
      return meses[key];
    };

    reporte.forEach(function(r) {
      var esEden = normalize_(r['Cliente'] || '').includes('eden');

      var fechaIng = parseFlexibleDate_(r['Fecha de Ingreso'] || r['Fecha Ingreso'] || r['Fecha'] || '');
      var fechaSal = parseFlexibleDate_(r['Fecha Final de Reparación'] || r['Fecha de salida'] || r['Fecha Salida'] || '');

      // ── Ingresos: por mes de ingreso ──
      if (fechaIng) {
        var tIng = fechaIng.getTime();
        if ((!fechaInicio || tIng >= fechaInicio.getTime()) && (!fechaFin || tIng <= fechaFin.getTime())) {
          var keyIng = fechaIng.getFullYear() + '-' + String(fechaIng.getMonth() + 1).padStart(2, '0');
          var eI = getEntry(keyIng);
          if (esEden) eI.ingInv++; else eI.ingCli++;
        }
      }

      // ── Salidas: por mes de salida, cruzando origen (del mes / rezagado) ──
      if (fechaSal) {
        var tSal = fechaSal.getTime();
        if ((!fechaInicio || tSal >= fechaInicio.getTime()) && (!fechaFin || tSal <= fechaFin.getTime())) {
          var keySal = fechaSal.getFullYear() + '-' + String(fechaSal.getMonth() + 1).padStart(2, '0');
          var eS = getEntry(keySal);

          // ¿Ingresó en el mismo mes que salió? → del mes; si no → rezagado
          var mismoMes = false;
          if (fechaIng) {
            mismoMes = (fechaIng.getFullYear() === fechaSal.getFullYear() &&
                        fechaIng.getMonth()    === fechaSal.getMonth());
          }

          if (esEden) {
            if (mismoMes) eS.salInvMes++; else eS.salInvRez++;
          } else {
            if (mismoMes) eS.salCliMes++; else eS.salCliRez++;
          }
        }
      }
    });

    return Object.keys(meses).sort().slice(-12).map(function(k) {
      var p = k.split('-');
      var d = meses[k];
      return {
        mes: _m[parseInt(p[1]) - 1],
        ingInv: d.ingInv, ingCli: d.ingCli,
        salInvMes: d.salInvMes, salInvRez: d.salInvRez,
        salCliMes: d.salCliMes, salCliRez: d.salCliRez,
        totalIng: d.ingInv + d.ingCli,
        totalSal: d.salInvMes + d.salInvRez + d.salCliMes + d.salCliRez
      };
    });
  } catch(e) { throw new Error('[getIngresosVsSalidas] ' + e.message); }
}

function getDetalleRezagados(keySalida, keyIngreso) {
  try {
    var ss      = SpreadsheetApp.getActiveSpreadsheet();
    var reporte = getSheetObjects_(ss.getSheetByName(SHEET_REPORTE));

    var motivoMap = {};
    reporte.forEach(function(r) {

      var fechaSal = parseFlexibleDate_(
        r['Fecha Final de Reparación'] || r['Fecha de salida'] || r['Fecha Salida'] || ''
      );
      if (!fechaSal) return;
      var kSal = fechaSal.getFullYear() + '-' + String(fechaSal.getMonth()+1).padStart(2,'0');
      if (kSal !== keySalida) return;

      var fechaIng = parseFlexibleDate_(
        r['Fecha de Ingreso'] || r['Fecha Ingreso'] || r['Fecha'] || ''
      );
      if (!fechaIng) return;
      var kIng = fechaIng.getFullYear() + '-' + String(fechaIng.getMonth()+1).padStart(2,'0');
      if (kIng !== keyIngreso) return;

      var motivo = String(r['Devolver a:'] || r['Devolver a'] || 'Sin asignar').trim();
      if (!motivoMap[motivo]) motivoMap[motivo] = 0;
      motivoMap[motivo]++;
    });

    return Object.keys(motivoMap).map(function(m) {
      return { motivo: m, total: motivoMap[m] };
    }).sort(function(a, b) { return b.total - a.total; });

  } catch(e) { throw new Error('[getDetalleRezagados] ' + e.message); }
}
