/**
 * Legal documents (English master copies). Rendered at /privacy and /terms
 * (public, reachable before sign-up, as informed consent requires).
 *
 * TEMPLATE-GRADE, NOT LEGAL ADVICE: reviewed structure follows GDPR
 * requirements, but before any commercial launch have a lawyer confirm the
 * governing-law clause and the contact details below.
 */

export const TERMS_VERSION = '2026-07-17';
export const LEGAL_CONTACT = 'mso@outlook.com';

export type LegalSection = { h: string; p: string[] };
export type LegalDoc = { title: string; updated: string; sections: LegalSection[] };

export const privacyPolicy: LegalDoc = {
  title: 'Privacy Policy',
  updated: TERMS_VERSION,
  sections: [
    {
      h: '1. Who we are',
      p: [
        `Superileri Fit ("the App") is a personal fitness application operated by the App's owner (the "Controller"). For any privacy matter, contact: ${LEGAL_CONTACT}.`,
      ],
    },
    {
      h: '2. What data we collect',
      p: [
        'Account data: your email address and the name you choose to display.',
        'Profile data you enter: chosen program, language, sex, birth year, height, and an optional goal text.',
        'Training data: which workouts you complete, when, and for how long; training partners you explicitly link by email.',
        'Progress photos and body data: full-body photos you choose to upload (front, back, sides), optional body weight, and AI-generated body-composition estimates. These reveal information about your body and are treated as health-related (special category) data.',
        'Technical data: error reports are stored only on your own device (you can view and clear them under Progress). We do not use analytics trackers or advertising identifiers.',
      ],
    },
    {
      h: '3. Why we process it (legal bases)',
      p: [
        'To provide the service you signed up for: account, program, calendar, timers, training history (GDPR Art. 6(1)(b), performance of contract).',
        'To analyze your progress photos with AI and show you body-composition estimates: only with your separate, explicit consent (GDPR Art. 9(2)(a)). You can use the App without ever uploading a photo after onboarding; you may withdraw consent at any time by deleting your photos or your account.',
        'To remember your language and settings: our legitimate interest in a usable product (Art. 6(1)(f)).',
      ],
    },
    {
      h: '4. Where your data lives and who processes it',
      p: [
        'Your data is stored on Amazon Web Services (AWS) in the United States (us-east-1 region): authentication by Amazon Cognito, data in Amazon DynamoDB, photos in Amazon S3. AWS acts as our processor under its GDPR Data Processing Addendum, and transfers rely on the EU-U.S. Data Privacy Framework and Standard Contractual Clauses.',
        'AI analysis runs on Amazon Bedrock (Anthropic Claude model) inside our AWS account. Photos sent for analysis are not used to train AI models.',
        'Exercise demonstration videos and optional music are embedded from YouTube. When they load, YouTube (Google) may set cookies and process your IP address under its own privacy policy. The App works without playing them.',
        'We do not sell your data. We do not share it with advertisers. Nobody but you (and the processors above, strictly to run the service) can access your photos or training history.',
      ],
    },
    {
      h: '5. How long we keep it',
      p: [
        'Everything is kept until you delete it. You can delete individual check-ins at any time, and you can delete your entire account (Progress -> Account -> Delete account), which permanently removes your authentication account, profile, training history, check-ins, and all photos. Deletion is immediate and irreversible; residual copies in encrypted backups expire within 35 days.',
      ],
    },
    {
      h: '6. Your rights',
      p: [
        'You can access and export all of your data at any time (Progress -> Account -> Export my data), correct it in the App, delete it (per item or the whole account), and withdraw the photo-analysis consent whenever you want.',
        `Under GDPR you additionally have the right to restrict or object to processing, the right to data portability, and the right to lodge a complaint with your local supervisory authority. To exercise any right you cannot reach in the App, email ${LEGAL_CONTACT}.`,
      ],
    },
    {
      h: '7. Children',
      p: [
        'The App is not directed at children. You must be at least 16 years old (or the digital-consent age of your country) to create an account.',
      ],
    },
    {
      h: '8. Security',
      p: [
        'All traffic is encrypted in transit (TLS); data and photos are encrypted at rest on AWS. Access is scoped per account: the backend enforces that each user can only ever read or write their own records.',
      ],
    },
    {
      h: '9. Changes',
      p: [
        'If this policy changes in a way that matters, the App will ask you to review and accept the new version before continuing.',
      ],
    },
  ],
};

export const termsOfUse: LegalDoc = {
  title: 'Terms of Use',
  updated: TERMS_VERSION,
  sections: [
    {
      h: '1. The service',
      p: [
        'Superileri Fit provides self-guided home-workout programs (timed interval circuits), general nutrition guidance, progress tracking, and optional AI-generated body-composition estimates. It is provided as-is, free of charge, for personal, non-commercial use.',
      ],
    },
    {
      h: '2. Not medical advice — read this carefully',
      p: [
        'The App provides general fitness and nutrition information for healthy adults. It is NOT medical advice, diagnosis, or treatment, and it is not a substitute for consultation with a physician, physiotherapist, or dietitian.',
        'Consult a doctor before starting this or any exercise program, especially if you have (or suspect) any medical condition, injury, cardiovascular issue, or if you are pregnant. Stop exercising immediately and seek medical help if you feel pain, dizziness, shortness of breath, or discomfort.',
      ],
    },
    {
      h: '3. Assumption of risk',
      p: [
        'Physical exercise carries inherent risks, including muscle and joint injury and, in rare cases, serious cardiovascular events. By using the App you confirm that you are voluntarily participating in these activities, that you know your own physical limits, and that you assume full responsibility for any injury, loss, or damage arising from your training. Exercise within your own ability; nothing in the App requires you to exceed it.',
      ],
    },
    {
      h: '4. AI-generated content',
      p: [
        'Body-composition estimates, progress comparisons, and similar outputs are generated by an AI model from your photos. They are approximate, can be wrong, and are provided for personal motivation only. Never make health decisions based on them.',
      ],
    },
    {
      h: '5. Your account',
      p: [
        'You are responsible for keeping your credentials safe and for everything done under your account. You must provide accurate information and be at least 16 years old. One account per person.',
      ],
    },
    {
      h: '6. Acceptable use',
      p: [
        'Do not attempt to access other users’ data, disrupt the service, reverse-engineer the backend, upload unlawful content, or use the App for anything other than personal fitness tracking. Training-partner features require the other person’s own consent inside their account.',
      ],
    },
    {
      h: '7. Third-party content',
      p: [
        'Exercise demonstration videos and music are embedded from YouTube and belong to their respective creators. Their availability is outside our control, and your use of them is subject to YouTube’s own terms.',
      ],
    },
    {
      h: '8. No warranty; limitation of liability',
      p: [
        'The App is provided "as is" and "as available", without warranties of any kind, express or implied, including fitness for a particular purpose and uninterrupted availability.',
        'To the maximum extent permitted by applicable law, the operator shall not be liable for any indirect, incidental, special, or consequential damages, nor for personal injury arising from your voluntary participation in exercise, except where such liability cannot be excluded by law (including liability for intent, gross negligence, or injury to life, body, or health where applicable law so provides). Nothing in these terms limits rights that consumer-protection law grants you mandatorily.',
      ],
    },
    {
      h: '9. Termination',
      p: [
        'You may stop using the App and delete your account at any time. We may suspend accounts that violate these terms. Sections 2, 3, 4, and 8 survive termination.',
      ],
    },
    {
      h: '10. Governing law',
      p: [
        'These terms are governed by the laws of the United Arab Emirates, without prejudice to any mandatory consumer protections of your own country of residence.',
      ],
    },
    {
      h: '11. Contact',
      p: [`Questions about these terms: ${LEGAL_CONTACT}.`],
    },
  ],
};
