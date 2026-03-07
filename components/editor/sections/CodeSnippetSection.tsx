'use client';

import * as React from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import {
  dracula,
  monokai,
  monokaiSublime,
  darcula,
  androidstudio,
  atomOneDark,
  githubGist,
  github,
  nord,
  tomorrowNightBlue,
  vs2015,
  gruvboxDark,
  xcode,
  vs,
  tomorrowNight,
  a11yDark,
  nnfxDark,
  stackoverflowDark,
  stackoverflowLight,
} from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { useImageStore } from '@/lib/store';
import { SectionWrapper } from './SectionWrapper';
import { cn } from '@/lib/utils';
import { domToCanvas } from 'modern-screenshot';
import { Loading03Icon } from 'hugeicons-react';

// ── Theme definitions ────────────────────────────────────────────────────────

interface ThemeOption {
  id: string;
  label: string;
  style: Record<string, React.CSSProperties>;
}

const CODE_THEMES: ThemeOption[] = [
  { id: 'dracula', label: 'Dracula', style: dracula },
  { id: 'monokai', label: 'Monokai', style: monokai },
  { id: 'okaidia', label: 'Okaidia', style: monokaiSublime },
  { id: 'darcula', label: 'Darcula', style: darcula },
  { id: 'androidstudio', label: 'Android Studio', style: androidstudio },
  { id: 'atomone', label: 'Atom One', style: atomOneDark },
  { id: 'githubDark', label: 'GitHub Dark', style: githubGist },
  { id: 'githubLight', label: 'GitHub Light', style: github },
  { id: 'a11yDark', label: 'A11y Dark', style: a11yDark },
  { id: 'nord', label: 'Nord', style: nord },
  { id: 'tomorrowNightBlue', label: 'Tomorrow Blue', style: tomorrowNightBlue },
  { id: 'vscodeDark', label: 'VS Code Dark', style: vs2015 },
  { id: 'gruvboxDark', label: 'Gruvbox Dark', style: gruvboxDark },
  { id: 'consoleDark', label: 'Console Dark', style: nnfxDark },
  { id: 'consoleLight', label: 'Console Light', style: vs },
  { id: 'xcodeDark', label: 'Xcode Dark', style: xcode },
  { id: 'xcodeLight', label: 'Xcode Light', style: xcode },
  { id: 'stackDark', label: 'Stack Dark', style: stackoverflowDark },
  { id: 'stackLight', label: 'Stack Light', style: stackoverflowLight },
  { id: 'tomorrowNight', label: 'Tomorrow Night', style: tomorrowNight },
];

const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'python', label: 'Python' },
  { id: 'html', label: 'HTML' },
  { id: 'css', label: 'CSS' },
  { id: 'java', label: 'Java' },
  { id: 'cpp', label: 'C++' },
  { id: 'csharp', label: 'C#' },
  { id: 'rust', label: 'Rust' },
  { id: 'go', label: 'Go' },
  { id: 'sql', label: 'SQL' },
  { id: 'json', label: 'JSON' },
  { id: 'xml', label: 'XML' },
  { id: 'markdown', label: 'Markdown' },
  { id: 'php', label: 'PHP' },
  { id: 'yaml', label: 'YAML' },
  { id: 'swift', label: 'Swift' },
  { id: 'kotlin', label: 'Kotlin' },
  { id: 'ruby', label: 'Ruby' },
  { id: 'bash', label: 'Bash' },
];

const FONTS = [
  { id: 'jetbrainsMono', label: 'JetBrains Mono', css: "'JetBrains Mono', monospace" },
  { id: 'firaCode', label: 'Fira Code', css: "'Fira Code', monospace" },
  { id: 'sourceCodePro', label: 'Source Code Pro', css: "'Source Code Pro', monospace" },
  { id: 'ibmPlexMono', label: 'IBM Plex Mono', css: "'IBM Plex Mono', monospace" },
  { id: 'spaceMono', label: 'Space Mono', css: "'Space Mono', monospace" },
  { id: 'robotoMono', label: 'Roboto Mono', css: "'Roboto Mono', monospace" },
  { id: 'ubuntuMono', label: 'Ubuntu Mono', css: "'Ubuntu Mono', monospace" },
  { id: 'inconsolata', label: 'Inconsolata', css: "'Inconsolata', monospace" },
  { id: 'anonymousPro', label: 'Anonymous Pro', css: "'Anonymous Pro', monospace" },
  { id: 'cousine', label: 'Cousine', css: "'Cousine', monospace" },
];

const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=JetBrains+Mono&family=Fira+Code&family=Source+Code+Pro&family=IBM+Plex+Mono&family=Space+Mono&family=Roboto+Mono&family=Ubuntu+Mono&family=Inconsolata&family=Anonymous+Pro&family=Cousine&display=swap';

const DEFAULT_CODE = `function greet(name) {
  return \`Hello, \${name}!\`
}

console.log(greet('World'))`;

// ── Component ────────────────────────────────────────────────────────────────

type Status = 'idle' | 'capturing';

export function CodeSnippetSection() {
  const { setUploadedImageUrl, setImageOpacity, setImageScale } = useImageStore();

  const [code, setCode] = React.useState(DEFAULT_CODE);
  const [language, setLanguage] = React.useState('javascript');
  const [themeId, setThemeId] = React.useState('dracula');
  const [fontId, setFontId] = React.useState('jetbrainsMono');
  const [fontSize, setFontSize] = React.useState(14);
  const [borderRadius, setBorderRadius] = React.useState(12);
  const [showLineNumbers, setShowLineNumbers] = React.useState(true);
  const [showTitleBar, setShowTitleBar] = React.useState(true);
  const [status, setStatus] = React.useState<Status>('idle');

  const captureRef = React.useRef<HTMLDivElement>(null);

  const currentTheme = CODE_THEMES.find((t) => t.id === themeId) ?? CODE_THEMES[0];
  const currentFont = FONTS.find((f) => f.id === fontId) ?? FONTS[0];
  const themeBg =
    (currentTheme.style.hljs?.background as string) || '#282a36';

  // Load Google Fonts
  React.useEffect(() => {
    if (document.querySelector('link[data-code-fonts]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = GOOGLE_FONTS_URL;
    link.setAttribute('data-code-fonts', 'true');
    document.head.appendChild(link);
  }, []);

  const handleAddToCanvas = React.useCallback(async () => {
    if (!captureRef.current || status === 'capturing') return;
    setStatus('capturing');

    try {
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
        setUploadedImageUrl(url, 'code-snippet.png');
        // Reset opacity and scale so snippet renders at full visibility
        setImageOpacity(1);
        setImageScale(100);
        setStatus('idle');
      } else {
        setStatus('idle');
      }
    } catch (e) {
      console.error('Code capture failed:', e);
      setStatus('idle');
    }
  }, [setUploadedImageUrl, setImageOpacity, setImageScale, status]);

  const selectClass =
    'h-7 px-2 rounded-md border border-border bg-muted text-[11px] text-foreground outline-none';

  return (
    <SectionWrapper title="Code Snippet" defaultOpen={false}>
      <div className="space-y-2.5">
        {/* Row 1: Theme + Language */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-muted-foreground mb-0.5 block">
              Theme
            </label>
            <select
              value={themeId}
              onChange={(e) => setThemeId(e.target.value)}
              className={cn(selectClass, 'w-full')}
            >
              {CODE_THEMES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground mb-0.5 block">
              Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className={cn(selectClass, 'w-full')}
            >
              {LANGUAGES.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Font + Size + Radius */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-muted-foreground mb-0.5 block">
              Font
            </label>
            <select
              value={fontId}
              onChange={(e) => setFontId(e.target.value)}
              className={cn(selectClass, 'w-full')}
            >
              {FONTS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="text-[10px] text-muted-foreground mb-0.5 block">
                Size
              </label>
              <input
                type="number"
                value={fontSize}
                onChange={(e) =>
                  setFontSize(Math.max(10, Math.min(28, Number(e.target.value))))
                }
                min={10}
                max={28}
                className={cn(selectClass, 'w-full tabular-nums')}
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground mb-0.5 block">
                Round
              </label>
              <input
                type="number"
                value={borderRadius}
                onChange={(e) =>
                  setBorderRadius(
                    Math.max(0, Math.min(32, Number(e.target.value)))
                  )
                }
                min={0}
                max={32}
                className={cn(selectClass, 'w-full tabular-nums')}
              />
            </div>
          </div>
        </div>

        {/* Row 3: Toggles */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showLineNumbers}
              onChange={(e) => setShowLineNumbers(e.target.checked)}
              className="accent-primary w-3 h-3"
            />
            <span className="text-[10px] text-muted-foreground">
              Line numbers
            </span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showTitleBar}
              onChange={(e) => setShowTitleBar(e.target.checked)}
              className="accent-primary w-3 h-3"
            />
            <span className="text-[10px] text-muted-foreground">
              Window bar
            </span>
          </label>
        </div>

        {/* Code textarea */}
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          rows={6}
          spellCheck={false}
          placeholder="Paste your code here..."
          className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-xs text-foreground font-mono placeholder:text-muted-foreground resize-y focus:outline-none focus:ring-1 focus:ring-primary/40 leading-relaxed"
        />

        {/* Live preview label */}
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground block">
          Preview
        </span>

        {/* Live inline preview — this IS the capture target */}
        <div
          className="rounded-lg overflow-hidden border border-border/40"
        >
          <div
            ref={captureRef}
            style={{
              borderRadius: `${borderRadius}px`,
              overflow: 'hidden',
            }}
          >
            {/* Optional macOS title bar */}
            {showTitleBar && (
              <div
                style={{
                  backgroundColor: themeBg,
                  padding: '10px 14px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: '#ff5f57',
                  }}
                />
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: '#febc2e',
                  }}
                />
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: '#28c840',
                  }}
                />
              </div>
            )}

            <SyntaxHighlighter
              language={language}
              style={currentTheme.style}
              showLineNumbers={showLineNumbers}
              wrapLines
              wrapLongLines
              customStyle={{
                margin: 0,
                padding: showTitleBar ? '12px 16px 16px' : '16px',
                fontSize: `${fontSize}px`,
                fontFamily: currentFont.css,
                lineHeight: '1.6',
                borderRadius: 0,
              }}
              lineNumberStyle={{
                minWidth: '2em',
                paddingRight: '0.8em',
                opacity: 0.4,
                fontFamily: currentFont.css,
              }}
            >
              {code || ' '}
            </SyntaxHighlighter>
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={handleAddToCanvas}
          disabled={status === 'capturing' || !code.trim()}
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
    </SectionWrapper>
  );
}
