# Atlas — Marka kimliği (v2)

Görsel kod `app/globals.css` `:root` içinde; React satır içi için `lib/brandStyles.js` (`ta` nesnesi).

## Mürekkep (metin) — tüm sayfalarda

| Token | Rol | Hex |
|--------|-----|-----|
| `--ta-ink-1` | Primary | `#15232F` |
| `--ta-ink-2` | Secondary | `#3E5264` |
| `--ta-ink-3` | Muted | `#6A7C8E` |
| `--ta-ink-4` | Disabled / en açık | `#A3B0BC` |

Kısayollar: `--ta-ink` → ink-1, `--ta-ink-muted` → ink-3, `--ta-ink-subtle` → ink-4. İkincil gövde metni için `--ta-ink-2` kullanın.

## Paper & surfaces (premium, net, soğuk)

Warm krem zeminden çıkıldı; yüzeyler soğuk gri-mavi kağıt ve beyaz katmanlar.

| Token | Kullanım |
|--------|----------|
| `--ta-canvas` / `--ta-canvas-top` / `--ta-canvas-bottom` | Sayfa / bölüm zeminleri |
| `--ta-elevated` | Kart, modal, saf beyaz |
| `--ta-shell` | Kenar çubuğu / üst bar camı |
| `--ta-muted-bg` | Girdi alanları, hover zeminleri |
| `--ta-skeleton` / `--ta-skeleton-shine` | Yükleme iskeleti |
| `--ta-border` | İnce çizgiler |

## Vurgu

- **Accent (pusula)**: soğuk platin–çelik mavi; mürekkep ve kağıtla uyumlu, “premium” vurgu (`--ta-accent` ailesi). Eski `--gold*` değişkenleri kaldırıldı; bileşenlerde `var(--ta-accent)` / `var(--ta-accent-deep)` / `var(--ta-accent-soft)` kullanın.

| Token | Hex |
|--------|-----|
| `--ta-accent` | `#4A6278` |
| `--ta-accent-deep` | `#2F3F52` |
| `--ta-accent-bright` | `#5F7A94` |

- **Deniz**: `--ta-sea` (başarı / canlı).
- **Danger**: `--ta-danger`.

## Pazarı (`lib/taRegion.js`)

- Varsayılan **global**: geocode’da zorunlu “Türkiye” eki yok, Places araması `en` + bölge kodu yok, varsayılan şehir örnekleri Londra vb.
- Türkiye ağırlıklı eski davranış için: `.env` → `NEXT_PUBLIC_TA_MARKET=tr` (geocode bağlamı, Skyscanner `.com.tr`, hızlı öneriler TR odaklı).

## Tipografi

General Sans + Fraunces + JetBrains Mono; ölçek sınıfları `.ta-type-*`, `.ta-h1`–`.ta-h4`, `.ta-display` (`globals.css`).

## Kodda kullanım

- Mümkün olduğunca **sabit hex kullanmayın**; `var(--ta-ink)` vb.
- Bileşenlerde: `import { ta } from '@/lib/brandStyles'` → `color: ta.inkMuted`, `ta.inkDisabled`, vb.
