import { LoginForm } from './LoginForm'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>
}) {
  const { from } = await searchParams

  return (
    <div className="flex min-h-screen items-center justify-center bg-pt-shell px-4">
      <div className="flex w-full max-w-[544px] overflow-hidden rounded-md border border-pt-lineStrong bg-pt-surface shadow-[0_12px_32px_rgba(28,25,23,0.07)]">
        <div className="flex w-[196px] shrink-0 flex-col justify-between bg-pt-accent p-[26px]">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/15 font-serif text-base text-white">P</span>
          <div>
            <div className="font-serif text-[23px] leading-tight text-white">Project Tracker</div>
            <p className="mt-2 text-[12.5px] leading-relaxed text-white/75">Chi ha chiesto cosa, chi lo porta avanti, cosa manca.</p>
          </div>
        </div>
        <div className="flex-1 p-[30px]">
          <h1 className="mb-5 font-serif text-[22px] font-medium text-pt-ink">Accedi</h1>
          <LoginForm redirectTo={from ?? '/'} />
          <p className="mt-6 text-xs leading-relaxed text-pt-faint">
            Primo accesso o password dimenticata? Chiedi a un amministratore di generarti un link per impostarla.
          </p>
        </div>
      </div>
    </div>
  )
}
