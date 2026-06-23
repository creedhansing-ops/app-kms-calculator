# Product Requirement Document (PRD)
## Aplikasi Web KMS Digital Anak (Sistem Informasi Pemantauan Pertumbuhan)

---

## 1. Pendahuluan & Tujuan Produk
Aplikasi berbasis web ini dirancang untuk mendigitalisasi proses pemantauan pertumbuhan anak yang selama ini dilakukan secara manual menggunakan Kartu Menuju Sehat (KMS) fisik. Produk ini bertujuan untuk membantu Ahli Gizi dalam melakukan efisiensi kerja melalui otomasi perhitungan, visualisasi real-time, dan manajemen data yang terintegrasi.

### Tujuan Utama:
* **Digitalisasi Data Antropometri:** Mencatat dan menyimpan data pertumbuhan fisik anak secara terstruktur dan aman.
* **Otomasi Analisis Gizi:** Menghitung nilai Z-Score secara instan berdasarkan standar WHO untuk meminimalkan kesalahan diagnosis manual.
* **Monitoring Berkelanjutan:** Menyediakan grafik pertumbuhan interaktif (KMS Digital) untuk memantau tren perkembangan anak dari waktu ke waktu.
* **Asuhan Gizi Terarah:** Memfasilitasi penyusunan rencana intervensi gizi dan catatan konsultasi yang personal untuk setiap anak.
* **Efisiensi Administrasi:** Mempermudah pembuatan laporan individu serta rekapitulasi berkala bagi instansi kesehatan.

---

## 2. Target Pengguna (User Persona)
Aplikasi ini dikembangkan sebagai sistem dengan **pengguna tunggal (Single-Role)**, yang dikhususkan bagi **Ahli Gizi (Nutritionist)** yang bertugas di:
1. **Puskesmas:** Membutuhkan pencatatan cepat dan rekapitulasi bulanan untuk wilayah kerja masyarakat.
2. **Rumah Sakit:** Membutuhkan detail riwayat klinis yang mendalam serta integrasi intervensi asuhan gizi.
3. **Klinik Tumbuh Kembang:** Fokus pada pemantauan grafik pertumbuhan detail yang akurat dari kunjungan ke kunjungan.
4. **Program Kesehatan Masyarakat:** Memerlukan data agregat untuk monitoring status kesehatan anak di suatu populasi.

---

## 3. Ruang Lingkup MVP (Minimum Viable Product)
Untuk memastikan kecepatan peluncuran dan stabilitas sistem, pengembangan dibagi menjadi fitur prioritas (MVP) dan fitur pengembangan fase berikutnya (Post-MVP):

| Fitur Utama | Status di MVP | Keterangan / Batasan |
| :--- | :--- | :--- |
| **Login Ahli Gizi** | Keluar / Masuk MVP | Otentikasi dasar menggunakan akun terdaftar (Email/Username & Password). |
| **Manajemen Data Anak** | Masuk MVP | Fungsi CRUD (Create, Read, Update, Delete) profil anak & riwayat kunjungan. |
| **Input Antropometri** | Masuk MVP | Form entri data fisik (Berat Badan, Tinggi/Panjang Badan, Lingkar Kepala, LILA). |
| **Analisis Gizi Otomatis** | Masuk MVP | Kalkulasi langsung Z-Score standar WHO (BB/U, TB/U, BB/TB, IMT/U). |
| **Grafik Pertumbuhan** | Masuk MVP | Visualisasi plotting titik pada kurva KMS Digital (sesuai standar gender WHO). |
| **Pencatatan Intervensi** | Masuk MVP | Dokumentasi diagnosis gizi, catatan konsultasi, rencana tindakan, dan jadwal kontrol. |
| **Ekspor PDF** | Masuk MVP | Fitur cetak ringkasan rekam medis dan grafik anak ke dalam format berkas PDF. |
| **Dashboard Utama** | Post-MVP | Ringkasan eksekutif (Total pasien, diagram lingkaran status gizi, daftar anak *high-risk*). |
| **Ekspor Excel & Rekap** | Post-MVP | Fungsi mengunduh rekapitulasi data massal bulanan dalam format .xlsx untuk laporan eksternal. |

---

## 4. Spesifikasi Fungsional & Aturan Bisnis

### 4.1 Manajemen Data Pasien Anak
Sistem mengelola informasi demografis anak. Struktur data profil wajib meliputi:
* **Nama Anak:** Teks (Maksimal 100 karakter, Wajib).
* **Tanggal Lahir:** Tanggal (Wajib) - digunakan sistem untuk menghitung umur presisi dalam satuan bulan.
* **Jenis Kelamin:** Pilihan (Laki-laki / Perempuan, Wajib) - menentukan dasar kurva standar deviasi WHO yang digunakan.
* **Nama Orang Tua / Wali:** Teks (Wajib).
* **Alamat:** Teks / Alamat Lengkap (Wajib).
* **Nomor Rekam Medis:** Alfanumerik (Opsional).

### 4.2 Pengukuran Antropometri
Setiap kali kunjungan, Ahli Gizi menginput data fisik hasil penimbangan dan pengukuran teranyar:
* **Tanggal Pemeriksaan:** Tanggal (Default: Hari ini).
* **Berat Badan (BB):** Desimal (Satuan kg, akurasi 2 angka di belakang koma).
* **Tinggi / Panjang Badan (TB/PB):** Desimal (Satuan cm, akurasi 1 angka di belakang koma).
* **Lingkar Kepala:** Desimal (Satuan cm, Opsional).
* **Lingkar Lengan Atas (LILA):** Desimal (Satuan cm, Opsional).

### 4.3 Perhitungan Status Gizi Otomatis
Sistem wajib mengonversi hasil input antropometri menjadi nilai Z-Score berdasarkan referensi standar WHO. Output kategori diagnosis yang dihasilkan:
1. **BB menurut Umur (BB/U):** Berat Badan Sangat Kurang / Berat Badan Kurang / Berat Badan Normal / Risiko Berat Badan Lebih.
2. **TB menurut Umur (TB/U):** Sangat Pendek (*Severely Stunted*) / Pendek (*Stunted*) / Normal / Tinggi.
3. **BB menurut TB (BB/TB):** Gizi Buruk (*Severely Wasted*) / Gizi Kurang (*Wasted*) / Gizi Baik (*Normal*) / Berisiko Gizi Lebih / Gizi Lebih (*Overweight*) / Obesitas (*Obese*).
4. **IMT menurut Umur (IMT/U):** Indikator tambahan proporsi tubuh (Sangat Kurus / Kurus / Normal / Overweight / Obesitas).

### 4.4 Visualisasi Grafik Pertumbuhan (KMS Digital)
* Sistem menampilkan grafik kurva multi-persentil standar WHO (-3 SD hingga +3 SD) sesuai jenis kelamin anak.
* Setiap data kunjungan baru akan di-plot sebagai titik koordinat baru.
* Titik-titik kunjungan sebelumnya dihubungkan dengan garis tren linier guna memperlihatkan arah pertumbuhan (naik/turun/stagnan).

### 4.5 Modul Asuhan & Intervensi Gizi
Setelah hasil diagnosis keluar, Ahli Gizi melengkapi berkas tindakan:
* **Catatan Konsultasi:** Area teks untuk keluhan atau pola asuh.
* **Diagnosis Gizi:** Kesimpulan klinis terstruktur.
* **Rencana Intervensi:** Tindakan gizi (misalnya: perbaikan menu, pemberian PMT, atau rujukan dokter spesialis).
* **Target Capaian:** Target numerik atau klinis untuk kunjungan berikutnya.
* **Jadwal Kontrol Selanjutnya:** Penentuan tanggal kunjungan ulang.

---

## 5. Alur Pengguna (User Flow)
```
[Login Ahli Gizi] 
       │
       ▼
[Cari/Pilih Pasien] ───(Jika Pasien Baru)───► [Tambah Profil Anak]
       │                                              │
       ├──────────────────────────────────────────────┘
       ▼
[Masuk Menu Rekam Medis / Kunjungan]
       │
       ▼
[Input Pengukuran Antropometri Baru]
       │
       ▼
[Sistem Otomatis Hitung Z-Score & Update Grafik KMS]
       │
       ▼
[Input Catatan Konsultasi & Rencana Intervensi]
       │
       ▼
[Simpan Data Ke Database]
       │
       ▼
[Opsi: Ekspor/Cetak Laporan Pasien ke PDF]
```

---

## 6. Kebutuhan Non-Fungsional (Non-Functional Requirements)
* **Keamanan Informasi (Security):** Karena mengolah data medis personal pasien, seluruh pertukaran data wajib melalui protokol HTTPS. Data kredensial pengguna disimpan menggunakan enkripsi hash searah (misal: bcrypt).
* **Performa Sistem (Performance):** Proses kalkulasi rumus algoritma Z-Score dan rendering grafik pertumbuhan KMS harus responsif, selesai dalam waktu < 2 detik setelah form dikirim.
* **Kompatibilitas (Compatibility):** Aplikasi berbasis web harus dirancang dengan tata letak responsif (*responsive web design*) sehingga optimal dibuka di perangkat Desktop/Laptop maupun Tablet PC saat melakukan pencatatan di lapangan.