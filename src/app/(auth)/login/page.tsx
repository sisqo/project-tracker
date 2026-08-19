import { LoginForm } from './LoginForm'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>
}) {
  const { from } = await searchParams

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-xl font-semibold text-slate-900">Project Tracker</h1>
        <LoginForm redirectTo={from ?? '/'} />
        <p className="mt-6 text-xs text-slate-500">
          Password dimenticata o primo accesso? Chiedi a un amministratore di generarti un link
          per impostarla.
        </p>
      </div>
    </div>
  )
}
