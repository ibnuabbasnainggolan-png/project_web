/*
  =====================================================================================
  REGISTER.JS — Khusus untuk html/register.html (Pendaftaran Nama Lengkap & Sandi)
  =====================================================================================
*/

/* =====================================================================================
   BAGIAN 1: NAVIGASI & STATUS LOGIN
   ===================================================================================== */

const kunciStatusLogin = "buzzlightyearMusicStatusLogin";
const kunciHalamanTujuan = "buzzlightyearMusicHalamanTujuan";
const kunciAkunTerdaftar = "buzzlightyearAkunTerdaftar";

function apakahSudahLogin() {
  try {
    const dataTersimpan = localStorage.getItem(kunciStatusLogin);
    if (!dataTersimpan) return false;
    const status = JSON.parse(dataTersimpan);
    return Boolean(status && status.login === true);
  } catch (kesalahan) {
    console.error("Gagal membaca status login:", kesalahan);
    return false;
  }
}

function ambilNamaPenggunaLogin() {
  try {
    const dataTersimpan = localStorage.getItem(kunciStatusLogin);
    if (!dataTersimpan) return "";
    const status = JSON.parse(dataTersimpan);
    return status && status.nama ? status.nama : "";
  } catch (kesalahan) {
    return "";
  }
}

function perbaruiTampilanAkunNavigasi() {
  const tautanMasuk = document.getElementById("tautan-masuk");
  const tautanDaftar = document.getElementById("tautan-daftar");
  const sapaanAkun = document.getElementById("sapaan-akun");
  const tombolKeluar = document.getElementById("tombol-keluar");

  if (!tautanMasuk && !tautanDaftar && !sapaanAkun && !tombolKeluar) {
    return;
  }

  const sudahLogin = apakahSudahLogin();

  if (tautanMasuk) tautanMasuk.classList.toggle("tersembunyi", sudahLogin);
  if (tautanDaftar) tautanDaftar.classList.toggle("tersembunyi", sudahLogin);

  if (sapaanAkun) {
    sapaanAkun.classList.toggle("tersembunyi", !sudahLogin);
    while (sapaanAkun.firstChild) {
      sapaanAkun.removeChild(sapaanAkun.firstChild);
    }
    if (sudahLogin) {
      sapaanAkun.appendChild(document.createTextNode("Hai, " + ambilNamaPenggunaLogin()));
    }
  }

  if (tombolKeluar) {
    tombolKeluar.classList.toggle("tersembunyi", !sudahLogin);
  }
}

/* =====================================================================================
   BAGIAN 2: FORMULIR DAFTAR (REGISTER DENGAN NAMA LENGKAP)
   ===================================================================================== */

function aturFormRegister() {
  const formRegister = document.getElementById("form-register");

  if (!formRegister) {
    return;
  }

  const pesanStatus = document.getElementById("status-register");

  formRegister.addEventListener("submit", (peristiwa) => {
    peristiwa.preventDefault();

    // Mengambil elemen input berdasarkan ID / name (Nama Lengkap)
    const inputNama = document.getElementById("register-nama") || formRegister.elements["nama-lengkap"];
    const inputSandi = document.getElementById("register-sandi") || formRegister.elements["kata-sandi"];
    const inputKonfirmasi = document.getElementById("register-konfirmasi-sandi") || formRegister.elements["konfirmasi-sandi"];

    const namaLengkap = inputNama ? inputNama.value.trim() : "";
    const kataSandi = inputSandi ? inputSandi.value : "";
    const konfirmasiSandi = inputKonfirmasi ? inputKonfirmasi.value : "";

    const daftarMasalah = [];

    if (namaLengkap === "") {
      daftarMasalah.push("nama lengkap wajib diisi");
    }
    if (kataSandi.length < 6) {
      daftarMasalah.push("kata sandi minimal 6 karakter");
    }
    if (kataSandi !== konfirmasiSandi) {
      daftarMasalah.push("konfirmasi kata sandi tidak cocok");
    }

    if (daftarMasalah.length === 0) {
      // PENYESUAIAN PENTING: Kunci data disesuaikan dengan login.js (namaLengkap)
      const akunBaru = {
        namaLengkap: namaLengkap,
        kataSandi: kataSandi
      };
      localStorage.setItem(kunciAkunTerdaftar, JSON.stringify(akunBaru));

      tampilkanStatusAuth(
        pesanStatus,
        "Akun berhasil dibuat! Mengarahkan ke halaman Masuk...",
        true
      );

      formRegister.reset();

      window.setTimeout(() => {
        window.location.href = "login.html";
      }, 900);
    } else {
      tampilkanStatusAuth(
        pesanStatus,
        "Perbaiki dulu: " + daftarMasalah.join(", ") + ".",
        false
      );
    }
  });
}

function tampilkanStatusAuth(elemenPesan, teks, berhasil) {
  if (!elemenPesan) return;

  while (elemenPesan.firstChild) {
    elemenPesan.removeChild(elemenPesan.firstChild);
  }

  elemenPesan.appendChild(document.createTextNode(teks));
  elemenPesan.classList.add("tampil");
  elemenPesan.classList.remove("sukses", "gagal");
  elemenPesan.classList.add(berhasil ? "sukses" : "gagal");
}

/* =====================================================================================
   BAGIAN 3: MENU HAMBURGER & INISIALISASI
   ===================================================================================== */

function aturMenuMobile() {
  const headerSitus = document.querySelector(".header-situs");
  const tombolHamburger = document.getElementById("tombol-menu-mobile");
  const panelMenu = document.getElementById("panel-menu-mobile");

  if (!headerSitus || !tombolHamburger || !panelMenu) return;

  function bukaMenu() {
    headerSitus.classList.add("menu-terbuka");
    tombolHamburger.setAttribute("aria-expanded", "true");
  }

  function tutupMenu() {
    headerSitus.classList.remove("menu-terbuka");
    tombolHamburger.setAttribute("aria-expanded", "false");
  }

  tombolHamburger.addEventListener("click", () => {
    const sedangTerbuka = headerSitus.classList.contains("menu-terbuka");
    if (sedangTerbuka) {
      tutupMenu();
    } else {
      bukaMenu();
    }
  });

  const semuaTautanDiDalamPanel = panelMenu.querySelectorAll("a, button");
  semuaTautanDiDalamPanel.forEach((tautan) => {
    tautan.addEventListener("click", tutupMenu);
  });

  document.addEventListener("keydown", (peristiwa) => {
    if (peristiwa.key === "Escape") {
      tutupMenu();
    }
  });
}

function tulisTahunFooter() {
  const tempatTahun = document.getElementById("tahun-berjalan");
  if (!tempatTahun) return;
  const tahunSekarang = new Date().getFullYear();
  tempatTahun.appendChild(document.createTextNode(String(tahunSekarang)));
}

document.addEventListener("DOMContentLoaded", () => {
  aturMenuMobile();
  tulisTahunFooter();
  perbaruiTampilanAkunNavigasi();
  aturFormRegister();
});