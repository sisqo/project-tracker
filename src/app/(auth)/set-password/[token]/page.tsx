import { checkPasswordSetToken } from '@/lib/auth/password-reset'

import { SetPasswordForm } from './SetPasswordForm'

export default async function SetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const check = await checkPasswordSetToken(token)

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-xl font-semibold text-slate-900">Imposta la tua password</h1>
        {check.valid ? (
          <SetPasswordForm token={token} />
        ) : (
          <p className="text-sm text-red-600">
            Questo link non è più valido: è già stato usato, è scaduto, oppure non esiste. Chiedi a
            un amministratore di generartene uno nuovo.
          </p>
        )}
      </div>
    </div>
  )
}
