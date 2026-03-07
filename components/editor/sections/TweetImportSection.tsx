'use client';

import * as React from 'react';
import { useImageStore } from '@/lib/store';
import { SectionWrapper } from './SectionWrapper';
import { cn } from '@/lib/utils';
import { domToCanvas } from 'modern-screenshot';
import { Loading03Icon } from 'hugeicons-react';

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseTweetId(input: string): string | null {
  const trimmed = input.trim();
  if (/^\d+$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/);
  return match?.[1] ?? null;
}

function proxyUrl(url: string): string {
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

// ── Tweet data types ─────────────────────────────────────────────────────────

interface TweetUser {
  name: string;
  screen_name: string;
  profile_image_url_https: string;
  verified: boolean;
  is_blue_verified: boolean;
}

interface TweetPhoto {
  url: string;
  width: number;
  height: number;
}

interface TweetMediaDetail {
  media_url_https: string;
  type: string;
}

interface TweetEntity {
  urls?: { url: string; display_url: string; expanded_url: string }[];
  hashtags?: { text: string }[];
  user_mentions?: { screen_name: string }[];
}

interface TweetData {
  text: string;
  user: TweetUser;
  created_at: string;
  favorite_count: number;
  conversation_count?: number;
  photos?: TweetPhoto[];
  mediaDetails?: TweetMediaDetail[];
  entities?: TweetEntity;
  quoted_tweet?: TweetData;
}

function processText(tweet: TweetData): string {
  let text = tweet.text;
  if (tweet.entities?.urls) {
    for (const url of tweet.entities.urls) {
      text = text.replace(url.url, url.display_url);
    }
  }
  text = text.replace(/\s*https:\/\/t\.co\/\w+\s*$/, '');
  return text.trim();
}

// ── SVG Icons ────────────────────────────────────────────────────────────────

function XLogo({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill={color}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function VerifiedBadge() {
  return (
    <svg viewBox="0 0 22 22" width="16" height="16" style={{ flexShrink: 0 }}>
      <path
        fill="#1d9bf0"
        d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.69-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.636.433 1.221.878 1.69.47.446 1.055.752 1.69.883.635.13 1.294.083 1.902-.143.272.587.702 1.087 1.24 1.443s1.167.551 1.813.568c.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.222 1.26.27 1.894.141.634-.131 1.219-.437 1.69-.882.445-.47.749-1.055.878-1.691.13-.634.075-1.293-.148-1.9.586-.272 1.084-.702 1.438-1.241.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
      />
    </svg>
  );
}

function HeartIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill={color}>
      <path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z" />
    </svg>
  );
}

function ReplyIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill={color}>
      <path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z" />
    </svg>
  );
}

// ── Tweet Card ───────────────────────────────────────────────────────────────

function TweetCard({ tweet, theme }: { tweet: TweetData; theme: 'light' | 'dark' }) {
  const isDark = theme === 'dark';

  const colors = isDark
    ? { bg: '#000000', text: '#e7e9ea', secondary: '#71767b', border: '#2f3336' }
    : { bg: '#ffffff', text: '#0f1419', secondary: '#536471', border: '#cfd9de' };

  const avatarUrl = proxyUrl(
    tweet.user.profile_image_url_https.replace('_normal', '_200x200')
  );
  const displayText = processText(tweet);
  const date = formatDate(tweet.created_at);

  const photos: string[] = [];
  if (tweet.photos) {
    for (const p of tweet.photos) photos.push(p.url);
  } else if (tweet.mediaDetails) {
    for (const m of tweet.mediaDetails) {
      if (m.type === 'photo') photos.push(m.media_url_https);
    }
  }

  return (
    <div
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        padding: '16px',
        borderRadius: '16px',
        border: `1px solid ${colors.border}`,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <img
          src={avatarUrl}
          alt=""
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            flexShrink: 0,
            objectFit: 'cover',
          }}
          crossOrigin="anonymous"
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span
              style={{
                fontWeight: 700,
                fontSize: '14px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {tweet.user.name}
            </span>
            {(tweet.user.is_blue_verified || tweet.user.verified) && <VerifiedBadge />}
          </div>
          <div style={{ color: colors.secondary, fontSize: '13px' }}>
            @{tweet.user.screen_name}
          </div>
        </div>
        <div style={{ flexShrink: 0, marginTop: '2px' }}>
          <XLogo color={colors.text} />
        </div>
      </div>

      {/* Text */}
      <div
        style={{
          fontSize: '15px',
          lineHeight: '22px',
          marginTop: '10px',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
        }}
      >
        {displayText}
      </div>

      {/* Media */}
      {photos.length > 0 && (
        <div
          style={{
            marginTop: '10px',
            borderRadius: '12px',
            overflow: 'hidden',
            border: `1px solid ${colors.border}`,
            display: 'grid',
            gridTemplateColumns: photos.length > 1 ? '1fr 1fr' : '1fr',
            gap: '2px',
          }}
        >
          {photos.slice(0, 4).map((url, i) => (
            <img
              key={i}
              src={proxyUrl(url)}
              alt=""
              style={{
                width: '100%',
                height: photos.length === 1 ? 'auto' : '160px',
                maxHeight: photos.length === 1 ? '260px' : undefined,
                objectFit: 'cover',
                display: 'block',
              }}
              crossOrigin="anonymous"
            />
          ))}
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          marginTop: '10px',
          paddingTop: '10px',
          borderTop: `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          color: colors.secondary,
          fontSize: '12px',
        }}
      >
        <span>{date}</span>
        {(tweet.conversation_count ?? 0) > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ReplyIcon color={colors.secondary} />
            {formatNumber(tweet.conversation_count!)}
          </span>
        )}
        {tweet.favorite_count > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <HeartIcon color={colors.secondary} />
            {formatNumber(tweet.favorite_count)}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

type Status = 'idle' | 'loading' | 'loaded' | 'capturing';

export function TweetImportSection() {
  const { setUploadedImageUrl, setImageOpacity, setImageScale } = useImageStore();

  const [urlInput, setUrlInput] = React.useState('');
  const [tweetData, setTweetData] = React.useState<TweetData | null>(null);
  const [tweetTheme, setTweetTheme] = React.useState<'light' | 'dark'>('dark');
  const [status, setStatus] = React.useState<Status>('idle');
  const [error, setError] = React.useState<string | null>(null);

  const captureRef = React.useRef<HTMLDivElement>(null);

  // ── Fetch tweet ──
  const fetchTweet = React.useCallback(
    async (input: string) => {
      const id = parseTweetId(input);
      if (!id) {
        setError('Enter a valid tweet URL or ID');
        return;
      }

      setStatus('loading');
      setError(null);
      setTweetData(null);

      try {
        const res = await fetch(`/api/tweet/${id}`);
        const json = await res.json();
        if (!res.ok || !json.data) {
          setError(json.error || 'Tweet not found');
          setStatus('idle');
        } else {
          setTweetData(json.data as TweetData);
          setStatus('loaded');
        }
      } catch {
        setError('Failed to fetch tweet');
        setStatus('idle');
      }
    },
    []
  );

  // ── Auto-fetch on paste ──
  const handlePaste = React.useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      const pasted = e.clipboardData.getData('text');
      if (parseTweetId(pasted)) {
        // Let React update the input value first, then fetch
        setTimeout(() => fetchTweet(pasted), 0);
      }
    },
    [fetchTweet]
  );

  // ── Add to canvas ──
  const handleAddToCanvas = React.useCallback(async () => {
    if (!captureRef.current) return;
    setStatus('capturing');

    try {
      // Wait for all images to be loaded
      const images = captureRef.current.querySelectorAll('img');
      await Promise.all(
        Array.from(images).map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete) return resolve();
              img.onload = () => resolve();
              img.onerror = () => resolve();
            })
        )
      );

      const canvas = await domToCanvas(captureRef.current, {
        scale: 3,
        backgroundColor: null,
        style: { transform: 'none' },
      });

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png')
      );

      if (blob) {
        const url = URL.createObjectURL(blob);
        setUploadedImageUrl(url, 'tweet-screenshot.png');
        // Reset opacity and scale so the tweet renders at full visibility
        setImageOpacity(1);
        setImageScale(100);
        // Reset form immediately
        setTweetData(null);
        setUrlInput('');
        setStatus('idle');
      }
    } catch (e) {
      console.error('Tweet capture failed:', e);
      setError('Failed to capture tweet');
      setStatus('loaded');
    }
  }, [setUploadedImageUrl, setImageOpacity, setImageScale]);

  return (
    <SectionWrapper title="Import Tweet" defaultOpen={false}>
      <div className="space-y-2.5">
        {/* URL input */}
        <div className="flex gap-1.5">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => {
              setUrlInput(e.target.value);
              if (error) setError(null);
            }}
            onPaste={handlePaste}
            onKeyDown={(e) => {
              if (e.key === 'Enter') fetchTweet(urlInput);
            }}
            placeholder="Paste tweet URL or ID..."
            className="flex-1 h-8 px-2.5 rounded-lg border border-border bg-muted text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
          <button
            onClick={() => fetchTweet(urlInput)}
            disabled={status === 'loading' || !urlInput.trim()}
            className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {status === 'loading' ? (
              <Loading03Icon size={14} className="animate-spin" />
            ) : (
              'Fetch'
            )}
          </button>
        </div>

        {error && <p className="text-[11px] text-destructive">{error}</p>}

        {/* Loading skeleton */}
        {status === 'loading' && (
          <div className="rounded-xl border border-border/50 bg-muted/50 p-4 animate-pulse">
            <div className="flex gap-3 items-center">
              <div className="w-10 h-10 rounded-full bg-border/50" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 rounded bg-border/50" />
                <div className="h-2.5 w-16 rounded bg-border/50" />
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              <div className="h-2.5 w-full rounded bg-border/50" />
              <div className="h-2.5 w-3/4 rounded bg-border/50" />
            </div>
          </div>
        )}

        {/* Tweet loaded */}
        {tweetData && status !== 'loading' && (
          <div className="space-y-2">
            {/* Theme toggle */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Preview
              </span>
              <div className="flex gap-0.5 p-0.5 rounded-md bg-muted border border-border/30">
                {(['light', 'dark'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTweetTheme(t)}
                    className={cn(
                      'px-2 py-0.5 rounded text-[10px] font-medium transition-all',
                      tweetTheme === t
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Capture area */}
            <div
              ref={captureRef}
              className="rounded-xl overflow-hidden"
            >
              <TweetCard tweet={tweetData} theme={tweetTheme} />
            </div>

            {/* Action button */}
            <button
              onClick={handleAddToCanvas}
              disabled={status === 'capturing'}
              className="w-full h-9 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
            >
              {status === 'capturing' ? (
                <>
                  <Loading03Icon size={14} className="animate-spin" />
                  Adding...
                </>
              ) : (
                'Add to Canvas'
              )}
            </button>
          </div>
        )}

        {/* Hint when idle */}
        {status === 'idle' && !tweetData && !error && (
          <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
            Paste any X/Twitter post URL to capture it as a screenshot with your chosen theme.
          </p>
        )}
      </div>
    </SectionWrapper>
  );
}
