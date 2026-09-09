import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Coffee,
  Download,
  MapPin,
  MessageCircle,
  Moon,
  Scissors,
  ShieldCheck,
  Sun,
  Sunset,
  X,
} from "lucide-react";
import {
  ApiError,
  createBooking,
  getBookedSlots,
  requestBookingOtp,
  verifyBookingOtp,
} from "./api.js";
import {
  asDate,
  availableTimes,
  downloadCalendar,
  formatDate,
  israelToday,
  nextDays,
} from "./demo.js";

const periods = [
  { id: "all", label: "הכול" },
  { id: "morning", label: "בוקר", Icon: Sun },
  { id: "afternoon", label: "צהריים", Icon: Sunset },
  { id: "evening", label: "ערב", Icon: Moon },
];

export function Booking({ appointment, onBook, availabilityVersion = 0 }) {
  const today = israelToday();
  const [bookedSlots, setBookedSlots] = useState(new Set());
  const [availabilityError, setAvailabilityError] = useState(false);
  const initialDate = nextDays(today, 14).find(
    (date) => availableTimes(date, appointment, bookedSlots).length,
  ) || today;
  const [date, setDate] = useState(initialDate);
  const [week, setWeek] = useState(0);
  const [period, setPeriod] = useState("all");
  const [time, setTime] = useState("");
  const days = nextDays(today, 28).slice(week * 7, week * 7 + 7);
  const timesForDate = (value) =>
    availableTimes(value, appointment, bookedSlots);
  const allTimes = timesForDate(date);
  const times = allTimes.filter(
    (value) =>
      period === "all" ||
      (period === "morning"
        ? value < "12:00"
        : period === "afternoon"
        ? value >= "12:00" && value < "17:00"
        : value >= "17:00"),
  );
  const validSelection = time && allTimes.includes(time);

  useEffect(() => {
    let active = true;
    setAvailabilityError(false);

    getBookedSlots(today, 28)
      .then((slots) => {
        if (!active) return;
        setBookedSlots(
          new Set(slots.map((slot) => `${slot.date}T${slot.time}`)),
        );
      })
      .catch(() => {
        if (active) setAvailabilityError(true);
      });

    return () => {
      active = false;
    };
  }, [today, availabilityVersion]);

  useEffect(() => {
    if (time && !allTimes.includes(time)) setTime("");
  }, [allTimes, time]);

  function changeDate(value) {
    setDate(value);
    setTime("");
    setPeriod("all");
  }
  function changeWeek(delta) {
    const next = week + delta;
    setWeek(next);
    const values = nextDays(today, 28).slice(next * 7, next * 7 + 7);
    changeDate(
      values.find((value) => timesForDate(value).length) || values[0],
    );
  }

  return (
    <section
      id="booking"
      className="booking-section section-anchor"
      aria-labelledby="booking-title"
    >
      <div className="section-heading">
        <div>
          <span className="eyebrow">ניפגש בכיסא</span>
          <h2 id="booking-title">חצי שעה. רק בשבילך.</h2>
        </div>
        <p>בוחרים זמן שמתאים, ואנחנו כבר נדאג לשאר.</p>
      </div>
      <div className="booking-card">
        <aside className="service-panel">
          <div className="service-top">
            <span className="small-label">התור שלך בקו</span>
            <Scissors size={26} strokeWidth={1.3} />
          </div>
          <h3>תספורת גברים</h3>
          <p className="service-description">
            קווים נקיים, פיניש מדויק.
            <br />
            תספורת שמתאימה לך.
          </p>
          <div className="service-meta">
            <span>
              <Clock3 size={16} />
              30 דקות
            </span>
            <strong>
              <bdi>₪90</bdi>
            </strong>
          </div>
          <div className="barber-mini">
            <img
              src="/images/barber.jpg"
              alt="דיוקן אווירה של ספר"
              loading="lazy"
            />
            <div>
              <strong>איתי כהן</strong>
              <span>הספר שלך, מההתחלה ועד הפיניש</span>
            </div>
            <CheckCheck size={19} />
          </div>
          <div className="service-perks">
            <span>
              <Coffee size={17} />
              הקפה עלינו
            </span>
            <span>
              <Check size={17} />
              התשלום במספרה
            </span>
          </div>
          <span
            className="service-wordmark"
            aria-hidden="true"
            role="presentation"
          />
        </aside>
        <div className="slot-panel">
          <div className="picker-heading">
            <h3>
              <span className="step-number">1</span>איזה יום נוח לך?
            </h3>
            <div className="week-controls">
              <button
                className="icon-button"
                onClick={() => changeWeek(-1)}
                disabled={week === 0}
                aria-label="לשבוע הקודם"
              >
                <ChevronRight size={18} />
              </button>
              <span>
                {formatDate(days[0], { month: "long", year: "numeric" })}
              </span>
              <button
                className="icon-button"
                onClick={() => changeWeek(1)}
                disabled={week === 3}
                aria-label="לשבוע הבא"
              >
                <ChevronLeft size={18} />
              </button>
            </div>
          </div>
          <div className="days-grid" role="group" aria-label="בחירת יום">
            {days.map((value) => {
              const closed = !timesForDate(value).length;
              return (
                <button
                  key={value}
                  disabled={closed}
                  aria-pressed={date === value}
                  aria-label={formatDate(value)}
                  className={`day-button ${date === value ? "selected" : ""}`}
                  onClick={() => changeDate(value)}
                >
                  <span>
                    {value === today
                      ? "היום"
                      : formatDate(value, { weekday: "short" })}
                  </span>
                  <strong>{asDate(value).getDate()}</strong>
                  <span className="day-dot">
                    {closed
                      ? (
                        asDate(value).getDay() === 6
                          ? (
                            "סגור"
                          )
                          : (
                            "מלא"
                          )
                      )
                      : <i />}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="picker-heading time-heading">
            <h3>
              <span className="step-number">2</span>ובאיזו שעה?
            </h3>
            <span className="available-count">
              {allTimes.length} שעות פנויות
            </span>
          </div>
          <div className="period-tabs" role="group" aria-label="חלק ביום">
            {periods.map(({ id, label, Icon }) => (
              <button
                key={id}
                aria-pressed={period === id}
                className={period === id ? "active" : ""}
                onClick={() => {
                  setPeriod(id);
                  setTime("");
                }}
              >
                {Icon && <Icon size={15} />} {label}
              </button>
            ))}
          </div>
          <div className="time-grid" role="group" aria-label="בחירת שעה">
            {times.map((value) => (
              <button
                key={value}
                className={`time-button ${time === value ? "selected" : ""}`}
                aria-pressed={time === value}
                onClick={() => setTime(value)}
              >
                <bdi>{value}</bdi>
                {time === value && <Check size={14} />}
              </button>
            ))}
            {!times.length && (
              <p className="empty-times">
                אין שעות פנויות בחלק הזה של היום. אפשר לבחור יום אחר או להציג את
                כל השעות.
              </p>
            )}
          </div>
          <div className="booking-bottom">
            <div className="selection-summary" aria-live="polite">
              <CalendarDays size={20} />
              <div>
                <strong>
                  {formatDate(date, {
                    weekday: "short",
                    day: "numeric",
                    month: "long",
                  })}
                  {validSelection && (
                    <>
                      {" "}
                      · <bdi>{time}</bdi>
                    </>
                  )}
                </strong>
                <span>
                  {validSelection
                    ? "תספורת גברים · 30 דקות · ₪90"
                    : "רק לבחור שעה, ואפשר להמשיך"}
                </span>
              </div>
            </div>
            <button
              className="button button-primary"
              disabled={!validSelection}
              onClick={() => onBook({ date, time })}
            >
              ממשיכים לפרטים
              <ArrowLeft size={18} />
            </button>
          </div>
          <p className="booking-note">
            <ShieldCheck size={13} />
            {availabilityError
              ? "לא הצלחנו לרענן זמינות כרגע. האימות הסופי יתבצע בקביעת התור."
              : "בלי תשלום מראש. בלי הרשמה מסובכת."}
          </p>
        </div>
      </div>
    </section>
  );
}

export function BookingDialog({
  modal,
  onClose,
  appointment,
  onConfirm,
  onAvailabilityChanged,
}) {
  const dialog = useRef(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [step, setStep] = useState(modal.kind);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState(false);
  const slot = modal.slot || appointment;
  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const element = dialog.current;
    function containFocus(event) {
      if (event.key !== "Tab") return;
      const controls = [
        ...element.querySelectorAll(
          "button:not(:disabled), input:not(:disabled), a[href]",
        ),
      ];
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    element.showModal();
    document.body.style.overflow = "hidden";
    element.addEventListener("keydown", containFocus);
    return () => {
      element.removeEventListener("keydown", containFocus);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, []);
  useEffect(() => {
    if (cooldown === 0) return;
    const id = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);
  async function details(event) {
    event.preventDefault();
    if (name.trim().length < 2) {
      setError("איך קוראים לך? יש להזין לפחות שני תווים.");
      return;
    }
    if (!/^(?:05\d{8}|\+9725\d{8})$/.test(phone.replace(/[\s-]/g, ""))) {
      setError("יש להזין מספר נייד תקין, למשל 050-1234567.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const challenge = await requestBookingOtp(phone);
      setChallengeId(challenge.challengeId);
      setStep("otp");
      setCooldown(challenge.resendAfterSeconds ?? 60);
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 429) {
        setCooldown(requestError.details.retryAfterSeconds ?? 60);
        setError("ביקשת קוד לאחרונה. כדאי להמתין מעט ולנסות שוב.");
      } else if (
        requestError instanceof ApiError && requestError.status === 0
      ) {
        setError("לא הצלחנו להתחבר לשירות. כדאי לבדוק את החיבור ולנסות שוב.");
      } else {
        setError("לא הצלחנו ליצור קוד אימות כרגע. כדאי לנסות שוב.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function verify(event) {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError("יש להזין את כל שש הספרות של הקוד.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      await verifyBookingOtp(challengeId, code);
      const result = await createBooking({
        challengeId,
        fullName: name,
        date: slot.date,
        time: slot.time,
      });
      onConfirm(result.appointment);
      setStep("success");
    } catch (verificationError) {
      if (
        verificationError instanceof ApiError &&
        typeof verificationError.details.attemptsRemaining === "number"
      ) {
        setError(
          `הקוד לא מתאים. נותרו ${verificationError.details.attemptsRemaining} ניסיונות.`,
        );
      } else if (
        verificationError instanceof ApiError &&
        verificationError.status === 409
      ) {
        setError("השעה כבר נתפסה. יש לסגור ולבחור שעה אחרת.");
        onAvailabilityChanged();
      } else if (
        verificationError instanceof ApiError &&
        verificationError.status === 410
      ) {
        setError("תוקף הקוד פג. אפשר לבקש קוד חדש.");
      } else if (
        verificationError instanceof ApiError &&
        verificationError.status === 429
      ) {
        setError("בוצעו יותר מדי ניסיונות. יש לבקש קוד חדש מאוחר יותר.");
      } else if (
        verificationError instanceof ApiError &&
        verificationError.status === 0
      ) {
        setError("לא הצלחנו להתחבר לשירות. כדאי לבדוק את החיבור ולנסות שוב.");
      } else {
        setError("לא הצלחנו להשלים את קביעת התור כרגע. כדאי לנסות שוב.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setBusy(true);
    setError("");
    setCode("");
    try {
      const challenge = await requestBookingOtp(phone);
      setChallengeId(challenge.challengeId);
      setCooldown(challenge.resendAfterSeconds ?? 60);
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 429) {
        setCooldown(requestError.details.retryAfterSeconds ?? 60);
        setError("עדיין מוקדם לשלוח קוד נוסף. כדאי להמתין מעט.");
      } else {
        setError("לא הצלחנו ליצור קוד נוסף כרגע. כדאי לנסות שוב.");
      }
    } finally {
      setBusy(false);
    }
  }

  const title = step === "details"
    ? "נעים להכיר."
    : step === "otp"
    ? "רק לוודא שזה אתה."
    : step === "success"
    ? "סגור, יש לך תור."
    : appointment
    ? "התור שלך בקו."
    : "הכיסא עוד מחכה לך.";

  return (
    <dialog
      ref={dialog}
      className="booking-dialog"
      aria-labelledby="dialog-title"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === dialog.current) {
          const rect = dialog.current.getBoundingClientRect();
          if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
          ) {
            onClose();
          }
        }
      }}
    >
      <button
        className="icon-button dialog-close"
        aria-label="סגירה"
        onClick={onClose}
      >
        <X size={21} />
      </button>
      <span className="eyebrow">
        {step === "details"
          ? "עוד רגע נפגשים"
          : step === "otp"
          ? "אימות מספר הטלפון"
          : "קו · ברברשופ שכונתי"}
      </span>
      {step === "success" && (
        <div className="success-mark">
          <Check size={28} />
        </div>
      )}
      <h2 id="dialog-title">{title}</h2>
      <p className="demo-notice">
        מצב פיתוח · הקוד מופיע בלוג המאובטח של Supabase עד ש-WhatsApp יחובר.
      </p>
      {(step === "details" || step === "otp") && (
        <div className="modal-slot">
          <Scissors size={20} />
          <div>
            <strong>תספורת עם איתי</strong>
            <span>
              {formatDate(slot.date)} · <bdi>{slot.time}</bdi> · <bdi>₪90</bdi>
            </span>
          </div>
        </div>
      )}
      {step === "details" && (
        <form onSubmit={details} noValidate>
          <label htmlFor="customer-name">איך קוראים לך?</label>
          <input
            id="customer-name"
            autoComplete="name"
            placeholder="השם שלך"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={60}
            aria-describedby={error ? "form-error" : undefined}
          />
          <label htmlFor="customer-phone">מספר הוואטסאפ שלך</label>
          <input
            id="customer-phone"
            type="tel"
            dir="ltr"
            autoComplete="tel"
            placeholder="050-1234567"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            maxLength={20}
            aria-describedby={error ? "form-error" : undefined}
          />
          <p className="field-help">המספר ישמש לאימות ולעדכונים על התור.</p>
          {error && (
            <p className="form-error" id="form-error" role="alert">
              {error}
            </p>
          )}
          <button
            className="button button-primary full-width"
            type="submit"
            disabled={busy}
          >
            {busy ? "יוצרים קוד..." : "המשך לאימות"}
            <ArrowLeft size={18} />
          </button>
        </form>
      )}
      {step === "otp" && (
        <form onSubmit={verify} noValidate>
          <p className="otp-instruction">
            כאן נאמת את המספר <bdi>{phone}</bdi>.<br />
            קוד בן שש ספרות נוצר ונשמר כ-HMAC. במצב הפיתוח הוא מופיע בלוג של
            הפונקציה <bdi>request-booking-otp</bdi>.
          </p>
          <label htmlFor="otp-code">קוד בן 6 ספרות</label>
          <input
            id="otp-code"
            className="otp-input"
            value={code}
            onChange={(event) =>
              setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            autoComplete="one-time-code"
            inputMode="numeric"
            dir="ltr"
            placeholder="------"
            maxLength={6}
            aria-describedby={error ? "form-error" : undefined}
          />
          {error && (
            <p className="form-error" id="form-error" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="button button-primary full-width"
            disabled={busy}
          >
            {busy ? "מאמתים וקובעים..." : "אימות וקביעת תור"}
            <Check size={18} />
          </button>
          <div className="otp-actions">
            <button
              type="button"
              className="text-button"
              disabled={busy}
              onClick={() => {
                setStep("details");
                setError("");
                setCode("");
                setChallengeId("");
              }}
            >
              <ArrowRight size={14} />
              שינוי מספר
            </button>
            <button
              type="button"
              className="text-button"
              disabled={cooldown > 0 || busy}
              onClick={resend}
            >
              {cooldown > 0
                ? `קוד נוסף בעוד ${cooldown} שנ׳`
                : "שליחת קוד נוסף"}
            </button>
          </div>
        </form>
      )}
      {(step === "success" || (step === "manage" && appointment)) && (
        <>
          <p className="modal-intro">
            {step === "success"
              ? `${appointment.name}, התור נשמר בהצלחה במערכת.`
              : `${appointment.name}, אלה פרטי התור שלך.`}
          </p>
          <div className="confirmation-ticket">
            <div>
              <Scissors size={18} />
              <strong>תספורת גברים עם איתי</strong>
            </div>
            <div>
              <CalendarDays size={18} />
              <span>{formatDate(appointment.date)}</span>
            </div>
            <div>
              <Clock3 size={18} />
              <span>
                <bdi>{appointment.time}</bdi> · 30 דקות
              </span>
            </div>
            <div>
              <MapPin size={18} />
              <span>פלורנטין 18, תל אביב · כתובת לדוגמה</span>
            </div>
            <div className="ticket-total">
              <span>לתשלום במספרה</span>
              <strong>
                <bdi>₪90</bdi>
              </strong>
            </div>
          </div>
          <button
            className="button button-primary full-width"
            onClick={() => downloadCalendar(appointment)}
          >
            <Download size={18} />
            הוספת התור ליומן
          </button>
          <p className="field-help booking-management-note">
            ביטול עצמי יתווסף בשלב הבא. כרגע ניתן לפנות ישירות למספרה.
          </p>
        </>
      )}
      {step === "manage" && !appointment && (
        <>
          <p className="modal-intro">
            עדיין לא נשמר תור בדפדפן הזה. בוא נמצא לך זמן נוח.
          </p>
          <button
            className="button button-primary full-width"
            onClick={() => {
              onClose();
              document
                .getElementById("booking")
                .scrollIntoView({
                  behavior: window.matchMedia(
                      "(prefers-reduced-motion: reduce)",
                    ).matches
                    ? "instant"
                    : "smooth",
                });
            }}
          >
            לבחירת תור
            <ArrowLeft size={18} />
          </button>
        </>
      )}
      <div className="modal-footer">
        <MessageCircle size={14} />
        תספורת טובה מתחילה בשיחה טובה.
      </div>
    </dialog>
  );
}
