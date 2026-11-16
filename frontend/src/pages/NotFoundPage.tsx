import { ButtonLink } from "@/components/ui/primitives";

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-start justify-center px-4">
      <p className="eyebrow mb-3">404</p>
      <h1 className="page-title">This page doesn't exist.</h1>
      <ButtonLink to="/" variant="secondary" className="mt-8">
        Go to the start
      </ButtonLink>
    </div>
  );
}
