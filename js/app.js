// 1. KONFIGURASI FIREBASE
// Ganti baris di bawah ini dengan kode config asli dari Firebase Console Anda!
const firebaseConfig = {
    apiKey: "AIzaSyDQEbkELlpS5EATeSdvPxmTML0Ffg05j7w",
    authDomain: "absensi-afdeling-4.firebaseapp.com",
    projectId: "absensi-afdeling-4",
    storageBucket: "absensi-afdeling-4.firebasestorage.app",
    messagingSenderId: "290409235206",
    appId: "1:290409235206:web:d38572ea58b50732fa5487"
};

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// 2. LOGIKA PROSES LOGIN PRIVAT
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault(); // Mencegah halaman refresh otomatis saat tombol ditekan

    // Ambil data inputan user dari index.html
    const employeeId = document.getElementById('employeeId').value.trim();
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');

    // Sembunyikan pesan error terlebih dahulu setiap kali tombol ditekan
    errorMessage.style.display = 'none';

    // Karena Firebase Auth membutuhkan format email, kita konversikan format ID/NIK menjadi email bayangan
    // Contoh: delta@rayon1.com atau NIK_Anda@aplikasi.com
    let emailForAuth = employeeId;
    if (!employeeId.includes('@')) {
        // Jika user hanya menginput NIK, otomatis tambahkan domain sistem Anda di belakangnya
        emailForAuth = `${employeeId}@afdeling4.com`; 
    }

    // Proses Autentikasi Firebase
    auth.signInWithEmailAndPassword(emailForAuth, password)
        .then((userCredential) => {
            // LOGIN BERHASIL
            const user = userCredential.user;
            
            // Simpan NIK/ID ke LocalStorage browser agar dashboard tahu siapa yang sedang login (untuk privasi data)
            localStorage.setItem('loggedInUser', employeeId);

            // Arahkan user ke halaman dashboard utama
            window.location.href = 'dashboard.html';
        })
        .catch((error) => {
            // LOGIN GAGAL (ID atau Password salah)
            console.error("Error login:", error.message);
            errorMessage.innerText = "Nomor Identitas atau Password Anda salah!";
            errorMessage.style.display = 'block'; // Tampilkan pesan error ke user
        });
});
// ==========================================
// 3. PROTEKSI HALAMAN & LOGIKA DASHBOARD PRIVAT
// ==========================================

// Fungsi ini otomatis berjalan saat halaman dimuat
document.addEventListener("DOMContentLoaded", function() {
    // Cek apakah kita sedang berada di halaman dashboard
    const userDisplay = document.getElementById('userDisplay');
    
    if (userDisplay) {
        // Ambil data ID Karyawan yang tersimpan di LocalStorage dari proses login tadi
        const loggedInUser = localStorage.getItem('loggedInUser');
        
        // JIKA BELUM LOGIN: Tendang user kembali ke halaman login (index.html) demi keamanan & privasi
        if (!loggedInUser) {
            alert("Akses ditolak! Silakan login terlebih dahulu.");
            window.location.href = 'index.html';
            return;
        }

        // Tampilkan ID karyawan di Header Dashboard
        userDisplay.innerText = loggedInUser;
        
        // Set otomatis input tanggal hari ini agar memudahkan karyawan
        document.getElementById('inputDate').valueAsDate = new Date();

        // Panggil fungsi untuk menampilkan data riwayat kerja milik user ini saja
        muatRiwayatKerjaPrivat(loggedInUser);
        
        // Daftarkan fungsi submit form
        aktifkanFormLaporan(loggedInUser);
        
        // Daftarkan fungsi tombol logout
        aktifkanTombolLogout();
    }
});

// ==========================================
// 4. LOGIKA KIRIM DATA ABSENSI & LAPORAN KE FIRESTORE
// ==========================================
function aktifkanFormLaporan(nikKaryawan) {
    const reportForm = document.getElementById('reportForm');
    
    reportForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const tanggal = document.getElementById('inputDate').value;
        const statusAbsen = document.getElementById('statusAbsen').value;
        const pekerjaan = document.getElementById('inputJob').value.trim();
        const hk = parseFloat(document.getElementById('inputHK').value);
        const gaji = parseInt(document.getElementById('inputGaji').value);

        const dataLaporan = {
            nik: nikKaryawan,
            tanggal: tanggal,
            statusAbsen: statusAbsen,
            pekerjaan: pekerjaan,
            hk: hk,
            gajiHarian: gaji
        };

        // 1. INPUT KE FIREBASE FIRESTORE (Untuk Riwayat Privat Karyawan)
        db.collection("laporan_harian").add({
            ...dataLaporan,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
            // 2. INPUT KE GOOGLE SHEETS (Untuk Konsolidasi Manajemen)
            // GANTI LINK DI BAWAH INI DENGAN URL WEB APP YANG ANDA SALIN DI LANGKAH 3!
            const urlGoogleSheets = "https://script.google.com/macros/s/AKfycbzIzrCD3uQD6nW45Za2qnYFaGAaFcvtNgcYntgVFXHM9kGSRlVAoL3hD3qPR_Sa25tP8Q/exec";

            fetch(urlGoogleSheets, {
                method: "POST",
                mode: "no-cors", // Menggunakan no-cors jika domain berbeda
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(dataLaporan)
            });

            alert("Laporan harian berhasil dikirim ke sistem & Google Sheets!");
            reportForm.reset();
            document.getElementById('inputDate').valueAsDate = new Date();
            muatRiwayatKerjaPrivat(nikKaryawan);
        })
        .catch((error) => {
            console.error("Gagal mengirim data: ", error);
            alert("Terjadi kesalahan. Silakan coba lagi.");
        });
    });
}


// ==========================================
// 5. LOGIKA FILTER RIWAYAT KERJA SECARA PRIVAT
// ==========================================
function muatRiwayatKerjaPrivat(nikKaryawan) {
    const tableBody = document.getElementById('historyTableBody');
    
    // FILTER UTAMA: Hanya mengambil data di mana kolom 'nik' SAMA DENGAN nik user yang sedang login!
    db.collection("laporan_harian")
      .where("nik", "==", nikKaryawan)
      .orderBy("tanggal", "desc") // Urutkan dari tanggal terbaru
      .get()
      .then((querySnapshot) => {
          tableBody.innerHTML = ""; // Bersihkan teks "Memuat data..."

          if (querySnapshot.empty) {
              tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #777;">Belum ada riwayat laporan harian.</td></tr>`;
              return;
          }

          // Looping data dan masukkan ke tabel HTML
          querySnapshot.forEach((doc) => {
              const data = doc.data();
              
              // Berikan warna badge berbeda untuk status absen agar menarik
              let badgeColor = "bg-hadir";
              if (data.statusAbsen === "Izin") badgeColor = "bg-izin";
              if (data.statusAbsen === "Cuti") badgeColor = "bg-cuti";

              const row = `
                  <tr>
                      <td>${formatTanggalIndo(data.tanggal)}</td>
                      <td><span class="badge ${badgeColor}">${data.statusAbsen}</span></td>
                      <td>${data.pekerjaan}</td>
                      <td>${data.hk}</td>
                      <td>Rp ${data.gajiHarian.toLocaleString('id-ID')}</td>
                  </tr>
              `;
              tableBody.innerHTML += row;
          });
      })
      .catch((error) => {
          console.error("Gagal memuat data riwayat: ", error);
          tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #dc3545;">Gagal memuat data privasi Anda.</td></tr>`;
      });
}

// ==========================================
// 6. LOGIKA TOMBOL LOGOUT & FUNGSI PEMBANTU
// ==========================================
function aktifkanTombolLogout() {
    document.getElementById('btnLogout').addEventListener('click', function() {
        auth.signOut().then(() => {
            localStorage.removeItem('loggedInUser'); // Hapus jejak NIK dari browser
            window.location.href = 'index.html'; // Kembalikan ke halaman login
        });
    });
}

// Mengubah format YYYY-MM-DD menjadi format tanggal Indonesia (Contoh: 19 Okt 2026)
function formatTanggalIndo(stringTanggal) {
    if(!stringTanggal) return "-";
    const opsi = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(stringTanggal).toLocaleDateString('id-ID', opsi);
}
