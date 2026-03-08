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
  dark: boolean;
}

const CODE_THEMES: ThemeOption[] = [
  { id: 'dracula', label: 'Dracula', style: dracula, dark: true },
  { id: 'monokai', label: 'Monokai', style: monokai, dark: true },
  { id: 'okaidia', label: 'Okaidia', style: monokaiSublime, dark: true },
  { id: 'darcula', label: 'Darcula', style: darcula, dark: true },
  { id: 'androidstudio', label: 'Android Studio', style: androidstudio, dark: true },
  { id: 'atomone', label: 'Atom One', style: atomOneDark, dark: true },
  { id: 'githubDark', label: 'GitHub Dark', style: githubGist, dark: true },
  { id: 'githubLight', label: 'GitHub Light', style: github, dark: false },
  { id: 'a11yDark', label: 'A11y Dark', style: a11yDark, dark: true },
  { id: 'nord', label: 'Nord', style: nord, dark: true },
  { id: 'tomorrowNightBlue', label: 'Tomorrow Blue', style: tomorrowNightBlue, dark: true },
  { id: 'vscodeDark', label: 'VS Code Dark', style: vs2015, dark: true },
  { id: 'gruvboxDark', label: 'Gruvbox Dark', style: gruvboxDark, dark: true },
  { id: 'consoleDark', label: 'Console Dark', style: nnfxDark, dark: true },
  { id: 'consoleLight', label: 'Console Light', style: vs, dark: false },
  { id: 'xcodeDark', label: 'Xcode Dark', style: xcode, dark: true },
  { id: 'xcodeLight', label: 'Xcode Light', style: xcode, dark: false },
  { id: 'stackDark', label: 'Stack Dark', style: stackoverflowDark, dark: true },
  { id: 'stackLight', label: 'Stack Light', style: stackoverflowLight, dark: false },
  { id: 'tomorrowNight', label: 'Tomorrow Night', style: tomorrowNight, dark: true },
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

// ── Toggle Switch ─────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-1.5 group"
    >
      <div
        className={cn(
          'relative w-7 h-4 rounded-full transition-colors duration-200',
          checked ? 'bg-primary' : 'bg-border'
        )}
      >
        <div
          className={cn(
            'absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-200',
            checked ? 'translate-x-3.5' : 'translate-x-0.5'
          )}
        />
      </div>
      <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">
        {label}
      </span>
    </button>
  );
}

// ── Styled Select ─────────────────────────────────────────────────────────────

function StyledSelect({
  value,
  onChange,
  options,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string }[];
  className?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none w-full h-7 pl-2 pr-6 rounded-md border border-border/50 bg-muted/50 text-[11px] text-foreground outline-none focus:border-primary/40 transition-colors cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
      <svg
        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none"
        width="10"
        height="10"
        viewBox="0 0 10 10"
      >
        <path d="M2.5 4L5 6.5L7.5 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

type Status = 'idle' | 'capturing';

export function CodeSnippetSection() {
  const { setUploadedImageUrl, setImageOpacity, setImageScale, setBorderRadius: setCanvasBorderRadius } = useImageStore();

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
        backgroundColor: themeBg,
        style: { transform: 'none', borderRadius: '0px' },
      });

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png')
      );

      if (blob) {
        const url = URL.createObjectURL(blob);
        setUploadedImageUrl(url, 'code-snippet.png');
        setImageOpacity(1);
        setImageScale(100);
        setCanvasBorderRadius(24);
        setStatus('idle');
      } else {
        setStatus('idle');
      }
    } catch (e) {
      console.error('Code capture failed:', e);
      setStatus('idle');
    }
  }, [setUploadedImageUrl, setImageOpacity, setImageScale, setCanvasBorderRadius, status, themeBg]);

  return (
    <SectionWrapper title="Code Snippet" defaultOpen={false}>
      <div className="space-y-3">
        {/* Row 1: Theme + Language */}
        <div className="grid grid-cols-2 gap-1.5">
          <StyledSelect
            value={themeId}
            onChange={setThemeId}
            options={CODE_THEMES}
          />
          <StyledSelect
            value={language}
            onChange={setLanguage}
            options={LANGUAGES}
          />
        </div>

        {/* Row 2: Font */}
        <StyledSelect
          value={fontId}
          onChange={setFontId}
          options={FONTS}
        />

        {/* Row 3: Size + Round */}
        <div className="grid grid-cols-2 gap-1.5">
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground/60 font-medium">Size</span>
            <input
              type="number"
              value={fontSize}
              onChange={(e) =>
                setFontSize(Math.max(10, Math.min(28, Number(e.target.value))))
              }
              min={10}
              max={28}
              className="w-full h-7 pl-9 pr-2 rounded-md border border-border/50 bg-muted/50 text-[11px] text-foreground tabular-nums outline-none focus:border-primary/40 transition-colors text-right"
            />
          </div>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground/60 font-medium">Round</span>
            <input
              type="number"
              value={borderRadius}
              onChange={(e) =>
                setBorderRadius(Math.max(0, Math.min(32, Number(e.target.value))))
              }
              min={0}
              max={32}
              className="w-full h-7 pl-12 pr-2 rounded-md border border-border/50 bg-muted/50 text-[11px] text-foreground tabular-nums outline-none focus:border-primary/40 transition-colors text-right"
            />
          </div>
        </div>

        {/* Row 4: Toggles */}
        <div className="flex items-center gap-4">
          <Toggle checked={showLineNumbers} onChange={setShowLineNumbers} label="Lines" />
          <Toggle checked={showTitleBar} onChange={setShowTitleBar} label="Window" />
        </div>

        {/* Code textarea */}
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          rows={5}
          spellCheck={false}
          placeholder="Paste your code here..."
          className="w-full px-3 py-2.5 rounded-lg border border-border/50 bg-muted/50 text-[11px] text-foreground font-mono placeholder:text-muted-foreground/50 resize-y focus:outline-none focus:border-primary/40 leading-relaxed transition-colors"
        />

        {/* Live inline preview */}
        <div className="rounded-lg overflow-hidden border border-border/30">
          <div
            ref={captureRef}
            style={{
              borderRadius: `${borderRadius}px`,
              overflow: 'hidden',
              backgroundColor: themeBg,
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
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ff5f57' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#febc2e' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#28c840' }} />
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
          className="w-full h-8 rounded-lg text-[11px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
        >
          {status === 'capturing' ? (
            <>
              <Loading03Icon size={12} className="animate-spin" />
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
