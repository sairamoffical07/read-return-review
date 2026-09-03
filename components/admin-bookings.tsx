"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookMinus, Download, KeyRound, MessageCircle, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

type Booking = { id:number; code:string; bookSlug:string; bookTitle:string; name:string; registerNumber:string; year:string; department:string; phone:string; instagram:string|null; dueDate:string; createdAt:string };
type ShelfBook = { slug:string; title:string; author:string; genre:string; tone:string; ink:string };

export function AdminBookings() {
  const [key, setKey] = useState("");
  const [rows, setRows] = useState<Booking[]>([]);
  const [shelf, setShelf] = useState<ShelfBook[]>([]);
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [addMessage, setAddMessage] = useState("");
  const [genreChoice, setGenreChoice] = useState("");

  const genres = useMemo(() => Array.from(new Set(shelf.map((book) => book.genre))).sort(), [shelf]);
  const bookedSlugs = useMemo(() => new Set(rows.map((row) => row.bookSlug)), [rows]);

  async function unlock(event: React.FormEvent) {
    event.preventDefault(); setLoading(true); setError("");
    try {
      const headers = { Authorization: `Bearer ${key}` };
      const [bookingResponse, shelfResponse] = await Promise.all([
        fetch("/api/admin/bookings", { headers, cache: "no-store" }),
        fetch("/api/admin/books", { headers, cache: "no-store" }),
      ]);
      const bookingData = await bookingResponse.json();
      const shelfData = await shelfResponse.json();
      if (!bookingResponse.ok) throw new Error(bookingData.error);
      if (!shelfResponse.ok) throw new Error(shelfData.error);
      setRows(bookingData.bookings); setShelf(shelfData.books); setUnlocked(true);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not load registrations."); }
    finally { setLoading(false); }
  }

  function exportCsv() {
    const headers = ["Booking ID","Book","Name","Register Number","Year","Department","WhatsApp","Instagram","Due Date"];
    const values = rows.map((row) => [row.code,row.bookTitle,row.name,row.registerNumber,row.year,row.department,row.phone,row.instagram ?? "",row.dueDate]);
    const csv = [headers,...values].map((line) => line.map((cell) => `"${String(cell).replaceAll('"','""')}"`).join(",")).join("\n");
    const anchor = document.createElement("a"); anchor.href = URL.createObjectURL(new Blob([csv], { type:"text/csv" })); anchor.download="enlit-bookings.csv"; anchor.click(); URL.revokeObjectURL(anchor.href);
  }

  async function cancelBooking(id: number) {
    setCancelling(id); setError("");
    try {
      const response = await fetch("/api/admin/bookings", { method:"DELETE", headers:{ Authorization:`Bearer ${key}`, "Content-Type":"application/json" }, body:JSON.stringify({ id }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      setRows((current) => current.filter((row) => row.id !== id));
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not cancel this booking."); }
    finally { setCancelling(null); }
  }

  async function addBook(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setAdding(true); setAddMessage(""); setError("");
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    const genre = genreChoice === "__new__" ? String(payload.newGenre ?? "").trim() : genreChoice;
    try {
      const response = await fetch("/api/admin/books", { method:"POST", headers:{ Authorization:`Bearer ${key}`, "Content-Type":"application/json" }, body:JSON.stringify({ title:payload.title, author:payload.author, genre }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      setShelf((current) => [...current, data.book]); form.reset(); setGenreChoice("");
      setAddMessage(`“${data.book.title}” is now available on the student shelf.`);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not add this book."); }
    finally { setAdding(false); }
  }

  async function removeBook(slug: string) {
    setRemoving(slug); setError("");
    try {
      const response = await fetch("/api/admin/books", { method:"DELETE", headers:{ Authorization:`Bearer ${key}`, "Content-Type":"application/json" }, body:JSON.stringify({ slug }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      setShelf((current) => current.filter((book) => book.slug !== slug));
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not remove this book."); }
    finally { setRemoving(null); }
  }

  if (!unlocked) return <main className="admin-login"><section><span className="admin-logo">ENLIT</span><KeyRound /><p className="eyebrow">ORGANIZER DESK</p><h1>Open the<br />booking list.</h1><form onSubmit={unlock}><Input value={key} onChange={(event) => setKey(event.target.value)} type="password" placeholder="Organizer access code" aria-label="Organizer access code" required /><Button type="submit" disabled={loading}>{loading ? "Opening…" : "Open registrations"}</Button></form>{error && <p className="form-error">{error}</p>}<Link href="/">← Back to the bookshelf</Link></section></main>;

  return <main className="admin-page">
    <header><div><p className="eyebrow">ENLIT · ORGANIZER DESK</p><h1>Book registrations</h1></div><div><span>{rows.length} booked</span><Button onClick={exportCsv} disabled={!rows.length}><Download /> Download CSV</Button></div></header>

    <section className="add-book-panel"><div><p className="eyebrow">EXPAND THE SHELF</p><h2>Add a new book</h2><p>Choose an existing genre or create a new one.</p></div><form onSubmit={addBook}><Input name="title" placeholder="Book title" aria-label="Book title" required /><Input name="author" placeholder="Author" aria-label="Author" required /><Select value={genreChoice} onValueChange={setGenreChoice} required><SelectTrigger className="genre-select"><SelectValue placeholder="Choose genre" /></SelectTrigger><SelectContent>{genres.map((genre) => <SelectItem value={genre} key={genre}>{genre}</SelectItem>)}<SelectItem value="__new__">＋ Add new genre</SelectItem></SelectContent></Select>{genreChoice === "__new__" && <Input name="newGenre" placeholder="New genre name" aria-label="New genre name" required />}<Button type="submit" disabled={adding || !genreChoice}><Plus /> {adding ? "Adding…" : "Add to shelf"}</Button></form>{addMessage && <p className="add-success">{addMessage}</p>}</section>

    <section className="manage-shelf"><div className="manage-heading"><div><p className="eyebrow">MANAGE THE SHELF</p><h2>{shelf.length} listed books</h2></div><p>Booked titles must be cancelled before they can be removed.</p></div><div className="manage-grid">{shelf.map((book) => { const booked = bookedSlugs.has(book.slug); return <article key={book.slug} style={{ background:book.tone, color:book.ink }}><span>{book.genre}</span><h3>{book.title}</h3><p>{book.author}</p>{booked ? <Button disabled>Currently booked</Button> : <AlertDialog><AlertDialogTrigger asChild><Button variant="outline"><BookMinus /> Remove listing</Button></AlertDialogTrigger><AlertDialogContent className="cancel-dialog"><AlertDialogHeader><AlertDialogTitle>Remove “{book.title}”?</AlertDialogTitle><AlertDialogDescription>The book will disappear from the student shelf and cannot be booked. Existing registration records are not affected.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep listed</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => removeBook(book.slug)} disabled={removing === book.slug}>{removing === book.slug ? "Removing…" : "Remove book"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>}</article>; })}</div></section>

    {error && <p className="form-error admin-error">{error}</p>}
    {rows.length ? <div className="admin-table-wrap"><table><thead><tr><th>Reader</th><th>Book</th><th>College details</th><th>Contact</th><th>Return by</th><th>Actions</th></tr></thead><tbody>{rows.map((row) => { const message = encodeURIComponent(`Hi ${row.name}! Your ENLIT booking is confirmed 📚\n\nBook: ${row.bookTitle}\nBooking ID: ${row.code}\nReturn by: ${row.dueDate}\n\nWe'll contact you with the collection details. Happy reading!\n— ENLIT`); return <tr key={row.id}><td><strong>{row.name}</strong><small>{row.code}</small></td><td>{row.bookTitle}</td><td><strong>{row.registerNumber}</strong><small>{row.year} · {row.department}</small></td><td><a href={`tel:+91${row.phone}`}>+91 {row.phone}</a><small>{row.instagram || "No Instagram ID"}</small></td><td>{row.dueDate}</td><td><div className="admin-actions"><a className="confirm-link" href={`https://wa.me/91${row.phone}?text=${message}`} target="_blank" rel="noreferrer"><MessageCircle /> WhatsApp</a><AlertDialog><AlertDialogTrigger asChild><Button variant="outline" className="cancel-trigger"><Trash2 /> Cancel</Button></AlertDialogTrigger><AlertDialogContent className="cancel-dialog"><AlertDialogHeader><AlertDialogTitle>Cancel this booking?</AlertDialogTitle><AlertDialogDescription>{row.name}’s reservation for “{row.bookTitle}” will be removed. The book will immediately become available for another student.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep booking</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => cancelBooking(row.id)} disabled={cancelling === row.id}>{cancelling === row.id ? "Cancelling…" : "Cancel booking"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div></td></tr>; })}</tbody></table></div> : <div className="empty-state">No registrations yet. Share the student site and the first booking will appear here.</div>}
    <Link className="admin-back" href="/">← View student site</Link>
  </main>;
}
