import { Link } from "react-router-dom";
import { BrandLogo } from "../components/shared/AuthShell.tsx";
import { TERMS_HTML, TERMS_TITLE } from "../content/terms.ts";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-neutral-100 px-6 py-5 sm:px-12 lg:px-[5.25rem]">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <BrandLogo className="h-7 w-auto" />
          <Link className="text-sm font-semibold text-brand" to="/login">
            Back to login
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-10 sm:px-12 lg:px-0 lg:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          Legal
        </p>
        <h1 className="mt-3 text-[2rem] font-bold leading-tight tracking-tight">
          {TERMS_TITLE}
        </h1>
        <article
          className="prose prose-neutral mt-8 max-w-none text-sm leading-7 text-neutral-800 [&_h3]:mt-8 [&_h3]:text-base [&_h3]:font-bold [&_h4]:mt-5 [&_h4]:text-sm [&_h4]:font-semibold [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5"
          dangerouslySetInnerHTML={{ __html: TERMS_HTML }}
        />
        <p className="mt-10 text-sm text-muted">
          Questions?{" "}
          <Link className="font-semibold text-brand" to="/register">
            Create an account
          </Link>{" "}
          or{" "}
          <Link className="font-semibold text-brand" to="/login">
            sign in
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
