import { useMemo, useState } from "react"
import { Check, ChevronDown, Plus, Search, User, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { Client } from "@/services/Client_service"

interface ClientSelectorProps {
  clients: Client[]
  selectedId: number | null
  onSelect: (clientId: number) => void
  onCreateNew: (client: { nom: string; prenom: string; telephone: string; email: string }) => Promise<number>
  disabled?: boolean
}

export function ClientSelector({
  clients,
  selectedId,
  onSelect,
  onCreateNew,
  disabled,
}: ClientSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Form fields for new client
  const [newNom, setNewNom] = useState("")
  const [newPrenom, setNewPrenom] = useState("")
  const [newTelephone, setNewTelephone] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [createError, setCreateError] = useState<string | null>(null)

  const selectedClient = useMemo(
    () => clients.find((c) => c.id_client === selectedId) ?? null,
    [clients, selectedId]
  )

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return clients
    return clients.filter(
      (c) =>
        c.nom.toLowerCase().includes(q) ||
        (c.prenom ?? "").toLowerCase().includes(q) ||
        (c.telephone ?? "").toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q)
    )
  }, [clients, search])

  function handleSelect(clientId: number) {
    onSelect(clientId)
    setIsOpen(false)
    setSearch("")
  }

  function openCreateMode() {
    setIsCreating(true)
    setNewNom(search)
    setNewPrenom("")
    setNewTelephone("")
    setNewEmail("")
    setCreateError(null)
  }

  function closeCreateMode() {
    setIsCreating(false)
    setCreateError(null)
  }

  async function handleCreateAndSelect() {
    if (!newNom.trim()) {
      setCreateError("Le nom est obligatoire")
      return
    }
    setIsSaving(true)
    setCreateError(null)
    try {
      const newId = await onCreateNew({
        nom: newNom.trim(),
        prenom: newPrenom.trim(),
        telephone: newTelephone.trim(),
        email: newEmail.trim(),
      })
      onSelect(newId)
      setIsOpen(false)
      setIsCreating(false)
      setSearch("")
      setNewNom("")
      setNewPrenom("")
      setNewTelephone("")
      setNewEmail("")
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Erreur lors de la création")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      {/* Display selected client or selector button */}
      {selectedClient ? (
        <div className="flex items-center gap-2 rounded-none border bg-muted/30 px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-none bg-primary/10">
            <User className="size-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">
              {selectedClient.prenom ? `${selectedClient.prenom} ${selectedClient.nom}` : selectedClient.nom}
            </div>
            {selectedClient.telephone && (
              <div className="text-xs text-muted-foreground">{selectedClient.telephone}</div>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 rounded-none"
            onClick={() => onSelect(0)}
            disabled={disabled}
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between rounded-none"
          onClick={() => setIsOpen(true)}
          disabled={disabled}
        >
          <span className="text-muted-foreground">Sélectionner un client...</span>
          <ChevronDown className="size-4" />
        </Button>
      )}

      {/* Selection Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md rounded-none">
          <DialogHeader>
            <DialogTitle>
              {isCreating ? "Nouveau client" : "Sélectionner un client"}
            </DialogTitle>
          </DialogHeader>

          {!isCreating ? (
            <>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un client..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 rounded-none"
                  autoFocus
                />
              </div>

              <div className="max-h-64 overflow-auto border">
                {filteredClients.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    <p>Aucun client trouvé</p>
                    {search && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2 rounded-none"
                        onClick={openCreateMode}
                      >
                        <Plus className="size-4 mr-1" />
                        Créer "{search}"
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredClients.map((c) => (
                      <button
                        key={c.id_client}
                        type="button"
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 text-left hover:bg-muted transition-colors",
                          selectedId === c.id_client && "bg-primary/5"
                        )}
                        onClick={() => handleSelect(c.id_client)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-none bg-primary/10">
                            <User className="size-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">
                              {c.prenom ? `${c.prenom} ${c.nom}` : c.nom}
                            </div>
                            {c.telephone && (
                              <div className="text-xs text-muted-foreground">{c.telephone}</div>
                            )}
                          </div>
                        </div>
                        {selectedId === c.id_client && (
                          <Check className="size-4 text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              <Button
                type="button"
                variant="outline"
                className="w-full rounded-none"
                onClick={openCreateMode}
              >
                <Plus className="size-4 mr-2" />
                Créer un nouveau client
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Nom *</label>
                    <Input
                      value={newNom}
                      onChange={(e) => setNewNom(e.target.value)}
                      placeholder="Dupont"
                      className="rounded-none"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Prénom</label>
                    <Input
                      value={newPrenom}
                      onChange={(e) => setNewPrenom(e.target.value)}
                      placeholder="Jean"
                      className="rounded-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Téléphone</label>
                    <Input
                      value={newTelephone}
                      onChange={(e) => setNewTelephone(e.target.value)}
                      placeholder="0123456789"
                      className="rounded-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="jean@email.com"
                      className="rounded-none"
                    />
                  </div>
                </div>

                {createError && (
                  <div className="text-sm text-destructive">{createError}</div>
                )}
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 rounded-none"
                  onClick={closeCreateMode}
                  disabled={isSaving}
                >
                  Retour
                </Button>
                <Button
                  type="button"
                  className="flex-1 rounded-none"
                  onClick={handleCreateAndSelect}
                  disabled={isSaving}
                >
                  {isSaving ? "Création..." : "Créer et sélectionner"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
