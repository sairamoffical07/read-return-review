import { ensureSchema, getSql } from "@/db";
import { books } from "@/lib/books";

const palettes = [
  ["#b7cfce", "#173b3a"], ["#d9b38c", "#462812"], ["#be8e9b", "#411d29"],
  ["#647c74", "#fff5dc"], ["#d5c76c", "#352f12"], ["#7b4662", "#ffe9d0"],
];

function authorized(request: Request) {
  return Boolean(process.env.ENLIT_ADMIN_KEY && request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") === process.env.ENLIT_ADMIN_KEY);
}

export async function GET(request: Request) {
  if (!authorized(request)) return Response.json({ error: "Incorrect organizer access code." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  await ensureSchema();
  const sql = getSql();
  const [added, hidden, activeBookings] = await Promise.all([
    sql`SELECT slug, title, author, genre, tone, ink FROM custom_books ORDER BY id ASC`,
    sql`SELECT slug FROM hidden_books`,
    sql`SELECT book_slug AS slug FROM bookings`,
  ]);
  const hiddenSlugs = new Set(hidden.map((row) => row.slug));
  return Response.json({ books: [...books, ...added].filter((book) => !hiddenSlugs.has(book.slug)), booked: activeBookings.map((row) => row.slug) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!authorized(request)) return Response.json({ error: "Incorrect organizer access code." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  const body = await request.json() as Record<string, unknown>;
  const value = (key: string) => typeof body[key] === "string" ? body[key].trim() : "";
  const title = value("title"); const author = value("author"); const genre = value("genre");
  if (!title || !author || !genre) return Response.json({ error: "Add the title, author and genre." }, { status: 400 });
  await ensureSchema();
  const sql = getSql();
  const sameTitle = await sql`SELECT title FROM custom_books WHERE LOWER(title) = LOWER(${title}) LIMIT 1`;
  if (sameTitle.length || books.some((book) => book.title.toLowerCase() === title.toLowerCase())) return Response.json({ error: "That book is already on the shelf." }, { status: 409 });
  const slugBase = title.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 54) || "book";
  const slug = `${slugBase}-${crypto.randomUUID().slice(0, 5)}`;
  const palette = palettes[title.length % palettes.length];
  try {
    const [book] = await sql`INSERT INTO custom_books (slug, title, author, genre, tone, ink, created_at)
      VALUES (${slug}, ${title}, ${author}, ${genre}, ${palette[0]}, ${palette[1]}, ${new Date().toISOString()})
      RETURNING slug, title, author, genre, tone, ink`;
    return Response.json({ book }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Could not add this book. Please try again." }, { status: 500 }); }
}

export async function DELETE(request: Request) {
  if (!authorized(request)) return Response.json({ error: "Incorrect organizer access code." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  const body = await request.json() as { slug?: unknown };
  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  const sourceBook = books.find((book) => book.slug === slug);
  await ensureSchema();
  const sql = getSql();
  const custom = await sql`SELECT slug FROM custom_books WHERE slug = ${slug} LIMIT 1`;
  if (!sourceBook && !custom.length) return Response.json({ error: "This book is no longer listed." }, { status: 404 });
  const active = await sql`SELECT id FROM bookings WHERE book_slug = ${slug} LIMIT 1`;
  if (active.length) return Response.json({ error: "Cancel this book’s active booking before removing it from the shelf." }, { status: 409 });
  if (custom.length) await sql`DELETE FROM custom_books WHERE slug = ${slug}`;
  else await sql`INSERT INTO hidden_books (slug, created_at) VALUES (${slug}, ${new Date().toISOString()}) ON CONFLICT (slug) DO NOTHING`;
  return Response.json({ removed: slug }, { headers: { "Cache-Control": "no-store" } });
}
