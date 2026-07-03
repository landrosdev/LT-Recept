import { Code, Heart, Github, Mail, Award, Phone, ExternalLink } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function AProposPage() {
  return (
    <div className="h-[calc(100vh-140px)] flex flex-col justify-center items-center page-enter overflow-hidden px-4">
      <div className="max-w-4xl w-full space-y-4">
        {/* Header Compact */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center bg-primary text-white shadow-lg rounded-xl rotate-3 hover:rotate-0 transition-transform duration-300">
              <span className="text-2xl font-black">{import.meta.env.VITE_APP_INITIALS}</span>
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter">{import.meta.env.VITE_APP_NAME}</h1>
            <p className="text-sm text-muted-foreground font-medium">
              Système de Gestion Hôtelière Intelligent
            </p>
          </div>
          <Badge variant="outline" className="px-3 border-primary/30 text-primary bg-primary/5">
            Version 1.0.0 Stable
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Développeur */}
          <Card className="border-none bg-muted/30 shadow-none">
            <CardContent className="p-5 flex flex-col items-center text-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Code className="size-6" />
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-1">Développeur</h2>
                <p className="text-xl font-black text-foreground">
                  RADIMSON Landrosse
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-1.5">
                <Badge variant="secondary" className="text-[10px] font-bold">Fullstack Expert</Badge>
                <Badge variant="secondary" className="text-[10px] font-bold">Mobile Dev</Badge>
              </div>
              <div className="space-y-1 w-full pt-2">
                <a href="tel:+261332061033" className="flex items-center justify-center gap-2 text-xs font-medium hover:text-primary transition-colors py-1.5 bg-background rounded-lg border">
                  <Phone className="size-3" /> +261 33 20 610 33
                </a>
                <a href="mailto:landros001t@gmail.com" className="flex items-center justify-center gap-2 text-xs font-medium hover:text-primary transition-colors py-1.5 bg-background rounded-lg border">
                  <Mail className="size-3" /> landros001t@gmail.com
                </a>
                <a href="https://github.com/landrosdev" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 text-xs font-medium hover:text-primary transition-colors py-1.5 bg-background rounded-lg border">
                  <Github className="size-3" /> github.com/landrosdev <ExternalLink className="size-2 opacity-50" />
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Technologies & Stack */}
          <Card className="border-none bg-primary/5 shadow-none">
            <CardContent className="p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-primary text-center">Stack Technique</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-background rounded-xl border border-primary/10 text-center">
                  <p className="text-sm font-black">React 19</p>
                  <p className="text-[9px] text-muted-foreground uppercase font-bold">Interface UI</p>
                </div>
                <div className="p-2.5 bg-background rounded-xl border border-primary/10 text-center">
                  <p className="text-sm font-black">Tauri 2</p>
                  <p className="text-[9px] text-muted-foreground uppercase font-bold">Desktop Engine</p>
                </div>
                <div className="p-2.5 bg-background rounded-xl border border-primary/10 text-center">
                  <p className="text-sm font-black">Rust</p>
                  <p className="text-[9px] text-muted-foreground uppercase font-bold">Core Logic</p>
                </div>
                <div className="p-2.5 bg-background rounded-xl border border-primary/10 text-center">
                  <p className="text-sm font-black">SQLite</p>
                  <p className="text-[9px] text-muted-foreground uppercase font-bold">Persistence</p>
                </div>
              </div>
              <div className="bg-primary/10 p-3 rounded-xl border border-primary/20">
                <div className="flex items-center gap-2 text-[10px] font-bold text-primary italic">
                  <Award className="size-3" /> Performance Maximale & Sécurité Native
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Minimalist */}
        <div className="text-center space-y-2 pt-2">
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-muted-foreground">
            <span>Fait avec</span>
            <Heart className="size-3 text-rose-500 fill-rose-500 animate-pulse" />
            <span>à Madagascar par landrosdev</span>
          </div>
          <p className="text-[9px] text-muted-foreground/60 font-medium">
            © 2026 {import.meta.env.VITE_APP_NAME}. Tous droits réservés. Produit distribué sous licence commerciale.
          </p>
        </div>
      </div>
    </div>
  )
}
