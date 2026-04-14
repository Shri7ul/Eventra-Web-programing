import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PublicNav from "../components/PublicNav";
import { getUserRegistrations } from "../lib/eventService";
import { useAuth } from "../state/AuthContext";

export default function UserDashboardPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    getUserRegistrations(user.id)
      .then(setRows)
      .catch((e) => {
        setError(e.message || "Failed to load your registrations");
        setRows([]);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const stats = useMemo(
    () => ({
      registered: rows.length,
      checkedIn: rows.filter((r) => r.attendance_status === "checked_in").length,
      pending: rows.filter((r) => r.attendance_status !== "checked_in").length
    }),
    [rows]
  );

  const nextEvent = useMemo(() => {
    if (rows.length === 0) return null;
    return [...rows]
      .sort((a, b) => new Date(a.event?.date || 0).getTime() - new Date(b.event?.date || 0).getTime())
      .find((row) => new Date(row.event?.date || 0).getTime() >= Date.now()) || rows[0];
  }, [rows]);

  return (
    <div>
      <PublicNav />
      <section className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-8">My Dashboard</h1>
        {error ? <div className="mb-6 bg-error-container text-on-error-container px-4 py-3 rounded-lg">{error}</div> : null}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm"><p className="text-on-surface-variant text-sm">Total Registrations</p><p className="text-3xl font-bold">{stats.registered}</p></div>
          <div className="bg-white p-6 rounded-xl shadow-sm"><p className="text-on-surface-variant text-sm">Checked In</p><p className="text-3xl font-bold">{stats.checkedIn}</p></div>
          <div className="bg-white p-6 rounded-xl shadow-sm"><p className="text-on-surface-variant text-sm">Pending</p><p className="text-3xl font-bold">{stats.pending}</p></div>
        </div>

        {nextEvent ? (
          <div className="mb-6 bg-surface-container-low rounded-xl p-5">
            <p className="text-xs uppercase tracking-widest font-bold text-on-surface-variant mb-1">Next Event</p>
            <p className="font-bold">{nextEvent.event?.title || "Upcoming event"}</p>
            <p className="text-sm text-on-surface-variant">{nextEvent.event?.date ? new Date(nextEvent.event.date).toDateString() : "Date TBD"} • {nextEvent.event?.venue || "Venue TBD"}</p>
          </div>
        ) : null}

        <div className="space-y-4">
          {loading ? <div className="bg-white rounded-xl p-6">Loading your tickets...</div> : null}
          {!loading && rows.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center">
              <h2 className="text-xl font-bold mb-2">No registrations yet</h2>
              <p className="text-on-surface-variant mb-5">Browse events and register to generate your first QR ticket.</p>
              <Link className="premium-gradient text-white px-6 py-3 rounded-full font-semibold" to="/events">
                Explore Events
              </Link>
            </div>
          ) : null}
          {rows.map((item) => (
            <div className="bg-white rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4" key={item.id}>
              <div>
                <h2 className="text-xl font-bold">{item.event?.title || "Untitled Event"}</h2>
                <p className="text-on-surface-variant text-sm">{item.event?.date ? new Date(item.event.date).toDateString() : "Date TBD"} • {item.event?.venue || "Venue TBD"}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <p className="text-xs uppercase tracking-wider text-primary">Ticket: {item.ticket_code || "Pending"}</p>
                  <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-full font-bold ${item.attendance_status === "checked_in" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                    {item.attendance_status === "checked_in" ? "Checked In" : "Pending"}
                  </span>
                </div>
              </div>
              <Link className="premium-gradient text-white px-6 py-3 rounded-full font-semibold text-center" to={`/ticket/${item.id}`}>
                View QR
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
