import { Shield, MailCheck, Lock } from 'lucide-react';

const sections = [
  {
    heading: '1. Introduction',
    icon: Shield,
    content: 'SeeBeauty (website: www.seeurbeauty.com) prioritizes user privacy. This Policy explains how we collect, use and protect your information, applies to U.S. users, and complies with the California Consumer Privacy Act (CCPA) and California Privacy Rights Act (CPRA).'
  },
  {
    heading: '2. Information Collection',
    icon: MailCheck,
    content: 'Only two types of necessary information are collected: Account Information (email address for registration and login); Service-Related Information (photos you upload exclusively for AI appearance/figure analysis).'
  },
  {
    heading: '3. How Information Is Used',
    icon: Lock,
    content: 'Email Address: Used for account verification, management, customer support responses, and service-related notifications (e.g., subscription expiration reminders). Uploaded Photos: Only used to generate AI analysis results or anonymize (remove personal identifiers) for algorithm optimization, not for commercial promotion.'
  }
];

const additionalSections = [
  {
    title: '4. Sharing and Disclosure',
    items: [
      'No sharing of your email or original photos with third parties, except when required by law (e.g., responding to U.S. court subpoenas).',
      'Collaboration with trusted service providers (e.g., encrypted storage) who must sign confidentiality agreements and comply with laws.'
    ]
  },
  {
    title: '5. User Rights (CCPA/CPRA Compliant)',
    items: [
      'Right to Access: Obtain records of your information.',
      'Right to Correction: Modify incorrect information (e.g., email).',
      'Right to Deletion: Delete your email and original photos (completed within 10 business days).',
      'Right to Unsubscribe: Opt out of non-essential marketing via links in marketing emails.'
    ]
  },
  {
    title: '6. Information Security',
    items: [
      'Adoption of industry-standard measures: encrypted data storage, access control, regular security audits, complying with Federal Trade Commission (FTC) requirements.'
    ]
  },
  {
    title: '7. Data Retention',
    items: [
      'Email Address: Retained until account cancellation or no longer needed for services.',
      'Photos: Retained until you request deletion, or after analysis and anonymization (original photos deleted promptly).',
      'All information is retained no longer than required by U.S. laws.'
    ]
  },
  {
    title: '8. Changes to This Policy',
    items: [
      'We may revise this Policy. Major changes will be notified via email and posted on the website; continued use of services constitutes acceptance of the revised Policy.'
    ]
  },
  {
    title: '9. Dispute Resolution and Contact',
    items: [
      'Disputes shall first be negotiated via email; if negotiation fails, legal action may be filed in a competent court in California, U.S.',
      'Contact Information: Support email seeurbeauty000@gmail.com (responses within 24 hours on workdays).'
    ]
  }
];

function PrivacyPolicyPage() {
  return (
    <div className="relative bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 min-h-[90vh] py-16 px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40" />
        <div className="absolute bottom-0 right-20 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40" />
      </div>

      <div className="relative max-w-4xl mx-auto">
        <div className="bg-white/80 backdrop-blur-lg shadow-2xl rounded-3xl border border-white/40 p-10">
          <header className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Privacy Policy
            </h1>
            <p className="text-gray-600 text-lg">
              Effective date: October 1, 2025
            </p>
          </header>

          <div className="grid gap-8 mb-12">
            {sections.map(({ heading, icon: Icon, content }) => (
              <section key={heading} className="p-6 rounded-2xl bg-white shadow-lg border border-purple-100/60">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-md">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">{heading}</h2>
                    <p className="text-gray-700 leading-relaxed">{content}</p>
                  </div>
                </div>
              </section>
            ))}
          </div>

          <div className="space-y-8">
            {additionalSections.map(({ title, items }) => (
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
            <p className="font-semibold mb-2">Contact</p>
            <p>
              Email: <a href="mailto:seeurbeauty000@gmail.com" className="text-purple-600 hover:text-purple-700 font-medium">seeurbeauty000@gmail.com</a> (responses within 24 hours on workdays)
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicyPage;