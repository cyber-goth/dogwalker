const TZ = "Asia/Jerusalem";

export function todayInJerusalem(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d); // YYYY-MM-DD
}

export function monthGrid(year: number, month: number): (string | null)[][] {
  // month 1-12, weeks Mon-first
  const first = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const lead = (first.getUTCDay() + 6) % 7;
  const cells: (string | null)[] = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++)
    cells.push(
      `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    );
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function formatSummary(
  year: number,
  month: number,
  dates: string[]
): string {
  const prefix = `${year}-${String(month).padStart(2, "0")}-`;
  const days = dates
    .filter((d) => d.startsWith(prefix))
    .map((d) => Number(d.slice(8)))
    .sort((a, b) => a - b);
  return `${MONTHS[month - 1]} ${year}: ${days.length} visit${
    days.length === 1 ? "" : "s"
  }${days.length ? " — " + days.join(", ") : ""}`;
}
