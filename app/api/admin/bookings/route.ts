import { ensureSchema, getSql } from "@/db";

function authorized(request: Request) {
  const suppliedKey = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return Boolean(process.env.ENLIT_ADMIN_KEY && suppliedKey === process.env.ENLIT_ADMIN_KEY);
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return Response.json({ error: "Incorrect organizer access code." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`SELECT id, code, book_slug AS "bookSlug", book_title AS "bookTitle", name,
    register_number AS "registerNumber", year, department, phone, instagram, due_date AS "dueDate",
    created_at AS "createdAt" FROM bookings ORDER BY created_at DESC`;
  return Response.json({ bookings: rows }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(request: Request) {
  if (!authorized(request)) {
    return Response.json({ error: "Incorrect organizer access code." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  const body = await request.json() as { id?: unknown };
  const id = Number(body.id);
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: "Invalid booking." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  await ensureSchema();
  const sql = getSql();
  const deleted = await sql`DELETE FROM bookings WHERE id = ${id} RETURNING id, book_title AS "bookTitle"`;
  if (!deleted.length) {
    return Response.json({ error: "This booking no longer exists." }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  return Response.json({ cancelled: deleted[0] }, { headers: { "Cache-Control": "no-store" } });
}
