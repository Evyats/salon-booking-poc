import { useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUpLeft,
  CalendarDays,
  Clock3,
  Coffee,
  MapPin,
  Menu,
  Scissors,
  Sparkles,
  X,
} from "lucide-react";
import { Booking, BookingDialog } from "./Booking.jsx";
import { readAppointment, storeAppointment } from "./demo.js";

function Brand({ footer = false }) {
  return (
    <a
      href="#home"
      className={`brand ${footer ? "brand-footer" : ""}`}
      aria-label="קו — חזרה לראש העמוד"
    >
      <span className="brand-mark">
        <Scissors size={26} strokeWidth={1.6} />
      </span>
      <span className="brand-name">
        קו<span>.</span>
      </span>
      <span className="brand-description">
        ברברשופ שכונתי
        <span lang="en" dir="ltr">
          GOOD HAIR. GOOD DAY.
        </span>
      </span>
    </a>
  );
}

const faqs = [
  [
    "צריך לשלם כשקובעים תור?",
    "לא. בוחרים שעה, מאמתים את מספר הטלפון וזהו. התשלום בסך 90 ₪ מתבצע במספרה, אחרי התספורת.",
  ],
  [
    "מה אם אני צריך לבטל?",
    "בשלב הנוכחי פונים ישירות למספרה. בהמשך יישלח קישור אישי לביטול התור.",
  ],
  [
    "מה כלול בתספורת?",
    "חצי שעה עם איתי: שיחה קצרה על מה שמתאים לך, תספורת, ניקוי קווים ועיצוב לסיום. וכמובן, קפה.",
  ],
];

export default function App() {
  const [menu, setMenu] = useState(false);
  const [appointment, setAppointment] = useState(readAppointment);
  const [modal, setModal] = useState(null);
  const [availabilityVersion, setAvailabilityVersion] = useState(0);
  const navLinks = [
    { href: "#booking", label: "קביעת תור" },
    { href: "#about", label: "קצת על קו" },
    { href: "#gallery", label: "האווירה" },
    { href: "#visit", label: "איפה נפגשים" },
  ];
  function save(value) {
    setAppointment(value);
    storeAppointment(value);
    setAvailabilityVersion((version) => version + 1);
  }

  return (
    <>
      <a className="skip-link" href="#booking">
        דילוג לקביעת תור
      </a>
      <header className="site-header" id="home">
        <div className="header-inner">
          <Brand />
          <nav className="desktop-nav" aria-label="ניווט ראשי">
            {navLinks.map((link, index) => (
              <a
                key={link.href}
                href={link.href}
                className={index === 0 ? "nav-featured" : ""}
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="header-actions">
            <button
              className="my-appointment"
              onClick={() => setModal({ kind: "manage" })}
            >
              <CalendarDays size={17} />
              <span>התור שלי</span>
              {appointment && <i className="appointment-dot" />}
            </button>
            <button
              className="icon-button mobile-menu-button"
              aria-expanded={menu}
              aria-controls="mobile-nav"
              aria-label={menu ? "סגירת תפריט" : "פתיחת תפריט"}
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {menu && (
          <nav className="mobile-nav" id="mobile-nav" aria-label="ניווט לנייד">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenu(false)}
              >
                {link.label}
                <ArrowUpLeft size={17} />
              </a>
            ))}
          </nav>
        )}
      </header>
      <main>
        <section className="hero page-width" aria-labelledby="hero-title">
          <div className="hero-copy">
            <span className="eyebrow hero-eyebrow">
              <span className="tiny-line" />
              ברברשופ שכונתי, קצת אחרת
            </span>
            <h1 id="hero-title">
              תספורת טובה.
              <br />
              <span>יום טוב.</span>
            </h1>
            <p className="hero-description">
              קווים נקיים. קפה טוב. חצי שעה לעצמך.
              <br />
              איתי והמספריים מחכים לך בלב פלורנטין.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#booking">
                בוא נקבע תור
                <ArrowLeft size={19} />
              </a>
              <a className="hero-secondary" href="#about">
                נעים להכיר
                <ArrowDown size={16} />
              </a>
            </div>
            <div className="hero-meta">
              <span>
                <MapPin size={15} />
                פלורנטין, תל אביב
              </span>
              <span>
                <Clock3 size={15} />
                30 דקות
              </span>
              <span>
                <bdi>₪90</bdi> לתספורת
              </span>
            </div>
            <div className="hero-note">
              <span className="little-spark" aria-hidden="true">
                ✳
              </span>
              <span>אותו כיסא. אותו איתי. כל פעם, בדיוק אתה.</span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-photo">
              <img
                src="/images/barber.jpg"
                alt="ספר מדייק תספורת באווירה רגועה"
                fetchPriority="high"
                width="1400"
                height="2100"
              />
              <span className="photo-topline" lang="en" dir="ltr">
                KAV BARBERSHOP · TEL AVIV
              </span>
              <div className="photo-caption">
                הפרטים הקטנים.
                <br />
                <span>ההבדל הגדול.</span>
              </div>
            </div>
            <div className="craft-seal">
              <span>עושים את זה</span>
              <Scissors size={32} strokeWidth={1.4} />
              <span>בדיוק בשבילך</span>
            </div>
            <div className="hero-ticket">
              <span className="ticket-icon">
                <CalendarDays size={23} />
              </span>
              <div>
                <strong>הכיסא שלך מחכה.</strong>
                <span>תופסים חצי שעה, יוצאים בראש טוב.</span>
              </div>
              <a
                href="#booking"
                className="ticket-arrow"
                aria-label="בחירת זמן לתספורת"
              >
                <ArrowUpLeft size={22} />
              </a>
            </div>
            <span className="image-footnote">צילום אווירה</span>
          </div>
        </section>
        <div className="values-ribbon">
          <div className="page-width ribbon-inner">
            <span>
              <Scissors />
              דיוק בכל קו
            </span>
            <i aria-hidden="true">✳</i>
            <span>
              <Coffee />
              קפה כמו שצריך
            </span>
            <i aria-hidden="true">✳</i>
            <span>
              <Clock3 />
              הזמן שלך, בקצב שלך
            </span>
            <i className="last-spark" aria-hidden="true">
              ✳
            </i>
            <span className="ribbon-english" lang="en" dir="ltr">
              LOOK GOOD. FEEL LIKE YOU.
            </span>
          </div>
        </div>
        <div className="page-width">
          <Booking
            appointment={appointment}
            availabilityVersion={availabilityVersion}
            onBook={(slot) => setModal({ kind: "details", slot })}
          />
          <section
            className="about-section section-anchor"
            id="about"
            aria-labelledby="about-title"
          >
            <div className="about-image">
              <img
                src="/images/chair.jpg"
                alt="כיסא ספר וינטג׳ ופינת עבודה"
                width="800"
                height="533"
                loading="lazy"
              />
              <span className="about-photo-label">קצת להוריד הילוך.</span>
            </div>
            <div className="about-copy">
              <span className="eyebrow">נעים להכיר, אנחנו קו</span>
              <h2 id="about-title">
                מספרה קטנה.
                <br />
                ראש פתוח.
              </h2>
              <p>
                קו נולד מרעיון פשוט: תספורת היא לא עוד משימה ביומן. היא חצי שעה
                לעצור, לשתות קפה ולצאת קצת יותר אתה.
              </p>
              <p>
                אני איתי. אוהב קווים מדויקים, מוזיקה טובה ולהכיר את מי שיושב
                בכיסא. נעשה את זה פשוט: אתה מביא את הראש, אני דואג לכל השאר.
              </p>
              <div className="barber-signature">
                <span className="signature">איתי.</span>
                <span>הידיים מאחורי קו</span>
                <Scissors size={27} strokeWidth={1.2} />
              </div>
            </div>
          </section>
          <section
            className="gallery-section section-anchor"
            id="gallery"
            aria-labelledby="gallery-title"
          >
            <div className="section-heading">
              <div>
                <span className="eyebrow">לפני שמגיעים</span>
                <h2 id="gallery-title">קצת מהאווירה שלנו.</h2>
              </div>
              <span className="gallery-note">
                מוזיקה טובה ברקע. דיוק בפרונט.
              </span>
            </div>
            <div className="gallery-grid">
              <figure className="gallery-wide">
                <img
                  src="/images/studio.jpg"
                  alt="חלל ברברשופ עם קיר לבנים ותאורה חמימה"
                  loading="lazy"
                  width="1100"
                  height="731"
                />
                <figcaption>
                  <span>מקום להרגיש בו בנוח</span>
                  <ArrowUpLeft size={20} />
                </figcaption>
              </figure>
              <figure>
                <img
                  src="/images/haircut.jpg"
                  alt="עבודת תספורת מדויקת עם מכונת תספורת"
                  loading="lazy"
                  width="900"
                  height="1350"
                />
                <figcaption>
                  <span>כל קו מקבל תשומת לב</span>
                  <Scissors size={19} />
                </figcaption>
              </figure>
              <div className="gallery-quote">
                <Sparkles size={26} strokeWidth={1.3} />
                <blockquote>
                  לא צריך
                  <br />
                  סיבה מיוחדת
                  <br />
                  להיראות טוב.
                </blockquote>
                <span>פשוט תקפוץ. עם תור, כן?</span>
                <a
                  href="#booking"
                  className="round-link"
                  aria-label="לקביעת תור"
                >
                  <ArrowLeft size={24} />
                </a>
              </div>
            </div>
            <p className="stock-caption">תמונות סטוק להמחשת האווירה</p>
          </section>
          <section
            id="visit"
            className="visit-section section-anchor"
            aria-labelledby="visit-title"
          >
            <div className="visit-heading">
              <span className="eyebrow">נתראה בפלורנטין</span>
              <h2 id="visit-title">
                ממש כאן,
                <br />
                בשכונה.
              </h2>
              <p>
                פלורנטין 18, תל אביב
                <br />
                <span className="address-note">כתובת לדוגמה</span>
              </p>
            </div>
            <div className="hours">
              <h3>
                <Clock3 size={18} />
                מתי אנחנו כאן
              </h3>
              <div>
                <span>ראשון — חמישי</span>
                <bdi>09:00–19:00</bdi>
              </div>
              <div>
                <span>שישי</span>
                <bdi>09:00–14:00</bdi>
              </div>
              <div>
                <span>שבת</span>
                <span>נחים קצת</span>
              </div>
            </div>
            <div className="visit-cta">
              <Coffee size={34} strokeWidth={1.2} />
              <h3>הקפה כבר בדרך.</h3>
              <p>נשאר רק לבחור מתי להגיע.</p>
              <a href="#booking" className="button button-primary">
                שומרים לך מקום
                <ArrowLeft size={18} />
              </a>
            </div>
          </section>
          <section className="faq-section" aria-labelledby="faq-title">
            <div>
              <span className="eyebrow">עוד משהו קטן</span>
              <h2 id="faq-title">טוב ששאלת.</h2>
            </div>
            <div className="faq-list">
              {faqs.map(([question, answer]) => (
                <details key={question}>
                  <summary>
                    {question}
                    <span className="faq-plus" aria-hidden="true">
                      +
                    </span>
                  </summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </main>
      <footer className="site-footer">
        <div className="page-width footer-top">
          <Brand footer />
          <a href="#booking" className="footer-cta">
            ניפגש בתספורת הבאה
            <ArrowUpLeft size={23} />
          </a>
        </div>
        <div className="page-width footer-bottom">
          <span>© {new Date().getFullYear()} קו ברברשופ</span>
          <span className="demo-label">
            <span />
            אתר הדגמה · עסק ופרטים להמחשה בלבד
          </span>
          <span lang="en" dir="ltr">
            A LITTLE OFF THE TOP.
          </span>
        </div>
      </footer>
      <div className="mobile-booking-bar">
        <div>
          <strong>תספורת עם איתי</strong>
          <span>
            30 דקות · <bdi>₪90</bdi>
          </span>
        </div>
        <a href="#booking" className="button button-primary">
          קביעת תור
          <ArrowLeft size={18} />
        </a>
      </div>
      {modal && (
        <BookingDialog
          modal={modal}
          appointment={appointment}
          onClose={() => setModal(null)}
          onConfirm={save}
          onAvailabilityChanged={() =>
            setAvailabilityVersion((version) => version + 1)}
        />
      )}
    </>
  );
}
