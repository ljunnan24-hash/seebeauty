import { Scale, FileText, ShieldCheck } from 'lucide-react';

const sections = [
  {
    heading: '1. Introduction',
    icon: FileText,
    paragraphs: [
      'Welcome to SeeBeauty (www.seeurbeauty.com). These Terms govern your use of our AI photo analysis services (appearance and figure evaluation & suggestions) and apply to U.S. users.',
      'By creating an account or using the services, you agree to be bound by these Terms and applicable U.S. laws; we may revise these Terms, and major changes will be notified via email. Continued use constitutes acceptance of revised Terms.'
    ]
  },
  {
    heading: '2. Account & Photo Rules',
    icon: ShieldCheck,
    paragraphs: [
      'You must be at least 13 years old (compliant with the Children\'s Online Privacy Protection Act (COPPA)); if under 18, guardian consent is required. You shall keep account information confidential; violations (e.g., account theft, uploading others\' photos) may result in account suspension/termination.',
      'You may only upload compliant photos of yourself or photos with authorization. By uploading, you grant us a global limited license: for AI analysis and anonymized algorithm optimization, not for commercial promotion.',
      'You may request deletion of original photos and analysis records (completed within 10 business days, compliant with CCPA right to deletion); anonymized algorithm data is not eligible for deletion.'
    ]
  },
  {
    heading: '3. Purchases & Subscriptions',
    icon: Scale,
    paragraphs: [
      'Paid subscriptions auto-renew; a renewal reminder will be sent via email 5 business days before renewal. Cancellation must be completed 48 hours before renewal.',
      'Refund Rules: If services are unavailable due to platform errors, refunds are calculated based on the proportion of unused duration; refunds for personal reasons are only available for subscriptions within 72 hours with no core services used—no refunds for overdue or used subscriptions.'
    ]
  }
];

const listSections = [
  {
    title: '4. Intellectual Property & Feedback',
    items: [
      'Intellectual property rights (IP) of the platform\'s AI algorithms, trademarks, etc., belong to SeeBeauty, protected by U.S. Copyright Act and Trademark Act. You may not reproduce or reverse engineer them without authorization.',
      'Copyright of photos you upload belongs to you; copyright of AI analysis results belongs to SeeBeauty. You may use results for personal non-commercial purposes.',
      'We may use general feedback for service optimization free of charge; IP of original technical achievements (e.g., algorithm schemes) belongs to you, and we must negotiate separately to use them.'
    ]
  },
  {
    title: '5. Limitation of Liability',
    items: [
      'Services are provided "as is"; AI analysis results are for reference only. We are not liable for result accuracy or service issues caused by force majeure/third-party faults, but will legally compensate for direct losses caused by our intent or gross negligence.',
      'We have adopted measures like encrypted storage to protect information (compliant with FTC requirements) and are not liable for leaks caused by malicious attacks beyond reasonable technical scope.'
    ]
  },
  {
    title: '6. Privacy & Dispute Resolution',
    items: [
      'Protection of your information is subject to the Privacy Policy; we will not share original photos or identifiable records with third parties (except as required by law, with your consent, or to trusted service providers).',
      'These Terms are governed by California law, U.S. Disputes shall first be negotiated; if failed, legal action may be filed in a competent court in California.'
    ]
  },
  {
    title: '7. Contact Information',
    items: [
      'For inquiries/complaints: Email seeurbeauty000@gmail.com (responses within 24 hours on workdays).'
    ]
  }
];

function TermsOfUsePage() {
  return (
    <div className="relative bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 min-h-[90vh] py-16 px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-16 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40" />
        <div className="absolute bottom-10 left-12 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40" />
      </div>

      <div className="relative max-w-4xl mx-auto">
        <div className="bg-white/80 backdrop-blur-lg shadow-2xl rounded-3xl border border-white/40 p-10">
          <header className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Terms of Use
            </h1>
            <p className="text-gray-600 text-lg">
              Effective date: October 1, 2025
            </p>
          </header>

          <div className="grid gap-8 mb-12">
            {sections.map(({ heading, icon: Icon, paragraphs }) => (
              <section key={heading} className="p-6 rounded-2xl bg-white shadow-lg border border-purple-100/60">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-md">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">{heading}</h2>
                    <div className="space-y-3 text-gray-700 leading-relaxed">
                      {paragraphs.map((text, index) => (
                        <p key={index}>{text}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            ))}
          </div>

          <div className="space-y-8">
            {listSections.map(({ title, items }) => (
              <section key={title} className="p-6 rounded-2xl bg-white shadow-md border border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>
                <ul className="space-y-3 text-gray-700 leading-relaxed list-disc list-inside">
                  {items.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <footer className="mt-12 bg-purple-50 border border-purple-100 rounded-2xl p-6 text-sm text-gray-600">
            <p className="font-semibold mb-2">Need help?</p>
            <p>
              Email us at{' '}
              <a href="mailto:seeurbeauty000@gmail.com" className="text-purple-600 hover:text-purple-700 font-medium">
                seeurbeauty000@gmail.com
              </a>{' '}
              (responses within 24 hours on workdays)
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default TermsOfUsePage;