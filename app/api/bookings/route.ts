import { ensureSchema, getSql } from "@/db";
import { books } from "@/lib/books";

export async function GET() {
  try {
    await ensureSchema();
    const sql = getSql();
    const [rows, addedBooks, hidden] = await Promise.all([
      sql`SELECT book_slug AS "bookSlug" FROM bookings ORDER BY id ASC`,
      sql`SELECT slug, title, author, genre, tone, ink FROM custom_books ORDER BY id ASC`,
      sql`SELECT slug FROM hidden_books`,
    ]);
    const hiddenSlugs = new Set(hidden.map((row) => row.slug));
    return Response.json({ booked: rows.map((row) => row.bookSlug), hidden: [...hiddenSlugs], addedBooks: addedBooks.filter((book) => !hiddenSlugs.has(book.slug)) });
  } catch {
    return Response.json({ booked: [], error: "Availability is temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const value = (key: string) => typeof body[key] === "string" ? body[key].trim() : "";
    const requestedSlug = value("bookSlug");
    await ensureSchema();
    const sql = getSql();
    const storedBook = await sql`SELECT slug, title FROM custom_books WHERE slug = ${requestedSlug} LIMIT 1`;
    const hidden = await sql`SELECT slug FROM hidden_books WHERE slug = ${requestedSlug} LIMIT 1`;
    const book = hidden.length ? undefined : books.find((item) => item.slug === requestedSlug) ?? storedBook[0];
    const name = value("name");
    const registerNumber = value("registerNumber").toUpperCase();
    const year = value("year");
    const department = value("department");
    const phone = value("phone").replace(/\D/g, "");
    const instagram = value("instagram");
    if (!book || !name || !registerNumber || !year || !department || !/^\d{10}$/.test(phone) || body.agreed !== true) {
      return Response.json({ error: "Please complete every required field correctly." }, { status: 400 });
    }
    const now = new Date();
    const due = new Date(now);
    due.setDate(due.getDate() + 30);
    const code = `ENLIT-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
    const dueDate = due.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
    const [booking] = await sql`INSERT INTO bookings
      (code, book_slug, book_title, name, register_number, year, department, phone, instagram, due_date, created_at)
      VALUES (${code}, ${book.slug}, ${book.title}, ${name}, ${registerNumber}, ${year}, ${department}, ${phone}, ${instagram || null}, ${dueDate}, ${now.toISOString()})
      RETURNING code, due_date AS "dueDate"`;
    return Response.json({ booking }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("book_slug")) return Response.json({ error: "Someone just booked this title. Please choose another book." }, { status: 409 });
    if (message.includes("register_number")) return Response.json({ error: "This register number already has a book reserved." }, { status: 409 });
    return Response.json({ error: "We couldn’t save your booking. Please try again." }, { status: 500 });
  }
}
