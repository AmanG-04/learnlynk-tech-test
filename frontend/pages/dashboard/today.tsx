import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

type Task = {
  id: string;
  type: string;
  status: string;
  application_id: string;
  due_at: string;
};

export default function TodayDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchTasks() {
    setLoading(true);
    setError(null);

    try {
      // TODO:
      // - Query tasks that are due today and not completed
      // - Use supabase.from("tasks").select(...)
      // - You can do date filtering in SQL or client-side

      // Example:
      // const { data, error } = await supabase
      //   .from("tasks")
      //   .select("*")
      //   .eq("status", "open");
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const startIso = startOfDay.toISOString();
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);
      const endIso = endOfDay.toISOString();

      const { data, error } = await supabase
        .from("tasks")
        .select("id,type,status,application_id,due_at")
        .gte("due_at", startIso)
        .lt("due_at", endIso)
        .neq("status", "completed")
        .order("due_at", { ascending: true });

      if (error) {
        throw error;
      }

      setTasks(data ?? []);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }

  async function markComplete(id: string) {
    try {
      // TODO:
      // - Update task.status to 'completed'
      // - Re-fetch tasks or update state optimistically
      const { error } = await supabase
        .from("tasks")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) {
        throw error;
      }

      setTasks((prev) => prev.filter((task) => task.id !== id));
    } catch (err: any) {
      console.error(err);
      alert("Failed to update task");
    }
  }

  useEffect(() => {
    fetchTasks();
  }, []);

  if (loading) return <div>Loading tasks...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;

  return (
    <main style={{ padding: "1.5rem" }}>
      <h1>Today&apos;s Tasks</h1>
      {tasks.length === 0 && <p>No tasks due today 🎉</p>}

      {tasks.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Application</th>
              <th>Due At</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.id}>
                <td>{t.type}</td>
                <td>{t.application_id}</td>
                <td>{new Date(t.due_at).toLocaleString()}</td>
                <td>{t.status}</td>
                <td>
                  {t.status !== "completed" && (
                    <button onClick={() => markComplete(t.id)}>
                      Mark Complete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
