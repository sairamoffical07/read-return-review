"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, Check, ChevronLeft, Clock3, Film, Search, Sparkles } from "lucide-react";
import { books, type Book } from "@/lib/books";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

type Confirmation = { code: string; title: string; dueDate: string };

export function BookingExperience() {
  const [booked, setBooked] = useState<string[]>([]);
  const [catalog, setCatalog] = useState<Book[]>(books);
  const [selected, setSelected] = useState<Book | null>(null);
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("All");
  const [step, setStep] = useState<"books" | "form" | "success">("books");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  useEffect(() => {
    fetch("/api/bookings")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setBooked(data.booked ?? []);
        const hidden = new Set<string>(data.hidden ?? []);
        setCatalog([...books.filter((book) => !hidden.has(book.slug)), ...(data.addedBooks ?? [])]);
      })
      .catch(() => setError("Live availability could not be loaded. Please refresh."));
  }, []);

  const genres = useMemo(() => ["All", ...Array.from(new Set(catalog.map((book) => book.genre))).sort()], [catalog]);
  const visibleBooks = useMemo(() => catalog.filter((book) => {
    const haystack = `${book.title} ${book.author} ${book.genre}`.toLowerCase();
    const matchesQuery = haystack.includes(query.toLowerCase());
    const matchesGenre = genre === "All" || book.genre === genre;
    return matchesQuery && matchesGenre;
  }), [query, genre, catalog]);

  function chooseBook(book: Book) {
    if (booked.includes(book.slug)) return;
    setSelected(book); setStep("form"); setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submitBooking(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !agreed) return;
    setSubmitting(true); setError("");
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const response = await fetch("/api/bookings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, bookSlug: selected.slug, agreed: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not complete your booking.");
      setConfirmation({ code: data.booking.code, title: selected.title, dueDate: data.booking.dueDate });
      setBooked((current) => [...current, selected.slug]); setStep("success");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not complete your booking.");
    } finally { setSubmitting(false); }
  }

  if (step === "success" && confirmation) {
    const shareText = encodeURIComponent(`ENLIT booking confirmed!\n\nBook: ${confirmation.title}\nBooking ID: ${confirmation.code}\nReturn by: ${confirmation.dueDate}\n\nRead. Return. Review.`);
    return <main className="success-page"><section className="success-card">
      <div className="success-mark"><Check /></div><p className="eyebrow">YOUR NEXT READ IS RESERVED</p>
      <h1>It’s yours<br />for a month.</h1>
      <div className="ticket"><span>{confirmation.title}</span><small>Booking ID</small><strong>{confirmation.code}</strong><small>Return on or before</small><strong>{confirmation.dueDate}</strong></div>
      <p className="success-note">ENLIT will contact you about collecting the book. After reading, return it and send us your short review reel.</p>
      <a className="whatsapp-button" href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noreferrer">Save confirmation on WhatsApp</a>
      <button className="text-button" onClick={() => { setStep("books"); setSelected(null); }}>Browse remaining books</button>
    </section></main>;
  }

  if (step === "form" && selected) {
    return <main className="registration-page">
      <header className="mini-header"><span>ENLIT</span><span>READ · RETURN · REVIEW</span></header>
      <div className="registration-layout">
        <aside className="chosen-panel" style={{ background: selected.tone, color: selected.ink }}>
          <button className="back-button" onClick={() => setStep("books")}><ChevronLeft /> Change book</button><p className="book-number">YOUR PICK</p>
          <div className="chosen-title"><span>{selected.genre}</span><h1>{selected.title}</h1><p>{selected.author}</p></div>
          <div className="chosen-footer"><Clock3 /><span>Keep it for 30 days</span></div>
        </aside>
        <section className="form-panel"><p className="eyebrow">ONE LAST PAGE</p><h2>Tell us who’s<br />taking it home.</h2>
          <form onSubmit={submitBooking}>
            <label>Full name<Input name="name" required placeholder="Your name" autoComplete="name" /></label>
            <div className="form-row"><label>Register number<Input name="registerNumber" required placeholder="e.g. 310625243191" /></label><label>Year<select name="year" required defaultValue=""><option value="" disabled>Select</option><option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>4th Year</option></select></label></div>
            <label>Department<Input name="department" required placeholder="e.g. AI & Data Science" /></label>
            <div className="form-row"><label>WhatsApp number<Input name="phone" required type="tel" inputMode="numeric" placeholder="10-digit number" pattern="[0-9]{10}" /></label><label>Instagram ID <em>optional</em><Input name="instagram" placeholder="@username" /></label></div>
            <label className="agreement"><Checkbox checked={agreed} onCheckedChange={(value) => setAgreed(value === true)} /><span>I agree to return the book within 30 days and submit a short, spoiler-free review reel to ENLIT.</span></label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <Button type="submit" disabled={!agreed || submitting} className="submit-button">{submitting ? "Reserving…" : `Reserve ${selected.title}`}</Button>
          </form>
        </section>
      </div>
    </main>;
  }

  return <main>
    <header className="site-header"><a href="#top" className="brand">ENLIT<span>READING CLUB</span></a><div className="header-note"><span>{catalog.length - booked.length}</span> books waiting</div></header>
    <section className="intro" id="top"><div className="intro-copy"><p className="eyebrow">A BOOK BORROWING PROJECT BY ENLIT</p><h1>Read.<br /><i>Return.</i> Review.</h1><p className="intro-text">Choose a book. Take it home for a month—free. Bring it back with a short review reel, and pass the story forward.</p><div className="intro-meta"><span><BookOpen /> One book per reader</span><span><Clock3 /> 30 days</span><span><Film /> One review reel</span></div></div><div className="editorial-note"><Sparkles /><p>Don’t pick the book everyone says you should read.</p><strong>Pick the one you can’t stop looking at.</strong></div></section>
    <section className="shelf-section"><div className="shelf-heading"><div><p className="eyebrow">THE FIRST SHELF</p><h2>Find your next read.</h2></div><label className="search-box"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title or author" aria-label="Search books" /></label></div>
      <div className="genre-row" aria-label="Filter by genre">{genres.map((item) => <button key={item} className={genre === item ? "active" : ""} onClick={() => setGenre(item)}>{item}</button>)}</div>
      {error && <p className="availability-error">{error}</p>}
      <div className="book-grid">{visibleBooks.map((book, index) => { const unavailable = booked.includes(book.slug); return <article key={book.slug} className={`book-card card-${index % 4} ${unavailable ? "booked" : ""}`}><button onClick={() => chooseBook(book)} disabled={unavailable} aria-label={unavailable ? `${book.title} is booked` : `Book ${book.title}`}><div className="paper-cover" style={{ background: book.tone, color: book.ink }}><span className="cover-genre">{book.genre}</span><h3>{book.title}</h3><span className="cover-author">{book.author}</span><span className="cover-mark">ENLIT / {String(index + 1).padStart(2, "0")}</span></div><div className="card-caption"><span>{unavailable ? "Already picked" : "Available now"}</span><strong>{unavailable ? "BOOKED" : "RESERVE →"}</strong></div></button></article>; })}</div>
      {visibleBooks.length === 0 && <div className="empty-state">No books match that search. Try another title or genre.</div>}
    </section>
    <footer><span>READ · RETURN · REVIEW</span><p>One book. One reader. One reel. Pass it on.</p><strong>ENLIT</strong></footer>
  </main>;
}
