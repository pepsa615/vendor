import { ThumbsUp } from "lucide-react";
import { Button } from "../components/ui/index.ts";
export default function ThankYouPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-white p-6 text-center">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-panel p-8 shadow-soft sm:p-12">
        <h1 className="text-3xl font-black tracking-tight">
          Thanks for signing up!
        </h1>
        <span className="mx-auto my-8 grid size-32 place-items-center rounded-full bg-warning-50">
          <ThumbsUp className="size-20 text-warning-700" />
        </span>
        <p className="text-sm leading-6 text-muted">
          Your onboarding application has been submitted for review. We’ll
          notify you when a decision is available.
        </p>
        <Button
          className="mt-10 w-full"
          onClick={() => {
            location.href = "/login";
          }}
        >
          Login
        </Button>
      </div>
    </main>
  );
}
