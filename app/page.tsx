"use client";

import { useState, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function ScannerPage() {
  const [status, setStatus] = useState("Isi NIM dan klik Buka Kamera");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const nimRef = useRef<HTMLInputElement>(null);
  const isProcessingRef = useRef(false);

  const startCamera = () => {
    const nim = nimRef.current?.value.trim();
    if (!nim) {
      setStatus("❌ Isi NIM kamu terlebih dahulu!");
      return;
    }

    setIsCameraOpen(true);
    setStatus("Izinkan akses kamera di browser kamu...");

    // Beri waktu sejenak agar div "reader" dirender oleh React sebelum dipanggil
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scanner.render(
        async (decodedText) => {
          // Cegah scan ganda
          if (isProcessingRef.current) return;
          isProcessingRef.current = true;

          scanner.pause(true);
          setStatus("⏳ Memproses data presensi...");

          try {
            const res = await fetch("/api/checkin", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                user_id: nim,
                device_id: "nextjs-web-scanner",
                course_id: "cloud-101",
                session_id: "sesi-02",
                qr_token: decodedText,
                ts: new Date().toISOString(),
              }),
            });

            const result = await res.json();

            if (result.ok) {
              setStatus("✅ Berhasil Check-In!");
              scanner.clear(); // Matikan kamera jika sukses
              setIsCameraOpen(false); // Sembunyikan kotak kamera
            } else {
              setStatus(`❌ Gagal: ${result.error}`);
              setTimeout(() => {
                isProcessingRef.current = false;
                scanner.resume();
              }, 3000);
            }
          } catch (err) {
            setStatus("❌ Error Jaringan. Coba lagi.");
            setTimeout(() => {
              isProcessingRef.current = false;
              scanner.resume();
            }, 3000);
          }
        },
        (err) => {
          // Abaikan error saat tidak ada QR yang terdeteksi di frame
        }
      );
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 text-white font-sans">
      <div className="bg-gray-800 p-6 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700">
        <h2 className="text-2xl font-bold text-indigo-400 mb-2 text-center">
          Scan QR Kelas
        </h2>
        <p className="text-gray-400 text-sm mb-6 text-center">
          Pastikan NIM terisi sebelum membuka kamera
        </p>

        <input
          type="text"
          ref={nimRef}
          disabled={isCameraOpen}
          placeholder="Masukkan NIM (Cth: MHS-20230001)"
          className="w-full p-3 rounded-lg bg-gray-900 border border-indigo-500 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4 text-center font-mono disabled:opacity-50"
        />

        {/* Tombol pemicu kamera (Solusi untuk HP) */}
        {!isCameraOpen && (
          <button
            onClick={startCamera}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg mb-6 transition-colors"
          >
            📷 Buka Kamera
          </button>
        )}

        {/* Kotak Scanner hanya dirender setelah tombol diklik */}
        {isCameraOpen && (
          <div
            id="reader"
            className="w-full rounded-lg overflow-hidden border-2 border-dashed border-gray-600 mb-6 bg-black min-h-[250px]"
          ></div>
        )}

        <div className="bg-gray-900 p-4 rounded-lg text-center font-medium border border-gray-700 shadow-inner">
          {status}
        </div>
      </div>
    </div>
  );
}