// Imports the optimized Next.js Image component so local images load efficiently
// and keep a stable layout while they are being rendered.
import Image from 'next/image'

// Imports the Next.js Link component so internal page changes use fast
// client-side navigation instead of a full browser refresh.
import Link from 'next/link'

// Defines the two actions that will appear as buttons on the homepage.
// Keeping the button data in an array lets us render them with one map call
// instead of writing nearly identical JSX twice.
const homeActions = [
  {
    // Text shown to the user inside the first button.
    label: 'Open Map',
    // Route that opens the live map page.
    href: '/map',
    // Visual style key used to choose the matching classes below.
    variant: 'primary',
  },
  {
    // Text shown to the user inside the second button.
    label: 'Open Dashboard',
    // Route that opens the analytics dashboard page.
    href: '/dashboard',
    // Uses the secondary visual style so it looks less emphasized.
    variant: 'secondary',
  },
]

// Stores the reusable Tailwind class strings for each button variant.
// This keeps the styling rules in one place and lets the link component
// choose the correct appearance by reading actionStyles[variant].
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
  // Destination route that this reusable link should open.
  href: string
  // Visible text rendered inside the button-like link.
  label: string
  // Restricts the prop to keys that really exist in actionStyles.
  variant: keyof typeof actionStyles
}) {
  return (
    <Link
      // Sends the user to the selected internal route when clicked.
      href={href}
      // Combines shared button classes with the variant-specific classes.
      className={`rounded-full px-6 py-3 text-center font-semibold transition ${actionStyles[variant]}`}
    >
      {/* Renders the text received from the parent component. */}
      {label}
    </Link>
  )
}

// Renders the visual hero card that contains the decorative anchor image.
// It is extracted into its own component to keep the main page component
// easier to scan and to make the image block reusable if needed later.
function AnchorHeroImage() {
  return (
    // Creates the rounded card that visually frames the anchor image.
    <div className="mt-12 flex aspect-square w-full max-w-[320px] items-center justify-center rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-10 shadow-2xl shadow-cyan-950/20">
      <Image
        // Loads the anchor asset from the public folder.
        src="/anchor.svg"
        // Describes the image for screen readers and accessibility tools.
        alt="Anchor"
        // Defines the rendered width and helps Next.js reserve the right space.
        width={220}
        // Defines the rendered height and prevents layout shift while loading.
        height={220}
        // Loads this image earlier because it appears immediately on the page.
        priority
        // Adds a strong shadow so the icon stands out from the card background.
        className="drop-shadow-2xl"
      />
    </div>
  )
}

// This is the default export for app/page.tsx, so Next.js renders it at "/".
// The component builds the complete homepage layout shown to the user.
export default function HomePage() {
  return (
    // Centers the homepage content vertically and horizontally in the viewport.
    <main className="flex min-h-[calc(100vh-73px)] items-center justify-center px-6 py-12">
      {/* Groups the title, hero image, and action buttons into one centered column. */}
      <section className="flex w-full max-w-4xl flex-col items-center text-center">
        {/* Main heading that tells the user what the application is. */}
        <h1 className="text-4xl font-bold leading-tight tracking-normal md:text-6xl">
          Ship Monitoring Dashboard
        </h1>

        {/* Displays the decorative hero image underneath the title. */}
        <AnchorHeroImage />

        {/* 
          Holds the homepage actions.
          On small screens they stack vertically; on larger screens they sit side by side.
        */}
        <div className="mt-10 flex w-full max-w-md flex-col justify-center gap-3 sm:flex-row">
          {/* Loops through the action configuration and renders one reusable link per item. */}
          {homeActions.map((action) => (
            <HomeActionLink
              // Gives React a stable identifier for list rendering.
              key={action.href}
              // Passes the route destination from this action object.
              href={action.href}
              // Passes the visible text that should appear inside the button.
              label={action.label}
              // Selects the correct visual style from actionStyles.
              variant={action.variant as keyof typeof actionStyles}
            />
          ))}
        </div>
      </section>
    </main>
  )
}
