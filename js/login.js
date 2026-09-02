/*
  =====================================================================================
  LOGIN.JS — JS khusus untuk html/login.html (Gunakan Nama Lengkap & Kata Sandi)
  =====================================================================================
*/

/* =====================================================================================
   BAGIAN 1: NAVIGASI & STATUS LOGIN
   ===================================================================================== */

const KUNCI_STATUS_LOGIN = "buzzlightyearMusicStatusLogin";
const KUNCI_HALAMAN_TUJUAN = "buzzlightyearMusicHalamanTujuan";
const KUNCI_AKUN_TERDAFTAR = "buzzlightyearAkunTerdaftar";

function apakahSudahLogin() {
  try {
    const dataTersimpan = localStorage.getItem(KUNCI_STATUS_LOGIN);
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
    const dataTersimpan = localStorage.getItem(KUNCI_STATUS_LOGIN);
    if (!dataTersimpan) return "";
    const status = JSON.parse(dataTersimpan);
    return status && status.nama ? status.nama : "";
  } catch (kesalahan) {
    return "";
  }
}

function tandaiSudahLogin(namaLengkap) {
  const status = {
    login: true,
    nama: namaLengkap ? namaLengkap.trim() : ""
  };
  localStorage.setItem(KUNCI_STATUS_LOGIN, JSON.stringify(status));
}

function keluarDariAkun() {
  localStorage.removeItem(KUNCI_STATUS_LOGIN);
}

function ambilDanHapusHalamanTujuan() {
  const tujuan = sessionStorage.getItem(KUNCI_HALAMAN_TUJUAN);
  sessionStorage.removeItem(KUNCI_HALAMAN_TUJUAN);
  return tujuan;
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
   BAGIAN 2: FORMULIR MASUK (LOGIN DENGAN NAMA LENGKAP)
   ===================================================================================== */

function aturFormLogin() {
  const formLogin = document.getElementById("form-login");
  if (!formLogin) return;

  const pesanStatus = document.getElementById("status-login");

  formLogin.addEventListener("submit", (peristiwa) => {
    peristiwa.preventDefault();

    const inputNama = document.getElementById("login-nama");
    const inputSandi = document.getElementById("login-sandi");

    const namaLengkap = inputNama ? inputNama.value.trim() : "";
    const kataSandi = inputSandi ? inputSandi.value : "";

    const dataTerdaftarRaw = localStorage.getItem(KUNCI_AKUN_TERDAFTAR);
    const dataAkun = dataTerdaftarRaw ? JSON.parse(dataTerdaftarRaw) : null;

    // Pengecekan ke akun terdaftar di localStorage
    if (dataAkun && dataAkun.namaLengkap === namaLengkap && dataAkun.kataSandi === kataSandi) {
      tandaiSudahLogin(namaLengkap);

      tampilkanStatusAuth(
        pesanStatus,
        "Berhasil masuk! Mengarahkan kamu...",
        true
      );

      const halamanTujuan = ambilDanHapusHalamanTujuan();

      window.setTimeout(() => {
        window.location.href = halamanTujuan ? halamanTujuan : "musik.html";
      }, 600);
    } else {
      tampilkanStatusAuth(
        pesanStatus,
        "Nama lengkap atau kata sandi salah / belum terdaftar.",
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
   BAGIAN 3: NAVIGASI MOBILE & INISIALISASI
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

  const tombolKeluar = document.getElementById("tombol-keluar");
  if (tombolKeluar) {
    tombolKeluar.addEventListener("click", () => {
      keluarDariAkun();
      window.location.reload();
    });
  }

  aturFormLogin();
});