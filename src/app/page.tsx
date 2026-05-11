import Image from 'next/image'
import Link from 'next/link'

const homeActions = [
  {
    label: 'Open Map',
    href: '/map',
    variant: 'primary',
  },
  {
    label: 'Open Dashboard',
    href: '/dashboard',
    variant: 'secondary',
  },
]

const actionStyles = {
  primary:
    'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20 hover:bg-cyan-400',
  secondary:
    'border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-soft)]',
}

function HomeActionLink({
  href,
  label,
  variant,
}: {
  href: string
  label: string
  variant: keyof typeof actionStyles
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-6 py-3 text-center font-semibold transition ${actionStyles[variant]}`}
    >
      {label}
    </Link>
  )
}

function AnchorHeroImage() {
  return (
    <div className="mt-12 flex aspect-square w-full max-w-[320px] items-center justify-center rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-10 shadow-2xl shadow-cyan-950/20">
      <Image
        src="/anchor.svg"
        alt="Anchor"
        width={220}
        height={220}
        priority
        className="drop-shadow-2xl"
      />
    </div>
  )
}

// Renders the centered homepage with the main app actions.
export default function HomePage() {
  return (
    <main className="flex min-h-[calc(100vh-73px)] items-center justify-center px-6 py-12">
      <section className="flex w-full max-w-4xl flex-col items-center text-center">
        <h1 className="text-4xl font-bold leading-tight tracking-normal md:text-6xl">
          Ship Monitoring Dashboard
        </h1>

        <AnchorHeroImage />

        <div className="mt-10 flex w-full max-w-md flex-col justify-center gap-3 sm:flex-row">
          {homeActions.map((action) => (
            <HomeActionLink
              key={action.href}
              href={action.href}
              label={action.label}
              variant={action.variant as keyof typeof actionStyles}
            />
          ))}
        </div>
      </section>
    </main>
  )
}
