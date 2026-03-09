"use client";

import { useState, useEffect, FormEvent } from "react";
import { useT } from "@/lib/useT";

export default function KontaktPage() {
  const tr = useT();
  const [toast, setToast] = useState<null | "success" | "error">(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        body: formData,
      });
      setToast(res.ok ? "success" : "error");
      if (res.ok) form.reset();
    } catch {
      setToast("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="kontakt-page">
        <div className="vita-card">
          <div className="vita-card-image">
            <img src="/img/vita/DSC_0030.jpg" alt={tr("vita_img_atelier")} />
          </div>
          <div className="vita-card-text">
            <p>
              {tr("kontakt_intro")}
              <br /><br />
              Rüdiger Schäfer<br />
              Dankmarshäuserstr. 20<br />
              D – 36208 Wildeck – Bosserode<br /><br />
              <a href="mailto:schaefer-art@mail.de">schaefer-art@mail.de</a>
            </p>
          </div>
        </div>

        <div className="vita-card">
          <div className="vita-card-image">
            <img src="/img/vita/DSC_0030.jpg" alt={tr("vita_img_atelier")} />
          </div>
          <div className="vita-card-text">
            <form className="kontakt-form" onSubmit={handleSubmit}>
              <p>{tr("kontakt_direct")}</p>

              <label>
                <span className="sr-only">Name</span>
                <input type="text" name="name" required placeholder={tr("kontakt_name_placeholder")} />
              </label>

              <label>
                <input type="email" name="email" required placeholder={tr("kontakt_email_placeholder")} />
              </label>

              <label>
                <textarea name="message" rows={5} required placeholder={tr("kontakt_message_placeholder")} />
              </label>

              <button type="submit" disabled={loading}>
                {loading ? tr("kontakt_sending") : tr("kontakt_send")}
              </button>
            </form>
          </div>
        </div>
      </div>

      {toast && (
        <div className={`toast ${toast === "success" ? "toast-success" : "toast-error"}`}
          role="status" aria-live="polite">
          {toast === "success" ? tr("kontakt_success") : tr("kontakt_error")}
        </div>
      )}

      <style jsx>{`
        .kontakt-page {
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
          padding: 1rem;
          margin-top: 7vh;
          box-sizing: border-box;
        }

        .vita-card {
          display: flex;
          flex-direction: column;
          background: #f2f2f2;
          border-radius: 6px;
          overflow: hidden;
        }

        .vita-card-image {
          width: 100%;
          height: 160px;
          flex-shrink: 0;
        }

        .vita-card-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .vita-card-text {
          padding: 1.2rem;
          font-size: 0.95rem;
          line-height: 1.65;
        }

        .vita-card-text :global(.kontakt-form) {
          max-width: none;
          width: 100%;
        }
      `}</style>
    </>
  );
}
