import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const recentRequests = new Map<string, number>();
const RATE_LIMIT_MS = 60_000;

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const last = recentRequests.get(ip) ?? 0;
  if (Date.now() - last < RATE_LIMIT_MS) {
    return NextResponse.json({ error: "Bitte warte einen Moment." }, { status: 429 });
  }
  recentRequests.set(ip, Date.now());

  try {
    const formData = await req.formData();

    const name = formData.get("name") as string | null;
    const email = formData.get("email") as string | null;
    const message = formData.get("message") as string | null;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Bitte alle Felder ausfüllen." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Ungültige E-Mail-Adresse." }, { status: 400 });
    }

    // SMTP Konfiguration
    const transporter = nodemailer.createTransport({
      host: "smtp.mail.de",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: true,
      },
    });

    // ---------- EMAIL AN DICH ----------
    await transporter.sendMail({
      from: `"Kontaktformular" <${process.env.SMTP_USER}>`,
      to: "schaefer-art@mail.de",
      replyTo: email,
      subject: `Neue Nachricht von ${name}`,
      text: `Name: ${name}\nE-Mail: ${email}\n\nNachricht:\n${message}`,
    });

    // ---------- BESTÄTIGUNG AN ABSENDER ----------
    await transporter.sendMail({
      from: `"Rüdiger Schäfer" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Danke für deine Nachricht!",
      text: `Hallo ${name},

vielen Dank für Ihre Nachricht! Ich melde mich so schnell wie möglich zurück.

Hier ist eine Kopie Ihrer Nachricht:

----------------------------
${message}
----------------------------

Liebe Grüße,
Rüdiger Schäfer`,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
  console.error("Mail error:", err);
  console.error("Error code:", err.code);
  console.error("Error response:", err.response);
  console.error("Error responseCode:", err.responseCode);
    return NextResponse.json(
      { error: "Fehler beim Senden der Nachricht." },
      { status: 500 }
    );
  }
}
