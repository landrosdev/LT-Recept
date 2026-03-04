import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Settings, Globe, Coins, Save, Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useTheme } from "@/components/theme-provider"

interface AppSettings {
  language: "fr" | "en" | "mg"
  currency: "XOF" | "EUR" | "USD" | "MGA"
  notifications: boolean
  autoBackup: boolean
}

const currencies = [
  { value: "XOF", label: "FCFA (XOF) - Franc CFA", symbol: "FCFA" },
  { value: "EUR", label: "€ (EUR) - Euro", symbol: "€" },
  { value: "USD", label: "$ (USD) - Dollar US", symbol: "$" },
  { value: "MGA", label: "Ar (MGA) - Ariary", symbol: "Ar" },
]

const languages = [
  { value: "fr", label: "Français", flag: "🇫🇷" },
  { value: "en", label: "English", flag: "🇬🇧" },
  { value: "mg", label: "Malagasy", flag: "🇲🇬" },
]

export default function ParametresPage() {
  const { theme, setTheme } = useTheme()
  const [settings, setSettings] = useState<AppSettings>({
    language: "fr",
    currency: "XOF",
    notifications: true,
    autoBackup: false,
  })
  const [isSaving, setIsSaving] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("app-settings")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Filter out theme from parsed settings if it exists from old version
        const { theme: _ignored, ...rest } = parsed as any
        setSettings(prev => ({ ...prev, ...rest }))
      } catch (e) {
        console.error("Failed to parse settings", e)
      }
    }
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Save to localStorage
      localStorage.setItem("app-settings", JSON.stringify(settings))
      
      toast.success("Paramètres enregistrés avec succès")
    } catch (e) {
      console.error(e)
      toast.error("Erreur lors de l'enregistrement")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-none bg-primary/10 text-primary">
            <Settings className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
            <p className="text-sm text-muted-foreground">
              Configuration de l'application
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="gap-2 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 rounded-none"
        >
          <Save className="size-4" />
          {isSaving ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Paramètres régionaux */}
        <Card className="rounded-none border shadow-sm">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <Globe className="size-5 text-primary" />
              <CardTitle className="text-lg">Paramètres régionaux</CardTitle>
            </div>
            <CardDescription>
              Langue et devise par défaut
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Langue */}
            <div className="space-y-2">
              <Label htmlFor="language" className="text-sm font-medium">
                Langue de l'interface
              </Label>
              <Select
                value={settings.language}
                onValueChange={(v) => setSettings(prev => ({ ...prev, language: v as AppSettings["language"] }))}
              >
                <SelectTrigger id="language" className="rounded-none">
                  <SelectValue placeholder="Sélectionner une langue" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      <span className="mr-2">{lang.flag}</span>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Devise */}
            <div className="space-y-2">
              <Label htmlFor="currency" className="text-sm font-medium">
                Devise par défaut
              </Label>
              <Select
                value={settings.currency}
                onValueChange={(v) => setSettings(prev => ({ ...prev, currency: v as AppSettings["currency"] }))}
              >
                <SelectTrigger id="currency" className="rounded-none">
                  <SelectValue placeholder="Sélectionner une devise" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  {currencies.map((curr) => (
                    <SelectItem key={curr.value} value={curr.value}>
                      {curr.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Cette devise sera utilisée par défaut pour toutes les factures et transactions.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Apparence */}
        <Card className="rounded-none border shadow-sm">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center gap-2">
              {theme === "dark" ? (
                <Moon className="size-5 text-primary" />
              ) : (
                <Sun className="size-5 text-primary" />
              )}
              <CardTitle className="text-lg">Apparence</CardTitle>
            </div>
            <CardDescription>
              Personnalisez l'apparence de l'application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Thème */}
            <div className="space-y-2">
              <Label htmlFor="theme" className="text-sm font-medium">
                Thème
              </Label>
              <Select
                value={theme}
                onValueChange={(v) => setTheme(v as "light" | "dark" | "system")}
              >
                <SelectTrigger id="theme" className="rounded-none">
                  <SelectValue placeholder="Sélectionner un thème" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="light">
                    <span className="flex items-center gap-2">
                      <Sun className="size-4" />
                      Clair
                    </span>
                  </SelectItem>
                  <SelectItem value="dark">
                    <span className="flex items-center gap-2">
                      <Moon className="size-4" />
                      Sombre
                    </span>
                  </SelectItem>
                  <SelectItem value="system">
                    <span className="flex items-center gap-2">
                      <Settings className="size-4" />
                      Système
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Options avancées */}
        <Card className="rounded-none border shadow-sm lg:col-span-2">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <Coins className="size-5 text-primary" />
              <CardTitle className="text-lg">Options avancées</CardTitle>
            </div>
            <CardDescription>
              Paramètres additionnels de l'application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications" className="text-sm font-medium">
                  Notifications
                </Label>
                <p className="text-xs text-muted-foreground">
                  Activer les notifications pour les arrivées et départs
                </p>
              </div>
              <Switch
                id="notifications"
                checked={settings.notifications}
                onCheckedChange={(v) => setSettings(prev => ({ ...prev, notifications: v }))}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="autoBackup" className="text-sm font-medium">
                  Sauvegarde automatique
                </Label>
                <p className="text-xs text-muted-foreground">
                  Sauvegarder automatiquement les données chaque jour
                </p>
              </div>
              <Switch
                id="autoBackup"
                checked={settings.autoBackup}
                onCheckedChange={(v) => setSettings(prev => ({ ...prev, autoBackup: v }))}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info de version */}
      <div className="text-center text-sm text-muted-foreground pt-4">
        <p>LT-Recep Version 1.0.0</p>
        <p>© 2024 Tous droits réservés</p>
      </div>
    </div>
  )
}
