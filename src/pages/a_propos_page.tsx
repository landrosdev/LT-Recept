import { Code, Heart, Github, Mail, Globe, Award } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export default function AProposPage() {
  return (
    <div className="space-y-6 page-enter max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-none bg-primary text-white shadow-lg">
            <span className="text-3xl font-bold">LT</span>
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">LT-Recep</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Logiciel de gestion de la réception hôtel
          </p>
        </div>
        <Badge variant="secondary" className="rounded-none text-base px-4 py-1">
          Version 1.0.0
        </Badge>
      </div>

      <Separator className="my-8" />

      {/* Développeur */}
      <Card className="rounded-none border shadow-sm">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Code className="size-8" />
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-2">Développeur</h2>
              <p className="text-2xl font-bold text-primary">
                RADIMSON Landrosse
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              <Badge variant="outline" className="rounded-none px-4 py-2 text-sm">
                <Award className="size-4 mr-2" />
                Développeur Fullstack
              </Badge>
              <Badge variant="outline" className="rounded-none px-4 py-2 text-sm">
                <Globe className="size-4 mr-2" />
                Développeur Mobile
              </Badge>
            </div>

            <p className="text-muted-foreground max-w-lg mx-auto">
              Développeur passionné avec expertise en développement web et mobile. 
              Spécialisé dans la création de solutions logicielles sur mesure pour 
              les entreprises et organisations.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Technologies */}
      <Card className="rounded-none border shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-center">Technologies utilisées</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-muted/50 rounded-none">
              <p className="font-medium">React</p>
              <p className="text-xs text-muted-foreground">Frontend</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-none">
              <p className="font-medium">Tauri</p>
              <p className="text-xs text-muted-foreground">Desktop</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-none">
              <p className="font-medium">Rust</p>
              <p className="text-xs text-muted-foreground">Backend</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-none">
              <p className="font-medium">SQLite</p>
              <p className="text-xs text-muted-foreground">Database</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center space-y-4 pt-4">
        <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
          <span>Fait avec</span>
          <Heart className="size-4 text-rose-500 fill-rose-500" />
          <span>à Madagascar</span>
        </div>
        
        <p className="text-sm text-muted-foreground">
          © 2026 LT-Recep. Tous droits réservés.
        </p>

        <div className="flex justify-center gap-4 pt-2">
          <a 
            href="mailto:contact@lt-recep.mg" 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <Mail className="size-4" />
            Contact
          </a>
          <a 
            href="#" 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <Github className="size-4" />
            GitHub
          </a>
        </div>
      </div>
    </div>
  )
}
