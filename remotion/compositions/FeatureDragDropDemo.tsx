import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring, Img, staticFile } from 'remotion';

const ACCENT = '#34d399';
const ACCENT_RGB = '52,211,153';

/**
 * Feature demo: "Lightning Fast Editing"
 * Replicates the actual Stage editor UI showing the full workflow:
 * Upload modal → image drops in → background changes → styling (round, shadow, frame) applied
 * 800x500 at 60fps, 360 frames (6s loop)
 */
export const FeatureDragDropDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Timeline:
  // 0-30: Editor fades in
  // 30-90: Upload modal visible
  // 90-120: Modal fades, image appears
  // 120-170: Background gradient changes
  // 170-210: Round + scale sliders animate, frame applies
  // 210-260: Shadow slider animates
  // 260-310: Hold final state
  // 310-360: Fade out

  const editorOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(frame, [330, 360], [1, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  // Modal
  const modalScale = spring({ frame: frame - 30, fps, config: { damping: 20, stiffness: 100 } });
  const showImage = frame >= 100;
  const modalFadeOut = interpolate(frame, [90, 110], [1, 0], { extrapolateRight: 'clamp' });

  // Image entrance
  const imageScale = spring({ frame: frame - 100, fps, config: { damping: 15, stiffness: 80 } });
  const imageOpacity = interpolate(frame, [100, 120], [0, 1], { extrapolateRight: 'clamp' });

  // Background transition
  const bgPhase = Math.floor(interpolate(frame, [130, 180], [0, 2.99], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }));
  const backgrounds = [
    'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    'linear-gradient(135deg, #f97316 0%, #f43f5e 50%, #d946ef 100%)',
    'linear-gradient(135deg, #a855f7 0%, #6366f1 50%, #06b6d4 100%)',
  ];

  // Styling animations
  const cornerRadius = interpolate(frame, [170, 200], [4, 16], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const imgDisplayScale = interpolate(frame, [195, 220], [1, 0.88], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const showFrame = frame >= 185;
  const frameOpacity = interpolate(frame, [185, 200], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  // Shadow
  const shadowBlur = interpolate(frame, [210, 250], [0, 15], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const shadowY = interpolate(frame, [210, 250], [0, 8], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  // Slider values for right panel
  const roundValue = interpolate(frame, [170, 200], [0, 16], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const scaleValue = interpolate(frame, [195, 220], [1.0, 0.88], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const blurValue = interpolate(frame, [210, 250], [0, 15], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const yValue = interpolate(frame, [210, 250], [0, 8], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const spreadValue = interpolate(frame, [210, 250], [0, 3], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const opacityValue = interpolate(frame, [210, 250], [0, 50], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  // Active frame index (0=none initially, 1=macOS dark when applied)
  const activeFrameIdx = showFrame ? 3 : 0;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#1e1e1e',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        opacity: editorOpacity * fadeOut,
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          height: 40,
          backgroundColor: '#1e1e1e',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <Img src={staticFile('logo.svg')} style={{ width: 28, height: 28, objectFit: 'contain' }} />

        {/* Center buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <HeaderBtn label="Save" icon="↓" />
          <HeaderBtn label="Copy" icon="⎘" />
          <HeaderBtn label="16:9" active />
          <HeaderBtn label="Animate" icon="◇" />
        </div>

        {/* Right icons */}
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ width: 20, height: 20, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.04)' }} />
          <div style={{ width: 20, height: 20, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.04)' }} />
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Canvas area */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            backgroundColor: '#141414',
          }}
        >
          {/* Canvas */}
          <div
            style={{
              width: '100%',
              maxWidth: 400,
              aspectRatio: '16/9',
              borderRadius: 10,
              background: showImage ? backgrounds[bgPhase] : backgrounds[0],
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Upload modal */}
            {!showImage && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: modalFadeOut,
                }}
              >
                <div
                  style={{
                    backgroundColor: 'rgba(38,38,38,0.95)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: 12,
                    padding: '20px 28px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    transform: `scale(${Math.min(modalScale, 1)})`,
                    minWidth: 180,
                  }}
                >
                  {/* Image icon */}
                  <div
                    style={{
                      marginBottom: 12,
                      padding: 12,
                      borderRadius: 10,
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="3" width="18" height="18" rx="2" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                      <circle cx="8.5" cy="8.5" r="1.5" fill="rgba(255,255,255,0.3)" />
                      <path d="M21 15l-5-5L5 21" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 3 }}>Add Your Image</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)' }}>Drag & drop, click to browse, or paste</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 10 }}>
                    <div style={{ padding: '2px 6px', backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 4, fontSize: 8, color: 'rgba(255,255,255,0.6)' }}>⌘ V</div>
                    <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)' }}>to Paste</span>
                  </div>
                </div>
              </div>
            )}

            {/* Screenshot image */}
            {showImage && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: imageOpacity,
                }}
              >
                <div
                  style={{
                    width: '60%',
                    aspectRatio: '16/10',
                    backgroundColor: '#1e1e1e',
                    borderRadius: cornerRadius,
                    boxShadow: `0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${opacityValue / 100})`,
                    transform: `scale(${Math.min(imageScale, 1) * imgDisplayScale})`,
                    overflow: 'hidden',
                  }}
                >
                  {/* macOS title bar */}
                  {showFrame && (
                    <div
                      style={{
                        height: 22,
                        backgroundColor: '#2a2a2a',
                        display: 'flex',
                        alignItems: 'center',
                        paddingLeft: 8,
                        gap: 4,
                        opacity: frameOpacity,
                      }}
                    >
                      <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#ff5f57' }} />
                      <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#febc2e' }} />
                      <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#28c840' }} />
                    </div>
                  )}
                  {/* Fake page content */}
                  <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ height: 5, width: '50%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2 }} />
                    <div style={{ height: 5, width: '70%', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2 }} />
                    <div style={{ height: 5, width: '40%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 2 }} />
                    <div style={{ height: 16, width: '100%', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 4, marginTop: 2 }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div
          style={{
            width: 220,
            backgroundColor: '#1e1e1e',
            borderLeft: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          {/* Templates bar */}
          <div
            style={{
              padding: '8px 12px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <div style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: `rgba(${ACCENT_RGB},0.2)` }} />
            <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Templates</span>
            <div style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>›</div>
          </div>

          {/* Tab bar */}
          <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', gap: 0, borderRadius: 8, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.03)' }}>
              {['Settings', 'Edit', 'BG', '3D', 'Animate'].map((tab, i) => (
                <div
                  key={tab}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 3,
                    padding: '8px 2px 6px',
                    backgroundColor: i === 1 ? 'rgba(255,255,255,0.06)' : 'transparent',
                    borderRadius: i === 1 ? 6 : 0,
                  }}
                >
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 8,
                      color: i === 1 ? ACCENT : 'rgba(255,255,255,0.35)',
                    }}
                  >
                    {['⚙', '≡', '◐', '◇', '◎'][i]}
                  </div>
                  <span style={{ fontSize: 7, fontWeight: 500, color: i === 1 ? ACCENT : 'rgba(255,255,255,0.35)' }}>{tab}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Edit panel content */}
          <div style={{ flex: 1, padding: '10px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* EDIT section */}
            <div>
              <SectionHeader label="EDIT" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <SliderRow label="Round" value={Math.round(roundValue)} max={20} />
                <SliderRow label="Scale" value={scaleValue.toFixed(1)} max={1} percent={scaleValue} />
              </div>
            </div>

            {/* FRAMES section */}
            <div>
              <SectionHeader label="FRAMES" />
              <div style={{ display: 'flex', gap: 4 }}>
                {['None', 'Arc Light', 'Arc Dark', 'macOS'].map((f, i) => (
                  <div
                    key={f}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 3,
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        aspectRatio: '1',
                        borderRadius: 6,
                        backgroundColor: i === activeFrameIdx ? `rgba(${ACCENT_RGB},0.08)` : 'rgba(255,255,255,0.03)',
                        border: i === activeFrameIdx ? `1.5px solid rgba(${ACCENT_RGB},0.4)` : '1px solid rgba(255,255,255,0.06)',
                      }}
                    />
                    <span style={{ fontSize: 6, color: i === activeFrameIdx ? ACCENT : 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* SHADOW section */}
            <div>
              <SectionHeader label="SHADOW" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <SliderRow label="Blur" value={Math.round(blurValue)} max={30} percent={blurValue / 30} />
                <SliderRow label="X" value={0} max={20} percent={0} />
                <SliderRow label="Y" value={Math.round(yValue)} max={20} percent={yValue / 20} />
                <SliderRow label="Spread" value={Math.round(spreadValue)} max={10} percent={spreadValue / 10} />
                <SliderRow label="Opacity" value={`${Math.round(opacityValue)}%`} max={100} percent={opacityValue / 100} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const HeaderBtn: React.FC<{ label: string; icon?: string; active?: boolean }> = ({ label, icon, active }) => (
  <div
    style={{
      height: 28,
      padding: '0 10px',
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      fontSize: 10,
      fontWeight: 500,
      backgroundColor: active ? 'rgba(255,255,255,0.08)' : 'transparent',
      border: active ? '1px solid rgba(255,255,255,0.15)' : '1px solid transparent',
      borderRadius: 6,
      color: active ? '#fff' : 'rgba(255,255,255,0.6)',
    }}
  >
    {icon && <span style={{ fontSize: 10 }}>{icon}</span>}
    {label}
  </div>
);

const SectionHeader: React.FC<{ label: string }> = ({ label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
    <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, fontWeight: 600 }}>▾ {label}</span>
  </div>
);

const SliderRow: React.FC<{ label: string; value: number | string; max: number; percent?: number }> = ({ label, value, max, percent }) => {
  const pct = percent !== undefined ? percent : (typeof value === 'number' ? value / max : 0);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', width: 36, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.7)', width: 22, textAlign: 'right', fontWeight: 600, flexShrink: 0 }}>{value}</span>
      <div style={{ flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(pct * 100, 100)}%`, height: '100%', backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', width: 18, textAlign: 'right', flexShrink: 0 }}>{value}</span>
    </div>
  );
};
