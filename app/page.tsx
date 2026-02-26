"use client";

import { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function ScannerPage() {
  const [status, setStatus] = useState("Arahkan kamera ke QR Code");
  const nimRef = useRef<HTMLInputElement>(null);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    // Inisialisasi scanner hanya di sisi client
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(
      async (decodedText) => {
        const nim = nimRef.current?.value.trim();
        
        if (!nim) {
          setStatus("❌ Isi NIM kamu terlebih dahulu!");
          return;
        }

        // Mencegah scan berkali-kali secara bersamaan
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;
        
        scanner.pause(true); // Hentikan kamera sementara
        setStatus("⏳ Memproses data presensi...");

        // --- MASUKKAN URL GOOGLE APPS SCRIPT KAMU DI SINI ---
        const gasUrl = "https://script.google.com/macros/s/MASUKKAN_ID_DEPLOYMENT_KAMU/exec";

        try {
          // Sekarang kita tembak API lokal kita sendiri (Bebas CORS!)
          const res = await fetch("/api/checkin", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user_id: nim,
              device_id: "nextjs-web-scanner",
              course_id: "cloud-101",
              session_id: "sesi-02",
              qr_token: decodedText,
              ts: new Date().toISOString()
            })
          });

          const result = await res.json();
          
          if (result.ok) {
            setStatus("✅ Berhasil Check-In!");
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
        // Abaikan error pembacaan frame kosong
      }
    );

    // Cleanup saat komponen ditutup
    return () => {
      scanner.clear().catch(console.error);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 text-white font-sans">
      <div className="bg-gray-800 p-6 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700">
        <h2 className="text-2xl font-bold text-indigo-400 mb-2 text-center">Scan QR Kelas</h2>
        <p className="text-gray-400 text-sm mb-6 text-center">Pastikan NIM/User ID terisi sebelum scan</p>

        <input
          type="text"
          ref={nimRef}
          placeholder="Masukkan NIM (Cth: MHS-20230001)"
          className="w-full p-3 rounded-lg bg-gray-900 border border-indigo-500 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-6 text-center font-mono"
        />

        {/* Kotak Scanner */}
        <div 
          id="reader" 
          className="w-full rounded-lg overflow-hidden border-2 border-dashed border-gray-600 mb-6 bg-black"
        ></div>

        {/* Status Bar */}
        <div className="bg-gray-900 p-4 rounded-lg text-center font-medium border border-gray-700 shadow-inner">
          {status}
        </div>
      </div>
    </div>
  );
}