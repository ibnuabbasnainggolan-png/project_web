# 🎵 BuzzLightyear Music

Website pemutar musik sederhana berbasis **HTML, CSS, dan JavaScript murni** (tanpa framework). Dibuat oleh **Ibnu Abbas** sebagai proyek pembelajaran struktur semantik HTML, tata letak responsif, dan konsumsi data dari REST API.

## ✨ Fitur

- **Beranda (`index.html`)** — halaman utama dengan hero section dan pengenalan situs.
- **Musik (`html/musik.html`)** — daftar lagu diambil langsung dari REST API (bukan data statis), dilengkapi pencarian judul/artis/lirik dan pemutar lagu langsung di halaman.
- **Favorit (`html/favorit.html`)** — menyimpan lagu-lagu yang ditandai sebagai favorit.
- **Playlist (`html/playlist.html`)** — pengguna dapat membuat dan mengelola playlist sendiri.
- **Login & Register (`html/login.html`, `html/register.html`)** — sistem autentikasi sederhana berbasis `localStorage`/`sessionStorage` (tidak memakai server/database sungguhan).
- **Tentang (`html/tentang.html`)** — penjelasan tentang proyek dan tujuannya.
- **Responsif** — tampilan menyesuaikan dari layar ponsel hingga desktop menggunakan Flexbox & CSS Grid, termasuk menu hamburger di mobile.

## 🗂️ Struktur Folder

```
IBNU_ABBAS_NGL/
├── index.html          # Halaman beranda
├── html/               # Halaman-halaman lain (musik, playlist, favorit, login, register, tentang)
├── css/                # Stylesheet per halaman + media.css untuk responsif
├── js/                 # Logic per halaman (fetch API, localStorage, dsb.)
└── img/                # Aset gambar (logo, ikon, background)
```

## 🔑 Cara Kerja Login

Karena proyek ini tidak memiliki backend/server sungguhan, status login disimpan di **localStorage** browser pengguna:
- `buzzlightyearMusicStatusLogin` → menyimpan status & nama pengguna yang login.
- `buzzlightyearMusicHalamanTujuan` → mengingat halaman yang ingin dituju sebelum diarahkan ke login (disimpan di `sessionStorage`).

## 🚀 Cara Menjalankan

1. Clone atau download repository ini.
2. Buka file `index.html` langsung di browser, **atau**
3. Jalankan lewat live server (disarankan) agar fitur `fetch` ke REST API berjalan normal, misalnya dengan ekstensi **Live Server** di VS Code.

## 🛠️ Teknologi

- HTML5 (semantik)
- CSS3 (Flexbox, Grid, responsif via `media.css`)
- JavaScript (vanilla) — konsumsi REST API, `localStorage`/`sessionStorage`
- Google Fonts (Fraunces & Plus Jakarta Sans)

---
Dibuat dengan ❤️ oleh **Ibnu Abbas**.
