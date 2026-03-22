# Instruksi Pengembangan

## Prasyarat
- Flutter SDK versi terbaru
- Android Studio/VS Code (disarankan)
- Emulator Android atau perangkat fisik

## Langkah Pengembangan
1. Clone repository ini
2. Jalankan `flutter pub get` untuk mengunduh dependensi
3. Jalankan aplikasi dengan `flutter run`
4. Untuk menambah fitur, buat file baru di folder yang sesuai (models, screens, widgets, services)
5. Gunakan hot reload untuk mempercepat pengujian UI

## Struktur Kode
- models/: Data model aplikasi
- screens/: Halaman utama aplikasi
- widgets/: Komponen UI reusable
- services/: Logika bisnis & akses data
- assets/: Gambar, ikon, dsb

## Testing
- Tambahkan file test di folder `test/`
- Jalankan `flutter test` untuk menjalankan unit test

## Build APK
- Jalankan `flutter build apk --release` untuk membuat file APK siap distribusi

---

Ikuti standar kode dan dokumentasi untuk menjaga kualitas project.