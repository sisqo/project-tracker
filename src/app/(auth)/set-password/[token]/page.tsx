import { checkPasswordSetToken } from '@/lib/auth/password-reset'

import { SetPasswordForm } from './SetPasswordForm'

export default async function SetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const check = await checkPasswordSetToken(token)

  return (
    <div className="flex min-h-screen items-center justify-center bg-pt-shell px-4">
      <div className="w-full max-w-sm rounded-md border border-pt-lineStrong bg-pt-surface p-8 shadow-[0_12px_32px_rgba(28,25,23,0.07)]">
        <h1 className="mb-6 font-serif text-[22px] font-medium text-pt-ink">Imposta la tua password</h1>
        {check.valid ? (
          <SetPasswordForm token={token} />
        ) : (
          <p className="text-sm text-pt-danger">
            Questo link non è più valido: è già stato usato, è scaduto, oppure non esiste. Chiedi a
            un amministratore di generartene uno nuovo.
          </p>
        )}
      </div>
    </div>
  )
}
