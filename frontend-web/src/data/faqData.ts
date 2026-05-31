// ─── FAQ Data ─────────────────────────────────────────────────────────────────
// Single source of truth for all FAQ content.
// Used by both App.tsx (accordion on homepage) and FAQ.tsx (/faq page).
// Update questions here and both pages update automatically.

export interface FaqQuestion {
  q: string
  a: string
}

export interface FaqCategory {
  category: string
  questions: FaqQuestion[]
}

// ── Homepage FAQ items (short list — shown in accordion on landing page) ──────
export const FAQ_ITEMS_SHORT: FaqQuestion[] = [
  {
    q: 'Is ClearTok free?',
    a: 'Yes, completely free. No account, no hidden fees, and no download limits. ClearTok is supported by ads.',
  },
  {
    q: 'How do I download a TikTok video without a watermark?',
    a: 'Copy the video link from TikTok, paste it into the box above, and click Download Video. The watermark-free version will save to your Downloads folder in seconds.',
  },
  {
    q: 'Does ClearTok store my videos?',
    a: 'No. Videos are downloaded directly to your device and are never stored on our servers. We don\'t keep copies of any content.',
  },
  {
    q: 'Why is my download failing?',
    a: 'The most common reasons are: the video is set to private, the TikTok account is private, or the URL is invalid. Make sure the video is public and copy the full link from TikTok.',
  },
  {
    q: 'What video quality does ClearTok download?',
    a: 'ClearTok downloads the highest available quality — typically 1080p HD. The resolution depends on the original video uploaded by the creator.',
  },
  {
    q: 'Is it legal to download TikTok videos?',
    a: 'ClearTok is intended for downloading your own TikTok content only. Downloading and reposting other creators\' content without permission may violate copyright law and TikTok\'s Terms of Service.',
  },
  {
    q: 'Does this work on iPhone and Android?',
    a: 'Yes. ClearTok works on any device with a browser — iPhone, Android, Mac, and Windows. No app download required.',
  },
]

// ── Full FAQ items (categorized — shown on /faq page) ────────────────────────
export const FAQ_ITEMS_FULL: FaqCategory[] = [
  {
    category: 'Getting started',
    questions: [
      {
        q: 'Is ClearTok free?',
        a: 'Yes, completely free. No account, no hidden fees, and no download limits. ClearTok is supported by ads.',
      },
      {
        q: 'How do I download a TikTok video without a watermark?',
        a: 'Copy the video link from TikTok, paste it into the input box on the homepage, and click Download Video. The watermark-free version will save to your Downloads folder in seconds.',
      },
      {
        q: 'Do I need to create an account?',
        a: 'No account needed. Paste a link, click download, done. No sign-up, no email, no registration.',
      },
    ],
  },
  {
    category: 'Downloads',
    questions: [
      {
        q: 'What video quality does ClearTok download?',
        a: 'ClearTok downloads the highest available quality — typically 1080p HD. The resolution depends on the original video uploaded by the creator.',
      },
      {
        q: 'Why is my download failing?',
        a: 'The most common reasons are: the video is set to private, the TikTok account is private, or the URL is invalid. Make sure the video is public and copy the full link directly from TikTok.',
      },
      {
        q: 'How long does a download take?',
        a: 'Most downloads complete in 15–40 seconds depending on video length and your internet connection.',
      },
      {
        q: 'Where does the video save?',
        a: 'The video saves to your default Downloads folder. On Mac it\'s ~/Downloads. On Windows it\'s C:\\Users\\YourName\\Downloads.',
      },
    ],
  },
  {
    category: 'Privacy & legal',
    questions: [
      {
        q: 'Does ClearTok store my videos?',
        a: 'No. Videos are downloaded directly to your device. They are never stored on our servers and we don\'t keep copies of any content.',
      },
      {
        q: 'Is it legal to download TikTok videos?',
        a: 'ClearTok is intended for downloading your own TikTok content only. Downloading and reposting other creators\' content without permission may violate copyright law and TikTok\'s Terms of Service. Always respect creator rights.',
      },
      {
        q: 'Does ClearTok track me?',
        a: 'We use Google Analytics to track anonymous usage data (page views, general location, device type). We don\'t track individual downloads or store personal data. See our Privacy Policy for full details.',
      },
    ],
  },
  {
    category: 'Compatibility',
    questions: [
      {
        q: 'Does this work on iPhone and Android?',
        a: 'Yes. ClearTok works on any device with a browser — iPhone, Android, Mac, and Windows. No app download required.',
      },
      {
        q: 'Which browsers are supported?',
        a: 'ClearTok works on all modern browsers — Chrome, Safari, Firefox, and Edge. We recommend Chrome for the best experience.',
      },
      {
        q: 'Can I download TikTok slideshows or photo carousels?',
        a: 'Currently ClearTok supports video downloads only. Slideshow and photo carousel support is on our roadmap.',
      },
    ],
  },
]