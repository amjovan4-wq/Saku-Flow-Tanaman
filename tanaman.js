// tanaman.js — gambar & logika "Tanaman Hemat".
// Dimuat SEBELUM script.js. Memakai data/fungsi dari script.js (transaksi, budget,
// hariIni, batasHarian, totalPerTanggal, jumlahkan) saat renderTanaman() dipanggil.

// =====================================================================
// BAGIAN 1 — GAMBAR (SVG inline, tanpa file gambar, jalan offline)
// Tanaman.gambar(tahap, layu) mengembalikan teks <svg>. tahap = 0..5.
// =====================================================================
const Tanaman = (function () {
  const NAMA_TAHAP = ["Biji", "Tunas", "Bibit", "Tanaman Muda", "Berbunga", "Pohon Berbuah"];

  // Dua palet warna: segar & layu
  const PALET = {
    segar: {
      latar: "#ecfdf5", daun: "#4ade80", rusuk: "#15803d", batang: "#16a34a",
      tanah: "#6b4428", petal: "#f472b6", pusat: "#fbbf24", buah: "#ef4444",
      kayu: "#8b5a2b", kan1: "#16a34a", kan2: "#22c55e", kan3: "#86efac",
    },
    layu: {
      latar: "#fef3c7", daun: "#c4b94f", rusuk: "#8a7a2c", batang: "#8f8438",
      tanah: "#a98b66", petal: "#e6c3cf", pusat: "#c9a65a", buah: "#a8574a",
      kayu: "#7a5c3a", kan1: "#8f8a33", kan2: "#aaa43f", kan3: "#c9c36a",
    },
  };

  function f(x) { return Math.round(x * 10) / 10; }

  // Satu helai daun. sisi: 1 = kanan, -1 = kiri. sudut = kemiringan ke atas (derajat).
  // Saat layu, daun menggantung ke bawah.
  function daun(x, y, sisi, sudut, ukuran, p, layu) {
    const a = layu ? (sisi > 0 ? 42 : 138) : (sisi > 0 ? -sudut : 180 + sudut);
    const s = ukuran;
    return (
      '<g transform="translate(' + f(x) + " " + f(y) + ") rotate(" + a + ')">' +
      '<path d="M0 0 Q' + f(s * 0.5) + " " + f(-s * 0.55) + " " + f(s) + " 0 Q" +
      f(s * 0.5) + " " + f(s * 0.55) + ' 0 0Z" fill="' + p.daun + '" stroke="' + p.rusuk +
      '" stroke-width="1" stroke-linejoin="round"/>' +
      '<path d="M0 0 L' + f(s * 0.8) + ' 0" stroke="' + p.rusuk + '" stroke-width="1" opacity=".55"/>' +
      "</g>"
    );
  }

  // Batang melengkung; saat layu ujungnya merunduk ke samping.
  function batang(top, bend, p) {
    const my = (148 + top) / 2;
    return {
      svg: '<path d="M100 150 Q100 ' + f(my) + " " + f(100 + bend) + " " + f(top) +
        '" fill="none" stroke="' + p.batang + '" stroke-width="5" stroke-linecap="round"/>',
      at: function (t) {
        return {
          x: 100 + t * t * bend,
          y: (1 - t) * (1 - t) * 148 + 2 * (1 - t) * t * my + t * t * top,
        };
      },
    };
  }

  // Bunga 5 kelopak; saat layu kelopaknya terkulai ke bawah.
  function bunga(cx, cy, r, layu, p) {
    const sudut = layu ? [25, 65, 115, 155] : [-90, -18, 54, 126, 198];
    let s = "";
    sudut.forEach(function (a) {
      const rad = (a * Math.PI) / 180;
      s += '<circle cx="' + f(cx + Math.cos(rad) * r * 0.75) + '" cy="' + f(cy + Math.sin(rad) * r * 0.75) +
        '" r="' + f(r * 0.55) + '" fill="' + p.petal + '" stroke="rgba(0,0,0,.08)" stroke-width=".8"/>';
    });
    s += '<circle cx="' + f(cx) + '" cy="' + f(cy) + '" r="' + f(r * 0.45) + '" fill="' + p.pusat + '"/>';
    return s;
  }

  function kilau(x, y, r) {
    return '<path d="M' + x + " " + (y - r) + " Q" + x + " " + y + " " + (x + r) + " " + y +
      " Q" + x + " " + y + " " + x + " " + (y + r) + " Q" + x + " " + y + " " + (x - r) + " " + y +
      " Q" + x + " " + y + " " + x + " " + (y - r) + 'Z" fill="#fcd34d"/>';
  }

  // ----- Tahap 0: biji di dalam tanah -----
  function tahapBiji(layu, p) {
    let s = '<path d="M68 150 Q100 126 132 150Z" fill="' + p.tanah + '"/>';
    if (layu) {
      s += '<path d="M84 144 l6 -5 l5 4 M108 142 l6 -4 l5 5" fill="none" stroke="#7c6342" stroke-width="1.5" stroke-linecap="round"/>';
    }
    s += '<ellipse cx="100" cy="134" rx="8" ry="10" fill="' + (layu ? "#b8892f" : "#ca8a04") +
      '" stroke="#854d0e" stroke-width="1.5" transform="rotate(-12 100 134)"/>' +
      '<path d="M97 128 Q99 133 98 139" fill="none" stroke="#fde68a" stroke-width="1.8" stroke-linecap="round" opacity=".8"/>';
    return s;
  }

  // ----- Tahap 1-4: tunas sampai berbunga -----
  const KONFIG = {
    1: { top: 128, pasang: [[1, 13, 38]], ujung: 0 },
    2: { top: 108, pasang: [[0.55, 16, 40], [1, 15, 42]], ujung: 13 },
    3: { top: 86, pasang: [[0.3, 21, 32], [0.62, 20, 38], [1, 16, 44]], ujung: 14 },
    4: { top: 82, pasang: [[0.3, 21, 32], [0.62, 20, 38]], ujung: 0 },
  };

  function tahapSemak(tahap, layu, p) {
    const c = KONFIG[tahap];
    const top = layu ? 148 - (148 - c.top) * 0.88 : c.top;
    const bend = layu ? (tahap === 1 ? 16 : 26) : 0;
    const b = batang(top, bend, p);
    let s = b.svg;

    c.pasang.forEach(function (ps) {
      const t = ps[0];
      const pt = b.at(t);
      s += daun(pt.x, pt.y, -1, ps[2], ps[1], p, layu);
      s += daun(pt.x, pt.y, 1, ps[2], ps[1], p, layu);
    });

    const ujung = b.at(1);
    if (c.ujung) {
      // daun kecil di pucuk: tegak saat segar, merunduk saat layu
      const a = layu ? 25 : -90;
      s += '<g transform="translate(' + f(ujung.x) + " " + f(ujung.y) + ") rotate(" + a + ')">' +
        '<path d="M0 0 Q' + f(c.ujung * 0.5) + " " + f(-c.ujung * 0.5) + " " + c.ujung + " 0 Q" +
        f(c.ujung * 0.5) + " " + f(c.ujung * 0.5) + ' 0 0Z" fill="' + p.daun + '" stroke="' + p.rusuk + '" stroke-width="1"/></g>';
    }

    if (tahap === 4) {
      // cabang kecil di kiri + bunga besar di pucuk
      const dasar = b.at(0.5);
      const bx = ujung.x - 36;
      const by = ujung.y + (layu ? 34 : 22);
      s += '<path d="M' + f(dasar.x) + " " + f(dasar.y) + " Q" + f(dasar.x - 18) + " " + f(dasar.y - 6) + " " + f(bx) + " " + f(by) +
        '" fill="none" stroke="' + p.batang + '" stroke-width="3.5" stroke-linecap="round"/>';
      s += bunga(bx, by, 11, layu, p);
      s += bunga(ujung.x, ujung.y - (layu ? 0 : 4), 15, layu, p);
    }
    return s;
  }

  // ----- Tahap 5: pohon kecil berbuah -----
  function tahapPohon(layu, p) {
    let s = '<path d="M93 150 Q96 128 95 104 L105 104 Q104 128 107 150Z" fill="' + p.kayu + '"/>';
    s += '<g transform="' + (layu ? "translate(0 8)" : "") + '">';
    [[100, 78, 32], [72, 94, 22], [128, 94, 22], [86, 58, 22], [114, 58, 22]].forEach(function (c) {
      s += '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + c[2] + '" fill="' + p.kan1 + '"/>';
    });
    [[96, 74, 26], [70, 90, 16], [124, 90, 16], [84, 56, 16], [112, 56, 16]].forEach(function (c) {
      s += '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + c[2] + '" fill="' + p.kan2 + '"/>';
    });
    if (!layu) {
      [[90, 60, 8], [70, 84, 6], [112, 50, 7], [122, 84, 6]].forEach(function (c) {
        s += '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + c[2] + '" fill="' + p.kan3 + '" opacity=".8"/>';
      });
    }
    const buah = layu
      ? [[84, 80], [116, 88], [100, 62]]
      : [[84, 80], [116, 88], [100, 62], [68, 98], [134, 96], [102, 104]];
    buah.forEach(function (b) {
      s += '<circle cx="' + b[0] + '" cy="' + b[1] + '" r="5.5" fill="' + p.buah + '"/>' +
        '<circle cx="' + (b[0] - 1.8) + '" cy="' + (b[1] - 1.8) + '" r="1.6" fill="#fff" opacity=".7"/>';
    });
    s += "</g>";
    if (layu) {
      // buah & daun yang jatuh ke tanah
      s += '<circle cx="74" cy="147" r="5" fill="' + p.buah + '"/><circle cx="128" cy="148" r="5" fill="' + p.buah + '"/>';
      s += '<ellipse cx="86" cy="147" rx="5.5" ry="2.4" fill="' + p.daun + '" transform="rotate(-15 86 147)"/>' +
        '<ellipse cx="114" cy="146" rx="5.5" ry="2.4" fill="' + p.daun + '" transform="rotate(20 114 146)"/>';
    }
    return s;
  }

  // ----- Pot + wajah (senang saat segar, sedih saat layu) -----
  function potBelakang(p) {
    return (
      '<ellipse cx="100" cy="214" rx="42" ry="4" fill="rgba(0,0,0,.08)"/>' +
      '<path d="M62 164 L138 164 L131 207 Q130 212 125 212 L75 212 Q70 212 69 207Z" fill="#d9774a"/>' +
      '<path d="M71 170 L75 204" stroke="#f3a67f" stroke-width="4" stroke-linecap="round" opacity=".6"/>' +
      '<rect x="54" y="148" width="92" height="18" rx="6" fill="#e68a5c"/>' +
      '<ellipse cx="100" cy="150" rx="38" ry="5.5" fill="' + p.tanah + '"/>'
    );
  }

  function wajah(layu) {
    const gelap = "#3b1d0e";
    if (layu) {
      return (
        '<circle cx="86" cy="187" r="3" fill="' + gelap + '"/><circle cx="114" cy="187" r="3" fill="' + gelap + '"/>' +
        '<path d="M80 178 L91 182 M120 178 L109 182" stroke="' + gelap + '" stroke-width="2.2" stroke-linecap="round"/>' +
        '<path d="M92 199 Q100 192 108 199" fill="none" stroke="' + gelap + '" stroke-width="2.5" stroke-linecap="round"/>' +
        '<path d="M119 191 q3.5 5 0 7.5 q-3.5 -2.5 0 -7.5z" fill="#93c5fd"/>'
      );
    }
    return (
      '<circle cx="86" cy="186" r="3.4" fill="' + gelap + '"/><circle cx="114" cy="186" r="3.4" fill="' + gelap + '"/>' +
      '<circle cx="87.2" cy="184.8" r="1.1" fill="#fff"/><circle cx="115.2" cy="184.8" r="1.1" fill="#fff"/>' +
      '<path d="M92 194 Q100 202 108 194" fill="none" stroke="' + gelap + '" stroke-width="2.5" stroke-linecap="round"/>' +
      '<circle cx="78" cy="193" r="4" fill="#f9a8a0" opacity=".6"/><circle cx="122" cy="193" r="4" fill="#f9a8a0" opacity=".6"/>'
    );
  }

  function awan() {
    return (
      '<g fill="#cbd5e1"><circle cx="138" cy="42" r="9"/><circle cx="150" cy="36" r="12"/><circle cx="162" cy="42" r="8"/>' +
      '<rect x="138" y="42" width="24" height="10" rx="5"/></g>' +
      '<path d="M142 58 l-2 7 M152 58 l-2 7 M162 58 l-2 7" stroke="#93c5fd" stroke-width="2" stroke-linecap="round"/>'
    );
  }

  function gambar(tahap, layu) {
    tahap = Math.max(0, Math.min(5, tahap | 0));
    const p = layu ? PALET.layu : PALET.segar;
    let s =
      '<svg class="' + (layu ? "layu" : "segar") + '" viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" ' +
      'role="img" aria-label="Tanaman tahap ' + NAMA_TAHAP[tahap] + (layu ? ", layu" : ", segar") + '">';
    s += '<circle cx="100" cy="106" r="90" fill="' + p.latar + '"/>';
    if (layu) s += awan();
    else if (tahap >= 3) s += kilau(34, 72, 6) + kilau(166, 60, 7) + kilau(160, 128, 5);
    s += potBelakang(p);
    if (tahap === 0) s += tahapBiji(layu, p);
    else if (tahap === 5) s += tahapPohon(layu, p);
    else s += tahapSemak(tahap, layu, p);
    s += wajah(layu);
    return s + "</svg>";
  }

  return { gambar: gambar, NAMA_TAHAP: NAMA_TAHAP };
})();

// =====================================================================
// BAGIAN 2 — LOGIKA GAME (sesuai aturan di "Cara mendapat EXP")
// EXP dihitung ulang dari data transaksi + budget tiap kali tampilan diperbarui,
// jadi tidak ada data tambahan yang perlu disimpan, dan hapus/restore otomatis ikut.
// =====================================================================

// Tanggal "YYYY-MM-DD" -> nomor hari (untuk cek hari berurutan)
function nomorHariGame(ymd) {
  const p = ymd.split("-").map(Number);
  return Math.round(Date.UTC(p[0], p[1] - 1, p[2]) / 86400000);
}
function geserHariGame(ymd, n) {
  const d = new Date((nomorHariGame(ymd) + n) * 86400000);
  return d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0") + "-" + String(d.getUTCDate()).padStart(2, "0");
}

// EXP yang dibutuhkan untuk naik dari level L ke L+1
function butuhExpGame(level) { return 80 + 40 * (level - 1); }

function hitungLevelGame(exp) {
  let level = 1;
  let sisa = exp;
  while (sisa >= butuhExpGame(level)) {
    sisa -= butuhExpGame(level);
    level++;
  }
  return { level: level, dalam: sisa, butuh: butuhExpGame(level) };
}

// Level 1 = Biji ... level 6 ke atas = Pohon Berbuah
function tahapDariLevel(level) { return Math.min(level - 1, 5); }

function hitungGame() {
  const hari = hariIni();
  const bulanIni = hari.slice(0, 7);
  const kemarin = geserHariGame(hari, -1);

  // Total per tanggal (sampai hari ini)
  const perTanggal = {};
  transaksi.forEach(function (t) {
    if (t.tanggal <= hari) perTanggal[t.tanggal] = (perTanggal[t.tanggal] || 0) + t.nominal;
  });
  const tanggalUrut = Object.keys(perTanggal).sort();

  // --- EXP harian ---
  let exp = 0, streak = 0, streakTerpanjang = 0, expHariIni = 0, prev = null;
  tanggalUrut.forEach(function (tg) {
    const ym = tg.slice(0, 7);
    const hemat = !!budget[ym] && perTanggal[tg] <= batasHarian(ym);
    let poin;
    if (hemat) {
      const lanjut = prev && prev.hemat && nomorHariGame(tg) - nomorHariGame(prev.tg) === 1;
      streak = lanjut ? streak + 1 : 1;
      poin = 20 + Math.min(18, 3 * (streak - 1));
    } else {
      streak = 0;
      poin = 5;
    }
    streakTerpanjang = Math.max(streakTerpanjang, streak);
    exp += poin;
    if (tg === hari) expHariIni = poin;
    prev = { tg: tg, hemat: hemat };
  });
  const streakSekarang = prev && prev.hemat && (prev.tg === hari || prev.tg === kemarin) ? streak : 0;

  // --- Bonus hemat bulanan (hanya bulan yang sudah lewat) ---
  let bonusBulanan = 0;
  Object.keys(budget).forEach(function (ym) {
    if (ym >= bulanIni || !(budget[ym] > 0)) return;
    const per = totalPerTanggal(ym);
    const total = jumlahkan(per);
    if (Object.keys(per).length >= 10 && total <= budget[ym]) {
      bonusBulanan += Math.min(100, Math.floor(((budget[ym] - total) / budget[ym]) * 100));
    }
  });
  exp += bonusBulanan;

  // --- Kondisi tanaman: layu atau segar ---
  const punyaBudget = !!budget[bulanIni];
  const totalBulan = jumlahkan(totalPerTanggal(bulanIni));
  const totalHari = perTanggal[hari] || 0;
  let alasan = ""; // "", "bulan", "hari", "lupa"
  if (punyaBudget && totalBulan > budget[bulanIni]) alasan = "bulan";
  else if (punyaBudget && totalHari > batasHarian(bulanIni)) alasan = "hari";
  else if (prev && prev.tg < kemarin) alasan = "lupa"; // kemarin & hari ini sama-sama kosong

  const lv = hitungLevelGame(exp);
  return {
    exp: exp, level: lv.level, dalam: lv.dalam, butuh: lv.butuh,
    tahap: tahapDariLevel(lv.level),
    layu: alasan !== "", alasan: alasan,
    streakSekarang: streakSekarang, streakTerpanjang: streakTerpanjang,
    expHariIni: expHariIni, bonusBulanan: bonusBulanan,
    adaCatatan: tanggalUrut.length > 0,
    adaHariIni: totalHari > 0,
    punyaBudget: punyaBudget,
  };
}

const DAFTAR_BADGE = [
  { ikon: "🌱", nama: "Mulai menanam", ket: "Catat pengeluaran pertama", buka: function (g) { return g.adaCatatan; } },
  { ikon: "🔥", nama: "Beruntun 3 hari", ket: "Hemat 3 hari berturut-turut", buka: function (g) { return g.streakTerpanjang >= 3; } },
  { ikon: "⚡", nama: "Beruntun 7 hari", ket: "Hemat 7 hari berturut-turut", buka: function (g) { return g.streakTerpanjang >= 7; } },
  { ikon: "💰", nama: "Hemat sebulan", ket: "Dapat bonus hemat bulanan", buka: function (g) { return g.bonusBulanan > 0; } },
  { ikon: "🌸", nama: "Berbunga", ket: "Capai level 5", buka: function (g) { return g.level >= 5; } },
  { ikon: "🍎", nama: "Pohon berbuah", ket: "Capai level 6", buka: function (g) { return g.level >= 6; } },
];

function renderTanaman() {
  const elTanaman = document.getElementById("tanaman");
  if (!elTanaman) return;

  const g = hitungGame();
  const nama = Tanaman.NAMA_TAHAP[g.tahap];

  // Gambar hanya diganti jika tahap/kondisinya berubah (supaya animasi goyang tidak ter-reset)
  const kunci = g.tahap + (g.layu ? "-layu" : "-segar");
  if (elTanaman.dataset.kunci !== kunci) {
    elTanaman.innerHTML = Tanaman.gambar(g.tahap, g.layu);
    elTanaman.dataset.kunci = kunci;
  }

  document.getElementById("gLevel").textContent = "Level " + g.level + " · " + nama;

  const alasanTeks = {
    bulan: "melewati budget bulan ini",
    hari: "melewati batas harian",
    lupa: "belum dicatat sejak kemarin",
  };
  const elStatus = document.getElementById("gStatus");
  elStatus.textContent = g.layu ? "🥀 Layu: " + alasanTeks[g.alasan] : "😊 Segar";
  elStatus.className = "label " + (g.layu ? (g.alasan === "lupa" ? "teks-peringatan" : "teks-bahaya") : "teks-ok");

  document.getElementById("barExp").style.width = Math.round((g.dalam / g.butuh) * 100) + "%";
  document.getElementById("gExp").textContent =
    g.dalam + " / " + g.butuh + " EXP menuju level " + (g.level + 1) + " (total " + g.exp + " EXP)";

  document.getElementById("gStreak").textContent =
    "🔥 Beruntun hemat: " + g.streakSekarang + " hari (terpanjang " + g.streakTerpanjang + " hari)";
  document.getElementById("gHariIni").textContent = g.expHariIni > 0
    ? "Hari ini: +" + g.expHariIni + " EXP (sementara)"
    : "Hari ini belum dapat EXP";

  // Pesan untuk pengguna
  let pesan, level;
  if (g.alasan === "bulan") {
    pesan = "Tanamanmu layu karena pengeluaran bulan ini sudah melewati budget. Tahan pengeluaran sampai akhir bulan, dan bulan depan mulai lagi.";
    level = "bahaya";
  } else if (g.alasan === "hari") {
    pesan = "Tanamanmu layu karena pengeluaran hari ini melewati batas harian. Besok catat lagi dan tetap di bawah batas supaya segar kembali.";
    level = "bahaya";
  } else if (g.alasan === "lupa") {
    pesan = "Kamu belum mencatat sejak kemarin. Catat pengeluaran hari ini supaya tanamanmu segar lagi.";
    level = "peringatan";
  } else if (!g.adaCatatan) {
    pesan = "Biji sudah siap ditanam. Catat pengeluaran pertamamu untuk memulai.";
    level = "ok";
  } else if (!g.punyaBudget) {
    pesan = "Bulan ini belum punya budget, jadi tiap catatan hanya +5 EXP. Atur budget untuk dapat +20 EXP per hari hemat.";
    level = "peringatan";
  } else if (!g.adaHariIni) {
    pesan = "Belum ada catatan hari ini. Catat pengeluaranmu untuk menjaga tanaman dan streak.";
    level = "ok";
  } else {
    pesan = "Hari ini masih di bawah batas. Pertahankan, tanamanmu tumbuh sehat.";
    level = "ok";
  }
  const elPesan = document.getElementById("gPesan");
  elPesan.textContent = pesan;
  elPesan.className = "pesan-game " + level;

  // Badge
  const elBadge = document.getElementById("gBadge");
  elBadge.innerHTML = "";
  DAFTAR_BADGE.forEach(function (b) {
    const terbuka = b.buka(g);
    const li = document.createElement("li");
    li.className = "badge " + (terbuka ? "terbuka" : "terkunci");
    li.textContent = (terbuka ? b.ikon : "🔒") + " " + b.nama;
    li.title = b.ket;
    elBadge.appendChild(li);
  });
}

