/*
  =====================================================================================
  INDEX.JS — SATU-SATUNYA file JavaScript yang dipakai oleh index.html (halaman Beranda)
  -------------------------------------------------------------------------------------


/* =====================================================================================
   BAGIAN 1: NAVIGASI & STATUS LOGIN  (dipakai oleh SEMUA halaman)
   ===================================================================================== */

/* ------------------------------------------------------------------
   1.1 Kunci (nama key) tempat data disimpan di localStorage/sessionStorage
   ------------------------------------------------------------------
   localStorage itu semacam "kotak penyimpanan" kecil di dalam peramban
   (browser) milik pengguna sendiri. Data yang disimpan di sana TIDAK
   hilang walau tab/browser ditutup, dan tetap ada sampai dihapus manual.
   Kita pakai localStorage di sini karena proyek ini TIDAK punya server
   sungguhan buat menyimpan akun pengguna. */

// Tempat menyimpan status login (sudah login atau belum, siapa namanya)
const KUNCI_STATUS_LOGIN = "buzzlightyearMusicStatusLogin";

// Tempat menyimpan sementara "halaman apa yang tadinya ingin dituju
// sebelum diminta login" — pakai sessionStorage karena cuma perlu
// diingat selama satu kali kunjungan saja (bukan selamanya seperti
// localStorage)
const KUNCI_HALAMAN_TUJUAN = "buzzlightyearMusicHalamanTujuan";


/* ------------------------------------------------------------------
   1.2 Fungsi-fungsi untuk membaca & menulis status login
   ------------------------------------------------------------------ */

/**
 * apakahSudahLogin()
 * Fungsi ini memeriksa localStorage dan mengembalikan nilai boolean:
 *   true  -> pengguna SUDAH login
 *   false -> pengguna BELUM login (atau datanya rusak/tidak ada)
 */
function apakahSudahLogin() {
  // try...catch dipakai supaya kalau ada data yang rusak/aneh di
  // localStorage, program TIDAK crash — cukup dianggap "belum login".
  try {
    // getItem() mengambil teks (string) yang tersimpan di localStorage.
    // Kalau belum pernah diisi, hasilnya adalah null.
    const dataTersimpan = localStorage.getItem(KUNCI_STATUS_LOGIN);

    // Kalau belum ada data sama sekali, otomatis belum login
    if (!dataTersimpan) {
      return false;
    }

    // Data di localStorage tersimpan sebagai teks JSON, jadi harus
    // "diubah balik" jadi objek JavaScript memakai JSON.parse()
    const status = JSON.parse(dataTersimpan);

    // Boolean(...) memastikan hasil akhirnya selalu true/false murni
    return Boolean(status && status.login === true);
  } catch (kesalahan) {
    // Kalau JSON.parse() gagal (datanya rusak), tampilkan pesannya di
    // console supaya mudah di-debug, lalu anggap saja belum login
    console.error("Gagal membaca status login:", kesalahan);
    return false;
  }
}

/**
 * ambilNamaPenggunaLogin()
 * Mengambil nama pengguna yang sedang login (untuk ditulis di sapaan
 * header "Hai, <nama>"). Kalau belum login, hasilnya teks kosong "".
 */
function ambilNamaPenggunaLogin() {
  try {
    const dataTersimpan = localStorage.getItem(KUNCI_STATUS_LOGIN);

    if (!dataTersimpan) {
      return "";
    }

    const status = JSON.parse(dataTersimpan);

    // Operator ternary ( kondisi ? nilaiJikaBenar : nilaiJikaSalah )
    // dipakai di sini supaya tidak error kalau status.nama kosong
    return status && status.nama ? status.nama : "";
  } catch (kesalahan) {
    return "";
  }
}

/**
 * tandaiSudahLogin(nama, email)
 * Menyimpan status "sudah login" ke localStorage. Dipanggil oleh
 * js/login.js setelah formulir login lolos pengecekan sederhana.
 */
function tandaiSudahLogin(nama, email) {
  // Kalau nama tidak diisi (kosong), pakai bagian depan email sebagai
  // nama tampilan. Contoh: "ibnu@gmail.com" -> "ibnu"
  const namaTampil = nama && nama.trim() !== "" ? nama.trim() : email.split("@")[0];

  // Bungkus semua data status login jadi satu objek
  const status = {
    login: true,
    nama: namaTampil,
    email: email,
  };

  // Objek JavaScript harus diubah dulu jadi teks JSON sebelum disimpan
  // ke localStorage, memakai JSON.stringify()
  localStorage.setItem(KUNCI_STATUS_LOGIN, JSON.stringify(status));
}

/**
 * keluarDariAkun()
 * Menghapus status login dari localStorage (proses logout/Keluar).
 */
function keluarDariAkun() {
  localStorage.removeItem(KUNCI_STATUS_LOGIN);
}


/* ------------------------------------------------------------------
   1.3 Fungsi untuk mengingat "halaman tujuan" sebelum login
   ------------------------------------------------------------------
   Contoh skenario pemakaiannya:
   1. Pengguna (belum login) membuka halaman Musik, lalu menekan ikon
      hati (suka) pada sebuah lagu.
   2. Karena belum login, ia diarahkan ke halaman Masuk. Sebelum
      pindah halaman, kita simpan dulu "musik.html" lewat fungsi
      simpanHalamanTujuanSetelahLogin("musik.html").
   3. Setelah berhasil login, js/login.js memanggil
      ambilDanHapusHalamanTujuan() untuk tahu bahwa pengguna harus
      diarahkan balik ke "musik.html", bukan ke halaman lain. */

function simpanHalamanTujuanSetelahLogin(namaBerkasHtml) {
  sessionStorage.setItem(KUNCI_HALAMAN_TUJUAN, namaBerkasHtml);
}

function ambilDanHapusHalamanTujuan() {
  // Baca dulu nilainya...
  const tujuan = sessionStorage.getItem(KUNCI_HALAMAN_TUJUAN);
  // ...lalu langsung hapus, supaya tidak "nyangkut" terpakai lagi di
  // kunjungan berikutnya secara tidak sengaja
  sessionStorage.removeItem(KUNCI_HALAMAN_TUJUAN);
  return tujuan;
}


/* ------------------------------------------------------------------
   1.4 Menampilkan status login di header (sapaan "Hai, <nama>")
   ------------------------------------------------------------------ */

/**
 * perbaruiTampilanAkunNavigasi()
 * Mengatur apa yang tampil di pojok kanan header setiap halaman:
 *   - BELUM login -> tautan "Masuk" & "Daftar" (bawaan HTML) tetap tampil
 *   - SUDAH login -> "Masuk"/"Daftar" disembunyikan, lalu muncul sapaan
 *                     "Hai, <nama>" beserta tombol "Keluar"
 * Elemen-elemen ini (id="tautan-masuk", "tautan-daftar", "sapaan-akun",
 * "tombol-keluar") sudah ada di dalam <div class="grup-akun"> pada
 * SETIAP file HTML di proyek ini.
 */
function perbaruiTampilanAkunNavigasi() {
  // getElementById() = cara paling umum untuk "mengambil" satu elemen
  // HTML supaya bisa diubah/dibaca lewat JavaScript
  const tautanMasuk = document.getElementById("tautan-masuk");
  const tautanDaftar = document.getElementById("tautan-daftar");
  const sapaanAkun = document.getElementById("sapaan-akun");
  const tombolKeluar = document.getElementById("tombol-keluar");

  // Kalau ke-4 elemen di atas semuanya tidak ada, hentikan fungsi di
  // sini (mencegah error karena mencoba mengubah elemen yang tak ada)
  if (!tautanMasuk && !tautanDaftar && !sapaanAkun && !tombolKeluar) {
    return;
  }

  const sudahLogin = apakahSudahLogin();

  // classList.toggle("nama-class", kondisi) artinya:
  //   - class ditambahkan kalau kondisi bernilai true
  //   - class dihapus kalau kondisi bernilai false
  // Class "tersembunyi" sendiri sudah diatur di CSS supaya elemen
  // dengan class itu otomatis display:none (tidak terlihat).
  if (tautanMasuk) {
    tautanMasuk.classList.toggle("tersembunyi", sudahLogin);
  }

  if (tautanDaftar) {
    tautanDaftar.classList.toggle("tersembunyi", sudahLogin);
  }

  if (sapaanAkun) {
    sapaanAkun.classList.toggle("tersembunyi", !sudahLogin);

    // Kosongkan dulu isi lama sapaan (kalau ada) sebelum menulis yang
    // baru. Dilakukan dengan perulangan while + removeChild, BUKAN
    // dengan innerHTML, sesuai aturan proyek.
    while (sapaanAkun.firstChild) {
      sapaanAkun.removeChild(sapaanAkun.firstChild);
    }

    if (sudahLogin) {
      // createTextNode() membuat node teks murni (bukan HTML), lalu
      // appendChild() menempelkannya ke dalam elemen sapaanAkun
      sapaanAkun.appendChild(document.createTextNode("Hai, " + ambilNamaPenggunaLogin()));
    }
  }

  if (tombolKeluar) {
    tombolKeluar.classList.toggle("tersembunyi", !sudahLogin);
  }
}


/* =====================================================================================
   BAGIAN 2: MENU HAMBURGER DI LAYAR HP
   ===================================================================================== */

/**
 * aturMenuMobile()
 * Mengatur buka/tutup menu navigasi di layar HP (lewat tombol hamburger ☰).
 *
 * Cara kerjanya sengaja dibuat sesederhana mungkin — cuma 1 SAKLAR ON/OFF:
 *   - Elemen <header> diberi ATAU dilepas class "menu-terbuka"
 *   - class itulah yang dibaca oleh CSS (lihat css/media.css) untuk
 *     menampilkan atau menyembunyikan panel menunya
 * Jadi kode JavaScript di sini TIDAK perlu tahu detail tampilan panel
 * menunya sama sekali — cukup nyala/matikan 1 saklar saja, sisanya
 * (animasi, posisi, dst) diurus penuh oleh CSS.
 */
function aturMenuMobile() {
  // Ambil 3 elemen yang dibutuhkan: bingkai header, tombol hamburger,
  // dan panel yang berisi daftar menu + tombol akun
  const headerSitus = document.querySelector(".header-situs");
  const tombolHamburger = document.getElementById("tombol-menu-mobile");
  const panelMenu = document.getElementById("panel-menu-mobile");

  // Kalau salah satu elemen di atas tidak ditemukan, hentikan fungsi
  if (!headerSitus || !tombolHamburger || !panelMenu) {
    return;
  }

  // Fungsi kecil untuk MEMBUKA menu
  function bukaMenu() {
    headerSitus.classList.add("menu-terbuka");
    // aria-expanded dipakai supaya pembaca layar (screen reader) tahu
    // menu sedang dalam keadaan terbuka — ini bagian dari aksesibilitas
    tombolHamburger.setAttribute("aria-expanded", "true");
  }

  // Fungsi kecil untuk MENUTUP menu
  function tutupMenu() {
    headerSitus.classList.remove("menu-terbuka");
    tombolHamburger.setAttribute("aria-expanded", "false");
  }

  // EVENT HANDLER #1: saat tombol hamburger DIKLIK
  // addEventListener("click", ...) artinya "jalankan kode di dalam
  // kurung setiap kali elemen ini diklik oleh pengguna"
  tombolHamburger.addEventListener("click", () => {
    // Cek dulu kondisi SEKARANG: menu sedang terbuka atau tertutup?
    const sedangTerbuka = headerSitus.classList.contains("menu-terbuka");

    // Struktur if/else sederhana: kalau sedang terbuka -> tutup,
    // kalau sedang tertutup -> buka. Ini yang disebut perilaku "toggle"
    if (sedangTerbuka) {
      tutupMenu();
    } else {
      bukaMenu();
    }
  });

  // EVENT HANDLER #2: menu otomatis tertutup begitu salah satu tautan
  // di dalamnya diklik (Beranda/Musik/Favorit/dst, atau Masuk/Daftar/
  // Keluar) — supaya panel tidak "nyangkut" terbuka menutupi layar
  // setelah pengguna berpindah halaman.
  // querySelectorAll() mengembalikan SEMUA elemen yang cocok dengan
  // pola CSS yang diberikan — di sini semua <a> dan <button> di dalam panel.
  const semuaTautanDiDalamPanel = panelMenu.querySelectorAll("a, button");

  // forEach = perulangan khusus untuk menjalankan 1 fungsi yang sama
  // pada SETIAP anggota kumpulan elemen di atas, satu per satu
  semuaTautanDiDalamPanel.forEach((tautan) => {
    tautan.addEventListener("click", tutupMenu);
  });

  // EVENT HANDLER #3: menu otomatis tertutup kalau tombol Escape
  // ditekan di keyboard (kemudahan tambahan untuk pengguna keyboard)
  document.addEventListener("keydown", (peristiwa) => {
    if (peristiwa.key === "Escape") {
      tutupMenu();
    }
  });
}


/* =====================================================================================
   BAGIAN 3: TAHUN OTOMATIS DI FOOTER
   ===================================================================================== */

/**
 * tulisTahunFooter()
 * Menulis tahun berjalan (mis. "2026") secara otomatis ke footer,
 * supaya tidak perlu diketik ulang manual setiap pergantian tahun.
 */
function tulisTahunFooter() {
  const tempatTahun = document.getElementById("tahun-berjalan");

  if (!tempatTahun) {
    return;
  }

  // new Date() membuat objek tanggal untuk waktu SEKARANG,
  // lalu getFullYear() mengambil bagian tahunnya saja (contoh: 2026)
  const tahunSekarang = new Date().getFullYear();

  // String(...) mengubah angka tahun menjadi teks, karena
  // createTextNode() hanya menerima teks (bukan angka)
  const simpulTeksTahun = document.createTextNode(String(tahunSekarang));

  tempatTahun.appendChild(simpulTeksTahun);
}


/* =====================================================================================
   BAGIAN 4: TITIK MULAI (dijalankan begitu HTML selesai dimuat)
   ===================================================================================== */

// "DOMContentLoaded" adalah event bawaan browser yang menyala begitu
// SELURUH struktur HTML halaman selesai dibaca oleh browser. Kita
// menunggu event ini dulu sebelum menjalankan kode di atas, supaya
// semua elemen (tombol, header, dst) sudah pasti ada saat dicari
// lewat getElementById()/querySelector().
document.addEventListener("DOMContentLoaded", () => {
  // 1) Siapkan tombol hamburger di layar HP
  aturMenuMobile();

  // 2) Tulis tahun berjalan di footer
  tulisTahunFooter();

  // 3) Sesuaikan tampilan header (Masuk/Daftar vs Hai, <nama>)
  perbaruiTampilanAkunNavigasi();

  // 4) Pasang aksi klik pada tombol "Keluar" (kalau ada di halaman ini)
  const tombolKeluar = document.getElementById("tombol-keluar");

  if (tombolKeluar) {
    tombolKeluar.addEventListener("click", () => {
      keluarDariAkun();
      // Muat ulang halaman supaya header (dan isi halaman lain seperti
      // daftar favorit/playlist) langsung menyesuaikan ke status
      // "belum login" tanpa harus menekan F5 secara manual
      window.location.reload();
    });
  }
});
