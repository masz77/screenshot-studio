import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring, Img, staticFile } from 'remotion';

const ACCENT = '#34d399';
const ACCENT_RGB = '52,211,153';

/**
 * Feature demo: "3D Transforms & Frames"
 * Replicates the actual Stage editor with 3D tab active:
 * - Header with standard buttons
 * - Canvas with screenshot tilting through 3D perspectives
 * - Right panel: 3D tab active, preset grid (BASIC, DRAMATIC, PERSPECTIVE)
 * 800x500 at 60fps, 360 frames (6s loop)
 */
export const Feature3DFramesDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Timeline:
  // 0-30: Fade in, "Default" selected
  // 30-90: "Tilt Left" gets selected, canvas rotates
  // 90-150: "Dramatic Right" gets selected
  // 150-210: "Hero Left" gets selected
  // 210-270: "Showcase L" gets selected
  // 270-310: Hold
  // 310-360: Fade out

  const editorOpacity = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(frame, [330, 360], [1, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  // Which preset is active
  const presetPhase = Math.floor(interpolate(frame, [0, 300], [0, 4.99], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }));

  const presets = [
    { name: 'Default', rotateX: 0, rotateY: 0, section: 'BASIC', idx: 0 },
    { name: 'Tilt Left', rotateX: 12, rotateY: -22, section: 'BASIC', idx: 1 },
    { name: 'Dramatic Right', rotateX: 8, rotateY: 20, section: 'DRAMATIC', idx: 4 },
    { name: 'Hero Left', rotateX: -8, rotateY: -18, section: 'DRAMATIC', idx: 5 },
    { name: 'Showcase L', rotateX: 15, rotateY: -12, section: 'DRAMATIC', idx: 7 },
  ];

  const current = presets[presetPhase];
  const next = presets[(presetPhase + 1) % presets.length];
  const phaseFrame = frame % 60;

  // Smooth rotation transitions
  const rotateX = interpolate(phaseFrame, [0, 20, 60], [current.rotateX, current.rotateX, next.rotateX], { extrapolateRight: 'clamp' });
  const rotateY = interpolate(phaseFrame, [0, 20, 60], [current.rotateY, current.rotateY, next.rotateY], { extrapolateRight: 'clamp' });

  // Selection highlight spring
  const selectSpring = spring({ frame: phaseFrame, fps, config: { damping: 15, stiffness: 120 } });

  // All preset names for the grid
  const basicPresets = ['Default', 'Tilt Left', 'Tilt Right'];
  const basicPresets2 = ['Subtle Left', 'Subtle Right', 'Lean Back'];
  const dramaticPresets = ['Dramatic Left', 'Dramatic Right', 'Hero Left'];
  const dramaticPresets2 = ['Hero Right', 'Showcase L', 'Showcase R'];

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
      {/* Header */}
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
          <HdrBtn label="Animate" />
        </div>
        <div style={{ width: 24 }} />
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Canvas */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            backgroundColor: '#141414',
            perspective: 800,
          }}
        >
          {/* Canvas with 3D transform */}
          <div
            style={{
              width: '80%',
              aspectRatio: '16/9',
              borderRadius: 10,
              background: 'linear-gradient(135deg, #1a1a2e 0%, #f97316 30%, #f43f5e 60%, #1a1a2e 100%)',
              position: 'relative',
              overflow: 'hidden',
              transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
              transformStyle: 'preserve-3d',
              boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Screenshot on canvas */}
            <div
              style={{
                width: '65%',
                backgroundColor: '#1e1e1e',
                borderRadius: 8,
                boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
                overflow: 'hidden',
              }}
            >
              {/* macOS bar */}
              <div style={{ height: 16, backgroundColor: '#2a2a2a', display: 'flex', alignItems: 'center', paddingLeft: 7, gap: 3 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#ff5f57' }} />
                <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#febc2e' }} />
                <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#28c840' }} />
              </div>
              <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ height: 4, width: '35%', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2 }} />
                <div style={{ height: 6, width: '55%', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3 }} />
                <div style={{ height: 4, width: '40%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 2 }} />
                <div style={{ display: 'flex', gap: 4, marginTop: 3 }}>
                  <div style={{ height: 12, width: 40, backgroundColor: `rgba(${ACCENT_RGB},0.3)`, borderRadius: 3 }} />
                  <div style={{ height: 12, width: 40, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 3 }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - 3D tab */}
        <div
          style={{
            width: 210,
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

          {/* Tabs - 3D active */}
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
                    backgroundColor: i === 3 ? 'rgba(255,255,255,0.06)' : 'transparent',
                    borderRadius: i === 3 ? 5 : 0,
                  }}
                >
                  <div style={{ fontSize: 8, color: i === 3 ? ACCENT : 'rgba(255,255,255,0.35)' }}>
                    {['⚙', '≡', '◐', '◇', '◎'][i]}
                  </div>
                  <span style={{ fontSize: 6.5, fontWeight: 500, color: i === 3 ? ACCENT : 'rgba(255,255,255,0.35)' }}>{tab}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 3D preset gallery */}
          <div style={{ flex: 1, padding: '8px 8px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* BASIC */}
            <div>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 6 }}>BASIC</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
                {basicPresets.map((name) => (
                  <PresetThumb key={name} name={name} selected={current.name === name} />
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, marginTop: 4 }}>
                {basicPresets2.map((name) => (
                  <PresetThumb key={name} name={name} selected={current.name === name} />
                ))}
              </div>
            </div>

            {/* DRAMATIC */}
            <div>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 6 }}>DRAMATIC</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
                {dramaticPresets.map((name) => (
                  <PresetThumb key={name} name={name} selected={current.name === name} />
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, marginTop: 4 }}>
                {dramaticPresets2.map((name) => (
                  <PresetThumb key={name} name={name} selected={current.name === name} />
                ))}
              </div>
            </div>

            {/* PERSPECTIVE */}
            <div>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 6 }}>PERSPECTIVE</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
                {['Top Down', 'Bottom Up', 'Isometric'].map((name) => (
                  <PresetThumb key={name} name={name} selected={current.name === name} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const HdrBtn: React.FC<{ label: string }> = ({ label }) => (
  <div
    style={{
      height: 24,
      padding: '0 8px',
      display: 'flex',
      alignItems: 'center',
      fontSize: 9,
      fontWeight: 500,
      border: '1px solid transparent',
      borderRadius: 5,
      color: 'rgba(255,255,255,0.55)',
    }}
  >
    {label}
  </div>
);

const ACCENT_C = '#34d399';
const ACCENT_RGB_C = '52,211,153';

const PresetThumb: React.FC<{ name: string; selected: boolean }> = ({ name, selected }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    <div
      style={{
        aspectRatio: '4/3',
        borderRadius: 5,
        backgroundColor: 'rgba(255,255,255,0.03)',
        border: selected ? `1.5px solid rgba(${ACCENT_RGB_C},0.5)` : '1px solid rgba(255,255,255,0.06)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Tiny angled thumbnail to suggest 3D */}
      <div
        style={{
          width: '55%',
          aspectRatio: '16/10',
          backgroundColor: 'rgba(255,255,255,0.06)',
          borderRadius: 2,
          transform: selected ? 'rotateY(-8deg) rotateX(4deg)' : 'none',
        }}
      />
    </div>
    <span
      style={{
        fontSize: 5.5,
        color: selected ? ACCENT_C : 'rgba(255,255,255,0.45)',
        textAlign: 'center',
        lineHeight: 1.2,
      }}
    >
      {name}
    </span>
  </div>
);
