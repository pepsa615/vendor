import type { ReactNode } from "react";

export function BrandLogo({
  className = "h-10 w-auto",
}: {
  className?: string;
}) {
  return (
    <a href="/" aria-label="Pepsa Vendor home">
      <img className={className} src="/pepsa-wordmark.svg" alt="Pepsa" />
    </a>
  );
}

export function AuthShell({
  children,
  contentClassName = "max-w-[29.5rem]",
}: {
  children: ReactNode;
  contentClassName?: string;
}) {
  return (
    <div className="grid min-h-screen w-full bg-white lg:grid-cols-[47%_53%]">
      <section className="flex min-h-screen flex-col px-6 py-8 sm:px-12 lg:px-[5.25rem] lg:py-[5.5rem]">
        <BrandLogo className="h-7 w-auto" />
        <div className={`my-auto w-full py-8 ${contentClassName}`}>
          {children}
        </div>
      </section>
      <aside
        className="hidden min-h-screen overflow-hidden bg-brand-50 px-11 py-[6.5rem] lg:flex lg:flex-col"
        aria-label="Logistics illustration"
      >
        <h2 className="text-[2.75rem] font-black leading-[0.98] text-black">
          Logistic Operations
          <br />
          <span className="text-[1.75rem]">made easy</span>
        </h2>
        <img
          className="my-auto max-h-[70vh] w-full object-contain object-center"
          src="/vendor-logistics.png"
          alt="Delivery trucks, car, tricycle, and motorcycle"
        />
      </aside>
    </div>
  );
}
export function StepProgress({
  current,
  total = 4,
}: {
  current: number;
  total?: number;
}) {
  return (
    <ol
      className="mb-8 flex max-w-sm items-center"
      aria-label={`Step ${current} of ${total}`}
    >
      {Array.from({ length: total }, (_, index) => (
        <li key={index} className="flex flex-1 items-center last:flex-none">
          <span
            className={`grid size-8 place-items-center rounded-full border text-sm ${index + 1 <= current ? "border-brand bg-brand text-white" : "border-brand text-brand"}`}
          >
            {index + 1}
          </span>
          {index + 1 < total && (
            <span className="mx-1 h-px flex-1 border-t border-dashed border-brand" />
          )}
        </li>
      ))}
    </ol>
  );
}
