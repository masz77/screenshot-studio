import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring, Img, staticFile } from 'remotion';

const ACCENT = '#34d399';
const ACCENT_RGB = '52,211,153';

/**
 * Feature demo: "Animate & Export"
 * Replicates the actual Stage editor in animate mode:
 * - Header with Animate active, sub-bar with Export Video
 * - Canvas with animated screenshot
 * - Right panel: Animate tab, preset gallery (REVEAL, FLIP, PERSPECTIVE)
 * - Bottom: Timeline with playback controls, clip tracks
 * 800x500 at 60fps, 360 frames (6s loop)
 */
export const FeatureAnimateExportDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Timeline:
  // 0-30: Fade in
  // 30-100: User clicks "Hero Landing" preset → "Added" badge appears
  // 100-200: Animation plays on canvas (zoom + slight pan), playhead moves
  // 200-250: Export Video button glows, gets clicked
  // 250-310: Export progress overlay
  // 310-330: Hold
  // 330-360: Fade out

  const editorOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(frame, [330, 360], [1, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  // Preset selection animation
  const presetSelected = frame >= 60;
  const addedBadgeScale = spring({ frame: frame - 60, fps, config: { damping: 12, stiffness: 120 } });
  const animationCountOpacity = interpolate(frame, [55, 70], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Canvas animation (zoom + pan playing)
  const animPlaying = frame >= 80 && frame < 250;
  const animProgress = animPlaying ? interpolate(frame, [80, 200], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 0;
  const canvasScale = 1 + animProgress * 0.12;
  const canvasX = animProgress * -6;
  const canvasY = animProgress * -3;

  // Timeline playhead
  const playheadPos = interpolate(frame, [80, 200], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const timeValue = interpolate(frame, [80, 200], [0, 3], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Export Video button glow
  const exportGlow = interpolate(frame, [210, 235], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const exportPress = frame >= 240 ? spring({ frame: frame - 240, fps, config: { damping: 15, stiffness: 200 } }) : 0;

  // Export progress
  const showExport = frame >= 250 && frame < 320;
  const exportProgress = interpolate(frame, [250, 305], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const exportDone = frame >= 305;

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
          height: 36,
          backgroundColor: '#1e1e1e',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          flexShrink: 0,
        }}
      >
        <Img src={staticFile('logo.svg')} style={{ width: 24, height: 24, objectFit: 'contain' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <HdrBtn label="Save" />
          <HdrBtn label="Copy" />
          <HdrBtn label="16:9" />
          <HdrBtn label="Animate" active accent />
        </div>
        <div style={{ width: 24 }} />
      </div>

      {/* Sub-header: Add Slide / Export Video / Remove */}
      <div
        style={{
          height: 32,
          backgroundColor: '#1e1e1e',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          flexShrink: 0,
        }}
      >
        <SubBtn label="+ Add Slide" />
        <div
          style={{
            padding: '4px 12px',
            borderRadius: 6,
            backgroundColor: exportGlow > 0 ? ACCENT : `rgba(${ACCENT_RGB},0.15)`,
            color: exportGlow > 0 ? '#052e16' : ACCENT,
            fontSize: 9,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            border: `1px solid rgba(${ACCENT_RGB},${0.3 + exportGlow * 0.4})`,
            transform: exportPress > 0 ? `scale(${1 - exportPress * 0.03})` : 'scale(1)',
            boxShadow: exportGlow > 0.5 ? `0 0 16px rgba(${ACCENT_RGB},0.3)` : 'none',
          }}
        >
          ◎ Export Video
        </div>
        <SubBtn label="Remove" />
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
            padding: 16,
            backgroundColor: '#141414',
            overflow: 'hidden',
          }}
        >
          {/* Canvas with animation playing */}
          <div
            style={{
              width: '85%',
              aspectRatio: '16/9',
              borderRadius: 8,
              background: 'linear-gradient(135deg, #1a1a2e 0%, #f97316 30%, #f43f5e 60%, #1a1a2e 100%)',
              position: 'relative',
              overflow: 'hidden',
              transform: `scale(${canvasScale}) translate(${canvasX}px, ${canvasY}px)`,
            }}
          >
            {/* Screenshot content on canvas */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: '65%',
                  backgroundColor: '#1e1e1e',
                  borderRadius: 10,
                  boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                  overflow: 'hidden',
                }}
              >
                {/* macOS bar */}
                <div style={{ height: 18, backgroundColor: '#2a2a2a', display: 'flex', alignItems: 'center', paddingLeft: 8, gap: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#ff5f57' }} />
                  <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#febc2e' }} />
                  <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#28c840' }} />
                </div>
                <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ height: 5, width: '40%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2 }} />
                  <div style={{ height: 8, width: '65%', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 3 }} />
                  <div style={{ height: 5, width: '50%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2 }} />
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    <div style={{ height: 16, width: 50, backgroundColor: `rgba(${ACCENT_RGB},0.3)`, borderRadius: 4 }} />
                    <div style={{ height: 16, width: 50, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4 }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Export progress overlay */}
            {showExport && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                {!exportDone ? (
                  <>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Exporting video...</span>
                    <div style={{ width: '50%', height: 5, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${exportProgress}%`, height: '100%', backgroundColor: ACCENT, borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)' }}>{Math.round(exportProgress)}%</span>
                  </>
                ) : (
                  <>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#052e16" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <span style={{ fontSize: 11, color: 'white', fontWeight: 600 }}>Exported!</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Animate tab */}
        <div
          style={{
            width: 200,
            backgroundColor: '#1e1e1e',
            borderLeft: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          {/* Templates */}
          <div style={{ padding: '6px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: `rgba(${ACCENT_RGB},0.2)` }} />
            <span style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Templates</span>
            <div style={{ marginLeft: 'auto', fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>›</div>
          </div>

          {/* Tabs */}
          <div style={{ padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', gap: 0, borderRadius: 7, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.03)' }}>
              {['Settings', 'Edit', 'BG', '3D', 'Animate'].map((tab, i) => (
                <div
                  key={tab}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    padding: '6px 2px 5px',
                    backgroundColor: i === 4 ? 'rgba(255,255,255,0.06)' : 'transparent',
                    borderRadius: i === 4 ? 5 : 0,
                  }}
                >
                  <div style={{ fontSize: 8, color: i === 4 ? ACCENT : 'rgba(255,255,255,0.35)' }}>
                    {['⚙', '≡', '◐', '◇', '◎'][i]}
                  </div>
                  <span style={{ fontSize: 6.5, fontWeight: 500, color: i === 4 ? ACCENT : 'rgba(255,255,255,0.35)' }}>{tab}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Animation added banner */}
          <div
            style={{
              margin: '8px 8px 0',
              padding: '6px 8px',
              borderRadius: 6,
              backgroundColor: `rgba(${ACCENT_RGB},0.08)`,
              border: `1px solid rgba(${ACCENT_RGB},0.2)`,
              opacity: animationCountOpacity,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 8, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>1 animation added</span>
              <span style={{ fontSize: 7, color: '#f87171', fontWeight: 500 }}>Clear All</span>
            </div>
            <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.4)' }}>Click presets to add more</span>
          </div>

          {/* Preset gallery */}
          <div style={{ flex: 1, padding: '8px 8px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* REVEAL section */}
            <div>
              <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, fontWeight: 600, marginBottom: 6 }}>REVEAL</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
                {[
                  { name: 'Hero Landing', selected: presetSelected },
                  { name: 'Slide In 3D', selected: false },
                  { name: 'Rise & Settle', selected: false },
                  { name: 'Drop In', selected: false },
                ].map((preset, i) => (
                  <PresetCard
                    key={preset.name}
                    name={preset.name}
                    selected={preset.selected}
                    badgeScale={preset.selected ? Math.min(addedBadgeScale, 1) : 0}
                    duration={preset.name === 'Hero Landing' ? '2.5s' : preset.name === 'Drop In' ? '2.0s' : preset.name === 'Slide In 3D' ? '2.0s' : '2.5s'}
                  />
                ))}
              </div>
            </div>

            {/* FLIP section */}
            <div>
              <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, fontWeight: 600, marginBottom: 6 }}>FLIP</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
                {['Flip X', 'Flip Y', 'Peek'].map((name) => (
                  <PresetCard key={name} name={name} selected={false} badgeScale={0} duration="2.0s" />
                ))}
              </div>
            </div>

            {/* PERSPECTIVE section */}
            <div>
              <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, fontWeight: 600, marginBottom: 6 }}>PERSPECTIVE</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
                {['Tilt', 'Orbit', 'Swing'].map((name) => (
                  <PresetCard key={name} name={name} selected={false} badgeScale={0} duration="2.5s" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline / Bottom bar */}
      <div
        style={{
          height: 64,
          backgroundColor: '#1a1a1a',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        {/* Playback controls */}
        <div style={{ height: 24, display: 'flex', alignItems: 'center', padding: '0 10px', gap: 8 }}>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <PlayBtn icon="⏮" />
            <PlayBtn icon={animPlaying ? '⏸' : '▶'} accent />
            <PlayBtn icon="⏭" />
          </div>
          <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>
            {timeValue.toFixed(2)} / 3.00
          </span>
          <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.35)' }}>DURATION</span>
          <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>3</span>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)' }}>3s</span>
          <PlayBtn icon="⟳" />
        </div>

        {/* Timeline tracks */}
        <div style={{ flex: 1, position: 'relative', padding: '0 10px' }}>
          {/* Time markers */}
          <div style={{ display: 'flex', justifyContent: 'space-between', height: 10, alignItems: 'center' }}>
            {['0:00', '0:01', '0:02', '0:03'].map((t) => (
              <span key={t} style={{ fontSize: 6, color: 'rgba(255,255,255,0.25)' }}>{t}</span>
            ))}
          </div>

          {/* Clip track */}
          <div style={{ position: 'relative', height: 14, marginTop: 2 }}>
            {/* Clip bar (thumbnail strip) */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                height: 14,
                borderRadius: 3,
                background: 'linear-gradient(90deg, rgba(249,115,22,0.3) 0%, rgba(244,63,94,0.3) 100%)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                paddingLeft: 4,
                gap: 2,
              }}
            >
              <span style={{ fontSize: 5.5, color: 'rgba(255,255,255,0.5)' }}>◎ 3.0s</span>
            </div>

            {/* Playhead */}
            <div
              style={{
                position: 'absolute',
                left: `${playheadPos}%`,
                top: -4,
                width: 2,
                height: 22,
                backgroundColor: '#f87171',
                borderRadius: 1,
                zIndex: 2,
              }}
            />
          </div>

          {/* Animation clip track */}
          <div style={{ position: 'relative', height: 12, marginTop: 3 }}>
            <div
              style={{
                position: 'absolute',
                left: 0,
                width: presetSelected ? '100%' : '0%',
                top: 0,
                height: 12,
                borderRadius: 3,
                backgroundColor: `rgba(${ACCENT_RGB},0.25)`,
                border: presetSelected ? `1px solid rgba(${ACCENT_RGB},0.4)` : 'none',
                display: 'flex',
                alignItems: 'center',
                paddingLeft: 4,
                transition: 'width 0.3s ease',
              }}
            >
              {presetSelected && (
                <span style={{ fontSize: 5.5, color: ACCENT, fontWeight: 500 }}>◎ Hero Landing</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const HdrBtn: React.FC<{ label: string; active?: boolean; accent?: boolean }> = ({ label, active, accent }) => (
  <div
    style={{
      height: 24,
      padding: '0 8px',
      display: 'flex',
      alignItems: 'center',
      fontSize: 9,
      fontWeight: 500,
      backgroundColor: active && accent ? `rgba(${ACCENT_RGB},0.1)` : active ? 'rgba(255,255,255,0.06)' : 'transparent',
      border: active && accent ? `1px solid rgba(${ACCENT_RGB},0.3)` : active ? '1px solid rgba(255,255,255,0.12)' : '1px solid transparent',
      borderRadius: 5,
      color: active && accent ? ACCENT : active ? '#fff' : 'rgba(255,255,255,0.55)',
      gap: 3,
    }}
  >
    {label}
  </div>
);

const SubBtn: React.FC<{ label: string }> = ({ label }) => (
  <div style={{ padding: '3px 8px', fontSize: 8, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{label}</div>
);

const PlayBtn: React.FC<{ icon: string; accent?: boolean }> = ({ icon, accent }) => (
  <div
    style={{
      width: 18,
      height: 18,
      borderRadius: '50%',
      backgroundColor: accent ? 'rgba(255,255,255,0.1)' : 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 8,
      color: accent ? '#fff' : 'rgba(255,255,255,0.4)',
    }}
  >
    {icon}
  </div>
);

const ACCENT_CONST = '#34d399';
const ACCENT_RGB_CONST = '52,211,153';

const PresetCard: React.FC<{ name: string; selected: boolean; badgeScale: number; duration: string }> = ({ name, selected, badgeScale, duration }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    <div
      style={{
        aspectRatio: '1',
        borderRadius: 5,
        backgroundColor: 'rgba(255,255,255,0.03)',
        border: selected ? `1.5px solid rgba(${ACCENT_RGB_CONST},0.5)` : '1px solid rgba(255,255,255,0.06)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Fake thumbnail */}
      <div style={{ width: '60%', aspectRatio: '16/10', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2 }} />

      {/* "Added" badge */}
      {selected && badgeScale > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 3,
            left: 3,
            padding: '1px 4px',
            borderRadius: 2,
            backgroundColor: ACCENT_CONST,
            color: '#052e16',
            fontSize: 5,
            fontWeight: 700,
            transform: `scale(${badgeScale})`,
          }}
        >
          Added
        </div>
      )}

      {/* Duration badge */}
      <div
        style={{
          position: 'absolute',
          bottom: 2,
          right: 2,
          padding: '1px 3px',
          borderRadius: 2,
          backgroundColor: 'rgba(0,0,0,0.6)',
          fontSize: 5,
          color: 'rgba(255,255,255,0.6)',
        }}
      >
        {duration}
      </div>
    </div>
    <span style={{ fontSize: 5.5, color: selected ? ACCENT_CONST : 'rgba(255,255,255,0.45)', textAlign: 'center', lineHeight: 1.2 }}>{name}</span>
  </div>
);
