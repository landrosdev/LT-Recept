import { useMemo, useState } from "react"
import { Check, ChevronDown, Plus, CreditCard, Banknote, QrCode, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const paiementsPredefinis = [
  { value: "CARTE", label: "Carte bancaire", icon: CreditCard },
  { value: "ESPECES", label: "Espèces", icon: Banknote },
  { value: "MOBILE_MONEY", label: "Mobile Money", icon: QrCode },
]

interface PaymentSelectorProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function PaymentSelector({ value, onChange, disabled }: PaymentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [customPayment, setCustomPayment] = useState("")

  const selected = useMemo(
    () => paiementsPredefinis.find((p) => p.value === value) ?? null,
    [value]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return paiementsPredefinis
    return paiementsPredefinis.filter((p) =>
      p.label.toLowerCase().includes(q)
    )
  }, [search])

  function handleSelect(paymentValue: string) {
    onChange(paymentValue)
    setIsOpen(false)
    setSearch("")
  }

  function handleCustomCreate() {
    if (customPayment.trim()) {
      onChange(customPayment.trim())
      setIsOpen(false)
      setSearch("")
      setCustomPayment("")
      setIsCreating(false)
    }
  }

  function clearSelection() {
    onChange("")
  }

  return (
    <>
      {/* Display selected payment or selector button */}
      {selected || value ? (
        <div className="flex items-center gap-2 rounded-none border bg-muted/30 px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-none bg-primary/10">
            {selected ? (
              <selected.icon className="size-4 text-primary" />
            ) : (
              <CreditCard className="size-4 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-medium truncate">
              {selected ? selected.label : value}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 rounded-none"
            onClick={clearSelection}
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
          <span className="text-muted-foreground">Sélectionner un paiement...</span>
          <ChevronDown className="size-4" />
        </Button>
      )}

      {/* Selection Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md rounded-none">
          <DialogHeader>
            <DialogTitle>
              {isCreating ? "Ajouter un paiement" : "Méthode de paiement"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Sélectionnez ou créez une méthode de paiement personnalisée.
            </DialogDescription>
          </DialogHeader>

          {!isCreating ? (
            <>
              <div className="relative">
                <Input
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="rounded-none"
                  autoFocus
                />
              </div>

              <div className="max-h-64 overflow-auto border">
                {filtered.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    <p>Aucune méthode trouvée</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2 rounded-none"
                      onClick={() => {
                        setIsCreating(true)
                        setCustomPayment(search)
                      }}
                    >
                      <Plus className="size-4 mr-1" />
                      Ajouter "{search}"
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filtered.map((p) => {
                      const Icon = p.icon
                      return (
                        <button
                          key={p.value}
                          type="button"
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-3 text-left hover:bg-muted transition-colors",
                            value === p.value && "bg-primary/5"
                          )}
                          onClick={() => handleSelect(p.value)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-none bg-primary/10">
                              <Icon className="size-4 text-primary" />
                            </div>
                            <span className="font-medium">{p.label}</span>
                          </div>
                          {value === p.value && (
                            <Check className="size-4 text-primary" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <Separator />

              <Button
                type="button"
                variant="outline"
                className="w-full rounded-none"
                onClick={() => setIsCreating(true)}
              >
                <Plus className="size-4 mr-2" />
                Autre méthode
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Méthode de paiement</label>
                  <Input
                    value={customPayment}
                    onChange={(e) => setCustomPayment(e.target.value)}
                    placeholder="Ex: Chèque, PayPal, etc."
                    className="rounded-none"
                    autoFocus
                  />
                </div>
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 rounded-none"
                  onClick={() => {
                    setIsCreating(false)
                    setCustomPayment("")
                  }}
                >
                  Retour
                </Button>
                <Button
                  type="button"
                  className="flex-1 rounded-none"
                  onClick={handleCustomCreate}
                  disabled={!customPayment.trim()}
                >
                  Ajouter
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
