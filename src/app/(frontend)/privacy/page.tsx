import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'PDPA Privacy Notice | oneseventycadence',
  description:
    'Personal Data Protection Act (PDPA) Privacy Notice for oneseventycadence event registrations and refund processing.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* Top Brand Accent Bar */}
      <div
        className="h-1 w-full"
        style={{ background: 'linear-gradient(90deg, #E93998, #f472b6, #E93998)' }}
      />

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {/* Navigation */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#E93998] transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Event Registration
        </Link>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-md shrink-0"
            style={{ backgroundColor: '#E93998' }}
          >
            <Image
              src="/images/osc-logo-white.PNG"
              alt="oneseventycadence logo"
              width={36}
              height={36}
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Privacy Notice / Notis Privasi
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Personal Data Protection Act 2010 (Malaysia)
            </p>
          </div>
        </div>

        {/* Document Content */}
        <div className="space-y-10 text-sm leading-relaxed text-gray-700">
          {/* ENGLISH SECTION */}
          <section className="space-y-4">
            <div className="inline-block px-3 py-1 bg-pink-50 text-[#E93998] rounded-md font-semibold text-xs uppercase tracking-wide">
              English Version
            </div>

            <h2 className="text-lg font-bold text-gray-900">
              Personal Data Protection Notice (PDPA)
            </h2>
            <p>
              In compliance with the{' '}
              <strong>Personal Data Protection Act 2010 of Malaysia (&quot;PDPA&quot;)</strong>,
              this Privacy Notice explains how <strong>oneseventycadence</strong> (&quot;we&quot;,
              &quot;us&quot;, or &quot;our&quot;) collects, uses, processes, discloses, and protects
              your personal data when you register for our running events or submit refund requests.
            </p>

            <div className="space-y-3 pt-2">
              <h3 className="font-semibold text-gray-900">1. Personal Data Collected</h3>
              <p>
                We collect personal information directly from you when registering or requesting refunds,
                including:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li>Full Name</li>
                <li>Email Address</li>
                <li>Phone Number</li>
                <li>Selected Event Details &amp; Attendance Status</li>
                <li>
                  DuitNow QR Screenshots &amp; Account Holder Name (collected solely for event refund requests when events are postponed or cancelled)
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">
                2. Purpose of Collection &amp; Processing
              </h3>
              <p>Your personal data is collected and processed for the following purposes:</p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li>Processing and managing your event registration and entry slots.</li>
                <li>
                  Sending event confirmation notices, updates, venue reminders, or cancellation/postponement notices.
                </li>
                <li>Processing 100% full refunds via DuitNow QR in the event of cancellation or postponement.</li>
                <li>On-site check-in and attendance verification.</li>
                <li>Contacting you in case of emergency or safety updates related to the event.</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">3. Disclosure to Third Parties</h3>
              <p>
                We do <strong>not</strong> sell, rent, or trade your personal data to third parties
                for marketing purposes. Your data may only be disclosed to:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li>
                  Authorized event organizers, marshals, and crew members for event logistics.
                </li>
                <li>
                  Medical personnel or emergency services in the event of an incident during runs.
                </li>
                <li>
                  Regulatory or law enforcement bodies if required by applicable Malaysian law.
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">4. Security &amp; Data Retention</h3>
              <p>
                We implement appropriate administrative and technical measures to protect your
                personal data against unauthorized access, loss, or misuse. In accordance with PDPA Data Minimization rules,
                <strong> DuitNow QR code screenshots uploaded for refund requests are stored in an isolated secure collection and are automatically and permanently deleted from our servers immediately upon completion of your refund transfer.</strong>
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">
                5. Your Access &amp; Correction Rights
              </h3>
              <p>Under the PDPA, you have the right to:</p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li>Request access to your personal data held by us.</li>
                <li>Request correction of inaccurate, incomplete, or out-of-date personal data.</li>
                <li>Withdraw your consent to process your personal data at any time.</li>
              </ul>
            </div>
          </section>

          <hr className="border-gray-200 my-8" />

          {/* BAHASA MALAYSIA SECTION */}
          <section className="space-y-4">
            <div className="inline-block px-3 py-1 bg-pink-50 text-[#E93998] rounded-md font-semibold text-xs uppercase tracking-wide">
              Versi Bahasa Malaysia
            </div>

            <h2 className="text-lg font-bold text-gray-900">
              Notis Perlindungan Data Peribadi (PDPA)
            </h2>
            <p>
              Selaras dengan{' '}
              <strong>Akta Perlindungan Data Peribadi 2010 Malaysia (&quot;PDPA&quot;)</strong>,
              Notis Privasi ini menjelaskan bagaimana <strong>oneseventycadence</strong>{' '}
              (&quot;kami&quot;) mengumpul, mengguna, memproses, mendedahkan, dan melindungi data
              peribadi anda semasa anda mendaftar untuk acara larian kami atau membuat permohonan pemulangan wang.
            </p>

            <div className="space-y-3 pt-2">
              <h3 className="font-semibold text-gray-900">1. Data Peribadi Yang Dikumpul</h3>
              <p>
                Semasa anda mendaftar atau memohon pemulangan wang, kami mengumpul maklumat peribadi daripada
                anda secara langsung, termasuk:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li>Nama Penuh</li>
                <li>Alamat Emel</li>
                <li>Nombor Telefon</li>
                <li>Butiran Acara Yang Dipilih &amp; Status Kehadiran</li>
                <li>Tangkapan Skrin Imej QR DuitNow &amp; Nama Pemegang Akaun (dikumpul khusus bagi tujuan permohonan pemulangan wang sekiranya acara ditunda atau dibatalkan)</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">
                2. Tujuan Pengumpulan &amp; Pemprosesan
              </h3>
              <p>Data peribadi anda dikumpul dan diproses untuk tujuan-tujuan berikut:</p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li>Memproses dan menguruskan pendaftaran serta slot penyertaan acara anda.</li>
                <li>
                  Menghantar pengesahan pendaftaran, maklumat terkini acara, serta notis penundaan atau pembatalan acara.
                </li>
                <li>Memproses pemulangan wang 100% secara imbasan DuitNow QR sekiranya acara ditunda atau dibatalkan.</li>
                <li>Pengesahan kehadiran semasa pendaftaran di lokasi acara (check-in).</li>
                <li>Menghubungi anda jika berlaku kecemasan atau bagi tujuan keselamatan acara.</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">3. Pendedahan Kepada Pihak Ketiga</h3>
              <p>
                Kami <strong>tidak akan</strong> menjual, menyewa, atau memperdagangkan data
                peribadi anda kepada pihak ketiga untuk tujuan pemasaran. Data anda hanya boleh
                didedahkan kepada:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li>Penganjur acara, petugas larian (marshals), dan krew yang diberi kuasa.</li>
                <li>
                  Petugas perubatan atau perkhidmatan kecemasan jika berlaku sebarang insiden semasa
                  larian.
                </li>
                <li>
                  Badan penguatkuasa undang-undang jika diwajibkan di bawah undang-undang Malaysia.
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">4. Keselamatan &amp; Simpanan Data</h3>
              <p>
                Kami mengambil langkah pentadbiran dan teknikal yang sewajarnya untuk melindungi
                data peribadi anda daripada akses tanpa kebenaran, kehilangan, atau penyalahgunaan.
                Selaras dengan prinsip Pengurangan Data PDPA, <strong>tangkapan skrin kod QR DuitNow yang dimuat naik untuk permohonan pemulangan wang disimpan secara terpencil dan akan dipadamkan secara automatik serta kekal daripada pelayan kami serta-merta selepas proses pemulangan wang selesai.</strong>
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">5. Hak Akses &amp; Pembetulan Anda</h3>
              <p>Di bawah Akta PDPA, anda berhak untuk:</p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li>Meminta akses kepada data peribadi anda yang disimpan oleh kami.</li>
                <li>
                  Meminta pembetulan data peribadi yang tidak tepat, tidak lengkap, atau tidak
                  terkini.
                </li>
                <li>Menarik balik kebenaran pemprosesan data peribadi anda pada bila-bila masa.</li>
              </ul>
            </div>
          </section>
        </div>

        {/* Footer Link Back */}
        <div className="mt-12 pt-6 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} oneseventycadence · All rights reserved
          </p>
          <Link href="/" className="text-xs font-semibold text-[#E93998] hover:underline">
            Return to Registration →
          </Link>
        </div>
      </div>
    </div>
  )
}
