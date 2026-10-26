import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Calendar,
  FileText,
  Layers,
  Lock,
  CheckCircle2,
  HelpCircle,
  Building2,
  Cpu,
} from "lucide-react";

export default function HomePage() {
  const faqs = [
    {
      q: "How does multi-department approval work?",
      a: "When an event requires multiple campus resources (e.g. an auditorium managed by Student Welfare and lab equipment managed by Electrical Eng.), the system decomposes the request into distinct department items. Each department reviews and decides independently. An event is only fully authorized when all required departments have issued approvals.",
    },
    {
      q: "What role does the Sepolia blockchain play?",
      a: "The blockchain does not replace institutional authority or database state. Instead, it serves as an immutable, tamper-evident audit notary. When a department grants approval, a cryptographic SHA-256 hash of the generated permission letter is registered into an on-chain smart contract, providing timestamped public proof of authenticity.",
    },
    {
      q: "What happens if a department requests a correction?",
      a: "If an authority flags a time conflict or policy requirement, they record a correction note. The club applicant can resubmit with updated parameters. This resubmission creates a new version (e.g. v2) for that specific department while preserving previous versions in the permanent audit trail. Any prior permission letter for that department is automatically superseded.",
    },
    {
      q: "Can a revoked or modified letter still be passed off as valid?",
      a: "No. The public verification engine checks four distinct criteria: (1) RSA-PSS digital signature validity, (2) database hash match, (3) current approval vs. superseded/revoked status, and (4) on-chain smart contract confirmation. A modified letter immediately fails cryptographic signature checks, and a superseded letter displays an explicit warning.",
    },
  ];

  return (
    <div className="min-h-screen bg-paper flex flex-col justify-between selection:bg-neutral-200">
      {/* Top Bar */}
      <header className="border-b border-border bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-graphite flex items-center justify-center text-white font-mono font-bold text-sm">
              TK
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-xs tracking-widest text-graphite font-bold uppercase">
                THEKEDAR
              </span>
              <span className="text-[10px] text-muted font-mono leading-none">
                INSTITUTIONAL CONTROL SYSTEM
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-6 text-xs font-mono uppercase tracking-wider text-muted">
            <a href="#resources" className="hover:text-ink transition">Resources</a>
            <a href="#departments" className="hover:text-ink transition">Workflow</a>
            <a href="#signatures" className="hover:text-ink transition">Digital Signatures</a>
            <a href="#verification" className="hover:text-ink transition">Verification</a>
            <a href="#faq" className="hover:text-ink transition">FAQ</a>
          </nav>

          <div className="flex items-center space-x-3">
            <Link
              href="/verify"
              className="px-3.5 py-1.5 border border-border bg-white text-ink text-xs font-mono uppercase tracking-wider hover:bg-neutral-50 transition"
            >
              Verify Letter
            </Link>
            <Link
              href="/auth/login"
              className="px-3.5 py-1.5 bg-graphite text-white text-xs font-mono uppercase tracking-wider hover:bg-black transition"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-border bg-white py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3 py-1 mb-6 border border-border bg-paper text-muted font-mono text-xs uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-signal-orange inline-block"></span>
            <span>Version 1.0 Production Standard</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-ink tracking-tight leading-tight max-w-4xl">
            College resource booking, with clear approvals and verifiable records.
          </h1>

          <p className="mt-6 text-lg text-muted max-w-3xl leading-relaxed">
            Create event requests, coordinate permissions across departments, and access signed permission letters from one place. Built with deterministic conflict detection and cryptographic audit verification.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/auth/login"
              className="inline-flex items-center px-6 py-3 bg-signal-orange text-white text-sm font-medium hover:bg-[#d65f2f] transition"
            >
              Access System
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
            <Link
              href="/verify"
              className="inline-flex items-center px-6 py-3 border border-border bg-white text-ink text-sm font-medium hover:bg-neutral-50 transition"
            >
              Verify Permission Letter
            </Link>
          </div>

          {/* Institutional Blueprint Spec Card */}
          <div className="mt-14 border border-border bg-paper p-6 font-mono text-xs text-muted">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <span className="text-[10px] uppercase tracking-wider block text-neutral-400">Conflict Engine</span>
                <span className="font-semibold text-ink text-sm mt-1 block">Pessimistic Locking</span>
                <span className="text-[11px] mt-0.5 block">Row-level database transactions prevent double bookings.</span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider block text-neutral-400">Approval Architecture</span>
                <span className="font-semibold text-ink text-sm mt-1 block">Multi-Department</span>
                <span className="text-[11px] mt-0.5 block">Independent reviews, versioning, and status aggregation.</span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider block text-neutral-400">Document Security</span>
                <span className="font-semibold text-ink text-sm mt-1 block">RSA-PSS Signatures</span>
                <span className="text-[11px] mt-0.5 block">Cryptographic 2048-bit keys stamp tamper-evident PDF letters.</span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider block text-neutral-400">Audit Notarization</span>
                <span className="font-semibold text-ink text-sm mt-1 block">Ethereum Sepolia</span>
                <span className="text-[11px] mt-0.5 block">Immutable hash registration via DocumentRegistry smart contract.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 1: What the System Manages */}
      <section id="resources" className="py-20 px-6 border-b border-border max-w-7xl mx-auto w-full">
        <div className="max-w-2xl mb-12">
          <span className="font-mono text-xs uppercase tracking-wider text-muted">System Scope</span>
          <h2 className="text-3xl font-semibold text-ink tracking-tight mt-1">
            What the system manages
          </h2>
          <p className="text-muted text-sm mt-3 leading-relaxed">
            Campuses run hundreds of overlapping activities. The system enforces strict scheduling integrity across shared institutional assets without scheduling collisions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-border bg-white p-6">
            <div className="w-10 h-10 border border-border bg-paper flex items-center justify-center text-graphite mb-4">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-ink text-base">Venues & Facilities</h3>
            <p className="text-xs text-muted mt-2 leading-relaxed">
              Main auditoriums, open-air amphitheaters, executive seminar halls, and conference boardrooms. Each venue carries strict capacity parameters and facility restrictions.
            </p>
            <div className="mt-4 pt-4 border-t border-border font-mono text-[11px] text-muted">
              Capacity validation &bull; Setup windows
            </div>
          </div>

          <div className="border border-border bg-white p-6">
            <div className="w-10 h-10 border border-border bg-paper flex items-center justify-center text-graphite mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-ink text-base">Specialized Laboratories</h3>
            <p className="text-xs text-muted mt-2 leading-relaxed">
              High-performance computing clusters, robotics enclosures, and electronics workshops requiring supervisor safety compliance and specific technician clearances.
            </p>
            <div className="mt-4 pt-4 border-t border-border font-mono text-[11px] text-muted">
              Safety sign-off &bull; Lab technician routing
            </div>
          </div>

          <div className="border border-border bg-white p-6">
            <div className="w-10 h-10 border border-border bg-paper flex items-center justify-center text-graphite mb-4">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-ink text-base">Sports Grounds & Open Arenas</h3>
            <p className="text-xs text-muted mt-2 leading-relaxed">
              Athletic tracks, indoor badminton courts, football turfs, and campus pavilions coordinated through Physical Education and Campus Security authorities.
            </p>
            <div className="mt-4 pt-4 border-t border-border font-mono text-[11px] text-muted">
              Physical education &bull; Security dispatch
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: How Department Requests Work */}
      <section id="departments" className="py-20 px-6 border-b border-border bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-12">
            <span className="font-mono text-xs uppercase tracking-wider text-muted">Operational Architecture</span>
            <h2 className="text-3xl font-semibold text-ink tracking-tight mt-1">
              How department-wise requests work
            </h2>
            <p className="text-muted text-sm mt-3 leading-relaxed">
              Instead of passing a physical paperwork folder between academic blocks, the system models the real multi-stakeholder approval lifecycle in software.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="border border-border bg-paper p-6 relative">
              <div className="font-mono text-xs text-muted uppercase font-semibold">Step 01</div>
              <h4 className="font-semibold text-ink text-base mt-2">Single Submission</h4>
              <p className="text-xs text-muted mt-2 leading-relaxed">
                The student club creates one unified event request containing all needed dates, venues, equipment, and guest information.
              </p>
            </div>

            <div className="border border-border bg-paper p-6 relative">
              <div className="font-mono text-xs text-muted uppercase font-semibold">Step 02</div>
              <h4 className="font-semibold text-ink text-base mt-2">Atomic Decomposition</h4>
              <p className="text-xs text-muted mt-2 leading-relaxed">
                The engine isolates resources by responsible department (e.g. Estate Office, Dean Academics, Security) into distinct sub-requests.
              </p>
            </div>

            <div className="border border-border bg-paper p-6 relative">
              <div className="font-mono text-xs text-muted uppercase font-semibold">Step 03</div>
              <h4 className="font-semibold text-ink text-base mt-2">Parallel Review</h4>
              <p className="text-xs text-muted mt-2 leading-relaxed">
                Authorities review requests in parallel queues without blocking one another. Approvals, rejections, or correction notices are recorded with reasons.
              </p>
            </div>

            <div className="border border-border bg-paper p-6 relative">
              <div className="font-mono text-xs text-muted uppercase font-semibold">Step 04</div>
              <h4 className="font-semibold text-ink text-base mt-2">Status Aggregation</h4>
              <p className="text-xs text-muted mt-2 leading-relaxed">
                The master event status reflects the logical aggregate: Approved only when all pass, Needs Correction if any department requests edits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Approvals & Signed Letters */}
      <section id="signatures" className="py-20 px-6 border-b border-border max-w-7xl mx-auto w-full">
        <div className="max-w-2xl mb-12">
          <span className="font-mono text-xs uppercase tracking-wider text-muted">Document Integrity</span>
          <h2 className="text-3xl font-semibold text-ink tracking-tight mt-1">
            How approvals and signed letters are handled
          </h2>
          <p className="text-muted text-sm mt-3 leading-relaxed">
            When a department authority issues an approval, the system immediately generates an official digital permission letter.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            <div className="flex space-x-4">
              <div className="w-8 h-8 rounded border border-border bg-paper flex items-center justify-center shrink-0 text-graphite font-mono text-xs font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold text-ink text-sm">Deterministic Letter Generation</h4>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  Generated as standard PDF documents containing institutional header, unique letter ID (e.g. <span className="font-mono">PL-CSE-001</span>), version number, event parameters, and authorized signatory metadata.
                </p>
              </div>
            </div>

            <div className="flex space-x-4">
              <div className="w-8 h-8 rounded border border-border bg-paper flex items-center justify-center shrink-0 text-graphite font-mono text-xs font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold text-ink text-sm">RSA-PSS Digital Cryptographic Signature</h4>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  The PDF byte stream is signed using 2048-bit RSA with PSS padding and SHA-256. Any post-issuance modification of a single byte breaks the signature validation.
                </p>
              </div>
            </div>

            <div className="flex space-x-4">
              <div className="w-8 h-8 rounded border border-border bg-paper flex items-center justify-center shrink-0 text-graphite font-mono text-xs font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold text-ink text-sm">Independent Version History</h4>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  If an event schedule is revised, a new letter version (v2) is issued. The prior version is recorded as <span className="font-mono text-amber-700">SUPERSEDED</span>, preventing stale authorization letters from being used.
                </p>
              </div>
            </div>
          </div>

          <div className="border border-border bg-white p-6 font-mono text-xs">
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <span className="font-bold text-graphite">SAMPLE PERMISSION LETTER SPEC</span>
              <span className="px-2 py-0.5 bg-neutral-100 text-[10px] text-muted">REPORTLAB ENGINE</span>
            </div>
            <div className="mt-4 space-y-2 text-muted text-[11px]">
              <div><span className="text-neutral-400">Letter Reference:</span> PL-SW-2026-0042</div>
              <div><span className="text-neutral-400">Department:</span> Office of Student Welfare</div>
              <div><span className="text-neutral-400">Version:</span> 1.0 (Current)</div>
              <div><span className="text-neutral-400">Digital Signature:</span> 2048-bit RSA-PSS Verified</div>
              <div><span className="text-neutral-400">Document Hash:</span> 0x8f3c7b21...9e4a</div>
              <div><span className="text-neutral-400">Blockchain Record:</span> Sepolia Block #5419082</div>
              <div><span className="text-neutral-400">Status:</span> APPROVED & VALID</div>
            </div>
            <div className="mt-6 p-3 bg-paper border border-border text-[11px] text-muted leading-relaxed">
              Institutional gatekeepers and security guards can verify this document in seconds by entering the letter ID or uploading the PDF to the public verification portal.
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Document Verification */}
      <section id="verification" className="py-20 px-6 border-b border-border bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-12">
            <span className="font-mono text-xs uppercase tracking-wider text-muted">Public Audit Portal</span>
            <h2 className="text-3xl font-semibold text-ink tracking-tight mt-1">
              How document verification works
            </h2>
            <p className="text-muted text-sm mt-3 leading-relaxed">
              Verification is publicly accessible and requires no login. Anyone can verify the authenticity of a printed or digital letter.
            </p>
          </div>

          <div className="border border-border bg-paper p-8">
            <h3 className="font-mono text-xs uppercase tracking-wider text-graphite font-bold mb-6">
              Sequential 5-Point Cryptographic Check
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-white border border-border p-4">
                <div className="flex items-center space-x-2 text-graphite mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-mono text-xs font-semibold">Check 1</span>
                </div>
                <div className="text-xs font-medium text-ink">Signature Validation</div>
                <div className="text-[11px] text-muted mt-1 leading-snug">
                  Verifies RSA-PSS signature against the institution&apos;s public key.
                </div>
              </div>

              <div className="bg-white border border-border p-4">
                <div className="flex items-center space-x-2 text-graphite mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-mono text-xs font-semibold">Check 2</span>
                </div>
                <div className="text-xs font-medium text-ink">Hash Integrity Match</div>
                <div className="text-[11px] text-muted mt-1 leading-snug">
                  Matches file SHA-256 against stored database records.
                </div>
              </div>

              <div className="bg-white border border-border p-4">
                <div className="flex items-center space-x-2 text-graphite mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-mono text-xs font-semibold">Check 3</span>
                </div>
                <div className="text-xs font-medium text-ink">Approval State</div>
                <div className="text-[11px] text-muted mt-1 leading-snug">
                  Ensures department decision is officially recorded as Approved.
                </div>
              </div>

              <div className="bg-white border border-border p-4">
                <div className="flex items-center space-x-2 text-graphite mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-mono text-xs font-semibold">Check 4</span>
                </div>
                <div className="text-xs font-medium text-ink">Supersession Check</div>
                <div className="text-[11px] text-muted mt-1 leading-snug">
                  Checks that letter has not been superseded by a newer version.
                </div>
              </div>

              <div className="bg-white border border-border p-4">
                <div className="flex items-center space-x-2 text-graphite mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-mono text-xs font-semibold">Check 5</span>
                </div>
                <div className="text-xs font-medium text-ink">Sepolia Confirmation</div>
                <div className="text-[11px] text-muted mt-1 leading-snug">
                  Confirms hash registration on Ethereum Sepolia testnet.
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <Link
                href="/verify"
                className="inline-flex items-center px-4 py-2 bg-graphite text-white text-xs font-mono uppercase tracking-wider hover:bg-black transition"
              >
                Go to Verification Tool
                <ArrowRight className="ml-2 w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: FAQs */}
      <section id="faq" className="py-20 px-6 border-b border-border max-w-5xl mx-auto w-full">
        <div className="mb-12">
          <span className="font-mono text-xs uppercase tracking-wider text-muted">Clarifications</span>
          <h2 className="text-3xl font-semibold text-ink tracking-tight mt-1">
            Frequently asked questions
          </h2>
        </div>

        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-border bg-white p-6">
              <h4 className="font-semibold text-ink text-base flex items-start">
                <HelpCircle className="w-5 h-5 text-signal-orange mr-3 shrink-0 mt-0.5" />
                <span>{faq.q}</span>
              </h4>
              <p className="text-sm text-muted mt-3 pl-8 leading-relaxed">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-border">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-graphite text-white font-mono font-bold text-xs flex items-center justify-center">
                  TK
                </div>
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-graphite">
                  THEKEDAR
                </span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Institutional resource booking, multi-department coordination, and cryptographic document audit verification.
              </p>
            </div>

            <div>
              <div className="font-mono text-xs uppercase tracking-wider font-semibold text-graphite mb-3">
                System Portals
              </div>
              <ul className="space-y-2 text-xs text-muted">
                <li><Link href="/auth/login" className="hover:text-ink">Sign In / SSO</Link></li>
                <li><Link href="/club/dashboard" className="hover:text-ink">Club User Console</Link></li>
                <li><Link href="/authority/dashboard" className="hover:text-ink">Department Authority Console</Link></li>
                <li><Link href="/admin/users" className="hover:text-ink">Institutional Administration</Link></li>
              </ul>
            </div>

            <div>
              <div className="font-mono text-xs uppercase tracking-wider font-semibold text-graphite mb-3">
                Verification & Audit
              </div>
              <ul className="space-y-2 text-xs text-muted">
                <li><Link href="/verify" className="hover:text-ink">Verify Permission Letter</Link></li>
                <li><a href="#signatures" className="hover:text-ink">Cryptographic Specifications</a></li>
                <li><a href="https://sepolia.etherscan.io" target="_blank" rel="noreferrer" className="hover:text-ink">Sepolia Block Explorer</a></li>
              </ul>
            </div>

            <div>
              <div className="font-mono text-xs uppercase tracking-wider font-semibold text-graphite mb-3">
                Institutional Contact
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Campus Operations Centre<br />
                Office of the Registrar &bull; Block A<br />
                support@institutional-control.edu
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center text-xs font-mono text-muted space-y-4 md:space-y-0">
            <div>THEKEDAR &copy; 2026. Institutional Operations Console.</div>
            <div className="flex space-x-6">
              <Link href="/privacy" className="hover:text-ink">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-ink">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
