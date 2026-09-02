/*
  =====================================================================================
  PLAYLIST.JS — SATU-SATUNYA file JavaScript yang dipakai oleh html/playlist.html
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
   BAGIAN 6: LOGIKA KHUSUS HALAMAN PLAYLIST
   -------------------------------------------------------------------------------------
   Membuat, menampilkan, membuka/menutup isi, dan menghapus playlist beserta
   lagu-lagu di dalamnya. Halaman ini WAJIB LOGIN, sama seperti Favorit.
   ===================================================================================== */

// Menyimpan id-id playlist yang sedang dalam keadaan "terbuka" (isi
// lagunya sedang ditampilkan), supaya keadaan buka/tutup tidak hilang
// setiap kali daftar digambar ulang (mis. setelah menghapus 1 lagu)
const idPlaylistYangSedangTerbuka = new Set();

/**
 * aturHalamanPlaylist()
 * Fungsi utama halaman ini. Alurnya:
 *   1. Cek status login. Kalau BELUM login -> tampilkan ajakan masuk, SELESAI.
 *   2. Kalau SUDAH login -> tampilkan & aktifkan formulir "+ Buat Playlist".
 *   3. Tampilkan seluruh playlist yang sudah ada.
 */
function aturHalamanPlaylist() {
  const wadahDaftarPlaylist = document.getElementById("daftar-playlist");
  const pesanKosong = document.getElementById("pesan-playlist-kosong");
  const formBuatPlaylist = document.getElementById("form-buat-playlist-halaman");

  if (!wadahDaftarPlaylist) {
    return;
  }

  // LANGKAH 1: cek status login lebih dulu
  if (!apakahSudahLogin()) {
    tampilkanAjakanLoginPlaylist(wadahDaftarPlaylist, pesanKosong, formBuatPlaylist);
    return;
  }

  // LANGKAH 2: tampilkan & aktifkan formulir buat playlist
  if (formBuatPlaylist) {
    formBuatPlaylist.classList.remove("tersembunyi");

    formBuatPlaylist.addEventListener("submit", (peristiwa) => {
      peristiwa.preventDefault();

      const kotakNama = document.getElementById("nama-playlist-halaman");
      const namaBaru = kotakNama ? kotakNama.value : "";

      if (namaBaru.trim() === "") {
        return;
      }

      const playlistBaru = buatPlaylistBaru(namaBaru);
      // Playlist yang baru dibuat langsung ditampilkan dalam keadaan terbuka
      idPlaylistYangSedangTerbuka.add(playlistBaru.id);

      if (kotakNama) {
        kotakNama.value = "";
      }

      tampilkanDaftarPlaylistHalaman(wadahDaftarPlaylist, pesanKosong);
    });
  }

  // LANGKAH 3: tampilkan seluruh playlist yang sudah ada
  tampilkanDaftarPlaylistHalaman(wadahDaftarPlaylist, pesanKosong);
}

/**
 * tampilkanAjakanLoginPlaylist(...)
 * Mengganti isi wadah daftar playlist dengan ajakan untuk login dulu,
 * sekaligus menyembunyikan formulir buat playlist.
 */
function tampilkanAjakanLoginPlaylist(wadahDaftarPlaylist, pesanKosong, formBuatPlaylist) {
  if (pesanKosong) {
    pesanKosong.style.display = "none";
  }

  if (formBuatPlaylist) {
    formBuatPlaylist.classList.add("tersembunyi");
  }

  kosongkanElemen(wadahDaftarPlaylist);

  const pesan = document.createElement("p");
  pesan.className = "pesan-status";
  pesan.appendChild(document.createTextNode("Kamu harus "));

  const tautanLogin = document.createElement("a");
  tautanLogin.href = "login.html";
  tautanLogin.className = "tautan-aksen";
  tautanLogin.appendChild(document.createTextNode("masuk (login)"));
  tautanLogin.addEventListener("click", () => {
    simpanHalamanTujuanSetelahLogin("playlist.html");
  });

  pesan.appendChild(tautanLogin);
  pesan.appendChild(document.createTextNode(" dulu untuk membuat dan melihat playlist musikmu."));

  wadahDaftarPlaylist.appendChild(pesan);
}

/**
 * tampilkanDaftarPlaylistHalaman(wadahDaftarPlaylist, pesanKosong)
 * Mengosongkan wadah, lalu membangun ULANG seluruh kartu playlist.
 */
function tampilkanDaftarPlaylistHalaman(wadahDaftarPlaylist, pesanKosong) {
  const daftarPlaylist = ambilDaftarPlaylist();

  kosongkanElemen(wadahDaftarPlaylist);

  if (daftarPlaylist.length === 0) {
    if (pesanKosong) {
      pesanKosong.style.display = "block";
    }
    return;
  }

  if (pesanKosong) {
    pesanKosong.style.display = "none";
  }

  for (let indeks = 0; indeks < daftarPlaylist.length; indeks++) {
    const playlist = daftarPlaylist[indeks];
    wadahDaftarPlaylist.appendChild(buatKartuPlaylist(playlist, wadahDaftarPlaylist, pesanKosong));
  }
}

/**
 * buatKartuPlaylist(playlist, wadahDaftarPlaylist, pesanKosong)
 * Membangun satu kartu playlist: kepala (nama, jumlah lagu, tombol
 * lihat/sembunyikan & hapus playlist) dan isi (daftar lagu, hanya
 * ditampilkan kalau playlist ini sedang "terbuka").
 */
function buatKartuPlaylist(playlist, wadahDaftarPlaylist, pesanKosong) {
  const kartu = document.createElement("article");
  kartu.className = "kartu-playlist";

  const kepala = document.createElement("div");
  kepala.className = "kepala-kartu-playlist";

  const info = document.createElement("div");
  const nama = document.createElement("h3");
  nama.appendChild(document.createTextNode(playlist.nama));
  const jumlah = document.createElement("p");
  jumlah.className = "jumlah-lagu-playlist";
  jumlah.appendChild(document.createTextNode(playlist.lagu.length + " lagu"));
  info.appendChild(nama);
  info.appendChild(jumlah);

  const aksiKepala = document.createElement("div");
  aksiKepala.className = "aksi-kepala-playlist";

  const sedangTerbuka = idPlaylistYangSedangTerbuka.has(playlist.id);

  const tombolLihat = document.createElement("button");
  tombolLihat.type = "button";
  tombolLihat.className = "tombol-lihat-playlist";
  tombolLihat.appendChild(document.createTextNode(sedangTerbuka ? "Sembunyikan" : "Lihat Lagu"));
  tombolLihat.addEventListener("click", () => {
    // Perilaku TOGGLE memakai Set: kalau id-nya sudah ada di dalam Set,
    // hapus (artinya sekarang "tertutup"). Kalau belum ada, tambahkan
    // (artinya sekarang "terbuka").
    if (idPlaylistYangSedangTerbuka.has(playlist.id)) {
      idPlaylistYangSedangTerbuka.delete(playlist.id);
    } else {
      idPlaylistYangSedangTerbuka.add(playlist.id);
    }
    tampilkanDaftarPlaylistHalaman(wadahDaftarPlaylist, pesanKosong);
  });

  const tombolHapusPlaylist = document.createElement("button");
  tombolHapusPlaylist.type = "button";
  tombolHapusPlaylist.className = "tombol-hapus-playlist";
  tombolHapusPlaylist.appendChild(document.createTextNode("Hapus Playlist"));
  tombolHapusPlaylist.addEventListener("click", () => {
    // confirm() menampilkan kotak dialog bawaan browser dengan tombol
    // OK/Batal, mengembalikan true kalau pengguna menekan OK
    const yakin = window.confirm(
      "Hapus playlist \u201c" + playlist.nama + "\u201d beserta seluruh isinya?"
    );
    if (!yakin) {
      return;
    }
    hapusPlaylist(playlist.id);
    idPlaylistYangSedangTerbuka.delete(playlist.id);
    tampilkanDaftarPlaylistHalaman(wadahDaftarPlaylist, pesanKosong);
  });

  aksiKepala.appendChild(tombolLihat);
  aksiKepala.appendChild(tombolHapusPlaylist);

  kepala.appendChild(info);
  kepala.appendChild(aksiKepala);
  kartu.appendChild(kepala);

  if (sedangTerbuka) {
    kartu.appendChild(buatIsiKartuPlaylist(playlist, wadahDaftarPlaylist, pesanKosong));
  }

  return kartu;
}

/**
 * buatIsiKartuPlaylist(playlist, wadahDaftarPlaylist, pesanKosong)
 * Membangun daftar lagu di dalam satu kartu playlist yang sedang
 * terbuka. Kalau playlist masih kosong, tampilkan pesan ajakan.
 */
function buatIsiKartuPlaylist(playlist, wadahDaftarPlaylist, pesanKosong) {
  const isi = document.createElement("div");
  isi.className = "isi-kartu-playlist";

  if (playlist.lagu.length === 0) {
    const pesan = document.createElement("p");
    pesan.className = "pesan-playlist-item-kosong";
    pesan.appendChild(
      document.createTextNode(
        "Belum ada lagu di playlist ini. Tambahkan lewat tombol \u201c+\u201d di halaman Musik."
      )
    );
    isi.appendChild(pesan);
    return isi;
  }

  for (let indeks = 0; indeks < playlist.lagu.length; indeks++) {
    const lagu = playlist.lagu[indeks];
    isi.appendChild(buatBarisLaguPlaylist(lagu, playlist, wadahDaftarPlaylist, pesanKosong));
  }

  return isi;
}

/**
 * buatBarisLaguPlaylist(lagu, playlist, wadahDaftarPlaylist, pesanKosong)
 * Membangun satu baris lagu di dalam kartu playlist: gambar, judul,
 * artis, tombol putar, dan tombol hapus (dari playlist ini saja).
 */
function buatBarisLaguPlaylist(lagu, playlist, wadahDaftarPlaylist, pesanKosong) {
  const baris = document.createElement("div");
  baris.className = "baris-favorit baris-lagu-playlist";

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

  const tombolPutar = document.createElement("button");
  tombolPutar.type = "button";
  tombolPutar.className = "tombol-putar-favorit";
  tombolPutar.appendChild(document.createTextNode("▶ Putar"));
  tombolPutar.addEventListener("click", () => {
    bukaPemutar(lagu);
  });

  const tombolHapus = document.createElement("button");
  tombolHapus.type = "button";
  tombolHapus.className = "tombol-hapus-favorit";
  tombolHapus.appendChild(document.createTextNode("Hapus"));
  tombolHapus.addEventListener("click", () => {
    hapusLaguDariPlaylist(playlist.id, lagu.id);
    tampilkanDaftarPlaylistHalaman(wadahDaftarPlaylist, pesanKosong);
  });

  aksiBaris.appendChild(tombolPutar);
  aksiBaris.appendChild(tombolHapus);

  baris.appendChild(gambar);
  baris.appendChild(infoBaris);
  baris.appendChild(aksiBaris);

  return baris;
}

/**
 * hapusLaguDariPlaylist(idPlaylist, idLagu)
 * Menghapus satu lagu tertentu dari satu playlist tertentu (BUKAN
 * perilaku toggle seperti ubahStatusLaguDiPlaylist — di sini pasti
 * dihapus, karena dipanggil dari tombol "Hapus" pada lagu yang memang
 * sudah pasti ada di playlist tersebut).
 */
function hapusLaguDariPlaylist(idPlaylist, idLagu) {
  const daftarPlaylist = ambilDaftarPlaylist();

  for (let indeks = 0; indeks < daftarPlaylist.length; indeks++) {
    if (daftarPlaylist[indeks].id !== idPlaylist) {
      continue;
    }

    const isiLaguBaru = [];
    for (let j = 0; j < daftarPlaylist[indeks].lagu.length; j++) {
      if (daftarPlaylist[indeks].lagu[j].id !== idLagu) {
        isiLaguBaru.push(daftarPlaylist[indeks].lagu[j]);
      }
    }
    daftarPlaylist[indeks].lagu = isiLaguBaru;
  }

  simpanDaftarPlaylist(daftarPlaylist);
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

  // --- bagian modal pemutar (dipakai saat tombol "Putar" pada lagu
  //     di dalam playlist diklik) ---
  aturModalPemutar();

  // --- bagian khusus halaman Playlist ---
  aturHalamanPlaylist();
});
