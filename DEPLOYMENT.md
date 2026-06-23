# Panduan Deployment KMS Digital di Server Pribadi (VPS)

Dokumen ini berisi panduan teknis langkah demi langkah untuk melakukan *deployment* aplikasi KMS Digital di *Virtual Private Server* (VPS) berbasis Linux (Ubuntu) lengkap dengan pengaturan DNS, Nginx Reverse Proxy, SSL Certificate, dan konfigurasi *Backend* mandiri (karena tidak lagi menggunakan Vercel).

---

> [!IMPORTANT]
> **Persyaratan Awal (Prerequisites)**
> Sebelum memulai, pastikan Server/VPS Anda telah siap dan Anda memiliki hak akses `root` atau `sudo`:
> 1. Sistem Operasi: **Ubuntu 20.04 / 22.04 LTS** atau Debian.
> 2. Domain yang sudah diarahkan (A Record) ke IP Publik Server Anda (misal: `kms.domainanda.com`).
> 3. Koneksi Internet dan akses SSH.

## 1. Install Dependensi Dasar di Server

Masuk ke server Anda via SSH, lalu jalankan perintah berikut untuk menginstal **Node.js (v20)**, **Nginx**, **Git**, dan **PostgreSQL**.

```bash
# Update repository
sudo apt update && sudo apt upgrade -y

# Install Git, Nginx, curl
sudo apt install -y curl git nginx

# Install Node.js v20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (Untuk menjaga server tetap menyala 24/7)
sudo npm install -g pm2

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib
```

---

## 2. Setup Database PostgreSQL

Buat *user* dan *database* baru untuk aplikasi KMS Digital di server Anda.

```bash
# Masuk ke prompt PostgreSQL
sudo -u postgres psql

# Jalankan perintah SQL berikut di dalam prompt (Ubah 'password_kuat_anda' dengan password yang aman)
CREATE DATABASE kms_digital;
CREATE USER kms_user WITH ENCRYPTED PASSWORD 'password_kuat_anda';
GRANT ALL PRIVILEGES ON DATABASE kms_digital TO kms_user;
\q
```

---

## 3. Clone Repository dan Build Aplikasi

Sekarang, unduh *source code* aplikasi KMS Digital ke server Anda dan atur konfigurasinya.

```bash
# Pindah ke direktori /var/www (standar untuk web server)
cd /var/www
sudo git clone https://github.com/creedhansing-ops/app-kms-calculator.git kms_digital
cd kms_digital

# Ubah kepemilikan folder agar bisa diakses oleh user Anda
sudo chown -R $USER:$USER /var/www/kms_digital

# Install semua dependensi Node.js
npm install
```

### Konfigurasi `.env`

Buat file `.env` di dalam folder `kms_digital`:

```bash
nano .env
```

Isi dengan konfigurasi database yang telah Anda buat di langkah 2:

```env
# Sesuaikan nama user, password, dan nama database (kms_digital)
DATABASE_URL="postgresql://kms_user:password_kuat_anda@localhost:5432/kms_digital?schema=public"

# Secret untuk JWT (Login/Register)
JWT_SECRET="ganti_dengan_kode_rahasia_acak_yang_sangat_panjang"
```

### Jalankan Migrasi Database dan Build Frontend

```bash
# Migrasi tabel database Prisma
npx prisma migrate deploy
npx prisma generate

# Build Frontend (React/Vite) menjadi file statis
npm run build
```

---

## 4. Menjalankan Server Backend Menggunakan PM2

Karena aplikasi ini awalnya didesain untuk Vercel Serverless, saya telah menyiapkan *file* **`server.ts`** di dalam *repository* sebagai jembatan agar aplikasi bisa berjalan normal di VPS menggunakan **Express.js**.

Jalankan perintah ini untuk menghidupkan *server* secara permanen di *background*:

```bash
# Jalankan server.ts menggunakan PM2 dan tsx
pm2 start "npx tsx server.ts" --name kms-digital

# Atur agar PM2 otomatis berjalan setiap kali VPS di-restart
pm2 startup
# (Ikuti instruksi yang muncul di layar, lalu jalankan:)
pm2 save
```

> [!TIP]
> Saat ini, aplikasi Anda sudah berjalan secara *lokal* di VPS pada port `3000` (`http://localhost:3000`). Nginx akan kita gunakan untuk meneruskan pengunjung dari domain Anda ke port ini.

---

## 5. Konfigurasi Nginx (Domain)

Buat konfigurasi *virtual host* Nginx untuk domain Anda.

```bash
sudo nano /etc/nginx/sites-available/kms-digital
```

Isi dengan konfigurasi berikut (Ganti `kms.domainanda.com` dengan domain asli Anda):

```nginx
server {
    listen 80;
    server_name kms.domainanda.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Aktifkan konfigurasi tersebut dan *restart* Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/kms-digital /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 6. Install SSL / HTTPS menggunakan Certbot (Let's Encrypt)

Agar website Anda aman dan tidak ditandai sebagai *Not Secure* oleh *browser*, pasang sertifikat SSL gratis secara otomatis.

```bash
# Install Certbot untuk Nginx
sudo apt install -y certbot python3-certbot-nginx

# Jalankan Certbot dan ikuti instruksinya
sudo certbot --nginx -d kms.domainanda.com
```

Certbot akan menanyakan alamat *email* Anda (untuk notifikasi perpanjangan SSL) dan secara otomatis mengubah konfigurasi Nginx Anda untuk mendukung akses `HTTPS`.

---

## 7. Selesai! 🎉

Sekarang, Anda sudah bisa mengakses aplikasi KMS Digital melalui browser di alamat:
**`https://kms.domainanda.com`**

Aplikasi sudah sepenuhnya dikontrol oleh Anda, berjalan 24 jam dengan performa tinggi berkat konfigurasi PM2, menggunakan Nginx, serta dilengkapi dengan keamanan HTTPS!

### Troubleshooting Singkat

Jika Anda melakukan pembaruan kode (`git pull`), jalankan rangkaian perintah berikut untuk menerapkan pembaruan:

```bash
cd /var/www/kms_digital
git pull
npm install
npm run build
pm2 restart kms-digital
```
