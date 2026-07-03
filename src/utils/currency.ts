export function getCurrencySymbol() {
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
  return symbol
}

export function formatMoney(amount: number) {
  return new Intl.NumberFormat('fr-FR').format(amount) + " " + getCurrencySymbol()
}
