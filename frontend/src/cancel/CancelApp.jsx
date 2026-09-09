import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock3,
  MapPin,
  Scissors,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import {
  ApiError,
  cancelCustomerAppointment,
  getCancellationDetails,
} from "../api.js";
import "./cancel.css";

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

function takeTokenFromUrl() {
  const hashToken = window.location.hash.slice(1);
  const rememberedToken = window.history.state?.cancellationToken ?? "";
  const token = hashToken || rememberedToken;

  if (hashToken) {
    const oldState = window.history.state;
    const state = oldState && typeof oldState === "object" ? oldState : {};
    const nextState = TOKEN_PATTERN.test(hashToken)
      ? { ...state, cancellationToken: hashToken }
      : state;

    window.history.replaceState(
      nextState,
      "",
      `${window.location.pathname}${window.location.search}`,
    );
  }

  return TOKEN_PATTERN.test(token) ? token : "";
}

function appointmentParts(startsAt) {
  const date = new Date(startsAt);
  return {
    date: new Intl.DateTimeFormat("he-IL", {
      timeZone: "Asia/Jerusalem",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date),
    time: new Intl.DateTimeFormat("he-IL", {
      timeZone: "Asia/Jerusalem",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date),
  };
}

function friendlyError(error) {
  if (error instanceof ApiError && error.status === 404) {
    return "הקישור לא תקין או שכבר אינו זמין.";
  }
  if (error instanceof ApiError && error.status === 0) {
    return "לא הצלחנו להתחבר. כדאי לבדוק את החיבור ולנסות שוב.";
  }
  return "לא הצלחנו לטעון את פרטי התור. אפשר לנסות שוב בעוד רגע.";
}

function Brand() {
  return (
    <a className="cancel-brand" href="/" aria-label="קו — לעמוד הראשי">
      <span className="cancel-brand-mark">
        <Scissors size={25} strokeWidth={1.6} />
      </span>
      <span className="cancel-brand-name">קו<span>.</span></span>
      <span className="cancel-brand-copy">
        ברברשופ שכונתי
        <small lang="en" dir="ltr">GOOD HAIR. GOOD DAY.</small>
      </span>
    </a>
  );
}

export default function CancelApp() {
  const [token] = useState(takeTokenFromUrl);
  const [appointment, setAppointment] = useState(null);
  const [state, setState] = useState(token ? "loading" : "error");
  const [error, setError] = useState(
    token ? "" : "חסר בקישור קוד ביטול תקין.",
  );
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    document.title = "ביטול תור — קו";
    if (!token) return;

    let active = true;
    getCancellationDetails(token)
      .then(({ appointment: value }) => {
        if (!active) return;
        setAppointment(value);
        setState(value.status === "cancelled" ? "cancelled" : "ready");
      })
      .catch((loadError) => {
        if (!active) return;
        setError(friendlyError(loadError));
        setState("error");
      });

    return () => {
      active = false;
    };
  }, [token]);

  async function cancel() {
    setState("cancelling");
    setError("");
    try {
      const { appointment: cancelled } = await cancelCustomerAppointment(token);
      setAppointment((current) => ({ ...current, ...cancelled }));
      setConfirming(false);
      setState("cancelled");
    } catch (cancelError) {
      setError(friendlyError(cancelError));
      setState("ready");
    }
  }

  const parts = appointment ? appointmentParts(appointment.startsAt) : null;

  return (
    <main className="cancel-page" dir="rtl">
      <header className="cancel-header">
        <Brand />
        <a className="cancel-home-link" href="/">
          לאתר
          <ArrowLeft size={16} />
        </a>
      </header>

      <section className="cancel-card" aria-live="polite">
        <div className="cancel-card-topline">
          <span>ניהול תור</span>
          <span aria-hidden="true">KAV / 01</span>
        </div>

        {state === "loading" && (
          <div className="cancel-centered">
            <span className="cancel-loader" aria-hidden="true" />
            <h1>רק רגע</h1>
            <p>טוענים את פרטי התור שלך.</p>
          </div>
        )}

        {state === "error" && (
          <div className="cancel-centered">
            <span className="cancel-status-icon cancel-status-error">
              <span aria-hidden="true">!</span>
            </span>
            <p className="cancel-eyebrow">לא הצלחנו לפתוח את הקישור</p>
            <h1>אין כאן תור לניהול</h1>
            <p>{error}</p>
            <a className="button button-primary cancel-main-action" href="/#booking">
              בחירת תור חדש
              <ArrowLeft size={18} />
            </a>
          </div>
        )}

        {(state === "ready" || state === "cancelling") && appointment && (
          <>
            <p className="cancel-eyebrow">היי {appointment.name}</p>
            <h1>רוצה לבטל את התור?</h1>
            <p className="cancel-lead">
              לפני שמבטלים, הנה הפרטים כדי לוודא שזה התור הנכון.
            </p>

            <div className="cancel-ticket">
              <div className="cancel-service">
                <Scissors size={19} />
                <div>
                  <strong>תספורת גברים</strong>
                  <span>עם איתי · 30 דקות</span>
                </div>
              </div>
              <div>
                <CalendarDays size={18} />
                <span>{parts.date}</span>
              </div>
              <div>
                <Clock3 size={18} />
                <strong><bdi>{parts.time}</bdi></strong>
              </div>
              <div>
                <MapPin size={18} />
                <span>פלורנטין 18, תל אביב</span>
              </div>
            </div>

            {error && <p className="cancel-error">{error}</p>}

            {!confirming ? (
              <button
                className="button cancel-outline-action"
                onClick={() => setConfirming(true)}
              >
                <Trash2 size={17} />
                ביטול התור
              </button>
            ) : (
              <div className="cancel-confirm-box">
                <strong>לבטל סופית?</strong>
                <p>השעה תחזור להיות פנויה ולא נוכל לשחזר את התור.</p>
                <button
                  className="button cancel-danger-action"
                  disabled={state === "cancelling"}
                  onClick={cancel}
                >
                  {state === "cancelling" ? "מבטלים..." : "כן, לבטל את התור"}
                </button>
                <button
                  className="text-button cancel-keep-action"
                  disabled={state === "cancelling"}
                  onClick={() => setConfirming(false)}
                >
                  לא, להשאיר את התור
                </button>
              </div>
            )}
          </>
        )}

        {state === "cancelled" && appointment && (
          <div className="cancel-centered">
            <span className="cancel-status-icon cancel-status-success">
              <Check size={27} strokeWidth={2.2} />
            </span>
            <p className="cancel-eyebrow">הביטול נקלט</p>
            <h1>התור בוטל</h1>
            <p>
              התור ל{parts.date} בשעה <bdi>{parts.time}</bdi> בוטל, והשעה חזרה להיות פנויה.
            </p>
            <a className="button button-primary cancel-main-action" href="/#booking">
              בחירת תור חדש
              <ArrowLeft size={18} />
            </a>
          </div>
        )}

        <footer className="cancel-card-footer">
          <ShieldCheck size={15} />
          הקישור מאפשר לנהל רק את התור הזה
        </footer>
      </section>

      <p className="cancel-page-note">קו ברברשופ · פלורנטין 18, תל אביב</p>
    </main>
  );
}
