// ==========================================
// 1. KONFIGURASI FIREBASE RESMI AFDELING 4
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyDqEbkEl1pS5EATeSdvPxmTML0fFg05j7w",
    authDomain: "://firebaseapp.com",
    projectId: "absensi-afdeling-4",
    storageBucket: "absensi-afdeling-4.firebasestorage.app",
    messagingSenderId: "290409235206",
    appId: "1:290409235206:web:d38572ea58b50732fa5487"
};

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ==========================================
// 2. LOGIKA PROSES LOGIN (index.html)
// ==========================================
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault(); // Mencegah halaman refresh otomatis

        const employeeId = document.getElementById('employeeId').value.trim();
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('errorMessage');

        errorMessage.style.display = 'none';

        // Gabungkan NIK inputan user dengan domain kustom Anda
        let emailForAuth = employeeId;
        if (!employeeId.includes('@')) {
            emailForAuth = `${employeeId}@afdeling4.com`; 
        }

        // Proses autentikasi masuk ke Firebase
        auth.signInWithEmailAndPassword(emailForAuth, password)
            .then((userCredential) => {
                // Jika sukses, simpan sesi NIK dan lempar ke dashboard
                localStorage.setItem('loggedInUser', employeeId);
                window.location.href = 'dashboard.html';
            })
            .catch((error) => {
                console.error("Error login:", error.message);
                errorMessage.innerText = "Nomor Identitas atau Password Anda salah!";
                errorMessage.style.display = 'block';
            });
    });
}

// ==========================================
// 3. PROTEKSI HALAMAN & LOGIKA DASHBOARD PRIVAT (dashboard.html)
// ==========================================
document.addEventListener("DOMContentLoaded", function() {
    const userDisplay = document.getElementById('userDisplay');
    
    if (userDisplay) {
        const loggedInUser = localStorage.getItem('loggedInUser');
        
        // JIKA BELUM LOGIN: Tendang kembali ke index.html demi privasi data!
        if (!loggedInUser) {
            alert("Akses ditolak! Silakan login terlebih dahulu.");
            window.location.href = 'index.html';
            return;
        }

        // Tampilkan ID karyawan di Header
        userDisplay.innerText = loggedInUser;
        
        // Set otomatis tanggal hari ini
        document.getElementById('inputDate').valueAsDate = new Date();

        // Jalankan fungsi riwayat, form, dan logout
        muatRiwayatKerjaPrivat(loggedInUser);
        aktifkanFormLaporan(loggedInUser);
        aktifkanTombolLogout();
    }
});

// ==========================================
// 4. LOGIKA KIRIM DATA ABSENSI & LAPORAN
// ==========================================
function aktifkanFormLaporan(nikKaryawan) {
    const reportForm = document.getElementById('reportForm');
    if (reportForm) {
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

            // 1. Simpan ke database Firestore
            db.collection("laporan_harian").add({
                ...dataLaporan,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            })
            .then(() => {
                // 2. Kirim otomatis ke Google Sheets
                // GANTI teks di bawah dengan link URL Web App /exec dari Google Apps Script Anda!
                const urlGoogleSheets = "https://script.google.com/macros/s/AKfycbzIzrCD3uQD6nW45Za2qnYFaGAaFcvtNgcYntgVFXHM9kGSRlVAoL3hD3qPR_Sa25tP8Q/exec";

                fetch(urlGoogleSheets, {
                    method: "POST",
                    mode: "no-cors",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(dataLaporan)
                });

                alert("Laporan harian berhasil dikirim ke sistem & Google Sheets!");
                reportForm.reset();
                document.getElementById('inputDate').valueAsDate = new Date();
                muatRiwayatKerjaPrivat(nikKaryawan); // Refresh tabel riwayat
            })
            .catch((error) => {
                console.error("Gagal mengirim data: ", error);
                alert("Terjadi kesalahan. Silakan coba lagi.");
            });
        });
    }
}

// ==========================================
// 5. LOGIKA FILTER RIWAYAT KERJA SECARA PRIVAT
// ==========================================
function muatRiwayatKerjaPrivat(nikKaryawan) {
    const tableBody = document.getElementById('historyTableBody');
    if (!tableBody) return;
    
    // FILTER: Hanya memuat data milik NIK user yang sedang aktif login
    db.collection("laporan_harian")
      .where("nik", "==", nikKaryawan)
      .orderBy("tanggal", "desc")
      .get()
      .then((querySnapshot) => {
          tableBody.innerHTML = "";

          if (querySnapshot.empty) {
              tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #777;">Belum ada riwayat laporan harian.</td></tr>`;
              return;
          }

          querySnapshot.forEach((doc) => {
              const data = doc.data();
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
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', function() {
            auth.signOut().then(() => {
                localStorage.removeItem('loggedInUser');
                window.location.href = 'index.html';
            });
        });
    }
}

function formatTanggalIndo(stringTanggal) {
    if(!stringTanggal) return "-";
    const opsi = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(stringTanggal).toLocaleDateString('id-ID', opsi);
}
