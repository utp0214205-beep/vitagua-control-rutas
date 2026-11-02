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
  { id: "rutas", label: "Rutas", icon: "⌖", group: "GESTIÓN" },
  { id: "asignaciones", label: "Asignaciones", icon: "⇄", group: "GESTIÓN" }
];

function App() {
  const [user, setUser] = useState(initialUser);
  const [token, setToken] = useState(tokenSaved);
  const [page, setPage] = useState("dashboard");
  const [workers, setWorkers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [assignments, setAssignments] = useState([]);
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
      const [w, r, a, t, o] = await Promise.all([
        admin ? request("/api/trabajadores?incluirInactivos=true", { token }) : Promise.resolve({ trabajadores: [] }),
        admin ? request("/api/rutas?incluirInactivas=true", { token }) : Promise.resolve({ rutas: [] }),
        admin ? request("/api/asignaciones", { token }) : request("/api/asignaciones/mias", { token }),
        request("/api/recorridos?limite=100&pagina=1", { token }),
        request("/api/recorridos/abiertos", { token })
      ]);
      setWorkers(w.trabajadores || []); setRoutes(r.rutas || []);
      setAssignments(a.asignaciones || []);
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
      {["GENERAL","OPERACIÓN","GESTIÓN"].map(group=><div className="nav-group" key={group}><div className="nav-caption">{group}</div>{navItems.filter(n=>n.group===group).filter(n=>admin || !["trabajadores","rutas","asignaciones"].includes(n.id)).map(n=><button key={n.id} className={`nav-link ${page===n.id ? "active" : ""}`} onClick={()=>{setPage(n.id);setSearch("");setMobileNav(false);setError("");}}><span className="nav-icon">{n.icon}</span>{n.label}{n.id==="recorridos" && openTrips.length>0 && <b className="nav-count">{openTrips.length}</b>}</button>)}</div>)}
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon">✦</div><strong>{admin ? "Supervisión de operación" : "Tu jornada"}</strong><p>{admin ? "Administra asignaciones y supervisa los recorridos sin registrar salidas ni regresos." : "Registra tu salida y tu regreso para mantener actualizado tu recorrido."}</p></div><div className="sidebar-version">VITAGUA SISTEMA · v1.0</div></div>
    </aside>
    {mobileNav && <button className="mobile-backdrop" onClick={()=>setMobileNav(false)} aria-label="Cerrar menú" />}
    <main className="main-area">
      <header className="topbar"><div className="topbar-left"><button className="menu-toggle" onClick={()=>setMobileNav(true)}>☰</button><div className="breadcrumb">VITAGUA <span>/</span> <strong>{pageTitle}</strong></div></div><div className="topbar-right"><div className="connection"><span className="status-dot" /> Sistema conectado</div><div className="user-menu"><div className="avatar">{(user.nombre || "A").charAt(0).toUpperCase()}</div><div className="user-meta"><strong>{user.nombre}</strong><small>{admin ? "Administrador" : "Personal"}</small></div><button className="logout-btn" onClick={logout} title="Cerrar sesión">↪</button></div></div></header>
      <div className="content">
        <div className="page-heading"><div><span className="eyebrow">VITAGUA / CONTROL DE DISTRIBUCIÓN</span><h1>{pageTitle}</h1><p>{page === "dashboard" ? "Vista general de la operación y actividad reciente." : page === "recorridos" ? "Controla las salidas activas y registra los regresos." : page === "historial" ? "Consulta los recorridos registrados y sus tiempos." : page === "trabajadores" ? "Administra el personal autorizado para distribución." : page === "asignaciones" ? "Relaciona trabajadores con las rutas que tienen autorizadas." : "Organiza las rutas de distribución."}</p></div><div className="heading-actions">{page==="recorridos" && !admin && openTrips.length===0 && <button className="btn btn-primary" onClick={()=>openModal("trip")}>＋ Registrar salida</button>}{page==="trabajadores" && admin && <button className="btn btn-primary" onClick={()=>openModal("worker")}>＋ Nuevo trabajador</button>}{page==="rutas" && admin && <button className="btn btn-primary" onClick={()=>openModal("route")}>＋ Nueva ruta</button>}{page==="historial" && <button className="btn btn-outline" onClick={loadData}>↻ Actualizar</button>}</div></div>
        {notice && <div className="toast"><span>✓</span>{notice}<button onClick={()=>setNotice("")}>×</button></div>}
        {error && <div className="alert alert-error page-alert">{error}<button onClick={()=>setError("")}>×</button></div>}
        {loading && <div className="loading-line"><span /> Actualizando información...</div>}
        {page==="dashboard" && <Dashboard admin={admin} workers={workers} routes={routes} trips={trips} openTrips={openTrips} todayTrips={todayTrips} completedToday={completedToday} setPage={setPage} />}
        {page==="recorridos" && <Trips admin={admin} openTrips={openTrips} onReturn={id=>mutate(`/api/recorridos/${id}/regreso`,"PATCH",{})} />}
        {page==="historial" && <History trips={visibleTrips} search={search} setSearch={setSearch} filter={filter} setFilter={setFilter} />}
        {page==="trabajadores" && <Workers rows={visibleWorkers} search={search} setSearch={setSearch} admin={admin} onEdit={w=>openModal("worker",w)} onAccount={w=>openModal("account",w)} onToggle={w=>mutate(`/api/trabajadores/${w.id_trabajador}/estado`,"PATCH",{activo:!w.activo})} />}
        {page==="rutas" && <Routes rows={visibleRoutes} search={search} setSearch={setSearch} admin={admin} onEdit={r=>openModal("route",r)} onToggle={r=>mutate(`/api/rutas/${r.id_ruta}/estado`,"PATCH",{activa:!r.activa})} />}
        {page==="asignaciones" && admin && <Assignments rows={assignments} onCreate={()=>openModal("assignment")} onToggle={a=>mutate(`/api/asignaciones/${a.id_asignacion}/estado`,"PATCH",{activa:!a.activa})} />}
      </div>
      <footer className="footer"><span>© {new Date().getFullYear()} VITAGUA · Registro de Rutas</span><span>Gestión inteligente de distribución</span></footer>
    </main>
    {modal && <Modal modal={modal} workers={workers.filter(w=>w.activo)} routes={(admin ? routes.filter(r=>r.activa) : assignments)} onClose={()=>setModal(null)} onSave={async (data)=>{
      if(modal.type==="worker") return mutate(modal.item ? `/api/trabajadores/${modal.item.id_trabajador}` : "/api/trabajadores", modal.item ? "PATCH" : "POST", data);
      if(modal.type==="account") return mutate(`/api/trabajadores/${modal.item.id_trabajador}/cuenta`,"POST",data);
      if(modal.type==="route") return mutate(modal.item ? `/api/rutas/${modal.item.id_ruta}` : "/api/rutas", modal.item ? "PATCH" : "POST", data);
      if(modal.type==="assignment") return mutate("/api/asignaciones","POST",data);
      return mutate("/api/recorridos","POST",data);
    }} />}
  </div>;
}

function Dashboard({ admin, workers, routes, trips, openTrips, todayTrips, completedToday, setPage }) {
  const recent = trips.slice(0,5);
  return <div className="dashboard-grid">
    <section className="welcome-banner"><div><span className="eyebrow light">PANEL DE CONTROL</span><h2>Buen día. Todo en orden.</h2><p>{admin ? "Supervisa la distribución y mantén cada recorrido bajo control." : "Consulta tus recorridos y mantén actualizada tu jornada."}</p></div><div className="banner-art"><div className="banner-drop">V</div><div className="banner-ring" /></div><div className="banner-date">{new Intl.DateTimeFormat("es-MX",{weekday:"long",day:"numeric",month:"long"}).format(new Date())}</div></section>
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
      <section className="panel quick-panel"><div className="panel-heading"><div><h3>Accesos rápidos</h3><p>Acciones frecuentes</p></div></div><button className="quick-action" onClick={()=>setPage("recorridos")}><span className="quick-icon teal-bg">↗</span><span><strong>Control de recorridos</strong><small>{admin ? "Supervisar recorridos en curso" : "Registrar tu salida y tu regreso"}</small></span><b>→</b></button>{admin ? <><button className="quick-action" onClick={()=>setPage("asignaciones")}><span className="quick-icon teal-bg">⇄</span><span><strong>Asignaciones</strong><small>Relacionar trabajadores y rutas</small></span><b>→</b></button><button className="quick-action" onClick={()=>setPage("trabajadores")}><span className="quick-icon blue-bg">♙</span><span><strong>Personal</strong><small>Administrar trabajadores y accesos</small></span><b>→</b></button><button className="quick-action" onClick={()=>setPage("rutas")}><span className="quick-icon amber-bg">⌖</span><span><strong>Rutas</strong><small>Administrar rutas de distribución</small></span><b>→</b></button></> : <button className="quick-action" onClick={()=>setPage("historial")}><span className="quick-icon blue-bg">◷</span><span><strong>Mi historial</strong><small>Consultar tus recorridos anteriores</small></span><b>→</b></button>}<div className="operation-note"><span>✦</span><p><strong>{admin ? "Control de operación" : "Registro de jornada"}</strong><br />{admin ? "Cada trabajador registra su propio regreso para cerrar el recorrido. El administrador supervisa el avance desde Recorridos en curso." : "Registra tu regreso al terminar la distribución. El sistema cerrará tu recorrido y calculará su duración automáticamente."}</p></div></section>
    </div>
  </div>;
}
function Stat({icon,label,value,detail,tone}) { return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-detail">{detail}</div></div>; }
function Status({active}) { return <span className={`status-pill ${active?"status-open":"status-done"}`}><i />{active?"En curso":"Finalizado"}</span>; }
function Empty({icon="⌕",title,text}) { return <div className="empty-state"><span>{icon}</span><strong>{title}</strong><p>{text}</p></div>; }

function Trips({admin,openTrips,onReturn}) {
  return <div className="panel"><div className="panel-heading"><div><h3>Recorridos en curso</h3><p>{openTrips.length} trabajador(es) actualmente en ruta</p></div></div>
    {openTrips.length ? <div className="table-wrap"><table><thead><tr><th>TRABAJADOR</th><th>RUTA ASIGNADA</th><th>HORA DE SALIDA</th><th>TIEMPO TRANSCURRIDO</th>{!admin&&<th>ACCIÓN</th>}</tr></thead><tbody>{openTrips.map(t=><tr key={t.id_recorrido}><td><strong>{t.nombre_trabajador} {t.apellido_paterno}</strong><small>ID: {t.id_trabajador}</small></td><td>{t.nombre_ruta}</td><td>{dateTime(t.fecha_salida)}</td><td><span className="elapsed">{duration(Math.floor((Date.now()-new Date(t.fecha_salida).getTime())/1000))}</span></td>{!admin&&<td><button className="btn btn-return" onClick={()=>{if(confirm("¿Confirmas que has regresado y deseas cerrar tu recorrido?")) onReturn(t.id_recorrido);}}>Registrar mi regreso</button></td>}</tr>)}</tbody></table></div> : <Empty icon="✓" title="No hay recorridos activos" text={admin ? "Cuando un trabajador registre su salida, el recorrido aparecerá aquí." : "No tienes un recorrido abierto. Puedes iniciar uno con una de tus rutas asignadas."} />}
  </div>;
}
function History({trips,search,setSearch,filter,setFilter}) {
  return <section className="panel"><div className="panel-heading"><div><h3>Historial de recorridos</h3><p>Consulta salidas, regresos y duración de cada recorrido.</p></div><span className="result-count">{trips.length} registros</span></div><div className="toolbar"><div className="search-box"><span>⌕</span><input placeholder="Buscar trabajador o ruta..." value={search} onChange={e=>setSearch(e.target.value)} /></div><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="todos">Todos los estados</option><option value="abierto">En curso</option><option value="finalizado">Finalizados</option></select></div>
    {trips.length ? <div className="table-wrap"><table><thead><tr><th>TRABAJADOR</th><th>RUTA</th><th>FECHA</th><th>SALIDA</th><th>REGRESO</th><th>DURACIÓN</th><th>ESTADO</th></tr></thead><tbody>{trips.map(t=><tr key={t.id_recorrido}><td><strong>{t.nombre_trabajador} {t.apellido_paterno}</strong><small>ID: {t.id_trabajador}</small></td><td>{t.nombre_ruta}</td><td>{dateOnly(t.fecha_salida)}</td><td>{dateTime(t.fecha_salida)}</td><td>{dateTime(t.fecha_regreso)}</td><td>{duration(t.duracion_segundos)}</td><td><Status active={!t.fecha_regreso} /></td></tr>)}</tbody></table></div> : <Empty title="No se encontraron recorridos" text="Prueba con otro término de búsqueda o filtro." />}
  </section>;
}
function Workers({rows,search,setSearch,admin,onEdit,onAccount,onToggle}) {
  return <section className="panel"><div className="panel-heading"><div><h3>Directorio de trabajadores</h3><p>Personal registrado en el sistema.</p></div><span className="result-count">{rows.length} registros</span></div><div className="toolbar"><div className="search-box"><span>⌕</span><input placeholder="Buscar por ID o nombre..." value={search} onChange={e=>setSearch(e.target.value)} /></div></div>
    {rows.length ? <div className="table-wrap"><table><thead><tr><th>ID</th><th>NOMBRE COMPLETO</th><th>TELÉFONO</th><th>ACCESO</th><th>ESTADO</th>{admin&&<th>ACCIONES</th>}</tr></thead><tbody>{rows.map(w=><tr key={w.id_trabajador}><td><span className="code-tag">{w.id_trabajador}</span></td><td><strong>{fullName(w)}</strong></td><td>{w.telefono || "—"}</td><td>{w.tiene_cuenta ? <span title={w.correo_cuenta}>{w.correo_cuenta || "Cuenta creada"}</span> : <span className="status-pill status-off">Sin cuenta</span>}</td><td><span className={`status-pill ${w.activo?"status-done":"status-off"}`}><i />{w.activo?"Activo":"Inactivo"}</span></td>{admin&&<td><div className="row-actions"><button className="icon-action" onClick={()=>onEdit(w)} title="Editar">✎</button>{!w.tiene_cuenta&&w.activo&&<button className="icon-action" onClick={()=>onAccount(w)} title="Crear cuenta de acceso">＋</button>}<button className="icon-action" onClick={()=>{if(confirm(`¿${w.activo?"Desactivar":"Activar"} a ${fullName(w)}?`))onToggle(w);}} title={w.activo?"Desactivar":"Activar"}>{w.activo?"⊘":"✓"}</button></div></td>}</tr>)}</tbody></table></div> : <Empty title="No hay trabajadores" text="Registra al personal para comenzar a asignar recorridos." />}
  </section>;
}
function Routes({rows,search,setSearch,admin,onEdit,onToggle}) {
  return <section className="panel"><div className="panel-heading"><div><h3>Rutas de distribución</h3><p>Catálogo de rutas disponibles para los recorridos.</p></div><span className="result-count">{rows.length} registros</span></div><div className="toolbar"><div className="search-box"><span>⌕</span><input placeholder="Buscar ruta..." value={search} onChange={e=>setSearch(e.target.value)} /></div></div>
    {rows.length ? <div className="table-wrap"><table><thead><tr><th>RUTA</th><th>DESCRIPCIÓN</th><th>ESTADO</th>{admin&&<th>ACCIONES</th>}</tr></thead><tbody>{rows.map(r=><tr key={r.id_ruta}><td><strong>{r.nombre}</strong></td><td className="description-cell">{r.descripcion || "Sin descripción"}</td><td><span className={`status-pill ${r.activa?"status-done":"status-off"}`}><i />{r.activa?"Activa":"Inactiva"}</span></td>{admin&&<td><div className="row-actions"><button className="icon-action" onClick={()=>onEdit(r)} title="Editar">✎</button><button className="icon-action" onClick={()=>{if(confirm(`¿${r.activa?"Desactivar":"Activar"} la ruta ${r.nombre}?`))onToggle(r);}} title={r.activa?"Desactivar":"Activar"}>{r.activa?"⊘":"✓"}</button></div></td>}</tr>)}</tbody></table></div> : <Empty title="No hay rutas registradas" text="Crea rutas para organizar la distribución." />}
  </section>;
}

function Assignments({rows,onCreate,onToggle}) {
  return <section className="panel"><div className="panel-heading"><div><h3>Directorio de asignaciones</h3><p>Rutas autorizadas para cada trabajador.</p></div><button className="btn btn-primary" onClick={onCreate}>＋ Nueva asignación</button></div>
    {rows.length ? <div className="table-wrap"><table><thead><tr><th>TRABAJADOR</th><th>RUTA</th><th>ESTADO</th><th>ACCIONES</th></tr></thead><tbody>{rows.map(a=><tr key={a.id_asignacion}><td><strong>{a.nombre_trabajador} {a.apellido_paterno}</strong><small>ID: {a.id_trabajador}</small></td><td>{a.nombre_ruta}</td><td><span className={`status-pill ${a.activa&&a.trabajador_activo&&a.ruta_activa?"status-done":"status-off"}`}><i />{a.activa&&a.trabajador_activo&&a.ruta_activa?"Activa":"Inactiva"}</span></td><td><button className="icon-action" title={a.activa?"Desactivar":"Activar"} onClick={()=>{if(confirm(`${a.activa?"¿Desactivar":"¿Activar"} la asignación de esta ruta?`))onToggle(a);}}>{a.activa?"⊘":"✓"}</button></td></tr>)}</tbody></table></div> : <Empty title="Sin asignaciones" text="Crea una asignación para que un trabajador pueda seleccionar esa ruta." />}
  </section>;
}

function Modal({modal,workers,routes,onClose,onSave}) {
  const editing = !!modal.item;
  const [form,setForm] = useState(() => modal.type==="account" ? {correo:"",contrasena:"",confirmar_contrasena:""} : modal.type==="worker" ? {nombre:modal.item?.nombre||"",apellido_paterno:modal.item?.apellido_paterno||"",apellido_materno:modal.item?.apellido_materno||"",telefono:modal.item?.telefono||"",crear_cuenta:false,correo:"",contrasena:"",confirmar_contrasena:""} : modal.type==="route" ? {nombre:modal.item?.nombre||"",descripcion:modal.item?.descripcion||""} : modal.type==="assignment" ? {id_trabajador:"",id_ruta:""} : {id_ruta:"",observaciones:""});
  const [busy,setBusy]=useState(false); const [error,setError]=useState("");
  const title = modal.type==="account" ? "Crear cuenta de operador" : modal.type==="worker" ? (editing?"Editar trabajador":"Nuevo trabajador") : modal.type==="route" ? (editing?"Editar ruta":"Nueva ruta") : modal.type==="assignment" ? "Nueva asignación" : "Registrar salida";
  const update=(key,value)=>setForm(old=>({...old,[key]:value}));
  async function submit(e) {
    e.preventDefault(); setError("");
    if((modal.type==="account" || modal.type==="worker") && form.crear_cuenta && form.contrasena!==form.confirmar_contrasena) return setError("Las contraseñas no coinciden.");
    setBusy(true);
    try {
      let data;
      if(modal.type==="account") data={correo:form.correo,contrasena:form.contrasena};
      else if(modal.type==="worker") {
        data={nombre:form.nombre,apellido_paterno:form.apellido_paterno,apellido_materno:form.apellido_materno,telefono:form.telefono};
        if(form.crear_cuenta) data.cuenta={correo:form.correo,contrasena:form.contrasena};
      } else if(modal.type==="route") data=form;
      else if(modal.type==="assignment") data={id_trabajador:Number(form.id_trabajador),id_ruta:Number(form.id_ruta)};
      else data={id_ruta:Number(form.id_ruta),observaciones:form.observaciones};
      await onSave(data);
    } catch(err){setError(err.message);} finally{setBusy(false);}
  }
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><section className="modal"><div className="modal-head"><div><span className="eyebrow">VITAGUA · GESTIÓN</span><h2>{title}</h2></div><button className="modal-close" onClick={onClose}>×</button></div><form onSubmit={submit} className="modal-form">
    {modal.type==="account" && <><div className="modal-info"><span>♙</span><p>La cuenta quedará vinculada a {fullName(modal.item)} y tendrá permisos de Operador.</p></div><label>Correo de acceso *<input type="email" value={form.correo} onChange={e=>update("correo",e.target.value)} required /></label><div className="form-row"><label>Contraseña inicial *<input type="password" minLength="12" value={form.contrasena} onChange={e=>update("contrasena",e.target.value)} required /></label><label>Confirmar contraseña *<input type="password" minLength="12" value={form.confirmar_contrasena} onChange={e=>update("confirmar_contrasena",e.target.value)} required /></label></div><small className="form-hint">Mínimo 12 caracteres.</small></>}
    {modal.type==="worker" && <><div className="form-row"><label>Nombre(s) *<input value={form.nombre} onChange={e=>update("nombre",e.target.value)} maxLength="80" required /></label><label>Apellido paterno *<input value={form.apellido_paterno} onChange={e=>update("apellido_paterno",e.target.value)} maxLength="80" required /></label></div><label>Apellido materno<input value={form.apellido_materno} onChange={e=>update("apellido_materno",e.target.value)} maxLength="80" /></label><label>Teléfono<input value={form.telefono} onChange={e=>update("telefono",e.target.value)} maxLength="25" /></label>{!editing && <><label className="check-line"><input type="checkbox" checked={form.crear_cuenta} onChange={e=>update("crear_cuenta",e.target.checked)} /> Crear cuenta de acceso para este trabajador</label>{form.crear_cuenta && <><div className="modal-info"><span>♙</span><p>Se creará una cuenta con rol Operador vinculada automáticamente a este trabajador.</p></div><label>Correo de acceso *<input type="email" value={form.correo} onChange={e=>update("correo",e.target.value)} required /></label><div className="form-row"><label>Contraseña inicial *<input type="password" minLength="12" value={form.contrasena} onChange={e=>update("contrasena",e.target.value)} required /></label><label>Confirmar contraseña *<input type="password" minLength="12" value={form.confirmar_contrasena} onChange={e=>update("confirmar_contrasena",e.target.value)} required /></label></div><small className="form-hint">Mínimo 12 caracteres. La contraseña se almacena protegida.</small></>}</>}</>}
    {modal.type==="route" && <><label>Nombre de la ruta *<input value={form.nombre} onChange={e=>update("nombre",e.target.value)} maxLength="100" required /></label><label>Descripción<textarea rows="4" value={form.descripcion} onChange={e=>update("descripcion",e.target.value)} maxLength="5000" placeholder="Describe brevemente la zona o los puntos de distribución..." /></label></>}
    {modal.type==="assignment" && <><label>Trabajador *<select value={form.id_trabajador} onChange={e=>update("id_trabajador",e.target.value)} required><option value="">Selecciona un trabajador</option>{workers.map(w=><option key={w.id_trabajador} value={w.id_trabajador}>ID: {w.id_trabajador} · {fullName(w)}</option>)}</select></label><label>Ruta *<select value={form.id_ruta} onChange={e=>update("id_ruta",e.target.value)} required><option value="">Selecciona una ruta</option>{routes.map(r=><option key={r.id_ruta} value={r.id_ruta}>{r.nombre}</option>)}</select></label></>}
    {modal.type==="trip" && <><div className="modal-info"><span>◷</span><p>La fecha y hora de salida se guardarán automáticamente al confirmar el registro. Solo puedes seleccionar una ruta que tengas asignada.</p></div><label>Ruta asignada *<select value={form.id_ruta} onChange={e=>update("id_ruta",e.target.value)} required><option value="">Selecciona una ruta</option>{routes.map(r=><option key={r.id_ruta} value={r.id_ruta}>{r.nombre_ruta || r.nombre}</option>)}</select></label><label>Observaciones<textarea rows="3" value={form.observaciones} onChange={e=>update("observaciones",e.target.value)} maxLength="2000" placeholder="Información adicional (opcional)" /></label>{!routes.length&&<div className="alert alert-error">No tienes rutas asignadas activas. Solicita al administrador que te asigne una ruta.</div>}</>}
    {error&&<div className="alert alert-error">{error}</div>}
    <div className="modal-actions"><button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button><button className="btn btn-primary" disabled={busy || (modal.type==="trip"&&!routes.length) || (modal.type==="assignment"&&(!workers.length||!routes.length))}>{busy?"Guardando...":modal.type==="trip"?"Confirmar salida":editing?"Guardar cambios":"Crear registro"}</button></div>
  </form></section></div>;
}

export default App;
