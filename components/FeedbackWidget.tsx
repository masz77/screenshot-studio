'use client'

import Script from 'next/script'

export function FeedbackWidget() {
  return (
    <>
      <Script src="https://cdn.palmframe.com/embed.js" strategy="lazyOnload" />
      <palmframe-widget project="qNssccWO4DzG" />
    </>
  )
}
