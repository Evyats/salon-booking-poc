// Fixed opening-hour fixtures for the single-salon POC.
const STORAGE_KEY = "kav-appointment";

export function israelToday() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type) => parts.find((part) => part.type === type).value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function asDate(value) {
  return new Date(`${value}T12:00:00`);
}
export function dateKey(date) {
  return `${date.getFullYear()}-${
    String(date.getMonth() + 1).padStart(2, "0")
  }-${String(date.getDate()).padStart(2, "0")}`;
}
export function nextDays(start, count = 7) {
  return Array.from({ length: count }, (_, index) => {
    const date = asDate(start);
    date.setDate(date.getDate() + index);
    return dateKey(date);
  });
}
export function formatDate(
  value,
  options = { weekday: "long", day: "numeric", month: "long" },
) {
  return new Intl.DateTimeFormat("he-IL", options).format(asDate(value));
}

export function availableTimes(date, appointment, bookedSlots = new Set()) {
  const day = asDate(date).getDay();
  if (day === 6) return [];
  const times = day === 5
    ? ["09:00", "09:30", "10:00", "10:30", "11:30", "12:00", "12:30", "13:00"]
    : [
      "09:00",
      "09:30",
      "10:30",
      "11:00",
      "11:30",
      "12:30",
      "13:00",
      "14:00",
      "14:30",
      "15:30",
      "16:00",
      "17:00",
      "17:30",
      "18:30",
    ];
  const now = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jerusalem",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
  return times.filter(
    (time) =>
      (date !== israelToday() || time > now) &&
      !(appointment?.date === date && appointment?.time === time) &&
      !bookedSlots.has(`${date}T${time}`),
  );
}

export function readAppointment() {
  try {
    const value = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
    return value &&
        /^\d{4}-\d{2}-\d{2}$/.test(value.date) &&
        /^\d{2}:\d{2}$/.test(value.time) &&
        typeof value.name === "string"
      ? value
      : null;
  } catch {
    return null;
  }
}

export function storeAppointment(appointment) {
  // Keep display details and the cancellation credential for this tab only.
  // Never keep phone numbers or OTPs here.
  try {
    if (appointment) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(appointment));
    } else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* The demo still works in memory when storage is unavailable. */
  }
}

export function downloadCalendar(appointment) {
  const start = appointment.date.replaceAll("-", "") +
    "T" +
    appointment.time.replace(":", "") +
    "00";
  const endDate = new Date(`${appointment.date}T${appointment.time}:00`);
  endDate.setMinutes(endDate.getMinutes() + 30);
  const end = dateKey(endDate).replaceAll("-", "") +
    "T" +
    String(endDate.getHours()).padStart(2, "0") +
    String(endDate.getMinutes()).padStart(2, "0") +
    "00";
  const content = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//KAV//Booking Demo//HE",
    "BEGIN:VEVENT",
    `UID:${
      appointment.id ??
        `${appointment.date}-${appointment.time.replace(":", "")}`
    }@kav.example`,
    `DTSTAMP:${
      new Date()
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}/, "")
    }`,
    `DTSTART;TZID=Asia/Jerusalem:${start}`,
    `DTEND;TZID=Asia/Jerusalem:${end}`,
    "SUMMARY:תור בקו - תספורת גברים",
    "DESCRIPTION:תספורת גברים עם איתי בקו ברברשופ.",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(
    new Blob([content], { type: "text/calendar;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "kav-appointment.ics";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
