import {
  ArrowRight,
  CheckCircle2,
  Coffee,
  Eye,
  EyeOff,
  Lock,
  Mail,
} from "lucide-react"
import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { Navigate, useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { Logo, LogoMark } from "@/components/layout/logo"
import { LanguageToggle } from "@/components/shared/language-toggle"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { apiErrorMessage } from "@/lib/errors"
import { authApi } from "@/lib/api"
import { useAuthStore } from "@/stores/auth"

const demoAccounts = [
  { role: "admin", email: "admin@posbrew.test", password: "admin123" },
  { role: "cashier", email: "cashier@posbrew.test", password: "cashier123" },
] as const

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const token = useAuthStore((state) => state.token)
  const setSession = useAuthStore((state) => state.setSession)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  if (token) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError("")

    if (!email.trim() || !password) {
      setError(t("validation.required"))
      return
    }

    setSubmitting(true)
    try {
      const session = await authApi.login({ email, password })
      setSession(session.token, session.user)
      toast.success(t("auth.loginSuccess"))
      navigate(session.user.role?.name === "admin" ? "/" : "/pos", {
        replace: true,
      })
    } catch (caught) {
      setError(apiErrorMessage(caught, t))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-espresso px-12 py-10 text-cream lg:flex lg:flex-col xl:px-16">
        <img
          src="/brand/cafe-interior.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full scale-105 object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-espresso via-espresso/90 to-[#120c09]/95" />
        <div className="absolute inset-0 bg-grain opacity-25" />
        <div className="absolute -right-24 top-24 h-80 w-80 rounded-full bg-amber/20 blur-3xl" />

        <div className="relative z-10">
          <Logo tone="light" />
        </div>

        <div className="relative z-10 my-auto max-w-xl py-14">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-amber backdrop-blur-sm">
            <Coffee className="h-3.5 w-3.5" strokeWidth={1.8} />
            Coffee POS
          </p>
          <p className="font-display text-[clamp(3rem,4.4vw,4.35rem)] font-semibold leading-[0.98] tracking-[-0.03em]">
            Brew better
            <br />
            business.
          </p>
          <p className="mt-6 max-w-md text-base leading-relaxed text-cream/60">
            {t("auth.brandSub")}
          </p>

          <div className="mt-10 max-w-md space-y-2.5">
            {[
              t("auth.brandPoint1"),
              t("auth.brandPoint2"),
              t("auth.brandPoint3"),
            ].map((point) => (
              <div
                key={point}
                className="flex items-start gap-3 rounded-[0.85rem] border border-white/[0.08] bg-white/[0.04] px-3.5 py-3 text-[0.85rem] leading-snug text-cream/75 backdrop-blur-sm"
              >
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-amber"
                  strokeWidth={1.8}
                />
                {point}
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-5 text-[0.7rem] text-cream/55">
          <span>POSBrew © 2026</span>
          <span className="uppercase tracking-[0.2em]">From bean to cup</span>
        </div>
      </section>

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10 sm:px-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_420px_at_80%_0%,rgba(208,138,78,0.09),transparent_65%)]" />
        <div className="absolute right-5 top-5 z-10">
          <LanguageToggle />
        </div>

        <div className="relative w-full max-w-[26rem]">
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <LogoMark className="h-14 w-14" />
            <p className="mt-3 font-brand text-[1.75rem] font-semibold tracking-[-0.02em]">
              POS<span className="text-caramel">Brew</span>
            </p>
          </div>

          <div className="mb-7">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-caramel">
              {t("auth.signIn")}
            </p>
            <h1 className="mt-2.5 font-display text-[2.65rem] font-semibold leading-[1.05] tracking-[-0.025em] text-espresso">
              {t("auth.welcome")}
            </h1>
            <p className="mt-2.5 text-[0.95rem] leading-relaxed text-muted">
              {t("auth.subtitle")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label={t("auth.email")} htmlFor="email" required>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" strokeWidth={1.8} />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={t("auth.emailPlaceholder")}
                  className="pl-11"
                />
              </div>
            </Field>

            <Field label={t("auth.password")} htmlFor="password" required>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" strokeWidth={1.8} />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={t("auth.passwordPlaceholder")}
                  className="pl-11 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-[0.6rem] p-2 text-muted transition hover:bg-cream hover:text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel/40"
                  aria-label={
                    showPassword ? t("auth.hidePassword") : t("auth.showPassword")
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </Field>

            {error && (
              <div className="rounded-[0.8rem] border border-danger/20 bg-danger/5 px-3.5 py-3 text-sm font-medium text-danger">
                {error}
              </div>
            )}

            <Button type="submit" size="lg" loading={submitting} className="w-full">
              {submitting ? t("auth.signingIn") : t("auth.signIn")}
              {!submitting && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          <div className="mt-7 rounded-[1.1rem] border border-border/80 bg-surface/80 p-4 shadow-card backdrop-blur-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted">
                {t("auth.demoTitle")}
              </p>
              <span className="text-[0.7rem] text-muted/80">{t("auth.demoHint")}</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.role}
                  type="button"
                  onClick={() => {
                    setEmail(account.email)
                    setPassword(account.password)
                    setError("")
                  }}
                  className="rounded-[0.8rem] border border-border bg-cream/50 px-3 py-2.5 text-left transition hover:border-caramel/30 hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel/40"
                >
                  <p className="text-[0.7rem] font-bold uppercase tracking-[0.08em] text-caramel">
                    {t(`auth.${account.role}`)}
                  </p>
                  <p className="mt-1.5 truncate text-[0.78rem] font-medium text-espresso">
                    {account.email}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">{account.password}</p>
                </button>
              ))}
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-muted">{t("app.tagline")}</p>
        </div>
      </section>
    </div>
  )
}
