# Desktop Design System

Dokumen ini adalah source of truth untuk membuat dan memakai design system `desktop` pada
`apps/electron`.

## Tujuan

- Menyediakan visual language desktop-first yang konsisten untuk Electron renderer.
- Menghindari styling acak atau hardcode yang sulit dimigrasikan.
- Menjadi basis migrasi bertahap dari komponen legacy ke wrapper design-system baru.

## Lokasi Implementasi

Semua komponen baru untuk design system wajib dibuat di:

- `src/renderer/src/components/design-system`

Struktur utamanya mengikuti atomic design:

- `atoms`: primitive visual kecil seperti button primitive, badge, text label, copy action
- `molecules`: gabungan atom seperti field wrapper, card header, stat block, toolbar fragment
- `organisms`: blok UI besar seperti generic table, menu shell, form section
- `templates`: preview shell/layout penuh seperti hybrid desktop shell

## Token Categories

Gunakan token terpusat untuk semua keputusan visual berikut:

- `color`
- `typography`
- `radius`
- `shadow`
- `spacing`
- `sizing`
- `layout dimensions`
- `component dimensions`

Token berada di layer design-system dan boleh dipetakan ke token Ant Design bila relevan.

## Rules

- Gunakan atomic design principle untuk semua komponen baru.
- No hardcode color. Semua warna harus berasal dari token.
- Gunakan Tailwind untuk styling. Beberapa komponen AntD boleh memakai selector override dengan
  `!important` bila memang diperlukan untuk mengalahkan style bawaan.
- Semua ukuran, sizing, spacing, radius, shadow, dan font size harus berasal dari token. Jangan
  hardcode nilai visual di komponen.
- Desktop first. Mobile-specific layout tidak wajib di iterasi ini.
- Wrapper baru harus hidup paralel dengan komponen legacy. Jangan hapus komponen lama hanya untuk
  memaksakan adopsi.
- Setiap komponen yang dibuat untuk design-system wajib ditampilkan di
  `src/renderer/src/pages/design-system.tsx`.
- Setiap entry di `design-system.tsx` wajib menampilkan:
  - nama komponen
  - purpose singkat
  - payload props yang diterima
  - tombol copy code
  - usage snippet JSX yang valid

## Cara Membuat Komponen Baru

1. Tentukan level atomic design yang tepat.
2. Tambahkan atau pakai token yang sudah ada. Jangan mulai dari angka atau warna hardcoded.
3. Bungkus komponen AntD bila butuh perilaku existing, lalu apply visual `desktop` melalui token
   dan class design-system.
4. Jika perlu override AntD internal selector, lakukan di layer CSS design-system dengan scope yang
   jelas.
5. Tambahkan metadata komponen ke registry showcase.
6. Tampilkan komponen di `design-system.tsx` lengkap dengan snippet dan payload props.

## Aturan Khusus Wrapper AntD

- `Button`, `Input`, `Select`, `Card`, dan `Table` harus masuk lewat wrapper design-system untuk
  use case baru yang ingin memakai tema `desktop`.
- `GenericTable` versi desktop harus mempertahankan kontrak dasar data table lama agar migrasi
  bertahap tetap mudah.
- Override AntD harus scoped ke class design-system, bukan global tanpa batas.

## Showcase Contract

`design-system.tsx` berfungsi sebagai katalog dan dokumentasi hidup. Halaman itu minimal harus
menampilkan:

- overview theme `desktop`
- preview typography
- color tone desktop
- spacing dan sizing scale
- radius dan shadow
- hybrid shell preview
- input field
- card variants
- generic table
- menu/layout preview

## Non-Goals

- Belum mengganti shell dashboard lama secara massal.
- Belum mengoptimalkan mobile layout.
- Belum memindahkan seluruh komponen legacy ke namespace design-system.
