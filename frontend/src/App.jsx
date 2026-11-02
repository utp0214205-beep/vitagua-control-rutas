import { useCallback, useEffect, useMemo, useState } from "react";

const API = import.meta.env.VITE_API_URL || "";
const initialUser = () => {
  try { return JSON.parse(localStorage.getItem("vitagua_usuario") || "null"); }
  catch { return null; }
};
const tokenSaved = () => localStorage.getItem("vitagua_token") || "";
const fullName = (t) => [t.nombre, t.apellido_paterno, t.apellido_materno].filter(Boolean).join(" ");
const dateTime = (value) => value ? new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";
const dateOnly = (value) => value ? new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format(new Date(value)) : "—";
const duration = (seconds) => {
  if (seconds == null) return "En curso";
  const h = Math.floor(Number(seconds) / 3600);
  const m = Math.floor((Number(seconds) % 3600) / 60);
  return h ? `${h} h ${m} min` : `${m} min`;
};

async function request(path, { token, ...options } = {}) {
  const headers = { ...(options.body ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers };
  const response = await fetch(`${API}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.mensaje || `Error HTTP ${response.status}`);
  return data;
}

function Brand({ compact = false }) {
  return <div className={`brand ${compact ? "brand-compact" : ""}`}>
    <div className="brand-mark"><span>V</span><i /></div>
    <div><strong>VITAGUA</strong><small>REGISTRO DE RUTAS</small></div>
  </div>;
}

function Login({ onLogin }) {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const result = await request("/api/auth/login", { method: "POST", body: JSON.stringify({ correo, contrasena }) });
      localStorage.setItem("vitagua_token", result.token);
      localStorage.setItem("vitagua_usuario", JSON.stringify(result.usuario));
      onLogin(result.usuario, result.token);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return <main className="login-page">
    <div className="login-decoration"><div className="water-orb orb-one" /><div className="water-orb orb-two" /><div className="login-message"><span className="eyebrow light">CONTROL OPERATIVO</span><h1>Cada ruta,<br />bajo control.</h1><p>Una operación más clara, organizada y puntual para el equipo de distribución.</p><div className="login-line" /><small>VITAGUA · SISTEMA DE GESTIÓN</small></div></div>
    <section className="login-side">
      <div className="login-card">
        <Brand />
        <div className="login-heading"><span className="eyebrow">BIENVENIDO</span><h2>Iniciar sesión</h2><p>Ingresa tus credenciales para continuar.</p></div>
        <form onSubmit={submit} className="form-stack">
          <label>Correo electrónico<input type="email" autoComplete="username" placeholder="usuario@vitagua.com" value={correo} onChange={e=>setCorreo(e.target.value)} required /></label>
          <label>Contraseña<div className="password-wrap"><input type={show ? "text" : "password"} autoComplete="current-password" placeholder="Ingresa tu contraseña" value={contrasena} onChange={e=>setContrasena(e.target.value)} required /><button type="button" className="show-password" onClick={()=>setShow(!show)}>{show ? "Ocultar" : "Mostrar"}</button></div></label>
          {error && <div className="alert alert-error">{error}</div>}
          <button className="btn btn-primary btn-full" disabled={loading}>{loading ? "Verificando..." : "Entrar al sistema"} <span>→</span></button>
        </form>
        <div className="login-foot"><span className="status-dot" /> Acceso protegido · Personal autorizado</div>
      </div>
      <span className="copyright">© {new Date().getFullYear()} VITAGUA. Todos los derechos reservados.</span>
    </section>
  </main>;
}

const navItems = [
  { id: "dashboard", label: "Resumen", icon: "◫", group: "GENERAL" },
  { id: "recorridos", label: "Recorridos", icon: "↗", group: "OPERACIÓN" },
  { id: "historial", label: "Historial", icon: "◷", group: "OPERACIÓN" },
  { id: "trabajadores", label: "Trabajadores", icon: "♙", group: "GESTIÓN" },
  { id: "rutas", label: "Rutas", icon: "⌖", group: "GESTIÓN" }
];

function App() {
  const [user, setUser] = useState(initialUser);
  const [token, setToken] = useState(tokenSaved);
  const [page, setPage] = useState("dashboard");
  const [workers, setWorkers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [trips, setTrips] = useState([]);
  const [openTrips, setOpenTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("todos");
  const [mobileNav, setMobileNav] = useState(false);
  const admin = user?.rol === "administrador";

  const logout = useCallback(() => {
    localStorage.removeItem("vitagua_token"); localStorage.removeItem("vitagua_usuario");
    setToken(""); setUser(null); setPage("dashboard");
  }, []);

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError("");
    try {
      const [w, r, t, o] = await Promise.all([
        request(`/api/trabajadores${admin ? "?incluirInactivos=true" : ""}`, { token }),
        request(`/api/rutas${admin ? "?incluirInactivas=true" : ""}`, { token }),
        request("/api/recorridos?limite=100&pagina=1", { token }),
        request("/api/recorridos/abiertos", { token })
      ]);
      setWorkers(w.trabajadores || []); setRoutes(r.rutas || []);
      setTrips(t.recorridos || []); setOpenTrips(o.recorridos || []);
    } catch (err) {
      if (/token|autoriz|sesión/i.test(err.message)) logout();
      else setError(err.message);
    } finally { setLoading(false); }
  }, [token, admin, logout]);

  useEffect(() => { if (token) loadData(); }, [token, loadData]);
  useEffect(() => { if (!notice) return; const id = setTimeout(()=>setNotice(""), 3500); return ()=>clearTimeout(id); }, [notice]);

  const todayTrips = useMemo(() => trips.filter(t => new Date(t.fecha_salida).toDateString() === new Date().toDateString()), [trips]);
  const completedToday = todayTrips.filter(t => t.fecha_regreso).length;
  const visibleWorkers = workers.filter(w => `${w.id_trabajador} ${fullName(w)}`.toLowerCase().includes(search.toLowerCase()));
  const visibleRoutes = routes.filter(r => `${r.nombre} ${r.descripcion || ""}`.toLowerCase().includes(search.toLowerCase()));
  const visibleTrips = trips.filter(t => {
    const text = `${t.id_trabajador} ${t.nombre_trabajador} ${t.apellido_paterno} ${t.nombre_ruta}`.toLowerCase();
    const stateMatch = filter === "todos" || (filter === "abierto" ? !t.fecha_regreso : !!t.fecha_regreso);
    return text.includes(search.toLowerCase()) && stateMatch;
  });

  async function mutate(path, method, body) {
    try {
      const result = await request(path, { token, method, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
      setModal(null); setNotice(result.mensaje || "Cambios guardados correctamente."); await loadData();
    } catch (err) { setError(err.message); }
  }

  function openModal(type, item = null) { setError(""); setModal({ type, item }); }
  const pageTitle = navItems.find(n=>n.id===page)?.label || "Resumen";

  if (!token || !user) return <Login onLogin={(u,t)=>{setUser(u);setToken(t);}} />;

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
      <div className="sidebar-brand"><Brand compact /><button className="mobile-close" onClick={()=>setMobileNav(false)}>×</button></div>
      <div className="workspace-label">ESPACIO DE TRABAJO</div>
      {["GENERAL","OPERACIÓN","GESTIÓN"].map(group=><div className="nav-group" key={group}><div className="nav-caption">{group}</div>{navItems.filter(n=>n.group===group).filter(n=>admin || !["trabajadores","rutas"].includes(n.id)).map(n=><button key={n.id} className={`nav-link ${page===n.id ? "active" : ""}`} onClick={()=>{setPage(n.id);setSearch("");setMobileNav(false);setError("");}}><span className="nav-icon">{n.icon}</span>{n.label}{n.id==="recorridos" && openTrips.length>0 && <b className="nav-count">{openTrips.length}</b>}</button>)}</div>)}
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon">✦</div><strong>Operación en orden</strong><p>Registra cada salida y regreso para mantener el control de tus rutas.</p></div><div className="sidebar-version">VITAGUA SISTEMA · v1.0</div></div>
    </aside>
    {mobileNav && <button className="mobile-backdrop" onClick={()=>setMobileNav(false)} aria-label="Cerrar menú" />}
    <main className="main-area">
      <header className="topbar"><div className="topbar-left"><button className="menu-toggle" onClick={()=>setMobileNav(true)}>☰</button><div className="breadcrumb">VITAGUA <span>/</span> <strong>{pageTitle}</strong></div></div><div className="topbar-right"><div className="connection"><span className="status-dot" /> Sistema conectado</div><div className="user-menu"><div className="avatar">{(user.nombre || "A").charAt(0).toUpperCase()}</div><div className="user-meta"><strong>{user.nombre}</strong><small>{admin ? "Administrador" : "Personal"}</small></div><button className="logout-btn" onClick={logout} title="Cerrar sesión">↪</button></div></div></header>
      <div className="content">
        <div className="page-heading"><div><span className="eyebrow">VITAGUA / CONTROL DE DISTRIBUCIÓN</span><h1>{pageTitle}</h1><p>{page === "dashboard" ? "Vista general de la operación y actividad reciente." : page === "recorridos" ? "Controla las salidas activas y registra los regresos." : page === "historial" ? "Consulta los recorridos registrados y sus tiempos." : page === "trabajadores" ? "Administra el personal autorizado para distribución." : "Organiza las rutas de distribución."}</p></div><div className="heading-actions">{page==="recorridos" && <button className="btn btn-primary" onClick={()=>openModal("trip")}>＋ Registrar salida</button>}{page==="trabajadores" && admin && <button className="btn btn-primary" onClick={()=>openModal("worker")}>＋ Nuevo trabajador</button>}{page==="rutas" && admin && <button className="btn btn-primary" onClick={()=>openModal("route")}>＋ Nueva ruta</button>}{page==="historial" && <button className="btn btn-outline" onClick={loadData}>↻ Actualizar</button>}</div></div>
        {notice && <div className="toast"><span>✓</span>{notice}<button onClick={()=>setNotice("")}>×</button></div>}
        {error && <div className="alert alert-error page-alert">{error}<button onClick={()=>setError("")}>×</button></div>}
        {loading && <div className="loading-line"><span /> Actualizando información...</div>}
        {page==="dashboard" && <Dashboard workers={workers} routes={routes} trips={trips} openTrips={openTrips} todayTrips={todayTrips} completedToday={completedToday} setPage={setPage} />}
        {page==="recorridos" && <Trips openTrips={openTrips} workers={workers} routes={routes} onReturn={id=>mutate(`/api/recorridos/${id}/regreso`,"PATCH",{})} onNew={()=>openModal("trip")} />}
        {page==="historial" && <History trips={visibleTrips} search={search} setSearch={setSearch} filter={filter} setFilter={setFilter} />}
        {page==="trabajadores" && <Workers rows={visibleWorkers} search={search} setSearch={setSearch} admin={admin} onEdit={w=>openModal("worker",w)} onToggle={w=>mutate(`/api/trabajadores/${w.id_trabajador}/estado`,"PATCH",{activo:!w.activo})} />}
        {page==="rutas" && <Routes rows={visibleRoutes} search={search} setSearch={setSearch} admin={admin} onEdit={r=>openModal("route",r)} onToggle={r=>mutate(`/api/rutas/${r.id_ruta}/estado`,"PATCH",{activa:!r.activa})} />}
      </div>
      <footer className="footer"><span>© {new Date().getFullYear()} VITAGUA · Registro de Rutas</span><span>Gestión inteligente de distribución</span></footer>
    </main>
    {modal && <Modal modal={modal} workers={workers.filter(w=>w.activo)} routes={routes.filter(r=>r.activa)} onClose={()=>setModal(null)} onSave={async (data)=>{
      if(modal.type==="worker") return mutate(modal.item ? `/api/trabajadores/${modal.item.id_trabajador}` : "/api/trabajadores", modal.item ? "PATCH" : "POST", data);
      if(modal.type==="route") return mutate(modal.item ? `/api/rutas/${modal.item.id_ruta}` : "/api/rutas", modal.item ? "PATCH" : "POST", data);
      return mutate("/api/recorridos","POST",data);
    }} />}
  </div>;
}

function Dashboard({ workers, routes, trips, openTrips, todayTrips, completedToday, setPage }) {
  const recent = trips.slice(0,5);
  return <div className="dashboard-grid">
    <section className="welcome-banner"><div><span className="eyebrow light">PANEL DE CONTROL</span><h2>Buen día. Todo en orden.</h2><p>Supervisa la distribución y mantén cada recorrido bajo control.</p></div><div className="banner-art"><div className="banner-drop">V</div><div className="banner-ring" /></div><div className="banner-date">{new Intl.DateTimeFormat("es-MX",{weekday:"long",day:"numeric",month:"long"}).format(new Date())}</div></section>
    <div className="stats-grid">
      <Stat icon="↗" label="Recorridos activos" value={openTrips.length} detail="En distribución" tone="teal" />
      <Stat icon="✓" label="Finalizados hoy" value={completedToday} detail={`${todayTrips.length} salidas registradas hoy`} tone="green" />
      <Stat icon="♙" label="Trabajadores activos" value={workers.filter(w=>w.activo).length} detail="Personal disponible" tone="blue" />
      <Stat icon="⌖" label="Rutas activas" value={routes.filter(r=>r.activa).length} detail="Rutas de distribución" tone="amber" />
    </div>
    <div className="dashboard-columns">
      <section className="panel recent-panel"><div className="panel-heading"><div><h3>Actividad reciente</h3><p>Últimos recorridos registrados</p></div><button className="text-button" onClick={()=>setPage("historial")}>Ver historial →</button></div>
        {recent.length ? <div className="table-wrap"><table><thead><tr><th>TRABAJADOR</th><th>RUTA</th><th>SALIDA</th><th>ESTADO</th></tr></thead><tbody>{recent.map(t=><tr key={t.id_recorrido}><td><strong>{t.nombre_trabajador} {t.apellido_paterno}</strong><small>ID: {t.id_trabajador}</small></td><td>{t.nombre_ruta}</td><td>{dateTime(t.fecha_salida)}</td><td><Status active={!t.fecha_regreso} /></td></tr>)}</tbody></table></div> : <Empty icon="◷" title="Sin actividad registrada" text="Cuando se registren salidas, aparecerán aquí." />}
      </section>
      <section className="panel quick-panel"><div className="panel-heading"><div><h3>Accesos rápidos</h3><p>Acciones frecuentes</p></div></div><button className="quick-action" onClick={()=>setPage("recorridos")}><span className="quick-icon teal-bg">↗</span><span><strong>Control de recorridos</strong><small>Registrar salidas y regresos</small></span><b>→</b></button><button className="quick-action" onClick={()=>setPage("trabajadores")}><span className="quick-icon blue-bg">♙</span><span><strong>Personal</strong><small>Consultar trabajadores</small></span><b>→</b></button><button className="quick-action" onClick={()=>setPage("rutas")}><span className="quick-icon amber-bg">⌖</span><span><strong>Rutas</strong><small>Consultar rutas disponibles</small></span><b>→</b></button><div className="operation-note"><span>✦</span><p><strong>Control de operación</strong><br />Cada salida abierta debe cerrarse al registrar el regreso del trabajador.</p></div></section>
    </div>
  </div>;
}
function Stat({icon,label,value,detail,tone}) { return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-detail">{detail}</div></div>; }
function Status({active}) { return <span className={`status-pill ${active?"status-open":"status-done"}`}><i />{active?"En curso":"Finalizado"}</span>; }
function Empty({icon="⌕",title,text}) { return <div className="empty-state"><span>{icon}</span><strong>{title}</strong><p>{text}</p></div>; }

function Trips({openTrips,workers,routes,onReturn,onNew}) {
  return <div className="panel"><div className="panel-heading"><div><h3>Recorridos en curso</h3><p>{openTrips.length} trabajador(es) actualmente en ruta</p></div><button className="btn btn-primary btn-small" onClick={onNew}>＋ Registrar salida</button></div>
    {openTrips.length ? <div className="table-wrap"><table><thead><tr><th>TRABAJADOR</th><th>RUTA ASIGNADA</th><th>HORA DE SALIDA</th><th>TIEMPO TRANSCURRIDO</th><th>ACCIÓN</th></tr></thead><tbody>{openTrips.map(t=><tr key={t.id_recorrido}><td><strong>{t.nombre_trabajador} {t.apellido_paterno}</strong><small>ID: {t.id_trabajador}</small></td><td>{t.nombre_ruta}</td><td>{dateTime(t.fecha_salida)}</td><td><span className="elapsed">{duration(Math.floor((Date.now()-new Date(t.fecha_salida).getTime())/1000))}</span></td><td><button className="btn btn-return" onClick={()=>{if(confirm(`¿Registrar el regreso de ${t.nombre_trabajador}?`)) onReturn(t.id_recorrido);}}>Registrar regreso</button></td></tr>)}</tbody></table></div> : <Empty icon="✓" title="No hay recorridos activos" text="Cuando un trabajador salga a distribución, el recorrido aparecerá aquí." />}
  </div>;
}
function History({trips,search,setSearch,filter,setFilter}) {
  return <section className="panel"><div className="panel-heading"><div><h3>Historial de recorridos</h3><p>Consulta salidas, regresos y duración de cada recorrido.</p></div><span className="result-count">{trips.length} registros</span></div><div className="toolbar"><div className="search-box"><span>⌕</span><input placeholder="Buscar trabajador o ruta..." value={search} onChange={e=>setSearch(e.target.value)} /></div><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="todos">Todos los estados</option><option value="abierto">En curso</option><option value="finalizado">Finalizados</option></select></div>
    {trips.length ? <div className="table-wrap"><table><thead><tr><th>TRABAJADOR</th><th>RUTA</th><th>FECHA</th><th>SALIDA</th><th>REGRESO</th><th>DURACIÓN</th><th>ESTADO</th></tr></thead><tbody>{trips.map(t=><tr key={t.id_recorrido}><td><strong>{t.nombre_trabajador} {t.apellido_paterno}</strong><small>ID: {t.id_trabajador}</small></td><td>{t.nombre_ruta}</td><td>{dateOnly(t.fecha_salida)}</td><td>{dateTime(t.fecha_salida)}</td><td>{dateTime(t.fecha_regreso)}</td><td>{duration(t.duracion_segundos)}</td><td><Status active={!t.fecha_regreso} /></td></tr>)}</tbody></table></div> : <Empty title="No se encontraron recorridos" text="Prueba con otro término de búsqueda o filtro." />}
  </section>;
}
function Workers({rows,search,setSearch,admin,onEdit,onToggle}) {
  return <section className="panel"><div className="panel-heading"><div><h3>Directorio de trabajadores</h3><p>Personal registrado en el sistema.</p></div><span className="result-count">{rows.length} registros</span></div><div className="toolbar"><div className="search-box"><span>⌕</span><input placeholder="Buscar por ID o nombre..." value={search} onChange={e=>setSearch(e.target.value)} /></div></div>
    {rows.length ? <div className="table-wrap"><table><thead><tr><th>ID</th><th>NOMBRE COMPLETO</th><th>TELÉFONO</th><th>ESTADO</th>{admin&&<th>ACCIONES</th>}</tr></thead><tbody>{rows.map(w=><tr key={w.id_trabajador}><td><span className="code-tag">{w.id_trabajador}</span></td><td><strong>{fullName(w)}</strong></td><td>{w.telefono || "—"}</td><td><span className={`status-pill ${w.activo?"status-done":"status-off"}`}><i />{w.activo?"Activo":"Inactivo"}</span></td>{admin&&<td><div className="row-actions"><button className="icon-action" onClick={()=>onEdit(w)} title="Editar">✎</button><button className="icon-action" onClick={()=>{if(confirm(`¿${w.activo?"Desactivar":"Activar"} a ${fullName(w)}?`))onToggle(w);}} title={w.activo?"Desactivar":"Activar"}>{w.activo?"⊘":"✓"}</button></div></td>}</tr>)}</tbody></table></div> : <Empty title="No hay trabajadores" text="Registra al personal para comenzar a asignar recorridos." />}
  </section>;
}
function Routes({rows,search,setSearch,admin,onEdit,onToggle}) {
  return <section className="panel"><div className="panel-heading"><div><h3>Rutas de distribución</h3><p>Catálogo de rutas disponibles para los recorridos.</p></div><span className="result-count">{rows.length} registros</span></div><div className="toolbar"><div className="search-box"><span>⌕</span><input placeholder="Buscar ruta..." value={search} onChange={e=>setSearch(e.target.value)} /></div></div>
    {rows.length ? <div className="table-wrap"><table><thead><tr><th>RUTA</th><th>DESCRIPCIÓN</th><th>ESTADO</th>{admin&&<th>ACCIONES</th>}</tr></thead><tbody>{rows.map(r=><tr key={r.id_ruta}><td><strong>{r.nombre}</strong></td><td className="description-cell">{r.descripcion || "Sin descripción"}</td><td><span className={`status-pill ${r.activa?"status-done":"status-off"}`}><i />{r.activa?"Activa":"Inactiva"}</span></td>{admin&&<td><div className="row-actions"><button className="icon-action" onClick={()=>onEdit(r)} title="Editar">✎</button><button className="icon-action" onClick={()=>{if(confirm(`¿${r.activa?"Desactivar":"Activar"} la ruta ${r.nombre}?`))onToggle(r);}} title={r.activa?"Desactivar":"Activar"}>{r.activa?"⊘":"✓"}</button></div></td>}</tr>)}</tbody></table></div> : <Empty title="No hay rutas registradas" text="Crea rutas para organizar la distribución." />}
  </section>;
}

function Modal({modal,workers,routes,onClose,onSave}) {
  const editing = !!modal.item;
  const [form,setForm] = useState(() => modal.type==="worker" ? {nombre:modal.item?.nombre||"",apellido_paterno:modal.item?.apellido_paterno||"",apellido_materno:modal.item?.apellido_materno||"",telefono:modal.item?.telefono||""} : modal.type==="route" ? {nombre:modal.item?.nombre||"",descripcion:modal.item?.descripcion||""} : {id_trabajador:"",id_ruta:"",observaciones:""});
  const [busy,setBusy]=useState(false); const [error,setError]=useState("");
  const title = modal.type==="worker" ? (editing?"Editar trabajador":"Nuevo trabajador") : modal.type==="route" ? (editing?"Editar ruta":"Nueva ruta") : "Registrar salida";
  const update=(key,value)=>setForm(old=>({...old,[key]:value}));
  async function submit(e) { e.preventDefault(); setError(""); setBusy(true); try { await onSave(modal.type==="worker" ? form : modal.type==="route" ? form : {...form,id_trabajador:Number(form.id_trabajador),id_ruta:Number(form.id_ruta)}); } catch(err){setError(err.message);} finally{setBusy(false);} }
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><section className="modal"><div className="modal-head"><div><span className="eyebrow">VITAGUA · GESTIÓN</span><h2>{title}</h2></div><button className="modal-close" onClick={onClose}>×</button></div><form onSubmit={submit} className="modal-form">
    {modal.type==="worker" && <><div className="form-row"><label>Nombre(s) *<input value={form.nombre} onChange={e=>update("nombre",e.target.value)} maxLength="80" required /></label><label>Apellido paterno *<input value={form.apellido_paterno} onChange={e=>update("apellido_paterno",e.target.value)} maxLength="80" required /></label></div><label>Apellido materno<input value={form.apellido_materno} onChange={e=>update("apellido_materno",e.target.value)} maxLength="80" /></label><label>Teléfono<input value={form.telefono} onChange={e=>update("telefono",e.target.value)} maxLength="25" /></label></>}
    {modal.type==="route" && <><label>Nombre de la ruta *<input value={form.nombre} onChange={e=>update("nombre",e.target.value)} maxLength="100" required /></label><label>Descripción<textarea rows="4" value={form.descripcion} onChange={e=>update("descripcion",e.target.value)} maxLength="5000" placeholder="Describe brevemente la zona o los puntos de distribución..." /></label></>}
    {modal.type==="trip" && <><div className="modal-info"><span>◷</span><p>La fecha y hora de salida se guardarán automáticamente al confirmar el registro.</p></div><label>Trabajador *<select value={form.id_trabajador} onChange={e=>update("id_trabajador",e.target.value)} required><option value="">Selecciona un trabajador</option>{workers.map(w=><option key={w.id_trabajador} value={w.id_trabajador}>ID: {w.id_trabajador} · {fullName(w)}</option>)}</select></label><label>Ruta asignada *<select value={form.id_ruta} onChange={e=>update("id_ruta",e.target.value)} required><option value="">Selecciona una ruta</option>{routes.map(r=><option key={r.id_ruta} value={r.id_ruta}>{r.nombre}</option>)}</select></label><label>Observaciones<textarea rows="3" value={form.observaciones} onChange={e=>update("observaciones",e.target.value)} maxLength="2000" placeholder="Información adicional (opcional)" /></label>{(!workers.length||!routes.length)&&<div className="alert alert-error">Se necesita al menos un trabajador y una ruta activos para registrar una salida.</div>}</>}
    {error&&<div className="alert alert-error">{error}</div>}
    <div className="modal-actions"><button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button><button className="btn btn-primary" disabled={busy || (modal.type==="trip"&&(!workers.length||!routes.length))}>{busy?"Guardando...":modal.type==="trip"?"Confirmar salida":editing?"Guardar cambios":"Crear registro"}</button></div>
  </form></section></div>;
}

export default App;
