export const CURRENCIES = [
  { code: 'IDR', label: 'IDR — Rupiah Indonesia' },
  { code: 'USD', label: 'USD — US Dollar' },
  { code: 'MYR', label: 'MYR — Malaysian Ringgit' },
  { code: 'SGD', label: 'SGD — Singapore Dollar' },
  { code: 'PHP', label: 'PHP — Philippine Peso' },
  { code: 'THB', label: 'THB — Thai Baht' },
  { code: 'AUD', label: 'AUD — Australian Dollar' },
  { code: 'GBP', label: 'GBP — British Pound' },
  { code: 'EUR', label: 'EUR — Euro' },
]

export function formatMoney(amount: number, currency = 'IDR'): string {
  try {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
      maximumFractionDigits: currency === 'IDR' || currency === 'VND' ? 0 : 2,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toLocaleString()}`
  }
}

// Format singkat untuk stat cards (e.g. $1.5K, Rp 1,5 jt)
export function formatMoneyShort(amount: number, currency = 'IDR'): string {
  if (currency === 'IDR') {
    if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1).replace('.0', '')} jt`
    if (amount >= 1_000) return `Rp ${(amount / 1_000).toFixed(0)} rb`
    return `Rp ${amount.toLocaleString('id-ID')}`
  }
  if (amount >= 1_000_000) return formatMoney(amount / 1_000_000, currency).replace(/\.00$/, '') + 'M'
  if (amount >= 1_000) return formatMoney(amount / 1_000, currency).replace(/\.00$/, '') + 'K'
  return formatMoney(amount, currency)
}

// Konversi nomor WA ke format internasional
export function toWaLink(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  // Jika dimulai 0, anggap perlu country code (tidak diubah — user harus isi lengkap)
  return `https://wa.me/${digits}`
}
