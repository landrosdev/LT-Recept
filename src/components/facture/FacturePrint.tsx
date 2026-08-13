import React from "react"
import { Printer, FileText, Receipt } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import type { Facture } from "@/services/Facture_service"
import type { Configuration } from "@/services/Configuration_service"
import type { Client } from "@/services/Client_service"

import type { Paiement } from "@/services/Paiement_service"
import type { Tarif } from "@/services/Tarif_service"
import { cn } from "@/lib/utils"

interface FacturePrintProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  facture: Facture | null
  config: Configuration | null
  client: Client | null

  paiements: Paiement[]

  sejours?: any[]
  reservations: any[]
  chambres: any[]
  categories: any[]
  tarifs?: Tarif[]
}

type PrintFormat = "A4" | "TICKET"

export function FacturePrint({ open, onOpenChange, facture, config, client, paiements, sejours, reservations, chambres, categories, tarifs = [] }: FacturePrintProps) {
  const [format, setFormat] = React.useState<PrintFormat>("A4")

  const totalPaid = React.useMemo(() => {
    return paiements.reduce((acc, p) => acc + p.montant, 0)
  }, [paiements])

  const remaining = React.useMemo(() => {
    const total = (facture?.montant || 0) - (facture?.remise || 0)
    return Math.max(0, total - totalPaid)
  }, [facture, totalPaid])

  const parseRoomDetails = (chambresIds: string | null) => {
    if (!chambresIds) return [];
    try {
      const parsed = JSON.parse(chambresIds);
      if (Array.isArray(parsed)) return parsed as { id: number; nuits: number; fin: string }[];
    } catch (e) {
      return (chambresIds || "").split(",").filter(Boolean).map(id => ({ id: Number(id), nuits: 0, fin: "" }));
    }
    return [];
  };

  const invoiceItems = React.useMemo(() => {
    if (!facture) return []
    
    const normalize = (s: string) => (s || "").trim().toLowerCase().replace(/\s+/g, ' ');


    if (facture.id_reservation) {
      const r = reservations.find(x => x.id_reservation === facture.id_reservation)
      if (r) {
        const details = parseRoomDetails(r.chambres_ids)
        if (details.length > 0) {
          return details.map(item => {
            const ch = chambres.find(c => c.id_chambre === item.id)
            const cat = categories.find(ct => ct.id_categorie === ch?.id_categorie)
            const nights = item.nuits || r.nombre_nuite
            
            let unitPrice = 0;
            if (cat) {
              const catLib = normalize(cat.libelle);
              const t = tarifs.find(t => t.type_tarif === "CHAMBRE" && normalize(t.nom) === catLib);
              if (t) unitPrice = t.montant;
            }

            if (unitPrice === 0) {
              const totalNights = details.reduce((acc, d) => acc + (d.nuits || r.nombre_nuite), 0);
              unitPrice = totalNights > 0 ? (facture.montant / totalNights) : (facture.montant / details.length);
            }

            return {
              description: `Chambre ${ch?.numero || item.id} (${cat?.libelle || 'Std'})`,
              qte: nights,
              prix: unitPrice,
              total: unitPrice * nights
            }
          })
        }
      }
    }

    return [{
      description: facture.observations || "Prestation hôtelière",
      qte: 1,
      prix: facture.montant,
      total: facture.montant
    }]
  }, [facture, reservations, chambres, categories, tarifs])

  if (!facture || !config) return null

  function handlePrint() {
    window.print()
  }

  function formatMoney(amount: number) {
    let symbol = "Ar"
    try {
      const saved = localStorage.getItem("app-settings")
      if (saved) {
        const c = JSON.parse(saved).currency
        if (c === "EUR") symbol = "€"
        if (c === "USD") symbol = "$"
        if (c === "XOF" || c === "FCFA") symbol = "FCFA"
      }
    } catch(e) {}
    return new Intl.NumberFormat('fr-FR').format(amount) + " " + symbol
  }
  
  function getCurrencyName() {
    let name = "Ariary"
    try {
      const saved = localStorage.getItem("app-settings")
      if (saved) {
        const c = JSON.parse(saved).currency
        if (c === "EUR") name = "Euros"
        if (c === "USD") name = "Dollars"
        if (c === "XOF" || c === "FCFA") name = "Francs CFA"
      }
    } catch(e) {}
    return name
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto rounded-none print:p-0 print:m-0 print:border-none print:shadow-none">
        <DialogHeader className="print:hidden">
          <DialogTitle className="flex items-center gap-2">
            <Printer className="size-5" />
            Impression de facture F_{facture.id_facture}
          </DialogTitle>
          <DialogDescription className="sr-only">Aperçu et impression de la facture</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 print:gap-0">
          {/* Format Selection - Hidden on Print */}
          <div className="flex items-center justify-between bg-muted/50 p-4 border rounded-none print:hidden">
            <div className="space-y-1">
              <Label className="text-sm font-bold">Format d'impression</Label>
              <RadioGroup value={format} onValueChange={(v) => setFormat(v as PrintFormat)} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="A4" id="f-a4" />
                  <Label htmlFor="f-a4" className="flex items-center gap-1 cursor-pointer">
                    <FileText className="size-4" /> A4 Standard
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="TICKET" id="f-ticket" />
                  <Label htmlFor="f-ticket" className="flex items-center gap-1 cursor-pointer">
                    <Receipt className="size-4" /> Ticket (80mm)
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <Button onClick={handlePrint} className="rounded-none gap-2 px-6">
              <Printer className="size-4" />
              Imprimer
            </Button>
          </div>

          {/* PRINTABLE AREA */}
          <div id="printable-facture-container" className="print:print-fill-page print:block">
            <div 
              id="printable-facture"
              className={cn(
              "mx-auto bg-white text-black shadow-lg print:shadow-none print:w-full",
              format === "A4" ? "w-[210mm] min-h-[297mm] p-12" : "w-[80mm] p-4 text-xs font-mono"
            )}
          >
            {/* --- LAYOUT A4 --- */}
            {format === "A4" && (
              <div className="flex flex-col h-full space-y-10">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-4">
                      <img src={config.logo_path || import.meta.env.VITE_APP_LOGO} alt="Logo" className="size-16 object-contain" />
                      <h1 className="text-3xl font-black text-primary uppercase">{config.nom_hotel}</h1>
                    </div>
                    <div className="text-sm text-gray-600 max-w-sm whitespace-pre-wrap">
                      {config.adresse}
                    </div>
                    <div className="text-sm flex flex-col pt-2 font-medium">
                      {config.telephone && <span>Tél: {config.telephone}</span>}
                      {config.email && <span>Email: {config.email}</span>}
                      {config.facebook && <span>Facebook: {config.facebook}</span>}
                      {config.site_web && <span>Web: {config.site_web}</span>}
                    </div>
                  </div>
                  <div className="text-right space-y-4">
                    <div className="inline-block bg-primary text-white px-4 py-2 font-bold text-xl uppercase">FACTURE</div>
                    <div className="text-sm">
                      <p>Facture N°: <span className="font-bold">F_{facture.id_facture.toString().padStart(4, '0')}</span></p>
                      <p>Date: <span className="font-bold">{new Date(facture.date_facture).toLocaleDateString("fr-FR")}</span></p>
                    </div>
                  </div>
                </div>

                {/* Client Info */}
                <div className="grid grid-cols-2 gap-10">
                  <div className="border p-4 space-y-2">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b pb-1">Émis par</h3>
                    <div className="text-sm leading-relaxed">
                      {config.nom_hotel}<br/>
                      {config.nif && <span>NIF: {config.nif}</span>}<br/>
                      {config.stat && <span>STAT: {config.stat}</span>}
                    </div>
                  </div>
                  <div className="border p-4 space-y-2">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b pb-1">Facturé à</h3>
                    <div className="text-sm leading-relaxed">
                      <span className="font-bold text-lg">{client ? `${client.prenom || ""} ${client.nom}`.trim() : "Client Divers"}</span><br/>
                      {client?.telephone && <span>Tél: {client.telephone}</span>}<br/>
                      {client?.email && <span>Email: {client.email}</span>}
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="flex-1 min-h-[400px]">
                  <table className="w-full text-left">
                    <thead className="bg-gray-100 uppercase text-xs font-bold">
                      <tr>
                        <th className="px-4 py-3 border">Description</th>
                        <th className="px-4 py-3 border text-center w-24">Qte</th>
                        <th className="px-4 py-3 border text-right w-40">Prix Unit.</th>
                        <th className="px-4 py-3 border text-right w-40">Montant</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {invoiceItems.map((item, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="px-4 py-4 border-x">
                             <div>{item.description}</div>
                          </td>
                          <td className="px-4 py-4 border-x text-center">{item.qte}</td>
                          <td className="px-4 py-4 border-x text-right">{formatMoney(Math.round(item.prix))}</td>
                          <td className="px-4 py-4 border-x text-right font-medium">{formatMoney(Math.round(item.total))}</td>
                        </tr>
                      ))}
                      {/* Placeholder rows to fill space */}
                      {invoiceItems.length < 5 && [...Array(5 - invoiceItems.length)].map((_, i) => (
                        <tr key={i} className="h-10 border-b">
                          <td className="border-x"></td>
                          <td className="border-x"></td>
                          <td className="border-x"></td>
                          <td className="border-x"></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end pt-6">
                  <div className="w-80 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Sous-total</span>
                      <span className="font-medium">{formatMoney(facture.montant)}</span>
                    </div>
                    {facture.remise > 0 && (
                      <div className="flex justify-between text-sm text-rose-600">
                        <span>Remise</span>
                        <span className="font-medium">- {formatMoney(facture.remise)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between items-center text-xl font-black">
                      <span>TOTAL NET</span>
                      <span className="text-primary">{formatMoney(facture.montant - facture.remise)}</span>
                    </div>
                    {totalPaid > 0 && (
                      <div className="flex justify-between text-sm pt-1">
                        <span className="text-emerald-600 font-bold italic">Déjà payé (Avance/Partiel)</span>
                        <span className="font-bold text-emerald-600">{formatMoney(totalPaid)}</span>
                      </div>
                    )}
                    {remaining > 0 && totalPaid > 0 && (
                      <div className="flex justify-between text-sm border-t border-dashed pt-1">
                        <span className="text-rose-600 font-bold uppercase">Reste à payer</span>
                        <span className="font-bold text-rose-600">{formatMoney(remaining)}</span>
                      </div>
                    )}
                    <div className="pt-4 text-xs italic text-gray-500 text-right">
                      Arrêté la présente facture à la somme de : {new Intl.NumberFormat('fr-FR').format(facture.montant - facture.remise)} {getCurrencyName()}
                    </div>
                  </div>
                </div>

                {/* Status & Footer */}
                <div className="mt-auto border-t-4 border-primary pt-6 flex justify-between items-end">
                   <div className="space-y-4">
                      {facture.statut === "PAYE" ? (
                        <div className="border-4 border-emerald-500 text-emerald-500 p-2 font-black rotate-[-10deg] inline-block uppercase opacity-80">
                           PAYÉ LE {new Date(facture.date_facture).toLocaleDateString()}<br/>
                           {facture.mode_paiement && <span>VIA {facture.mode_paiement}</span>}
                        </div>
                      ) : facture.statut === "PARTIEL" ? (
                        <div className="border-4 border-amber-500 text-amber-500 p-2 font-black rotate-[-10deg] inline-block uppercase opacity-80">
                           PARTIELLEMENT PAYÉ
                        </div>
                      ) : facture.statut === "ANNULEE" ? (
                        <div className="border-4 border-gray-500 text-gray-500 p-2 font-black rotate-[-10deg] inline-block uppercase opacity-80">
                           ANNULÉE
                        </div>
                      ) : (
                        <div className="border-4 border-rose-500 text-rose-500 p-2 font-black rotate-[-10deg] inline-block uppercase opacity-80">
                           À PAYER
                        </div>
                      )}
                      {config.message_perso ? (
                        <div className="text-[11px] text-gray-700 font-medium bg-gray-50 p-3 border-l-4 border-primary italic whitespace-pre-wrap max-w-lg">
                           {config.message_perso}
                        </div>
                      ) : (
                        <p className="text-[10px] text-gray-400">Merci de votre confiance. À bientôt chez {config.nom_hotel}.</p>
                      )}
                   </div>
                   <div className="text-right">
                      <p className="text-xs font-bold uppercase pb-10 underline">Cachet & Signature</p>
                      <div className="h-20 w-40 border border-dashed border-gray-300 ml-auto flex items-center justify-center text-[10px] text-gray-300">Emplacement Cachet</div>
                   </div>
                </div>
              </div>
            )}

            {/* --- LAYOUT TICKET 80mm --- */}
            {format === "TICKET" && (
              <div className="flex flex-col items-center space-y-4">
                {/* Header */}
                <div className="text-center w-full space-y-2">
                   <img src={config.logo_path || import.meta.env.VITE_APP_LOGO} alt="Logo" className="size-20 mx-auto object-contain grayscale" />
                   <h1 className="text-lg font-black uppercase">{config.nom_hotel}</h1>
                   <p className="text-[10px] leading-tight px-4">{config.adresse}</p>
                   <div className="text-[9px] flex flex-col">
                    {config.telephone && <span>Tél: {config.telephone}</span>}
                    {config.email && <span>Email: {config.email}</span>}
                    {config.facebook && <span>FB: {config.facebook}</span>}
                   </div>
                   {config.nif && <p className="text-[9px]">NIF: {config.nif}</p>}
                   {config.stat && <p className="text-[9px]">STAT: {config.stat}</p>}
                </div>

                <div className="w-full border-t border-dashed my-2" />

                {/* Facture Info */}
                <div className="w-full space-y-1 text-[10px]">
                   <div className="flex justify-between">
                      <span>Date:</span>
                      <span className="font-bold">{new Date(facture.date_facture).toLocaleDateString()}</span>
                   </div>
                    <div className="flex justify-between">
                       <span>Facture:</span>
                       <span className="font-bold">F_{facture.id_facture}</span>
                    </div>
                   <div className="flex justify-between">
                      <span>Client:</span>
                      <span className="font-bold">{client ? `${client.nom}` : "Divers"}</span>
                   </div>
                </div>

                <div className="w-full border-t border-dashed my-2" />

                {/* Content */}
                <div className="w-full space-y-2">
                   <table className="w-full text-[10px]">
                      <thead>
                         <tr className="border-b border-black">
                            <th className="text-left py-1">DÉSIGNATION</th>
                            <th className="text-center py-1">QTE</th>
                            <th className="text-right py-1">TOTAL</th>
                         </tr>
                      </thead>
                      <tbody>
                         {invoiceItems.map((item, idx) => (
                            <tr key={idx} className="border-b border-dashed border-gray-300">
                               <td className="py-2">
                                  <div className="font-bold">{item.description}</div>
                                  <div className="text-[8px] italic">{formatMoney(Math.round(item.prix))} / nuit</div>
                               </td>
                               <td className="text-center py-2">{item.qte}</td>
                               <td className="text-right py-2 font-bold">{formatMoney(Math.round(item.total))}</td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>

                <div className="w-full border-t border-black my-2" />

                {/* Total */}
                <div className="w-full space-y-1">
                   {facture.remise > 0 && (
                     <>
                        <div className="flex justify-between text-[10px]">
                            <span>Montant Brut:</span>
                            <span>{formatMoney(facture.montant)}</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-rose-600">
                            <span>Remise:</span>
                            <span>- {formatMoney(facture.remise)}</span>
                        </div>
                     </>
                   )}
                   <div className="flex justify-between text-base font-black">
                      <span>TOTAL NET</span>
                      <span>{formatMoney(facture.montant - facture.remise)}</span>
                   </div>
                   {totalPaid > 0 && (
                      <div className="flex justify-between text-[10px] italic">
                          <span>DÉJÀ PAYÉ:</span>
                          <span>{formatMoney(totalPaid)}</span>
                      </div>
                   )}
                   {remaining > 0 && totalPaid > 0 && (
                      <div className="flex justify-between text-[10px] font-bold border-t border-dashed">
                          <span>RESTE À PAYER:</span>
                          <span>{formatMoney(remaining)}</span>
                      </div>
                   )}
                   <div className="flex justify-between text-[10px] items-center">
                      <span>Statut:</span>
                      <span className={cn("font-bold", facture.statut === "PAYE" ? "text-emerald-600" : facture.statut === "PARTIEL" ? "text-amber-600" : facture.statut === "ANNULEE" ? "text-gray-600" : "text-rose-600")}>
                        {facture.statut === "PAYE" 
                          ? `PAYÉ ${facture.mode_paiement ? `(${facture.mode_paiement})` : ""}` 
                          : facture.statut === "PARTIEL" ? "PARTIELLEMENT PAYÉ" : facture.statut === "ANNULEE" ? "ANNULÉE" : "NON PAYÉ"}
                      </span>
                   </div>
                </div>

                <div className="w-full border-t border-dashed my-6" />

                {/* Footer */}
                <div className="text-center w-full space-y-2">
                   <p className="text-[10px] font-bold">MERCI DE VOTRE VISITE</p>
                   {config.message_perso && (
                     <p className="text-[9px] italic border-t border-dashed pt-2 mt-2 px-2">
                        {config.message_perso}
                     </p>
                   )}
                   <p className="text-[8px] italic">{config.site_web || ""}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DialogContent>
    </Dialog>
  )
}
