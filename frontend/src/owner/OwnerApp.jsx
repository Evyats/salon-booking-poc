import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Ban,
  CalendarDays,
  Check,
  Clock3,
  LogOut,
  Plus,
  RefreshCw,
  Scissors,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { availableTimes, formatDate, israelToday, nextDays } from "../demo.js";
import { ownerSupabase } from "./supabase.js";
import "./owner.css";

function slotParts(startsAt) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(startsAt));
  const value = (type) => parts.find((part) => part.type === type)?.value;
  return {
    date: `${value("year")}-${value("month")}-${value("day")}`,
    time: `${value("hour")}:${value("minute")}`,
  };
}

function Login({ onLogin, error, busy, configured }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <main className="owner-login-shell">
      <a className="owner-back-link" href="/">
        לאתר הלקוחות <ArrowLeft size={15} />
      </a>
      <section className="owner-login-card" aria-labelledby="owner-login-title">
        <div className="owner-login-mark">
          <Scissors size={30} />
        </div>
        <span className="owner-kicker">קו · כניסת צוות</span>
        <h1 id="owner-login-title">פותחים את היומן.</h1>
        <p>כניסה לבעל העסק בלבד. הלקוחות ממשיכים לקבוע תור באתר הרגיל.</p>
        {!configured
          ? (
            <p className="owner-alert" role="alert">
              חסרים משתני החיבור של Supabase בסביבת הפרונטאנד.
            </p>
          )
          : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                onLogin(email, password);
              }}
            >
              <label htmlFor="owner-email">אימייל</label>
              <input
                id="owner-email"
                type="email"
                dir="ltr"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <label htmlFor="owner-password">סיסמה</label>
              <input
                id="owner-password"
                type="password"
                dir="ltr"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              {error && (
                <p className="owner-alert" role="alert">
                  {error}
                </p>
              )}
              <button className="button button-primary" disabled={busy}>
                {busy ? "נכנסים..." : "כניסה ליומן"}
                <ArrowLeft size={17} />
              </button>
            </form>
          )}
        <div className="owner-login-security">
          <ShieldCheck size={15} />
          הסיסמה נשלחת ישירות ל-Supabase Auth ואינה נשמרת באתר.
        </div>
      </section>
    </main>
  );
}

function ManualBooking({ appointments, onClose, onCreated }) {
  const today = israelToday();
  const dates = nextDays(today, 28);
  const booked = useMemo(
    () =>
      new Set(
        appointments
          .filter((appointment) => appointment.status === "confirmed")
          .map((appointment) => {
            const slot = slotParts(appointment.starts_at);
            return `${slot.date}T${slot.time}`;
          }),
      ),
    [appointments],
  );
  const firstDate = dates.find(
    (date) => availableTimes(date, null, booked).length,
  );
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState(firstDate ?? today);
  const [time, setTime] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const times = availableTimes(date, null, booked);

  async function submit(event) {
    event.preventDefault();
    if (name.trim().length < 2 || !time) {
      setError("יש להזין שם ולבחור שעה פנויה.");
      return;
    }

    setBusy(true);
    setError("");
    const { error: createError } = await ownerSupabase.rpc(
      "create_owner_booking",
      {
        p_full_name: name.trim(),
        p_phone: phone,
        p_booking_date: date,
        p_booking_time: time,
      },
    );

    if (createError) {
      setError(
        createError.code === "23505"
          ? "השעה נתפסה לפני שהספקת לשמור. יש לבחור שעה אחרת."
          : createError.message === "INVALID_PHONE"
          ? "יש להזין מספר נייד ישראלי תקין."
          : "לא הצלחנו להוסיף את התור. כדאי לבדוק את הפרטים ולנסות שוב.",
      );
      setBusy(false);
      return;
    }

    await onCreated();
    onClose();
  }

  return (
    <section className="owner-manual-card" aria-labelledby="manual-title">
      <div className="owner-section-heading">
        <div>
          <span>תור ידני</span>
          <h2 id="manual-title">מי נכנס לכיסא?</h2>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="סגירה">
          <X size={19} />
        </button>
      </div>
      <form onSubmit={submit}>
        <div className="owner-field-row">
          <label>
            שם הלקוח
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={100}
              required
            />
          </label>
          <label>
            מספר טלפון
            <input
              type="tel"
              dir="ltr"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="050-1234567"
              required
            />
          </label>
        </div>
        <label>
          יום
          <select
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              setTime("");
            }}
          >
            {dates.map((value) => (
              <option
                key={value}
                value={value}
                disabled={!availableTimes(value, null, booked).length}
              >
                {formatDate(value)}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="owner-time-fieldset">
          <legend>שעה פנויה</legend>
          <div className="owner-time-grid">
            {times.map((value) => (
              <button
                type="button"
                key={value}
                className={time === value ? "selected" : ""}
                aria-pressed={time === value}
                onClick={() => setTime(value)}
              >
                <bdi>{value}</bdi>
              </button>
            ))}
          </div>
        </fieldset>
        {error && (
          <p className="owner-alert" role="alert">
            {error}
          </p>
        )}
        <button className="button button-primary" disabled={busy || !time}>
          {busy ? "שומרים..." : "הוספת התור"}
          <Check size={17} />
        </button>
      </form>
    </section>
  );
}

function AppointmentCard({ appointment, onCancel, onBlock }) {
  const slot = slotParts(appointment.starts_at);
  const customer = appointment.customer;
  const cancelled = appointment.status === "cancelled";

  return (
    <article className={`owner-appointment ${cancelled ? "cancelled" : ""}`}>
      <time dateTime={appointment.starts_at}>
        <bdi>{slot.time}</bdi>
      </time>
      <div className="owner-appointment-main">
        <div className="owner-customer-line">
          <h3>{customer.full_name}</h3>
          {appointment.created_by === "owner" && <span>נוסף ידנית</span>}
          {customer.is_blocked && <span className="blocked">חסום</span>}
          {cancelled && <span className="cancelled-badge">בוטל</span>}
        </div>
        <a href={`tel:${customer.phone_e164}`} dir="ltr">
          {customer.phone_e164}
        </a>
        <p>תספורת גברים · 30 דקות · ₪90</p>
      </div>
      <div className="owner-appointment-actions">
        <button
          onClick={() =>
            onBlock(customer)}
        >
          <Ban size={15} />
          {customer.is_blocked ? "ביטול חסימה" : "חסימת לקוח"}
        </button>
        {!cancelled && (
          <button
            className="danger"
            onClick={() => onCancel(appointment)}
          >
            <X size={15} /> ביטול תור
          </button>
        )}
      </div>
    </article>
  );
}

export default function OwnerApp() {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [blockedCount, setBlockedCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState("today");
  const [manualOpen, setManualOpen] = useState(false);
  const today = israelToday();

  useEffect(() => {
    document.title = "יומן הבעלים — קו";
    if (!ownerSupabase) {
      setAuthReady(true);
      return;
    }

    ownerSupabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: listener } = ownerSupabase.auth.onAuthStateChange(
      (_event, nextSession) => setSession(nextSession),
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError("");
    const [appointmentsResult, blockedResult] = await Promise.all([
      ownerSupabase
        .from("appointments")
        .select(
          "id, starts_at, status, created_by, customer:customers(id, full_name, phone_e164, is_blocked)",
        )
        .gte("starts_at", `${today}T00:00:00.000Z`)
        .order("starts_at", { ascending: true }),
      ownerSupabase
        .from("customers")
        .select("id", { count: "exact", head: true })
        .eq("is_blocked", true),
    ]);

    if (appointmentsResult.error || blockedResult.error) {
      setError("לא הצלחנו לטעון את היומן. כדאי לרענן ולנסות שוב.");
    } else {
      setAppointments(appointmentsResult.data ?? []);
      setBlockedCount(blockedResult.count ?? 0);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (!session) return;
    const role = session.user.app_metadata?.role;
    if (role !== "owner") {
      setAuthError("למשתמש הזה אין הרשאת בעלים.");
      ownerSupabase.auth.signOut();
      return;
    }

    ownerSupabase.functions.invoke("owner-health").then(
      ({ error: healthError }) => {
        if (healthError) {
          setAuthError("לא הצלחנו לאמת את הרשאת הבעלים.");
          ownerSupabase.auth.signOut();
        } else {
          loadDashboard();
        }
      },
    );
  }, [session]);

  async function login(email, password) {
    setAuthBusy(true);
    setAuthError("");
    const { error: loginError } = await ownerSupabase.auth.signInWithPassword({
      email,
      password,
    });
    if (loginError) setAuthError("האימייל או הסיסמה אינם נכונים.");
    setAuthBusy(false);
  }

  async function cancelAppointment(appointment) {
    if (!window.confirm("לבטל את התור? השעה תחזור להיות פנויה.")) return;
    const { error: cancelError } = await ownerSupabase
      .from("appointments")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", appointment.id)
      .eq("status", "confirmed")
      .select("id")
      .single();
    if (cancelError) setError("לא הצלחנו לבטל את התור.");
    else await loadDashboard();
  }

  async function toggleBlocked(customer) {
    const { error: blockError } = await ownerSupabase
      .from("customers")
      .update({ is_blocked: !customer.is_blocked })
      .eq("id", customer.id)
      .select("id")
      .single();
    if (blockError) setError("לא הצלחנו לעדכן את סטטוס הלקוח.");
    else await loadDashboard();
  }

  if (!authReady) {
    return <div className="owner-loading">טוענים את היומן...</div>;
  }

  if (!session) {
    return (
      <Login
        onLogin={login}
        error={authError}
        busy={authBusy}
        configured={Boolean(ownerSupabase)}
      />
    );
  }

  const visibleAppointments = appointments.filter((appointment) => {
    const date = slotParts(appointment.starts_at).date;
    return view === "today" ? date === today : date > today;
  });
  const todayConfirmed = appointments.filter(
    (appointment) =>
      appointment.status === "confirmed" &&
      slotParts(appointment.starts_at).date === today,
  ).length;
  const upcomingConfirmed = appointments.filter(
    (appointment) =>
      appointment.status === "confirmed" &&
      slotParts(appointment.starts_at).date > today,
  ).length;
  const groups = visibleAppointments.reduce((result, appointment) => {
    const date = slotParts(appointment.starts_at).date;
    if (!result[date]) result[date] = [];
    result[date].push(appointment);
    return result;
  }, {});

  return (
    <main className="owner-shell">
      <header className="owner-header">
        <a className="owner-brand" href="/">
          <Scissors size={23} /> <strong>קו.</strong> <span>יומן הבעלים</span>
        </a>
        <div>
          <span>{session.user.email}</span>
          <button
            className="icon-button"
            aria-label="יציאה"
            onClick={() => ownerSupabase.auth.signOut()}
          >
            <LogOut size={17} />
          </button>
        </div>
      </header>

      <div className="owner-page">
        <section className="owner-hero">
          <div>
            <span className="owner-kicker">
              יום עבודה · {formatDate(today)}
            </span>
            <h1>הכיסא מוכן.</h1>
            <p>כל התורים, האנשים והשינויים במקום אחד.</p>
          </div>
          <button
            className="button button-primary"
            onClick={() => setManualOpen(true)}
          >
            <Plus size={18} /> הוספת תור ידני
          </button>
        </section>

        <section className="owner-stats" aria-label="סיכום היומן">
          <div>
            <CalendarDays size={19} />
            <strong>{todayConfirmed}</strong>
            <span>תורים היום</span>
          </div>
          <div>
            <Clock3 size={19} />
            <strong>{upcomingConfirmed}</strong>
            <span>תורים קרובים</span>
          </div>
          <div>
            <UserRound size={19} />
            <strong>{blockedCount}</strong>
            <span>לקוחות חסומים</span>
          </div>
        </section>

        {manualOpen && (
          <ManualBooking
            appointments={appointments}
            onClose={() => setManualOpen(false)}
            onCreated={loadDashboard}
          />
        )}

        <section className="owner-schedule" aria-labelledby="schedule-title">
          <div className="owner-section-heading">
            <div>
              <span>סדר היום</span>
              <h2 id="schedule-title">מי מגיע ומתי</h2>
            </div>
            <button
              className="icon-button"
              aria-label="רענון"
              onClick={loadDashboard}
              disabled={loading}
            >
              <RefreshCw size={17} />
            </button>
          </div>
          <div className="owner-view-tabs">
            <button
              className={view === "today" ? "active" : ""}
              onClick={() => setView("today")}
            >
              היום <span>{todayConfirmed}</span>
            </button>
            <button
              className={view === "upcoming" ? "active" : ""}
              onClick={() => setView("upcoming")}
            >
              בהמשך <span>{upcomingConfirmed}</span>
            </button>
          </div>

          {error && (
            <p className="owner-alert" role="alert">
              {error}
            </p>
          )}
          {loading
            ? <div className="owner-empty">טוענים את התורים...</div>
            : visibleAppointments.length === 0
            ? (
              <div className="owner-empty">
                <Scissors size={28} />
                <h3>
                  {view === "today" ? "היום עדיין פתוח." : "אין תורים בהמשך."}
                </h3>
                <p>אפשר להוסיף תור ידני או לחכות להזמנה הבאה מהאתר.</p>
              </div>
            )
            : (
              <div className="owner-day-groups">
                {Object.entries(groups).map(([date, entries]) => (
                  <section className="owner-day" key={date}>
                    <header>
                      <strong>{formatDate(date)}</strong>
                      <span>{entries.length} תורים</span>
                    </header>
                    <div className="owner-timeline">
                      {entries.map((appointment) => (
                        <AppointmentCard
                          key={appointment.id}
                          appointment={appointment}
                          onCancel={cancelAppointment}
                          onBlock={toggleBlocked}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
        </section>
      </div>
    </main>
  );
}
