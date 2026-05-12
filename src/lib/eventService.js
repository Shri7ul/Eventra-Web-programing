import { hasSupabase, supabase } from "./supabase";
import { seedEvents } from "./demoData";

const EVENTS_KEY = "eventra-events";
const REG_KEY = "eventra-registrations";
const ATTENDANCE_KEY = "eventra-attendance";

function getLocalEvents() {
  const raw = localStorage.getItem(EVENTS_KEY);
  if (!raw) {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(seedEvents));
    return seedEvents;
  }
  return JSON.parse(raw);
}

function getLocalRegistrations() {
  const raw = localStorage.getItem(REG_KEY);
  if (!raw) {
    localStorage.setItem(REG_KEY, JSON.stringify([]));
    return [];
  }
  return JSON.parse(raw);
}

function setLocalRegistrations(next) {
  localStorage.setItem(REG_KEY, JSON.stringify(next));
}

function getLocalAttendance() {
  const raw = localStorage.getItem(ATTENDANCE_KEY);
  if (!raw) {
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify([]));
    return [];
  }
  return JSON.parse(raw);
}

function setLocalAttendance(next) {
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(next));
}

function getLocalOnlyEvents() {
  return getLocalEvents().filter((event) => event?.__localOnly === true);
}

function toFriendlyError(error, fallbackMessage) {
  if (!error) return fallbackMessage;
  if (error.code === "23505") return "You are already registered for this event.";
  if (error.code === "42501") return "You are not allowed to perform this action.";
  return error.message || fallbackMessage;
}

function withTimeout(promise, timeoutMs, timeoutMessage) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    })
  ]);
}

function isTimeoutOrNetworkError(error) {
  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("timed out") ||
    message.includes("network") ||
    message.includes("failed to fetch") ||
    message.includes("fetch")
  );
}

export async function listAdminEvents() {
  if (!hasSupabase) return getLocalEvents();

  // If the browser is offline, return local events immediately to avoid long loading states
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return getLocalEvents();
  }

  try {
    const { data, error } = await withTimeout(
      supabase.from("events").select("*").order("date", { ascending: true }),
      7000,
      "Loading events timed out."
    );
    if (error) throw error;

    const remote = data || [];
    const localOnly = getLocalOnlyEvents();
    return [...localOnly, ...remote];
  } catch (error) {
    if (isTimeoutOrNetworkError(error)) {
      return getLocalEvents();
    }
    throw new Error(toFriendlyError(error, "Failed to load events"));
  }
}

export async function listEvents() {
  if (!hasSupabase) return getLocalEvents().filter((event) => event.is_active !== false);

  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return getLocalEvents().filter((event) => event.is_active !== false);
  }

  try {
    const { data, error } = await withTimeout(
      supabase
        .from("events")
        .select("*")
        .eq("is_active", true)
        .order("date", { ascending: true }),
      7000,
      "Loading events timed out."
    );

    if (error) throw error;
    const remote = data || [];
    const localOnlyActive = getLocalOnlyEvents().filter((event) => event.is_active !== false);
    return [...localOnlyActive, ...remote];
  } catch (error) {
    if (isTimeoutOrNetworkError(error)) {
      return getLocalEvents().filter((event) => event.is_active !== false);
    }
    throw new Error(toFriendlyError(error, "Failed to load events"));
  }
}

export async function listBackendEvents() {
  if (!hasSupabase) return [];

  if (typeof navigator !== "undefined" && navigator.onLine === false) return [];

  try {
    const { data, error } = await withTimeout(
      supabase
        .from("events")
        .select("*")
        .eq("is_active", true)
        .order("date", { ascending: true }),
      7000,
      "Loading events timed out."
    );

    if (error) throw error;
    return data || [];
  } catch (error) {
    if (isTimeoutOrNetworkError(error)) return [];
    throw new Error(toFriendlyError(error, "Failed to load events"));
  }
}

export async function getEventById(id) {
  if (!hasSupabase) return getLocalEvents().find((item) => item.id === id) || null;

  const { data, error } = await supabase.from("events").select("*").eq("id", id).single();
  if (error) throw new Error(toFriendlyError(error, "Event not found"));
  return data;
}

export async function createEvent(payload) {
  if (!hasSupabase) {
    const next = [{ id: `evt-${Date.now()}`, ...payload }, ...getLocalEvents()];
    localStorage.setItem(EVENTS_KEY, JSON.stringify(next));
    return next[0];
  }

  const timeoutMessage = "Publishing timed out. Saved in local mode so you can continue.";

  let insertPayload = {
    ...payload,
    capacity: Number(payload.capacity),
    price: Number(payload.price),
    date: String(payload.date).slice(0, 10)
  };

  try {
    if (!insertPayload.created_by) {
      const { data: userData, error: userError } = await withTimeout(
        supabase.auth.getUser(),
        8000,
        timeoutMessage
      );

      if (userError) {
        throw userError;
      }

      if (!userData?.user?.id) {
        throw new Error("Your session is not active. Please log in again as admin.");
      }

      insertPayload = { ...insertPayload, created_by: userData.user.id };
    }

    const { data, error } = await withTimeout(
      supabase.from("events").insert(insertPayload).select("*").single(),
      20000,
      timeoutMessage
    );

    if (error) throw error;
    return data;
  } catch (error) {
    if (isTimeoutOrNetworkError(error)) {
      console.warn("createEvent: network timeout or offline — saving event locally", error);
      const localEvent = {
        id: `evt-local-${Date.now()}`,
        ...insertPayload,
        __localOnly: true,
        created_at: new Date().toISOString()
      };
      const next = [localEvent, ...getLocalEvents()];
      localStorage.setItem(EVENTS_KEY, JSON.stringify(next));
      try {
        const unsynced = JSON.parse(localStorage.getItem("eventra-unsynced") || "[]");
        unsynced.unshift(localEvent.id);
        localStorage.setItem("eventra-unsynced", JSON.stringify(unsynced));
      } catch (e) {
        // ignore localStorage failures
      }
      return localEvent;
    }
    throw new Error(toFriendlyError(error, "Failed to create event"));
  }
}

export async function updateEvent(eventId, payload) {
  if (!hasSupabase) {
    const rows = getLocalEvents();
    const idx = rows.findIndex((item) => item.id === eventId);
    if (idx === -1) throw new Error("Event not found");
    rows[idx] = { ...rows[idx], ...payload };
    localStorage.setItem(EVENTS_KEY, JSON.stringify(rows));
    return rows[idx];
  }

  const { data, error } = await supabase
    .from("events")
    .update(payload)
    .eq("id", eventId)
    .select("*")
    .single();

  if (error) throw new Error(toFriendlyError(error, "Failed to update event"));
  return data;
}

export async function deleteEvent(eventId) {
  if (!hasSupabase) {
    const nextEvents = getLocalEvents().filter((item) => item.id !== eventId);
    localStorage.setItem(EVENTS_KEY, JSON.stringify(nextEvents));
    const nextRegs = getLocalRegistrations().filter((row) => row.event_id !== eventId);
    setLocalRegistrations(nextRegs);
    return;
  }

  const { error } = await supabase.from("events").delete().eq("id", eventId);
  if (error) throw new Error(toFriendlyError(error, "Failed to delete event"));
}

async function getEventRegistrationCount(eventId) {
  if (!hasSupabase) {
    return getLocalRegistrations().filter((row) => row.event_id === eventId).length;
  }

  const { count, error } = await supabase
    .from("registrations")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId);

  if (error) throw new Error(toFriendlyError(error, "Failed to check capacity"));
  return count || 0;
}

export async function registerForEvent(eventId, user) {
  if (!hasSupabase) {
    const event = getLocalEvents().find((item) => item.id === eventId);
    if (!event) throw new Error("Event not found");

    const registrations = getLocalRegistrations();
    const existing = registrations.find((r) => r.event_id === eventId && r.user_id === user.id);
    if (existing) throw new Error("You are already registered for this event.");

    const takenSeats = registrations.filter((r) => r.event_id === eventId).length;
    if (takenSeats >= event.capacity) throw new Error("This event is full.");

    const record = {
      id: `reg-${Date.now()}`,
      user_id: user.id,
      participant_name: user.fullName || user.full_name || user.name || user.email || "Unknown",
      event_id: eventId,
      ticket_code: `EVT-${Date.now().toString().slice(-6)}`,
      attendance_status: "pending",
      created_at: new Date().toISOString()
    };
    const next = [record, ...registrations];
    setLocalRegistrations(next);

    const attendanceRows = getLocalAttendance();
    attendanceRows.unshift({
      id: `att-${Date.now()}`,
      registration_id: record.id,
      event_id: record.event_id,
      user_id: record.user_id,
      status: "pending",
      checked_in_at: null,
      created_at: new Date().toISOString()
    });
    setLocalAttendance(attendanceRows);
    return record;
  }

  const event = await getEventById(eventId);
  const currentCount = await getEventRegistrationCount(eventId);
  if (currentCount >= event.capacity) {
    throw new Error("This event is full.");
  }

  const { data, error } = await supabase
    .from("registrations")
    .insert({ event_id: eventId, user_id: user.id })
    .select("*")
    .single();

  if (error) throw new Error(toFriendlyError(error, "Failed to register for event"));

  await supabase.from("attendance").insert({
    registration_id: data.id,
    event_id: data.event_id,
    user_id: data.user_id,
    status: "pending"
  });

  return data;
}

export async function getUserRegistrations(userId) {
  if (!hasSupabase) {
    const events = getLocalEvents();
    return getLocalRegistrations()
      .filter((r) => r.user_id === userId)
      .map((r) => ({ ...r, event: events.find((e) => e.id === r.event_id) }))
      .filter((r) => r.event);
  }

  const { data, error } = await supabase
    .from("registrations")
    .select("*, event:events(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(toFriendlyError(error, "Failed to load your registrations"));
  return data || [];
}

export async function listAllRegistrations() {
  if (!hasSupabase) {
    const events = getLocalEvents();
    const attendanceRows = getLocalAttendance();
    return getLocalRegistrations().map((r) => ({
      ...r,
      event: events.find((e) => e.id === r.event_id),
      attendance: attendanceRows.find((a) => a.registration_id === r.id)
    }));
  }

  const { data, error } = await supabase
    .from("registrations")
    .select("*, event:events(*), attendance:attendance(*)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(toFriendlyError(error, "Failed to load participant list"));
  const rows = data || [];

  try {
    const userIds = Array.from(new Set(rows.map((r) => r.user_id).filter(Boolean)));
    if (userIds.length) {
      const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
      const profileMap = (profiles || []).reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {});

      return rows.map((r) => ({
        ...r,
        participant_name: r.participant_name || profileMap[r.user_id]?.full_name || "Unknown"
      }));
    }
  } catch (err) {
    // ignore profile attach errors and return rows as-is
    console.warn("listAllRegistrations: failed to load profiles", err?.message || err);
  }

  return rows;
}

export async function markAttendance(ticketCode, adminUserId = null) {
  if (!hasSupabase) {
    const rows = getLocalRegistrations();
    const idx = rows.findIndex((r) => r.ticket_code === ticketCode);
    if (idx === -1) return null;

    rows[idx] = { ...rows[idx], attendance_status: "checked_in", checked_in_at: new Date().toISOString() };
    setLocalRegistrations(rows);

    const attendanceRows = getLocalAttendance();
    const attendanceIdx = attendanceRows.findIndex((a) => a.registration_id === rows[idx].id);
    const now = new Date().toISOString();
    if (attendanceIdx === -1) {
      attendanceRows.unshift({
        id: `att-${Date.now()}`,
        registration_id: rows[idx].id,
        event_id: rows[idx].event_id,
        user_id: rows[idx].user_id,
        status: "present",
        checked_in_at: now,
        checked_in_by: adminUserId
      });
    } else {
      attendanceRows[attendanceIdx] = {
        ...attendanceRows[attendanceIdx],
        status: "present",
        checked_in_at: now,
        checked_in_by: adminUserId
      };
    }
    setLocalAttendance(attendanceRows);

    return rows[idx];
  }

  const { data: row, error: findError } = await supabase
    .from("registrations")
    .select("*")
    .eq("ticket_code", ticketCode)
    .single();
  if (findError) throw findError;

  const { data, error } = await supabase
    .from("registrations")
    .update({ attendance_status: "checked_in", checked_in_at: new Date().toISOString() })
    .eq("id", row.id)
    .select("*")
    .single();

  if (error) throw new Error(toFriendlyError(error, "Failed to mark attendance"));

  await supabase
    .from("attendance")
    .upsert(
      {
        registration_id: data.id,
        event_id: data.event_id,
        user_id: data.user_id,
        status: "present",
        checked_in_at: new Date().toISOString(),
        checked_in_by: adminUserId
      },
      { onConflict: "registration_id" }
    );

  return data;
}
