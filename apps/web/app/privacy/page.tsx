import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-paper flex flex-col justify-between selection:bg-neutral-200 font-sans">
      <header className="border-b border-border bg-white sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center text-xs font-mono uppercase tracking-wider text-muted hover:text-ink"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to System Portal
          </Link>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-graphite flex items-center justify-center text-white font-mono font-bold text-xs">
              TK
            </div>
            <span className="font-mono text-xs tracking-wider text-graphite font-bold uppercase">
              THEKEDAR
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full px-6 py-12 flex-1">
        <div className="border border-border bg-white p-8 md:p-12">
          <div className="flex items-center space-x-2 text-xs font-mono text-muted uppercase tracking-wider mb-3">
            <Shield className="w-4 h-4 text-signal-orange" />
            <span>Institutional Policy &bull; Last Revised October 2026</span>
          </div>
          <h1 className="text-3xl font-semibold text-ink tracking-tight mb-8">
            Privacy Policy
          </h1>

          <div className="space-y-6 text-sm text-muted leading-relaxed">
            <section>
              <h2 className="text-base font-semibold text-ink mb-2">1. Scope and Application</h2>
              <p>
                This Privacy Policy outlines how the THEKEDAR Institutional Resource Booking and Permission Management System (&quot;the System&quot;) collects, handles, stores, and protects information associated with campus resource bookings, faculty approvals, and digital document notarization. The System is operated for institutional campus governance and operations.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-ink mb-2">2. Information We Collect</h2>
              <p>The System processes only operational data required for campus logistics and audit integrity:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong className="text-ink">User Credentials and Identity:</strong> Institutional email address, full name, student registration number or faculty employee ID, and assigned role (Club Member, Department Authority, or System Admin).</li>
                <li><strong className="text-ink">Event and Booking Specifications:</strong> Event titles, descriptions, participant counts, requested campus facilities (auditoriums, labs, grounds), required equipment, and scheduled times.</li>
                <li><strong className="text-ink">Administrative Decisions:</strong> Authority approval records, rejection grounds, modification/correction notes, and associated institutional timestamps.</li>
                <li><strong className="text-ink">Audit Logs:</strong> Client IP addresses, user agent strings, and action telemetry recorded strictly for security, collision debugging, and compliance audits.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-ink mb-2">3. Cryptographic and On-Chain Proofs</h2>
              <p>
                To provide tamper-evident verification of permission letters, the System generates SHA-256 cryptographic hashes and 2048-bit RSA-PSS digital signatures of issued approval letters.
              </p>
              <p className="mt-2">
                <strong className="text-ink">Public Blockchain Data:</strong> Only cryptographic hashes (represented as 32-byte hexadecimal strings), internal document reference codes, and timestamps are registered to the Ethereum Sepolia smart contract. No personally identifiable student information (PII) is written to the public blockchain.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-ink mb-2">4. Data Storage and Retention</h2>
              <p>
                Institutional booking records, audit trails, and generated PDF letters are stored in secure relational databases and encrypted file stores. These records are retained for a minimum of five (5) academic years in compliance with university accreditation standards and administrative statutory policies.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-ink mb-2">5. Data Sharing and Disclosure</h2>
              <p>
                Information stored in the System is shared strictly with authorized campus personnel, including campus security gatekeepers, department heads, faculty advisors, and the Registrar&apos;s office. Information is never sold, licensed, or shared with third-party advertising or marketing services.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-ink mb-2">6. Contact and Inquiries</h2>
              <p>
                For questions regarding data records or access requests under institutional governance rules, contact the Campus Data Protection Officer at:
                <br />
                <span className="font-mono text-xs text-ink mt-1 inline-block">
                  dpo@institutional-control.edu &bull; Office of the Registrar, Academic Block A
                </span>
              </p>
            </section>
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-white py-6">
        <div className="max-w-4xl mx-auto px-6 flex justify-between items-center text-xs font-mono text-muted">
          <div>THEKEDAR Institutional Operations Console &copy; 2026.</div>
          <div className="space-x-6">
            <Link href="/terms" className="hover:text-ink">Terms of Service</Link>
            <Link href="/" className="hover:text-ink">Portal Home</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
