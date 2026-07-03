import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { Settings, Save, Upload, Trash2, Building2, Phone, Mail, Globe2, FileBadge, Hash, Coins, Facebook } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { getConfiguration, updateConfiguration, type Configuration } from "@/services/Configuration_service"

interface AppSettings {
  currency: string
}

const currencies = [
  { value: "MGA", label: "Ar (Ariary Malgache)", symbol: "Ar" },
  { value: "EUR", label: "€ (Euro)", symbol: "€" },
  { value: "USD", label: "$ (Dollar US)", symbol: "$" },
  { value: "XOF", label: "FCFA (Franc CFA)", symbol: "FCFA" },
]

export default function ParametresPage() {
  const [settings, setSettings] = useState<AppSettings>({
    currency: "MGA",
  })
  const [config, setConfig] = useState<Configuration>({
    id: 1,
    nom_hotel: import.meta.env.VITE_APP_NAME,
    logo_path: null,
    adresse: "",
    telephone: "",
    email: "",
    site_web: "",
    rc: "",
    patente: "",
    nif: "",
    stat: "",
    message_perso: "",
    facebook: "",
  })
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      const saved = localStorage.getItem("app-settings")
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setSettings(prev => ({ ...prev, currency: parsed.currency || "MGA" }))
        } catch (e) {
          console.error("Failed to parse settings", e)
        }
      }

      try {
        const c = await getConfiguration()
        setConfig(c)
      } catch (e) {
        console.error("Failed to load config", e)
      }
    }
    load()
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      localStorage.setItem("app-settings", JSON.stringify(settings))
      await updateConfiguration(config)
      toast.success("Paramètres enregistrés avec succès")
    } catch (e) {
      console.error(e)
      toast.error("Erreur lors de l'enregistrement")
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Le logo est trop lourd (max 2Mo)")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      setConfig(prev => ({ ...prev, logo_path: base64 }))
      toast.success("Logo chargé (pensez à enregistrer)")
    }
    reader.readAsDataURL(file)
  }

  const removeLogo = () => {
    setConfig(prev => ({ ...prev, logo_path: null }))
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-primary/10 text-primary">
            <Settings className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
            <p className="text-sm text-muted-foreground">
              Configuration de l'hôtel et de l'application
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="gap-2 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
        >
          <Save className="size-4" />
          {isSaving ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Informations de l'Hôtel */}
        <Card className="border shadow-sm">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <Building2 className="size-5 text-primary" />
              <CardTitle className="text-lg">Informations de l'Hôtel</CardTitle>
            </div>
            <CardDescription>
              Ces informations et le logo apparaîtront sur vos factures (A4 et 80mm)
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Logo Section */}
              <div className="flex flex-col items-center justify-center space-y-4 p-4 border-2 border-dashed rounded-lg bg-muted/10">
                <div className="text-xs font-bold uppercase text-muted-foreground">Logo de l'Hôtel</div>
                <div className="relative group size-32 border bg-card flex items-center justify-center overflow-hidden rounded-md shadow-inner">
                  {config.logo_path ? (
                    <>
                      <img src={config.logo_path} alt="Logo" className="max-h-full max-w-full object-contain" />
                      <button 
                        onClick={removeLogo}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                      >
                        <Trash2 className="size-6" />
                      </button>
                    </>
                  ) : (
                    <Building2 className="size-12 text-muted-foreground/20" />
                  )}
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleLogoUpload} 
                />
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2">
                  <Upload className="size-3" />
                  {config.logo_path ? "Changer le logo" : "Importer un logo"}
                </Button>
                <p className="text-[10px] text-muted-foreground text-center">Format PNG/JPG, Max 2Mo</p>
              </div>

              {/* Basic Info */}
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <Building2 className="size-3" /> Nom de l'Hôtel
                  </Label>
                  <Input 
                    value={config.nom_hotel}
                    onChange={e => setConfig(p => ({ ...p, nom_hotel: e.target.value }))}
                    placeholder={`Ex: ${import.meta.env.VITE_APP_NAME}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <Globe2 className="size-3" /> Adresse
                  </Label>
                  <Input 
                    value={config.adresse || ""}
                    onChange={e => setConfig(p => ({ ...p, adresse: e.target.value }))}
                    placeholder="Ex: Rue 123, Antananarivo"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <Phone className="size-3" /> Téléphone
                  </Label>
                  <Input 
                    value={config.telephone || ""}
                    onChange={e => setConfig(p => ({ ...p, telephone: e.target.value }))}
                    placeholder="+261 ..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <Mail className="size-3" /> Email
                  </Label>
                  <Input 
                    value={config.email || ""}
                    onChange={e => setConfig(p => ({ ...p, email: e.target.value }))}
                    placeholder="contact@hotel.com"
                  />
                </div>
              </div>

              <Separator className="md:col-span-3" />

              {/* Fiscality & Web */}
              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <Globe2 className="size-3" /> Site Web
                  </Label>
                  <Input 
                    value={config.site_web || ""}
                    onChange={e => setConfig(p => ({ ...p, site_web: e.target.value }))}
                    placeholder="https://votre-site.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <FileBadge className="size-3" /> NIF
                  </Label>
                  <Input 
                    value={config.nif || ""}
                    onChange={e => setConfig(p => ({ ...p, nif: e.target.value }))}
                    placeholder="NIF..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <Hash className="size-3" /> STAT
                  </Label>
                  <Input 
                    value={config.stat || ""}
                    onChange={e => setConfig(p => ({ ...p, stat: e.target.value }))}
                    placeholder="STAT..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <Facebook className="size-3" /> Facebook
                  </Label>
                  <Input 
                    value={config.facebook || ""}
                    onChange={e => setConfig(p => ({ ...p, facebook: e.target.value }))}
                    placeholder="Lien ou nom Facebook..."
                  />
                </div>
              </div>

              <Separator className="md:col-span-3" />

              <div className="md:col-span-3 space-y-2">
                <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <FileBadge className="size-3" /> Message personnalisé (Bas de facture A4)
                </Label>
                <Textarea 
                  value={config.message_perso || ""}
                  onChange={e => setConfig(p => ({ ...p, message_perso: e.target.value }))}
                  placeholder="Verset, vœux, ou tout autre message personnel qui apparaîtra en bas de vos factures A4..."
                  className="min-h-[100px] resize-none"
                />
                <p className="text-[10px] text-muted-foreground italic">Ce texte sera affiché en bas de page sur le format A4 uniquement.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Unité monétaire */}
        <Card className="border shadow-sm">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <Coins className="size-5 text-primary" />
              <CardTitle className="text-lg">Unité de l'argent</CardTitle>
            </div>
            <CardDescription>
              Devise utilisée pour les calculs et l'affichage des prix
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="max-w-md space-y-2">
              <Label htmlFor="currency" className="text-sm font-medium">
                Devise par défaut
              </Label>
              <Select
                value={settings.currency}
                onValueChange={(v) => setSettings(prev => ({ ...prev, currency: v }))}
              >
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Sélectionner une devise" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((curr) => (
                    <SelectItem key={curr.value} value={curr.value}>
                      {curr.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info de version */}
      <div className="text-center text-xs text-muted-foreground pt-8 pb-4">
        <p className="font-bold">{import.meta.env.VITE_APP_NAME} v1.0.0</p>
        <p>© 2024 Tous droits réservés</p>
      </div>
    </div>
  )
}
