/*
  =====================================================================================
  FAVORIT.JS — SATU-SATUNYA file JavaScript yang dipakai oleh html/favorit.html
  -------------------------------------------------------------------------------------


/* =====================================================================================
   BAGIAN 1: NAVIGASI & STATUS LOGIN  (dipakai oleh SEMUA halaman)
   ===================================================================================== */

// Tempat menyimpan status login (sudah login atau belum, siapa namanya)
const KUNCI_STATUS_LOGIN = "buzzlightyearMusicStatusLogin";

// Tempat menyimpan sementara "halaman apa yang tadinya ingin dituju
// sebelum diminta login" (pakai sessionStorage, cuma diingat 1 kunjungan)
const KUNCI_HALAMAN_TUJUAN = "buzzlightyearMusicHalamanTujuan";

/**
 * apakahSudahLogin()
 * true kalau pengguna sudah login, false kalau belum (atau datanya rusak).
 */
function apakahSudahLogin() {
  try {
    const dataTersimpan = localStorage.getItem(KUNCI_STATUS_LOGIN);

    if (!dataTersimpan) {
      return false;
    }

    const status = JSON.parse(dataTersimpan);
    return Boolean(status && status.login === true);
  } catch (kesalahan) {
    console.error("Gagal membaca status login:", kesalahan);
    return false;
  }
}

/**
 * ambilNamaPenggunaLogin()
 * Mengambil nama pengguna yang sedang login untuk sapaan "Hai, <nama>".
 */
function ambilNamaPenggunaLogin() {
  try {
    const dataTersimpan = localStorage.getItem(KUNCI_STATUS_LOGIN);

    if (!dataTersimpan) {
      return "";
    }

    const status = JSON.parse(dataTersimpan);
    return status && status.nama ? status.nama : "";
  } catch (kesalahan) {
    return "";
  }
}

/**
 * keluarDariAkun()
 * Menghapus status login dari localStorage (proses logout/Keluar).
 */
function keluarDariAkun() {
  localStorage.removeItem(KUNCI_STATUS_LOGIN);
}

/**
 * simpanHalamanTujuanSetelahLogin(namaBerkasHtml)
 * Mengingat halaman yang tadinya ingin dituju, supaya setelah login
 * berhasil pengguna otomatis dibalikkan ke sana (bukan ke halaman lain).
 * Dipakai di BAGIAN 6 saat pengguna mengklik tombol suka/tambah-playlist
 * TANPA login terlebih dulu.
 */
function simpanHalamanTujuanSetelahLogin(namaBerkasHtml) {
  sessionStorage.setItem(KUNCI_HALAMAN_TUJUAN, namaBerkasHtml);
}

/**
 * perbaruiTampilanAkunNavigasi()
 * Mengatur pojok kanan header: "Masuk/Daftar" (belum login) ATAU
 * sapaan "Hai, <nama>" + tombol "Keluar" (sudah login).
 */
function perbaruiTampilanAkunNavigasi() {
  const tautanMasuk = document.getElementById("tautan-masuk");
  const tautanDaftar = document.getElementById("tautan-daftar");
  const sapaanAkun = document.getElementById("sapaan-akun");
  const tombolKeluar = document.getElementById("tombol-keluar");

  if (!tautanMasuk && !tautanDaftar && !sapaanAkun && !tombolKeluar) {
    return;
  }

  const sudahLogin = apakahSudahLogin();

  if (tautanMasuk) {
    tautanMasuk.classList.toggle("tersembunyi", sudahLogin);
  }
  if (tautanDaftar) {
    tautanDaftar.classList.toggle("tersembunyi", sudahLogin);
  }

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

/**
 * aturMenuMobile()
 * Buka/tutup menu navigasi di layar HP. Logikanya cuma 1 saklar ON/OFF:
 * class "menu-terbuka" ditambah/dilepas pada <header>, sisanya (animasi,
 * posisi panel) diurus penuh oleh CSS (lihat css/media.css).
 */
function aturMenuMobile() {
  const headerSitus = document.querySelector(".header-situs");
  const tombolHamburger = document.getElementById("tombol-menu-mobile");
  const panelMenu = document.getElementById("panel-menu-mobile");

  if (!headerSitus || !tombolHamburger || !panelMenu) {
    return;
  }

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

/**
 * tulisTahunFooter()
 * Menulis tahun berjalan otomatis ke footer.
 */
function tulisTahunFooter() {
  const tempatTahun = document.getElementById("tahun-berjalan");

  if (!tempatTahun) {
    return;
  }

  const tahunSekarang = new Date().getFullYear();
  tempatTahun.appendChild(document.createTextNode(String(tahunSekarang)));
}


/* =====================================================================================
   BAGIAN 2: PENYIMPANAN DATA FAVORIT  (localStorage)
   -------------------------------------------------------------------------------------
   Setiap lagu yang ditandai suka (♥) disimpan sebagai SATU ARRAY di
   localStorage. Semua fungsi di bawah ini bekerja dengan array tersebut.
   ===================================================================================== */

const kunciPenyimpananFavorit = "buzzlightyearMusicFavorit";

/**
 * ambilDaftarFavorit()
 * Membaca daftar lagu favorit dari localStorage.
 * Hasilnya SELALU berupa array — array kosong [] kalau belum ada data.
 */
function ambilDaftarFavorit() {
  try {
    const dataTersimpan = localStorage.getItem(kunciPenyimpananFavorit);
    // Kalau ada data, ubah teks JSON-nya jadi array. Kalau tidak ada,
    // langsung pakai array kosong.
    const daftar = dataTersimpan ? JSON.parse(dataTersimpan) : [];
    // Array.isArray() memastikan hasilnya benar-benar array (jaga-jaga
    // kalau localStorage berisi data yang aneh/rusak)
    return Array.isArray(daftar) ? daftar : [];
  } catch (kesalahan) {
    console.error("Gagal membaca daftar favorit:", kesalahan);
    return [];
  }
}

/**
 * simpanDaftarFavorit(daftarFavorit)
 * Menuliskan ULANG seluruh daftar favorit ke localStorage.
 */
function simpanDaftarFavorit(daftarFavorit) {
  localStorage.setItem(kunciPenyimpananFavorit, JSON.stringify(daftarFavorit));
}

/**
 * apakahLaguDisukai(idLagu)
 * Memeriksa satu per satu (pakai perulangan for) apakah id lagu ini
 * sudah ada di dalam daftar favorit.
 */
function apakahLaguDisukai(idLagu) {
  const daftarFavorit = ambilDaftarFavorit();

  // Perulangan for klasik: ulangi selama indeks < panjang array
  for (let indeks = 0; indeks < daftarFavorit.length; indeks++) {
    if (daftarFavorit[indeks].id === idLagu) {
      return true; // ketemu -> langsung berhenti & kembalikan true
    }
  }

  return false; // sudah diperiksa semua, tidak ketemu
}

/**
 * ubahStatusFavorit(lagu)
 * Perilaku TOGGLE: kalau lagu BELUM ada di favorit -> ditambahkan.
 * Kalau SUDAH ada -> dihapus. Mengembalikan status akhirnya
 * (true = sekarang disukai, false = sekarang sudah tidak disukai).
 */
function ubahStatusFavorit(lagu) {
  const daftarFavorit = ambilDaftarFavorit();
  const daftarBaru = [];
  let sudahDitemukan = false;

  // Susun ulang daftar TANPA lagu ini (dulu), sambil menandai kalau
  // lagu ini memang ditemukan di daftar lama
  for (let indeks = 0; indeks < daftarFavorit.length; indeks++) {
    if (daftarFavorit[indeks].id === lagu.id) {
      sudahDitemukan = true; // lagu ini "dilewati" (tidak dimasukkan lagi)
    } else {
      daftarBaru.push(daftarFavorit[indeks]);
    }
  }

  // Kalau tadi TIDAK ditemukan di daftar lama, berarti pengguna sedang
  // MENAMBAHKAN-nya sekarang -> masukkan ke daftar baru
  if (!sudahDitemukan) {
    daftarBaru.push(lagu);
  }

  simpanDaftarFavorit(daftarBaru);

  // Kalau tadinya TIDAK ditemukan, berarti sekarang statusnya SUKA (true)
  return !sudahDitemukan;
}


/* =====================================================================================
   BAGIAN 3: PENYIMPANAN DATA PLAYLIST  (localStorage)
   -------------------------------------------------------------------------------------
   Beda dengan Favorit (1 daftar tunggal), Playlist bisa BANYAK — setiap
   playlist punya id, nama, dan daftar lagunya sendiri. Contoh strukturnya:
   [
     { id: "1717000000000", nama: "Lagu Santai", lagu: [ {..objekLagu..} ] },
     { id: "1717000005000", nama: "Semangat Pagi", lagu: [] }
   ]
   ===================================================================================== */

const kunciPenyimpananPlaylist = "buzzlightyearMusicPlaylist";

/**
 * ambilDaftarPlaylist()
 * Membaca seluruh playlist dari localStorage (array kosong jika belum ada).
 */
function ambilDaftarPlaylist() {
  try {
    const dataTersimpan = localStorage.getItem(kunciPenyimpananPlaylist);
    const daftar = dataTersimpan ? JSON.parse(dataTersimpan) : [];
    return Array.isArray(daftar) ? daftar : [];
  } catch (kesalahan) {
    console.error("Gagal membaca daftar playlist:", kesalahan);
    return [];
  }
}

/**
 * simpanDaftarPlaylist(daftarPlaylist)
 * Menuliskan ULANG seluruh daftar playlist ke localStorage.
 */
function simpanDaftarPlaylist(daftarPlaylist) {
  localStorage.setItem(kunciPenyimpananPlaylist, JSON.stringify(daftarPlaylist));
}

/**
 * buatPlaylistBaru(namaPlaylist)
 * Membuat SATU playlist baru dengan nama yang diberikan, lalu
 * menyimpannya. id playlist dibuat dari Date.now() (angka waktu saat
 * ini dalam milidetik) supaya hampir mustahil ada 2 id yang sama persis.
 */
function buatPlaylistBaru(namaPlaylist) {
  // Kalau nama kosong (cuma spasi), beri nama bawaan
  const namaRapi = namaPlaylist.trim() === "" ? "Playlist Tanpa Nama" : namaPlaylist.trim();

  const playlistBaru = {
    id: String(Date.now()),
    nama: namaRapi,
    lagu: [], // playlist baru selalu mulai dari daftar lagu kosong
  };

  const daftarPlaylist = ambilDaftarPlaylist();
  // push() menambahkan 1 elemen baru ke BAGIAN AKHIR array
  daftarPlaylist.push(playlistBaru);
  simpanDaftarPlaylist(daftarPlaylist);

  return playlistBaru;
}

/**
 * apakahLaguAdaDiPlaylist(idPlaylist, idLagu)
 * Memeriksa apakah sebuah lagu sudah ada di dalam playlist tertentu.
 */
function apakahLaguAdaDiPlaylist(idPlaylist, idLagu) {
  const daftarPlaylist = ambilDaftarPlaylist();

  // Cari dulu playlist-nya berdasarkan id
  for (let indeks = 0; indeks < daftarPlaylist.length; indeks++) {
    if (daftarPlaylist[indeks].id !== idPlaylist) {
      continue; // "continue" = lewati sisa kode, lanjut ke perulangan berikutnya
    }

    // Setelah playlist-nya ketemu, cek satu per satu isi lagunya
    const isiLagu = daftarPlaylist[indeks].lagu;
    for (let j = 0; j < isiLagu.length; j++) {
      if (isiLagu[j].id === idLagu) {
        return true;
      }
    }
  }

  return false;
}

/**
 * ubahStatusLaguDiPlaylist(idPlaylist, lagu)
 * Perilaku TOGGLE (sama seperti ubahStatusFavorit): kalau lagu belum
 * ada di playlist -> ditambahkan. Kalau sudah ada -> dihapus.
 */
function ubahStatusLaguDiPlaylist(idPlaylist, lagu) {
  const daftarPlaylist = ambilDaftarPlaylist();
  let statusAkhir = false;

  for (let indeks = 0; indeks < daftarPlaylist.length; indeks++) {
    if (daftarPlaylist[indeks].id !== idPlaylist) {
      continue;
    }

    const isiLaguBaru = [];
    let sudahDitemukan = false;

    for (let j = 0; j < daftarPlaylist[indeks].lagu.length; j++) {
      if (daftarPlaylist[indeks].lagu[j].id === lagu.id) {
        sudahDitemukan = true;
      } else {
        isiLaguBaru.push(daftarPlaylist[indeks].lagu[j]);
      }
    }

    if (!sudahDitemukan) {
      isiLaguBaru.push(lagu);
    }

    daftarPlaylist[indeks].lagu = isiLaguBaru;
    statusAkhir = !sudahDitemukan;
  }

  simpanDaftarPlaylist(daftarPlaylist);
  return statusAkhir;
}


/* =====================================================================================
   BAGIAN 4: MODAL PEMUTAR MUSIK
   -------------------------------------------------------------------------------------
   Musik diputar LANGSUNG di halaman ini lewat <iframe> yang alamatnya
   (lagu.embed) sudah disediakan oleh REST API, ditampilkan di dalam kotak
   modal yang muncul di tengah layar. Jadi kita TIDAK PERLU menulis kode
   JavaScript tambahan untuk memutar audio (mis. elemen <audio> manual) —
   cukup sisipkan alamat itu ke sebuah <iframe>, dan pemutarnya sudah
   otomatis muncul lengkap dengan tombol play/pause bawaan dari sumbernya.
   ===================================================================================== */

/**
 * bukaPemutar(lagu)
 * Menampilkan modal, lalu menyisipkan <iframe> sesuai lagu yang dipilih.
 */
function bukaPemutar(lagu) {
  const modal = document.getElementById("modal-pemutar");
  const judulModal = document.getElementById("judul-modal-pemutar");
  const wadahIframe = document.getElementById("wadah-iframe-pemutar");

  if (!modal || !wadahIframe) {
    return;
  }

  if (judulModal) {
    // Kosongkan judul lama dulu tanpa innerHTML (pakai perulangan while)
    while (judulModal.firstChild) {
      judulModal.removeChild(judulModal.firstChild);
    }
    judulModal.appendChild(document.createTextNode(lagu.title + " — " + lagu.artist));
  }

  // Kosongkan iframe lama (jika sebelumnya pernah memutar lagu lain)
  while (wadahIframe.firstChild) {
    wadahIframe.removeChild(wadahIframe.firstChild);
  }

  // createElement("iframe") membuat elemen <iframe> baru di memori
  // (belum tampil di halaman sampai di-appendChild)
  const iframePemutar = document.createElement("iframe");
  iframePemutar.src = lagu.embed;
  iframePemutar.allow = "autoplay *; encrypted-media *; fullscreen *; clipboard-write";
  iframePemutar.loading = "lazy";
  iframePemutar.setAttribute(
    "sandbox",
    "allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
  );

  wadahIframe.appendChild(iframePemutar);

  // Tambahkan class "tampil" supaya modal (tadinya display:none lewat
  // CSS) berubah jadi terlihat
  modal.classList.add("tampil");
  modal.setAttribute("aria-hidden", "false");
  // Kunci scroll halaman belakang selagi modal terbuka
  document.body.classList.add("kunci-gulir");
}

/**
 * tutupPemutar()
 * Menutup modal dan MEMBONGKAR iframe-nya, supaya audio yang sedang
 * berjalan otomatis berhenti (bukan cuma disembunyikan).
 */
function tutupPemutar() {
  const modal = document.getElementById("modal-pemutar");
  const wadahIframe = document.getElementById("wadah-iframe-pemutar");

  if (!modal) {
    return;
  }

  modal.classList.remove("tampil");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("kunci-gulir");

  if (wadahIframe) {
    while (wadahIframe.firstChild) {
      wadahIframe.removeChild(wadahIframe.firstChild);
    }
  }
}

/**
 * aturModalPemutar()
 * Memasang semua event handler yang dibutuhkan modal pemutar: klik
 * area gelap di belakang modal, klik tombol ✕, dan tombol Escape.
 */
function aturModalPemutar() {
  const modal = document.getElementById("modal-pemutar");

  if (!modal) {
    return;
  }

  const latarModal = document.getElementById("latar-modal");
  const tombolTutup = document.getElementById("tombol-tutup-modal");

  if (latarModal) {
    latarModal.addEventListener("click", tutupPemutar);
  }

  if (tombolTutup) {
    tombolTutup.addEventListener("click", tutupPemutar);
  }

  document.addEventListener("keydown", (peristiwa) => {
    if (peristiwa.key === "Escape" && modal.classList.contains("tampil")) {
      tutupPemutar();
    }
  });
}


/* =====================================================================================
   BAGIAN 5: MODAL PILIH/TAMBAH KE PLAYLIST
   -------------------------------------------------------------------------------------
   Modal kecil yang muncul saat tombol "+" pada kartu lagu diklik. Isinya
   daftar playlist yang sudah ada (dengan tombol Tambah/Hapus untuk lagu
   yang sedang dipilih), plus formulir kecil untuk membuat playlist baru.
   ===================================================================================== */

// Menyimpan SEMENTARA lagu mana yang sedang dipilih pengguna untuk
// ditambahkan ke salah satu playlist (diisi saat modal dibuka)
let laguYangSedangDipilihUntukPlaylist = null;

/**
 * bukaModalPilihPlaylist(lagu)
 * Menampilkan modal "Tambah ke Playlist" untuk satu lagu tertentu.
 */
function bukaModalPilihPlaylist(lagu) {
  const modal = document.getElementById("modal-playlist");

  if (!modal) {
    return;
  }

  laguYangSedangDipilihUntukPlaylist = lagu;

  const judulModal = document.getElementById("judul-modal-playlist");
  if (judulModal) {
    while (judulModal.firstChild) {
      judulModal.removeChild(judulModal.firstChild);
    }
    judulModal.appendChild(
      document.createTextNode("Tambah \u201c" + lagu.title + "\u201d ke Playlist")
    );
  }

  tampilkanDaftarPilihanPlaylist();

  modal.classList.add("tampil");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("kunci-gulir");
}

/**
 * tutupModalPilihPlaylist()
 * Menutup modal pemilihan playlist.
 */
function tutupModalPilihPlaylist() {
  const modal = document.getElementById("modal-playlist");

  if (!modal) {
    return;
  }

  modal.classList.remove("tampil");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("kunci-gulir");
  laguYangSedangDipilihUntukPlaylist = null;
}

/**
 * tampilkanDaftarPilihanPlaylist()
 * Membangun ULANG daftar playlist di dalam modal, lengkap dengan
 * tombol Tambah/Hapus. Dipanggil ulang setiap ada perubahan (playlist
 * baru dibuat, atau status lagu di sebuah playlist berubah).
 */
function tampilkanDaftarPilihanPlaylist() {
  const wadahDaftar = document.getElementById("daftar-pilihan-playlist");

  if (!wadahDaftar) {
    return;
  }

  while (wadahDaftar.firstChild) {
    wadahDaftar.removeChild(wadahDaftar.firstChild);
  }

  const daftarPlaylist = ambilDaftarPlaylist();

  // Kalau pengguna belum pernah buat playlist sama sekali
  if (daftarPlaylist.length === 0) {
    const pesan = document.createElement("p");
    pesan.className = "pesan-playlist-kosong";
    pesan.appendChild(
      document.createTextNode("Kamu belum punya playlist. Buat satu lewat formulir di bawah ini.")
    );
    wadahDaftar.appendChild(pesan);
    return;
  }

  // Bangun 1 baris untuk SETIAP playlist yang ada
  for (let indeks = 0; indeks < daftarPlaylist.length; indeks++) {
    const playlist = daftarPlaylist[indeks];
    wadahDaftar.appendChild(buatBarisPilihanPlaylist(playlist));
  }
}

/**
 * buatBarisPilihanPlaylist(playlist)
 * Membangun SATU baris playlist di dalam modal: nama, jumlah lagu, dan
 * tombol Tambah/Hapus untuk lagu yang sedang dipilih pengguna.
 */
function buatBarisPilihanPlaylist(playlist) {
  const baris = document.createElement("div");
  baris.className = "baris-pilihan-playlist";

  const info = document.createElement("div");
  info.className = "info-pilihan-playlist";

  const nama = document.createElement("p");
  nama.className = "nama-pilihan-playlist";
  nama.appendChild(document.createTextNode(playlist.nama));

  const jumlah = document.createElement("p");
  jumlah.className = "jumlah-pilihan-playlist";
  jumlah.appendChild(document.createTextNode(playlist.lagu.length + " lagu"));

  info.appendChild(nama);
  info.appendChild(jumlah);

  // Cek dulu: lagu yang sedang dipilih ini sudah ada di playlist ini atau belum?
  const sudahAda =
    laguYangSedangDipilihUntukPlaylist &&
    apakahLaguAdaDiPlaylist(playlist.id, laguYangSedangDipilihUntukPlaylist.id);

  const tombolToggle = document.createElement("button");
  tombolToggle.type = "button";
  // Ternary dipakai untuk memilih salah satu dari 2 class/teks,
  // tergantung kondisi "sudahAda" di atas
  tombolToggle.className = sudahAda ? "tombol-hapus-dari-playlist" : "tombol-tambah-ke-playlist-modal";
  tombolToggle.appendChild(document.createTextNode(sudahAda ? "Hapus" : "+ Tambah"));

  tombolToggle.addEventListener("click", () => {
    if (!laguYangSedangDipilihUntukPlaylist) {
      return;
    }
    ubahStatusLaguDiPlaylist(playlist.id, laguYangSedangDipilihUntukPlaylist);
    // Gambar ulang daftarnya supaya tombol Tambah/Hapus langsung berubah
    tampilkanDaftarPilihanPlaylist();
  });

  baris.appendChild(info);
  baris.appendChild(tombolToggle);

  return baris;
}

/**
 * aturModalPilihPlaylist()
 * Memasang semua event handler modal ini: tutup modal, dan submit
 * formulir "buat playlist baru".
 */
function aturModalPilihPlaylist() {
  const modal = document.getElementById("modal-playlist");

  if (!modal) {
    return;
  }

  const latarModal = document.getElementById("latar-modal-playlist");
  const tombolTutup = document.getElementById("tombol-tutup-modal-playlist");
  const formPlaylistBaru = document.getElementById("form-playlist-baru");

  if (latarModal) {
    latarModal.addEventListener("click", tutupModalPilihPlaylist);
  }

  if (tombolTutup) {
    tombolTutup.addEventListener("click", tutupModalPilihPlaylist);
  }

  document.addEventListener("keydown", (peristiwa) => {
    if (peristiwa.key === "Escape" && modal.classList.contains("tampil")) {
      tutupModalPilihPlaylist();
    }
  });

  if (formPlaylistBaru) {
    formPlaylistBaru.addEventListener("submit", (peristiwa) => {
      peristiwa.preventDefault();

      const kotakNama = document.getElementById("nama-playlist-baru");
      const namaBaru = kotakNama ? kotakNama.value : "";

      if (namaBaru.trim() === "") {
        return;
      }

      const playlistBaru = buatPlaylistBaru(namaBaru);

      // Lagu yang sedang dibuka di modal langsung dimasukkan ke
      // playlist yang baru saja dibuat ini
      if (laguYangSedangDipilihUntukPlaylist) {
        ubahStatusLaguDiPlaylist(playlistBaru.id, laguYangSedangDipilihUntukPlaylist);
      }

      if (kotakNama) {
        kotakNama.value = "";
      }

      tampilkanDaftarPilihanPlaylist();
    });
  }
}



/* =====================================================================================
   BAGIAN 6: LOGIKA KHUSUS HALAMAN FAVORIT
   -------------------------------------------------------------------------------------
   Menampilkan daftar lagu favorit (dari localStorage), dengan tombol Putar,
   "+ Playlist", dan Hapus di tiap barisnya. Halaman ini WAJIB LOGIN — kalau
   belum, tampilkan ajakan untuk masuk dulu (bukan daftar favoritnya).
   ===================================================================================== */

/**
 * tampilkanHalamanFavorit()
 * Fungsi utama halaman ini. Alurnya:
 *   1. Cek dulu status login. Kalau BELUM login -> tampilkan ajakan masuk, SELESAI.
 *   2. Kalau SUDAH login -> ambil daftar favorit dari localStorage.
 *   3. Kalau daftarnya KOSONG -> tampilkan pesan "belum ada favorit".
 *   4. Kalau ADA isinya -> bangun 1 baris untuk SETIAP lagu favorit.
 */
function tampilkanHalamanFavorit() {
  const wadahDaftarFavorit = document.getElementById("daftar-favorit");
  const pesanKosong = document.getElementById("pesan-favorit-kosong");

  if (!wadahDaftarFavorit) {
    return;
  }

  // LANGKAH 1: cek status login lebih dulu
  if (!apakahSudahLogin()) {
    tampilkanAjakanLoginFavorit(wadahDaftarFavorit, pesanKosong);
    return;
  }

  tampilkanDaftarFavorit(wadahDaftarFavorit, pesanKosong);
}

/**
 * tampilkanAjakanLoginFavorit(wadahDaftarFavorit, pesanKosong)
 * Menampilkan ajakan "silakan masuk dulu" menggantikan daftar favorit,
 * dibangun murni lewat createElement()/appendChild() (bukan innerHTML).
 */
function tampilkanAjakanLoginFavorit(wadahDaftarFavorit, pesanKosong) {
  if (pesanKosong) {
    pesanKosong.style.display = "none";
  }

  kosongkanElemen(wadahDaftarFavorit);

  const pesan = document.createElement("p");
  pesan.className = "pesan-status";
  pesan.appendChild(document.createTextNode("Kamu harus "));

  const tautanLogin = document.createElement("a");
  tautanLogin.href = "login.html";
  tautanLogin.className = "tautan-aksen";
  tautanLogin.appendChild(document.createTextNode("masuk (login)"));
  // Simpan dulu "favorit.html" sebagai halaman tujuan, supaya setelah
  // login berhasil pengguna otomatis dibalikkan ke halaman ini lagi
  tautanLogin.addEventListener("click", () => {
    simpanHalamanTujuanSetelahLogin("favorit.html");
  });

  pesan.appendChild(tautanLogin);
  pesan.appendChild(document.createTextNode(" dulu untuk melihat daftar lagu favoritmu."));

  wadahDaftarFavorit.appendChild(pesan);
}

/**
 * tampilkanDaftarFavorit(wadahDaftarFavorit, pesanKosong)
 * Mengosongkan wadah, lalu membangun ULANG 1 baris untuk SETIAP lagu
 * yang ada di localStorage favorit.
 */
function tampilkanDaftarFavorit(wadahDaftarFavorit, pesanKosong) {
  const daftarFavorit = ambilDaftarFavorit();

  kosongkanElemen(wadahDaftarFavorit);

  if (daftarFavorit.length === 0) {
    if (pesanKosong) {
      pesanKosong.style.display = "block";
    }
    return;
  }

  if (pesanKosong) {
    pesanKosong.style.display = "none";
  }

  for (let indeks = 0; indeks < daftarFavorit.length; indeks++) {
    const lagu = daftarFavorit[indeks];
    wadahDaftarFavorit.appendChild(buatBarisFavorit(lagu, wadahDaftarFavorit, pesanKosong));
  }
}

/**
 * buatBarisFavorit(lagu, wadahDaftarFavorit, pesanKosong)
 * Membangun SATU baris lagu favorit: gambar sampul, judul, artis, dan
 * 3 tombol aksi (Putar, + Playlist, Hapus) yang sejajar dalam satu baris.
 */
function buatBarisFavorit(lagu, wadahDaftarFavorit, pesanKosong) {
  const baris = document.createElement("div");
  baris.className = "baris-favorit";

  const gambar = document.createElement("img");
  gambar.src = lagu.image;
  gambar.alt = "Sampul lagu " + lagu.title;
  gambar.loading = "lazy";

  const infoBaris = document.createElement("div");
  infoBaris.className = "info-baris-favorit";

  const judul = document.createElement("h3");
  judul.appendChild(document.createTextNode(lagu.title));

  const artis = document.createElement("p");
  artis.appendChild(document.createTextNode(lagu.artist));

  infoBaris.appendChild(judul);
  infoBaris.appendChild(artis);

  const aksiBaris = document.createElement("div");
  aksiBaris.className = "aksi-baris-favorit";

  // Tombol Putar
  const tombolPutar = document.createElement("button");
  tombolPutar.type = "button";
  tombolPutar.className = "tombol-putar-favorit";
  tombolPutar.appendChild(document.createTextNode("▶ Putar"));
  tombolPutar.addEventListener("click", () => {
    bukaPemutar(lagu);
  });

  // Tombol "+ Playlist"
  const tombolTambahPlaylist = document.createElement("button");
  tombolTambahPlaylist.type = "button";
  tombolTambahPlaylist.className = "tombol-tambah-playlist-favorit";
  tombolTambahPlaylist.appendChild(document.createTextNode("+ Playlist"));
  tombolTambahPlaylist.addEventListener("click", () => {
    bukaModalPilihPlaylist(lagu);
  });

  // Tombol Hapus (dari daftar favorit)
  const tombolHapus = document.createElement("button");
  tombolHapus.type = "button";
  tombolHapus.className = "tombol-hapus-favorit";
  tombolHapus.appendChild(document.createTextNode("Hapus"));
  tombolHapus.addEventListener("click", () => {
    // ubahStatusFavorit melakukan TOGGLE — karena lagu ini SUDAH pasti
    // ada di daftar (kita sedang menampilkannya), hasilnya pasti
    // menghapusnya dari daftar favorit
    ubahStatusFavorit(lagu);
    // Gambar ulang seluruh daftar supaya baris yang dihapus tadi hilang
    tampilkanDaftarFavorit(wadahDaftarFavorit, pesanKosong);
  });

  aksiBaris.appendChild(tombolPutar);
  aksiBaris.appendChild(tombolTambahPlaylist);
  aksiBaris.appendChild(tombolHapus);

  baris.appendChild(gambar);
  baris.appendChild(infoBaris);
  baris.appendChild(aksiBaris);

  return baris;
}

/**
 * kosongkanElemen(elemen)
 * Mengosongkan seluruh isi sebuah elemen TANPA memakai innerHTML.
 */
function kosongkanElemen(elemen) {
  while (elemen.firstChild) {
    elemen.removeChild(elemen.firstChild);
  }
}


/* =====================================================================================
   BAGIAN 7: TITIK MULAI (dijalankan begitu HTML selesai dimuat)
   ===================================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // --- bagian yang berlaku di semua halaman ---
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

  // --- bagian modal (pemutar & pilih playlist) ---
  aturModalPemutar();
  aturModalPilihPlaylist();

  // --- bagian khusus halaman Favorit ---
  tampilkanHalamanFavorit();
});
