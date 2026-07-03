import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../api/auth.jsx";
import { Badge, PageHeader } from "../components/UI.jsx";

const empty = { title: "", description: "", priority: "medium", due_date: "", animal: "", assigned_to: "" };
const archiveKey = "sigera_archived_tasks";
const hiddenTaskHistoryKey = "sigera_hidden_task_history";

function readArchivedIds() {
  try {
    return JSON.parse(localStorage.getItem(archiveKey) || "[]");
  } catch {
    return [];
  }
}

function readHiddenTaskHistoryIds() {
  try {
    return JSON.parse(localStorage.getItem(hiddenTaskHistoryKey) || "[]");
  } catch {
    return [];
  }
}

function normalizeTask(task) {
  return {
    ...empty,
    ...task,
    animal: task.animal || "",
    assigned_to: task.assigned_to || "",
    due_date: task.due_date ? task.due_date.slice(0, 16) : "",
  };
}

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [archivedIds, setArchivedIds] = useState(readArchivedIds);
  const [hiddenHistoryIds, setHiddenHistoryIds] = useState(readHiddenTaskHistoryIds);
  const [archiveMode, setArchiveMode] = useState("manual");
  const [historyFilters, setHistoryFilters] = useState({ from: "", to: "" });
  const [error, setError] = useState("");

  const load = () => api.get("/tasks/")
    .then(({ data }) => {
      setTasks(data);
      setError("");
    })
    .catch(() => setError("No fue posible cargar las tareas."));

  useEffect(() => {
    load();
    api.get("/animals/").then(({ data }) => setAnimals(data));
    if (user?.profile?.role === "admin") api.get("/users/").then(({ data }) => setStaff(data));
  }, [user?.profile?.role]);

  useEffect(() => {
    localStorage.setItem(archiveKey, JSON.stringify(archivedIds));
  }, [archivedIds]);

  useEffect(() => {
    localStorage.setItem(hiddenTaskHistoryKey, JSON.stringify(hiddenHistoryIds));
  }, [hiddenHistoryIds]);

  const visibleTasks = useMemo(() => tasks.filter((task) => !archivedIds.includes(task.id)), [tasks, archivedIds]);
  const historyTasks = useMemo(() => tasks.filter((task) => archivedIds.includes(task.id) && !hiddenHistoryIds.includes(task.id)), [tasks, archivedIds, hiddenHistoryIds]);
  const filteredHistoryTasks = useMemo(() => historyTasks.filter((task) => inDateRange(task.completed_at || task.due_date, historyFilters.from, historyFilters.to)), [historyTasks, historyFilters]);

  async function save(event) {
    event.preventDefault();
    const payload = {
      ...form,
      animal: form.animal || null,
      assigned_to: form.assigned_to || null,
      due_date: form.due_date || null,
    };
    try {
      if (editingId) {
        await api.patch(`/tasks/${editingId}/`, payload);
      } else {
        await api.post("/tasks/", payload);
      }
      setForm(empty);
      setEditingId(null);
      load();
    } catch {
      setError(editingId ? "No fue posible actualizar la tarea." : "No fue posible crear la tarea.");
    }
  }

  async function advance(task, status) {
    try {
      await api.patch(`/tasks/${task.id}/`, { status });
      if (status === "completed" && archiveMode === "instant") archiveTask(task.id);
      load();
    } catch {
      setError("No fue posible actualizar la tarea.");
    }
  }

  async function removeTask() {
    if (!editingId) return;
    if (!window.confirm("Eliminar esta tarea? Esta accion no se puede deshacer.")) return;
    try {
      await api.delete(`/tasks/${editingId}/`);
      setArchivedIds((ids) => ids.filter((id) => id !== editingId));
      setEditingId(null);
      setForm(empty);
      load();
    } catch {
      setError("No fue posible eliminar la tarea.");
    }
  }

  function editTask(task) {
    setEditingId(task.id);
    setForm(normalizeTask(task));
  }

  function archiveTask(taskId) {
    setArchivedIds((ids) => ids.includes(taskId) ? ids : [...ids, taskId]);
  }

  function restoreTask(taskId) {
    setArchivedIds((ids) => ids.filter((id) => id !== taskId));
    setHiddenHistoryIds((ids) => ids.filter((id) => id !== taskId));
  }

  function archiveCompleted() {
    const now = new Date();
    const days = Number(archiveMode);
    const eligible = tasks.filter((task) => {
      if (task.status !== "completed") return false;
      if (archiveMode === "manual" || archiveMode === "instant") return true;
      const completedAt = task.completed_at ? new Date(task.completed_at) : now;
      return (now - completedAt) / 86400000 >= days;
    });
    setArchivedIds((ids) => Array.from(new Set([...ids, ...eligible.map((task) => task.id)])));
  }

  function clearHistory(days) {
    const now = new Date();
    const ids = historyTasks.filter((task) => {
      const value = task.completed_at || task.due_date;
      const date = value ? new Date(value) : now;
      if (Number.isFinite(days)) return (now - date) / 86400000 <= days;
      return inDateRange(value, historyFilters.from, historyFilters.to);
    }).map((task) => task.id);
    setHiddenHistoryIds((current) => Array.from(new Set([...current, ...ids])));
  }

  return (
    <>
      <PageHeader title="Tareas del refugio" subtitle="Coordina cuidados, tratamientos y actividades del equipo." />
      {error && <div className="alert error">{error}</div>}
      <section className="dashboard-grid tasks-dashboard">
        <form className="panel form-section task-form" onSubmit={save}>
          <div className="section-title">
            <i className={`bi ${editingId ? "bi-pencil-square" : "bi-plus-square"}`} />
            <div>
              <h2>{editingId ? "Editar tarea" : "Nueva tarea"}</h2>
              <p>{editingId ? "Actualiza responsable, prioridad y estado operativo." : "Asigna responsables, prioridad y una fecha de seguimiento."}</p>
            </div>
          </div>
          <label>Titulo<input value={form.title} required onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
          <label>Descripcion<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
          <div className="two-cols">
            <label>Prioridad<select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}><option value="low">Baja</option><option value="medium">Media</option><option value="high">Alta</option><option value="urgent">Urgente</option></select></label>
            <label>Fecha limite<input type="datetime-local" value={form.due_date} onChange={(event) => setForm({ ...form, due_date: event.target.value })} /></label>
            <label>Animal<select value={form.animal} onChange={(event) => setForm({ ...form, animal: event.target.value })}><option value="">No aplica</option>{animals.map((animal) => <option value={animal.id} key={animal.id}>{animal.name}</option>)}</select></label>
            {user?.profile?.role === "admin" && <label>Asignar a<select value={form.assigned_to} onChange={(event) => setForm({ ...form, assigned_to: event.target.value })}><option value="">Sin asignar</option>{staff.map((member) => <option value={member.id} key={member.id}>{member.first_name} {member.last_name}</option>)}</select></label>}
          </div>
          <div className="form-actions">
            {editingId && <button type="button" className="danger-button" onClick={removeTask}><i className="bi bi-trash" /> Eliminar</button>}
            {editingId && <button type="button" className="secondary" onClick={() => { setEditingId(null); setForm(empty); }}>Cancelar</button>}
            <button className="primary"><i className="bi bi-check2-square" /> {editingId ? "Guardar cambios" : "Crear tarea"}</button>
          </div>
        </form>

        <section className="panel task-list">
          <div className="section-title task-list-title">
            <i className="bi bi-list-check" />
            <div><h2>Seguimiento</h2><p>Tareas activas del equipo.</p></div>
            <div className="task-archive-controls">
              <select value={archiveMode} onChange={(event) => setArchiveMode(event.target.value)} aria-label="Frecuencia de archivo">
                <option value="manual">Manual</option>
                <option value="instant">Al completar</option>
                <option value="7">Cada 7 dias</option>
                <option value="30">Cada 30 dias</option>
              </select>
              <button type="button" className="secondary small" onClick={archiveCompleted}><i className="bi bi-archive" /> Archivar completadas</button>
            </div>
          </div>
          {visibleTasks.length ? visibleTasks.map((task) => <TaskItem key={task.id} task={task} onEdit={editTask} onArchive={archiveTask} onAdvance={advance} />) : <p className="empty-state">No hay tareas activas registradas.</p>}
        </section>
      </section>

      <section className="panel task-history-panel">
        <div className="section-title"><i className="bi bi-clock-history" /><div><h2>Historial de tareas</h2><p>Tareas completadas o archivadas para consulta.</p></div></div>
        <div className="history-controls task-history-toolbar">
          <label>Desde<input type="date" value={historyFilters.from} onChange={(event) => setHistoryFilters({ ...historyFilters, from: event.target.value })} /></label>
          <label>Hasta<input type="date" value={historyFilters.to} onChange={(event) => setHistoryFilters({ ...historyFilters, to: event.target.value })} /></label>
          <button type="button" className="secondary small" onClick={() => setHistoryFilters({ from: "", to: "" })}>Limpiar filtro</button>
          <button type="button" className="secondary small" onClick={() => clearHistory(7)}>Limpiar 7 dias</button>
          <button type="button" className="secondary small" onClick={() => clearHistory(30)}>Limpiar 30 dias</button>
          <button type="button" className="danger-button small" onClick={() => setHiddenHistoryIds((ids) => Array.from(new Set([...ids, ...historyTasks.map((task) => task.id)])))}>Limpiar todo</button>
        </div>
        {filteredHistoryTasks.length ? filteredHistoryTasks.map((task) => (
          <article className="task-history-item" key={task.id}>
            <div><strong>{task.title}</strong><small>{task.completed_at ? `Completada: ${new Date(task.completed_at).toLocaleDateString()}` : "Archivada manualmente"}</small></div>
            <button type="button" className="secondary small" onClick={() => restoreTask(task.id)}>Restaurar</button>
          </article>
        )) : <p className="empty-state">Aun no hay tareas archivadas.</p>}
      </section>
    </>
  );
}

function TaskItem({ task, onEdit, onArchive, onAdvance }) {
  return (
    <article className="task-item">
      <div>
        <Badge tone={task.priority === "urgent" ? "red" : task.priority === "high" ? "orange" : "blue"}>{task.priority_label}</Badge>
        <h3>{task.title}</h3>
        <p>{task.description}</p>
        <small>{task.assigned_to_name || "Sin asignar"}{task.animal_name ? ` - ${task.animal_name}` : ""}</small>
      </div>
      <div className="task-actions">
        <div className="task-action-row">
          <Badge tone={task.status === "completed" ? "green" : task.status === "cancelled" ? "gray" : "orange"}>{task.status_label}</Badge>
          <button className="icon-button" type="button" onClick={() => onEdit(task)} title="Editar tarea"><i className="bi bi-pencil" /></button>
        </div>
        {task.status === "completed" ? (
          <button className="secondary small" type="button" onClick={() => onArchive(task.id)}><i className="bi bi-archive" /> Archivar</button>
        ) : (
          <button className="secondary small" type="button" onClick={() => onAdvance(task, task.status === "pending" ? "in_progress" : "completed")}>{task.status === "pending" ? "Iniciar" : "Completar"}</button>
        )}
      </div>
    </article>
  );
}

function inDateRange(value, from, to) {
  if (!value) return true;
  const date = new Date(value);
  if (from && date < new Date(`${from}T00:00:00`)) return false;
  if (to && date > new Date(`${to}T23:59:59`)) return false;
  return true;
}
