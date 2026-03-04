
import { useEffect, useState } from "react"
import { User } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/useAuth"

export default function LoginPage() {
  const { login, isAuthenticated, isLoading, error } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname ?? "/"
  const [nomUser, setNomUser] = useState("")
  const [motDePasse, setMotDePasse] = useState("")

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true })
    }
  }, [isAuthenticated, navigate])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await login({ nomUser, motDePasse })
    navigate(from, { replace: true })
  }

  return (
    <div className="min-h-svh w-full bg-primary">
      <div className="relative flex min-h-svh w-full items-center justify-center overflow-hidden px-4 py-12">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary to-primary/80" />
        <div className="pointer-events-none absolute inset-0 bg-black/30" />

        <div className="relative w-full max-w-5xl">
          <div className="relative flex w-full items-center justify-center">
            <div className="relative hidden h-[340px] w-[380px] shrink-0 bg-primary/65 text-primary-foreground shadow-xl lg:block lg:mr-[-44px]">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-16 -top-16 size-60 rotate-12 bg-primary-foreground/10" />
                <div className="absolute left-24 top-20 size-24 bg-primary-foreground/10" />
              </div>

              <div className="absolute bottom-8 left-8 text-xl font-medium tracking-wide">
                Connexion utilisateur
              </div>
            </div>

            <Card className="relative z-10 w-full max-w-[380px] flex-none rounded-none border-border/30 bg-card shadow-2xl md:w-[380px] md:max-w-none lg:-translate-y-6 lg:scale-[1.03] page-enter">
              <CardHeader className="items-center text-center">
                <div className="flex size-12 items-center justify-center text-primary">
                  <User className="size-10" />
                </div>
                <CardTitle className="mt-2 text-2xl font-medium">Connexion</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={onSubmit} className="space-y-4">
                  <Input
                    value={nomUser}
                    onChange={(e) => setNomUser(e.target.value)}
                    placeholder="Nom d'utilisateur"
                    autoComplete="username"
                  />
                  <Input
                    value={motDePasse}
                    onChange={(e) => setMotDePasse(e.target.value)}
                    placeholder="Mot de passe"
                    type="password"
                    autoComplete="current-password"
                  />

                  {error ? (
                    <div className="text-sm text-destructive">{error}</div>
                  ) : null}

                  <Button type="submit" disabled={isLoading} className="h-11 w-full rounded-none">
                    {isLoading ? "Connexion..." : "Se connecter"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="relative hidden h-[340px] w-[380px] shrink-0 bg-primary-foreground/90 shadow-xl lg:block lg:ml-[-44px]">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute right-12 top-12 size-24 rounded-full bg-primary/10" />
                <div className="absolute right-24 top-28 size-16 rounded-full bg-primary/10" />
                <div className="absolute bottom-10 right-10 h-20 w-2 bg-primary/10" />
                <div className="absolute bottom-10 right-16 h-28 w-2 bg-primary/10" />
                <div className="absolute bottom-10 right-24 h-16 w-2 bg-primary/10" />
              </div>

              <div className="absolute bottom-8 left-8 text-xl font-medium tracking-wide text-primary">
                LT-RECPT
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <button
              type="button"
              className="text-xs font-medium text-primary-foreground/80 hover:text-primary-foreground"
            >
              Basculer vers la connexion projet
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
