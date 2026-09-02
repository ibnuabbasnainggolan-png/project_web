/*
  =====================================================================================
  MUSIK.JS — SATU-SATUNYA file JavaScript yang dipakai oleh html/musik.html
  -------------------------------------------------------------------------------------


/* =====================================================================================
   BAGIAN 1: NAVIGASI & STATUS LOGIN  (dipakai oleh SEMUA halaman)
   ===================================================================================== */

// Tempat menyimpan status login (sudah login atau belum, siapa namanya)
const kunciStatusLogin = "buzzlightyearMusicStatusLogin";

// Tempat menyimpan sementara "halaman apa yang tadinya ingin dituju
// sebelum diminta login" (pakai sessionStorage, cuma diingat 1 kunjungan)
const kunciHalamanTujuan = "buzzlightyearMusicHalamanTujuan";

/**
 * apakahSudahLogin()
 * true kalau pengguna sudah login, false kalau belum (atau datanya rusak).
 */
function apakahSudahLogin() {
  try {
    const dataTersimpan = localStorage.getItem(kunciStatusLogin);

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
    const dataTersimpan = localStorage.getItem(kunciStatusLogin);

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
  localStorage.removeItem(kunciStatusLogin);
}

/**
 * simpanHalamanTujuanSetelahLogin(namaBerkasHtml)
 * Mengingat halaman yang tadinya ingin dituju, supaya setelah login
 * berhasil pengguna otomatis dibalikkan ke sana (bukan ke halaman lain).
 * Dipakai di BAGIAN 6 saat pengguna mengklik tombol suka/tambah-playlist
 * TANPA login terlebih dulu.
 */
function simpanHalamanTujuanSetelahLogin(namaBerkasHtml) {
  sessionStorage.setItem(kunciHalamanTujuan, namaBerkasHtml);
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
      document.createTextNode("Tambah album \u201c" + lagu.artist + "\u201d ke Playlist")
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
   BAGIAN 6: LOGIKA KHUSUS HALAMAN MUSIK
   -------------------------------------------------------------------------------------
   Bagian ini yang membedakan musik.js dari file JS halaman lain: mengambil
   data lagu dari REST API (fetch), lalu membangun kartu-kartu lagu, kotak
   pencarian, dan tombol acak. Sengaja dibuat SESEDERHANA MUNGKIN — kalau
   sebuah tugas bisa diselesaikan tanpa JavaScript tambahan (mis. pemutar
   lagu cukup pakai <iframe> bawaan dari API, tanpa perlu <audio> manual
   atau pencarian ke API kedua), maka TIDAK dipakai supaya kode tetap
   ringkas dan mudah dipahami.
   ===================================================================================== */

// Alamat REST API sumber data musik (tidak berubah-ubah)
const alamatApiMusik = "https://golan-api.vercel.app/music.json";

// Menyimpan SELURUH data lagu hasil fetch, supaya bisa dipakai ulang
// saat pengguna mengetik di kotak pencarian (tanpa fetch berkali-kali)
let seluruhDataLagu = [];

// Menyimpan id lagu terakhir yang ditampilkan tombol "Acak", supaya
// tidak menampilkan lagu yang SAMA dua kali berturut-turut
let idLaguTerakhirDiacak = null;

/**
 * ambilDataMusik(elemenKisiMusik, elemenInfoHasil)
 * Mengambil data JSON dari REST API memakai fetch(), lalu menampilkan
 * kartu-kartu lagu. Fungsi ini "async" karena fetch() butuh waktu
 * (menunggu jawaban dari internet), dan kita memakai kata kunci
 * "await" supaya kode berhenti sejenak menunggu jawabannya datang
 * sebelum melanjutkan baris berikutnya.
 */
async function ambilDataMusik(elemenKisiMusik, elemenInfoHasil) {
  tampilkanPesanStatus(elemenKisiMusik, "Sedang memuat daftar lagu...");

  // try...catch dipakai supaya kalau internet mati / API error,
  // program tidak berhenti total — cukup tampilkan pesan kegagalan
  try {
    // fetch() mengirim permintaan (request) ke alamat API, lalu
    // "await" menunggu jawabannya (response) datang
    const responsApi = await fetch(alamatApiMusik);

    // response.ok bernilai false kalau server membalas dengan kode
    // error (mis. 404 Not Found, 500 Server Error)
    if (!responsApi.ok) {
      throw new Error("Gagal mengambil data, status: " + responsApi.status);
    }

    // .json() mengubah jawaban mentah dari server menjadi data
    // JavaScript (array/objek) yang bisa langsung dipakai
    const dataJson = await responsApi.json();

    seluruhDataLagu = dataJson;
    tampilkanKartuLagu(seluruhDataLagu, elemenKisiMusik);
    perbaruiInfoHasil(elemenInfoHasil, seluruhDataLagu.length, seluruhDataLagu.length, "");
  } catch (kesalahan) {
    console.error("Terjadi kesalahan saat mengambil data musik:", kesalahan);
    tampilkanPesanStatus(
      elemenKisiMusik,
      "Maaf, data lagu gagal dimuat. Periksa koneksi internet Anda lalu muat ulang halaman."
    );
  }
}

/**
 * saringDataLagu(dataLagu, kataKunci)
 * Menyaring daftar lagu berdasarkan kata kunci pada judul, artis, atau
 * tag pencarian. Memakai perulangan for klasik untuk memeriksa satu
 * per satu lagu dalam array. Pencarian ini murni dilakukan DI SISI
 * BROWSER (data yang sudah ada di seluruhDataLagu), TIDAK perlu
 * menghubungi internet lagi setiap kali mengetik — makanya terasa
 * instan walau tanpa tombol "Cari" terpisah.
 */
function saringDataLagu(dataLagu, kataKunci) {
  // toLowerCase() menyamakan huruf besar/kecil supaya pencarian tidak
  // peka huruf besar-kecil ("Rock" akan cocok dengan "rock")
  const kataKunciRapi = kataKunci.trim().toLowerCase();

  // Kalau kotak pencarian kosong, tampilkan SEMUA lagu (tidak disaring)
  if (kataKunciRapi === "") {
    return dataLagu;
  }

  const hasilSaringan = [];

  for (let indeks = 0; indeks < dataLagu.length; indeks++) {
    const lagu = dataLagu[indeks];
    const judulCocok = lagu.title.toLowerCase().includes(kataKunciRapi);
    const artisCocok = lagu.artist.toLowerCase().includes(kataKunciRapi);
    const tagCocok = cariDiTag(lagu.search_tags, kataKunciRapi);

    // Kalau SALAH SATU saja cocok (judul ATAU artis ATAU tag), lagu
    // ini dimasukkan ke hasil saringan
    if (judulCocok || artisCocok || tagCocok) {
      hasilSaringan.push(lagu);
    }
  }

  return hasilSaringan;
}

/**
 * cariDiTag(daftarTag, kataKunciRapi)
 * Memeriksa apakah kata kunci ditemukan di salah satu tag pencarian lagu.
 */
function cariDiTag(daftarTag, kataKunciRapi) {
  if (!Array.isArray(daftarTag)) {
    return false;
  }

  for (let indeks = 0; indeks < daftarTag.length; indeks++) {
    if (daftarTag[indeks].toLowerCase().includes(kataKunciRapi)) {
      return true;
    }
  }

  return false;
}

/**
 * tampilkanKartuLagu(dataLagu, elemenKisiMusik)
 * Mengosongkan wadah kisi, lalu membangun ULANG kartu-kartu lagu
 * SEPENUHNYA lewat createElement() + appendChild() (bukan innerHTML).
 */
function tampilkanKartuLagu(dataLagu, elemenKisiMusik) {
  kosongkanElemen(elemenKisiMusik);

  if (dataLagu.length === 0) {
    tampilkanPesanStatus(elemenKisiMusik, "Lagu tidak ditemukan. Coba kata kunci lain, ya.");
    return;
  }

  // Bangun 1 kartu untuk SETIAP lagu dalam array dataLagu
  for (let indeks = 0; indeks < dataLagu.length; indeks++) {
    const lagu = dataLagu[indeks];
    const kartu = buatKartuLagu(lagu);
    elemenKisiMusik.appendChild(kartu);
  }
}

/**
 * buatKartuLagu(lagu)
 * Membangun SATU elemen <article> kartu lagu: gambar sampul, judul,
 * nama artis, dan satu baris aksi berisi tombol suka, tombol tambah
 * ke playlist, dan tombol putar (ketiganya sejajar dalam satu baris).
 */
function buatKartuLagu(lagu) {
  const kartu = document.createElement("article");
  kartu.className = "kartu-musik";

  // -- bagian sampul gambar --
  const bungkusSampul = document.createElement("div");
  bungkusSampul.className = "sampul-musik";

  const gambarSampul = document.createElement("img");
  gambarSampul.src = lagu.image;
  gambarSampul.alt = "Sampul album " + lagu.title + " oleh " + lagu.artist;
  gambarSampul.loading = "lazy"; // gambar baru dimuat saat mendekati layar (hemat data)

  bungkusSampul.appendChild(gambarSampul);

  // -- bagian isi teks kartu --
  const isiKartu = document.createElement("div");
  isiKartu.className = "isi-kartu-musik";

  const judulLagu = document.createElement("h3");
  judulLagu.appendChild(document.createTextNode(lagu.title));

  const namaArtis = document.createElement("p");
  namaArtis.className = "nama-artis";
  namaArtis.appendChild(document.createTextNode(lagu.artist));

  // -- baris aksi: tombol suka, tombol tambah playlist, tombol putar --
  const barisAksi = document.createElement("div");
  barisAksi.className = "baris-aksi-musik";

  // Tombol suka (♥)
  const tombolSuka = document.createElement("button");
  tombolSuka.type = "button";
  tombolSuka.className = "tombol-suka";
  tombolSuka.setAttribute("aria-label", "Tandai sebagai favorit");
  tombolSuka.appendChild(document.createTextNode("♥"));

  // Kalau lagu ini SUDAH ada di favorit, langsung tampilkan dalam
  // keadaan "menyala" (class "disukai") sejak awal dimuat
  if (apakahLaguDisukai(lagu.id)) {
    tombolSuka.classList.add("disukai");
  }

  tombolSuka.addEventListener("click", () => {
    // ATURAN: menandai favorit WAJIB login dulu
    if (!apakahSudahLogin()) {
      mintaLoginUntukAksiLagu("menandai lagu sebagai favorit");
      return; // hentikan di sini, JANGAN toggle status favoritnya
    }

    const kiniDisukai = ubahStatusFavorit(lagu);
    tombolSuka.classList.toggle("disukai", kiniDisukai);
  });

  // Tombol "+" (tambah ke playlist)
  const tombolTambahPlaylist = document.createElement("button");
  tombolTambahPlaylist.type = "button";
  tombolTambahPlaylist.className = "tombol-tambah-playlist";
  tombolTambahPlaylist.setAttribute("aria-label", "Tambah ke playlist");
  tombolTambahPlaylist.appendChild(document.createTextNode("+"));
  tombolTambahPlaylist.addEventListener("click", () => {
    // ATURAN: menambah ke playlist JUGA wajib login dulu
    if (!apakahSudahLogin()) {
      mintaLoginUntukAksiLagu("menambahkan lagu ke playlist");
      return;
    }
    bukaModalPilihPlaylist(lagu);
  });

  // Tombol putar (▶)
  const tombolPutar = document.createElement("button");
  tombolPutar.type = "button";
  tombolPutar.className = "tautan-dengarkan";
  tombolPutar.appendChild(document.createTextNode("▶ Putar"));
  tombolPutar.addEventListener("click", () => {
    bukaPemutar(lagu);
  });

  barisAksi.appendChild(tombolSuka);
  barisAksi.appendChild(tombolTambahPlaylist);
  barisAksi.appendChild(tombolPutar);

  isiKartu.appendChild(judulLagu);
  isiKartu.appendChild(namaArtis);
  isiKartu.appendChild(barisAksi);

  kartu.appendChild(bungkusSampul);
  kartu.appendChild(isiKartu);

  return kartu;
}

/**
 * tampilkanLaguAcak(elemenKisiMusik, elemenInfoHasil, kotakCari)
 * Memilih SATU lagu secara acak. Memakai perulangan while supaya tidak
 * memilih lagu yang PERSIS SAMA dengan yang barusan tampil.
 */
function tampilkanLaguAcak(elemenKisiMusik, elemenInfoHasil, kotakCari) {
  if (seluruhDataLagu.length === 0) {
    return;
  }

  // Math.random() menghasilkan angka acak 0 s.d. hampir 1, dikalikan
  // panjang array lalu dibulatkan ke bawah (Math.floor) supaya jadi
  // indeks array yang valid (0, 1, 2, dst)
  let indeksTerpilih = Math.floor(Math.random() * seluruhDataLagu.length);

  // Perulangan while: ULANGI mengacak SELAMA lagu yang terpilih sama
  // persis dengan lagu acak sebelumnya (dan syarat lagunya lebih dari 1,
  // supaya tidak terjebak berputar selamanya kalau lagu cuma ada 1)
  while (
    seluruhDataLagu.length > 1 &&
    seluruhDataLagu[indeksTerpilih].id === idLaguTerakhirDiacak
  ) {
    indeksTerpilih = Math.floor(Math.random() * seluruhDataLagu.length);
  }

  const laguTerpilih = seluruhDataLagu[indeksTerpilih];
  idLaguTerakhirDiacak = laguTerpilih.id;

  if (kotakCari) {
    kotakCari.value = "";
  }

  // Tampilkan HANYA 1 kartu ini saja (array berisi 1 elemen: [laguTerpilih])
  tampilkanKartuLagu([laguTerpilih], elemenKisiMusik);
  perbaruiInfoHasil(elemenInfoHasil, 1, seluruhDataLagu.length, "kejutan acak");
}

/**
 * perbaruiInfoHasil(elemenInfoHasil, jumlahTampil, jumlahTotal, kataKunci)
 * Memperbarui teks kecil "Menampilkan X dari Y lagu" di atas kisi kartu.
 */
function perbaruiInfoHasil(elemenInfoHasil, jumlahTampil, jumlahTotal, kataKunci) {
  if (!elemenInfoHasil) {
    return;
  }

  kosongkanElemen(elemenInfoHasil);

  const bagianJumlah = document.createElement("strong");
  bagianJumlah.appendChild(document.createTextNode(String(jumlahTampil)));

  elemenInfoHasil.appendChild(document.createTextNode("Menampilkan "));
  elemenInfoHasil.appendChild(bagianJumlah);
  elemenInfoHasil.appendChild(document.createTextNode(" dari " + jumlahTotal + " lagu"));

  if (kataKunci && kataKunci.trim() !== "") {
    elemenInfoHasil.appendChild(document.createTextNode(" untuk pencarian \"" + kataKunci + "\""));
  }
}

/**
 * tampilkanPesanStatus(elemenKisiMusik, teksPesan)
 * Menampilkan pesan sederhana (sedang memuat / kosong / gagal) di
 * dalam kisi, menggantikan kartu-kartu lagu.
 */
function tampilkanPesanStatus(elemenKisiMusik, teksPesan) {
  kosongkanElemen(elemenKisiMusik);

  const pesan = document.createElement("p");
  pesan.className = "pesan-status";
  pesan.appendChild(document.createTextNode(teksPesan));

  elemenKisiMusik.appendChild(pesan);
}

/**
 * kosongkanElemen(elemen)
 * Mengosongkan seluruh isi sebuah elemen TANPA memakai innerHTML —
 * caranya dengan perulangan while yang terus menghapus anak pertama
 * (firstChild) sampai tidak ada anak yang tersisa.
 */
function kosongkanElemen(elemen) {
  while (elemen.firstChild) {
    elemen.removeChild(elemen.firstChild);
  }
}

/**
 * mintaLoginUntukAksiLagu(namaAksi)
 * Dipanggil saat tombol suka (♥) ATAU tombol "+" diklik oleh pengguna
 * yang BELUM login. Menampilkan konfirmasi sederhana; kalau pengguna
 * setuju, ia diarahkan ke halaman login.html — dan sebelumnya kita
 * simpan dulu "musik.html" sebagai halaman tujuan (BAGIAN 1), supaya
 * setelah berhasil login pengguna otomatis dibalikkan ke sini lagi.
 */
function mintaLoginUntukAksiLagu(namaAksi) {
  const penggunaMauLogin = window.confirm(
    "Kamu harus masuk (login) dulu untuk " + namaAksi + ".\n\nBuka halaman Masuk sekarang?"
  );

  if (penggunaMauLogin) {
    simpanHalamanTujuanSetelahLogin("musik.html");
    window.location.href = "login.html";
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

  // --- bagian khusus halaman Musik: ambil elemen penting ---
  const elemenKisiMusik = document.getElementById("kisi-musik");
  const elemenInfoHasil = document.getElementById("info-hasil");
  const kotakCari = document.getElementById("kotak-cari");
  const tombolAcak = document.getElementById("tombol-acak");

  // Kalau elemen kisi kartu lagu tidak ada, hentikan (jaga-jaga)
  if (!elemenKisiMusik) {
    return;
  }

  // Ambil data lagu dari REST API begitu halaman siap
  ambilDataMusik(elemenKisiMusik, elemenInfoHasil);

  // EVENT HANDLER: setiap kali pengguna MENGETIK di kotak pencarian
  // (event "input" menyala setiap 1 huruf berubah, lebih responsif
  // dibanding menunggu Enter/submit). Karena penyaringannya dilakukan
  // DI SISI BROWSER (data sudah ada di seluruhDataLagu), TIDAK perlu
  // menghubungi internet lagi setiap kali mengetik.
  if (kotakCari) {
    kotakCari.addEventListener("input", (peristiwa) => {
      const kataKunci = peristiwa.target.value;
      const hasilSaring = saringDataLagu(seluruhDataLagu, kataKunci);
      tampilkanKartuLagu(hasilSaring, elemenKisiMusik);
      perbaruiInfoHasil(elemenInfoHasil, hasilSaring.length, seluruhDataLagu.length, kataKunci);
    });
  }

  // EVENT HANDLER: tombol "Acak" diklik
  if (tombolAcak) {
    tombolAcak.addEventListener("click", () => {
      tampilkanLaguAcak(elemenKisiMusik, elemenInfoHasil, kotakCari);
    });
  }
});
