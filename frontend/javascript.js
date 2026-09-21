<script>
  // =========================================
  // VARIABLES GLOBALES
  // =========================================
  var filtrosActuales = { modelo: '', estado: '', falla: '', ficha: '', tipoCliente: '' };
  var rangoFechasActual = { desde: '', hasta: '', desdeISO: '', hastaISO: '' };
  var paginaActual  = 1;
  var totalPaginas  = 1;

  var currentData = new Date();
  currentData = new Date(currentData.getFullYear(), currentData.getMonth(), 1);
  var fechaDesde = null, fechaHasta = null, fechaHover = null;
  var esperandoHasta = false, inputActivo = 'desde';
  var _dashboardLoadingVisible = false;

  var detalleActual     = { serie: '', equipo: null, ingresos: [], salidas: [], detalleGeneral: {} };
  var cambiosPendientes = { ingreso: null, salida: null };
  var searchDebounceTimer = null;

  var meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  var dashCurrentData = new Date();
  dashCurrentData = new Date(dashCurrentData.getFullYear(), dashCurrentData.getMonth(), 1);
  var dashFechaDesde = null, dashFechaHasta = null, dashFechaHover = null;
  var dashEsperandoHasta = false;
  var dashRangoFechasActual = { desde: '', hasta: '', desdeISO: '', hastaISO: '' };
  var _chartIngSalDetalle = null, _chartIngSalTotal = null;
  var _chartDona = null, _chartModelos = null, _chartFallas = null, _chartClienteVsEden = null;
  var _configTaller = null;
  var _dropdownsIngresoInit = false;
  var _dropdownsSalidaInit  = false;
  var _dropdownsEdicionInit = false;
  var _fichasMap = {};
  var _historialData = [];
  var _actividadData = null;
  var _histPDFSeleccionados = [];

var CHART_COLORS = [
  '#0d0d0c',
  '#475569',
  '#64748b',
  '#94a3b8',
  '#166534',
  '#0f766e',
  '#92400e',
  '#7f1d1d',
  '#312e81',
  '#581c87',
  '#334155',
  '#525252'
];

var htmlCargador = '<tr><td colspan="12"><div id="equipos-loader-container" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 0;gap:18px;"><div style="position:relative;width:64px;height:64px;display:flex;align-items:center;justify-content:center;"><svg width="64" height="64" style="position:absolute;top:0;left:0;"><circle cx="32" cy="32" r="28" fill="none" stroke="var(--border-soft)" stroke-width="1.5"/><circle cx="32" cy="32" r="28" fill="none" stroke="var(--text-main)" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="44 176" style="transform-origin:32px 32px;animation:spin .9s linear infinite;"/></svg><svg width="56" height="56" style="position:absolute;top:4px;left:4px;"><circle cx="28" cy="28" r="20" fill="none" stroke="var(--border-soft)" stroke-width="1"/><circle cx="28" cy="28" r="20" fill="none" stroke="var(--border-med)" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="22 126" style="transform-origin:28px 28px;animation:spin-reverse 1.4s linear infinite;"/></svg><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--text-main)" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.6-3.6a5.8 5.8 0 0 1-7.7 7.7l-6.7 6.7a2 2 0 0 1-2.8-2.8l6.7-6.7a5.8 5.8 0 0 1 7.7-7.7l-3.6 3.6z"/></svg></div><div style="display:flex;flex-direction:column;align-items:center;gap:10px;"><span id="equipos-loader-text" style="font-size:13px;color:var(--text-muted);letter-spacing:.01em;">Buscando equipos en el taller</span><div style="display:flex;gap:5px;"><div style="width:5px;height:5px;border-radius:50%;background:var(--text-main);animation:pulse-dot 1.4s ease-in-out infinite;"></div><div style="width:5px;height:5px;border-radius:50%;background:var(--text-main);animation:pulse-dot 1.4s ease-in-out .2s infinite;"></div><div style="width:5px;height:5px;border-radius:50%;background:var(--text-main);animation:pulse-dot 1.4s ease-in-out .4s infinite;"></div></div></div></div></td></tr>';

var htmlDashboardCargador = '<div id="dashboard-loader-container" style="display:flex;justify-content:center;align-items:center;min-height:300px;width:100%;"><style>@keyframes pulse-dot{0%,100%{opacity:.25;transform:scale(.75)}50%{opacity:1;transform:scale(1)}}@keyframes bar-grow{0%,100%{transform:scaleY(.3);opacity:.35}50%{transform:scaleY(1);opacity:1}}</style><div style="display:flex;flex-direction:column;align-items:center;gap:18px;"><div style="display:flex;gap:4px;align-items:flex-end;height:32px;"><div style="width:4px;border-radius:2px;background:#0d0d0c;transform-origin:bottom;animation:bar-grow 1.1s ease-in-out infinite;height:12px;"></div><div style="width:4px;border-radius:2px;background:#0d0d0c;transform-origin:bottom;animation:bar-grow 1.1s ease-in-out .15s infinite;height:22px;"></div><div style="width:4px;border-radius:2px;background:#0d0d0c;transform-origin:bottom;animation:bar-grow 1.1s ease-in-out .3s infinite;height:16px;"></div><div style="width:4px;border-radius:2px;background:#0d0d0c;transform-origin:bottom;animation:bar-grow 1.1s ease-in-out .45s infinite;height:26px;"></div><div style="width:4px;border-radius:2px;background:#0d0d0c;transform-origin:bottom;animation:bar-grow 1.1s ease-in-out .6s infinite;height:14px;"></div></div><div style="display:flex;flex-direction:column;align-items:center;gap:10px;"><span style="font-size:13px;color:#6b7280;letter-spacing:.01em;">Calculando métricas del taller</span><div style="display:flex;gap:5px;"><div style="width:5px;height:5px;border-radius:50%;background:#0d0d0c;animation:pulse-dot 1.4s ease-in-out infinite;"></div><div style="width:5px;height:5px;border-radius:50%;background:#0d0d0c;animation:pulse-dot 1.4s ease-in-out .2s infinite;"></div><div style="width:5px;height:5px;border-radius:50%;background:#0d0d0c;animation:pulse-dot 1.4s ease-in-out .4s infinite;"></div></div></div></div></div>';

var htmlDetalleCargador = '<div id="detalle-loader-container" style="display:flex;justify-content:center;align-items:center;min-height:350px;width:100%;"><style>@keyframes spin{to{transform:rotate(360deg)}}@keyframes spin-reverse{to{transform:rotate(-360deg)}}@keyframes pulse-dot{0%,100%{opacity:.25;transform:scale(.75)}50%{opacity:1;transform:scale(1)}}</style><div style="display:flex;flex-direction:column;align-items:center;gap:18px;"><div style="position:relative;width:64px;height:64px;display:flex;align-items:center;justify-content:center;"><svg width="64" height="64" style="position:absolute;top:0;left:0;overflow:visible;"><circle cx="32" cy="32" r="28" fill="none" stroke="var(--border-soft)" stroke-width="1.5"/><circle cx="32" cy="32" r="28" fill="none" stroke="var(--text-main)" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="44 176" style="transform-origin:32px 32px;animation:spin .9s linear infinite;"/></svg><svg width="56" height="56" style="position:absolute;top:4px;left:4px;overflow:visible;"><circle cx="28" cy="28" r="20" fill="none" stroke="var(--border-soft)" stroke-width="1"/><circle cx="28" cy="28" r="20" fill="none" stroke="var(--border-med)" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="22 126" style="transform-origin:28px 28px;animation:spin-reverse 1.4s linear infinite;"/></svg><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-main)" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><circle cx="10" cy="14" r="2"/><line x1="12" y1="16" x2="15" y2="19"/></svg></div><div style="display:flex;flex-direction:column;align-items:center;gap:10px;"><span style="font-size:13px;color:var(--text-muted);letter-spacing:.01em;">Recopilando historial y detalles</span><div style="display:flex;gap:5px;"><div style="width:5px;height:5px;border-radius:50%;background:var(--text-main);animation:pulse-dot 1.4s ease-in-out infinite;"></div><div style="width:5px;height:5px;border-radius:50%;background:var(--text-main);animation:pulse-dot 1.4s ease-in-out .2s infinite;"></div><div style="width:5px;height:5px;border-radius:50%;background:var(--text-main);animation:pulse-dot 1.4s ease-in-out .4s infinite;"></div></div></div></div></div>';

document.getElementById('equiposBody').addEventListener('click', function(event) {
  // Verificamos si el clic provino de un botón de detalle (o un icono dentro de él)
  const btnDetalle = event.target.closest('.btn-ver-detalle');
  
  if (btnDetalle) {
    // Extraemos los datos del botón que fue clicado
    const serie = btnDetalle.dataset.serie;
    const ficha = btnDetalle.dataset.ficha;
    const ticket = btnDetalle.dataset.ticket;
    
    // Ejecutamos la función original
    verDetalle(serie, ficha, ticket);
    return; // Salimos para no procesar nada más
  }

  // Aquí mismo puedes capturar los clics de los botones de "Ver Ficha"
  const btnFicha = event.target.closest('.ficha-eye-btn');
  if (btnFicha) {
    const fileId = btnFicha.dataset.fileId;
    const url = btnFicha.dataset.url;
    const titulo = btnFicha.dataset.titulo;
    equiposVerFicha(fileId, url, titulo);
  }
});

  document.addEventListener('DOMContentLoaded', function() {
    configurarSelectorFechas();
    renderCalendarios();
    cerrarPopoverFechas();
    configurarDashSelectorFechas();
    dashRenderCalendarios();
    setLoadingSummary();
    document.getElementById('equiposBody').innerHTML = htmlCargador;

    google.script.run
      .withSuccessHandler(function(data) {
        renderDashboard(data.dashboard);
        renderEquiposResponse(data.equipos);
        _filtrosCache = data.filtros;
        if (data.chartsData) {
          if (typeof Chart === 'undefined') {
            var script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js';
            script.onload = function() { renderAllCharts(data.chartsData); };
            document.head.appendChild(script);
          } else {
            setTimeout(function() { renderAllCharts(data.chartsData); }, 200);
          }
        } else {
          setTimeout(loadCharts, 800);
        }
      })
      .withFailureHandler(function(err) { showError(err); console.error(err); })
      .getInitialData();

    google.script.run
      .withSuccessHandler(function(map) { _fichasMap = map || {}; })
      .withFailureHandler(function() {})
      .getFichasMap();

    cargarConfigTaller(function(config) {
      inicializarDropdownsIngreso(config);
      _dropdownsIngresoInit = true;
      inicializarDropdownsEdicion(config);
      _dropdownsEdicionInit = true;
    });
  });

  var _filtrosCache = null;

  // =========================================
  // CONFIG TALLER — Dropdowns con búsqueda
  // =========================================
  function cargarConfigTaller(callback) {
    if (_configTaller) { if (callback) callback(_configTaller); return; }
    google.script.run
      .withSuccessHandler(function(config) {
        _configTaller = config;
        if (callback) callback(config);
      })
      .withFailureHandler(function(e) { console.error('Error cargando config:', e); })
      .getConfigTaller();
  }

  function crearDropdownBusqueda(inputId, opciones, placeholder) {
    var input = document.getElementById(inputId);
    if (!input) return;
    if (input.parentNode && input.parentNode.classList && input.parentNode.classList.contains('dd-wrapper')) return;
    var wrapper = document.createElement('div');
    wrapper.className = 'dd-wrapper';
    wrapper.style.cssText = 'position:relative; width:100%;';
    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);
    var lista = document.createElement('div');
    lista.id = inputId + '_lista';
    lista.style.cssText = 'display:none; position:absolute; top:100%; left:0; right:0; z-index:9999; background:#fff; border:1.5px solid var(--blue-main); border-top:none; border-radius:0 0 var(--radius-md) var(--radius-md); max-height:220px; overflow-y:auto; box-shadow:var(--shadow-md);';
    wrapper.appendChild(lista);
    function renderOpciones(filtro) {
      var term = (filtro || '').toLowerCase().trim();
      var filtradas = term ? opciones.filter(function(o) { return o.toLowerCase().includes(term); }) : opciones;
      lista.innerHTML = '';
      if (!filtradas.length) {
        lista.innerHTML = '<div style="padding:10px 14px;color:var(--text-muted);font-size:13px;font-style:italic;">Sin resultados</div>';
        lista.style.display = 'block';
        return;
      }
      filtradas.forEach(function(op) {
        var item = document.createElement('div');
        item.textContent = op;
        item.style.cssText = 'padding:10px 14px; cursor:pointer; font-size:13px; color:var(--text-main); border-bottom:1px solid var(--border-soft); transition:background .1s;';
        item.onmouseenter = function() { this.style.background = 'var(--blue-soft)'; };
        item.onmouseleave = function() { this.style.background = ''; };
        item.onmousedown = function(e) {
          e.preventDefault();
          input.value = op;
          lista.style.display = 'none';
          input.dispatchEvent(new Event('change'));
        };
        lista.appendChild(item);
      });
      lista.style.display = 'block';
    }
    input.addEventListener('focus', function() { renderOpciones(this.value); });
    input.addEventListener('input', function() { renderOpciones(this.value); });
    input.addEventListener('blur', function() { setTimeout(function() { lista.style.display = 'none'; }, 200); });
    if (placeholder) input.placeholder = placeholder;
  }

  function inicializarDropdownsIngreso(config) {
    crearDropdownBusqueda('nI_tecnico', config.tecnicos, 'Busca o escribe un técnico...');
    crearDropdownBusqueda('nI_modelo',  config.modelos,  'Busca o escribe un modelo...');
    crearDropdownBusqueda('nI_motivo',  config.motivos || [],  'Busca o escribe un motivo...');
    crearDropdownBusqueda('nI_color',   config.colores || [], 'Busca o escribe un color...');
  }

  function inicializarDropdownsSalida(config) {
    crearDropdownBusqueda('nS_tecnico', config.tecnicos, 'Busca o escribe un técnico...');
    crearDropdownBusqueda('nS_cliente', config.clientes || [], 'Busca o escribe cliente...');
  }

  function inicializarDropdownsEdicion(config) {
    crearDropdownBusqueda('eI_tecnico', config.tecnicos, 'Busca o escribe un técnico...');
    crearDropdownBusqueda('eI_modelo',  config.modelos,  'Busca o escribe un modelo...');
    crearDropdownBusqueda('eI_motivo',  config.motivos || [],  'Busca o escribe un motivo...');
    crearDropdownBusqueda('eS_tecnico', config.tecnicos, 'Busca o escribe un técnico...');
  }
  // =========================================
  // SECCIONES
  // =========================================
function showSection(sectionId, btn) {
  document.querySelectorAll('.section').forEach(function(s) { s.classList.remove('active-section'); });
  document.getElementById(sectionId).classList.add('active-section');
  document.querySelectorAll('.menu-item').forEach(function(i) { i.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  var titles = {
    dashboard:     ['Dashboard',            'Resumen general del taller'],
    equipos:       ['Equipos',              'Búsqueda y trazabilidad de equipos'],
    nuevo:         ['Nuevo registro',       'Ingreso de nuevos equipos al taller o despachos'],
    edicion:       ['Editar registros',     'Edición directa de formularios de ingreso y salida'],
    calidad:       ['Control de Calidad',   'Clasificación y archivos de calidad por equipo'],
    fichas:        ['Fichas',               'Registro de fichas de ingreso y salida por equipo'],
    stock:         ['Stock Logística',      'Consulta de stock de productos de logística'],
    repuestos:     ['Repuestos Clientes', 'Control y trazabilidad de repuestos por equipo'],
    checklist:     ['Checklist Logística',  'Generación de check list de transferencia a logística'],
    checklistbaja: ['Checklist Baja',       'Generación de check list de baja de equipos en taller'],
    kpiTecnicos: ['KPI Técnicos', 'Rendimiento y reincidencia por técnico de taller'],
    actividad:     ['Actividad',            'Últimos movimientos del taller']
  };
  var t = titles[sectionId] || ['Sistema',''];
  var pt = document.getElementById('pageTitle'), ps = document.getElementById('pageSubtitle');
  if (pt) pt.textContent = t[0]; if (ps) ps.textContent = t[1];

  if (sectionId === 'checklist')     clInicializar();
  if (sectionId === 'checklistbaja') cbInicializar();
  if (sectionId === 'repuestos') repInicializar();
  if (sectionId === 'kpiTecnicos') kpiTecInicializar();
}

  // =========================================
  // DASHBOARD
  // =========================================
function loadDashboard() {
  setLoadingSummary();
  google.script.run
    .withSuccessHandler(function(resp) {
      var dashData   = resp.dashboard || resp;
      var chartsData = resp.chartsData || null;
      renderDashboard(dashData);
      // ── Siempre actualizar gráficos con el rango actual ──
      if (typeof Chart === 'undefined') {
        var script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js';
        script.onload = function() { fetchAndRenderCharts(); };
        document.head.appendChild(script);
      } else {
        fetchAndRenderCharts();
      }
    })
    .withFailureHandler(showError)
    .getDashboardData(dashRangoFechasActual.desdeISO ? dashRangoFechasActual : null);
}

function setLoadingSummary() {
  // Ocultar todos los paneles y mostrar solo un loader central
  var summaryCards = document.getElementById('summaryCards');
  if (summaryCards) { summaryCards.innerHTML = ''; summaryCards.style.display = 'none'; }

  var tiemposPanel = document.getElementById('tiemposReparacionPanel');
  if (tiemposPanel) tiemposPanel.style.display = 'none';

  var reparadosPanel = document.getElementById('reparadosMesPanel');
  if (reparadosPanel) reparadosPanel.style.display = 'none';

  var chartsSection = document.getElementById('chartsSection');
  if (chartsSection) chartsSection.style.display = 'none';

  // Loader único central en el dashboard
  var loaderExistente = document.getElementById('dashboard-loader-global');
  if (!loaderExistente) {
    var loaderDiv = document.createElement('div');
    loaderDiv.id = 'dashboard-loader-global';
    loaderDiv.innerHTML = htmlDashboardCargador;
    var dashSection = document.getElementById('dashboard');
    if (dashSection) dashSection.appendChild(loaderDiv);
  }

  // Destruir charts
  if (_kpiHorasTrendChart) { _kpiHorasTrendChart.destroy(); _kpiHorasTrendChart = null; }
  if (_chartDona) { _chartDona.destroy(); _chartDona = null; }
  if (_chartFallas) { _chartFallas.destroy(); _chartFallas = null; }
  if (_chartClienteVsEden) { _chartClienteVsEden.destroy(); _chartClienteVsEden = null; }
    if (_chartIngSalDetalle) { _chartIngSalDetalle.destroy(); _chartIngSalDetalle = null; }
  if (_chartIngSalTotal)   { _chartIngSalTotal.destroy();   _chartIngSalTotal = null; }
}

  function buildDesgloseHtml(items, colorFn) {
    var validos = (items || []).filter(function(i) { return i.total > 0 && i.nombre && i.nombre.trim() !== ''; });
    if (!validos.length) return '';
    return validos.map(function(i) {
      var color = colorFn(i.nombre);
      return '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px;padding-top:6px;border-top:1px solid #f1f5f9;"><span style="font-size:11px;color:#64748b;font-weight:500;max-width:70%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="' + safe(i.nombre) + '">' + safe(i.nombre) + '</span><span style="font-size:13px;font-weight:800;color:' + color + ';font-family:\'DM Mono\',monospace;flex-shrink:0;margin-left:6px;">' + i.total + '</span></div>';
    }).join('');
  }
function buildFinalizadosHtml(mesActual, rezagados, posteriores) {
  var bloques = [];

  if (mesActual) {
    var mesCorto = (mesActual.label||'').split(' ')[0].toUpperCase();
    bloques.push({ titulo: 'Total equipos ' + mesCorto + ': ' + mesActual.total, colorTitulo: '#1e40af', eden: mesActual.eden || 0, cliente: mesActual.cliente || 0 });
  }
  (rezagados || []).forEach(function(r) {
    var mesCorto = (r.label||'').split(' ')[0];
    bloques.push({ titulo: 'Rezagados ' + mesCorto + ': ' + r.total, colorTitulo: '#92400e', eden: r.eden || 0, cliente: r.cliente || 0 });
  });
  (posteriores || []).forEach(function(p) {
    var mesCorto = (p.label||'').split(' ')[0];
    bloques.push({ titulo: 'Salida en ' + mesCorto + ': ' + p.total, colorTitulo: '#6366f1', eden: null, cliente: null });
  });

  if (!bloques.length) return '';

  var html = '<div style="display:grid;grid-template-columns:repeat(' + bloques.length + ',1fr);gap:0;margin-top:12px;padding-top:12px;border-top:1px solid #e2e8f0;">';
  bloques.forEach(function(b, i) {
    var detalle = '';
    if (b.eden !== null) {
      detalle = '<div style="font-size:10px;color:#3b82f6;font-weight:700;margin-bottom:2px;">Eden Agua: ' + b.eden + '</div>' +
        '<div style="font-size:10px;color:#ef4444;font-weight:700;">Cliente: ' + b.cliente + '</div>';
    }
    html += '<div style="padding:0 8px;' + (i > 0 ? 'border-left:1px solid #cbd5e1;' : '') + 'min-width:0;">' +
      '<div style="font-size:10px;font-weight:800;color:' + b.colorTitulo + ';margin-bottom:6px;line-height:1.35;word-break:break-word;">' + b.titulo + '</div>' +
      detalle +
    '</div>';
  });
  html += '</div>';
  return html;
}
function buildEntregadosHtml(mesActual, rezagados) {
  var bloques = [];

  if (mesActual) {
    var mesCorto = (mesActual.label||'').split(' ')[0];
    bloques.push({ titulo: 'Finalizados en ' + mesCorto + ': ' + mesActual.total, colorTitulo: '#166534', items: mesActual.desgloseDevolver || [] });
  }
  (rezagados || []).forEach(function(r) {
    var mesCorto = (r.label||'').split(' ')[0];
    bloques.push({ titulo: 'Rezagados ' + mesCorto + ': ' + r.total, colorTitulo: '#92400e', items: r.desgloseDevolver || [] });
  });
  if (!bloques.length) return '';

  var html = '<div style="display:grid;grid-template-columns:repeat(' + bloques.length + ',1fr);gap:0;margin-top:12px;padding-top:12px;border-top:1px solid #e2e8f0;">';
  bloques.forEach(function(b, i) {
    var itemsHtml = b.items.map(function(it) {
      return '<div style="display:flex;justify-content:space-between;gap:6px;font-size:10px;margin-bottom:3px;">' +
        '<span style="color:#64748b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + safe(it.nombre) + '</span>' +
        '<span style="color:#166534;font-weight:700;font-family:\'DM Mono\',monospace;flex-shrink:0;">' + it.total + '</span>' +
      '</div>';
    }).join('');
    html += '<div style="padding:0 8px;' + (i > 0 ? 'border-left:1px solid #cbd5e1;' : '') + 'min-width:0;">' +
      '<div style="font-size:10px;font-weight:800;color:' + b.colorTitulo + ';margin-bottom:6px;line-height:1.35;word-break:break-word;">' + b.titulo + '</div>' +
      itemsHtml +
    '</div>';
  });
  html += '</div>';
  return html;
}
function buildCierreHtml(items) {
  var validos = (items || []).filter(function(i) { return i.total > 0; });
  if (!validos.length) return '';

  // Ordenar: "Finalizados en el mes" primero, luego los demás
  validos.sort(function(a, b) {
    if (a.nombre.indexOf('en el mes') >= 0) return -1;
    if (b.nombre.indexOf('en el mes') >= 0) return 1;
    return 0;
  });

  return '<div style="margin:6px 0 10px;padding:8px 0;border-top:1px solid #f1f5f9;border-bottom:1px solid #f1f5f9;">' +
    validos.map(function(i) {
      var esMes = i.nombre.indexOf('en el mes') >= 0;
      var icono = esMes ? '✓' : '↪';
      var color = esMes ? '#16a34a' : '#d97706';
      return '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:4px;">' +
        '<span style="font-size:11px;color:#64748b;font-weight:500;">' +
          '<span style="color:' + color + ';font-weight:700;margin-right:5px;">' + icono + '</span>' + safe(i.nombre) +
        '</span>' +
        '<span style="font-size:12px;font-weight:800;color:' + color + ';font-family:\'DM Mono\',monospace;">' + i.total + '</span>' +
      '</div>';
    }).join('') +
  '</div>';
}
  function colorDevolver(nombre) { return normalize_(nombre).includes('eden') ? '#3d7fff' : '#22c55e'; }
  function colorReparacion(nombre) { return normalize_(nombre).includes('eden') ? '#3d7fff' : '#ef4444'; }

  function renderDashboard(data) {
    mostrarExitoDashboard(function() {
      document.querySelectorAll('#dashboard .grid-two').forEach(function(el) { el.style.display = ''; });
      var chartsSection = document.getElementById('chartsSection');
      if (chartsSection) chartsSection.style.display = '';
      document.getElementById('summaryCards').style.display = '';

      var s     = data.resumen || {};
      var total = s.totalEquipos || 1;

      var desgloseTotal  = buildDesgloseHtml(s.desgloseTotal      || [], colorReparacion);
      var desgloseRep    = buildDesgloseHtml(s.desgloseReparacion  || [], colorReparacion);
      var desgloseList   = buildDesgloseHtml(s.desgloseListos      || [], colorDevolver);
      var desgloseListCierre = buildCierreHtml(s.desgloseListosCierre || []);
      var desgloseRetiro = buildDesgloseHtml(s.desgloseRetiroBaja  || [], function() { return '#7c3aed'; });
      var cardsEl = document.getElementById('summaryCards');
      cardsEl.style.gridTemplateColumns = 'repeat(5, minmax(0, 1fr))';
      cardsEl.innerHTML =
        '<div class="card c-blue"><h4>Equipos gestionados en el mes</h4><div class="value">' + (s.totalFinalizadosMesActual||0) + '</div><div class="card-sub" style="margin-bottom:8px;"><span class="card-badge info">' + safe(s.mesActualLabel||'') + '</span></div>' + buildFinalizadosHtml(s.finalizadosMesActual, s.rezagadosMesActual)+ '</div>' +
        '<div class="card c-green"><h4>Equipos entregados a logistica</h4><div class="value">' + (s.totalEntregadosMesActual||0) + '</div><div class="card-sub" style="margin-bottom:8px;"><span class="card-badge up">' + safe(s.mesActualLabel||'') + '</span></div>' + buildEntregadosHtml(s.entregadosMesActual, s.rezagadosEntregados) + '</div>' +
        '<div class="card c-amber"><h4>En reparacion</h4><div class="value">' + (s.enReparacion||0) + '</div><div class="card-sub" style="margin-bottom:8px;"><span class="card-badge down">' + safe(s.mesActualLabel||'') + '</span></div>' + buildReparacionHtml(s.reparacionDesglose) + '</div>' +
        '<div class="card" style="border-top:3px solid #7c3aed;"><h4 style="color:#7c3aed;">De Baja</h4><div class="value" style="color:#7c3aed;">' + (s.totalBajaMesActual||0) + '</div><div class="card-sub" style="margin-bottom:8px;"><span class="card-badge" style="background:#ede9fe;color:#5b21b6;">' + safe(s.mesActualLabel||'') + '</span></div>' + buildBajaHtml(s.bajaMesActual, s.rezagadosBaja) + '</div>' +
        '<div class="card" style="border-top:3px solid #dc2626;"><h4 style="color:#dc2626;">Equipos finalizados fuera del mes</h4><div class="value" style="color:#dc2626;">' + (s.totalFueraDelMes||0) + '</div><div class="card-sub" style="margin-bottom:8px;"><span class="card-badge" style="background:#fef2f2;color:#dc2626;">' + safe(s.mesActualLabel||'') + '</span></div>' + buildFueraDelMesHtml(s.fueraDelMesMeses) + '</div>';
      var porEstado = data.porEstado || [];
      var maxEstado = porEstado.reduce(function(m, i) { return Math.max(m, i.total); }, 1);
      var colorEstado = function(n) {
        var nL = (n||'').toLowerCase();
        if (nL.includes('operativo')) return '#22c55e';
        if (nL.includes('listo'))     return '#3d7fff';
        if (nL.includes('espera') || nL.includes('reparacion') || nL.includes('reparación')) return '#f59e0b';
        return '#94a3b8';
      };

      // Guardar datos para módulo Actividad
      _actividadData = data;
      renderDashActiveFilters();
      renderActiveFilters();
      loadKpiHorasReparacion();
    });

    (function() {
      var rango = (dashRangoFechasActual && dashRangoFechasActual.desdeISO)
        ? { desdeISO: dashRangoFechasActual.desdeISO, hastaISO: dashRangoFechasActual.hastaISO }
        : null;
      var container = document.getElementById('reparadosMesBody');
      if (container) container.innerHTML = htmlDashboardCargador;
      google.script.run
        .withSuccessHandler(function(data) {
          var container = document.getElementById('reparadosMesBody');
          if (!container || !data || !data.length) {
            if (container) container.innerHTML = '<div style="color:var(--text-faint);font-size:13px;">Sin datos para el período</div>';
            return;
          }

          // Total general sumando todos los meses de salida
          var granTotal = data.reduce(function(s, i) { return s + i.total; }, 0);
          var granEden  = data.reduce(function(s, i) { return s + (i.eden||0); }, 0);
          var granCli   = data.reduce(function(s, i) { return s + (i.cliente||0); }, 0);

          // Tarjeta resumen arriba
          var resumenHtml =
            '<div style="text-align:center;padding:16px;background:var(--bg-soft);border-radius:var(--radius-md);border:1px solid var(--border-soft);margin-bottom:16px;">' +
              '<div style="font-size:32px;font-weight:800;color:#0f172a;font-family:\'DM Mono\',monospace;line-height:1;">' + granTotal + '</div>' +
              '<div style="font-size:11px;font-weight:600;color:var(--text-muted);margin-top:4px;">Total finalizados en el período</div>' +
              '<div style="display:flex;justify-content:center;gap:16px;margin-top:8px;">' +
                '<span style="font-size:12px;color:#3b82f6;font-weight:700;">Eden Agua: ' + granEden + '</span>' +
                '<span style="font-size:12px;color:#ef4444;font-weight:700;">Cliente: ' + granCli + '</span>' +
              '</div>' +
            '</div>';

          // Panel por mes de salida
          var panelHtml = '<div style="display:flex;flex-direction:column;gap:12px;width:100%;">' +
            data.map(function(item) {
              var colorTotal = item.total >= 100 ? '#22c55e' : item.total >= 50 ? '#3d7fff' : '#f59e0b';

              var desgloseHtml = (item.desglose || []).map(function(d) {
                var color = d.total >= 100 ? '#22c55e' : d.total >= 50 ? '#3d7fff' : '#f59e0b';
                var esRezagado = d.key !== item.key;
                var cardId = 'rezDet_' + item.key.replace('-','') + '_' + d.key.replace('-','');
                var clickAttr = esRezagado
                  ? ' onclick="toggleRezagadoDetalle(\'' + cardId + '\',\'' + item.key + '\',\'' + d.key + '\',\'' + escapeQuotes(d.mes) + '\')" style="text-align:center;padding:12px 16px;background:var(--bg-soft);border-radius:var(--radius-md);border:1px solid var(--border-soft);min-width:90px;cursor:pointer;transition:box-shadow .15s;" onmouseover="this.style.boxShadow=\'0 2px 8px rgba(0,0,0,.1)\'" onmouseout="this.style.boxShadow=\'none\'"'
                  : ' style="text-align:center;padding:12px 16px;background:var(--bg-soft);border-radius:var(--radius-md);border:1px solid var(--border-soft);min-width:90px;"';

                var subLabel = esRezagado ? '⟵ Ing. ' + safe(d.mes) : 'Ing. ' + safe(d.mes);

                return '<div>' +
                  '<div' + clickAttr + '>' +
                    '<div style="font-size:22px;font-weight:800;color:' + color + ';font-family:\'DM Mono\',monospace;line-height:1;">' + d.total + '</div>' +
                    '<div style="font-size:10px;font-weight:600;color:var(--text-muted);margin-top:4px;">' + subLabel + '</div>' +
                    '<div style="display:flex;justify-content:center;gap:8px;margin-top:6px;">' +
                      '<span style="font-size:10px;color:#3b82f6;font-weight:700;">EA: ' + (d.eden||0) + '</span>' +
                      '<span style="font-size:10px;color:#ef4444;font-weight:700;">Cli: ' + (d.cliente||0) + '</span>' +
                    '</div>' +
                  '</div>' +
                  '<div id="' + cardId + '" style="display:none;margin-top:6px;"></div>' +
                '</div>';
              }).join('');

              return '<div style="background:#fff;border-radius:var(--radius-md);border:1px solid var(--border-soft);padding:16px 20px;">' +
                '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">' +
                  '<span style="font-size:14px;font-weight:800;color:var(--text-main);">' + safe(item.mes) + '</span>' +
                  '<span style="font-size:28px;font-weight:800;color:' + colorTotal + ';font-family:\'DM Mono\',monospace;">' + item.total + '</span>' +
                '</div>' +
                '<div style="display:flex;gap:12px;margin-bottom:10px;">' +
                  '<span style="font-size:11px;color:#3b82f6;font-weight:700;">Eden Agua: ' + (item.eden||0) + '</span>' +
                  '<span style="font-size:11px;color:#ef4444;font-weight:700;">Cliente: ' + (item.cliente||0) + '</span>' +
                '</div>' +
                '<div style="font-size:9px;font-weight:700;color:var(--text-faint);text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px;">MES DE INGRESO</div>' +
                '<div style="display:flex;flex-wrap:wrap;gap:10px;">' + desgloseHtml + '</div>' +
              '</div>';
            }).join('') +
          '</div>';

          container.innerHTML = resumenHtml + panelHtml;
        })
        .withFailureHandler(function() {})
        .getEquiposReparadosPorMes(rango);
    })();
  }

function mostrarExitoDashboard(callback) {
  // Quitar loader global
  var loaderGlobal = document.getElementById('dashboard-loader-global');
  if (loaderGlobal) loaderGlobal.remove();

  // Mostrar paneles — las cards NO llevan loader, se renderizan directo
  var summaryCards = document.getElementById('summaryCards');
  if (summaryCards) summaryCards.style.display = '';

  // Tiempos de reparación con loader
  var tiemposPanel = document.getElementById('tiemposReparacionPanel');
  if (tiemposPanel) tiemposPanel.style.display = '';
  var tiemposBody = document.getElementById('tiemposReparacionBody');
  if (tiemposBody) tiemposBody.innerHTML = htmlDashboardCargador;

  // Equipos por mes con loader
  var reparadosPanel = document.getElementById('reparadosMesPanel');
  if (reparadosPanel) reparadosPanel.style.display = '';

  // Gráficos visibles con loaders
  var chartsSection = document.getElementById('chartsSection');
  if (chartsSection) chartsSection.style.display = '';

  var chartDonaWrap = document.getElementById('chartDonaWrap');
  if (chartDonaWrap) chartDonaWrap.innerHTML = htmlDashboardCargador;

var ceWrap = document.getElementById('chartClienteVsEdenWrap');
if (ceWrap) ceWrap.innerHTML = htmlDashboardCargador;

  var modelList = document.getElementById('modelList');
  if (modelList) modelList.innerHTML = htmlDashboardCargador;

  var chartFallasContainer = document.getElementById('chartFallasContainer');
  if (chartFallasContainer) chartFallasContainer.innerHTML = htmlDashboardCargador;
    var motivoList = document.getElementById('motivoList');
    if (motivoList) motivoList.innerHTML = htmlDashboardCargador;
  callback();
}

  function renderDashActiveFilters() {
    var el = document.getElementById('dashActiveFilters');
    if (!el) return;
    var chips = [];
    if (dashRangoFechasActual.desde) chips.push('<span class="filter-chip">📅 Desde: ' + safe(dashRangoFechasActual.desde) + '</span>');
    if (dashRangoFechasActual.hasta) chips.push('<span class="filter-chip">📅 Hasta: ' + safe(dashRangoFechasActual.hasta) + '</span>');
    el.innerHTML = chips.join('');
  }

  // =========================================
  // ACTIVIDAD
  // =========================================
  function loadActividad() {
    var ings = (_actividadData && _actividadData.ultimosIngresos || []).slice(0, 15);
    var sals = (_actividadData && _actividadData.ultimasSalidas  || []).slice(0, 15);

    // Últimos ingresos
    var actIngBody = document.getElementById('actIngresosBody');
    if (actIngBody) {
      actIngBody.innerHTML = ings.length
        ? ings.map(function(r) {
            return '<tr><td>' + safe(r['Serie del Producto']||'-') + '</td><td>' + safe(r['Cliente o Eden Agua']||'-') + '</td><td>' + safe(r['Modelo']||'-') + '</td><td>' + safe(r['Detalle del Motivo a Taller']||'-') + '</td></tr>';
          }).join('')
        : '<tr><td colspan="4">Sin registros</td></tr>';
    }

    // Actividad reciente
    var feedHtml = '';
    ings.forEach(function(r) {
      feedHtml += '<div class="activity-item"><div class="act-icon ing">↓</div><div class="act-body"><div class="act-text"><strong>Ingreso</strong> — ' + safe(r['Serie del Producto']||'-') + ' · ' + safe(r['Modelo']||'-') + '</div><div class="act-time">' + safe(r['Cliente o Eden Agua']||'-') + '</div></div></div>';
    });
    sals.forEach(function(r) {
      feedHtml += '<div class="activity-item"><div class="act-icon sal">↑</div><div class="act-body"><div class="act-text"><strong>Salida</strong> — ' + safe(r['Serie del Producto']||'-') + ' · Ficha ' + safe(r['Numero de Ficha de Salida']||'-') + '</div><div class="act-time">' + safe(r['Técnico responsable de reparación']||'-') + '</div></div></div>';
    });
    var actFeed = document.getElementById('actFeed');
    if (actFeed) actFeed.innerHTML = feedHtml || '<div class="empty-state">Sin actividad reciente</div>';

    // Últimas salidas
    var actSalBody = document.getElementById('actSalidasBody');
    if (actSalBody) {
      actSalBody.innerHTML = sals.length
        ? sals.map(function(r) {
            return '<tr><td>' + safe(r['Serie del Producto']||'-') + '</td><td>' + safe(r['Técnico responsable de reparación']||'-') + '</td><td>' + safe(r['Numero de Ficha de Salida']||'-') + '</td><td>' + safe(r['Repuestos Utilizados']||'-') + '</td></tr>';
          }).join('')
        : '<tr><td colspan="4">Sin registros</td></tr>';
    }
  }

  // =========================================
  // GRÁFICOS — Chart.js
  // =========================================
  function loadCharts() {
    if (typeof Chart === 'undefined') {
      var script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js';
      script.onload = function() { fetchAndRenderCharts(); };
      document.head.appendChild(script);
    } else {
      fetchAndRenderCharts();
    }
  }

  function fetchAndRenderCharts() {
    var rango = (dashRangoFechasActual && dashRangoFechasActual.desdeISO)
      ? { desdeISO: dashRangoFechasActual.desdeISO, hastaISO: dashRangoFechasActual.hastaISO }
      : null;
    google.script.run
      .withSuccessHandler(renderAllCharts)
      .withFailureHandler(function(e) { console.error('Error gráficos:', e); })
      .getChartsData(rango);
  }

  function renderAllCharts(data) {
    renderDona(data.donaData || []);
    renderModelos(data.modelosData || []);
    renderFallas(data.fallasData || []);
      renderMotivos(data.motivosData || []);
        renderClienteVsEden(data.clienteEdenData || []);   // ← NUEVA
                cargarIngSalData();
  }

  function renderDona(items) {
    var wrap  = document.getElementById('chartDonaWrap');
    if (wrap) wrap.innerHTML = '<canvas id="chartDona"></canvas>';
    var canvas = document.getElementById('chartDona');
    var empty  = document.getElementById('chartDonaEmpty');
    var totalLabel = document.getElementById('chartDonaTotal');
    if (!canvas) return;
    if (_chartDona) { _chartDona.destroy(); _chartDona = null; }
    if (!items.length) {
      if (wrap)  wrap.style.display  = 'none';
      if (empty) empty.style.display = 'block';
      if (totalLabel) totalLabel.style.display = 'none';
      return;
    }
    if (wrap)  wrap.style.display  = 'block';
    if (empty) empty.style.display = 'none';
    var total  = items.reduce(function(s, i) { return s + i.total; }, 0);
    var colors = items.map(function(_, idx) { return CHART_COLORS[idx % CHART_COLORS.length]; });
    if (totalLabel) {
      totalLabel.style.display = 'block';
      totalLabel.innerHTML = '<span style="font-size:28px;font-weight:800;font-family:\'DM Mono\',monospace;color:#0f172a;line-height:1;">' + total + '</span><span style="font-size:11px;color:#64748b;display:block;margin-top:2px;">equipos total</span>';
    }
    var doughnutLabelPlugin = {
      id: 'doughnutLabels',
      afterDraw: function(chart) {
        var ctx = chart.ctx, data = chart.data;
        var meta = chart.getDatasetMeta(0);
        var totalVal = data.datasets[0].data.reduce(function(a, b) { return a + b; }, 0);
        meta.data.forEach(function(arc, i) {
          var val = data.datasets[0].data[i];
          var pct = Math.round(val * 100 / totalVal);
          if (pct < 4) return;
          var midAngle = (arc.startAngle + arc.endAngle) / 2;
          var r = (arc.innerRadius + arc.outerRadius) / 2;
          var x = arc.x + Math.cos(midAngle) * r;
          var y = arc.y + Math.sin(midAngle) * r;
          ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffffff';
          ctx.font = '700 12px DM Sans, sans-serif';
          ctx.shadowColor = 'rgba(0,0,0,0.18)';
          ctx.shadowBlur = 2;
          ctx.fillText(pct + '%', x, y); ctx.restore();
        });
      }
    };
    _chartDona = new Chart(canvas, {
      type: 'doughnut',
      data: { labels: items.map(function(i) { return i.nombre; }), datasets: [{ data: items.map(function(i) { return i.total; }), backgroundColor: colors, borderColor: '#ffffff', borderWidth: 4, borderRadius: 6, hoverOffset: 6 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '62%', plugins: { legend: { position: 'right', labels: { font: { family: 'DM Sans, sans-serif', size: 12 }, color: '#6b7280', padding: 16, usePointStyle: true, boxWidth: 10, boxHeight: 10, generateLabels: function(chart) { var ds = chart.data.datasets[0]; var t = ds.data.reduce(function(a,b){return a+b;},0); return chart.data.labels.map(function(label,i){ return { text: label + ': ' + ds.data[i], fillStyle: ds.backgroundColor[i], strokeStyle: ds.backgroundColor[i], hidden: !chart.getDataVisibility(i), index: i, pointStyle: 'circle' }; }); } } }, tooltip: { backgroundColor: '#0f172a', padding: 12, cornerRadius: 10, callbacks: { label: function(ctx) { var pct = Math.round(ctx.parsed * 100 / total); return '  ' + ctx.label + ': ' + ctx.parsed + ' equipos (' + pct + '%)'; } } } } },
      plugins: [doughnutLabelPlugin]
    });
  }

function renderModelos(items) {
  var container = document.getElementById('modelList');
  if (!container) return;
  if (!items || !items.length) {
    container.innerHTML = '<div class="empty-state">Sin datos</div>';
    return;
  }

  var colores = [
    '#8b5cf6','#10b981','#3b82f6','#7c3aed','#f97316',
    '#eab308','#ec4899','#0ea5e9','#22c55e','#ef4444',
    '#06b6d4','#a855f7','#84cc16','#14b8a6','#f43f5e',
    '#6366f1','#9ca3af','#0d9488','#b91c1c','#d946ef'
  ];

  var sorted = items.slice().sort(function(a, b) { return b.total - a.total; });
  var maxVal = sorted[0].total || 1;
  var mitad = Math.ceil(sorted.length / 2);
  var col1 = sorted.slice(0, mitad);
  var col2 = sorted.slice(mitad);
  var idxGlobal = { i: 0 };

  function renderFila(item) {
    var color = colores[idxGlobal.i % colores.length];
    idxGlobal.i++;
    var pct = Math.round(item.total * 100 / maxVal);
    return '<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:0.5px solid var(--border-soft);">' +
      '<span style="font-size:12px;color:var(--text-main);width:92px;flex-shrink:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="' + safe(item.nombre) + '">' + safe(item.nombre) + '</span>' +
      '<div style="flex:1;height:6px;background:#f1f1ef;border-radius:999px;overflow:hidden;">' +
        '<div style="width:' + pct + '%;height:6px;border-radius:999px;background:' + color + ';"></div>' +
      '</div>' +
      '<span style="font-size:12px;font-weight:700;color:var(--text-main);width:28px;text-align:right;flex-shrink:0;font-family:\'DM Mono\',monospace;">' + item.total + '</span>' +
    '</div>';
  }

  var totalModelos = sorted.reduce(function(s, i) { return s + i.total; }, 0);
  container.style.display = 'block';
  container.innerHTML =
    '<div style="margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid var(--border-soft);display:flex;align-items:baseline;gap:8px;">' +
      '<span style="font-size:28px;font-weight:800;color:var(--text-main);font-family:\'DM Mono\',monospace;line-height:1;">' + totalModelos + '</span>' +
      '<span style="font-size:11px;color:var(--text-muted);font-weight:600;">equipos total</span>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 20px;">' +
      '<div>' + col1.map(renderFila).join('') + '</div>' +
      '<div>' + col2.map(renderFila).join('') + '</div>' +
    '</div>';
}
function renderFallas(items) {
  var container = document.getElementById('chartFallasContainer');
  var empty = document.getElementById('chartFallasEmpty');
  var scrollDiv = document.getElementById('chartFallasScroll');

  if (_chartFallas) { _chartFallas.destroy(); _chartFallas = null; }

  if (!items || !items.length) {
    if (scrollDiv) scrollDiv.style.display = 'none';
    if (empty) empty.style.display = 'block';
    return;
  }
  if (scrollDiv) { scrollDiv.style.display = 'block'; scrollDiv.style.height = 'auto'; }
  if (empty) empty.style.display = 'none';

  var sorted = items.slice().sort(function(a, b) { return b.total - a.total; });
  var maxVal = sorted[0].total || 1;
  var mitad = Math.ceil(sorted.length / 2);
  var col1 = sorted.slice(0, mitad);
  var col2 = sorted.slice(mitad);

  var idxCounter = { i: 0 };

  function renderFila(item) {
    var idx = idxCounter.i++;
    var pct = Math.round(item.total * 100 / maxVal);
    return '<div class="falla-row">' +
      '<div onclick="toggleFallaDetalle(' + idx + ',\'' + escapeQuotes(item.nombre) + '\')" ' +
           'style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:0.5px solid var(--border-soft);cursor:pointer;user-select:none;">' +
        '<svg id="fallaChevron_' + idx + '" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="var(--text-muted)" stroke-width="2.5" stroke-linecap="round" style="flex-shrink:0;transition:transform .18s;"><polyline points="9 18 15 12 9 6"/></svg>' +
        '<span style="font-size:12px;color:var(--text-main);flex:1;min-width:0;line-height:1.4;">' + safe(item.nombre) + '</span>' +
        '<div style="width:220px;flex-shrink:0;height:6px;background:#f1f1ef;border-radius:999px;overflow:hidden;">' +
          '<div style="width:' + pct + '%;height:6px;border-radius:999px;background:var(--text-main);opacity:.88;"></div>' +
        '</div>' +
        '<span style="font-size:12px;font-weight:700;color:var(--text-main);width:28px;text-align:right;flex-shrink:0;font-family:\'DM Mono\',monospace;">' + item.total + '</span>' +
      '</div>' +
      '<div id="fallaDetalle_' + idx + '" style="display:none;padding:2px 0 10px 22px;"></div>' +
    '</div>';
  }

  if (container) {
    var totalFallas = sorted.reduce(function(s, i) { return s + i.total; }, 0);
    container.style.width = '100%';
    container.style.height = 'auto';
    container.style.display = 'block';
    container.innerHTML =
      '<div style="margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid var(--border-soft);display:flex;align-items:baseline;gap:8px;">' +
        '<span style="font-size:28px;font-weight:800;color:var(--text-main);font-family:\'DM Mono\',monospace;line-height:1;">' + totalFallas + '</span>' +
        '<span style="font-size:11px;color:var(--text-muted);font-weight:600;">fallas en total</span>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 20px;">' +
        '<div>' + col1.map(renderFila).join('') + '</div>' +
        '<div>' + col2.map(renderFila).join('') + '</div>' +
      '</div>';
  }
}
var _fallaCache = {};

function toggleFallaDetalle(idx, fallaNombre) {
  var detalle = document.getElementById('fallaDetalle_' + idx);
  var chevron = document.getElementById('fallaChevron_' + idx);
  if (!detalle) return;

  if (detalle.style.display !== 'none') {
    detalle.style.display = 'none';
    if (chevron) chevron.style.transform = 'rotate(0deg)';
    return;
  }

  detalle.style.display = 'block';
  if (chevron) chevron.style.transform = 'rotate(90deg)';
  detalle.innerHTML = '<div style="font-size:11px;color:var(--text-muted);padding:6px 0;">Cargando equipos...</div>';

  var rango = (dashRangoFechasActual && dashRangoFechasActual.desdeISO)
    ? { desdeISO: dashRangoFechasActual.desdeISO, hastaISO: dashRangoFechasActual.hastaISO }
    : null;

  var cacheKey = fallaNombre + '|' + (rango ? rango.desdeISO + '_' + rango.hastaISO : 'all');
  if (_fallaCache[cacheKey]) {
    renderFallaDetalle(detalle, _fallaCache[cacheKey]);
    return;
  }

  google.script.run
    .withSuccessHandler(function(equipos) {
      _fallaCache[cacheKey] = equipos || [];
      renderFallaDetalle(detalle, equipos || []);
    })
    .withFailureHandler(function(e) {
      detalle.innerHTML = '<div style="font-size:11px;color:var(--red-main);padding:6px 0;">Error: ' + safe(e.message || e) + '</div>';
    })
    .getEquiposPorFalla(fallaNombre, rango);
}

function renderFallaDetalle(container, equipos) {
  if (!equipos.length) {
    container.innerHTML = '<div style="font-size:11px;color:var(--text-faint);padding:6px 0;">Sin equipos para esta falla en el período</div>';
    return;
  }
  container.innerHTML = equipos.map(function(e) {
    return '<div style="display:flex;align-items:center;gap:8px;padding:5px 8px;background:var(--bg-soft);border-radius:6px;margin-bottom:4px;">' +
      '<span style="font-family:\'DM Mono\',monospace;font-size:10px;font-weight:600;color:var(--text-main);flex-shrink:0;">' + safe(e.serie) + '</span>' +
      '<span style="font-size:10px;color:var(--text-muted);flex-shrink:0;">' + safe(e.modelo) + '</span>' +
      '<span style="font-size:10px;color:var(--text-muted);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="' + safe(e.cliente) + '">' + safe(e.cliente) + '</span>' +
           '' +
    '</div>';
  }).join('');
}
function renderMotivos(data) {
  var container = document.getElementById('motivoList');
  var empty = document.getElementById('chartMotivosEmpty');
  if (!container) return;

  var mesActual = (data && data.mesActual) || [];
  var rezagados = (data && data.rezagados) || [];

  if (!mesActual.length && !rezagados.length) {
    container.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';

  var maxVal = 1;
  mesActual.concat(rezagados).forEach(function(i) { if (i.total > maxVal) maxVal = i.total; });

  function renderFila(item, color) {
    var pct = Math.round(item.total * 100 / maxVal);
    return '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:0.5px solid var(--border-soft);">' +
      '<span style="font-size:11px;color:var(--text-main);flex:1;min-width:0;line-height:1.35;">' + safe(item.nombre) + '</span>' +
      '<div style="width:90px;flex-shrink:0;height:5px;background:#f1f1ef;border-radius:999px;overflow:hidden;">' +
        '<div style="width:' + pct + '%;height:5px;border-radius:999px;background:' + color + ';opacity:.88;"></div>' +
      '</div>' +
      '<span style="font-size:11px;font-weight:700;color:var(--text-main);width:26px;text-align:right;flex-shrink:0;font-family:\'DM Mono\',monospace;">' + item.total + '</span>' +
    '</div>';
  }

  var colTotal = (data.totalMesActual || 0);
  var rezTotal = (data.totalRezagados || 0);

  container.style.display = 'grid';
  container.style.gridTemplateColumns = '1fr 1fr';
  container.style.gap = '0 20px';
  container.innerHTML =
    '<div style="border-right:1px solid #e2e8f0;padding-right:18px;">' +
      '<div style="font-size:11px;font-weight:800;color:#1e40af;margin-bottom:8px;">Ingresados en el mes: ' + colTotal + '</div>' +
      mesActual.map(function(i) { return renderFila(i, '#1e40af'); }).join('') +
    '</div>' +
    '<div style="padding-left:4px;">' +
      '<div style="font-size:11px;font-weight:800;color:#92400e;margin-bottom:8px;">Rezagados (salieron este mes): ' + rezTotal + '</div>' +
      (rezagados.length ? rezagados.map(function(i) { return renderFila(i, '#d97706'); }).join('') : '<div style="font-size:11px;color:var(--text-faint);padding:6px 0;">Sin rezagados</div>') +
    '</div>';
}

function renderClienteVsEden(items) {
  var wrap    = document.getElementById('chartClienteVsEdenWrap');
  var emptyEl = document.getElementById('chartClienteVsEdenEmpty');

  if (_chartClienteVsEden) { _chartClienteVsEden.destroy(); _chartClienteVsEden = null; }
  if (!wrap) return;
  if (!items || !items.length) { wrap.innerHTML = ''; if (emptyEl) emptyEl.style.display = 'block'; return; }
  if (emptyEl) emptyEl.style.display = 'none';

    wrap.innerHTML = '<div style="position:relative;height:300px;"><canvas id="chartClienteVsEden"></canvas></div><div id="ceTabla" style="margin-top:16px;"></div>';
  var canvas = document.getElementById('chartClienteVsEden');
  if (!canvas) return;

  var labels  = items.map(function(i) { return i.mes; });
  var cliMes  = items.map(function(i) { return i.cliMes; });
  var cliRez  = items.map(function(i) { return i.cliRez; });
  var edenMes = items.map(function(i) { return i.edenMes; });
  var edenRez = items.map(function(i) { return i.edenRez; });
  var bajaMes = items.map(function(i) { return i.bajaMes; });
  var bajaRez = items.map(function(i) { return i.bajaRez; });

  var stacks = [[0,1],[2,3],[4,5]];
  var clarosTxt = { '#f1948a':'#7b241c', '#a9cdf2':'#042c53', '#cfcfca':'#333333' };

  var totalPlugin = {
    id: 'ceTot',
    afterDatasetsDraw: function(chart) {
      var ctx = chart.ctx;
      var n = chart.data.labels.length;
      for (var i = 0; i < n; i++) {
        stacks.forEach(function(par) {
          var topY = Infinity, x = null, suma = 0;
          par.forEach(function(di) {
            var ds = chart.data.datasets[di];
            var el = chart.getDatasetMeta(di).data[i];
            if (el && ds.data[i] > 0) { topY = Math.min(topY, el.y); x = el.x; suma += ds.data[i]; }
          });
          if (x === null) return;
          ctx.save();
          ctx.font = '800 12px DM Sans, sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
          ctx.fillStyle = '#0f172a';
          ctx.fillText(suma, x, topY - 5);
          ctx.restore();
        });
      }
    }
  };

  var segPlugin = {
    id: 'ceSeg',
    afterDatasetsDraw: function(chart) {
      var ctx = chart.ctx;
      chart.data.datasets.forEach(function(ds, di) {
        chart.getDatasetMeta(di).data.forEach(function(el, idx) {
          var v = ds.data[idx];
          if (!v) return;
          var alto = el.base - el.y;
          var cx = el.x, cy = (el.y + el.base) / 2;
          ctx.save();
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          if (alto < 15) {
            ctx.font = '800 10px DM Sans, sans-serif';
            var t = String(v), w = ctx.measureText(t).width + 7;
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = ds.backgroundColor;
            ctx.lineWidth = 1.5;
            if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(cx - w/2, cy - 7, w, 14, 7); ctx.fill(); ctx.stroke(); }
            else { ctx.fillRect(cx - w/2, cy - 7, w, 14); ctx.strokeRect(cx - w/2, cy - 7, w, 14); }
            ctx.fillStyle = clarosTxt[ds.backgroundColor] || ds.backgroundColor;
            ctx.fillText(t, cx, cy + 0.5);
          } else {
            ctx.font = '700 11px DM Sans, sans-serif';
            ctx.fillStyle = clarosTxt[ds.backgroundColor] ? clarosTxt[ds.backgroundColor] : '#ffffff';
            ctx.fillText(v, cx, cy);
          }
          ctx.restore();
        });
      });
    }
  };

  _chartClienteVsEden = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        { label: 'Cliente · del mes',  data: cliMes,  backgroundColor: '#c0392b', borderRadius: 3, borderSkipped: false, stack: 'cli' },
        { label: 'Cliente · rezagado', data: cliRez,  backgroundColor: '#f1948a', borderRadius: 3, borderSkipped: false, stack: 'cli' },
        { label: 'Eden Agua · del mes',  data: edenMes, backgroundColor: '#2a78d6', borderRadius: 3, borderSkipped: false, stack: 'eden' },
        { label: 'Eden Agua · rezagado', data: edenRez, backgroundColor: '#a9cdf2', borderRadius: 3, borderSkipped: false, stack: 'eden' },
        { label: 'De Baja · del mes',  data: bajaMes, backgroundColor: '#7a7a74', borderRadius: 3, borderSkipped: false, stack: 'baja' },
        { label: 'De Baja · rezagado', data: bajaRez, backgroundColor: '#cfcfca', borderRadius: 3, borderSkipped: false, stack: 'baja' }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f172a', padding: 12, cornerRadius: 10,
          callbacks: { label: function(ctx) { return ctx.parsed.y ? ('  ' + ctx.dataset.label + ': ' + ctx.parsed.y) : null; } }
        }
      },
      scales: {
        x: { stacked: true, grid: { display: false }, border: { display: false }, ticks: { font: { family: 'DM Sans', size: 11, weight: '600' }, color: '#334155', padding: 6, autoSkip: false } },
        y: { stacked: true, beginAtZero: true, grid: { color: '#f0f0ee', drawBorder: false }, border: { display: false }, ticks: { font: { family: 'DM Mono', size: 10 }, color: '#6b7280', padding: 8 } }
      }
    },
    plugins: [totalPlugin, segPlugin]
  });


  // ── Tabla resumen debajo ──
  var tabla = document.getElementById('ceTabla');
  if (tabla) {
    var cli  = items.map(function(i) { return i.cliMes + i.cliRez; });
    var eden = items.map(function(i) { return i.edenMes + i.edenRez; });
    var baja = items.map(function(i) { return i.bajaMes + i.bajaRez; });
    var tot  = items.map(function(i, x) { return cli[x] + eden[x] + baja[x]; });

    var header = '<tr><td style="padding:6px 10px;border-bottom:2px solid #e2e8f0;"></td>' +
      labels.map(function(l) { return '<td style="padding:6px 10px;text-align:center;font-size:11px;font-weight:700;color:#334155;border-bottom:2px solid #e2e8f0;">' + l + '</td>'; }).join('') + '</tr>';

    function filaCE(nombre, data, color) {
      return '<tr>' +
        '<td style="padding:5px 10px;font-size:11px;font-weight:700;color:' + color + ';white-space:nowrap;"><span style="display:inline-block;width:9px;height:9px;border-radius:2px;background:' + color + ';margin-right:6px;vertical-align:middle;"></span>' + nombre + '</td>' +
        data.map(function(v) { return '<td style="padding:5px 10px;text-align:center;font-size:12px;font-weight:700;color:' + color + ';font-family:\'DM Mono\',monospace;">' + v + '</td>'; }).join('') +
      '</tr>';
    }

    tabla.innerHTML =
      '<table style="width:100%;border-collapse:collapse;">' +
        header +
        filaCE('Clientes', cli, '#c0392b') +
        filaCE('Eden Agua', eden, '#2a78d6') +
        filaCE('De Baja', baja, '#7a7a74') +
        '<tr style="border-top:2px solid #e2e8f0;">' +
          '<td style="padding:6px 10px;font-size:11px;font-weight:800;color:#0f172a;">Total</td>' +
          tot.map(function(v) { return '<td style="padding:6px 10px;text-align:center;font-size:12px;font-weight:800;color:#0f172a;font-family:\'DM Mono\',monospace;">' + v + '</td>'; }).join('') +
        '</tr>' +
      '</table>';
  }}
function cargarIngSalData() {
  var rango = (dashRangoFechasActual && dashRangoFechasActual.desdeISO)
    ? { desdeISO: dashRangoFechasActual.desdeISO, hastaISO: dashRangoFechasActual.hastaISO }
    : null;
  google.script.run
    .withSuccessHandler(function(data) {
      renderIngSalDetalle(data || []);
      renderIngSalTotal(data || []);
    })
    .withFailureHandler(function(e) { console.error('IngSal error:', e); })
    .getIngresosVsSalidas(rango);
}

function renderIngSalDetalle(items) {
  var wrap = document.getElementById('chartIngSalDetalleWrap');
  var emptyEl = document.getElementById('chartIngSalDetalleEmpty');
  if (_chartIngSalDetalle) { _chartIngSalDetalle.destroy(); _chartIngSalDetalle = null; }
  if (!wrap) return;
  if (!items || !items.length) { wrap.innerHTML = ''; if (emptyEl) emptyEl.style.display = 'block'; return; }
  if (emptyEl) emptyEl.style.display = 'none';

  wrap.innerHTML = '<canvas id="chartIngSalDetalle"></canvas>';
  var canvas = document.getElementById('chartIngSalDetalle');
  if (!canvas) return;

  // Dos posiciones por mes: [Ingresos, Salidas]
  var labels = [];
  items.forEach(function(i) { labels.push([i.mes, 'Ingresos']); labels.push([i.mes, 'Salidas']); });

  // Cada dataset se llena en la posición par (ingreso) o impar (salida) según corresponda
  var invMes = [], invRez = [], cliMes = [], cliRez = [], totales = [];
  items.forEach(function(i) {
    // Posición Ingresos: inventario y cliente van en los datasets "del mes"
    invMes.push(i.ingInv);  invRez.push(0);          cliMes.push(i.ingCli);  cliRez.push(0);
    totales.push(i.ingInv + i.ingCli);
    // Posición Salidas: 4 segmentos
    invMes.push(i.salInvMes); invRez.push(i.salInvRez); cliMes.push(i.salCliMes); cliRez.push(i.salCliRez);
    totales.push(i.salInvMes + i.salInvRez + i.salCliMes + i.salCliRez);
  });

  var totalPlugin = {
    id: 'isdTot',
    afterDatasetsDraw: function(chart) {
      var ctx = chart.ctx;
      var n = chart.data.labels.length;
      for (var i = 0; i < n; i++) {
        var topY = Infinity, x = null;
        chart.data.datasets.forEach(function(ds, di) {
          var el = chart.getDatasetMeta(di).data[i];
          if (el && ds.data[i] > 0) { topY = Math.min(topY, el.y); x = el.x; }
        });
        if (x === null) continue;
        ctx.save();
        ctx.font = '800 14px DM Sans, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillStyle = '#0f172a';
        ctx.fillText(totales[i], x, topY - 6);
        ctx.restore();
      }
    }
  };

  var segPlugin = {
    id: 'isdSeg',
    afterDatasetsDraw: function(chart) {
      var ctx = chart.ctx;
      chart.data.datasets.forEach(function(ds, di) {
        var esClaro = (ds.backgroundColor === '#85b7eb' || ds.backgroundColor === '#f1948a');
        chart.getDatasetMeta(di).data.forEach(function(el, idx) {
          var v = ds.data[idx];
          if (!v) return;
          var alto = el.base - el.y;
          var cx = el.x, cy = (el.y + el.base) / 2;
          ctx.save();
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          if (alto < 15) {
            // Segmento delgado: cápsula blanca con borde del color y número del color
            ctx.font = '800 11px DM Sans, sans-serif';
            var txt = String(v);
            var w = ctx.measureText(txt).width + 8;
            var h = 14;
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = ds.backgroundColor;
            ctx.lineWidth = 1.5;
            if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(cx - w/2, cy - h/2, w, h, 7); ctx.fill(); ctx.stroke(); }
            else { ctx.fillRect(cx - w/2, cy - h/2, w, h); ctx.strokeRect(cx - w/2, cy - h/2, w, h); }
            ctx.fillStyle = (ds.backgroundColor === '#85b7eb') ? '#042c53' : (ds.backgroundColor === '#f1948a' ? '#7b241c' : ds.backgroundColor);
            ctx.fillText(txt, cx, cy + 0.5);
          } else {
            // Segmento normal: número centrado
            ctx.font = '700 12px DM Sans, sans-serif';
            ctx.fillStyle = esClaro ? (ds.backgroundColor === '#85b7eb' ? '#042c53' : '#7b241c') : '#ffffff';
            ctx.fillText(v, cx, cy);
          }
          ctx.restore();
        });
      });
    }
  };

  _chartIngSalDetalle = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        { label: 'Inventario · del mes',  data: invMes, backgroundColor: '#185fa5', borderRadius: 3, borderSkipped: false, stack: 'a' },
        { label: 'Inventario · rezagado', data: invRez, backgroundColor: '#85b7eb', borderRadius: 3, borderSkipped: false, stack: 'a' },
        { label: 'Cliente · del mes',     data: cliMes, backgroundColor: '#c0392b', borderRadius: 3, borderSkipped: false, stack: 'a' },
        { label: 'Cliente · rezagado',    data: cliRez, backgroundColor: '#f1948a', borderRadius: 3, borderSkipped: false, stack: 'a' }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f172a', padding: 12, cornerRadius: 10,
          callbacks: {
            title: function(a) { return a[0].label.split(',').join(' · '); },
            label: function(ctx) { return ctx.parsed.y ? ('  ' + ctx.dataset.label + ': ' + ctx.parsed.y) : null; },
            afterBody: function(a) { return '  Total: ' + totales[a[0].dataIndex]; }
          }
        }
      },
      scales: {
        x: { stacked: true, grid: { display: false }, border: { display: false }, ticks: { font: { family: 'DM Sans', size: 11, weight: '600' }, color: '#334155', padding: 6, autoSkip: false } },
        y: { stacked: true, beginAtZero: true, grid: { color: '#f0f0ee', drawBorder: false }, border: { display: false }, ticks: { font: { family: 'DM Mono', size: 10 }, color: '#6b7280', padding: 8 } }
      }
    },
    plugins: [totalPlugin, segPlugin]
  });
}

function renderIngSalTotal(items) {
  var wrap = document.getElementById('chartIngSalTotalWrap');
  var emptyEl = document.getElementById('chartIngSalTotalEmpty');
  if (_chartIngSalTotal) { _chartIngSalTotal.destroy(); _chartIngSalTotal = null; }
  if (!wrap) return;
  if (!items || !items.length) { wrap.innerHTML = ''; if (emptyEl) emptyEl.style.display = 'block'; return; }
  if (emptyEl) emptyEl.style.display = 'none';

  wrap.innerHTML = '<canvas id="chartIngSalTotal"></canvas>';
  var canvas = document.getElementById('chartIngSalTotal');
  if (!canvas) return;

  var labels   = items.map(function(i) { return i.mes; });
  var totIng   = items.map(function(i) { return i.totalIng; });
  var totSal   = items.map(function(i) { return i.totalSal; });

  var dlPlugin = {
    id: 'istLabels',
    afterDatasetsDraw: function(chart) {
      var ctx = chart.ctx;
      chart.data.datasets.forEach(function(ds, di) {
        var meta = chart.getDatasetMeta(di);
        meta.data.forEach(function(el, idx) {
          var val = ds.data[idx];
          if (!val) return;
          ctx.save();
          ctx.font = '700 13px DM Sans, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillStyle = '#0f172a';
          ctx.fillText(val, el.x, el.y - 6);
          ctx.restore();
        });
      });
    }
  };

  _chartIngSalTotal = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        { label: 'Total Ingresos', data: totIng, backgroundColor: '#1e40af', borderRadius: 4, borderSkipped: false },
        { label: 'Total Salidas',  data: totSal, backgroundColor: '#dc2626', borderRadius: 4, borderSkipped: false }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: { backgroundColor: '#0f172a', padding: 12, cornerRadius: 10,
          callbacks: { label: function(ctx) { return '  ' + ctx.dataset.label + ': ' + ctx.parsed.y + ' equipos'; } }
        }
      },
      scales: {
        x: { grid: { display: false }, border: { display: false }, ticks: { font: { family: 'DM Sans', size: 12, weight: '600' }, color: '#334155', padding: 6 } },
        y: { beginAtZero: true, grid: { color: '#f0f0ee', drawBorder: false }, border: { display: false }, ticks: { font: { family: 'DM Mono', size: 10 }, color: '#6b7280', padding: 8 } }
      }
    },
    plugins: [dlPlugin]
  });
}



  // =========================================
  // EQUIPOS
  // =========================================
  function resetAndLoadEquipos() { paginaActual = 1; loadEquipos(); }

  function loadEquipos() {
    document.getElementById('equiposBody').innerHTML = htmlCargador;
    google.script.run.withSuccessHandler(renderEquiposResponse).withFailureHandler(showError)
      .getEquipos('', filtrosActuales, rangoFechasActual, paginaActual);
    renderActiveFilters();
  }

  function buscarEquiposDebounced() { clearTimeout(searchDebounceTimer); searchDebounceTimer = setTimeout(buscarEquipos, 400); }

  function buscarEquipos() {
    clearTimeout(searchDebounceTimer);
    var value = document.getElementById('searchInput').value || '';
    var fichaInput = document.getElementById('searchFicha');
    if (fichaInput) filtrosActuales.ficha = fichaInput.value || '';
    document.getElementById('equiposBody').innerHTML = htmlCargador;
    google.script.run.withSuccessHandler(renderEquiposResponse).withFailureHandler(showError)
      .getEquipos(value, filtrosActuales, rangoFechasActual, paginaActual);
    renderActiveFilters();
  }

  function renderEquiposResponse(response) {
    var rows = response.rows || [], pagination = response.pagination || {};
    paginaActual = pagination.page || 1; totalPaginas = pagination.totalPages || 1;
    mostrarExitoCargador(function() { renderEquipos(rows); renderPagination(pagination); });
  }

  function mostrarExitoCargador(callback) {
    var c = document.getElementById('equipos-loader-container');
    if (c) {
      if (c.querySelector('.progress-svg')) c.querySelector('.progress-svg').classList.add('success');
      if (c.querySelector('.circle-progress')) c.querySelector('.circle-progress').classList.add('success');
      var t = c.querySelector('.status-text-loader'); if (t) { t.classList.add('success'); t.innerText='¡Búsqueda completada!'; }
      var ic = c.querySelector('.custom-icon'); if (ic) { ic.style.stroke='#22c55e'; ic.style.transform='scale(1.2)'; ic.innerHTML='<polyline points="20 6 9 17 4 12"></polyline>'; }
      setTimeout(callback, 600);
    } else { callback(); }
  }

 function renderEquipos(rows) {
  if (!rows || !rows.length) {
    document.getElementById('equiposBody').innerHTML = '<tr><td colspan="11">No se encontraron registros</td></tr>';
    return;
  }

  function normFichaCliente(v) {
    var s = String(v || '').trim().replace(/^'/, '');
    if (!s || s === '-') return '';
    return s.replace(/^0+/, '') || '0';
  }

  var eyeSvg = '<svg viewBox="0 0 24 24"><path d="M2.5 12s3.5-5.5 9.5-5.5S21.5 12 21.5 12s-3.5 5.5-9.5 5.5S2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.7"/></svg>';

  var html = [];

  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];

    var serie = String(r['Nro Serie'] || r['N° Serie'] || r['Serie'] || '')
      .toLowerCase()
      .trim();

    var fichaIngRaw = r['Ficha Ingreso'] || '-';
    var fichaSalRaw = r['Ficha Salida'] || '-';

    var fichaIngNum = safe(fichaIngRaw);
    var fichaSalNum = safe(fichaSalRaw);

    var fichaIngKey = normFichaCliente(fichaIngRaw);
    var fichaSalKey = normFichaCliente(fichaSalRaw);

    var fichaData = {};

if (fichaIngKey && fichaSalKey) {
  fichaData = _fichasMap[serie + '|both|' + fichaIngKey + '|' + fichaSalKey] || {};
}

if ((!fichaData.idIng && !fichaData.idSal) && fichaIngKey) {
  fichaData = _fichasMap[serie + '|ing|' + fichaIngKey] || fichaData;
}

if ((!fichaData.idIng && !fichaData.idSal) && fichaSalKey) {
  fichaData = _fichasMap[serie + '|sal|' + fichaSalKey] || fichaData;
}
var btnIng = (fichaIngKey && fichaData.idIng)
  ? '<button class="ficha-eye-btn" onclick="equiposVerFicha(\'' + fichaData.idIng + '\',\'' + safe(fichaData.urlIng) + '\',\'Ficha Ingreso\')" title="Ver ficha de ingreso">' + eyeSvg + '</button>'
  : '<span class="ficha-eye-empty" title="Sin ficha de ingreso">' + eyeSvg + '</span>';

var btnSal = (fichaSalKey && fichaData.idSal)
  ? '<button class="ficha-eye-btn" onclick="equiposVerFicha(\'' + fichaData.idSal + '\',\'' + safe(fichaData.urlSal) + '\',\'Ficha Salida\')" title="Ver ficha de salida">' + eyeSvg + '</button>'
  : '<span class="ficha-eye-empty" title="Sin ficha de salida">' + eyeSvg + '</span>';

    html.push(
      '<tr>' +
        '<td style="font-family:\'DM Mono\',monospace;font-size:11px;color:var(--text-muted);">' + safe(r['ID Ticket'] || r['Id Ticket'] || r['Ticket'] || '-') + '</td>' +
        '<td>' + safe(r['Fecha de Ingreso'] || r['Fecha Ingreso'] || r['Fecha'] || '-') + '</td>' +
        '<td>' + safe(r['Nro Serie'] || r['N° Serie'] || r['Serie'] || '-') + '</td>' +
        '<td>' + safe(r['Cliente'] || '-') + '</td>' +
        '<td>' + safe(r['Modelo'] || '-') + '</td>' +
        '<td>' + safe(r['Color'] || '-') + '</td>' +
        '<td>' + buildBadge(r['Status'] || r['Estado'] || '-') + '</td>' +
        '<td>' + safe(r['Falla'] || '-') + '</td>' +
        '<td>' + safe(r['Fecha de Salida del Taller'] || r['Fecha de Salida'] || r['Fecha Salida'] || '-') + '</td>' +
        '<td><span class="ficha-cell"><span class="ficha-num">' + fichaIngNum + '</span>' + btnIng + '</span></td>' +
        '<td><span class="ficha-cell"><span class="ficha-num">' + fichaSalNum + '</span>' + btnSal + '</span></td>' +
        '<td><button class="detail-btn btn-ver-detalle" data-serie="' + escapeQuotes(serie) + '" data-ficha="' + escapeQuotes(fichaIngRaw) + '" data-ticket="' + escapeQuotes(r['ID Ticket'] || '') + '">Ver detalle</button></td>' +
      '</tr>'
    );
  }

  document.getElementById('equiposBody').innerHTML = html.join('');
}

  function equiposVerFicha(fileId, urlFallback, titulo) {
    var modal   = document.getElementById('fichasVisorModal');
    var title   = document.getElementById('fichasVisorTitle');
    var content = document.getElementById('fichasVisorContent');
    var link    = document.getElementById('fichasVisorLink');
    title.textContent = titulo || 'Ficha';
    link.href = urlFallback || '#';
    content.innerHTML = visorLoadingHtml('Cargando imagen...');
    modal.classList.add('active');
    google.script.run
      .withSuccessHandler(function(res) {
            content.innerHTML = res && res.ok
      ? visorImageHtml(res.dataUrl)
      : visorFallbackHtml(urlFallback);
      })
      .withFailureHandler(function() {
        content.innerHTML = '<div style="color:#fff;text-align:center;padding:32px;"><a href="' + safe(urlFallback) + '" target="_blank" style="color:#60a5fa;">Abrir en Drive</a></div>';
      })
      .getImagenFichaBase64(fileId);
  }

  function renderPagination(p) {
    document.getElementById('paginationInfo').textContent = (p.start||0) + '-' + (p.end||0) + ' / ' + (p.total||0);
    document.getElementById('prevPageBtn').disabled = (p.page||1) <= 1;
    document.getElementById('nextPageBtn').disabled = (p.page||1) >= (p.totalPages||1);
  }

  function goPrevPage() { if (paginaActual > 1) { paginaActual--; buscarEquipos(); } }
  function goNextPage() { if (paginaActual < totalPaginas) { paginaActual++; buscarEquipos(); } }

  // =========================================
  // FILTROS
  // =========================================
  function abrirFiltros() {
    document.getElementById('filtrosModal').classList.add('active');
    if (_filtrosCache) { renderFiltrosOptions(_filtrosCache); }
    else { google.script.run.withSuccessHandler(function(data) { _filtrosCache = data; renderFiltrosOptions(data); }).withFailureHandler(showErrorModal).getFiltrosOptions(); }
  }
  function cerrarFiltros() { document.getElementById('filtrosModal').classList.remove('active'); }
  function renderFiltrosOptions(data) {
    llenarSelect('filterModelo', data.modelos||[], filtrosActuales.modelo, 'Todos');
    llenarSelect('filterEstado', data.estados||[], filtrosActuales.estado, 'Todos');
    llenarSelect('filterFalla',  data.fallas ||[], filtrosActuales.falla,  'Todas');
      var tcEl = document.getElementById('filterTipoCliente');
  if (tcEl) tcEl.value = filtrosActuales.tipoCliente || '';
  }
  function llenarSelect(id, items, selectedValue, defaultLabel) {
    var opts = ['<option value="">' + defaultLabel + '</option>'];
    items.forEach(function(i) { opts.push('<option value="' + safeAttr(i) + '"' + (i===selectedValue?' selected':'') + '>' + safe(i) + '</option>'); });
    document.getElementById(id).innerHTML = opts.join('');
  }
  function aplicarFiltros() {
      filtrosActuales.modelo = document.getElementById('filterModelo').value||'';
      filtrosActuales.estado = document.getElementById('filterEstado').value||'';
      filtrosActuales.falla  = document.getElementById('filterFalla').value||'';
      filtrosActuales.tipoCliente = document.getElementById('filterTipoCliente').value||''; // ← NUEVO
      paginaActual=1; cerrarFiltros(); buscarEquipos();
  }
  function limpiarFiltros() {
      filtrosActuales = { modelo:'', estado:'', falla:'', ficha:'', tipoCliente:'' }; // ← tipoCliente
      ['filterModelo','filterEstado','filterFalla','filterTipoCliente'].forEach(function(id){ // ← agrega filterTipoCliente
        document.getElementById(id).value='';
      });
      var fi=document.getElementById('searchFicha'); if(fi) fi.value='';
      paginaActual=1; cerrarFiltros(); buscarEquipos();
  }
  function renderActiveFilters() {
    var chips=[];
    if (rangoFechasActual.desde) chips.push('<span class="filter-chip">Desde: ' + safe(rangoFechasActual.desde) + '</span>');
    if (rangoFechasActual.hasta) chips.push('<span class="filter-chip">Hasta: ' + safe(rangoFechasActual.hasta) + '</span>');
    if (filtrosActuales.modelo)  chips.push('<span class="filter-chip">Modelo: ' + safe(filtrosActuales.modelo) + '</span>');
    if (filtrosActuales.estado)  chips.push('<span class="filter-chip">Estado: ' + safe(filtrosActuales.estado) + '</span>');
    if (filtrosActuales.falla)   chips.push('<span class="filter-chip">Falla: ' + safe(filtrosActuales.falla) + '</span>');
    if (filtrosActuales.tipoCliente === 'eden')    chips.push('<span class="filter-chip">👤 Solo Eden Agua</span>');
    if (filtrosActuales.tipoCliente === 'cliente') chips.push('<span class="filter-chip">👤 Solo Clientes</span>');
    document.getElementById('activeFilters').innerHTML = chips.join('');
  }

  // =========================================
  // DETALLES
  // =========================================
function verDetalle(serie, fichaIngreso,ticketNum) {
  document.getElementById('detalleModal').classList.add('active');
  document.getElementById('modalTitle').textContent = 'Detalle del equipo: ' + serie;
  document.getElementById('modalContent').innerHTML = htmlDetalleCargador;
  google.script.run
    .withSuccessHandler(function(data) {
      var ingresos = data.ingresos || [];
      var salidas  = data.salidas  || [];

      // Buscar el ingreso específico por ficha
      var ingresoIdx = -1;
      if (fichaIngreso && fichaIngreso !== '-' && fichaIngreso !== '') {
        var fNorm = String(fichaIngreso).trim().replace(/^'/,'').replace(/^0+/,'') || '0';
        for (var i = 0; i < ingresos.length; i++) {
          var f = String(ingresos[i]['Numero de Ficha de Ingreso'] || ingresos[i]['Ficha de ingreso'] || '').trim().replace(/^0+/,'') || '0';
          if (f === fNorm) { ingresoIdx = i; break; }
        }
      }

      var currentIng, currentSal;
      if (ingresoIdx >= 0) {
        currentIng = ingresos[ingresoIdx];
        currentSal = salidas[ingresoIdx] || data.currentSalida || null;
      } else {
        currentIng = data.currentIngreso || (ingresos.length ? ingresos[ingresos.length-1] : null);
        currentSal = data.currentSalida  || (salidas.length  ? salidas[salidas.length-1]   : null);
      }

      // Reconstruir detalleGeneral desde el ingreso/salida seleccionado
      var dg = JSON.parse(JSON.stringify(data.detalleGeneral || {}));
      if (currentIng) {
        dg.fechaDetalle  = String(currentIng['Fecha de Llegada al Taller']  || dg.fechaDetalle  || '-');
        dg.fichaIngreso  = String(currentIng['Numero de Ficha de Ingreso']   || dg.fichaIngreso  || '-');
        dg.motivoIngreso = String(currentIng['Detalle del Motivo a Taller']  || dg.motivoIngreso || '-');
        dg.bandeja       = String(currentIng['Tiene Bandeja'] || currentIng['Bandeja'] || dg.bandeja || '-');
        dg.ticket = (ticketNum && ticketNum !== '-' && ticketNum !== '')
          ? ticketNum
          : (String(currentIng['ID Ticket'] || currentIng['Id Ticket'] || '').trim() || dg.ticket || '-');

      }
      if (currentSal) {
        dg.fechaSalida       = String(currentSal['Fecha de Salida del Taller']       || dg.fechaSalida       || '-');
        dg.fichaSalida       = String(currentSal['Numero de Ficha de Salida']         || dg.fichaSalida       || '-');
        dg.tecnicoReparacion = String(currentSal['Técnico responsable de reparación'] || dg.tecnicoReparacion || '-');
      }

      detalleActual = {
        serie: serie, equipo: data.equipo||null,
        ingresos: ingresos, salidas: salidas,
        detalleGeneral: dg,
        currentIngreso: currentIng, currentSalida: currentSal
      };
      cambiosPendientes = { ingreso: null, salida: null };
      mostrarExitoDetalle(function() { renderDetalleModal(detalleActual); });
    })
    .withFailureHandler(showErrorModal)
    .getDetalleEquipo(serie);
}

  function mostrarExitoDetalle(callback) {
    var c = document.getElementById('detalle-loader-container');
    if (c) {
      if (c.querySelector('.progress-svg')) c.querySelector('.progress-svg').classList.add('success');
      if (c.querySelector('.circle-progress')) c.querySelector('.circle-progress').classList.add('success');
      var t=c.querySelector('.status-text-loader'); if(t){t.classList.add('success');t.innerText='¡Información recuperada!';}
      var ic=c.querySelector('.custom-icon'); if(ic){ic.style.stroke='#22c55e';ic.style.transform='scale(1.2)';ic.innerHTML='<polyline points="20 6 9 17 4 12"></polyline>';}
      setTimeout(callback, 600);
    } else { callback(); }
  }

  function cerrarModal() { document.getElementById('detalleModal').classList.remove('active'); }

  // =========================================
  // NUEVO REGISTRO
  // =========================================
  function setNuevoTipo(tipo) {
    document.getElementById('tipoBtnIngreso').classList.toggle('active', tipo === 'ingreso');
    document.getElementById('tipoBtnSalida').classList.toggle('active',  tipo === 'salida');
    document.getElementById('nuevoFormIngreso').style.display = tipo === 'ingreso' ? 'grid' : 'none';
    document.getElementById('nuevoFormSalida').style.display  = tipo === 'salida'  ? 'grid' : 'none';
    if (tipo === 'ingreso' && !_dropdownsIngresoInit) {
      cargarConfigTaller(function(config) { inicializarDropdownsIngreso(config); _dropdownsIngresoInit = true; });
    }
    if (tipo === 'salida' && !_dropdownsSalidaInit) {
      cargarConfigTaller(function(config) { inicializarDropdownsSalida(config); _dropdownsSalidaInit = true; });
    }
  }

  function limpiarNuevoFormulario() {
    ['nI_serie','nI_fecha','nI_cliente','nI_motivo','nI_ficha','nI_hora','nI_tecnico','nI_modelo','nI_color','nI_bandeja',
     'nS_serie','nS_fecha','nS_tecnico','nS_ficha','nS_hora','nS_procedimiento','nS_repuestos','nS_consumibles','nS_hora_inicio','nS_cliente']
      .forEach(function(id) { var el = document.getElementById(id); if (el) el.value = ''; });
    var fileInput = document.getElementById('n_foto');
    if (fileInput) fileInput.value = '';
    var labelText = document.getElementById('fileLabelText');
    if (labelText) labelText.innerText = '📁 Haz clic aquí para adjuntar una imagen';
  }

  function guardarNuevoRegistro() {
    var btn  = document.getElementById('btnGuardarNuevo');
    var tipoBtnIngreso = document.getElementById('tipoBtnIngreso');
    var tipo = tipoBtnIngreso && tipoBtnIngreso.classList.contains('active') ? 'ingreso' : 'salida';
    var datos  = {};
    if (tipo === 'ingreso') {
      if (!getValue('nI_serie').trim()) { alert("La Serie del producto es obligatoria."); return; }
      datos = {
        'Serie del Producto':          getValue('nI_serie').trim(),
        'Fecha de Llegada al Taller':  getValue('nI_fecha').trim(),
        'Cliente o Eden Agua':         getValue('nI_cliente').trim(),
        'Detalle del Motivo a Taller': getValue('nI_motivo').trim(),
        'Numero de Ficha de Ingreso':  getValue('nI_ficha').trim(),
        'Hora de llegada al taller':   getValue('nI_hora').trim(),
        'Técnico que entrega equipo':  getValue('nI_tecnico').trim(),
        'Modelo':                      getValue('nI_modelo').trim(),
        'Color del equipo':            getValue('nI_color').trim(),
        'Tiene Bandeja':               getValue('nI_bandeja').trim()
      };
    } else {
      if (!getValue('nS_serie').trim()) { alert("La Serie del producto es obligatoria."); return; }
      datos = {
        'Serie del Producto':                getValue('nS_serie').trim(),
        'Fecha de Salida del Taller':        getValue('nS_fecha').trim(),
        'Técnico responsable de reparación': getValue('nS_tecnico').trim(),
        'Numero de Ficha de Salida':         getValue('nS_ficha').trim(),
        'Hora de Termino de Reparación':     getValue('nS_hora').trim(),
        'Procedimiento de Reparación':       getValue('nS_procedimiento').trim(),
        'Repuestos Utilizados':              getValue('nS_repuestos').trim(),
        'Consumibles':                       getValue('nS_consumibles').trim(),
        'Hora de Inicio de Reparación':      getValue('nS_hora_inicio').trim(),
        'Cliente o Eden Agua':               getValue('nS_cliente').trim()
      };
    }
    btn.textContent = 'Procesando...'; btn.disabled = true;
    var fileInput = document.getElementById('n_foto');
    if (!fileInput || fileInput.files.length === 0) { enviarAlBackend(tipo, datos, null, btn); return; }
    var file = fileInput.files[0];
    if (!file.type.startsWith('image/')) { alert('Solo se permiten archivos de imagen (JPG, PNG, etc.)'); btn.textContent = 'Registrar en Google Sheets'; btn.disabled = false; return; }
    if (file.size > 5 * 1024 * 1024) { alert('La imagen no debe superar 5 MB.'); btn.textContent = 'Registrar en Google Sheets'; btn.disabled = false; return; }
    btn.textContent = 'Leyendo imagen...';
    var reader = new FileReader();
    reader.onload = function(e) {
      btn.textContent = 'Subiendo foto...';
      var base64 = e.target.result.split(',')[1];
      enviarAlBackend(tipo, datos, { filename: file.name, mimeType: file.type, base64: base64 }, btn);
    };
    reader.onerror = function() { alert('No se pudo leer el archivo.'); btn.textContent = 'Registrar en Google Sheets'; btn.disabled = false; };
    reader.readAsDataURL(file);
  }

  function enviarAlBackend(tipo, datos, archivo, btn) {
    btn.textContent = archivo ? 'Guardando con foto...' : 'Guardando...';
    google.script.run
      .withSuccessHandler(function(res) {
        if (res && res.ok) {
          btn.textContent = '✓ Registrado correctamente'; btn.style.background = 'var(--green-main)';
          setTimeout(function() { btn.textContent = 'Registrar en Google Sheets'; btn.style.background = 'var(--blue-main)'; btn.disabled = false; limpiarNuevoFormulario(); }, 2500);
        } else { alert('Error inesperado al guardar.'); btn.textContent = 'Registrar en Google Sheets'; btn.disabled = false; }
      })
      .withFailureHandler(function(err) { console.error('Error backend:', err); alert('Error: ' + (err.message || err)); btn.textContent = 'Registrar en Google Sheets'; btn.style.background = 'var(--blue-main)'; btn.disabled = false; })
      .registrarNuevoEquipo(tipo, datos, archivo);
  }

  // =========================================
  // EDITAR REGISTROS
  // =========================================
  var _editData = null;

  function setSearchMode(mode, btn) {
    document.querySelectorAll('#searchModeTabs .search-tab').forEach(function(t) { t.classList.remove('active'); });
    btn.classList.add('active');
    var placeholders = { ambas_fichas:'Ingrese N° de Ficha de Ingreso o Salida...', ficha_ingreso:'Ingrese N° de Ficha de Ingreso...', ficha_salida:'Ingrese N° de Ficha de Salida...', serie:'Ingrese N° de Serie del equipo...' };
    var input = document.getElementById('editSearchInput');
    if (input) { input.placeholder = placeholders[mode] || 'Buscar...'; input.dataset.mode = mode; input.value = ''; input.focus(); }
  }

  function buscarParaEditar() {
    var input = document.getElementById('editSearchInput');
    var query = (input ? input.value : '').trim();
    var activeTab = document.querySelector('#searchModeTabs .search-tab.active');
    var mode = activeTab ? activeTab.dataset.mode : 'ambas_fichas';
    if (!query) return;
    document.getElementById('editInfoStrip').style.display = 'none';
    document.getElementById('editNoResultado').style.display = 'none';
    document.getElementById('editFormGrid').style.display = 'none';
    _editData = null;
    var btn = document.querySelector('#edicion .btn-buscar-pro');
    var orig = btn ? btn.innerHTML : '';
    if (btn) { btn.innerHTML = 'Buscando...'; btn.disabled = true; }
    google.script.run
      .withSuccessHandler(function(data) {
        if (btn) { btn.innerHTML = orig; btn.disabled = false; }
        if (!data || (!data.equipo && !data.ingresos.length && !data.salidas.length)) { document.getElementById('editNoResultado').style.display = 'block'; return; }
        _editData = data; mostrarFormularioEdicion(data);
        if (!_dropdownsEdicionInit) { cargarConfigTaller(function(config) { inicializarDropdownsEdicion(config); _dropdownsEdicionInit = true; }); }
      })
      .withFailureHandler(function(e) { if (btn) { btn.innerHTML = orig; btn.disabled = false; } document.getElementById('editNoResultado').style.display = 'block'; })
      .buscarEquipoPorCriterio(query, mode);
  }

  function mostrarFormularioEdicion(data) {
    var eq = data.equipo, ing = data.currentIngreso || (data.ingresos && data.ingresos[0]) || {}, sal = data.currentSalida || (data.salidas && data.salidas[0]) || {}, dg = data.detalleGeneral || {};
    var serie = eq ? (eq['Nro Serie'] || eq['N° Serie'] || eq['Serie'] || '-') : (ing['Serie del Producto'] || sal['Serie del Producto'] || '-');
    var cliente = eq ? (eq['Cliente'] || '-') : (ing['Cliente o Eden Agua'] || '-');
    var estado  = eq ? (eq['Status']  || eq['Estado'] || '-') : '-';
    var strip = document.getElementById('editInfoStrip');
    strip.innerHTML = '<span style="font-weight:700;color:var(--blue-main);">' + safe(serie) + '</span><span style="color:var(--text-muted);margin:0 6px;">·</span><span>' + safe(cliente) + '</span><span style="color:var(--text-muted);margin:0 6px;">·</span>' + buildBadge(estado);
    strip.style.display = 'flex';
    setVal('eI_ticket',  dg.ticket); setVal('eI_serie', ing['Serie del Producto'] || serie); setVal('eI_fecha', ing['Fecha de Llegada al Taller'] || dg.fechaDetalle || '');
    setVal('eI_cliente', ing['Cliente o Eden Agua'] || ing['Cliente'] || cliente); setVal('eI_motivo', ing['Detalle del Motivo a Taller'] || dg.motivoIngreso || '');
    setVal('eI_ficha', ing['Numero de Ficha de Ingreso'] || dg.fichaIngreso || ''); setVal('eI_hora', ing['Hora de llegada al taller'] || '');
    setVal('eI_tecnico', ing['Técnico que entrega equipo'] || (eq ? eq['Técnico que entrega equipo a Taller'] : '')); setVal('eI_modelo', ing['Modelo'] || (eq ? eq['Modelo'] : ''));
    setVal('eI_color', ing['Color del equipo'] || ing['Color'] || (eq ? eq['Color'] : '')); setVal('eI_bandeja', ing['Tiene Bandeja'] || ing['Bandeja'] || (eq ? eq['Bandeja'] : ''));
    var estadoActual = (eq ? (eq['Status'] || eq['Estado']) : '') || 'Sin estado';
    var selE = document.getElementById('eI_estado');
    if (selE) { if (!Array.from(selE.options).some(function(o) { return o.value === estadoActual; }) && estadoActual !== '-' && estadoActual !== '') { selE.add(new Option(estadoActual, estadoActual)); } selE.value = estadoActual; actualizarColorSelectEdicion(); }
    setVal('eS_fecha', sal['Fecha de Salida del Taller'] || dg.fechaSalida || ''); setVal('eS_tecnico', sal['Técnico responsable de reparación'] || dg.tecnicoReparacion || '');
    setVal('eS_ficha', sal['Numero de Ficha de Salida'] || sal['Número de Ficha de Salida'] || dg.fichaSalida || ''); setVal('eS_hora', sal['Hora de Termino de Reparación'] || '');
    setVal('eS_procedimiento', sal['Procedimiento de Reparación'] || ''); setVal('eS_repuestos', sal['Repuestos Utilizados'] || '');
    setVal('eS_consumibles', sal['Consumibles'] || ''); setVal('eS_hora_inicio', sal['Hora de Inicio de Reparación'] || '');
    document.getElementById('editFormGrid').style.display = 'block';
  }

  function actualizarColorSelectEdicion() {
    var select = document.getElementById('eI_estado'); if(!select) return;
    var val = select.value.toLowerCase();
    select.style.backgroundColor='white'; select.style.color='#172b4d'; select.style.borderColor='#cbd5e1';
    if (val.includes('operativo'))  { select.style.backgroundColor='#dcfce7'; select.style.color='#166534'; select.style.borderColor='#dcfce7'; }
    else if (val.includes('listo')) { select.style.backgroundColor='#dbeafe'; select.style.color='#1d4ed8'; select.style.borderColor='#dbeafe'; }
    else if (val.includes('espera')||val.includes('reparacion')||val.includes('reparación')) { select.style.backgroundColor='#fef3c7'; select.style.color='#92400e'; select.style.borderColor='#fef3c7'; }
  }

  function guardarEdicionDirecta() {
    if (!_editData) return;
    var eq = _editData.equipo, ing = _editData.currentIngreso || (_editData.ingresos && _editData.ingresos[0]) || {}, sal = _editData.currentSalida || (_editData.salidas && _editData.salidas[0]) || {};
    var estadoVal = document.getElementById('eI_estado') ? document.getElementById('eI_estado').value : '';
    var payloadIngreso = Object.assign({}, ing || {}, { 'Serie del Producto':getValue('eI_serie'),'Serie':getValue('eI_serie'),'Fecha de Llegada al Taller':getValue('eI_fecha'),'Fecha de Ingreso':getValue('eI_fecha'),'Fecha Ingreso':getValue('eI_fecha'),'Cliente o Eden Agua':getValue('eI_cliente'),'Cliente':getValue('eI_cliente'),'Detalle del Motivo a Taller':getValue('eI_motivo'),'Motivo de ingreso':getValue('eI_motivo'),'Numero de Ficha de Ingreso':getValue('eI_ficha'),'Ficha de ingreso':getValue('eI_ficha'),'Ficha Ingreso':getValue('eI_ficha'),'Hora de llegada al taller':getValue('eI_hora'),'Técnico que entrega equipo':getValue('eI_tecnico'),'Tecnico que entrega equipo':getValue('eI_tecnico'),'Modelo':getValue('eI_modelo'),'Color del equipo':getValue('eI_color'),'Color':getValue('eI_color'),'Tiene Bandeja':getValue('eI_bandeja'),'Bandeja':getValue('eI_bandeja'),'_extraEstado':estadoVal,'_extraModelo':getValue('eI_modelo'),'_extraColor':getValue('eI_color'),'_extraBandeja':getValue('eI_bandeja'),'_extraTecnicoEntrega':getValue('eI_tecnico'),'_extraTicket':getValue('eI_ticket') });
    var payloadSalida = (sal && Object.keys(sal).length) ? Object.assign({}, sal || {}, { 'Serie del Producto':getValue('eI_serie'),'Serie':getValue('eI_serie'),'Fecha de Salida del Taller':getValue('eS_fecha'),'Fecha de salida':getValue('eS_fecha'),'Fecha Salida':getValue('eS_fecha'),'Fecha Final de Reparación':getValue('eS_fecha'),'Técnico responsable de reparación':getValue('eS_tecnico'),'Tecnico responsable de reparación':getValue('eS_tecnico'),'Supervisor a cargo':getValue('eS_tecnico'),'Numero de Ficha de Salida':getValue('eS_ficha'),'Ficha reparación':getValue('eS_ficha'),'Ficha de reparación':getValue('eS_ficha'),'Ficha Salida':getValue('eS_ficha'),'Hora de Termino de Reparación':getValue('eS_hora'),'Procedimiento de Reparación':getValue('eS_procedimiento'),'Repuestos Utilizados':getValue('eS_repuestos'),'Consumibles':getValue('eS_consumibles'),'Hora de Inicio de Reparación':getValue('eS_hora_inicio') }) : null;
    var payload = { serie: eq ? (eq['Nro Serie']||eq['N° Serie']||eq['Serie']||'') : getValue('eI_serie'), equipoRowNum: eq ? eq.__rowNum : null, ingreso: payloadIngreso, salida: payloadSalida };
    var btn = document.getElementById('btnGuardarEdicion');
    if (btn) { btn.textContent = 'Guardando...'; btn.disabled = true; }
    google.script.run
      .withSuccessHandler(function() {
        if (btn) { btn.textContent = '✓ Guardado correctamente'; btn.style.background = 'var(--green-main)'; }
        setTimeout(function() { if (btn) { btn.textContent = 'Guardar en Google Sheets'; btn.style.background = 'var(--blue-main)'; btn.disabled = false; } }, 2500);
        _filtrosCache = null;
      })
      .withFailureHandler(function(e) { alert('Error al guardar: ' + e.message); if (btn) { btn.textContent = 'Guardar en Google Sheets'; btn.disabled = false; } })
      .guardarCambiosDetalle(payload);
  }

  function limpiarEdicion() {
    _editData = null;
    var inp = document.getElementById('editSearchInput'); if (inp) inp.value = '';
    document.getElementById('editInfoStrip').style.display = 'none'; document.getElementById('editNoResultado').style.display = 'none'; document.getElementById('editFormGrid').style.display = 'none';
    ['eI_serie','eI_fecha','eI_cliente','eI_motivo','eI_ficha','eI_hora','eI_tecnico','eI_modelo','eI_color','eI_bandeja','eS_fecha','eS_tecnico','eS_ficha','eS_hora','eS_procedimiento','eS_repuestos','eS_consumibles','eS_hora_inicio','eI_ticket'].forEach(function(id) { var el = document.getElementById(id); if (el) el.value = ''; });
  }

  // =========================================
  // MODAL DETALLE
  // =========================================
  function hayCambiosPendientes() { return !!(cambiosPendientes.ingreso||cambiosPendientes.salida); }
  function actualizarBotonGuardarCambios() { var btn=document.getElementById('btnGuardarCambiosDetalle'); if(!btn) return; var activo=hayCambiosPendientes(); btn.disabled=!activo; btn.classList.toggle('has-changes',activo); btn.textContent=activo?'Guardar cambios':'Sin cambios'; }
  function guardarCambiosDetalleFinal() {
    if(!hayCambiosPendientes()) return;
    var payload={serie:detalleActual.serie,equipoRowNum:detalleActual.equipo?detalleActual.equipo.__rowNum:null,ingreso:cambiosPendientes.ingreso,salida:cambiosPendientes.salida,detalle:buildPreviewDetalleGeneral()};
    var btn=document.getElementById('btnGuardarCambiosDetalle'); if(btn){btn.disabled=true;btn.textContent='Guardando en la nube...';}
    detalleActual.detalleGeneral=payload.detalle;
    if(payload.ingreso&&detalleActual.ingresos.length>0) detalleActual.ingresos[0]=payload.ingreso;
    if(payload.salida&&detalleActual.salidas.length>0)   detalleActual.salidas[0]=payload.salida;
    renderDetalleModal(detalleActual);
    google.script.run.withSuccessHandler(function(){cambiosPendientes={ingreso:null,salida:null};actualizarBotonGuardarCambios();_filtrosCache=null;buscarEquipos();}).withFailureHandler(function(){alert('Hubo un error de conexión al guardar.');actualizarBotonGuardarCambios();}).guardarCambiosDetalle(payload);
  }
  function buildPreviewIngresos() { var b=JSON.parse(JSON.stringify(detalleActual.ingresos||[])); if(cambiosPendientes.ingreso){var m=Object.assign({},b[0]||{},cambiosPendientes.ingreso,{'Ficha Ingreso Historial':cambiosPendientes.ingreso['Numero de Ficha de Ingreso']||'-'});if(b.length)b[0]=m;else b.push(m);} return b; }
  function buildPreviewSalidas()  { var b=JSON.parse(JSON.stringify(detalleActual.salidas||[]));  if(cambiosPendientes.salida){var m=Object.assign({},b[0]||{},cambiosPendientes.salida,{'Ficha Salida Historial':cambiosPendientes.salida['Numero de Ficha de Salida']||'-'});if(b.length)b[0]=m;else b.push(m);} return b; }
  function buildPreviewDetalleGeneral() {
    var b=JSON.parse(JSON.stringify(detalleActual.detalleGeneral||{}));
    if(cambiosPendientes.ingreso){b.fechaDetalle=cambiosPendientes.ingreso['Fecha de Llegada al Taller']||b.fechaDetalle||'-';b.fichaIngreso=cambiosPendientes.ingreso['Numero de Ficha de Ingreso']||b.fichaIngreso||'-';b.motivoIngreso=cambiosPendientes.ingreso['Detalle del Motivo a Taller']||b.motivoIngreso||'-';b.bandeja=cambiosPendientes.ingreso['_extraBandeja']||b.bandeja||'-';}
    if(cambiosPendientes.salida){b.fechaSalida=cambiosPendientes.salida['Fecha de Salida del Taller']||b.fechaSalida||'-';b.fichaSalida=cambiosPendientes.salida['Numero de Ficha de Salida']||b.fichaSalida||'-';b.tecnicoReparacion=cambiosPendientes.salida['Técnico responsable de reparación']||b.tecnicoReparacion||'-';b.diasReparacion=cambiosPendientes.salida['Dias Reparacion Historial']||b.diasReparacion||'-';}
    return b;
  }

  function renderDetalleModal(data) {
    var eq=data.equipo, dg=data.detalleGeneral||{};
    if(!eq){document.getElementById('modalContent').innerHTML='<div class="empty-state">No se encontró información del equipo.</div>';return;}
    var ingresos=data.ingresos||[], salidas=data.salidas||[];
    var serie=eq['Nro Serie']||eq['N° Serie']||eq['Serie']||'-', cliente=eq['Cliente']||'-';
    var modelo=(cambiosPendientes.ingreso&&cambiosPendientes.ingreso['_extraModelo'])||eq['Modelo']||'-';
    var color=(cambiosPendientes.ingreso&&cambiosPendientes.ingreso['_extraColor'])||eq['Color']||'-';
    var estado=(cambiosPendientes.ingreso&&cambiosPendientes.ingreso['_extraEstado'])||eq['Status']||eq['Estado']||'-';
    var falla=eq['Falla']||'-';
    var ingActual = detalleActual.currentIngreso || (ingresos[0] || {});
    var te=(cambiosPendientes.ingreso&&cambiosPendientes.ingreso['_extraTecnicoEntrega'])||(ingActual['Técnico que entrega equipo']||ingActual['Tecnico que entrega equipo'])||eq['Técnico que entrega equipo a Taller']||'-';
    var totalFilas=Math.max(ingresos.length,salidas.length);
    var fI=[], fS=[];
    for(var i=0;i<totalFilas;i++){
      var ing2=ingresos[i]||null, sal2=salidas[i]||null;
      fI.push('<tr><td>'+safe(ing2?(ing2['Fecha de Llegada al Taller']||'-'):'-')+'</td><td>'+safe(ing2?(ing2['Cliente o Eden Agua']||'-'):'-')+'</td><td>'+safe(ing2?(ing2['Detalle del Motivo a Taller']||'-'):'-')+'</td><td>'+safe(ing2?(ing2['Ficha Ingreso Historial']||ing2['Numero de Ficha de Ingreso']||'-'):'-')+'</td></tr>');
      fS.push('<tr><td>'+safe(sal2?(sal2['Fecha de Salida del Taller']||'-'):'-')+'</td><td>'+safe(sal2?(sal2['Técnico responsable de reparación']||'-'):'-')+'</td><td>'+safe(sal2?(sal2['Procedimiento de Reparación']||'-'):'-')+'</td><td>'+safe(sal2?(sal2['Repuestos Utilizados']||'-'):'-')+'</td><td>'+safe(sal2?(sal2['Ficha Salida Historial']||sal2['Numero de Ficha de Salida']||'-'):'-')+'</td></tr>');
    }
    document.getElementById('modalTitle').textContent='Detalle del equipo: '+serie;
    document.getElementById('modalContent').innerHTML =
      '<div class="detail-actions-bar"><button class="detail-btn" type="button" onclick="abrirModalEditarIngreso()">Editar ingreso</button><button class="detail-btn" type="button" onclick="abrirModalEditarSalida()">Editar salida</button><button id="btnGuardarCambiosDetalle" class="detail-btn" type="button" onclick="guardarCambiosDetalleFinal()">Sin cambios</button>'
      + '<button id="btnExportarHistorialEquipo" type="button" onclick="exportarHistorialEquipo()" style="display:flex;align-items:center;gap:6px;padding:8px 14px;border:0.5px solid var(--border-soft);border-radius:var(--radius-md);background:var(--bg-soft);color:var(--text-muted);font-size:12px;font-weight:600;font-family:inherit;cursor:pointer;margin-left:auto;transition:.12s;" onmouseenter="this.style.borderColor=\'var(--text-main)\';this.style.color=\'var(--text-main)\'" onmouseleave="this.style.borderColor=\'var(--border-soft)\';this.style.color=\'var(--text-muted)\'"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 18 15 15"/></svg> Exportar historial</button></div>' +
      '<div class="detail-sections-grid"><div class="detail-section-card"><div class="detail-section-title">Identificación</div><div class="detail-lines"><div class="detail-line"><strong>ID Ticket</strong><span>'+safe(dg.ticket||'-')+'</span></div><div class="detail-line"><strong>Cliente</strong><span>'+safe(cliente)+'</span></div><div class="detail-line"><strong>Modelo</strong><span>'+safe(modelo)+'</span></div><div class="detail-line"><strong>Color</strong><span>'+safe(color)+'</span></div><div class="detail-line"><strong>Bandeja</strong><span>'+safe(dg.bandeja||'-')+'</span></div></div></div>' +
      '<div class="detail-section-card"><div class="detail-section-title">Tiempos</div><div class="detail-lines"><div class="detail-line"><strong>Fecha ingreso</strong><span>'+safe(dg.fechaDetalle||'-')+'</span></div><div class="detail-line"><strong>Fecha salida</strong><span>'+safe(dg.fechaSalida||'-')+'</span></div><div class="detail-line"><strong>Días reparación</strong><span>'+safe(dg.diasReparacion||'-')+'</span></div><div class="detail-line"><strong>Ficha ingreso</strong><span>'+safe(dg.fichaIngreso||'-')+'</span></div><div class="detail-line"><strong>Ficha salida</strong><span>'+safe(dg.fichaSalida||'-')+'</span></div></div></div>' +
      '<div class="detail-section-card"><div class="detail-section-title">Técnico</div><div class="detail-lines"><div class="detail-line"><strong>Técnico entrega</strong><span>'+safe(te)+'</span></div><div class="detail-line"><strong>Técnico reparación</strong><span>'+safe(dg.tecnicoReparacion||'-')+'</span></div><div class="detail-line"><strong>Motivo</strong><span>'+safe(dg.motivoIngreso||'-')+'</span></div><div class="detail-line"><strong>Falla</strong><span>'+safe(falla)+'</span></div><div class="detail-line"><strong>Estado</strong><span>'+buildBadge(estado)+'</span></div></div></div></div>' +
      '<div class="modal-two-cols history-sync-grid"><div class="history-card"><h3>Historial Ingresos</h3><div class="table-wrap"><table class="history-table"><colgroup><col style="width:21%"><col style="width:41%"><col style="width:23%"><col style="width:15%"></colgroup><thead><tr><th>Fecha</th><th>Cliente</th><th>Motivo</th><th>Ficha</th></tr></thead><tbody>'+fI.join('')+'</tbody></table></div></div>' +
      '<div class="history-card"><h3>Historial Salidas</h3><div class="table-wrap"><table class="history-table"><colgroup><col style="width:13%"><col style="width:15%"><col style="width:41%"><col style="width:17%"><col style="width:14%"></colgroup><thead><tr><th>Fecha</th><th>Téc.</th><th>Proced.</th><th>Repuestos</th><th>Ficha</th></tr></thead><tbody>'+fS.join('')+'</tbody></table></div></div></div>';
    actualizarBotonGuardarCambios();
    setTimeout(syncHistoryHeights, 0);
  }

  function syncHistoryHeights() {
    var iR=Array.from(document.querySelectorAll('#bodyHistorialIngresos tr')),sR=Array.from(document.querySelectorAll('#bodyHistorialSalidas tr'));
    var total=Math.max(iR.length,sR.length);
    for(var i=0;i<total;i++){var rI=iR[i],rS=sR[i];if(rI)rI.style.height='auto';if(rS)rS.style.height='auto';var mH=Math.max(rI?rI.offsetHeight:0,rS?rS.offsetHeight:0);if(rI)rI.style.height=mH+'px';if(rS)rS.style.height=mH+'px';}
  }

function abrirModalEditarIngreso() {
  var b = cambiosPendientes.ingreso || detalleActual.currentIngreso || (detalleActual.ingresos && detalleActual.ingresos[0]) || {};
  var m = document.getElementById('modalEditarIngreso'); if(!m) return; m.classList.add('active');
  setValue('editIngresoTicket', b['ID Ticket'] || b['Id Ticket'] || b['Ticket'] || detalleActual.detalleGeneral.ticket || '');
  setValue('editIngresoSerie', b['Serie del Producto']||detalleActual.serie||'');
  setValue('editIngresoFecha', b['Fecha de Llegada al Taller']||'');
  setValue('editIngresoCliente', b['Cliente o Eden Agua']||b['Cliente']||'');
  setValue('editIngresoMotivo', b['Detalle del Motivo a Taller']||'');
  setValue('editIngresoFicha', b['Numero de Ficha de Ingreso']||detalleActual.detalleGeneral.fichaIngreso||'');
  setValue('editIngresoHora', b['Hora de llegada al taller']||'');
  setValue('editIngresoTecnicoEntrega', b['Técnico que entrega equipo']||(detalleActual.equipo?detalleActual.equipo['Técnico que entrega equipo a Taller']:''));
  setValue('editIngresoModelo', b['Modelo']||(detalleActual.equipo?detalleActual.equipo['Modelo']:''));
  setValue('editIngresoColor', b['Color del equipo']||b['Color']||(detalleActual.equipo?detalleActual.equipo['Color']:''));
  setValue('editIngresoBandeja', b['Tiene Bandeja']||b['Bandeja']||(detalleActual.equipo?detalleActual.equipo['Bandeja']:''));
  var ea=(cambiosPendientes.ingreso&&cambiosPendientes.ingreso['_extraEstado'])||(detalleActual.equipo?(detalleActual.equipo['Status']||detalleActual.equipo['Estado']):'')|| 'Sin estado';
  var se=document.getElementById('editIngresoEstado'); if(se){if(!Array.from(se.options).some(function(o){return o.value===ea;})&&ea!=='-'&&ea!==''){se.add(new Option(ea,ea));}setValue('editIngresoEstado',ea);actualizarColorSelectEstado();}
}
  function cerrarModalEditarIngreso() { var m=document.getElementById('modalEditarIngreso'); if(m) m.classList.remove('active'); }

function guardarIngresoTemporal() {
  var b = cambiosPendientes.ingreso ||
          detalleActual.currentIngreso ||
          (detalleActual.ingresos && detalleActual.ingresos[0]) ||
          {};

  var n = Object.assign({}, b);

  var vS   = getValue('editIngresoSerie');
  var vF   = getValue('editIngresoFecha');
  var vC   = getValue('editIngresoCliente');
  var vM   = getValue('editIngresoMotivo');
  var vFi  = getValue('editIngresoFicha');
  var vH   = getValue('editIngresoHora');
  var vT   = getValue('editIngresoTecnicoEntrega');
  var vMo  = getValue('editIngresoModelo');
  var vCol = getValue('editIngresoColor');
  var vB   = getValue('editIngresoBandeja');
  var vE   = getValue('editIngresoEstado');
  var vTk = getValue('editIngresoTicket');

  Object.assign(n, {
    '__rowNum': b.__rowNum,
'_oldSerie': b['Serie del Producto'] || detalleActual.serie || '',
'_oldFichaIngreso': b['Numero de Ficha de Ingreso'] || detalleActual.detalleGeneral.fichaIngreso || '', 

    'Serie del Producto': vS,
    'Fecha de Llegada al Taller': vF,
    'Cliente o Eden Agua': vC,
    'Detalle del Motivo a Taller': vM,
    'Numero de Ficha de Ingreso': vFi,
    'Hora de llegada al taller': vH,
    'Técnico que entrega equipo': vT,
    'Modelo': vMo,

    // Clave importante para Formulario INGRESO
    'Color del equipo': vCol,
    'Color': vCol,

    'Tiene Bandeja': vB,
    'Bandeja': vB,

    '_extraTecnicoEntrega': vT,
    '_extraModelo': vMo,
    '_extraColor': vCol,
    '_extraBandeja': vB,
    '_extraTicket': vTk,
    '_extraEstado': vE
    
  });

  cambiosPendientes.ingreso = n;
  cerrarModalEditarIngreso();

  renderDetalleModal({
    equipo: detalleActual.equipo,
    ingresos: buildPreviewIngresos(),
    salidas: buildPreviewSalidas(),
    detalleGeneral: buildPreviewDetalleGeneral()
  });
}

  function abrirModalEditarSalida() {
    var b=cambiosPendientes.salida||detalleActual.currentSalida||(detalleActual.salidas&&detalleActual.salidas[0])||{};
    var m=document.getElementById('modalEditarSalida'); if(!m) return; m.classList.add('active');
    setValue('editSalidaSerie',detalleActual.serie||''); setValue('editSalidaFecha',b['Fecha de Salida del Taller']||detalleActual.detalleGeneral.fechaSalida||''); setValue('editSalidaTecnico',b['Técnico responsable de reparación']||detalleActual.detalleGeneral.tecnicoReparacion||''); setValue('editSalidaProcedimiento',b['Procedimiento de Reparación']||''); setValue('editSalidaRepuestos',b['Repuestos Utilizados']||''); setValue('editSalidaFicha',b['Numero de Ficha de Salida']||detalleActual.detalleGeneral.fichaSalida||''); setValue('editSalidaHoraTermino',b['Hora de Termino de Reparación']||''); setValue('editSalidaConsumibles',b['Consumibles']||''); setValue('editSalidaHoraInicio',b['Hora de Inicio de Reparación']||'');
  }
  function cerrarModalEditarSalida() { var m=document.getElementById('modalEditarSalida'); if(m) m.classList.remove('active'); }

  function guardarSalidaTemporal() {
    var b=cambiosPendientes.salida||detalleActual.currentSalida||(detalleActual.salidas&&detalleActual.salidas[0])||{};
    var n=Object.assign({},b);
    var vS=getValue('editSalidaSerie'),vF=getValue('editSalidaFecha'),vT=getValue('editSalidaTecnico'),vP=getValue('editSalidaProcedimiento'),vR=getValue('editSalidaRepuestos'),vFi=getValue('editSalidaFicha'),vH=getValue('editSalidaHoraTermino'),vCon=getValue('editSalidaConsumibles'),vHI=getValue('editSalidaHoraInicio');
    Object.assign(n,{'Serie del Producto':vS,'Serie':vS,'Fecha de Salida del Taller':vF,'Fecha de salida':vF,'Fecha Salida':vF,'Fecha Final de Reparación':vF,'Técnico responsable de reparación':vT,'Tecnico responsable de reparación':vT,'Supervisor a cargo':vT,'Procedimiento de Reparación':vP,'Repuestos Utilizados':vR,'Numero de Ficha de Salida':vFi,'Ficha reparación':vFi,'Ficha de reparación':vFi,'Ficha Salida':vFi,'Hora de Termino de Reparación':vH,'Consumibles':vCon,'Hora de Inicio de Reparación':vHI});
    cambiosPendientes.salida=n; cerrarModalEditarSalida();
    renderDetalleModal({equipo:detalleActual.equipo,ingresos:buildPreviewIngresos(),salidas:buildPreviewSalidas(),detalleGeneral:buildPreviewDetalleGeneral()});
  }

  // =========================================
  // HELPERS
  // =========================================
  function buildBadge(status) { var s=String(status||'').toLowerCase(); var cls=s.includes('operativo')?'operativo':s.includes('listo')?'listo':'reparacion'; return '<span class="badge '+cls+'">'+safe(status||'-')+'</span>'; }
  function safe(v)         { return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
  function safeAttr(v)     { return String(v==null?'':v).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function escapeQuotes(v) { return String(v==null?'':v).replace(/\\/g,'\\\\').replace(/'/g,"\\'"); }
  function getValue(id)    { var el=document.getElementById(id); return el?el.value:''; }
  function setVal(id,v)    { var el=document.getElementById(id); if(el) el.value = (v === '-' ? '' : (v == null ? '' : v)); }
  function setValue(id,v)  { var el=document.getElementById(id); if(el) el.value=v==null?'':v; }
  function normalize_(v)   { return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim(); }
  function showError(e)    { console.error(e); document.getElementById('equiposBody').innerHTML='<tr><td colspan="11">Error al cargar datos.</td></tr>'; }
  function showErrorModal(e){ console.error(e); document.getElementById('modalContent').innerHTML='<div class="empty-state">Error al cargar detalle.</div>'; }
  function actualizarColorSelectEstado() {
    var select = document.getElementById('editIngresoEstado'); if(!select) return;
    var val = select.value.toLowerCase();
    select.style.backgroundColor='white'; select.style.color='#172b4d'; select.style.borderColor='#cbd5e1';
    if (val.includes('operativo'))  { select.style.backgroundColor='#dcfce7'; select.style.color='#166534'; select.style.borderColor='#dcfce7'; }
    else if (val.includes('listo')) { select.style.backgroundColor='#dbeafe'; select.style.color='#1d4ed8'; select.style.borderColor='#dbeafe'; }
    else if (val.includes('espera')||val.includes('reparacion')||val.includes('reparación')) { select.style.backgroundColor='#fef3c7'; select.style.color='#92400e'; select.style.borderColor='#fef3c7'; }
  }
  function cerrarEditModal() { var m=document.getElementById('editModal'); if(m) m.classList.remove('active'); }
  function guardarTemporalEdicion() {}

  // =========================================
  // SELECTOR DE FECHAS — EQUIPOS
  // =========================================
  function configurarSelectorFechas() {
    var iD=document.getElementById('input-desde'),iH=document.getElementById('input-hasta'),bD=document.getElementById('btn-desde'),bH=document.getElementById('btn-hasta'),bL=document.getElementById('btn-accion-limpiar'),bA=document.getElementById('btn-accion-aplicar');
    var af=function(e){var v=e.target.value.replace(/\D/g,'');if(v.length>=2)v=v.substring(0,2)+'/'+v.substring(2);if(v.length>=5)v=v.substring(0,5)+'/'+v.substring(5,9);e.target.value=v;};
    var pc=function(tipo,e){var nf=parsearFecha(e.target.value);if(nf){if(tipo==='desde'){fechaDesde=nf;if(fechaHasta&&fechaDesde>fechaHasta)fechaHasta=null;activarInput('hasta');}else{fechaHasta=nf;if(fechaDesde&&fechaHasta<fechaDesde){fechaDesde=fechaHasta;fechaHasta=null;}else activarInput('ninguno');}currentData=new Date(nf.getFullYear(),nf.getMonth(),1);renderCalendarios();abrirPopoverFechas();}else{if(tipo==='desde')fechaDesde=null;else fechaHasta=null;actualizarEstilosFechas();}};
    iD.addEventListener('input',af);iH.addEventListener('input',af);
    iD.addEventListener('change',function(e){pc('desde',e);});iH.addEventListener('change',function(e){pc('hasta',e);});
    bD.addEventListener('click',function(e){e.stopPropagation();activarInput('desde');abrirPopoverFechas();});
    bH.addEventListener('click',function(e){e.stopPropagation();activarInput('hasta');abrirPopoverFechas();});
    bL.addEventListener('click',function(){fechaDesde=null;fechaHasta=null;iD.value='';iH.value='';rangoFechasActual={desde:'',hasta:'',desdeISO:'',hastaISO:''};paginaActual=1;activarInput('desde');actualizarEstilosFechas();cerrarPopoverFechas();buscarEquipos();});
    bA.addEventListener('click',function(){if(!fechaDesde||!fechaHasta)return;rangoFechasActual.desde=formatearFecha(fechaDesde);rangoFechasActual.hasta=formatearFecha(fechaHasta);rangoFechasActual.desdeISO=toISODate(fechaDesde);rangoFechasActual.hastaISO=toISODate(fechaHasta);paginaActual=1;cerrarPopoverFechas();buscarEquipos();});
  }
  function abrirPopoverFechas()  { document.getElementById('rangePickerPopover').classList.remove('hidden'); }
  function cerrarPopoverFechas() { document.getElementById('rangePickerPopover').classList.add('hidden'); }
  function activarInput(tipo) { inputActivo=tipo;document.getElementById('btn-desde').classList.toggle('active',tipo==='desde');document.getElementById('btn-hasta').classList.toggle('active',tipo==='hasta');if(tipo!=='ninguno'){var el=document.getElementById('input-'+tipo);if(el)el.focus();esperandoHasta=(tipo==='hasta');}else esperandoHasta=false; }
  function renderCalendarios() { var m=currentData.getMonth(),y=currentData.getFullYear(),sig=new Date(y,m+1,1);document.getElementById('month-left-name').innerText=meses[m]+' '+y;document.getElementById('month-right-name').innerText=meses[sig.getMonth()]+' '+sig.getFullYear();dibujarMes('grid-left',m,y);dibujarMes('grid-right',sig.getMonth(),sig.getFullYear());actualizarEstilosFechas(); }
  function dibujarMes(id,mes,anio){var grid=document.getElementById(id);grid.innerHTML='';['Lu','Ma','Mi','Ju','Vi','Sá','Do'].forEach(function(d){var div=document.createElement('div');div.className='day-name';div.innerText=d;grid.appendChild(div);});var pd=new Date(anio,mes,1).getDay(),of2=pd===0?6:pd-1,dias=new Date(anio,mes+1,0).getDate();for(var i=0;i<of2;i++){var e=document.createElement('div');e.className='day empty';grid.appendChild(e);}for(var d=1;d<=dias;d++){var el=document.createElement('div');el.className='day';el.innerText=d;var t=new Date(anio,mes,d);(function(tt){el.onclick=function(){seleccionarFecha(tt);};})(t);(function(tt){el.onmouseenter=function(){if(fechaDesde&&!fechaHasta&&esperandoHasta){fechaHover=tt;actualizarEstilosFechas();}};})(t);el.setAttribute('data-time',t.getTime());grid.appendChild(el);}}
  function seleccionarFecha(date){if(!esperandoHasta||(fechaDesde&&fechaHasta)||!fechaDesde){fechaDesde=date;fechaHasta=null;activarInput('hasta');}else{if(date.getTime()===fechaDesde.getTime()){fechaDesde=date;fechaHasta=null;}else if(date<fechaDesde){fechaDesde=date;fechaHasta=null;}else{fechaHasta=date;activarInput('ninguno');}}fechaHover=null;actualizarEstilosFechas();}
  function cambiarMes(n){currentData.setMonth(currentData.getMonth()+n);renderCalendarios();}
  function actualizarEstilosFechas(){var iD=document.getElementById('input-desde'),iH=document.getElementById('input-hasta'),bA=document.getElementById('btn-accion-aplicar');if(document.activeElement!==iD)iD.value=formatearFecha(fechaDesde);if(document.activeElement!==iH)iH.value=formatearFecha(fechaHasta);bA.disabled=!(fechaDesde&&fechaHasta);var tD=fechaDesde?fechaDesde.getTime():null,tH2=fechaHasta?fechaHasta.getTime():null,tHov=fechaHover?fechaHover.getTime():null;document.querySelectorAll('#rangePickerPopover .day[data-time]').forEach(function(el){var t=parseInt(el.getAttribute('data-time'),10);el.classList.remove('selected','in-range');if(t===tD||t===tH2)el.classList.add('selected');if(tD){if(tH2){if(t>tD&&t<tH2)el.classList.add('in-range');}else if(tHov&&tHov>tD){if(t>tD&&t<=tHov)el.classList.add('in-range');}}});}
  function formatearFecha(date){if(!date)return'';return String(date.getDate()).padStart(2,'0')+'/'+String(date.getMonth()+1).padStart(2,'0')+'/'+date.getFullYear();}
  function toISODate(date){if(!date)return'';return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');}
  function parsearFecha(str){var p=String(str||'').split('/');if(p.length===3){var d2=+p[0],m2=+p[1]-1,y2=+p[2],dt=new Date(y2,m2,d2);if(dt.getFullYear()===y2&&dt.getMonth()===m2&&dt.getDate()===d2)return dt;}return null;}

  // =========================================
  // SELECTOR DE FECHAS — DASHBOARD
  // =========================================
  function configurarDashSelectorFechas(){
    var iD=document.getElementById('dash-input-desde'),iH=document.getElementById('dash-input-hasta'),bD=document.getElementById('dash-btn-desde'),bH=document.getElementById('dash-btn-hasta'),bA=document.getElementById('dash-btn-aplicar'),bL=document.getElementById('dash-btn-limpiar');
    if(!iD) return;
    var af=function(e){var v=e.target.value.replace(/\D/g,'');if(v.length>=2)v=v.substring(0,2)+'/'+v.substring(2);if(v.length>=5)v=v.substring(0,5)+'/'+v.substring(5,9);e.target.value=v;};
    var pc=function(tipo,e){var nf=parsearFecha(e.target.value);if(nf){if(tipo==='desde'){dashFechaDesde=nf;if(dashFechaHasta&&dashFechaDesde>dashFechaHasta)dashFechaHasta=null;dashActivarInput('hasta');}else{dashFechaHasta=nf;if(dashFechaDesde&&dashFechaHasta<dashFechaDesde){dashFechaDesde=dashFechaHasta;dashFechaHasta=null;}else dashActivarInput('ninguno');}dashCurrentData=new Date(nf.getFullYear(),nf.getMonth(),1);dashRenderCalendarios();dashAbrirPopover();}else{if(tipo==='desde')dashFechaDesde=null;else dashFechaHasta=null;dashActualizarEstilos();}};
    iD.addEventListener('input',af);iH.addEventListener('input',af);
    iD.addEventListener('change',function(e){pc('desde',e);});iH.addEventListener('change',function(e){pc('hasta',e);});
    bD.addEventListener('click',function(e){e.stopPropagation();dashActivarInput('desde');dashAbrirPopover();});
    bH.addEventListener('click',function(e){e.stopPropagation();dashActivarInput('hasta');dashAbrirPopover();});
    bL.addEventListener('click',function(){ dashFechaDesde=null;dashFechaHasta=null;iD.value='';iH.value=''; dashRangoFechasActual={desde:'',hasta:'',desdeISO:'',hastaISO:''}; dashActivarInput('desde');dashActualizarEstilos();dashCerrarPopover(); loadDashboard(); });
    bA.addEventListener('click',function(){ if(!dashFechaDesde||!dashFechaHasta) return; dashRangoFechasActual.desde=formatearFecha(dashFechaDesde);dashRangoFechasActual.hasta=formatearFecha(dashFechaHasta); dashRangoFechasActual.desdeISO=toISODate(dashFechaDesde);dashRangoFechasActual.hastaISO=toISODate(dashFechaHasta); dashCerrarPopover(); loadDashboard(); });
  }
  function dashAbrirPopover()  { var el=document.getElementById('dashRangePickerPopover'); if(el) el.classList.remove('hidden'); }
  function dashCerrarPopover() { var el=document.getElementById('dashRangePickerPopover'); if(el) el.classList.add('hidden'); }
  function dashActivarInput(tipo){dashEsperandoHasta=(tipo==='hasta');var bd=document.getElementById('dash-btn-desde'),bh=document.getElementById('dash-btn-hasta');if(bd)bd.classList.toggle('active',tipo==='desde');if(bh)bh.classList.toggle('active',tipo==='hasta');if(tipo!=='ninguno'){var el=document.getElementById('dash-input-'+tipo);if(el)el.focus();}}
  function dashRenderCalendarios(){var m=dashCurrentData.getMonth(),y=dashCurrentData.getFullYear(),sig=new Date(y,m+1,1);document.getElementById('dash-month-left-name').innerText=meses[m]+' '+y;document.getElementById('dash-month-right-name').innerText=meses[sig.getMonth()]+' '+sig.getFullYear();dashDibujarMes('dash-grid-left',m,y);dashDibujarMes('dash-grid-right',sig.getMonth(),sig.getFullYear());dashActualizarEstilos();}
  function dashDibujarMes(id,mes,anio){var grid=document.getElementById(id);if(!grid)return;grid.innerHTML='';['Lu','Ma','Mi','Ju','Vi','Sá','Do'].forEach(function(d){var div=document.createElement('div');div.className='day-name';div.innerText=d;grid.appendChild(div);});var pd=new Date(anio,mes,1).getDay(),of2=pd===0?6:pd-1,dias=new Date(anio,mes+1,0).getDate();for(var i=0;i<of2;i++){var e=document.createElement('div');e.className='day empty';grid.appendChild(e);}for(var d=1;d<=dias;d++){var el=document.createElement('div');el.className='day';el.innerText=d;var t=new Date(anio,mes,d);(function(tt){el.onclick=function(){dashSeleccionarFecha(tt);};})(t);(function(tt){el.onmouseenter=function(){if(dashFechaDesde&&!dashFechaHasta&&dashEsperandoHasta){dashFechaHover=tt;dashActualizarEstilos();}};})(t);el.setAttribute('data-time',t.getTime());grid.appendChild(el);}}
  function dashSeleccionarFecha(date){if(!dashEsperandoHasta||(dashFechaDesde&&dashFechaHasta)||!dashFechaDesde){dashFechaDesde=date;dashFechaHasta=null;dashActivarInput('hasta');}else{if(date.getTime()===dashFechaDesde.getTime()){dashFechaDesde=date;dashFechaHasta=null;}else if(date<dashFechaDesde){dashFechaDesde=date;dashFechaHasta=null;}else{dashFechaHasta=date;dashActivarInput('ninguno');}}dashFechaHover=null;dashActualizarEstilos();}
  function dashCambiarMes(n){dashCurrentData.setMonth(dashCurrentData.getMonth()+n);dashRenderCalendarios();}
  function dashActualizarEstilos(){var iD=document.getElementById('dash-input-desde'),iH=document.getElementById('dash-input-hasta'),bA=document.getElementById('dash-btn-aplicar');if(!iD)return;if(document.activeElement!==iD)iD.value=formatearFecha(dashFechaDesde);if(document.activeElement!==iH)iH.value=formatearFecha(dashFechaHasta);if(bA)bA.disabled=!(dashFechaDesde&&dashFechaHasta);var tD=dashFechaDesde?dashFechaDesde.getTime():null,tH2=dashFechaHasta?dashFechaHasta.getTime():null,tHov=dashFechaHover?dashFechaHover.getTime():null;document.querySelectorAll('#dashRangePickerPopover .day[data-time]').forEach(function(el){var t=parseInt(el.getAttribute('data-time'),10);el.classList.remove('selected','in-range');if(t===tD||t===tH2)el.classList.add('selected');if(tD){if(tH2){if(t>tD&&t<tH2)el.classList.add('in-range');}else if(tHov&&tHov>tD){if(t>tD&&t<=tHov)el.classList.add('in-range');}}});}


var _kpiHorasSegmento = 'global';

function setKpiHorasSegmento(segmento, btn) {
  _kpiHorasSegmento = segmento || 'global';

  document.querySelectorAll('#kpiHorasSegmentTabs .search-tab').forEach(function(t) {
    t.classList.remove('active');
  });

  if (btn) btn.classList.add('active');

  renderDashActiveFilters();
  renderActiveFilters();
  loadKpiHorasReparacion();
}

function loadKpiHorasReparacion() {
  var container = document.getElementById('tiemposReparacionBody');
  if (!container) return;

  _kpiHorasRequestId++;
  var requestId = _kpiHorasRequestId;

  container.innerHTML = htmlDashboardCargador;

  if (_kpiHorasTrendChart) {
    _kpiHorasTrendChart.destroy();
    _kpiHorasTrendChart = null;
  }

  var rango = dashRangoFechasActual && dashRangoFechasActual.desdeISO
    ? { desdeISO: dashRangoFechasActual.desdeISO, hastaISO: dashRangoFechasActual.hastaISO }
    : null;

  google.script.run
    .withSuccessHandler(function(data) {
      if (requestId !== _kpiHorasRequestId) return;
      renderKpiHorasReparacion(data);
    })
    .withFailureHandler(function(err) {
      if (requestId !== _kpiHorasRequestId) return;
      container.innerHTML =
        '<div class="empty-state">Error calculando tiempos: ' +
        safe((err && err.message) ? err.message : err) +
        '</div>';
    })
    .getKpiHorasReparacion(rango, _kpiHorasSegmento);
}

function renderKpiHorasReparacion(data) {
  var container = document.getElementById('tiemposReparacionBody');
  if (!container) return;

  data = data || {};

  var promedio = data.promedioHoras || 0;
  var total = data.totalEquipos || 0;
  var modelos = data.porModelo || [];
  var tendencia = data.tendenciaMensual || [];

  var segmentoLabel = {
    global: 'Global',
    clientes: 'Clientes',
    eden: 'Eden Agua'
  }[data.segmento || _kpiHorasSegmento] || 'Global';

  var periodoLabel = data.desde && data.hasta
    ? data.desde + ' al ' + data.hasta
    : 'Sin rango aplicado';

  if (!total) {
    container.innerHTML =
      '<div class="empty-state">Sin reparaciones con hora de inicio y término para ' +
      safe(segmentoLabel) +
      ' en el periodo seleccionado.</div>';
    return;
  }

  var maxEquipos = modelos.reduce(function(max, item) {
    return Math.max(max, item.totalEquipos || 0);
  }, 1);

  function renderModelo(item) {
    var pct = Math.max(4, Math.round((item.totalEquipos || 0) * 100 / maxEquipos));

    return '<div style="display:grid;grid-template-columns:120px 1fr 52px 70px;gap:8px;align-items:center;padding:7px 0;border-bottom:0.5px solid var(--border-soft);">' +
      '<div style="font-size:12px;font-weight:700;color:var(--text-main);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="' + safe(item.modelo) + '">' +
        safe(item.modelo) +
      '</div>' +
      '<div style="height:6px;background:var(--bg-soft);border-radius:999px;overflow:hidden;">' +
        '<div style="width:' + pct + '%;height:6px;background:var(--text-main);border-radius:999px;"></div>' +
      '</div>' +
      '<div style="font-size:12px;font-weight:800;font-family:\'DM Mono\',monospace;text-align:right;">' + item.totalEquipos + '</div>' +
      '<div style="font-size:11px;font-weight:700;color:var(--text-muted);font-family:\'DM Mono\',monospace;text-align:right;">' + item.promedioHoras + ' h</div>' +
    '</div>';
  }

  var mitad = Math.ceil(modelos.length / 2);
  var col1 = modelos.slice(0, mitad).map(renderModelo).join('');
  var col2 = modelos.slice(mitad).map(renderModelo).join('');

  container.innerHTML =
    '<div style="display:grid;grid-template-columns:210px minmax(0,0.9fr) minmax(420px,1.1fr);gap:20px;align-items:start;">' +

      '<div style="background:var(--bg-soft);border:0.5px solid var(--border-soft);border-radius:var(--radius-md);padding:16px 18px;">' +
        '<div style="font-size:9px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;">Promedio general</div>' +
        '<div style="font-size:34px;font-weight:800;font-family:\'DM Mono\',monospace;color:var(--text-main);line-height:1;">' + promedio + '</div>' +
        '<div style="font-size:12px;color:var(--text-muted);margin-top:6px;">horas promedio</div>' +
        '<div style="height:1px;background:var(--border-soft);margin:12px 0;"></div>' +
        '<div style="font-size:11px;color:var(--text-muted);line-height:1.55;">' +
          '<strong>Segmento:</strong> ' + safe(segmentoLabel) + '<br>' +
          '<strong>Periodo:</strong> ' + safe(periodoLabel) + '<br>' +
          '<strong>Criterio:</strong> Salida dentro del periodo<br>' +
          '<strong>Base:</strong> Reporte Taller<br>' +
          '<strong>Equipos:</strong> ' + total +
        '</div>' +
      '</div>' +

      '<div style="min-width:0;">' +
        '<div style="font-size:9px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:3px;">Modelos por cantidad de equipos</div>' +
        '<div style="font-size:11px;color:var(--text-faint);margin-bottom:8px;">Ordenado de mayor a menor. La última columna muestra horas promedio.</div>' +
        '<div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:18px;">' +
          '<div>' + col1 + '</div>' +
          '<div>' + col2 + '</div>' +
        '</div>' +
      '</div>' +

      '<div style="min-width:0;background:#fff;border:0.5px solid var(--border-soft);border-radius:var(--radius-md);padding:14px;">' +
        '<div style="font-size:9px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:3px;">Promedio mensual anual</div>' +
        '<div style="font-size:11px;color:var(--text-faint);margin-bottom:10px;">Horas promedio de atención por mes.</div>' +
        '<div style="height:300px;position:relative;">' +
          '<canvas id="kpiHorasTrendChart"></canvas>' +
        '</div>' +
      '</div>' +

    '</div>';

  renderKpiHorasTrendChart(tendencia);
}
var _kpiHorasTrendChart = null;
var _kpiHorasRequestId = 0;
function renderKpiHorasTrendChart(tendencia) {
  var canvas = document.getElementById('kpiHorasTrendChart');
  if (!canvas || typeof Chart === 'undefined') return;

  if (_kpiHorasTrendChart) {
    _kpiHorasTrendChart.destroy();
    _kpiHorasTrendChart = null;
  }

  tendencia = tendencia || [];

  var pointLabelPlugin = {
    id: 'kpiHorasPointLabels',
    afterDatasetsDraw: function(chart) {
      var ctx = chart.ctx;
      var meta = chart.getDatasetMeta(0);
      var data = chart.data.datasets[0].data || [];
      var chartArea = chart.chartArea;

      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.font = '700 10px DM Mono, monospace';
      ctx.fillStyle = '#0d0d0c';

      meta.data.forEach(function(point, index) {
        var value = Number(data[index] || 0);
        if (!value) return;

        var x = point.x;
        var y = point.y - 10;

        if (y < chartArea.top + 12) {
          y = point.y + 18;
          ctx.textBaseline = 'top';
        } else {
          ctx.textBaseline = 'bottom';
        }

        if (index === 0) x += 8;
        if (index === data.length - 1) x -= 8;

        ctx.fillText(value + ' h', x, y);
      });

      ctx.restore();
    }
  };

  var equiposFooterPlugin = {
    id: 'kpiHorasEquiposFooter',
    afterDraw: function(chart) {
      var ctx = chart.ctx;
      var xScale = chart.scales.x;
      var chartArea = chart.chartArea;

      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      tendencia.forEach(function(item, index) {
        var x = xScale.getPixelForValue(index);
        var y = chartArea.bottom + 26;

        ctx.font = '700 10px DM Mono, monospace';
        ctx.fillStyle = '#0d0d0c';
        ctx.fillText(String(item.totalEquipos || 0), x, y);

        ctx.font = '500 9px DM Sans, sans-serif';
        ctx.fillStyle = '#9ca3af';
        ctx.fillText('eq.', x, y + 13);
      });

      ctx.restore();
    }
  };

  _kpiHorasTrendChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: tendencia.map(function(i) { return i.mes; }),
      datasets: [{
        label: 'Horas promedio',
        data: tendencia.map(function(i) { return i.promedioHoras || 0; }),
        borderColor: '#0d0d0c',
        backgroundColor: function(context) {
          var chart = context.chart;
          var chartArea = chart.chartArea;
          if (!chartArea) return 'rgba(13,13,12,.06)';

          var gradient = chart.ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(13,13,12,.13)');
          gradient.addColorStop(1, 'rgba(13,13,12,.015)');
          return gradient;
        },
        borderWidth: 2,
        tension: 0.38,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#0d0d0c',
        pointBorderWidth: 2,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 24,
          right: 18,
          bottom: 38,
          left: 4
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0d0d0c',
          padding: 10,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            title: function(items) {
              return items && items[0] ? items[0].label : '';
            },
            label: function(ctx) {
              var item = tendencia[ctx.dataIndex] || {};
              return ctx.parsed.y + ' h promedio · ' + (item.totalEquipos || 0) + ' equipos';
            }
          }
        }
      },
      scales: {
        x: {
          offset: true,
          grid: { display: false },
          border: { display: false },
          ticks: {
            padding: 8,
            font: { family: 'DM Sans', size: 10 },
            color: '#6b7280'
          }
        },
        y: {
          beginAtZero: true,
          grace: '18%',
          grid: {
            color: '#eeeeec',
            drawBorder: false
          },
          border: { display: false },
          ticks: {
            padding: 8,
            font: { family: 'DM Mono', size: 10 },
            color: '#9ca3af'
          }
        }
      }
    },
    plugins: [pointLabelPlugin, equiposFooterPlugin]
  });
}
  // =========================================
  // CONTROL DE CALIDAD — JS
  // =========================================
  var CC_TIPOS_COLORES = { 'Alquiler':{bg:'#dbeafe',color:'#1d4ed8'},'Venta Exhibición':{bg:'#f0fdf4',color:'#15803d'},'Venta Nueva':{bg:'#dcfce7',color:'#166634'},'Back Up':{bg:'#fef3c7',color:'#92400e'},'Remate':{bg:'#fee2e2',color:'#b91c1c'},'De Baja':{bg:'#f1f5f9',color:'#475569'},'Cliente':{bg:'#fdf4ff',color:'#7e22ce'} };
  var CC_TIPOS_LISTA = ['Alquiler','Venta Exhibición','Venta Nueva','Back Up','Remate','De Baja','Cliente'];
  var CC_ESTADOS_PROD_COLORES = { 'Excelente':{bg:'#dcfce7',color:'#166534',dot:'#16a34a'},'Bueno':{bg:'#dbeafe',color:'#1d4ed8',dot:'#2563eb'},'Regular':{bg:'#fef3c7',color:'#92400e',dot:'#d97706'},'Malo':{bg:'#fee2e2',color:'#b91c1c',dot:'#dc2626'} };
  var CC_ESTADOS_PROD_LISTA = ['Excelente','Bueno','Regular','Malo'];
  var _ccEquipoActual = null, _ccTipoSeleccionado = '', _ccEstadoProductoSeleccionado = '', _ccArchivosNuevos = [], _ccRegistrosExistentes = [];

  function ccSetSearchMode(mode, btn) {
    document.querySelectorAll('#ccSearchModeTabs .search-tab').forEach(function(t) { t.classList.remove('active'); }); btn.classList.add('active');
    var placeholders = { ambas_fichas:'Ingrese N° de Ficha de Ingreso o Salida...', ficha_ingreso:'Ingrese N° de Ficha de Ingreso...', ficha_salida:'Ingrese N° de Ficha de Salida...', serie:'Ingrese N° de Serie del equipo...' };
    var input = document.getElementById('ccSearchInput');
    if (input) { input.placeholder = placeholders[mode] || 'Buscar...'; input.dataset.mode = mode; input.value = ''; input.focus(); }
  }

  function ccBuscar() {
    var input = document.getElementById('ccSearchInput'), query = (input ? input.value : '').trim();
    var activeTab = document.querySelector('#ccSearchModeTabs .search-tab.active'), mode = activeTab ? activeTab.dataset.mode : 'ambas_fichas';
    if (!query) return;
    document.getElementById('ccInfoStrip').style.display='none'; document.getElementById('ccNoResultado').style.display='none'; document.getElementById('ccFormGrid').style.display='none';
    _ccEquipoActual=null; _ccArchivosNuevos=[];
    var btn=document.querySelector('#calidad .btn-buscar-pro'), orig=btn?btn.innerHTML:'';
    if(btn){btn.innerHTML='Buscando...';btn.disabled=true;}
    google.script.run
      .withSuccessHandler(function(data){if(btn){btn.innerHTML=orig;btn.disabled=false;}if(!data||(!data.equipo&&(!data.ingresos||!data.ingresos.length)&&(!data.salidas||!data.salidas.length))){document.getElementById('ccNoResultado').style.display='block';return;}_ccEquipoActual=data;ccMostrarFormulario(data);})
      .withFailureHandler(function(e){if(btn){btn.innerHTML=orig;btn.disabled=false;}document.getElementById('ccNoResultado').style.display='block';})
      .buscarEquipoCC(query,mode);
  }

  // =========================================
  // ← FUNCIÓN MODIFICADA: ccMostrarFormulario
  // Pre-carga Devolver a: y Estado del Producto
  // desde el Reporte Taller automáticamente
  // =========================================
  function ccMostrarFormulario(data) {
    var eq=data.equipo, ing=data.currentIngreso||(data.ingresos&&data.ingresos[0])||{}, dg=data.detalleGeneral||{};
    var serie=eq?(eq['Nro Serie']||eq['N° Serie']||eq['Serie']||'-'):(ing['Serie del Producto']||'-');
    var modelo=eq?(eq['Modelo']||'-'):(ing['Modelo']||'-'), cliente=eq?(eq['Cliente']||'-'):(ing['Cliente o Eden Agua']||'-'), estado=eq?(eq['Status']||eq['Estado']||'-'):'-';
    var strip=document.getElementById('ccInfoStrip');
    strip.innerHTML='<span style="font-weight:700;color:var(--blue-main);">'+safe(serie)+'</span><span style="color:var(--text-muted);margin:0 6px;">·</span><span>'+safe(modelo)+'</span><span style="color:var(--text-muted);margin:0 6px;">·</span><span>'+safe(cliente)+'</span><span style="color:var(--text-muted);margin:0 6px;">·</span>'+buildBadge(estado);
    strip.style.display='flex';
    document.getElementById('cc_serie_display').textContent=serie;
    document.getElementById('cc_modelo_display').textContent=modelo;
    document.getElementById('cc_cliente_display').textContent=cliente;
    document.getElementById('cc_estado_display').innerHTML=buildBadge(estado);
    document.getElementById('cc_fichaIng_display').textContent=dg.fichaIngreso||'-';
    document.getElementById('cc_fichaSal_display').textContent=dg.fichaSalida||'-';

    // ── Pre-cargar Clasificación y Estado del Producto desde Reporte Taller ──
    var devolverReporte = '';
    if (eq) {
      var dRaw = String(eq['Devolver a:'] || eq['Devolver a'] || '').trim();
      if (dRaw && dRaw !== '-') devolverReporte = dRaw;
    }
    var estadoProdReporte = '';
    if (eq) {
      var eRaw = String(eq['Estado del Producto'] || eq['Estado Producto'] || eq['Estado del producto'] || '').trim();
      if (eRaw && eRaw !== '-') estadoProdReporte = eRaw;
    }
    // ─────────────────────────────────────────────────────────────────────────

    _ccTipoSeleccionado = devolverReporte;
    _ccEstadoProductoSeleccionado = estadoProdReporte;
    ccRenderTipos();
    ccRenderEstadosProd();
    _ccArchivosNuevos=[];
    document.getElementById('cc_filesPreview').innerHTML='';
    document.getElementById('cc_filesGuardados').innerHTML='';
    document.getElementById('cc_comentario').value='';
    ccCargarHistorial(serie);
    document.getElementById('ccFormGrid').style.display='block';
  }

  function ccRenderTipos() {
    var container=document.getElementById('cc_tipo_options');
    container.innerHTML=CC_TIPOS_LISTA.map(function(tipo){var col=CC_TIPOS_COLORES[tipo]||{bg:'#f1f5f9',color:'#475569'};var activo=_ccTipoSeleccionado===tipo;return '<label style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:var(--radius-md);border:1.5px solid '+(activo?col.color:'var(--border-soft)')+';background:'+(activo?col.bg:'#fff')+';cursor:pointer;transition:all .15s;font-size:13px;font-weight:'+(activo?'700':'500')+';color:'+(activo?col.color:'var(--text-main)')+';"><input type="radio" name="cc_tipo" value="'+safe(tipo)+'" '+(activo?'checked':'')+' style="display:none;" onchange="ccTipoChange(\''+safe(tipo)+'\')"><span style="width:12px;height:12px;border-radius:50%;background:'+col.color+';flex-shrink:0;opacity:'+(activo?1:0.3)+';"></span>'+safe(tipo)+'</label>';}).join('');
  }

  function ccRenderEstadosProd() {
    var container=document.getElementById('cc_estado_prod_options'); if(!container) return;
    container.innerHTML=CC_ESTADOS_PROD_LISTA.map(function(est){var col=CC_ESTADOS_PROD_COLORES[est]||{bg:'#f1f5f9',color:'#475569',dot:'#94a3b8'};var activo=_ccEstadoProductoSeleccionado===est;return '<label style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:var(--radius-md);border:1.5px solid '+(activo?col.color:'var(--border-soft)')+';background:'+(activo?col.bg:'#fff')+';cursor:pointer;transition:all .15s;font-size:13px;font-weight:'+(activo?'700':'500')+';color:'+(activo?col.color:'var(--text-main)')+';"><input type="radio" name="cc_estado_prod" value="'+safe(est)+'" '+(activo?'checked':'')+' style="display:none;" onchange="ccEstadoProdChange(\''+safe(est)+'\')"><span style="width:12px;height:12px;border-radius:50%;background:'+col.dot+';flex-shrink:0;opacity:'+(activo?1:0.4)+';"></span>'+safe(est)+'</label>';}).join('');
  }

  function ccEstadoProdChange(est) { _ccEstadoProductoSeleccionado=est; ccRenderEstadosProd(); }
  function ccGetCampo_(reg,nombres){for(var i=0;i<nombres.length;i++){if(reg[nombres[i]]!==undefined&&reg[nombres[i]]!=='')return reg[nombres[i]];}return '';}

  function ccTipoChange(tipo) {
    _ccTipoSeleccionado=tipo; ccRenderTipos();
    var existente=_ccRegistrosExistentes.filter(function(r){return r['Tipo']===tipo;})[0];
    if(existente){document.getElementById('cc_comentario').value=ccGetCampo_(existente,['Comentario','comentario','COMENTARIO']);var estProd=ccGetCampo_(existente,['Estado Producto','Estado producto','estado producto','EstadoProducto','estado_producto']);if(estProd){_ccEstadoProductoSeleccionado=estProd;ccRenderEstadosProd();}else{_ccEstadoProductoSeleccionado='';ccRenderEstadosProd();}ccMostrarArchivosGuardados(existente);}
    else{document.getElementById('cc_comentario').value='';_ccEstadoProductoSeleccionado='';ccRenderEstadosProd();document.getElementById('cc_filesGuardados').innerHTML='';}
  }

  function ccCargarHistorial(serie) {
    _ccRegistrosExistentes=[]; var histEl=document.getElementById('cc_historial'); if(histEl) histEl.style.display='none';
    google.script.run
      .withSuccessHandler(function(registros){
        _ccRegistrosExistentes=registros||[];
        if(_ccRegistrosExistentes.length>0){
          ccRenderHistorial(_ccRegistrosExistentes);
          var primero=_ccRegistrosExistentes[0];
          // Solo sobreescribir si NO hay ya un valor pre-cargado del Reporte
          if(primero&&primero['Tipo']&&!_ccTipoSeleccionado){
            _ccTipoSeleccionado=primero['Tipo'];
            ccRenderTipos();
            document.getElementById('cc_comentario').value=ccGetCampo_(primero,['Comentario','comentario']);
            var estProd=ccGetCampo_(primero,['Estado Producto','Estado producto','estado producto','EstadoProducto']);
            if(estProd){_ccEstadoProductoSeleccionado=estProd;}
            ccRenderEstadosProd();
            ccMostrarArchivosGuardados(primero);
          } else if(primero&&primero['Tipo']&&_ccTipoSeleccionado) {
            // Ya hay tipo pre-cargado, buscar su registro en CC para mostrar archivos y comentario
            var regActual=_ccRegistrosExistentes.filter(function(r){return r['Tipo']===_ccTipoSeleccionado;})[0];
            if(regActual){
              document.getElementById('cc_comentario').value=ccGetCampo_(regActual,['Comentario','comentario']);
              var estProdActual=ccGetCampo_(regActual,['Estado Producto','Estado producto','estado producto','EstadoProducto']);
              if(estProdActual){_ccEstadoProductoSeleccionado=estProdActual;ccRenderEstadosProd();}
              ccMostrarArchivosGuardados(regActual);
            }
          }
        }
      })
      .withFailureHandler(function(e){console.error('Error CC historial:',e);})
      .getCCPorSerie(serie);
  }

  function ccRenderHistorial(registros) {
    var hist=document.getElementById('cc_historial'),body=document.getElementById('cc_historial_body'); hist.style.display='block';
    body.innerHTML=registros.map(function(r){var tipo=r['Tipo']||'-';var estProd=ccGetCampo_(r,['Estado Producto','Estado producto','estado producto']);var comentario=ccGetCampo_(r,['Comentario','comentario']);var archStr=ccGetCampo_(r,['Archivos','archivos']);var fechaReg=ccGetCampo_(r,['Fecha Registro','Fecha registro','fecha registro'])||'-';var col=CC_TIPOS_COLORES[tipo]||{bg:'#f1f5f9',color:'#475569'};var colEst=CC_ESTADOS_PROD_COLORES[estProd]||null;var archivos=[];try{archivos=JSON.parse(archStr||'[]');}catch(e2){}var badgeEst=colEst?'<span style="padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;background:'+colEst.bg+';color:'+colEst.color+';">'+safe(estProd)+'</span>':'';return '<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border-soft);flex-wrap:wrap;"><span style="padding:4px 12px;border-radius:999px;font-size:12px;font-weight:700;background:'+col.bg+';color:'+col.color+';">'+safe(tipo)+'</span>'+badgeEst+'<span style="font-size:12px;color:var(--text-muted);">'+safe(fechaReg)+'</span><span style="font-size:13px;flex:1;color:var(--text-main);">'+safe(comentario)+'</span><span style="font-size:12px;color:var(--text-muted);">'+archivos.length+' archivo(s)</span><button class="secondary-btn" style="padding:6px 14px;font-size:12px;" onclick="ccCargarRegistro(\''+safe(tipo)+'\')">Editar</button></div>';}).join('')||'<div class="empty-state">Sin registros CC previos</div>';
  }

  function ccCargarRegistro(tipo) { _ccTipoSeleccionado=tipo; ccRenderTipos(); var reg=_ccRegistrosExistentes.filter(function(r){return r['Tipo']===tipo;})[0]; if(reg){document.getElementById('cc_comentario').value=ccGetCampo_(reg,['Comentario','comentario']);_ccEstadoProductoSeleccionado=ccGetCampo_(reg,['Estado Producto','Estado producto','estado producto'])||'';ccRenderEstadosProd();ccMostrarArchivosGuardados(reg);} }

  function ccMostrarArchivosGuardados(registro) {
    var container=document.getElementById('cc_filesGuardados');
    if(!registro){container.innerHTML='';return;}
    var archStr=ccGetCampo_(registro,['Archivos','archivos','ARCHIVOS']);
    var archivos=[];try{archivos=JSON.parse(archStr||'[]');}catch(e2){}
    if(!archivos.length){container.innerHTML='<div style="color:var(--text-faint);font-size:12px;padding:8px 0;">Sin archivos adjuntos para este registro</div>';return;}
    var regId=ccGetCampo_(registro,['ID','Id','id'])||'';
    container.innerHTML='<div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px;">Archivos guardados en Drive</div><div style="display:flex;flex-wrap:wrap;gap:12px;">'+
    archivos.map(function(arch){
      var esImagen=/\.(jpg|jpeg|png|webp|gif)$/i.test(arch.nombre||''),esVideo=/\.(mp4|mov|avi|mkv)$/i.test(arch.nombre||'');
      var preview;
      if(esImagen&&arch.id){preview='<div style="height:90px;background:var(--bg-soft);display:flex;align-items:center;justify-content:center;cursor:pointer;overflow:hidden;" onclick="abrirCCVisorPorId(\''+safe(arch.id)+'\',\''+safe(arch.nombre)+'\',\''+safe(arch.url)+'\')"><img id="thumb_'+safe(arch.id)+'" src="" style="width:100%;height:100%;object-fit:cover;display:none;" onload="this.style.display=\'block\';this.parentNode.querySelector(\'.cc-icon-load\').style.display=\'none\';"><span class="cc-icon-load" style="font-size:28px;">🖼️</span></div>';}
      else if(esVideo){preview='<div style="height:90px;background:var(--bg-soft);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:32px;" onclick="abrirCCVisorPorId(\''+safe(arch.id)+'\',\''+safe(arch.nombre)+'\',\''+safe(arch.url)+'\')">🎬</div>';}
      else{preview='<div style="height:90px;background:var(--bg-soft);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:32px;" onclick="window.open(\''+safe(arch.url)+'\',\'_blank\')">📄</div>';}
      return '<div style="width:130px;border:1px solid var(--border-soft);border-radius:var(--radius-md);overflow:hidden;background:#fff;position:relative;" class="cc-file-card">'+preview+'<div style="padding:6px 8px;"><div style="font-size:10px;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="'+safe(arch.nombre)+'">'+safe(arch.nombre)+'</div><div style="display:flex;gap:4px;margin-top:4px;"><a href="'+safe(arch.url)+'" target="_blank" style="font-size:10px;color:var(--blue-main);text-decoration:none;">Drive</a><span style="color:var(--text-faint);">·</span><span style="font-size:10px;color:var(--red-main);cursor:pointer;" onclick="ccEliminarArchivo(\''+safe(regId)+'\',\''+safe(arch.id||'')+'\',this)">Eliminar</span></div></div></div>';
    }).join('')+'</div>';
    archivos.forEach(function(arch){if(/\.(jpg|jpeg|png|webp|gif)$/i.test(arch.nombre||'')&&arch.id){var imgEl=document.getElementById('thumb_'+arch.id);if(!imgEl)return;var thumbUrl=arch.thumb||('https://drive.google.com/thumbnail?id='+arch.id+'&sz=w400');imgEl.src=thumbUrl;var timeout=setTimeout(function(){if(!imgEl.complete||imgEl.naturalWidth===0){ccCargarImagenProxy(arch.id,imgEl);}},2000);imgEl.onload=function(){clearTimeout(timeout);};imgEl.onerror=function(){clearTimeout(timeout);ccCargarImagenProxy(arch.id,imgEl);};}});
  }

  function ccCargarImagenProxy(fileId,imgEl){google.script.run.withSuccessHandler(function(res){if(res&&res.ok&&imgEl){imgEl.src=res.dataUrl;}}).withFailureHandler(function(){}).getImagenDriveBase64(fileId);}

  function abrirCCVisorPorId(fileId,nombre,urlFallback){
    var modal=document.getElementById('ccVisorModal'),title=document.getElementById('ccVisorTitle'),content=document.getElementById('ccVisorContent'),link=document.getElementById('ccVisorLink');
    title.textContent=nombre||'Archivo';link.href=urlFallback||'#';
    var esImagen=/\.(jpg|jpeg|png|webp|gif)$/i.test(nombre||''),esVideo=/\.(mp4|mov|avi|mkv)$/i.test(nombre||'');
    if(esImagen){content.innerHTML='<div style="display:flex;flex-direction:column;align-items:center;gap:12px;"><div id="ccVisorSpinner" style="color:#60a5fa;font-size:14px;">Cargando imagen...</div></div>';modal.classList.add('active');google.script.run.withSuccessHandler(function(res){if(res&&res.ok){content.innerHTML='<img src="'+res.dataUrl+'" style="max-width:80vw;max-height:72vh;border-radius:8px;object-fit:contain;">';}else{content.innerHTML='<div style="color:#fff;text-align:center;padding:32px;"><div style="font-size:32px;margin-bottom:12px;">⚠️</div><div style="margin-bottom:16px;font-size:13px;">No se pudo cargar la imagen</div><a href="'+safe(urlFallback)+'" target="_blank" style="color:#60a5fa;">Abrir en Drive</a></div>';}}).withFailureHandler(function(){content.innerHTML='<div style="color:#fff;text-align:center;padding:32px;"><a href="'+safe(urlFallback)+'" target="_blank" style="color:#60a5fa;">Abrir en Drive</a></div>';}).getImagenDriveBase64(fileId);}
    else if(esVideo){content.innerHTML='<video controls style="max-width:80vw;max-height:70vh;border-radius:8px;" src="'+safe(urlFallback)+'">Tu navegador no soporta video.</video>';modal.classList.add('active');}
    else{content.innerHTML='<div style="color:#fff;text-align:center;padding:40px;"><div style="font-size:48px;margin-bottom:16px;">📄</div><div style="font-size:14px;margin-bottom:16px;">'+safe(nombre)+'</div><a href="'+safe(urlFallback)+'" target="_blank" style="color:#60a5fa;">Abrir en Drive</a></div>';modal.classList.add('active');}
  }

  function ccEliminarArchivo(ccId,fileId,btn2){if(!confirm('¿Eliminar este archivo del Drive?'))return;var card=btn2.closest?btn2.closest('.cc-file-card'):null;if(card)card.style.opacity='0.4';google.script.run.withSuccessHandler(function(){if(card)card.remove();}).withFailureHandler(function(e){if(card)card.style.opacity='1';alert('Error al eliminar: '+e.message);}).eliminarArchivoCC(ccId,fileId);}
  function ccDragOver(e){e.preventDefault();document.getElementById('cc_dropzone').style.background='#bfdbfe';}
  function ccDragLeave(e){document.getElementById('cc_dropzone').style.background='var(--blue-soft)';}
  function ccDrop(e){e.preventDefault();document.getElementById('cc_dropzone').style.background='var(--blue-soft)';ccAgregarArchivos(Array.from(e.dataTransfer.files));}
  function ccArchivoSeleccionado(input){ccAgregarArchivos(Array.from(input.files));input.value='';}
  function ccAgregarArchivos(files){files.forEach(function(file){if(file.size>20*1024*1024){alert('"'+file.name+'" supera los 20 MB.');return;}_ccArchivosNuevos.push(file);ccRenderPreview();});}
  function ccRenderPreview(){var container=document.getElementById('cc_filesPreview');if(!_ccArchivosNuevos.length){container.innerHTML='';return;}container.innerHTML=_ccArchivosNuevos.map(function(file,idx){var esImagen=file.type.startsWith('image/'),esVideo=file.type.startsWith('video/');var icono=esImagen?'🖼️':esVideo?'🎬':'📄';var tamano=file.size<1024*1024?Math.round(file.size/1024)+'KB':(file.size/(1024*1024)).toFixed(1)+'MB';return '<div style="width:130px;border:1.5px dashed var(--blue-main);border-radius:var(--radius-md);overflow:hidden;background:var(--blue-soft);position:relative;"><div style="height:90px;display:flex;align-items:center;justify-content:center;font-size:32px;">'+icono+'</div><div style="padding:6px 8px;"><div style="font-size:10px;color:var(--blue-dark);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="'+safe(file.name)+'">'+safe(file.name)+'</div><div style="font-size:10px;color:var(--text-muted);">'+tamano+'</div><span style="font-size:10px;color:var(--red-main);cursor:pointer;" onclick="ccQuitarArchivo('+idx+')">Quitar</span></div></div>';}).join('');}
  function ccQuitarArchivo(idx){_ccArchivosNuevos.splice(idx,1);ccRenderPreview();}

  function ccGuardar(){
    if(!_ccEquipoActual){alert('Primero busca un equipo.');return;}if(!_ccTipoSeleccionado){alert('Debes seleccionar una clasificación.');return;}
    var btn=document.getElementById('btnGuardarCC');btn.textContent='Procesando...';btn.disabled=true;
    var eq=_ccEquipoActual.equipo,ing=_ccEquipoActual.currentIngreso||(_ccEquipoActual.ingresos&&_ccEquipoActual.ingresos[0])||{},dg=_ccEquipoActual.detalleGeneral||{};
    var serieVal=eq?(eq['Nro Serie']||eq['N° Serie']||eq['Serie']||''):(ing['Serie del Producto']||'');
    var payload={serie:serieVal,modelo:eq?(eq['Modelo']||''):(ing['Modelo']||''),fichaIngreso:dg.fichaIngreso||'',fichaSalida:dg.fichaSalida||'',tipo:_ccTipoSeleccionado,estadoProducto:_ccEstadoProductoSeleccionado,comentario:document.getElementById('cc_comentario').value.trim(),estado:'Activo'};
    if(!_ccArchivosNuevos.length){ccEnviarAlBackend(payload,[],btn);return;}
    btn.textContent='Leyendo '+_ccArchivosNuevos.length+' archivo(s)...';var leidos=0,archivosB64=[],archivosSnap=_ccArchivosNuevos.slice();
    archivosSnap.forEach(function(file){var reader=new FileReader();reader.onload=function(e){var ext=file.name.split('.').pop()||'jpg';archivosB64.push({filename:file.name,ext:ext,mimeType:file.type||'application/octet-stream',base64:e.target.result.split(',')[1]});leidos++;if(leidos===archivosSnap.length){btn.textContent='Subiendo '+leidos+' archivo(s) al Drive...';ccEnviarAlBackend(payload,archivosB64,btn);}};reader.onerror=function(){alert('Error al leer: '+file.name);btn.textContent='Guardar en Google Sheets';btn.disabled=false;};reader.readAsDataURL(file);});
  }

  function ccEnviarAlBackend(payload,archivos,btn){
    google.script.run
      .withSuccessHandler(function(res){if(res&&res.ok){btn.textContent='✓ Guardado';btn.style.background='var(--green-main)';_ccArchivosNuevos=[];ccRenderPreview();ccRefrescarTrasGuardar(payload);}})
      .withFailureHandler(function(err){alert('Error al guardar: '+(err.message||err));btn.textContent='Guardar en Google Sheets';btn.style.background='var(--blue-main)';btn.disabled=false;})
      .guardarRegistroCC(payload,archivos);
  }

  function ccRefrescarTrasGuardar(payload){
    var btn=document.getElementById('btnGuardarCC');
    google.script.run
      .withSuccessHandler(function(registros){_ccRegistrosExistentes=registros||[];if(_ccRegistrosExistentes.length>0){ccRenderHistorial(_ccRegistrosExistentes);}var regActual=_ccRegistrosExistentes.filter(function(r){return r['Tipo']===payload.tipo;})[0];if(regActual){document.getElementById('cc_comentario').value=ccGetCampo_(regActual,['Comentario','comentario']);_ccEstadoProductoSeleccionado=ccGetCampo_(regActual,['Estado Producto','Estado producto','estado producto'])||payload.estadoProducto||'';ccRenderEstadosProd();ccMostrarArchivosGuardados(regActual);}if(btn){setTimeout(function(){btn.textContent='Guardar en Google Sheets';btn.style.background='var(--blue-main)';btn.disabled=false;},1200);}})
      .withFailureHandler(function(){if(btn){btn.textContent='Guardar en Google Sheets';btn.style.background='var(--blue-main)';btn.disabled=false;}})
      .getCCPorSerie(payload.serie);
  }

  function cerrarCCVisor(){document.getElementById('ccVisorModal').classList.remove('active');document.getElementById('ccVisorContent').innerHTML='';}
  function ccLimpiar(){_ccEquipoActual=null;_ccTipoSeleccionado='';_ccEstadoProductoSeleccionado='';_ccArchivosNuevos=[];_ccRegistrosExistentes=[];var input=document.getElementById('ccSearchInput');if(input)input.value='';document.getElementById('ccInfoStrip').style.display='none';document.getElementById('ccNoResultado').style.display='none';document.getElementById('ccFormGrid').style.display='none';document.getElementById('cc_filesPreview').innerHTML='';document.getElementById('cc_filesGuardados').innerHTML='';document.getElementById('cc_comentario').value='';document.getElementById('cc_historial').style.display='none';}

  // =========================================
  // CIERRE DE MODALES AL CLICK FUERA
  // =========================================
  window.addEventListener('click', function(e) {
    var dM=document.getElementById('detalleModal'),fM=document.getElementById('filtrosModal'),iM=document.getElementById('modalEditarIngreso'),sM=document.getElementById('modalEditarSalida'),ccM=document.getElementById('ccVisorModal');
    var pop=document.getElementById('rangePickerPopover'),dPop=document.getElementById('dashRangePickerPopover');
    if(e.target===dM)cerrarModal(); if(e.target===fM)cerrarFiltros(); if(e.target===iM)cerrarModalEditarIngreso(); if(e.target===sM)cerrarModalEditarSalida(); if(e.target===ccM)cerrarCCVisor();
    if(pop&&!pop.classList.contains('hidden')&&!pop.contains(e.target)&&!document.getElementById('btn-desde').contains(e.target)&&!document.getElementById('btn-hasta').contains(e.target))cerrarPopoverFechas();
    if(dPop&&!dPop.classList.contains('hidden')&&!dPop.contains(e.target)&&!document.getElementById('dash-btn-desde').contains(e.target)&&!document.getElementById('dash-btn-hasta').contains(e.target))dashCerrarPopover();
  });

  window.addEventListener('resize', function() { if(document.getElementById('detalleModal').classList.contains('active')) setTimeout(syncHistoryHeights,50); });

  // =========================================
  // MÓDULO FICHAS — JavaScript
  // =========================================
  var _fichasEquipoActual  = null, _fichasRegistro = null, _fichasArchivoIng = null, _fichasArchivoSal = null;
  var _fichasArchIngActual = null, _fichasArchSalActual = null, _fichasModoActual = 'ambas_fichas';

  function fichasSetMode(mode, btn) {
    _fichasModoActual=mode;
    document.querySelectorAll('#fichasSearchModeTabs .search-tab').forEach(function(t){t.classList.remove('active');});btn.classList.add('active');
    var ph={ambas_fichas:'Ingrese N° de Ficha de Ingreso o Salida...',ficha_ingreso:'Ingrese N° de Ficha de Ingreso...',ficha_salida:'Ingrese N° de Ficha de Salida...',serie:'Ingrese N° de Serie del equipo...'};
    var inp=document.getElementById('fichasSearchInput');if(inp){inp.placeholder=ph[mode]||'Buscar...';inp.dataset.mode=mode;inp.value='';inp.focus();}
    if(_fichasEquipoActual)fichasAplicarVisibilidadPaneles_(mode);
  }

  function fichasBuscar() {
    var inp=document.getElementById('fichasSearchInput'),query=(inp?inp.value:'').trim();
    var tab=document.querySelector('#fichasSearchModeTabs .search-tab.active'),mode=tab?(tab.dataset.mode||'ambas_fichas'):'ambas_fichas';
    _fichasModoActual=mode; if(!query)return;
    fichasResetUI_();
    var btn=document.querySelector('#fichas .btn-buscar-pro'),orig=btn?btn.innerHTML:'';
    if(btn){btn.innerHTML='Buscando...';btn.disabled=true;}
    google.script.run
      .withSuccessHandler(function(data){if(btn){btn.innerHTML=orig;btn.disabled=false;}if(!data||(!data.equipo&&(!data.ingresos||!data.ingresos.length)&&(!data.salidas||!data.salidas.length))){document.getElementById('fichasNoResultado').style.display='block';return;}_fichasEquipoActual=data;fichasMostrarFormulario_(data);})
      .withFailureHandler(function(e){if(btn){btn.innerHTML=orig;btn.disabled=false;}document.getElementById('fichasNoResultado').style.display='block';})
      .buscarEquipoFichas(query,mode);
  }

  function fichasAplicarVisibilidadPaneles_(mode) {
    var panelIng=document.getElementById('fi_panel_ingreso'),panelSal=document.getElementById('fi_panel_salida');if(!panelIng||!panelSal)return;
    var mostrarIng=(mode==='ambas_fichas'||mode==='ficha_ingreso'||mode==='serie'),mostrarSal=(mode==='ambas_fichas'||mode==='ficha_salida'||mode==='serie');
    panelIng.style.display=mostrarIng?'':'none';panelSal.style.display=mostrarSal?'':'none';
    var grid=document.getElementById('fi_paneles_grid');if(grid)grid.style.gridTemplateColumns=(mostrarIng&&mostrarSal)?'1fr 1fr':'1fr';
  }

  function fichasMostrarFormulario_(data) {
    var eq=data.equipo,ing=data.currentIngreso||(data.ingresos&&data.ingresos[0])||{},dg=data.detalleGeneral||{};
    var serie=eq?(eq['Nro Serie']||eq['N° Serie']||eq['Serie']||'-'):(ing['Serie del Producto']||'-');
    var modelo=eq?(eq['Modelo']||'-'):(ing['Modelo']||'-'),cliente=eq?(eq['Cliente']||'-'):(ing['Cliente o Eden Agua']||'-'),estado=eq?(eq['Status']||eq['Estado']||'-'):'-';
    var strip=document.getElementById('fichasInfoStrip');
    strip.innerHTML='<span style="font-weight:700;color:var(--blue-main);">'+safe(serie)+'</span><span style="color:var(--text-muted);margin:0 6px;">·</span><span>'+safe(modelo)+'</span><span style="color:var(--text-muted);margin:0 6px;">·</span><span>'+safe(cliente)+'</span><span style="color:var(--text-muted);margin:0 6px;">·</span>'+buildBadge(estado);
    strip.style.display='flex';
    document.getElementById('fi_serie_display').textContent=serie;document.getElementById('fi_modelo_display').textContent=modelo;document.getElementById('fi_cliente_display').textContent=cliente;document.getElementById('fi_estado_display').innerHTML=buildBadge(estado);document.getElementById('fi_fichaIng_display').textContent=dg.fichaIngreso||'-';document.getElementById('fi_fichaSal_display').textContent=dg.fichaSalida||'-';
    document.getElementById('fichasFormGrid').style.display='block';fichasAplicarVisibilidadPaneles_(_fichasModoActual);
    google.script.run
      .withSuccessHandler(function(registro){_fichasRegistro=registro;fichasCargarArchivoExistente_('ingreso',registro);fichasCargarArchivoExistente_('salida',registro);})
      .withFailureHandler(function(){_fichasRegistro=null;})
      .getFichaPorSerie(serie);
  }

  function fichasCargarArchivoExistente_(tipo, registro) {
    var campo = tipo === 'ingreso' ? 'Archivo Ingreso' : 'Archivo Salida';
    var archStr = registro ? (registro[campo] || registro[campo.toLowerCase()] || '') : '';
    var arch = null;
    if (!archStr || archStr.trim() === '') {
    } else if (archStr.trim().charAt(0) === '{') {
      try { arch = JSON.parse(archStr); } catch(e) { arch = null; }
    } else if (archStr.indexOf('http') === 0) {
      var matchId = archStr.match(/\/d\/([a-zA-Z0-9_-]+)\//);
      var fileId = matchId ? matchId[1] : null;
      arch = { url: archStr, id: fileId, nombre: 'Ficha guardada', thumb: fileId ? 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w200' : null };
    }
    var previewEl = document.getElementById('fi_' + tipo + '_preview');
    var thumbEl   = document.getElementById('fi_' + tipo + '_thumb');
    var nombreEl  = document.getElementById('fi_' + tipo + '_nombre');
    var linkEl    = document.getElementById('fi_' + tipo + '_link');
    var replEl    = document.getElementById('fi_' + tipo + '_reemplazar_opt');
    if (arch && (arch.id || arch.url)) {
      if (tipo === 'ingreso') _fichasArchIngActual = arch; else _fichasArchSalActual = arch;
      previewEl.style.display = 'block'; replEl.style.display = 'block';
      nombreEl.textContent = arch.nombre || 'Archivo guardado';
      linkEl.href = arch.url || '#';
      if (arch.id) {
        thumbEl.innerHTML =
          '<div style="width:60px;height:60px;background:#e2e8f0;border-radius:8px;overflow:hidden;cursor:pointer;" onclick="fichasVerImagen(\'' + tipo + '\')">' +
            '<img id="fi_thumb_img_' + tipo + '" src="" style="width:100%;height:100%;object-fit:cover;display:none;">' +
            '<span id="fi_thumb_icon_' + tipo + '" style="font-size:22px;display:flex;align-items:center;justify-content:center;height:100%;">🖼️</span>' +
          '</div>';
        var imgEl  = document.getElementById('fi_thumb_img_' + tipo);
        var iconEl = document.getElementById('fi_thumb_icon_' + tipo);
        var thumbUrl = arch.thumb || ('https://drive.google.com/thumbnail?id=' + arch.id + '&sz=w200');
        var tout = setTimeout(function() { fichasCargarProxy_(arch.id, imgEl, iconEl); }, 1800);
        imgEl.onload  = function() { clearTimeout(tout); imgEl.style.display = 'block'; if (iconEl) iconEl.style.display = 'none'; };
        imgEl.onerror = function() { clearTimeout(tout); fichasCargarProxy_(arch.id, imgEl, iconEl); };
        imgEl.src = thumbUrl;
      } else {
        thumbEl.innerHTML = '<span style="font-size:22px;cursor:pointer;" onclick="window.open(\'' + (arch.url||'#') + '\',\'_blank\')">🔗</span>';
      }
    } else {
      if (tipo === 'ingreso') _fichasArchIngActual = null; else _fichasArchSalActual = null;
      previewEl.style.display = 'none'; replEl.style.display = 'none';
    }
  }

  function fichasCargarProxy_(fileId, imgEl, iconEl) {
    google.script.run
      .withSuccessHandler(function(res) { if(res&&res.ok&&imgEl){imgEl.src=res.dataUrl;imgEl.style.display='block';if(iconEl)iconEl.style.display='none';} })
      .withFailureHandler(function() {})
      .getImagenFichaBase64(fileId);
  }

  function fichasDragOver(e,dzId){e.preventDefault();var dz=document.getElementById(dzId);if(dz)dz.style.background='#bfdbfe';}
  function fichasDragLeave(dzId){var dz=document.getElementById(dzId);if(!dz)return;dz.style.background=dzId.includes('salida')?'#f0fdf4':'var(--blue-soft)';}
  function fichasDrop(e,tipo){e.preventDefault();fichasDragLeave('fi_'+tipo+'_dropzone');var files=e.dataTransfer.files;if(files&&files.length>0)fichasArchivoSeleccionado(tipo,{files:files});}

  function fichasArchivoSeleccionado(tipo, input) {
    var file=input.files&&input.files[0]; if(!file)return;
    if(file.size>20*1024*1024){alert('"'+file.name+'" supera los 20 MB.');return;}
    var labelEl=document.getElementById('fi_'+tipo+'_filename'),btnEl=document.getElementById('fi_btnGuardar'+(tipo==='ingreso'?'Ingreso':'Salida')),replEl=document.getElementById('fi_'+tipo+'_reemplazar_opt');
    if(tipo==='ingreso')_fichasArchivoIng=file;else _fichasArchivoSal=file;
    if(labelEl){var sz=file.size<1024*1024?Math.round(file.size/1024)+'KB':(file.size/(1024*1024)).toFixed(1)+'MB';labelEl.innerHTML='<strong>'+safe(file.name)+'</strong> ('+sz+')';}
    if(btnEl)btnEl.disabled=false;
    var archActual=tipo==='ingreso'?_fichasArchIngActual:_fichasArchSalActual;if(replEl)replEl.style.display=archActual?'block':'none';
  }

  function fichasGuardar(tipo) {
    var archivo=tipo==='ingreso'?_fichasArchivoIng:_fichasArchivoSal;if(!archivo){alert('Selecciona un archivo primero.');return;}if(!_fichasEquipoActual){alert('Primero busca un equipo.');return;}
    var btn=document.getElementById('fi_btnGuardar'+(tipo==='ingreso'?'Ingreso':'Salida'));btn.textContent='Subiendo...';btn.disabled=true;
    var eq=_fichasEquipoActual.equipo,ing=_fichasEquipoActual.currentIngreso||(_fichasEquipoActual.ingresos&&_fichasEquipoActual.ingresos[0])||{},dg=_fichasEquipoActual.detalleGeneral||{};
    var payload={serie:eq?(eq['Nro Serie']||eq['N° Serie']||eq['Serie']||''):(ing['Serie del Producto']||''),modelo:eq?(eq['Modelo']||''):(ing['Modelo']||''),cliente:eq?(eq['Cliente']||''):(ing['Cliente o Eden Agua']||''),fichaIngreso:dg.fichaIngreso||'',fichaSalida:dg.fichaSalida||'',tipo:tipo};
    var replazar=false,replCheck=document.getElementById('fi_reemplazar_'+tipo);if(replCheck)replazar=replCheck.checked;
    var reader=new FileReader();
    reader.onload=function(e){
      var ext=archivo.name.split('.').pop()||'jpg';
      google.script.run
        .withSuccessHandler(function(res){
          if(res&&res.ok){
            btn.textContent='✓ Guardado';btn.style.background='var(--green-main)';
            if(res.archivoJSON){try{var archActualizado=JSON.parse(res.archivoJSON);if(tipo==='ingreso')_fichasArchIngActual=archActualizado;else _fichasArchSalActual=archActualizado;}catch(ep){}}
            if(tipo==='ingreso'){_fichasArchivoIng=null;document.getElementById('fi_fileIngreso').value='';}else{_fichasArchivoSal=null;document.getElementById('fi_fileSalida').value='';}
            google.script.run.withSuccessHandler(function(map){_fichasMap=map||{};}).withFailureHandler(function(){}).getFichasMap();
            setTimeout(function(){
              btn.textContent=tipo==='ingreso'?'Guardar ficha de ingreso':'Guardar ficha de salida';btn.style.background=tipo==='ingreso'?'var(--blue-main)':'var(--green-main)';btn.disabled=true;
              var serie=payload.serie;
              google.script.run.withSuccessHandler(function(reg){_fichasRegistro=reg;fichasCargarArchivoExistente_('ingreso',reg);fichasCargarArchivoExistente_('salida',reg);var lbl=document.getElementById('fi_'+tipo+'_filename');if(lbl)lbl.textContent='Arrastra o haz clic — JPG, PNG, PDF';}).withFailureHandler(function(){}).getFichaPorSerie(serie);
            },1400);
          }
        })
        .withFailureHandler(function(err){alert('Error: '+(err.message||err));btn.textContent=tipo==='ingreso'?'Guardar ficha de ingreso':'Guardar ficha de salida';btn.style.background=tipo==='ingreso'?'var(--blue-main)':'var(--green-main)';btn.disabled=false;})
        .guardarFicha(payload,{filename:archivo.name,ext:ext,mimeType:archivo.type||'application/octet-stream',base64:e.target.result.split(',')[1]},replazar);
    };
    reader.onerror=function(){alert('Error al leer el archivo.');btn.disabled=false;};reader.readAsDataURL(archivo);
  }

  function fichasEliminar(tipo) {
    if(!_fichasEquipoActual)return;if(!confirm('¿Eliminar la ficha de '+tipo+' del Drive?'))return;
    var eq=_fichasEquipoActual.equipo,ing=_fichasEquipoActual.currentIngreso||(_fichasEquipoActual.ingresos&&_fichasEquipoActual.ingresos[0])||{};
    var serie=eq?(eq['Nro Serie']||eq['N° Serie']||eq['Serie']||''):(ing['Serie del Producto']||'');
    google.script.run
      .withSuccessHandler(function(res){if(res&&res.ok){if(tipo==='ingreso')_fichasArchIngActual=null;else _fichasArchSalActual=null;document.getElementById('fi_'+tipo+'_preview').style.display='none';document.getElementById('fi_'+tipo+'_reemplazar_opt').style.display='none';document.getElementById('fi_'+tipo+'_filename').textContent='Arrastra o haz clic — JPG, PNG, PDF';google.script.run.withSuccessHandler(function(map){_fichasMap=map||{};}).withFailureHandler(function(){}).getFichasMap();}})
      .withFailureHandler(function(e){alert('Error al eliminar: '+e.message);})
      .eliminarArchivoFicha(serie,tipo);
  }

function fichasVerImagen(tipo) {
  var arch = tipo === 'ingreso' ? _fichasArchIngActual : _fichasArchSalActual;
  if (!arch || (!arch.id && !arch.url)) return;

  var modal   = document.getElementById('fichasVisorModal');
  var title   = document.getElementById('fichasVisorTitle');
  var content = document.getElementById('fichasVisorContent');
  var link    = document.getElementById('fichasVisorLink');

  title.textContent = arch.nombre || (tipo === 'ingreso' ? 'Ficha Ingreso' : 'Ficha Salida');
  link.href = arch.url || '#';

  var fileId = arch.id || '';
  if (!fileId && arch.url) {
    var matchId = arch.url.match(/\/d\/([a-zA-Z0-9_-]+)\//);
    fileId = matchId ? matchId[1] : '';
  }

  var esImagen = /\.(jpg|jpeg|png|webp|gif)$/i.test(arch.nombre || '') || !!arch.thumb || !!fileId;

  modal.classList.add('active');
  content.innerHTML = visorLoadingHtml('Cargando ficha...');

  _visorFichaActual = {
    fileId: '',
    tipo: tipo,
    dataUrl: '',
    rotation: 0
  };

  if (!fileId || !esImagen) {
    content.innerHTML = visorFallbackHtml(arch.url);
    return;
  }

  google.script.run
    .withSuccessHandler(function(res) {
      if (res && res.ok) {
      _visorFichaActual = {
        fileId: fileId,
        tipo: tipo,
        dataUrl: res.dataUrl,
        rotation: 0,
        nombre: arch.nombre || ''
      };

        ensureViewerRotateControls();
        content.innerHTML = visorImageHtml(res.dataUrl);
      } else {
        content.innerHTML = visorFallbackHtml(arch.url);
      }
    })
    .withFailureHandler(function() {
      content.innerHTML = visorFallbackHtml(arch.url);
    })
    .getImagenFichaBase64(fileId);
}

  function fichasCerrarVisor(){document.getElementById('fichasVisorModal').classList.remove('active');document.getElementById('fichasVisorContent').innerHTML='';}

  function fichasResetUI_() {
    _fichasEquipoActual=null;_fichasRegistro=null;_fichasArchivoIng=null;_fichasArchivoSal=null;_fichasArchIngActual=null;_fichasArchSalActual=null;
    document.getElementById('fichasInfoStrip').style.display='none';document.getElementById('fichasNoResultado').style.display='none';document.getElementById('fichasFormGrid').style.display='none';
    ['ingreso','salida'].forEach(function(t){document.getElementById('fi_'+t+'_preview').style.display='none';document.getElementById('fi_'+t+'_reemplazar_opt').style.display='none';document.getElementById('fi_'+t+'_filename').textContent='Arrastra o haz clic — JPG, PNG, PDF';var btn=document.getElementById('fi_btnGuardar'+(t==='ingreso'?'Ingreso':'Salida'));if(btn){btn.disabled=true;btn.textContent='Guardar ficha de '+t;btn.style.background=t==='ingreso'?'var(--blue-main)':'var(--green-main)';}});
    var fiInp=document.getElementById('fi_fileIngreso');if(fiInp)fiInp.value='';var fsSal=document.getElementById('fi_fileSalida');if(fsSal)fsSal.value='';
  }

  function fichasLimpiar(){fichasResetUI_();var inp=document.getElementById('fichasSearchInput');if(inp)inp.value='';}

  document.addEventListener('click', function(e) {
    var vm=document.getElementById('fichasVisorModal');if(vm&&e.target===vm)fichasCerrarVisor();
  });

function visorLoadingHtml(texto) {
  return '<div class="viewer-loading">' +
    '<div class="viewer-loader-ring"></div>' +
    '<div>' + safe(texto || 'Cargando ficha...') + '</div>' +
  '</div>';
}

function visorImageHtml(dataUrl) {
  return '<div class="viewer-image-frame">' +
    '<img class="viewer-image" src="' + dataUrl + '" alt="Vista previa de ficha">' +
  '</div>';
}

function visorFallbackHtml(url) {
  return '<div class="viewer-empty-doc">' +
    '<div style="font-size:13px;font-weight:600;color:var(--text-main);margin-bottom:10px;">Documento no previsualizable</div>' +
    '<a href="' + safe(url || '#') + '" target="_blank" class="viewer-drive-link">Abrir en Drive</a>' +
  '</div>';
}


var _visorFichaActual = {
  fileId: '',
  tipo: '',
  dataUrl: '',
  rotation: 0
};

function ensureViewerRotateControls() {
  var footer = document.querySelector('#fichasVisorModal .viewer-footer');
  if (!footer) return;

  var controls = document.getElementById('viewerRotateControls');

  if (!controls) {
    controls = document.createElement('div');
    controls.id = 'viewerRotateControls';
    controls.style.cssText = 'display:flex;gap:8px;margin-right:auto;';

    controls.innerHTML =
      '<button type="button" class="viewer-drive-link" onclick="rotateViewerImage(-90)">↶ Girar</button>' +
      '<button type="button" class="viewer-drive-link" onclick="rotateViewerImage(90)">↷ Girar</button>' +
      '<button type="button" class="viewer-drive-link viewer-save-rotation" onclick="saveViewerRotation()">Guardar orientación</button>';

    footer.insertBefore(controls, footer.firstChild);
  }

  resetViewerSaveButton();
}

function resetViewerSaveButton() {
  var btnGuardar = document.querySelector('#viewerRotateControls .viewer-save-rotation');
  if (!btnGuardar) return;

  btnGuardar.innerHTML = 'Guardar orientación';
  btnGuardar.classList.remove('is-saved');
  btnGuardar.disabled = false;
}

function rotateViewerImage(deg) {
  var img = document.querySelector('#fichasVisorContent .viewer-image');
  if (!img) return;

  _visorFichaActual.rotation = (_visorFichaActual.rotation + deg + 360) % 360;

  img.style.transform = 'rotate(' + _visorFichaActual.rotation + 'deg)';
  img.style.transition = 'transform .15s ease';

  resetViewerSaveButton();
}
function saveViewerRotation() {
  if (!_visorFichaActual.fileId || !_visorFichaActual.dataUrl || !_visorFichaActual.rotation) {
    alert('No hay cambios de orientación para guardar.');
    return;
  }

  var img = new Image();

  img.onload = function() {
    var rot = _visorFichaActual.rotation % 360;
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');

    if (rot === 90 || rot === 270) {
      canvas.width = img.height;
      canvas.height = img.width;
    } else {
      canvas.width = img.width;
      canvas.height = img.height;
    }

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rot * Math.PI / 180);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);

    var dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    var base64 = dataUrl.split(',')[1];

    google.script.run
      .withSuccessHandler(function(res) {
        if (res && res.ok) {
          var btnGuardar = document.querySelector('#viewerRotateControls .viewer-save-rotation');

          if (btnGuardar) {
            btnGuardar.innerHTML = '✓ Guardado';
            btnGuardar.classList.add('is-saved');
            btnGuardar.disabled = true;
          }

          _visorFichaActual.rotation = 0;

          try {
            var arch = JSON.parse(res.archivoJSON);
            if (_visorFichaActual.tipo === 'ingreso') _fichasArchIngActual = arch;
            if (_visorFichaActual.tipo === 'salida') _fichasArchSalActual = arch;
          } catch(e) {}
        }
      })
      .withFailureHandler(function(err) {
        alert('Error al guardar orientación: ' + (err.message || err));
      })
      .guardarImagenFichaRotada(_visorFichaActual.fileId, _visorFichaActual.tipo, {
        filename: _visorFichaActual.nombre || 'ficha_rotada.jpg',
        mimeType: 'image/jpeg',
        base64: base64
      });
  };

  img.src = _visorFichaActual.dataUrl;
}

// =========================================
// STOCK LOGÍSTICA
// =========================================
var _stockDebounceTimer = null;

function buscarStockDebounced() {
  clearTimeout(_stockDebounceTimer);
  _stockDebounceTimer = setTimeout(buscarStock, 400);
}

function buscarStock() {
  clearTimeout(_stockDebounceTimer);
  var query = document.getElementById('stockSearchInput').value || '';
  var body  = document.getElementById('stockBody');
  var resumen = document.getElementById('stockResumen');

  body.innerHTML = '<tr><td colspan="5">' + htmlDashboardCargador + '</td></tr>';
  resumen.style.display = 'none';

  google.script.run
    .withSuccessHandler(function(data) {
      var rows = data.rows || [];

      if (!rows.length) {
        body.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:40px;">' +
          (query ? 'Sin resultados para "' + safe(query) + '"' : 'Escribe algo para buscar en el stock') +
          '</td></tr>';
        resumen.style.display = 'none';
        return;
      }

      resumen.textContent = rows.length + ' producto' + (rows.length !== 1 ? 's' : '') + ' encontrado' + (rows.length !== 1 ? 's' : '');
      resumen.style.display = 'block';

      body.innerHTML = rows.map(function(r) {
        var dispNum  = parseInt(r.disponible, 10);
        var dispColor = isNaN(dispNum) ? 'var(--text-main)'
          : dispNum <= 0  ? 'var(--red-main)'
          : dispNum <= 3  ? '#d97706'
          : 'var(--green-main)';

        return '<tr>' +
          '<td style="font-weight:500;">' + safe(r.producto)   + '</td>' +
          '<td style="font-family:\'DM Mono\',monospace;font-size:11px;color:var(--text-muted);">' + safe(r.sku) + '</td>' +
          '<td style="font-size:12px;">'  + safe(r.categoria)  + '</td>' +
          '<td style="font-size:12px;">'  + safe(r.ubicacion)  + '</td>' +
          '<td style="text-align:right;font-weight:700;font-family:\'DM Mono\',monospace;color:' + dispColor + ';">' + safe(r.disponible) + '</td>' +
        '</tr>';
      }).join('');
    })
    .withFailureHandler(function(err) {
      body.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--red-main);padding:20px;">Error: ' + safe(err.message || err) + '</td></tr>';
    })
    .getStockProductos(query);
}

function limpiarStock() {
  var inp = document.getElementById('stockSearchInput');
  if (inp) inp.value = '';
  var body = document.getElementById('stockBody');
  body.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:40px;">Escribe algo para buscar en el stock</td></tr>';
  var resumen = document.getElementById('stockResumen');
  if (resumen) resumen.style.display = 'none';
}
// =========================================
// CHECKLIST LOGÍSTICA — JS v3
// =========================================
var _clFilas        = [];
var _clFotos        = [];
var _clFilaCounter  = 0;
var _clStockCache   = null;
var _clModelosCache = null;
var _clFilaBuscando = null;
var _clInicializado = false;

function clInicializar() {
  if (_clInicializado) return;
  _clInicializado = true;

  // Correlativo
  google.script.run
    .withSuccessHandler(function(corr) {
      var el = document.getElementById('cl_correlativo');
      if (el && !el.value) el.value = corr;
    })
    .withFailureHandler(function() {})
    .getChecklistCorrelativo();

  // Modelos desde Config Taller
  google.script.run
    .withSuccessHandler(function(config) {
      _clModelosCache = config.modelos || [];
    })
    .withFailureHandler(function() {})
    .getConfigTaller();

  // Llenar nombre de evaluación desde analista
  var analista   = document.getElementById('cl_analista');
  var evalNombre = document.getElementById('cl_eval_nombre');
  if (analista && evalNombre) {
    evalNombre.value = analista.value;
    analista.addEventListener('input', function() {
      evalNombre.value = this.value;
    });
  }

  // Llenar nombre de autorización desde autorizado por
  var autorizado = document.getElementById('cl_autorizado');
  var autNombre  = document.getElementById('cl_aut_nombre');
  if (autorizado && autNombre) {
    autNombre.value = autorizado.value;
    autorizado.addEventListener('input', function() {
      autNombre.value = this.value;
    });
  }

  clAgregarFila();
}

function clFormatFecha(input) {
  var v = input.value.replace(/\D/g,'');
  if (v.length >= 2) v = v.substring(0,2)+'/'+v.substring(2);
  if (v.length >= 5) v = v.substring(0,5)+'/'+v.substring(5,9);
  input.value = v;
}

// ── Tabla ─────────────────────────────────────────────────────
function clAgregarFila() {
  _clFilaCounter++;
  _clFilas.push({ id: _clFilaCounter, modelo: '', descripcion: '', cantidad: 1, observaciones: '' });
  clRenderTabla();
}

function clEliminarFila(id) {
  _clFilas = _clFilas.filter(function(f){ return f.id !== id; });
  clRenderTabla();
}

function clRenderTabla() {
  var tbody = document.getElementById('cl_filas_body');
  if (!tbody) return;

  tbody.innerHTML = _clFilas.map(function(f, i) {
    var tieneDesc   = !!f.descripcion;
    var tieneModelo = !!f.modelo;

    return '<tr>' +
      '<td style="text-align:center;font-weight:700;color:var(--text-muted);padding:8px 6px;">' + (i+1) + '</td>' +

      // Modelo — botón selector
      '<td style="padding:6px;">' +
        (tieneModelo
          ? '<div style="display:flex;align-items:center;gap:6px;">' +
              '<span style="font-size:12px;font-weight:600;">' + safe(f.modelo) + '</span>' +
              '<button onclick="clAbrirModeloSelector(' + f.id + ')" style="background:var(--bg-soft);border:0.5px solid var(--border-soft);border-radius:6px;padding:2px 7px;font-size:10px;cursor:pointer;color:var(--text-muted);">↺</button>' +
            '</div>'
          : '<button onclick="clAbrirModeloSelector(' + f.id + ')" style="background:var(--bg-soft);border:1px dashed var(--border-med);border-radius:8px;padding:6px 10px;font-size:11px;cursor:pointer;color:var(--text-muted);width:100%;text-align:left;">Seleccionar...</button>'
        ) +
      '</td>' +

      // Descripción — botón buscador
      '<td style="padding:6px;">' +
        (tieneDesc
          ? '<div style="display:flex;align-items:center;gap:6px;">' +
              '<span style="font-size:12px;flex:1;">' + safe(f.descripcion) + '</span>' +
              '<button onclick="clAbrirBuscador(' + f.id + ')" style="background:var(--bg-soft);border:0.5px solid var(--border-soft);border-radius:6px;padding:2px 7px;font-size:10px;cursor:pointer;color:var(--text-muted);">Cambiar</button>' +
            '</div>'
          : '<button onclick="clAbrirBuscador(' + f.id + ')" style="background:var(--blue-soft);border:1px dashed var(--blue-main);border-radius:8px;padding:7px 14px;font-size:12px;cursor:pointer;color:var(--blue-dark);font-weight:600;width:100%;text-align:left;">🔍 Buscar repuesto...</button>'
        ) +
      '</td>' +

      // Cantidad
      '<td style="padding:6px;">' +
        '<input type="number" value="' + (f.cantidad||1) + '" min="1" ' +
        'style="width:60px;border:0.5px solid var(--border-soft);border-radius:6px;padding:5px 8px;font-size:12px;text-align:center;font-family:\'DM Mono\',monospace;" ' +
        'onchange="clCambiarCantidad(' + f.id + ',this.value)">' +
      '</td>' +

      // Observaciones
      '<td style="padding:6px;">' +
        '<input type="text" value="' + safe(f.observaciones||'') + '" placeholder="Ninguna" ' +
        'style="width:100%;border:0.5px solid var(--border-soft);border-radius:6px;padding:5px 8px;font-size:12px;font-family:inherit;" ' +
        'onchange="clCambiarObs(' + f.id + ',this.value)">' +
      '</td>' +

      '<td style="text-align:center;padding:6px;">' +
        '<button onclick="clEliminarFila(' + f.id + ')" style="background:none;border:none;color:var(--red-main);cursor:pointer;font-size:18px;line-height:1;">×</button>' +
      '</td>' +
    '</tr>';
  }).join('');

  clActualizarTotal();
}

function clCambiarCantidad(id, val) {
  var f = _clFilas.find(function(x){ return x.id===id; });
  if (f) { f.cantidad = parseInt(val,10)||1; clActualizarTotal(); }
}

function clCambiarObs(id, val) {
  var f = _clFilas.find(function(x){ return x.id===id; });
  if (f) f.observaciones = val;
}

function clActualizarTotal() {
  var t = _clFilas.reduce(function(s,f){ return s+(parseInt(f.cantidad,10)||0); },0);
  var el = document.getElementById('cl_total_unidades');
  if (el) el.textContent = t;
}

// ── Modal Selector de Modelo ──────────────────────────────────
var _clFilaModelo = null;

function clAbrirModeloSelector(filaId) {
  _clFilaModelo = filaId;
  var modal = document.getElementById('cl_modal_modelo');
  if (!modal) { clCrearModalModelo(); modal = document.getElementById('cl_modal_modelo'); }
  modal.style.display = 'flex';

  var lista = document.getElementById('cl_modelo_lista');
  var modelos = _clModelosCache || [];

  if (!modelos.length) {
    lista.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:30px;">Cargando modelos...</div>';
    google.script.run
      .withSuccessHandler(function(config) {
        _clModelosCache = config.modelos || [];
        clRenderModeloLista(_clModelosCache);
      })
      .withFailureHandler(function() {})
      .getConfigTaller();
  } else {
    clRenderModeloLista(modelos);
  }
}

function clCrearModalModelo() {
  var modal = document.createElement('div');
  modal.id = 'cl_modal_modelo';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);display:none;align-items:center;justify-content:center;z-index:10011;backdrop-filter:blur(3px);';
  modal.innerHTML =
    '<div style="background:#fff;border-radius:18px;width:min(420px,90vw);max-height:72vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 80px rgba(13,13,12,.24);">' +
      '<div style="padding:16px 20px;border-bottom:0.5px solid var(--border-soft);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">' +
        '<div style="font-size:14px;font-weight:700;">Seleccionar Modelo</div>' +
        '<button onclick="clCerrarModeloSelector()" style="width:30px;height:30px;border-radius:50%;border:0.5px solid var(--border-soft);background:var(--bg-soft);cursor:pointer;font-size:16px;color:var(--text-muted);">×</button>' +
      '</div>' +
      '<div style="padding:12px 16px;border-bottom:0.5px solid var(--border-soft);flex-shrink:0;">' +
        '<input id="cl_modelo_busq" type="text" placeholder="Filtrar modelo..." ' +
          'style="width:100%;border:1px solid var(--border-soft);border-radius:var(--radius-md);padding:9px 12px;font-size:13px;font-family:inherit;outline:none;" ' +
          'oninput="clFiltrarModelos(this.value)">' +
      '</div>' +
      '<div id="cl_modelo_lista" style="flex:1;overflow-y:auto;padding:6px 0;"></div>' +
      '<div style="padding:12px 16px;border-top:0.5px solid var(--border-soft);display:flex;justify-content:flex-end;flex-shrink:0;">' +
        '<button onclick="clCerrarModeloSelector()" class="clear-btn">Cancelar</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(modal);
  modal.addEventListener('click', function(e){ if(e.target===modal) clCerrarModeloSelector(); });
}

function clRenderModeloLista(modelos) {
  var lista = document.getElementById('cl_modelo_lista');
  if (!lista) return;
  if (!modelos.length) {
    lista.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:20px;">Sin modelos disponibles</div>';
    return;
  }
  lista.innerHTML = modelos.map(function(m) {
    return '<div onclick="clSeleccionarModelo(\'' + safe(m) + '\')" ' +
      'style="padding:12px 20px;font-size:13px;cursor:pointer;border-bottom:0.5px solid var(--border-soft);font-weight:500;" ' +
      'onmouseenter="this.style.background=\'var(--bg-soft)\'" onmouseleave="this.style.background=\'\'">' +
      safe(m) + '</div>';
  }).join('');
}

function clFiltrarModelos(q) {
  var modelos = (_clModelosCache||[]).filter(function(m){
    return m.toLowerCase().includes(q.toLowerCase());
  });
  clRenderModeloLista(modelos);
}

function clSeleccionarModelo(modelo) {
  var fila = _clFilas.find(function(f){ return f.id===_clFilaModelo; });
  if (fila) fila.modelo = modelo;
  clCerrarModeloSelector();
  clRenderTabla();
}

function clCerrarModeloSelector() {
  var m = document.getElementById('cl_modal_modelo');
  if (m) m.style.display = 'none';
  var busq = document.getElementById('cl_modelo_busq');
  if (busq) busq.value = '';
  _clFilaModelo = null;
}

// ── Modal Buscador de Repuestos ───────────────────────────────
function clAbrirBuscador(filaId) {
  _clFilaBuscando = filaId;
  var modal = document.getElementById('cl_modal_buscador');
  if (!modal) { clCrearModalBuscador(); modal = document.getElementById('cl_modal_buscador'); }
  modal.style.display = 'flex';

  var inp = document.getElementById('cl_busq_input');
  if (inp) { inp.value = ''; setTimeout(function(){ inp.focus(); },100); }

  // modelo de la fila actual para priorizar
  var fila = _clFilas.find(function(f){ return f.id===filaId; });
  var modeloFila = fila ? (fila.modelo||'').toLowerCase() : '';

  if (!_clStockCache) {
    document.getElementById('cl_busq_resultados').innerHTML =
      '<div style="text-align:center;color:var(--text-muted);padding:30px;">Cargando productos...</div>';
    google.script.run
      .withSuccessHandler(function(data) {
        _clStockCache = data.rows || [];
        clFiltrarBuscador('', modeloFila);
      })
      .withFailureHandler(function(e) {
        document.getElementById('cl_busq_resultados').innerHTML =
          '<div style="text-align:center;color:var(--red-main);padding:20px;font-size:12px;">Error: ' + safe(e.message||e) + '</div>';
      })
      .getStockProductos('');
  } else {
    clFiltrarBuscador('', modeloFila);
  }
}

function clCrearModalBuscador() {
  var modal = document.createElement('div');
  modal.id = 'cl_modal_buscador';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);display:none;align-items:center;justify-content:center;z-index:10010;backdrop-filter:blur(3px);';
  modal.innerHTML =
    '<div style="background:#fff;border-radius:18px;width:min(720px,92vw);max-height:82vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 80px rgba(13,13,12,.24);">' +
      '<div style="padding:18px 22px;border-bottom:0.5px solid var(--border-soft);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">' +
        '<div style="font-size:14px;font-weight:700;">Seleccionar repuesto del stock</div>' +
        '<button onclick="clCerrarBuscador()" style="width:32px;height:32px;border-radius:50%;border:0.5px solid var(--border-soft);background:var(--bg-soft);cursor:pointer;font-size:18px;color:var(--text-muted);">×</button>' +
      '</div>' +
      '<div style="padding:14px 22px;border-bottom:0.5px solid var(--border-soft);flex-shrink:0;">' +
        '<div style="display:flex;align-items:center;gap:8px;padding:0 14px;border:1.5px solid var(--text-main);border-radius:var(--radius-md);background:#fff;">' +
          '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="var(--text-muted)" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>' +
          '<input id="cl_busq_input" type="text" placeholder="Buscar por nombre, SKU o categoría..." ' +
            'style="flex:1;border:none;outline:none;font-size:13px;padding:11px 0;font-family:inherit;" ' +
            'oninput="clFiltrarBuscadorInput(this.value)">' +
        '</div>' +
        '<div id="cl_busq_modelo_badge" style="margin-top:8px;font-size:11px;color:var(--text-muted);"></div>' +
      '</div>' +
      '<div id="cl_busq_resultados" style="flex:1;overflow-y:auto;padding:8px 0;"></div>' +
      '<div style="padding:10px 22px;border-top:0.5px solid var(--border-soft);font-size:11px;color:var(--text-muted);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">' +
        '<span>¿No encuentras el repuesto? <button onclick="clIngresarManual()" style="background:none;border:none;color:var(--blue-main);font-weight:600;cursor:pointer;font-size:11px;font-family:inherit;text-decoration:underline;">Ingresar manualmente</button></span>' +
        '<button onclick="clCerrarBuscador()" class="clear-btn" style="padding:6px 14px;">Cancelar</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(modal);
  modal.addEventListener('click', function(e){ if(e.target===modal) clCerrarBuscador(); });
}

var _clBusqTimer = null;
var _clModeloActualBusq = '';

function clFiltrarBuscadorInput(query) {
  clearTimeout(_clBusqTimer);
  _clBusqTimer = setTimeout(function(){
    clFiltrarBuscador(query, _clModeloActualBusq);
  }, 200);
}

function clFiltrarBuscador(query, modeloFila) {
  if (modeloFila !== undefined) _clModeloActualBusq = modeloFila || '';

  var badge = document.getElementById('cl_busq_modelo_badge');
  if (badge) {
    badge.innerHTML = _clModeloActualBusq
      ? '📦 Mostrando primero repuestos del modelo <strong>' + safe(_clModeloActualBusq.toUpperCase()) + '</strong>'
      : '';
  }

  var container = document.getElementById('cl_busq_resultados');
  if (!container || !_clStockCache) return;

  var q = (query||'').trim().toLowerCase();
  var todos = q
    ? _clStockCache.filter(function(item){
        return (item.producto+' '+item.sku+' '+item.categoria).toLowerCase().includes(q);
      })
    : _clStockCache;

  // Separar: primero los del modelo, luego el resto
  var delModelo = [], otros = [];
  todos.forEach(function(item) {
    if (_clModeloActualBusq && item.producto.toLowerCase().includes(_clModeloActualBusq)) {
      delModelo.push(item);
    } else {
      otros.push(item);
    }
  });

  function renderItem(item) {
    var disp = parseInt(item.disponible, 10);
    var dispColor = isNaN(disp)?'#94a3b8':disp<=0?'#ef4444':disp<=3?'#d97706':'#22c55e';
    var dispBg    = isNaN(disp)?'#f1f5f9':disp<=0?'#fee2e2':disp<=3?'#fef3c7':'#dcfce7';
    var itemStr   = safe(JSON.stringify(item));
    return '<div onclick="clSeleccionarProducto(' + itemStr + ')" ' +
      'style="display:flex;align-items:center;justify-content:space-between;padding:11px 22px;border-bottom:0.5px solid var(--border-soft);cursor:pointer;" ' +
      'onmouseenter="this.style.background=\'var(--bg-soft)\'" onmouseleave="this.style.background=\'\'">' +
      '<div style="flex:1;min-width:0;">' +
        '<div style="font-size:13px;font-weight:600;color:var(--text-main);">' + safe(item.producto) + '</div>' +
        '<div style="font-size:11px;color:var(--text-muted);">' +
          '<span style="font-family:\'DM Mono\',monospace;">' + safe(item.sku) + '</span>' +
          (item.categoria?' · '+safe(item.categoria):'') +
          (item.ubicacion?' · '+safe(item.ubicacion):'') +
        '</div>' +
      '</div>' +
      '<span style="flex-shrink:0;margin-left:14px;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:700;font-family:\'DM Mono\',monospace;background:'+dispBg+';color:'+dispColor+';">' +
        safe(item.disponible) +
      '</span>' +
    '</div>';
  }

  var html = '';

  if (delModelo.length) {
    html += '<div style="padding:6px 22px;font-size:10px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.6px;background:var(--bg-soft);">Del modelo seleccionado (' + delModelo.length + ')</div>';
    html += delModelo.slice(0,30).map(renderItem).join('');
  }

  if (otros.length) {
    if (delModelo.length) {
      html += '<div style="padding:6px 22px;font-size:10px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.6px;background:var(--bg-soft);border-top:2px solid var(--border-soft);">Otros productos (' + otros.length + ')</div>';
    }
    html += otros.slice(0,40).map(renderItem).join('');
  }

  if (!html) {
    html = '<div style="text-align:center;color:var(--text-muted);padding:30px;font-size:13px;">Sin resultados' + (q?' para "'+safe(q)+'"':'') + '</div>';
  }

  container.innerHTML = html;
}

function clSeleccionarProducto(item) {
  if (typeof item === 'string') { try { item=JSON.parse(item); } catch(e){ return; } }
  var fila = _clFilas.find(function(f){ return f.id===_clFilaBuscando; });
  if (fila) {
    fila.descripcion = item.producto;
    fila.sku = item.sku || '';
    // Si no tiene modelo aún, extraer del producto
    if (!fila.modelo) {
      var partes = item.producto.split(' - ');
      if (partes.length > 1) fila.modelo = partes[0].trim();
    }
  }
  clCerrarBuscador();
  clRenderTabla();
}

// Ingreso manual cuando no está en stock
function clIngresarManual() {
  var desc = prompt('Ingresa la descripción del repuesto:');
  if (!desc || !desc.trim()) return;
  var fila = _clFilas.find(function(f){ return f.id===_clFilaBuscando; });
  if (fila) {
    fila.descripcion = desc.trim();
    if (!fila.modelo) fila.modelo = '-';
  }
  clCerrarBuscador();
  clRenderTabla();
}

function clCerrarBuscador() {
  var m = document.getElementById('cl_modal_buscador');
  if (m) m.style.display = 'none';
  _clFilaBuscando = null;
}

// ── Fotos ─────────────────────────────────────────────────────
function clDragOver(e)  { e.preventDefault(); document.getElementById('cl_foto_dropzone').style.background='#bfdbfe'; }
function clDragLeave(e) { document.getElementById('cl_foto_dropzone').style.background='var(--bg-soft)'; }
function clDrop(e)      { e.preventDefault(); clDragLeave(); clAgregarFotos(Array.from(e.dataTransfer.files)); }
function clFotosSeleccionadas(input) { clAgregarFotos(Array.from(input.files)); input.value=''; }

function clAgregarFotos(files) {
  files.forEach(function(file) {
    if (_clFotos.length >= 5) { alert('Máximo 5 imágenes.'); return; }
    if (!file.type.startsWith('image/')) return;
    if (file.size > 10*1024*1024) { alert('"'+file.name+'" supera los 10 MB.'); return; }
    _clFotos.push(file);
  });
  clRenderFotos();
}

function clRenderFotos() {
  var container = document.getElementById('cl_fotos_preview');
  if (!container) return;
  container.innerHTML = '';
  _clFotos.forEach(function(file, idx) {
    var div = document.createElement('div');
    div.style.cssText = 'width:120px;border:1px solid var(--border-soft);border-radius:var(--radius-md);overflow:hidden;position:relative;';
    var url = URL.createObjectURL(file);
    div.innerHTML =
      '<img src="'+url+'" style="width:100%;height:90px;object-fit:cover;">' +
      '<div style="padding:5px 8px;font-size:10px;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+safe(file.name)+'</div>' +
      '<span onclick="clQuitarFoto('+idx+')" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,.5);color:#fff;border-radius:50%;width:18px;height:18px;display:flex;align-items:center;justify-content:center;font-size:12px;cursor:pointer;line-height:1;">×</span>';
    container.appendChild(div);
  });
}

function clQuitarFoto(idx) { _clFotos.splice(idx,1); clRenderFotos(); }

// ── Generar Word ──────────────────────────────────────────────
function clGenerarWord() {
  var fecha = document.getElementById('cl_fecha').value;
  if (!fecha) { alert('Ingresa la fecha de evaluación.'); return; }
  if (!_clFilas.length) { alert('Agrega al menos un repuesto.'); return; }
  var sinDesc = _clFilas.some(function(f){ return !f.descripcion.trim(); });
  if (sinDesc) { alert('Todas las filas deben tener un repuesto seleccionado.'); return; }

  var motivoSel = document.querySelector('input[name="cl_motivo"]:checked');
  var motivoVal = motivoSel ? motivoSel.value : '2';

  var btn = document.getElementById('cl_btn_generar');
  btn.textContent = 'Preparando...'; btn.disabled = true;
  document.getElementById('cl_resultado').style.display = 'none';

  // Leer fotos en base64
  var fotosPromesas = _clFotos.map(function(file) {
    return new Promise(function(resolve) {
      var reader = new FileReader();
      reader.onload = function(e) {
        resolve({
          base64:   e.target.result.split(',')[1],
          mimeType: file.type || 'image/jpeg',
          nombre:   file.name
        });
      };
      reader.onerror = function() { resolve(null); };
      reader.readAsDataURL(file);
    });
  });

  Promise.all(fotosPromesas).then(function(fotosBase64) {
    fotosBase64 = fotosBase64.filter(Boolean);
    btn.textContent = 'Generando documento...';

    var payload = {
      correlativo:    document.getElementById('cl_correlativo').value || '',
      fecha:          fecha,
      autorizado:     document.getElementById('cl_autorizado').value,
      tecnico:        document.getElementById('cl_tecnico') ? document.getElementById('cl_tecnico').value : '',
      analista:       document.getElementById('cl_analista').value,
      motivo1:        motivoVal === '1',
      motivo2:        motivoVal === '2',
      motivo3:        motivoVal === '3',
      motivoOtro:     document.getElementById('cl_motivo_otro_input').value,
      detalle:        document.getElementById('cl_detalle').value,
      filas:          _clFilas.map(function(f){
                        return { modelo: f.modelo, descripcion: f.descripcion, cantidad: f.cantidad, observaciones: f.observaciones || 'Ninguna' };
                      }),
      respEvalNombre: document.getElementById('cl_eval_nombre').value,
      respEvalFecha:  document.getElementById('cl_eval_fecha').value,
      respAutNombre:  document.getElementById('cl_aut_nombre').value,
      respAutFecha:   document.getElementById('cl_aut_fecha').value,
      fotosBase64:    fotosBase64
    };

    google.script.run
      .withSuccessHandler(function(res) {
        btn.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> Generar y guardar en Drive';
        btn.disabled = false;
        if (res && res.ok) {
          var linkEl = document.getElementById('cl_resultado_link');
          linkEl.href = res.url;
          linkEl.textContent = 'Abrir ' + res.nombre + ' en Drive';
          document.getElementById('cl_resultado').style.display = 'block';
          document.getElementById('cl_resultado').scrollIntoView({ behavior: 'smooth' });
          var corrEl = document.getElementById('cl_correlativo');
          if (corrEl) corrEl.value = String(parseInt(res.correlativo,10)+1).padStart(3,'0');
        }
      })
      .withFailureHandler(function(err) {
        btn.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> Generar y guardar en Drive';
        btn.disabled = false;
        alert('Error: ' + (err.message || err));
      })
      .generarChecklistWord(payload);
  });
}

// ── Limpiar ───────────────────────────────────────────────────
function clLimpiar() {
  if (!confirm('¿Limpiar todo el formulario?')) return;
  _clFilas=[]; _clFotos=[]; _clFilaCounter=0;

  // Limpiar campos simples
  ['cl_fecha','cl_autorizado','cl_detalle','cl_motivo_otro_input','cl_eval_fecha','cl_aut_fecha']
    .forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });

  // Resetear analista y sincronizar nombre de evaluación
  document.getElementById('cl_analista').value = 'Jean Pierre Morales Alejos';
  document.getElementById('cl_eval_nombre').value = 'Jean Pierre Morales Alejos';

  // Limpiar autorizado y sincronizar nombre de autorización
  document.getElementById('cl_aut_nombre').value = '';

  // Resetear otros
  document.getElementById('cl_motivo2').checked = true;
  document.getElementById('cl_resultado').style.display = 'none';
  document.getElementById('cl_fotos_preview').innerHTML = '';
  document.getElementById('cl_foto_input').value = '';

  clRenderTabla();
  clAgregarFila();
}


// =========================================
// CHECKLIST BAJA DE EQUIPOS — JS
// =========================================
var _cbPiezas       = [];
var _cbPartes       = [];
var _cbFotos        = [];
var _cbFotoEval     = null;
var _cbPiezaCounter = 0;
var _cbParteCounter = 0;
var _cbStockCache   = null;
var _cbInicializado = false;

// Modal buscador reutilizado
var _cbFilaBuscando    = null;
var _cbTipoBuscando    = null; // 'pieza' o 'parte'
var _cbModeloActualBusq2 = '';

function cbInicializar() {
  if (_cbInicializado) return;
  _cbInicializado = true;
  cbAgregarPieza();
  cbAgregarParte();
}

function cbFormatFecha(input) {
  var v = input.value.replace(/\D/g,'');
  if (v.length >= 2) v = v.substring(0,2)+'/'+v.substring(2);
  if (v.length >= 5) v = v.substring(0,5)+'/'+v.substring(5,9);
  input.value = v;
}

// ── Piezas retiradas ──────────────────────────────────────────
function cbAgregarPieza() {
  _cbPiezaCounter++;
  _cbPiezas.push({ id: _cbPiezaCounter, descripcion: '', observacion: '' });
  cbRenderPiezas();
}

function cbEliminarPieza(id) {
  _cbPiezas = _cbPiezas.filter(function(p){ return p.id !== id; });
  cbRenderPiezas();
}

function cbRenderPiezas() {
  var tbody = document.getElementById('cb_piezas_body');
  if (!tbody) return;
  tbody.innerHTML = _cbPiezas.map(function(p, i) {
    var tieneDesc = !!p.descripcion;
    return '<tr>' +
      '<td style="text-align:center;font-weight:700;color:var(--text-muted);padding:8px 6px;">' + (i+1) + '</td>' +
      '<td style="padding:6px;">' +
        (tieneDesc
          ? '<div style="display:flex;align-items:center;gap:6px;"><span style="font-size:12px;flex:1;">' + safe(p.descripcion) + '</span><button onclick="cbAbrirBuscador2(\'pieza\',' + p.id + ')" style="background:var(--bg-soft);border:0.5px solid var(--border-soft);border-radius:6px;padding:2px 7px;font-size:10px;cursor:pointer;color:var(--text-muted);">Cambiar</button></div>'
          : '<button onclick="cbAbrirBuscador2(\'pieza\',' + p.id + ')" style="background:var(--blue-soft);border:1px dashed var(--blue-main);border-radius:8px;padding:7px 14px;font-size:12px;cursor:pointer;color:var(--blue-dark);font-weight:600;width:100%;text-align:left;">🔍 Buscar pieza del stock...</button>'
        ) +
      '</td>' +
      '<td style="padding:6px;"><input type="text" value="' + safe(p.observacion||'') + '" placeholder="Ninguna" style="width:100%;border:0.5px solid var(--border-soft);border-radius:6px;padding:5px 8px;font-size:12px;font-family:inherit;" onchange="cbCambiarObsPieza(' + p.id + ',this.value)"></td>' +
      '<td style="text-align:center;padding:6px;"><button onclick="cbEliminarPieza(' + p.id + ')" style="background:none;border:none;color:var(--red-main);cursor:pointer;font-size:18px;line-height:1;">×</button></td>' +
    '</tr>';
  }).join('');
}

function cbCambiarObsPieza(id, val) {
  var p = _cbPiezas.find(function(x){ return x.id===id; });
  if (p) p.observacion = val;
}

// ── Partes descartadas ────────────────────────────────────────
function cbAgregarParte() {
  _cbParteCounter++;
  _cbPartes.push({ id: _cbParteCounter, descripcion: '', motivo: '' });
  cbRenderPartes();
}

function cbEliminarParte(id) {
  _cbPartes = _cbPartes.filter(function(p){ return p.id !== id; });
  cbRenderPartes();
}

function cbRenderPartes() {
  var tbody = document.getElementById('cb_partes_body');
  if (!tbody) return;
  tbody.innerHTML = _cbPartes.map(function(p, i) {
    var tieneDesc = !!p.descripcion;
    return '<tr>' +
      '<td style="text-align:center;font-weight:700;color:var(--text-muted);padding:8px 6px;">' + (i+1) + '</td>' +
      '<td style="padding:6px;">' +
        (tieneDesc
          ? '<div style="display:flex;align-items:center;gap:6px;"><span style="font-size:12px;flex:1;">' + safe(p.descripcion) + '</span><button onclick="cbAbrirBuscador2(\'parte\',' + p.id + ')" style="background:var(--bg-soft);border:0.5px solid var(--border-soft);border-radius:6px;padding:2px 7px;font-size:10px;cursor:pointer;color:var(--text-muted);">Cambiar</button></div>'
          : '<button onclick="cbAbrirBuscador2(\'parte\',' + p.id + ')" style="background:var(--blue-soft);border:1px dashed var(--blue-main);border-radius:8px;padding:7px 14px;font-size:12px;cursor:pointer;color:var(--blue-dark);font-weight:600;width:100%;text-align:left;">🔍 Buscar componente del stock...</button>'
        ) +
      '</td>' +
      '<td style="padding:6px;"><input type="text" value="' + safe(p.motivo||'') + '" placeholder="Ej: Desgastado" style="width:100%;border:0.5px solid var(--border-soft);border-radius:6px;padding:5px 8px;font-size:12px;font-family:inherit;" onchange="cbCambiarMotivoParte(' + p.id + ',this.value)"></td>' +
      '<td style="text-align:center;padding:6px;"><button onclick="cbEliminarParte(' + p.id + ')" style="background:none;border:none;color:var(--red-main);cursor:pointer;font-size:18px;line-height:1;">×</button></td>' +
    '</tr>';
  }).join('');
}

function cbCambiarMotivoParte(id, val) {
  var p = _cbPartes.find(function(x){ return x.id===id; });
  if (p) p.motivo = val;
}

// ── Modal buscador stock (reutiliza el mismo modal del checklist) ──
function cbAbrirBuscador2(tipo, filaId) {
  _cbTipoBuscando = tipo;
  _cbFilaBuscando = filaId;

  var modelo = document.getElementById('cb_modelo') ? document.getElementById('cb_modelo').value.toLowerCase() : '';
  _cbModeloActualBusq2 = modelo;

  var modal = document.getElementById('cb_modal_buscador');
  if (!modal) { cbCrearModalBuscador(); modal = document.getElementById('cb_modal_buscador'); }
  modal.style.display = 'flex';

  var inp = document.getElementById('cb_busq_input');
  if (inp) { inp.value = ''; setTimeout(function(){ inp.focus(); }, 100); }

  if (!_cbStockCache) {
    document.getElementById('cb_busq_resultados').innerHTML =
      '<div style="text-align:center;color:var(--text-muted);padding:30px;">Cargando productos...</div>';
    google.script.run
      .withSuccessHandler(function(data) {
        _cbStockCache = data.rows || [];
        cbFiltrarBuscador2('');
      })
      .withFailureHandler(function() {})
      .getStockProductos('');
  } else {
    cbFiltrarBuscador2('');
  }
}

function cbCrearModalBuscador() {
  var modal = document.createElement('div');
  modal.id = 'cb_modal_buscador';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);display:none;align-items:center;justify-content:center;z-index:10010;backdrop-filter:blur(3px);';
  modal.innerHTML =
    '<div style="background:#fff;border-radius:18px;width:min(720px,92vw);max-height:82vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 80px rgba(13,13,12,.24);">' +
      '<div style="padding:18px 22px;border-bottom:0.5px solid var(--border-soft);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">' +
        '<div style="font-size:14px;font-weight:700;">Seleccionar del stock</div>' +
        '<button onclick="cbCerrarBuscador2()" style="width:32px;height:32px;border-radius:50%;border:0.5px solid var(--border-soft);background:var(--bg-soft);cursor:pointer;font-size:18px;color:var(--text-muted);">×</button>' +
      '</div>' +
      '<div style="padding:14px 22px;border-bottom:0.5px solid var(--border-soft);flex-shrink:0;">' +
        '<div style="display:flex;align-items:center;gap:8px;padding:0 14px;border:1.5px solid var(--text-main);border-radius:var(--radius-md);background:#fff;">' +
          '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="var(--text-muted)" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>' +
          '<input id="cb_busq_input" type="text" placeholder="Buscar por nombre, SKU o categoría..." style="flex:1;border:none;outline:none;font-size:13px;padding:11px 0;font-family:inherit;" oninput="cbFiltrarBuscador2Input(this.value)">' +
        '</div>' +
        '<div id="cb_busq_modelo_badge" style="margin-top:8px;font-size:11px;color:var(--text-muted);"></div>' +
      '</div>' +
      '<div id="cb_busq_resultados" style="flex:1;overflow-y:auto;padding:8px 0;"></div>' +
      '<div style="padding:10px 22px;border-top:0.5px solid var(--border-soft);font-size:11px;color:var(--text-muted);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">' +
        '<span>¿No encuentras el componente? <button onclick="cbIngresarManual2()" style="background:none;border:none;color:var(--blue-main);font-weight:600;cursor:pointer;font-size:11px;font-family:inherit;text-decoration:underline;">Ingresar manualmente</button></span>' +
        '<button onclick="cbCerrarBuscador2()" class="clear-btn" style="padding:6px 14px;">Cancelar</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(modal);
  modal.addEventListener('click', function(e){ if(e.target===modal) cbCerrarBuscador2(); });
}

var _cbBusqTimer2 = null;
function cbFiltrarBuscador2Input(query) {
  clearTimeout(_cbBusqTimer2);
  _cbBusqTimer2 = setTimeout(function(){ cbFiltrarBuscador2(query); }, 200);
}

function cbFiltrarBuscador2(query) {
  var badge = document.getElementById('cb_busq_modelo_badge');
  if (badge) {
    badge.innerHTML = _cbModeloActualBusq2
      ? '📦 Mostrando primero productos del modelo <strong>' + safe(_cbModeloActualBusq2.toUpperCase()) + '</strong>'
      : '';
  }
  var container = document.getElementById('cb_busq_resultados');
  if (!container || !_cbStockCache) return;

  var q = (query||'').trim().toLowerCase();
  var todos = q ? _cbStockCache.filter(function(item){
    return (item.producto+' '+item.sku+' '+item.categoria).toLowerCase().includes(q);
  }) : _cbStockCache;

  var delModelo = [], otros = [];
  todos.forEach(function(item) {
    if (_cbModeloActualBusq2 && item.producto.toLowerCase().includes(_cbModeloActualBusq2)) {
      delModelo.push(item);
    } else {
      otros.push(item);
    }
  });

  function renderItem(item) {
    var disp = parseInt(item.disponible, 10);
    var dispColor = isNaN(disp)?'#94a3b8':disp<=0?'#ef4444':disp<=3?'#d97706':'#22c55e';
    var dispBg    = isNaN(disp)?'#f1f5f9':disp<=0?'#fee2e2':disp<=3?'#fef3c7':'#dcfce7';
    var itemStr   = safe(JSON.stringify(item));
    return '<div onclick="cbSeleccionarProducto2(' + itemStr + ')" ' +
      'style="display:flex;align-items:center;justify-content:space-between;padding:11px 22px;border-bottom:0.5px solid var(--border-soft);cursor:pointer;" ' +
      'onmouseenter="this.style.background=\'var(--bg-soft)\'" onmouseleave="this.style.background=\'\'">' +
      '<div style="flex:1;min-width:0;">' +
        '<div style="font-size:13px;font-weight:600;color:var(--text-main);">' + safe(item.producto) + '</div>' +
        '<div style="font-size:11px;color:var(--text-muted);">' +
          '<span style="font-family:\'DM Mono\',monospace;">' + safe(item.sku) + '</span>' +
          (item.categoria?' · '+safe(item.categoria):'') +
        '</div>' +
      '</div>' +
      '<span style="flex-shrink:0;margin-left:14px;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:700;font-family:\'DM Mono\',monospace;background:'+dispBg+';color:'+dispColor+';">' +
        safe(item.disponible) + '</span>' +
    '</div>';
  }

  var html = '';
  if (delModelo.length) {
    html += '<div style="padding:6px 22px;font-size:10px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.6px;background:var(--bg-soft);">Del modelo (' + delModelo.length + ')</div>';
    html += delModelo.slice(0,30).map(renderItem).join('');
  }
  if (otros.length) {
    if (delModelo.length) html += '<div style="padding:6px 22px;font-size:10px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.6px;background:var(--bg-soft);border-top:2px solid var(--border-soft);">Otros (' + otros.length + ')</div>';
    html += otros.slice(0,40).map(renderItem).join('');
  }
  if (!html) html = '<div style="text-align:center;color:var(--text-muted);padding:30px;font-size:13px;">Sin resultados</div>';
  container.innerHTML = html;
}

function cbSeleccionarProducto2(item) {
  if (typeof item === 'string') { try { item = JSON.parse(item); } catch(e){ return; } }
  if (_cbTipoBuscando === 'pieza') {
    var p = _cbPiezas.find(function(x){ return x.id===_cbFilaBuscando; });
    if (p) p.descripcion = item.producto;
    cbCerrarBuscador2();
    cbRenderPiezas();
  } else {
    var pt = _cbPartes.find(function(x){ return x.id===_cbFilaBuscando; });
    if (pt) pt.descripcion = item.producto;
    cbCerrarBuscador2();
    cbRenderPartes();
  }
}

function cbIngresarManual2() {
  var label = _cbTipoBuscando === 'pieza' ? 'pieza retirada' : 'componente descartado';
  var desc = prompt('Ingresa el nombre del ' + label + ':');
  if (!desc || !desc.trim()) return;
  if (_cbTipoBuscando === 'pieza') {
    var p = _cbPiezas.find(function(x){ return x.id===_cbFilaBuscando; });
    if (p) p.descripcion = desc.trim();
    cbCerrarBuscador2();
    cbRenderPiezas();
  } else {
    var pt = _cbPartes.find(function(x){ return x.id===_cbFilaBuscando; });
    if (pt) pt.descripcion = desc.trim();
    cbCerrarBuscador2();
    cbRenderPartes();
  }
}

function cbCerrarBuscador2() {
  var m = document.getElementById('cb_modal_buscador');
  if (m) m.style.display = 'none';
  _cbFilaBuscando = null;
  _cbTipoBuscando = null;
}

// ── Foto evaluación técnica ───────────────────────────────────
function cbFotoEvalSeleccionada(input) {
  var file = input.files && input.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) { alert('Solo imágenes.'); return; }
  if (file.size > 10*1024*1024) { alert('Supera 10 MB.'); return; }
  _cbFotoEval = file;
  var url = URL.createObjectURL(file);
  document.getElementById('cb_foto_eval_img').src = url;
  document.getElementById('cb_foto_eval_nombre').textContent = file.name;
  document.getElementById('cb_foto_eval_preview').style.display = 'block';
  document.getElementById('cb_foto_eval_label').textContent = '✓ ' + file.name;
}

function cbQuitarFotoEval() {
  _cbFotoEval = null;
  document.getElementById('cb_foto_eval_input').value = '';
  document.getElementById('cb_foto_eval_preview').style.display = 'none';
  document.getElementById('cb_foto_eval_label').textContent = 'Haz clic para subir la foto de la ficha de evaluación';
}

// ── Fotos evidencia ───────────────────────────────────────────
function cbDragOver(e)  { e.preventDefault(); document.getElementById('cb_fotos_dropzone').style.background='#bfdbfe'; }
function cbDragLeave(e) { document.getElementById('cb_fotos_dropzone').style.background='var(--bg-soft)'; }
function cbDrop(e)      { e.preventDefault(); cbDragLeave(); cbAgregarFotos(Array.from(e.dataTransfer.files)); }
function cbFotosSeleccionadas(input) { cbAgregarFotos(Array.from(input.files)); input.value=''; }

function cbAgregarFotos(files) {
  files.forEach(function(file) {
    if (_cbFotos.length >= 5) { alert('Máximo 5 imágenes.'); return; }
    if (!file.type.startsWith('image/')) return;
    if (file.size > 10*1024*1024) { alert('"'+file.name+'" supera los 10 MB.'); return; }
    _cbFotos.push(file);
  });
  cbRenderFotos();
}

function cbRenderFotos() {
  var container = document.getElementById('cb_fotos_preview');
  if (!container) return;
  container.innerHTML = '';
  _cbFotos.forEach(function(file, idx) {
    var div = document.createElement('div');
    div.style.cssText = 'width:120px;border:1px solid var(--border-soft);border-radius:var(--radius-md);overflow:hidden;position:relative;';
    var url = URL.createObjectURL(file);
    div.innerHTML =
      '<img src="'+url+'" style="width:100%;height:90px;object-fit:cover;">' +
      '<div style="padding:5px 8px;font-size:10px;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+safe(file.name)+'</div>' +
      '<span onclick="cbQuitarFoto('+idx+')" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,.5);color:#fff;border-radius:50%;width:18px;height:18px;display:flex;align-items:center;justify-content:center;font-size:12px;cursor:pointer;line-height:1;">×</span>';
    container.appendChild(div);
  });
}

function cbQuitarFoto(idx) { _cbFotos.splice(idx,1); cbRenderFotos(); }

// ── Generar Word ──────────────────────────────────────────────
function cbGenerarWord() {
  var fecha = document.getElementById('cb_fecha').value;
  if (!fecha) { alert('Ingresa la fecha de evaluación.'); return; }
  var serie = document.getElementById('cb_serie').value.trim();
  if (!serie) { alert('Ingresa el número de serie del equipo.'); return; }
  var modelo = document.getElementById('cb_modelo').value.trim();
  if (!modelo) { alert('Ingresa el modelo del equipo.'); return; }
  if (!_cbPiezas.length || _cbPiezas.some(function(p){ return !p.descripcion.trim(); })) {
    alert('Agrega al menos una pieza retirada.'); return;
  }

  var motivoSel = document.querySelector('input[name="cb_motivo"]:checked');
  var motivoVal = motivoSel ? motivoSel.value : '2';

  var btn = document.getElementById('cb_btn_generar');
  btn.textContent = 'Preparando...'; btn.disabled = true;
  document.getElementById('cb_resultado').style.display = 'none';

  // Leer todas las imágenes en base64
  var archivos = [];
  if (_cbFotoEval) archivos.push({ file: _cbFotoEval, tipo: 'eval' });
  _cbFotos.forEach(function(f) { archivos.push({ file: f, tipo: 'evidencia' }); });

  var promesas = archivos.map(function(a) {
    return new Promise(function(resolve) {
      var reader = new FileReader();
      reader.onload = function(e) {
        resolve({ base64: e.target.result.split(',')[1], mimeType: a.file.type||'image/jpeg', tipo: a.tipo });
      };
      reader.onerror = function() { resolve(null); };
      reader.readAsDataURL(a.file);
    });
  });

  Promise.all(promesas).then(function(resultados) {
    resultados = resultados.filter(Boolean);
    var fotoEvalB64  = resultados.filter(function(r){ return r.tipo==='eval'; })[0] || null;
    var fotosEvidB64 = resultados.filter(function(r){ return r.tipo==='evidencia'; });

    btn.textContent = 'Generando documento...';

    var payload = {
      correlativo:  document.getElementById('cb_correlativo').value || '',
      fecha:        fecha,
      autorizado:   document.getElementById('cb_autorizado').value,
      tecnico:      document.getElementById('cb_tecnico').value,
      analista:     document.getElementById('cb_analista').value,
      modelo:       modelo,
      color:        document.getElementById('cb_color').value,
      serie:        serie,
      fechaIngreso: document.getElementById('cb_fecha_ingreso').value,
      estado:       document.getElementById('cb_estado').value,
      motivo1:      motivoVal==='1',
      motivo2:      motivoVal==='2',
      motivo3:      motivoVal==='3',
      motivo4:      motivoVal==='4',
      motivo5:      motivoVal==='5',
      motivoOtro:   document.getElementById('cb_motivo_otro_input').value,
      detalle:      document.getElementById('cb_detalle').value,
      piezas:       _cbPiezas.map(function(p){ return { descripcion: p.descripcion, observacion: p.observacion||'Ninguna' }; }),
      partes:       _cbPartes.filter(function(p){ return p.descripcion.trim(); }).map(function(p){ return { descripcion: p.descripcion, motivo: p.motivo||'' }; }),
      fotoEval:     fotoEvalB64,
      fotosBase64:  fotosEvidB64,
      evalNombre:   document.getElementById('cb_eval_nombre').value,
      evalFecha:    document.getElementById('cb_eval_fecha').value,
      autNombre:    document.getElementById('cb_aut_nombre').value,
      autFecha:     document.getElementById('cb_aut_fecha').value
    };

    google.script.run
      .withSuccessHandler(function(res) {
        btn.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> Generar Word y guardar en Drive';
        btn.disabled = false;
        if (res && res.ok) {
          document.getElementById('cb_resultado_link').href = res.url;
          document.getElementById('cb_resultado_link').textContent = 'Abrir ' + res.nombre + ' en Drive';
          document.getElementById('cb_resultado').style.display = 'block';
          document.getElementById('cb_resultado').scrollIntoView({ behavior:'smooth' });
          var corrEl = document.getElementById('cb_correlativo');
          if (corrEl) corrEl.value = String(parseInt(res.correlativo,10)+1).padStart(3,'0');
        }
      })
      .withFailureHandler(function(err) {
        btn.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> Generar Word y guardar en Drive';
        btn.disabled = false;
        alert('Error: ' + (err.message||err));
      })
      .generarChecklistBaja(payload);
  });
}
// ── Selector de modelo para Checklist Baja ────────────────────
var _cbModelosList = [];

function cbAbrirSelectorModelo() {
  if (!_cbModelosList.length) {
    google.script.run
      .withSuccessHandler(function(config) {
        _cbModelosList = config.modelos || [];
        cbMostrarModalModelo();
      })
      .withFailureHandler(function() {
        alert('No se pudo cargar la lista de modelos.');
      })
      .getConfigTaller();
  } else {
    cbMostrarModalModelo();
  }
}

function cbMostrarModalModelo() {
 var existing = document.getElementById('cb_modal_modelo');
  if (existing) existing.remove();

  var modal = document.createElement('div');
  modal.id = 'cb_modal_modelo';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:10020;backdrop-filter:blur(3px);';

  modal.innerHTML =
    '<div style="background:#fff;border-radius:18px;width:min(460px,92vw);max-height:78vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 80px rgba(13,13,12,.24);">' +
      '<div style="padding:18px 22px;border-bottom:0.5px solid var(--border-soft);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">' +
        '<div style="font-size:14px;font-weight:700;">Seleccionar Modelo</div>' +
        '<button onclick="document.getElementById(\'cb_modal_modelo\').remove()" style="width:30px;height:30px;border-radius:50%;border:0.5px solid var(--border-soft);background:var(--bg-soft);cursor:pointer;font-size:16px;color:var(--text-muted);">×</button>' +
      '</div>' +
      '<div style="padding:12px 16px;border-bottom:0.5px solid var(--border-soft);flex-shrink:0;">' +
        '<input id="cb_modelo_filtro" type="text" placeholder="Filtrar modelo..." oninput="cbFiltrarModelos(this.value)" ' +
          'style="width:100%;border:0.5px solid var(--border-soft);border-radius:var(--radius-md);padding:10px 14px;font-size:13px;font-family:inherit;outline:none;box-sizing:border-box;">' +
      '</div>' +
      '<div id="cb_modelos_lista" style="flex:1;overflow-y:auto;"></div>' +
      '<div style="padding:12px 16px;border-top:0.5px solid var(--border-soft);display:flex;justify-content:flex-end;flex-shrink:0;">' +
        '<button onclick="document.getElementById(\'cb_modal_modelo\').remove()" ' +
          'style="padding:8px 20px;border:0.5px solid var(--border-soft);border-radius:var(--radius-md);background:var(--bg-soft);cursor:pointer;font-size:13px;font-family:inherit;">Cancelar</button>' +
      '</div>' +
    '</div>';

  modal.addEventListener('click', function(e) { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);

  setTimeout(function() { document.getElementById('cb_modelo_filtro').focus(); }, 100);
  cbFiltrarModelos('');
}

function cbFiltrarModelos(query) {
  var lista = document.getElementById('cb_modelos_lista');
  if (!lista) return;
  var q = (query||'').toLowerCase();
  var filtrados = q ? _cbModelosList.filter(function(m){ return m.toLowerCase().indexOf(q) >= 0; }) : _cbModelosList;
  
  lista.innerHTML = filtrados.length ? filtrados.map(function(m) {
    return '<button data-modelo="' + m.replace(/"/g,'&quot;') + '" ' +
      'style="display:block;width:100%;text-align:left;padding:13px 22px;border:none;border-bottom:0.5px solid var(--border-soft);background:#fff;cursor:pointer;font-size:13px;font-family:inherit;" ' +
      'onmouseenter="this.style.background=\'var(--bg-soft)\'" onmouseleave="this.style.background=\'#fff\'">' +
      m + '</button>';
  }).join('') : '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px;">Sin resultados</div>';

  // Agregar listeners directamente en los botones
  var botones = lista.querySelectorAll('button[data-modelo]');
  botones.forEach(function(btn) {
    btn.addEventListener('click', function() {
      cbSeleccionarModelo(this.getAttribute('data-modelo'));
    });
  });
}

function cbSeleccionarModelo(modelo) {
  document.getElementById('cb_modelo').value = modelo;
  var texto = document.getElementById('cb_modelo_texto');
  if (texto) {
    texto.textContent = modelo;
    texto.style.color = 'var(--text-main)';
    texto.style.fontWeight = '600';
  }
  var modal = document.getElementById('cb_modal_modelo');
  if (modal) modal.remove();
}
// ── Limpiar ───────────────────────────────────────────────────
function cbLimpiar() {
  if (!confirm('¿Limpiar todo el formulario?')) return;
  _cbPiezas=[]; _cbPartes=[]; _cbFotos=[]; _cbFotoEval=null;
  _cbPiezaCounter=0; _cbParteCounter=0;
  ['cb_fecha','cb_autorizado','cb_tecnico','cb_detalle','cb_motivo_otro_input',
   'cb_modelo','cb_color','cb_serie','cb_fecha_ingreso','cb_estado',
   'cb_eval_fecha','cb_aut_fecha']
    .forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });

  // Resetear selector de modelo
  var cbModeloTexto = document.getElementById('cb_modelo_texto');
  if (cbModeloTexto) {
    cbModeloTexto.textContent = 'Seleccionar...';
    cbModeloTexto.style.color = 'var(--text-muted)';
    cbModeloTexto.style.fontWeight = 'normal';
  }

  document.getElementById('cb_analista').value = 'Jean Pierre Morales Alejos';
  document.getElementById('cb_eval_nombre').value = 'Jean Pierre Morales Alejos';
  document.getElementById('cb_aut_nombre').value = '';
  document.getElementById('cb_motivo2').checked = true;
  document.getElementById('cb_resultado').style.display = 'none';
  document.getElementById('cb_fotos_preview').innerHTML = '';
  document.getElementById('cb_fotos_input').value = '';
  document.getElementById('cb_foto_eval_preview').style.display = 'none';
  document.getElementById('cb_foto_eval_input').value = '';
  document.getElementById('cb_foto_eval_label').textContent = 'Haz clic para subir la foto de la ficha de evaluación';
  cbRenderPiezas();
  cbRenderPartes();
  cbAgregarPieza();
  cbAgregarParte();
}
// =========================================
// MÓDULO ALERTAS SAC
// =========================================
var _sacAllData      = [];
var _sacFiltroActual = 'todos';
var _sacQueryActual  = '';
var _sacAnioActual   = 'todos';

function sacGetCfg(status) {
  var s = normalize_(status || '');
  if (s.includes('listo'))
    return { bg:'#dcfce7', color:'#166534', dot:'#16a34a', label:'Listo' };
  if (s.includes('espera'))
    return { bg:'#fef3c7', color:'#92400e', dot:'#d97706', label:'En espera' };
  if (s.includes('no ingresado') || s.includes('aun no') || s.includes('sin ingresar'))
    return { bg:'#fee2e2', color:'#991b1b', dot:'#ef4444', label:'Sin ingresar' };
  return { bg:'#f1f5f9', color:'#475569', dot:'#94a3b8', label: status || '-' };
}

function sacParseAnio(fecha) {
  if (!fecha || fecha === '-') return null;
  var p = String(fecha).split('/');
  if (p.length === 3 && p[2] && p[2].length === 4) return p[2];
  var p2 = String(fecha).split('-');
  if (p2.length === 3 && p2[0].length === 4) return p2[0];
  return null;
}

function abrirSACModal() {
  document.getElementById('sacModal').classList.add('active');
  if (!_sacAllData.length) loadSACFresh();
  else sacRenderAll();
}

function cerrarSACModal() {
  document.getElementById('sacModal').classList.remove('active');
}

function loadSACFresh() {
  document.getElementById('sacTableBody').innerHTML =
    '<tr><td colspan="10" style="padding:48px;text-align:center;">' + htmlDashboardCargador + '</td></tr>';
  document.getElementById('sacModalSubtitle').textContent = 'Actualizando...';
  google.script.run
    .withSuccessHandler(function(data) {
      _sacAllData      = data || [];
      _sacFiltroActual = 'todos';
      _sacQueryActual  = '';
      _sacAnioActual   = 'todos';
      var inp = document.getElementById('sacBuscarInput'); if (inp) inp.value = '';
      document.querySelectorAll('#sacTabs .search-tab').forEach(function(t){ t.classList.remove('active'); });
      var t0 = document.querySelector('#sacTabs [data-sac="todos"]'); if(t0) t0.classList.add('active');
      sacRenderAll();
      loadSACBadge();
    })
    .withFailureHandler(function(e) {
      document.getElementById('sacTableBody').innerHTML =
        '<tr><td colspan="10" style="padding:40px;text-align:center;color:var(--red-main);">Error: ' + safe(e.message||e) + '</td></tr>';
    })
    .getAlertaTicketsSAC();
}

function sacRenderAll() {
  sacRenderStats();
  sacRenderAnios();
  sacRenderTabla(sacGetFiltrado());
}

function sacRenderStats() {
  var data = _sacAllData;
  var cnts = { espera:0, listo:0, sin:0 };
  data.forEach(function(r) {
    var s = normalize_(r.status || '');
    if      (s.includes('listo'))  cnts.listo++;
    else if (s.includes('espera')) cnts.espera++;
    else if (s.includes('no ingresado') || s.includes('aun no')) cnts.sin++;
  });

  function card(label, val, bg, color, dot) {
    return '<div style="display:flex;align-items:center;gap:10px;padding:10px 18px;background:'+bg+';border-radius:var(--radius-md);min-width:120px;">' +
      '<span style="width:8px;height:8px;border-radius:50%;background:'+dot+';flex-shrink:0;"></span>' +
      '<div><div style="font-size:22px;font-weight:800;font-family:\'DM Mono\',monospace;color:'+color+';line-height:1;">'+val+'</div>' +
      '<div style="font-size:10px;font-weight:600;color:'+color+';opacity:.7;margin-top:2px;">'+label+'</div></div></div>';
  }

  document.getElementById('sacStats').innerHTML =
    card('Total',         data.length,  '#f8fafc','#1F2937','#94a3b8') +
    card('En espera',     cnts.espera,  '#fef3c7','#92400e','#d97706') +
    card('Listos',        cnts.listo,   '#dcfce7','#166534','#16a34a') +
    card('Sin ingresar',  cnts.sin,     '#fee2e2','#991b1b','#ef4444');

  document.getElementById('sacModalSubtitle').textContent =
    data.length + ' registros — ' + cnts.espera + ' en espera · ' + cnts.sin + ' sin ingresar';
}

function sacRenderAnios() {
  var aniosSet = {};
  _sacAllData.forEach(function(r) {
    var a = sacParseAnio(r.fecha);
    if (a) aniosSet[a] = true;
  });
  var anios = Object.keys(aniosSet).sort().reverse();

  var select = document.getElementById('sacAnioSelect');
  if (!select) return;

  var htmlOpts = '<option value="todos">Todos los años</option>';
  anios.forEach(function(a) {
    htmlOpts += '<option value="'+a+'" '+(a===_sacAnioActual?'selected':'')+'>'+a+'</option>';
  });
  select.innerHTML = htmlOpts;
  select.value = _sacAnioActual;
}

function sacGetFiltrado() {
  var items = _sacAllData;

  // Filtro año
  if (_sacAnioActual !== 'todos') {
    items = items.filter(function(r) {
      return sacParseAnio(r.fecha) === _sacAnioActual;
    });
  }

  // Filtro status
  if (_sacFiltroActual !== 'todos') {
    items = items.filter(function(r) {
      var s = normalize_(r.status || '');
      if (_sacFiltroActual === 'espera') return s.includes('espera');
      if (_sacFiltroActual === 'listo')  return s.includes('listo');
      if (_sacFiltroActual === 'sin')    return s.includes('no ingresado') || s.includes('aun no');
      return true;
    });
  }

  // Búsqueda libre
  if (_sacQueryActual) {
    var q = normalize_(_sacQueryActual);
    items = items.filter(function(r) {
      return normalize_(r.ticket+' '+r.cliente+' '+r.asesor+' '+r.producto+' '+r.status+' '+r.seguimiento).includes(q);
    });
  }
  return items;
}

function sacRenderTabla(items) {
  var ctEl = document.getElementById('sacContador');
  if (ctEl) ctEl.textContent = items.length + ' registro' + (items.length !== 1 ? 's' : '');

  if (!items.length) {
    document.getElementById('sacTableBody').innerHTML =
      '<tr><td colspan="10" style="padding:48px;text-align:center;color:var(--text-muted);font-size:13px;">Sin registros para este filtro</td></tr>';
    return;
  }

  var tdBase = 'style="padding:10px 12px;border-bottom:0.5px solid var(--border-soft);vertical-align:top;"';

var html = items.map(function(r) {
    var cfg = sacGetCfg(r.status);

    // ← FALTABA ESTA DEFINICIÓN
    var seg = r.seguimiento && r.seguimiento !== '-'
      ? (r.seguimiento.length > 65 ? r.seguimiento.substring(0,65)+'…' : r.seguimiento)
      : '—';

    var com = r.comentario && r.comentario !== '-' ? r.comentario : '—';

    var garantiaBadge =
      /^(si|sí|yes|1)$/i.test(r.garantia)
        ? '<span style="padding:2px 7px;background:#dcfce7;color:#166534;border-radius:999px;font-size:10px;font-weight:700;">Sí</span>'
      : /^(no|0)$/i.test(r.garantia)
        ? '<span style="padding:2px 7px;background:#fee2e2;color:#991b1b;border-radius:999px;font-size:10px;font-weight:700;">No</span>'
        : '<span style="color:var(--text-faint);">—</span>';

    return '<tr onmouseenter="this.style.background=\'var(--bg-soft)\'" onmouseleave="this.style.background=\'\'">' +
      '<td '+tdBase+' style="padding:10px 12px;border-bottom:0.5px solid var(--border-soft);font-family:\'DM Mono\',monospace;font-weight:700;font-size:12px;color:var(--text-main);white-space:nowrap;">'+safe(r.ticket)+'</td>' +
      '<td '+tdBase+' style="padding:10px 12px;border-bottom:0.5px solid var(--border-soft);font-size:11px;color:var(--text-muted);white-space:nowrap;">'+safe(r.asesor)+'</td>' +
      '<td '+tdBase+' style="padding:10px 12px;border-bottom:0.5px solid var(--border-soft);font-size:11px;color:var(--text-muted);white-space:nowrap;font-family:\'DM Mono\',monospace;">'+safe(r.fecha)+'</td>' +
      '<td '+tdBase+' style="padding:10px 12px;border-bottom:0.5px solid var(--border-soft);font-size:12px;font-weight:600;color:var(--text-main);">'+safe(r.cliente)+'</td>' +
      '<td '+tdBase+' style="padding:10px 12px;border-bottom:0.5px solid var(--border-soft);font-size:11px;color:var(--text-main);white-space:nowrap;">'+safe(r.producto)+'</td>' +
      // ← EXISTENTE (seguimiento)
      '<td '+tdBase+' style="padding:10px 12px;border-bottom:0.5px solid var(--border-soft);font-size:11px;color:var(--text-muted);" title="'+safe(r.seguimiento)+'">'+safe(seg)+'</td>' +
      // ← NUEVO (comentario)
      '<td '+tdBase+' style="padding:10px 12px;border-bottom:0.5px solid var(--border-soft);font-size:11px;color:var(--text-muted);" title="'+safe(r.comentario)+'">'+safe(com)+'</td>' +
      '<td '+tdBase+' style="padding:10px 12px;border-bottom:0.5px solid var(--border-soft);">' +
        '<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:999px;font-size:10px;font-weight:700;white-space:nowrap;background:'+cfg.bg+';color:'+cfg.color+';">' +
          '<span style="width:5px;height:5px;border-radius:50%;background:'+cfg.dot+';flex-shrink:0;"></span>'+cfg.label+
        '</span>' +
      '</td>' +
      '<td '+tdBase+' style="padding:10px 12px;border-bottom:0.5px solid var(--border-soft);font-size:11px;color:var(--text-muted);white-space:nowrap;font-family:\'DM Mono\',monospace;">'+safe(r.fechaRep)+'</td>' +
      '<td '+tdBase+' style="padding:10px 12px;border-bottom:0.5px solid var(--border-soft);text-align:center;">'+garantiaBadge+'</td>' +
    '</tr>';
  }).join('');

  document.getElementById('sacTableBody').innerHTML = html;
}

function sacFiltrar(filtro, btn) {
  _sacFiltroActual = filtro;
  document.querySelectorAll('#sacTabs .search-tab').forEach(function(t){ t.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  sacRenderTabla(sacGetFiltrado());
}

function sacFiltrarAnio(val) {
  _sacAnioActual = val || 'todos';
  sacRenderTabla(sacGetFiltrado());
}

function sacBuscar(query) {
  _sacQueryActual = query || '';
  sacRenderTabla(sacGetFiltrado());
}

function loadSACBadge() {
  google.script.run
    .withSuccessHandler(function(data) {
      var pendientes = (data || []).filter(function(r) {
        var s = normalize_(r.status || '');
        return s.includes('espera') || s.includes('no ingresado') || s.includes('aun no');
      }).length;
      var badge = document.getElementById('sacAlertaBadge');
      if (!badge) return;
      badge.textContent  = pendientes;
      badge.style.display = pendientes > 0 ? 'inline-block' : 'none';
      if (!_sacAllData.length) _sacAllData = data || [];
    })
    .withFailureHandler(function(){})
    .getAlertaTicketsSAC();
}

document.addEventListener('click', function(e) {
  var m = document.getElementById('sacModal');
  if (m && e.target === m) cerrarSACModal();
});


// =========================================
// HISTORIAL CLIENTE
// =========================================
var _histDebounce = null;

function histBuscarDebounced() {
  clearTimeout(_histDebounce);
  var q = document.getElementById('histSearchInput').value || '';
  if (q.length >= 2) _histDebounce = setTimeout(histBuscar, 500);
}

function histBuscar() {
  clearTimeout(_histDebounce);
  var query = (document.getElementById('histSearchInput').value || '').trim();
  if (query.length < 2) return;

  var res = document.getElementById('histResultados');
  var noRes = document.getElementById('histNoResultado');
  res.innerHTML = htmlDashboardCargador;
  noRes.style.display = 'none';

  google.script.run
    .withSuccessHandler(function(data) {
      if (!data || !data.length) {
        res.innerHTML = '';
        noRes.style.display = 'block';
        _historialData = [];
        return;
      }
      _historialData = data;   // ← esto faltaba
      histRender(data);
    })
    .withFailureHandler(function(e) {
      res.innerHTML = '<div class="empty-state" style="color:var(--red-main);">Error: '
        + safe(e.message || e) + '</div>';
    })
    .getHistorialCliente(query);
}

function histRender(servicios) {
  // Asignar índice único a cada servicio
  servicios.forEach(function(s, i) { s._idx = i; });

  var porCliente = {}, orden = [];
  servicios.forEach(function(s) {
    if (!porCliente[s.cliente]) { porCliente[s.cliente] = []; orden.push(s.cliente); }
    porCliente[s.cliente].push(s);
  });

  // Barra de selección
// Reemplaza el toolbar en histRender:
  var toolbar = '<div id="histSelToolbar" style="display:flex;align-items:center;gap:8px;'
    + 'margin-bottom:16px;">'
    + '<span id="histSelCount" style="font-size:11px;color:var(--text-muted);flex:1;">Haz clic en el ícono para seleccionar servicios a exportar</span>'
    + '<button onclick="histSelectNone()" style="font-size:11px;font-weight:500;padding:4px 10px;'
    + 'border:0.5px solid var(--border-soft);border-radius:8px;background:transparent;'
    + 'cursor:pointer;font-family:inherit;color:var(--text-muted);">Deseleccionar todo</button>'
    + '</div>';

  var html = toolbar + orden.map(function(c) {
    return histRenderCliente(c, porCliente[c]);
  }).join('');

  document.getElementById('histResultados').innerHTML = html;
  histSelectNone(); // ← por defecto ninguno marcado
}
function histSelectAll() {
  document.querySelectorAll('[id^="histSvc_"]').forEach(function(cb) { cb.checked = true; histActualizarCard(cb); });
  histUpdateSelCount();
}

function histSelectNone() {
  document.querySelectorAll('[id^="histSvc_"]').forEach(function(cb) { cb.checked = false; histActualizarCard(cb); });
  histUpdateSelCount();
}

function histUpdateSelCount() {
  var checked = document.querySelectorAll('[id^="histSvc_"]:checked').length;
  var el = document.getElementById('histSelCount');
  if (!el) return;
  if (checked === 0) {
    el.textContent = 'Haz clic en el ícono para seleccionar servicios a exportar';
  } else {
    el.textContent = checked + ' servicio' + (checked !== 1 ? 's' : '') + ' seleccionado' + (checked !== 1 ? 's' : '') + ' para exportar';
    el.style.color = 'var(--text-main)';
    el.style.fontWeight = '600';
  }
}
function histActualizarCard(cb) {
  var idx  = cb.id.replace('histSvc_', '');
  var card = document.getElementById('histCard_' + idx);
  var dot  = document.getElementById('histDot_'  + idx);
  if (!card) return;

  if (cb.checked) {
    card.style.background = 'rgba(13,13,12,0.02)';
    card.style.borderRadius  = '10px';
    card.style.paddingLeft   = '10px';
    card.style.paddingRight  = '10px';
    card.style.marginLeft    = '-10px';
    card.style.marginRight   = '-10px';
    card.style.borderLeft = '1.5px solid rgba(13,13,12,0.25)';
    card.style.opacity       = '1';
    if (dot) {
      dot.style.boxShadow = '0 0 0 1.5px #0d0d0c, 0 0 0 3px var(--bg-page,#f5f5f3)';
    }
  } else {
    card.style.background    = '';
    card.style.borderRadius  = '';
    card.style.paddingLeft   = '';
    card.style.paddingRight  = '';
    card.style.marginLeft    = '';
    card.style.marginRight   = '';
    card.style.borderLeft    = '';
    card.style.opacity       = '1';
    if (dot) {
      dot.style.boxShadow = '0 0 0 3px var(--bg-page,#f5f5f3)';
    }
  }
}

function histRenderCliente(cliente, svcs) {
  var html = '<div style="margin-bottom:32px;">';
  html += '<div style="display:flex;align-items:center;justify-content:space-between;'
    + 'padding-bottom:12px;border-bottom:2px solid var(--text-main);margin-bottom:20px;">'
    + '<div style="font-size:17px;font-weight:700;color:var(--text-main);">' + safe(cliente) + '</div>'
    + '<div style="font-size:11px;padding:4px 12px;border-radius:999px;'
    + 'background:var(--bg-soft);border:0.5px solid var(--border-soft);color:var(--text-muted);">'
    + svcs.length + ' servicio' + (svcs.length !== 1 ? 's' : '') + '</div></div>';
  html += '<div style="padding-left:4px;">';
  svcs.forEach(function(s, idx) {
    html += histRenderServicio(s, idx === svcs.length - 1);
  });
  html += '</div></div>';
  return html;
}

function histStatusCfg(status) {
  var s = normalize_(status || '');
  if (s.includes('completed') || s.includes('completado') || s.includes('finish'))
    return { label:'Completado', color:'#166534', bg:'#dcfce7', dot:'#16a34a', icon:'✓' };
  if (s.includes('cancel'))
    return { label:'Cancelado', color:'#991b1b', bg:'#fee2e2', dot:'#ef4444', icon:'✕' };
  return { label: status || 'En proceso', color:'#92400e', bg:'#fef3c7', dot:'#d97706', icon:'○' };
}

function histRenderServicio(s, esUltimo) {
  var sc     = histStatusCfg(s.status);
  var notas  = s.notas || {};
  var alertas= s.alertas || [];
  var equipo = (notas.descripcion || []).join(' · ') || '';
  var tNota  = notas.notas && notas.notas.trim();
  var tCierre= s.comment && s.comment.trim();
  var idx    = s._idx;

  function ico(d) {
    return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
      + 'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" '
      + 'style="flex-shrink:0;color:var(--text-muted);margin-top:1px;">' + d + '</svg>';
  }
  var ICONS = {
    tecnico:   ico('<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>'),
    equipo:    ico('<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>'),
    pin:       ico('<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>'),
    repuestos: ico('<circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>'),
    cobrar:    ico('<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>'),
    asesor:    ico('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'),
    cal:       '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="flex-shrink:0;"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'
  };

  var dotIcon = sc.label === 'Completado'
    ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>'
    : '<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><circle cx="12" cy="12" r="4"/></svg>';

  var html = '<div style="display:flex;gap:16px;">';

  // ── Columna izquierda: checkbox + dot + línea ──
  html += '<div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;width:22px;">';
  // Checkbox sobre el dot
  html += '<label style="position:relative;width:22px;height:22px;cursor:pointer;" title="Incluir en exportación">';
  html += '<input type="checkbox" id="histSvc_' + idx + '" checked '
    + 'onchange="histActualizarCard(this);histUpdateSelCount();" '
    + 'style="position:absolute;opacity:0;width:100%;height:100%;cursor:pointer;z-index:2;margin:0;">';
  html += '<div id="histDot_' + idx + '" style="width:22px;height:22px;border-radius:50%;background:' + sc.dot
    + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;'
    + 'box-shadow:0 0 0 3px var(--bg-page,#f5f5f3);">' + dotIcon + '</div>';
  html += '</label>';
  if (!esUltimo) html += '<div style="flex:1;width:1px;background:var(--border-soft);margin:6px 0;min-height:20px;"></div>';
  html += '</div>';

  // ── Contenido del servicio ──
  html += '<div id="histCard_' + idx + '" style="flex:1;min-width:0;padding-bottom:' + (esUltimo ? '0' : '28') + 'px;">';

  // Fila 1: fecha + badge
  html += '<div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-bottom:5px;">';
  if (s.fecha) {
    html += '<span style="display:inline-flex;align-items:center;gap:5px;padding:3px 10px;'
      + 'border-radius:6px;background:var(--bg-soft);border:0.5px solid var(--border-med);'
      + 'font-size:11px;font-family:\'DM Mono\',monospace;font-weight:500;color:var(--text-main);">'
      + ICONS.cal + safe(s.fecha) + '</span>';
  }
  html += '<span style="font-size:10px;font-weight:700;padding:2px 10px;border-radius:999px;'
    + 'background:' + sc.bg + ';color:' + sc.color + ';">' + sc.label + '</span>';
  html += '</div>';

  // Fila 2: SR · ALOFI · tipo
  html += '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:10px;">';
  var sepDot   = '<span style="width:3px;height:3px;border-radius:50%;background:var(--border-med);flex-shrink:0;display:inline-block;"></span>';
  var monoStyle= 'font-size:11px;font-family:\'DM Mono\',monospace;color:var(--text-muted);';
  if (s.tracking) { html += '<span style="' + monoStyle + '">' + safe(s.tracking) + '</span>' + sepDot; }
  if (s.nombre)   { html += '<span style="' + monoStyle + '">' + safe(s.nombre)   + '</span>' + sepDot; }
  html += '<span style="font-size:12px;font-weight:600;color:var(--text-main);">' + safe(s.tipo || 'Sin tipo') + '</span>';
  html += '</div>';

  // Alertas
  if (alertas.length) {
    html += '<div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px;">';
    alertas.forEach(function(a) {
      html += '<span style="font-size:10px;font-weight:600;padding:2px 10px;border-radius:999px;'
        + 'background:' + a.bg + ';color:' + a.color + ';">' + safe(a.label) + '</span>';
    });
    html += '</div>';
  }

  // Detalles
  function det(icon, label, val, extraStyle) {
    if (!val || !String(val).trim()) return '';
    return '<div style="display:flex;align-items:flex-start;gap:10px;">'
      + icon
      + '<span style="font-size:9px;font-weight:700;color:var(--text-muted);text-transform:uppercase;'
      + 'letter-spacing:.6px;min-width:70px;flex-shrink:0;padding-top:1px;">' + label + '</span>'
      + '<span style="font-size:12px;color:var(--text-main);line-height:1.4;' + (extraStyle || '') + '">'
      + safe(String(val).replace(/\.$/, '').trim()) + '</span></div>';
  }

  html += '<div style="display:flex;flex-direction:column;gap:7px;margin-bottom:12px;">';
  html += det(ICONS.tecnico,   'Técnico',   s.tecnico);
  html += det(ICONS.equipo,    'Equipo',    equipo);
  html += det(ICONS.pin,       'Distrito',  notas.distrito);
  if (notas.productos && notas.productos.length)
    html += det(ICONS.repuestos, 'Repuestos', notas.productos.join(' · '));
  html += det(ICONS.cobrar,    'Cobrar',    notas.cobrar, 'font-weight:700;color:#166534;');
  html += det(ICONS.asesor,    'Asesor',    s.asesor);
  html += '</div>';

  // Nota
  if (tNota) {
    var esW = alertas.length > 0;
    html += '<div style="margin-bottom:8px;padding:12px 14px;'
      + 'background:' + (esW ? '#fffbeb' : 'var(--bg-soft)') + ';'
      + 'border:' + (esW ? '0.5px solid #fde68a' : '0.5px solid var(--border-soft)') + ';'
      + 'border-left:3px solid ' + (esW ? '#d97706' : '#94a3b8') + ';border-radius:0 var(--radius-md) var(--radius-md) 0;">'
      + '<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">'
      + '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="' + (esW ? '#92400e' : 'var(--text-muted)') + '" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>'
      + '<span style="font-size:9px;font-weight:700;color:' + (esW ? '#92400e' : 'var(--text-muted)') + ';text-transform:uppercase;letter-spacing:.8px;">' + (esW ? 'Nota importante' : 'Nota') + '</span>'
      + '</div><div style="font-size:12px;color:var(--text-main);line-height:1.6;">' + safe(notas.notas) + '</div></div>';
  }

  // Cierre
  if (tCierre) {
    html += '<div style="padding:12px 14px;background:var(--bg-soft);border:0.5px solid var(--border-soft);'
      + 'border-left:3px solid #22c55e;border-radius:0 var(--radius-md) var(--radius-md) 0;">'
      + '<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">'
      + '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#15803d" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="20 6 9 17 4 12"/></svg>'
      + '<span style="font-size:9px;font-weight:700;color:#15803d;text-transform:uppercase;letter-spacing:.8px;">Cierre del servicio</span>'
      + '</div><div style="font-size:12px;color:var(--text-main);line-height:1.6;">' + safe(s.comment) + '</div></div>';
  }

  html += '</div></div>';
  return html;
}



function histLimpiar() {
  var inp = document.getElementById('histSearchInput');
  if (inp) inp.value = '';
  document.getElementById('histNoResultado').style.display = 'none';
  document.getElementById('histResultados').innerHTML = '';
}

// =========================================
// HISTORIAL PDF MODAL
// =========================================
var _histPDFOpciones = {
  mostrarResumen:   false,
  mostrarTecnico:   true,
  mostrarEquipo:    true,
  mostrarRepuestos: true,
  mostrarNotas:     true,
  mostrarCierre:    true,
  mostrarAsesor:    true,
  mostrarCobrar:    false
};

function histAbrirModalPDF() {
  // Ya no abre modal — genera directo
  var seleccionados = _historialData.filter(function(s) {
    var cb = document.getElementById('histSvc_' + s._idx);
    return cb && cb.checked;
  });

  if (!seleccionados.length) {
    alert('Selecciona al menos un servicio para exportar.');
    return;
  }

  _histPDFSeleccionados = seleccionados;
  histGenerarPDF();
}


function histCerrarModalPDF() {
  document.getElementById('histModalPDF').classList.remove('active');
}

function histToggleOpcion(key) {
  _histPDFOpciones[key] = !_histPDFOpciones[key];
  var box = document.getElementById('histCheck_' + key);
  var row = document.getElementById('histCheckItem_' + key);
  if (!box) return;
  if (_histPDFOpciones[key]) {
    box.className = 'hist-check-box hist-check-on';
    box.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>';
    if (row) row.querySelector('span') && (row.querySelector('span').style.color = '');
  } else {
    box.className = 'hist-check-box';
    box.innerHTML = '';
    if (row) row.querySelector('span') && (row.querySelector('span').style.color = 'var(--text-muted)');
  }
}

function histFormatFechaPDF(input) {
  var v = input.value.replace(/\D/g, '');
  if (v.length >= 2) v = v.substring(0,2) + '/' + v.substring(2);
  if (v.length >= 5) v = v.substring(0,5) + '/' + v.substring(5,9);
  input.value = v;
}

function histGenerarPDF() {
  if (!_histPDFSeleccionados || !_histPDFSeleccionados.length) return;

  var btn = document.getElementById('histBtnExportar');
  var orig = btn ? btn.innerHTML : '';
  if (btn) {
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Generando...';
    btn.disabled = true;
  }

  var payload = {
    cliente:   _histPDFSeleccionados[0].cliente,
    servicios: _histPDFSeleccionados,
    opciones:  _histPDFOpciones,
    desde:     '',
    hasta:     ''
  };

  google.script.run
    .withSuccessHandler(function(res) {
      if (btn) { btn.innerHTML = orig; btn.disabled = false; }
      if (res && res.ok && res.html) {
        var ventana = window.open('', '_blank');
        if (ventana) {
          ventana.document.write(res.html);
          ventana.document.close();
        }
      }
    })
    .withFailureHandler(function(err) {
      if (btn) { btn.innerHTML = orig; btn.disabled = false; }
      alert('Error: ' + (err.message || err));
    })
    .generarHistorialPDF(payload);
}

// Cerrar modal al click fuera
document.addEventListener('click', function(e) {
  var m = document.getElementById('histModalPDF');
  if (m && e.target === m) histCerrarModalPDF();
});


function exportarHistorialEquipo() {
  if (!detalleActual || !detalleActual.equipo) {
    alert('No hay datos del equipo para exportar.'); return;
  }

  var eq  = detalleActual.equipo;
  var ing = detalleActual.ingresos || [];
  var sal = detalleActual.salidas  || [];
  var dg  = detalleActual.detalleGeneral || {};

  var total = Math.max(ing.length, sal.length);
  var reparaciones = [];

  for (var i = 0; i < total; i++) {
    var ingRow = ing[i] || null;
    var salRow = sal[i] || null;

    // Calcular días si no viene del historial
    var diasVal = salRow ? (salRow['Dias Reparacion Historial'] || '') : '';
    if (!diasVal && ingRow && salRow) {
      var fI = ingRow['Fecha de Llegada al Taller'] || '';
      var fS = salRow['Fecha de Salida del Taller'] || '';
      if (fI && fS) {
        var partsI = fI.split('/'), partsS = fS.split('/');
        if (partsI.length === 3 && partsS.length === 3) {
          var dI = new Date(+partsI[2], +partsI[1]-1, +partsI[0]);
          var dS = new Date(+partsS[2], +partsS[1]-1, +partsS[0]);
          var diff = Math.round((dS - dI) / (1000*60*60*24));
          if (!isNaN(diff) && diff >= 0) diasVal = String(diff);
        }
      }
    }

    reparaciones.push({
      fechaIngreso:  ingRow ? (ingRow['Fecha de Llegada al Taller'] || '-') : '-',
      fechaSalida:   salRow ? (salRow['Fecha de Salida del Taller'] || '-') : '-',
      dias:          diasVal,
      ticket:        i === 0 ? (dg.ticket || '') : '',
      fichaIngreso:  ingRow ? (ingRow['Ficha Ingreso Historial'] || ingRow['Numero de Ficha de Ingreso'] || '-') : '-',
      fichaSalida:   salRow ? (salRow['Ficha Salida Historial']  || salRow['Numero de Ficha de Salida']  || '-') : '-',
      tecnico:       salRow ? (salRow['Técnico responsable de reparación'] || '-') : '-',
      motivoIngreso: ingRow ? (ingRow['Detalle del Motivo a Taller'] || '') : '',
      falla:         eq['Falla'] || '',
      repuestos:     salRow ? (salRow['Repuestos Utilizados'] || '') : '',
      procedimiento: salRow ? (salRow['Procedimiento de Reparación'] || '') : ''
    });
  }

  var btn = document.getElementById('btnExportarHistorialEquipo');
  if (btn) { btn.textContent = 'Generando...'; btn.disabled = true; }

  var payload = {
    serie:        eq['Nro Serie'] || eq['N° Serie'] || eq['Serie'] || '-',
    modelo:       eq['Modelo'] || '-',
    color:        eq['Color']  || '-',
    cliente:      eq['Cliente'] || '-',
    reparaciones: reparaciones
  };

  google.script.run
    .withSuccessHandler(function(res) {
      if (btn) {
        btn.innerHTML = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 18 15 15"/></svg> Exportar historial';
        btn.disabled = false;
      }
      if (res && res.ok && res.html) {
        var ventana = window.open('', '_blank');
        if (ventana) {
          ventana.document.write(res.html);
          ventana.document.close();
        }
      }
    })
    .withFailureHandler(function(err) {
      if (btn) {
        btn.innerHTML = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 18 15 15"/></svg> Exportar historial';
        btn.disabled = false;
      }
      alert('Error: ' + (err.message || err));
    })
    .generarHistorialEquipo(payload);
}
// =========================================
// MÓDULO REPUESTOS CLIENTES
// =========================================
var _repAllData      = [];
var _repFiltrados    = [];
var _repRendered     = 0;
var _repBatchSize    = 60;
var _repDebounce     = null;
var _repLoading      = false;
var _repInicializado = false;

var _repEquipoColors = {
  'PURE':'#3b82f6','STATION':'#f59e0b','OSMOSIS':'#8b5cf6',
  'BARISTA':'#ec4899','XWATER':'#10b981','PANAMARA':'#f97316',
  'ONYX':'#6366f1','ALPINO':'#14b8a6','OASIS':'#84cc16',
  'VITALIX':'#ef4444','ALPHA':'#06b6d4'
};

function repGetColor(equipo) {
  return _repEquipoColors[String(equipo||'').toUpperCase()] || '#94a3b8';
}

function repInicializar() {
  if (_repInicializado && _repAllData.length) return;
  _repInicializado = true;
  repCargarDatos();
}

function repCargarDatos() {
  var body = document.getElementById('repTableBody');
  if (body) body.innerHTML = '<tr><td colspan="11" style="padding:48px;text-align:center;">'
    + htmlDashboardCargador + '</td></tr>';
  document.getElementById('repSummary').innerHTML = '';
  document.getElementById('repContador').textContent = '';

  google.script.run
    .withSuccessHandler(function(res) {
      _repAllData = res.rows || [];
      repLlenarFiltros(res.opciones || {});
      repFiltrar();
    })
    .withFailureHandler(function(e) {
      var body = document.getElementById('repTableBody');
      if (body) body.innerHTML = '<tr><td colspan="11" style="padding:48px;text-align:center;'
        + 'color:var(--red-main);">Error: ' + safe(e.message || e) + '</td></tr>';
    })
    .getRepuestosClientes({});
}

function repLlenarFiltros(opciones) {
  function llenar(id, items) {
    var sel = document.getElementById(id);
    if (!sel) return;
    var firstText  = sel.options[0] ? sel.options[0].text  : '';
    var firstValue = sel.options[0] ? sel.options[0].value : '';
    sel.innerHTML  = '';
    var def = document.createElement('option');
    def.value = firstValue;
    def.textContent = firstText;
    sel.appendChild(def);
    items.forEach(function(v) {
      if (!v) return;
      var opt = document.createElement('option');
      opt.value = v;
      opt.textContent = v;
      sel.appendChild(opt);
    });
  }
  llenar('repFiltroEquipo', opciones.equipos       || []);
  llenar('repFiltroTipo',   opciones.tiposServicio  || []);
  llenar('repFiltroEstOs',  opciones.estadosOs      || []);
  llenar('repFiltroEstSr',  opciones.estadosSr      || []);
}

function repFormatFecha(input) {
  var v = input.value.replace(/\D/g,'');
  if (v.length >= 2) v = v.substring(0,2)+'/'+v.substring(2);
  if (v.length >= 5) v = v.substring(0,5)+'/'+v.substring(5,9);
  input.value = v;
}

function repLimpiarFechas() {
  var d = document.getElementById('repDesde');
  var h = document.getElementById('repHasta');
  if (d) d.value = '';
  if (h) h.value = '';
  var lbl = document.getElementById('repFechaActiva');
  if (lbl) { lbl.textContent = ''; }
  repFiltrar();
}

function repParseFechaJS_(str) {
  if (!str || str.trim() === '') return null;
  var p = String(str).trim().split('/');
  if (p.length === 3 && p[2] && p[2].length === 4) {
    var d = new Date(+p[2], +p[1]-1, +p[0]);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function repFiltrarDebounced() {
  clearTimeout(_repDebounce);
  _repDebounce = setTimeout(repFiltrar, 300);
}

function repFiltrar() {
  var query  = (document.getElementById('repSearchInput').value || '').trim();
  var equipo = document.getElementById('repFiltroEquipo').value;
  var tipo   = document.getElementById('repFiltroTipo').value;
  var estOs  = document.getElementById('repFiltroEstOs').value;
  var estSr  = document.getElementById('repFiltroEstSr').value;
  var desde  = ((document.getElementById('repDesde')  || {}).value || '').trim();
  var hasta  = ((document.getElementById('repHasta')  || {}).value || '').trim();

  var dDesde = repParseFechaJS_(desde);
  var dHasta = repParseFechaJS_(hasta);

  // Label de fecha activa
  var lbl = document.getElementById('repFechaActiva');
  if (lbl) {
    if (desde || hasta) {
      lbl.textContent    = '📅 ' + (desde || '…') + ' → ' + (hasta || '…');
      lbl.style.color      = 'var(--text-main)';
      lbl.style.fontWeight = '600';
    } else {
      lbl.textContent = '';
    }
  }

  _repFiltrados = _repAllData.filter(function(r) {
    if (equipo && r.equipo       !== equipo) return false;
    if (tipo   && r.tipoServicio !== tipo)   return false;
    if (estOs  && r.estadoOs     !== estOs)  return false;
    if (estSr  && r.estadoSr     !== estSr)  return false;

    if (dDesde || dHasta) {
      var dRow = repParseFechaJS_(r.fecha);
      if (dRow) {
        if (dDesde && dRow < dDesde) return false;
        if (dHasta && dRow > dHasta) return false;
      }
    }

    if (query) {
      var q   = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
      var hay = (r.equipo+' '+r.producto+' '+r.cliente+' '+r.referencia+' '+r.os)
        .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
      if (!hay.includes(q)) return false;
    }

    return true;
  });

  _repRendered = 0;
  var tbody = document.getElementById('repTableBody');
  if (tbody) tbody.innerHTML = '';
  repRenderBatch();
  repActualizarSummary();
}

function repRenderBatch() {
  if (_repLoading) return;
  var desde = _repRendered;
  var hasta = Math.min(_repRendered + _repBatchSize, _repFiltrados.length);

  _repLoading = true;
  var tbody   = document.getElementById('repTableBody');

  if (desde === 0 && _repFiltrados.length === 0) {
    if (tbody) tbody.innerHTML = '<tr><td colspan="11" style="padding:40px;text-align:center;'
      + 'color:var(--text-muted);font-size:13px;">Sin resultados</td></tr>';
    _repLoading = false;
    repActualizarContador();
    return;
  }

  var html = '';
  for (var i = desde; i < hasta; i++) {
    html += repRenderFila(_repFiltrados[i]);
  }

  if (tbody) {
    if (desde === 0) tbody.innerHTML = html;
    else             tbody.insertAdjacentHTML('beforeend', html);
  }

  _repRendered = hasta;
  _repLoading  = false;

  var loader = document.getElementById('repLoadingMore');
  if (loader) loader.style.display = 'none';
  repActualizarContador();
}

function repRenderFila(r) {
  function badgeEstado(v) {
    var s = String(v || '').toLowerCase();
    if (s === 'finish' || s === 'completed')
      return '<span style="padding:2px 8px;border-radius:999px;font-size:9px;font-weight:700;'
        + 'background:#dcfce7;color:#166534;">' + safe(v) + '</span>';
    if (s === 'confirmed')
      return '<span style="padding:2px 8px;border-radius:999px;font-size:9px;font-weight:700;'
        + 'background:#fef3c7;color:#92400e;">confirmed</span>';
    if (!v || v === '-')
      return '<span style="color:var(--text-faint);">—</span>';
    return '<span style="padding:2px 8px;border-radius:999px;font-size:9px;font-weight:700;'
      + 'background:var(--bg-soft);color:var(--text-muted);border:0.5px solid var(--border-soft);">'
      + safe(v) + '</span>';
  }

  function badgeTipo(v) {
    var s = String(v || '').toLowerCase();
    var cfg = s.includes('mantenimiento')
      ? 'background:#dbeafe;color:#1d4ed8;'
      : (s.includes('instalaci')
        ? 'background:#dcfce7;color:#166534;'
        : (s.includes('tecnico') || s.includes('técnico')
          ? 'background:#fef3c7;color:#92400e;'
          : 'background:var(--bg-soft);color:var(--text-muted);border:0.5px solid var(--border-soft);'));
    if (!v) return '—';
    return '<span style="padding:2px 8px;border-radius:999px;font-size:9px;font-weight:700;' + cfg + '">'
      + safe(v) + '</span>';
  }

  var skuMatch  = r.producto.match(/^\[([^\]]+)\]/);
  var sku       = skuMatch ? skuMatch[1] : '';
  var nombreProd = r.producto.replace(/^\[[^\]]+\]\s*/, '');
  var color     = repGetColor(r.equipo);

  var precioNum = parseFloat(String(r.precio || '0').replace(/[^0-9.]/g, ''));
  var precioHtml = (!isNaN(precioNum) && precioNum > 0)
    ? '<span style="font-family:\'DM Mono\',monospace;font-weight:700;">S/ ' + safe(r.precio) + '</span>'
    : '<span style="color:var(--text-faint);">—</span>';

  var td = 'style="padding:8px 10px;border-bottom:0.5px solid var(--border-soft);vertical-align:middle;"';

  return '<tr onmouseenter="this.style.background=\'var(--bg-soft)\'" onmouseleave="this.style.background=\'\'">'
    // Equipo
    + '<td ' + td + ' style="padding:8px 10px;border-bottom:0.5px solid var(--border-soft);white-space:nowrap;">'
      + '<span style="display:inline-flex;align-items:center;gap:5px;font-weight:600;font-size:11px;">'
      + '<span style="width:7px;height:7px;border-radius:50%;background:' + color + ';flex-shrink:0;"></span>'
      + safe(r.equipo) + '</span></td>'
    // Producto
    + '<td ' + td + ' style="padding:8px 10px;border-bottom:0.5px solid var(--border-soft);max-width:240px;">'
      + (sku ? '<span style="font-family:\'DM Mono\',monospace;font-size:9px;color:var(--text-muted);display:block;margin-bottom:1px;">[' + safe(sku) + ']</span>' : '')
      + '<span style="font-size:11px;line-height:1.35;">' + safe(nombreProd) + '</span></td>'
    // Fecha
    + '<td ' + td + ' style="padding:8px 10px;border-bottom:0.5px solid var(--border-soft);white-space:nowrap;font-family:\'DM Mono\',monospace;font-size:10px;color:var(--text-muted);">' + safe(r.fecha) + '</td>'
    // Cliente
    + '<td ' + td + ' style="padding:8px 10px;border-bottom:0.5px solid var(--border-soft);font-size:11px;max-width:180px;">' + safe(r.cliente) + '</td>'
    // Tipo servicio
    + '<td ' + td + ' style="padding:8px 10px;border-bottom:0.5px solid var(--border-soft);white-space:nowrap;">' + badgeTipo(r.tipoServicio) + '</td>'
    // Tipo entrega
    + '<td ' + td + ' style="padding:8px 10px;border-bottom:0.5px solid var(--border-soft);font-size:10px;color:var(--text-muted);white-space:nowrap;">' + safe(r.tipoEntrega || '—') + '</td>'
    // OS / Referencia
    + '<td ' + td + ' style="padding:8px 10px;border-bottom:0.5px solid var(--border-soft);">'
      + '<span style="font-family:\'DM Mono\',monospace;font-size:10px;color:var(--text-muted);display:block;">' + safe(r.referencia) + '</span>'
      + (r.os && r.os !== r.referencia
          ? '<span style="font-family:\'DM Mono\',monospace;font-size:9px;color:var(--text-faint);">' + safe(r.os) + '</span>'
          : '')
    + '</td>'
    // Cantidad
    + '<td ' + td + ' style="padding:8px 10px;border-bottom:0.5px solid var(--border-soft);text-align:center;font-weight:600;font-size:12px;">' + safe(r.cantidad || '1') + '</td>'
    // Precio
    + '<td ' + td + ' style="padding:8px 10px;border-bottom:0.5px solid var(--border-soft);text-align:right;font-size:11px;">' + precioHtml + '</td>'
    // Estado ODOO
    + '<td ' + td + ' style="padding:8px 10px;border-bottom:0.5px solid var(--border-soft);">' + badgeEstado(r.estadoOs) + '</td>'
    // Estado SR
    + '<td ' + td + ' style="padding:8px 10px;border-bottom:0.5px solid var(--border-soft);">' + badgeEstado(r.estadoSr) + '</td>'
    + '</tr>';
}

function repOnScroll(el) {
  if (_repLoading) return;
  if (_repRendered >= _repFiltrados.length) return;
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) {
    var loader = document.getElementById('repLoadingMore');
    if (loader) loader.style.display = 'block';
    setTimeout(repRenderBatch, 80);
  }
}

function repActualizarSummary() {
  var total    = _repFiltrados.length;
  var cantidad = _repFiltrados.reduce(function(s, r) {
    return s + (parseInt(r.cantidad, 10) || 1);
  }, 0);
  var monto = _repFiltrados.reduce(function(s, r) {
    var p = parseFloat(String(r.precio || '0').replace(/[^0-9.]/g,''));
    return s + (isNaN(p) ? 0 : p);
  }, 0);
  var completados = _repFiltrados.filter(function(r) {
    return r.estadoSr === 'completed' || r.estadoOs === 'finish';
  }).length;
  var pct = total ? Math.round(completados * 100 / total) : 0;

  function sumCard(label, val) {
    return '<div style="background:var(--bg-soft);border-radius:var(--radius-md);'
      + 'padding:10px 14px;border:0.5px solid var(--border-soft);">'
      + '<div style="font-size:9px;font-weight:700;color:var(--text-muted);'
      + 'text-transform:uppercase;letter-spacing:.6px;margin-bottom:4px;">' + label + '</div>'
      + '<div style="font-size:18px;font-weight:700;color:var(--text-main);'
      + 'font-family:\'DM Mono\',monospace;">' + val + '</div>'
      + '</div>';
  }

  var sumEl = document.getElementById('repSummary');
  if (sumEl) sumEl.innerHTML =
    sumCard('Registros',        total.toLocaleString()) +
    sumCard('Cant. repuestos',  cantidad.toLocaleString()) +
    sumCard('Monto total',      'S/ ' + monto.toLocaleString('es-PE', {minimumFractionDigits:0, maximumFractionDigits:0})) +
    sumCard('Con estado ok',    pct + '%');
}

function repActualizarContador() {
  var el = document.getElementById('repContador');
  if (el) el.textContent = 'Mostrando ' + _repRendered + ' de ' + _repFiltrados.length + ' registros';
}

function repExportarCSV() {
  if (!_repFiltrados.length) {
    alert('No hay datos para exportar.');
    return;
  }

  var headers = [
    'Equipo', 'Producto', 'Fecha', 'Cliente',
    'Tipo Servicio', 'Tipo Entrega', 'Referencia', 'OS',
    'Cantidad', 'Precio', 'Estado ODOO', 'Estado SR'
  ];

  // índices (base 0) de columnas que son número real
  var colsNumericas = { 8: true, 9: true }; // Cantidad, Precio

  var filas = _repFiltrados.map(function(r) {
    return [
      r.equipo, r.producto, r.fecha, r.cliente,
      r.tipoServicio, r.tipoEntrega, r.referencia, r.os,
      r.cantidad, r.precio, r.estadoOs, r.estadoSr
    ];
  });

  function escXml(v) {
    return String(v === null || v === undefined ? '' : v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function buildFila(celdas, esHeader) {
    var row = '<Row>';
    celdas.forEach(function(v, idx) {
      var estilo = esHeader ? ' ss:StyleID="H"' : ' ss:StyleID="D"';
      var tipo, valor;

      if (!esHeader && colsNumericas[idx]) {
        // Solo Cantidad y Precio van como número
        var num = parseFloat(String(v || '0').replace(/[^0-9.]/g, ''));
        if (!isNaN(num)) {
          tipo  = 'Number';
          valor = String(num);
        } else {
          tipo  = 'String';
          valor = escXml(v);
        }
      } else {
        // Todo lo demás: String puro — sin tocar el valor
        tipo  = 'String';
        valor = escXml(v);
      }

      row += '<Cell' + estilo + '>'
           + '<Data ss:Type="' + tipo + '">' + valor + '</Data>'
           + '</Cell>';
    });
    row += '</Row>\n';
    return row;
  }

  var xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<?mso-application progid="Excel.Sheet"?>\n'
    + '<Workbook\n'
    + '  xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n'
    + '  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"\n'
    + '  xmlns:x="urn:schemas-microsoft-com:office:excel">\n'
    + '<Styles>\n'
    + '  <Style ss:ID="H">\n'
    + '    <Font ss:Bold="1" ss:Color="#FFFFFF" ss:Size="11"/>\n'
    + '    <Interior ss:Color="#0d0d0c" ss:Pattern="Solid"/>\n'
    + '    <Alignment ss:Horizontal="Left" ss:WrapText="0"/>\n'
    + '  </Style>\n'
    + '  <Style ss:ID="D">\n'
    + '    <Alignment ss:WrapText="0"/>\n'
    + '    <Font ss:Size="10"/>\n'
    + '  </Style>\n'
    + '</Styles>\n'
    + '<Worksheet ss:Name="Repuestos Clientes">\n'
    + '<Table ss:DefaultColumnWidth="80">\n'
    + '<Column ss:Width="80"/>\n'   // Equipo
    + '<Column ss:Width="260"/>\n'  // Producto
    + '<Column ss:Width="95"/>\n'   // Fecha
    + '<Column ss:Width="190"/>\n'  // Cliente
    + '<Column ss:Width="140"/>\n'  // Tipo Servicio
    + '<Column ss:Width="130"/>\n'  // Tipo Entrega
    + '<Column ss:Width="140"/>\n'  // Referencia
    + '<Column ss:Width="140"/>\n'  // OS
    + '<Column ss:Width="65"/>\n'   // Cantidad
    + '<Column ss:Width="75"/>\n'   // Precio
    + '<Column ss:Width="95"/>\n'   // Estado ODOO
    + '<Column ss:Width="95"/>\n'   // Estado SR
    + buildFila(headers, true);

  filas.forEach(function(f) {
    xml += buildFila(f, false);
  });

  xml += '</Table>\n</Worksheet>\n</Workbook>';

  var blob   = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  var url    = URL.createObjectURL(blob);
  var hoy    = new Date();
  var nombre = 'Repuestos_Clientes_'
    + hoy.getFullYear()
    + String(hoy.getMonth()+1).padStart(2,'0')
    + String(hoy.getDate()).padStart(2,'0')
    + '.xls';

  var link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', nombre);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(function() { URL.revokeObjectURL(url); }, 300);
}

// =========================================
// KPI TÉCNICOS
// =========================================
var _kpiTecData      = null;
var _kpiTecSegmento  = 'global';
var _kpiTecChart     = null;
var _kpiTecIniciado  = false;
var _kpiTecColores   = ['#2a78d6','#1baf7a','#eda100','#4a3aa7','#e34948','#e87ba4','#eb6834','#888780'];

function kpiTecInicializar() {
  if (_kpiTecIniciado && _kpiTecData) return;
  _kpiTecIniciado = true;
  kpiTecCargar();
}

function kpiTecFormatFecha(input) {
  var v = input.value.replace(/\D/g,'');
  if (v.length>=2) v=v.substring(0,2)+'/'+v.substring(2);
  if (v.length>=5) v=v.substring(0,5)+'/'+v.substring(5,9);
  input.value=v;
}

function kpiTecLimpiarFechas() {
  var d=document.getElementById('kpiTecDesde'), h=document.getElementById('kpiTecHasta');
  if(d)d.value=''; if(h)h.value='';
  kpiTecCargar();
}

function kpiTecSetSegmento(seg, btn) {
  _kpiTecSegmento = seg;
  document.querySelectorAll('#kpiTecSegTabs .search-tab').forEach(function(t){t.classList.remove('active');});
  if(btn) btn.classList.add('active');
  kpiTecCargar();
}

function kpiTecCargar() {
  var desde = (document.getElementById('kpiTecDesde')||{}).value||'';
  var hasta = (document.getElementById('kpiTecHasta')||{}).value||'';

  // Convertir YYYY-MM-DD → DD/MM/YYYY para mostrar
  function fmtDisplay(s) {
    if (!s) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      var p = s.split('-');
      return p[2]+'/'+p[1]+'/'+p[0];
    }
    return s;
  }

  var chips = document.getElementById('kpiTecChips');
  if (chips) {
    var html = '';
    if (desde) html += '<span style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;background:var(--bg-soft);border:0.5px solid var(--border-soft);border-radius:999px;font-size:11px;font-family:\'DM Mono\',monospace;">📅 Desde: '+safe(fmtDisplay(desde))+'</span>';
    if (hasta) html += '<span style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;background:var(--bg-soft);border:0.5px solid var(--border-soft);border-radius:999px;font-size:11px;font-family:\'DM Mono\',monospace;">📅 Hasta: '+safe(fmtDisplay(hasta))+'</span>';
    chips.innerHTML = html;
  }

  var loading = '<div style="padding:40px;text-align:center;">'+htmlDashboardCargador+'</div>';
  ['kpiTecResumen','kpiTecTabla','kpiTecReincidencia','kpiTecLeyenda'].forEach(function(id){
    var el=document.getElementById(id); if(el) el.innerHTML=loading;
  });
  var chartEl=document.getElementById('kpiTecChart');
  if(chartEl) chartEl.getContext('2d').clearRect(0,0,chartEl.width,chartEl.height);

  var params = { segmento: _kpiTecSegmento, desde: desde, hasta: hasta };

  google.script.run
    .withSuccessHandler(function(data) {
      _kpiTecData = data;
      kpiTecRenderResumen(data.resumen || {});
      kpiTecRenderTabla(data.tecnicos || []);
      kpiTecRenderReincidencia(data.tecnicos || []);
      kpiTecRenderChart(data.tecnicos || [], data.tendencia || []);
      kpiTecCerrarDetalle();
    })
    .withFailureHandler(function(e) {
      var msg='<div class="empty-state" style="color:var(--red-main);">Error: '+safe(e.message||e)+'</div>';
      ['kpiTecResumen','kpiTecTabla','kpiTecReincidencia'].forEach(function(id){
        var el=document.getElementById(id); if(el) el.innerHTML=msg;
      });
    })
    .getKpiTecnicos(params);
}

function kpiTecRenderResumen(r) {
  function card(lbl, val, sub) {
    return '<div style="background:var(--bg-soft);border-radius:var(--radius-md);padding:10px 14px;border:0.5px solid var(--border-soft);">'
      +'<div style="font-size:9px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.6px;margin-bottom:4px;">'+lbl+'</div>'
      +'<div style="font-size:20px;font-weight:700;color:var(--text-main);font-family:\'DM Mono\',monospace;">'+val+'</div>'
      +(sub?'<div style="font-size:10px;color:var(--text-muted);margin-top:2px;">'+sub+'</div>':'')
      +'</div>';
  }
  var el = document.getElementById('kpiTecResumen');
  if (!el) return;
  el.innerHTML =
    card('Total reparaciones',  r.totalReparaciones||0,   'en el período') +
    card('Técnicos activos',    r.tecnicosActivos||0,     'con reparaciones') +
    card('Prom. horas general', (r.avgHorasGeneral||0)+' h', 'por equipo') +
    card('Reincidencias &lt;30d', r.totalReincidencias||0, 'casos en el período');
}

function kpiTecRenderTabla(tecnicos) {
  var el = document.getElementById('kpiTecTabla');
  if (!el) return;
  if (!tecnicos.length) { el.innerHTML='<div class="empty-state">Sin datos</div>'; return; }

  var max = tecnicos[0].count || 1;

  var html = '<table style="width:100%;border-collapse:collapse;font-size:11px;">'
    +'<thead><tr>'
    +'<th style="padding:7px 10px;text-align:left;font-size:9px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.6px;border-bottom:0.5px solid var(--border-soft);">Técnico</th>'
    +'<th style="padding:7px 10px;text-align:center;font-size:9px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.6px;border-bottom:0.5px solid var(--border-soft);">Equipos</th>'
    +'<th style="padding:7px 10px;font-size:9px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.6px;border-bottom:0.5px solid var(--border-soft);min-width:80px;">Volumen</th>'
    +'<th style="padding:7px 10px;text-align:center;font-size:9px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.6px;border-bottom:0.5px solid var(--border-soft);">H. prom.</th>'
    +'<th style="padding:7px 10px;text-align:center;font-size:9px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.6px;border-bottom:0.5px solid var(--border-soft);">Reincid.</th>'
    +'</tr></thead><tbody>';

  tecnicos.forEach(function(t, idx) {
    var iniciales = t.nombre.split(' ').slice(0,2).map(function(p){return p[0]||'';}).join('').toUpperCase();
    var color = _kpiTecColores[idx % _kpiTecColores.length];
    var bg = color+'22';
    var pct = Math.round(t.count * 100 / max);
    var reinc = t.reincidencia || 0;
    var reincBadge = reinc === 0
      ? '<span style="padding:2px 8px;border-radius:999px;font-size:9px;font-weight:700;background:#dcfce7;color:#166534;">0</span>'
      : reinc <= 2
        ? '<span style="padding:2px 8px;border-radius:999px;font-size:9px;font-weight:700;background:#fef3c7;color:#92400e;">'+reinc+'</span>'
        : '<span style="padding:2px 8px;border-radius:999px;font-size:9px;font-weight:700;background:#fee2e2;color:#991b1b;">'+reinc+'</span>';

    html += '<tr style="cursor:pointer;" onclick="kpiTecVerDetalle(\''+escapeQuotes(t.nombre)+'\')"'
      +' onmouseenter="this.style.background=\'var(--bg-soft)\'" onmouseleave="this.style.background=\'\'">'
      +'<td style="padding:7px 10px;border-bottom:0.5px solid var(--border-soft);">'
        +'<div style="display:flex;align-items:center;gap:7px;">'
          +'<div style="width:28px;height:28px;border-radius:50%;background:'+bg+';color:'+color+';display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0;">'+safe(iniciales)+'</div>'
          +'<span style="font-weight:600;font-size:11px;">'+safe(t.nombre)+'</span>'
        +'</div>'
      +'</td>'
      +'<td style="padding:7px 10px;border-bottom:0.5px solid var(--border-soft);text-align:center;font-family:\'DM Mono\',monospace;font-weight:700;font-size:13px;">'+t.count+'</td>'
      +'<td style="padding:7px 10px;border-bottom:0.5px solid var(--border-soft);">'
        +'<div style="display:flex;align-items:center;gap:6px;">'
          +'<div style="flex:1;height:5px;background:var(--border-soft);border-radius:999px;overflow:hidden;">'
            +'<div style="width:'+pct+'%;height:100%;background:'+color+';border-radius:999px;"></div>'
          +'</div>'
        +'</div>'
      +'</td>'
      +'<td style="padding:7px 10px;border-bottom:0.5px solid var(--border-soft);text-align:center;font-family:\'DM Mono\',monospace;">'
        +(t.avgHoras!==null ? t.avgHoras+' h' : '—')
      +'</td>'
      +'<td style="padding:7px 10px;border-bottom:0.5px solid var(--border-soft);text-align:center;">'+reincBadge+'</td>'
      +'</tr>';
  });

  html += '</tbody></table>';
  el.innerHTML = html;
}

function kpiTecRenderReincidencia(tecnicos) {
  var el = document.getElementById('kpiTecReincidencia');
  if (!el) return;
  if (!tecnicos.length) { el.innerHTML='<div class="empty-state">Sin datos</div>'; return; }

  var html = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;">';
  tecnicos.forEach(function(t, idx) {
    var iniciales = t.nombre.split(' ').slice(0,2).map(function(p){return p[0]||'';}).join('').toUpperCase();
    var color = _kpiTecColores[idx % _kpiTecColores.length];
    var bg    = color+'22';
    var reinc = t.reincidencia || 0;
    var nivel = reinc===0 ? {lbl:'Sin casos',c:'#166534',bg:'#dcfce7'} : reinc<=2 ? {lbl:'Revisar',c:'#92400e',bg:'#fef3c7'} : {lbl:'Alto',c:'#991b1b',bg:'#fee2e2'};
    html += '<div style="background:var(--bg-soft);border-radius:var(--radius-md);padding:10px 12px;text-align:center;">'
      +'<div style="width:32px;height:32px;border-radius:50%;background:'+bg+';color:'+color+';display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;margin:0 auto 6px;">'+safe(iniciales)+'</div>'
      +'<div style="font-size:10px;font-weight:600;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="'+safe(t.nombre)+'">'+safe(t.nombre.split(' ')[0])+'</div>'
      +'<div style="font-size:22px;font-weight:700;font-family:\'DM Mono\',monospace;color:'+(reinc===0?'#166534':reinc<=2?'#92400e':'#991b1b')+';">'+reinc+'</div>'
      +'<div style="font-size:9px;color:var(--text-muted);margin-top:2px;">de '+t.count+' equipos</div>'
      +'<div style="margin-top:6px;"><span style="padding:2px 8px;border-radius:999px;font-size:9px;font-weight:700;background:'+nivel.bg+';color:'+nivel.c+';">'+nivel.lbl+'</span></div>'
      +'</div>';
  });
  html += '</div>';
  html += '<div style="margin-top:10px;padding:7px 10px;background:var(--bg-soft);border-radius:6px;border-left:2px solid #d97706;font-size:10px;color:var(--text-secondary);">'
    +'<span style="font-weight:700;color:var(--text-main);">Umbrales:</span> Sin casos = 0 · Revisar = 1–2 · Alto = 3 o más &nbsp;·&nbsp; Haz clic en un técnico de la tabla para ver sus equipos.</div>';
  el.innerHTML = html;
}

function kpiTecRenderChart(tecnicos, tendencia) {
  if (_kpiTecChart) { _kpiTecChart.destroy(); _kpiTecChart = null; }
  var canvas = document.getElementById('kpiTecChart');
  var leyEl  = document.getElementById('kpiTecLeyenda');
  if (!canvas || !tendencia.length) return;

  // Top 4 técnicos para el gráfico
  var top4 = tecnicos.slice(0,4);
  var labels = tendencia.map(function(t){return t.mes;});

  if (typeof Chart === 'undefined') {
    var s=document.createElement('script');
    s.src='https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js';
    s.onload=function(){kpiTecRenderChart(tecnicos,tendencia);};
    document.head.appendChild(s); return;
  }

  // Leyenda
  var leyHtml='';
  top4.forEach(function(t,i){
    var color=_kpiTecColores[i];
    leyHtml+='<span style="display:flex;align-items:center;gap:4px;font-size:10px;color:var(--text-secondary);">'
      +'<span style="width:10px;height:2px;background:'+color+';display:inline-block;border-radius:2px;"></span>'
      +safe(t.nombre.split(' ')[0])+'</span>';
  });
  if(leyEl) leyEl.innerHTML=leyHtml;

  var dashes=[undefined,[4,2],[2,2],[6,2]];
  var datasets = top4.map(function(t,i){
    var color=_kpiTecColores[i];
    return {
      label: t.nombre,
      data: labels.map(function(mes){
        var entry=tendencia.find(function(e){return e.mes===mes;});
        return entry&&entry[t.nombre]?entry[t.nombre]:0;
      }),
      borderColor: color, borderWidth:2, tension:0.35,
      pointRadius:3, pointBackgroundColor:'#fff', pointBorderColor:color, pointBorderWidth:2,
      fill:false, borderDash:dashes[i]
    };
  });

  _kpiTecChart = new Chart(canvas,{
    type:'line', data:{labels:labels,datasets:datasets},
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{display:false},tooltip:{backgroundColor:'#0d0d0c',padding:8,cornerRadius:8,callbacks:{label:function(c){return '  '+c.dataset.label+': '+c.parsed.y+' eq.';}}}} ,
      scales:{
        x:{grid:{display:false},border:{display:false},ticks:{font:{size:10},color:'#888780'}},
        y:{beginAtZero:true,grid:{color:'#e1e0d9'},border:{display:false},ticks:{font:{size:10},color:'#888780',stepSize:1,callback:function(v){return Math.round(v);}}}
      },
      layout:{padding:{top:10}}
    }
  });
}

function kpiTecVerDetalle(nombre) {
  document.getElementById('kpiTecGeneral').style.display   = 'none';
  document.getElementById('kpiTecReinWrapper').style.display = 'none';
  document.getElementById('kpiTecDetalle').style.display   = 'block';

  var idx = (_kpiTecData&&_kpiTecData.tecnicos||[]).findIndex(function(t){return t.nombre===nombre;});
  var color = idx>=0 ? _kpiTecColores[idx%_kpiTecColores.length] : '#888780';
  var iniciales = nombre.split(' ').slice(0,2).map(function(p){return p[0]||'';}).join('').toUpperCase();

  var hdr = document.getElementById('kpiTecDetalleHeader');
  if (hdr) hdr.innerHTML = '<div style="width:36px;height:36px;border-radius:50%;background:'+color+'22;color:'+color+';display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;">'+safe(iniciales)+'</div>'
    +'<div><div style="font-size:14px;font-weight:700;">'+safe(nombre)+'</div><div style="font-size:10px;color:var(--text-muted);">Cargando equipos...</div></div>';

  var body = document.getElementById('kpiTecDetalleBody');
  if(body) body.innerHTML='<tr><td colspan="9" style="padding:40px;text-align:center;">'+htmlDashboardCargador+'</td></tr>';

  var params = {
    segmento: _kpiTecSegmento,
    desde: (document.getElementById('kpiTecDesde')||{}).value||'',
    hasta: (document.getElementById('kpiTecHasta')||{}).value||''
  };

  google.script.run
    .withSuccessHandler(function(res) {
      var equipos = res.equipos || [];
      var stats   = res.stats   || {};

      var subInfo = hdr ? hdr.querySelector('div:last-child div:last-child') : null;
      if (subInfo) subInfo.textContent = equipos.length+' equipos · '+(stats.avgDias!==null?stats.avgDias+' días prom.':'sin datos');

      var statsEl = document.getElementById('kpiTecDetalleStats');
      function sc(lbl,val){return '<div style="background:var(--bg-soft);border-radius:var(--radius-md);padding:8px 12px;border:0.5px solid var(--border-soft);">'
        +'<div style="font-size:8px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.6px;margin-bottom:3px;">'+lbl+'</div>'
        +'<div style="font-size:18px;font-weight:700;font-family:\'DM Mono\',monospace;color:var(--text-main);">'+val+'</div></div>';}
      if(statsEl) statsEl.innerHTML =
        sc('Equipos reparados', stats.count||0) +
        sc('Prom. días',  stats.avgDias!==null?stats.avgDias+' d':'—') +
        sc('En taller',  equipos.filter(function(e){return !e.fechaSal||e.fechaSal==='-';}).length) +
        sc('Con salida',  equipos.filter(function(e){return e.fechaSal&&e.fechaSal!=='-';}).length);

      if(!body) return;
      if(!equipos.length){body.innerHTML='<tr><td colspan="9" style="padding:40px;text-align:center;color:var(--text-muted);">Sin equipos en este período</td></tr>';return;}

      body.innerHTML = equipos.map(function(eq){
        var destino = eq.destino || '—';
        var destLow = destino.toLowerCase();
        var destBadge;
        if (destLow.indexOf('cliente') >= 0)
          destBadge = '<span style="padding:2px 8px;border-radius:999px;font-size:9px;font-weight:700;background:#dcfce7;color:#166534;">Cliente</span>';
        else if (destLow.indexOf('back') >= 0)
          destBadge = '<span style="padding:2px 8px;border-radius:999px;font-size:9px;font-weight:700;background:#dbeafe;color:#1d4ed8;">Back Up</span>';
        else if (destLow.indexOf('alquiler') >= 0)
          destBadge = '<span style="padding:2px 8px;border-radius:999px;font-size:9px;font-weight:700;background:#ede9fe;color:#6d28d9;">Alquiler</span>';
        else if (destLow.indexOf('venta') >= 0)
          destBadge = '<span style="padding:2px 8px;border-radius:999px;font-size:9px;font-weight:700;background:#fce7f3;color:#be185d;">'+safe(destino)+'</span>';
        else if (destLow.indexOf('remate') >= 0)
          destBadge = '<span style="padding:2px 8px;border-radius:999px;font-size:9px;font-weight:700;background:#fef3c7;color:#92400e;">Remate</span>';
        else
          destBadge = '<span style="padding:2px 8px;border-radius:999px;font-size:9px;font-weight:700;background:var(--bg-soft);color:var(--text-muted);border:0.5px solid var(--border-soft);">'+safe(destino)+'</span>';

        var horasCell = eq.horas!==null && eq.horas!==undefined
          ? '<span title="'+safe(eq.horaIni)+' → '+safe(eq.horaFin)+'" style="cursor:help;">'+eq.horas+' h</span>'
          : '<span style="color:var(--text-faint);">—</span>';

        return '<tr onmouseenter="this.style.background=\'var(--bg-soft)\'" onmouseleave="this.style.background=\'\'">'
          +'<td style="padding:7px 10px;border-bottom:0.5px solid var(--border-soft);font-family:\'DM Mono\',monospace;font-size:10px;color:var(--text-muted);">'+safe(eq.serie||'—')+'</td>'
          +'<td style="padding:7px 10px;border-bottom:0.5px solid var(--border-soft);font-weight:600;">'+safe(eq.modelo||'—')+'</td>'
          +'<td style="padding:7px 10px;border-bottom:0.5px solid var(--border-soft);font-size:11px;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+safe(eq.cliente||'—')+'</td>'
          +'<td style="padding:7px 10px;border-bottom:0.5px solid var(--border-soft);font-family:\'DM Mono\',monospace;font-size:10px;color:var(--text-muted);white-space:nowrap;">'+safe(eq.fechaIng||'—')+'</td>'
          +'<td style="padding:7px 10px;border-bottom:0.5px solid var(--border-soft);font-family:\'DM Mono\',monospace;font-size:10px;color:var(--text-muted);white-space:nowrap;">'+safe(eq.fechaSal||'—')+'</td>'
          +'<td style="padding:7px 10px;border-bottom:0.5px solid var(--border-soft);text-align:center;font-family:\'DM Mono\',monospace;font-weight:600;">'+(eq.dias!==null&&eq.dias!==undefined?eq.dias:'—')+'</td>'
          +'<td style="padding:7px 10px;border-bottom:0.5px solid var(--border-soft);text-align:center;font-family:\'DM Mono\',monospace;">'+horasCell+'</td>'
          +'<td style="padding:7px 10px;border-bottom:0.5px solid var(--border-soft);font-size:10px;color:var(--text-secondary);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="'+safe(eq.falla)+'">'+safe(eq.falla||'—')+'</td>'
          +'<td style="padding:7px 10px;border-bottom:0.5px solid var(--border-soft);">'+destBadge+'</td>'
          +'</tr>';
      }).join('');
    })
    .withFailureHandler(function(e){
      if(body) body.innerHTML='<tr><td colspan="9" style="padding:40px;text-align:center;color:var(--red-main);">Error: '+safe(e.message||e)+'</td></tr>';
    })
    .getKpiTecnicoDetalle(nombre, params);
}

function kpiTecCerrarDetalle() {
  var general  = document.getElementById('kpiTecGeneral');
  var reinWrap = document.getElementById('kpiTecReinWrapper');
  var detalle  = document.getElementById('kpiTecDetalle');
  if(general)  general.style.display  = 'grid';
  if(reinWrap) reinWrap.style.display = 'block';
  if(detalle)  detalle.style.display  = 'none';
}
function toggleBajaModelos() {
  var detalle = document.getElementById('bajaModelosDetalle');
  if (!detalle) return;

  if (detalle.style.display !== 'none' && detalle.innerHTML !== '') {
    detalle.style.display = 'none';
    return;
  }

  detalle.style.display = 'block';
  detalle.innerHTML = '<div style="font-size:11px;color:#94a3b8;padding:6px 0;">Cargando modelos...</div>';

  var rango = (dashRangoFechasActual && dashRangoFechasActual.desdeISO)
    ? { desdeISO: dashRangoFechasActual.desdeISO, hastaISO: dashRangoFechasActual.hastaISO }
    : null;

  google.script.run
    .withSuccessHandler(function(data) {
      if (!data || !data.length) {
        detalle.innerHTML = '<div style="font-size:11px;color:#94a3b8;padding:6px 0;">Sin equipos de baja en el período</div>';
        return;
      }
      var maxVal = data[0].total || 1;
      detalle.innerHTML = '<div style="font-size:10px;font-weight:600;color:#7c3aed;margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px;">Modelos de baja</div>' +
        data.map(function(d) {
          var pct = Math.round(d.total * 100 / maxVal);
          return '<div style="display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:0.5px solid #f1f5f9;">' +
            '<span style="font-size:11px;color:#334155;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + safe(d.modelo) + '</span>' +
            '<div style="width:60px;flex-shrink:0;height:4px;background:#f1f1ef;border-radius:999px;overflow:hidden;">' +
              '<div style="width:' + pct + '%;height:4px;border-radius:999px;background:#7c3aed;opacity:.7;"></div>' +
            '</div>' +
            '<span style="font-size:11px;font-weight:700;color:#7c3aed;width:22px;text-align:right;font-family:\'DM Mono\',monospace;">' + d.total + '</span>' +
          '</div>';
        }).join('');
    })
    .withFailureHandler(function(e) {
      detalle.innerHTML = '<div style="font-size:11px;color:#ef4444;padding:6px 0;">Error: ' + safe(e.message || e) + '</div>';
    })
    .getModelosBaja(rango);
}


function toggleRezagadoDetalle(cardId, keySalida, keyIngreso, mesLabel) {
  var detalle = document.getElementById(cardId);
  if (!detalle) return;

  if (detalle.style.display !== 'none' && detalle.innerHTML !== '') {
    detalle.style.display = 'none';
    return;
  }

  detalle.style.display = 'block';
  detalle.innerHTML = '<div style="font-size:10px;color:var(--text-muted);padding:4px 0;">Cargando...</div>';

  google.script.run
    .withSuccessHandler(function(data) {
      if (!data || !data.length) {
        detalle.innerHTML = '<div style="font-size:10px;color:var(--text-faint);padding:4px 0;">Sin detalle</div>';
        return;
      }
      detalle.innerHTML =
        '<div style="font-size:9px;font-weight:700;color:#f59e0b;text-transform:uppercase;letter-spacing:.5px;padding:4px 0 2px;">Rezagados de ' + safe(mesLabel) + '</div>' +
        data.map(function(d) {
          return '<div style="display:flex;align-items:center;justify-content:space-between;padding:3px 6px;background:#fffbeb;border-radius:4px;margin-bottom:2px;">' +
            '<span style="font-size:10px;color:#92400e;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + safe(d.motivo) + '</span>' +
            '<span style="font-size:10px;font-weight:800;color:#b45309;font-family:\'DM Mono\',monospace;margin-left:6px;">' + d.total + '</span>' +
          '</div>';
        }).join('');
    })
    .withFailureHandler(function(e) {
      detalle.innerHTML = '<div style="font-size:10px;color:var(--red-main);padding:4px 0;">Error: ' + safe(e.message || e) + '</div>';
    })
    .getDetalleRezagados(keySalida, keyIngreso);
}

function buildReparacionHtml(desglose) {
  if (!desglose) return '';
  var bloques = [];

  if (desglose.cliente && desglose.cliente.total > 0) {
    bloques.push({ titulo: 'Cliente', total: desglose.cliente.total, colorTitulo: '#ef4444', items: desglose.cliente.modelos });
  }
  if (desglose.eden && desglose.eden.total > 0) {
    bloques.push({ titulo: 'Eden Agua', total: desglose.eden.total, colorTitulo: '#3b82f6', items: desglose.eden.modelos });
  }
  if (!bloques.length) return '';

  var html = '<div style="display:grid;grid-template-columns:repeat(' + bloques.length + ',1fr);gap:0;margin-top:12px;padding-top:12px;border-top:1px solid #e2e8f0;">';
  bloques.forEach(function(b, i) {
    var itemsHtml = (b.items || []).map(function(it) {
      return '<div style="display:flex;justify-content:space-between;gap:6px;font-size:10px;margin-bottom:3px;">' +
        '<span style="color:#64748b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + safe(it.nombre) + '</span>' +
        '<span style="color:#d97706;font-weight:700;font-family:\'DM Mono\',monospace;flex-shrink:0;">' + it.total + '</span>' +
      '</div>';
    }).join('');
    html += '<div style="padding:0 8px;' + (i > 0 ? 'border-left:1px solid #cbd5e1;' : '') + 'min-width:0;">' +
      '<div style="font-size:11px;font-weight:800;color:' + b.colorTitulo + ';margin-bottom:6px;">' + b.titulo + ': ' + b.total + '</div>' +
      itemsHtml +
    '</div>';
  });
  html += '</div>';
  return html;
}

function buildBajaHtml(mesActual, rezagados) {
  var bloques = [];

  if (mesActual && mesActual.total > 0) {
    var mesCorto = (mesActual.label||'').split(' ')[0];
    bloques.push({ titulo: 'Finalizado en ' + mesCorto + ': ' + mesActual.total, colorTitulo: '#7c3aed', items: mesActual.desgloseModelos || [] });
  }
  (rezagados || []).forEach(function(r) {
    var mesCorto = (r.label||'').split(' ')[0];
    bloques.push({ titulo: 'Rezagados ' + mesCorto + ': ' + r.total, colorTitulo: '#92400e', items: r.desgloseModelos || [] });
  });
  if (!bloques.length) return '';

  var html = '<div style="display:grid;grid-template-columns:repeat(' + bloques.length + ',1fr);gap:0;margin-top:12px;padding-top:12px;border-top:1px solid #e2e8f0;">';
  bloques.forEach(function(b, i) {
    var itemsHtml = (b.items || []).map(function(it) {
      return '<div style="display:flex;justify-content:space-between;gap:6px;font-size:10px;margin-bottom:3px;">' +
        '<span style="color:#64748b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + safe(it.nombre) + '</span>' +
        '<span style="color:#7c3aed;font-weight:700;font-family:\'DM Mono\',monospace;flex-shrink:0;">' + it.total + '</span>' +
      '</div>';
    }).join('');
    html += '<div style="padding:0 8px;' + (i > 0 ? 'border-left:1px solid #cbd5e1;' : '') + 'min-width:0;">' +
      '<div style="font-size:10px;font-weight:800;color:' + b.colorTitulo + ';margin-bottom:6px;line-height:1.35;word-break:break-word;">' + b.titulo + '</div>' +
      itemsHtml +
    '</div>';
  });
  html += '</div>';
  return html;
}

function buildFueraDelMesHtml(meses) {
  if (!meses || !meses.length) return '';

  var html = '<div style="display:grid;grid-template-columns:repeat(' + meses.length + ',1fr);gap:0;margin-top:12px;padding-top:12px;border-top:1px solid #e2e8f0;">';
  meses.forEach(function(mes, i) {
    var mesCorto = (mes.label||'').split(' ')[0].toUpperCase();

    function renderGrupo(titulo, colorTitulo, grupo) {
      if (!grupo || grupo.total === 0) return '';
      var items = (grupo.modelos || []).map(function(it) {
        return '<div style="display:flex;justify-content:space-between;gap:4px;font-size:9px;margin-bottom:2px;">' +
          '<span style="color:#64748b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + safe(it.nombre) + '</span>' +
          '<span style="color:' + colorTitulo + ';font-weight:700;font-family:\'DM Mono\',monospace;flex-shrink:0;">' + it.total + '</span>' +
        '</div>';
      }).join('');
      return '<div style="margin-bottom:8px;">' +
        '<div style="font-size:10px;font-weight:700;color:' + colorTitulo + ';margin-bottom:3px;">' + titulo + ': ' + grupo.total + '</div>' +
        items +
      '</div>';
    }

    html += '<div style="padding:0 8px;' + (i > 0 ? 'border-left:1px solid #cbd5e1;' : '') + 'min-width:0;">' +
      '<div style="font-size:10px;font-weight:800;color:#dc2626;margin-bottom:8px;line-height:1.35;">' + mesCorto + ': ' + mes.total + '</div>' +
      renderGrupo('Cliente', '#ef4444', mes.cliente) +
      renderGrupo('Eden Agua', '#3b82f6', mes.eden) +
    '</div>';
  });
  html += '</div>';
  return html;
}
</script>
