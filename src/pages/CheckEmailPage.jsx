import { Link, useLocation } from "react-router-dom";

export default function CheckEmailPage() {
  const location = useLocation();
  const email = location.state?.email;

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-[0_12px_32px_-4px_rgba(25,28,29,0.06)] p-8 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-fixed text-primary">
          <span className="material-symbols-outlined text-3xl">mark_email_unread</span>
        </div>
        <h1 className="text-3xl font-headline font-bold mb-3">Check your email</h1>
        <p className="text-on-surface-variant mb-2">
          We sent a confirmation link{email ? ` to ${email}` : ""}. Open the email and click the link to verify your account.
        </p>
        <p className="text-sm text-on-surface-variant mb-8">
          After verification, you&apos;ll see a confirmation page before continuing to the app.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link className="bg-signature-gradient text-white px-6 py-3 rounded-full font-bold" to="/login">
            Go to Login
          </Link>
          <Link className="bg-surface-container-high text-on-surface px-6 py-3 rounded-full font-bold" to="/">
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}