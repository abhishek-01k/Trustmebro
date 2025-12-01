import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const position = searchParams.get('pos') || '?';
  const total = searchParams.get('total') || '?';

  // Load the custom Squid Game font from production URL
  const fontBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://trustmebro-tan.vercel.app';
  const fontData = await fetch(`${fontBaseUrl}/font/GameOfSquids.ttf`).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#000000',
          position: 'relative',
        }}
      >
        {/* MASSIVE neon glow - top left - PINK/MAGENTA */}
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            top: '-400px',
            left: '-300px',
            width: '900px',
            height: '900px',
            background: 'radial-gradient(circle, rgba(255, 0, 100, 0.7) 0%, rgba(255, 0, 80, 0.4) 20%, rgba(200, 0, 60, 0.2) 40%, transparent 60%)',
          }}
        />
        {/* MASSIVE neon glow - bottom right - RED */}
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            bottom: '-400px',
            right: '-300px',
            width: '900px',
            height: '900px',
            background: 'radial-gradient(circle, rgba(255, 20, 60, 0.65) 0%, rgba(255, 0, 50, 0.35) 20%, rgba(180, 0, 40, 0.15) 40%, transparent 60%)',
          }}
        />
        {/* Center spotlight glow */}
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '1400px',
            height: '800px',
            background: 'radial-gradient(ellipse, rgba(255, 50, 100, 0.2) 0%, rgba(255, 0, 60, 0.08) 30%, transparent 60%)',
            transform: 'translate(-50%, -50%)',
          }}
        />
        {/* Extra spark - top right */}
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            top: '50px',
            right: '100px',
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(255, 100, 150, 0.5) 0%, transparent 50%)',
          }}
        />
        {/* Extra spark - bottom left */}
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            bottom: '80px',
            left: '80px',
            width: '250px',
            height: '250px',
            background: 'radial-gradient(circle, rgba(255, 50, 80, 0.4) 0%, transparent 50%)',
          }}
        />

        {/* Main Card - glass effect */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '1100px',
            height: '570px',
            background: 'linear-gradient(145deg, rgba(20, 20, 25, 0.95) 0%, rgba(10, 10, 15, 0.98) 50%, rgba(15, 5, 15, 0.95) 100%)',
            borderRadius: '32px',
            border: '2px solid rgba(255, 50, 100, 0.5)',
            padding: '44px 52px',
            position: 'relative',
          }}
        >
          {/* NEON top border - bright pink/red gradient */}
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              top: '-2px',
              left: '5%',
              width: '90%',
              height: '4px',
              background: 'linear-gradient(90deg, transparent 0%, #ff0066 15%, #ff3377 30%, #ff1166 50%, #ff3377 70%, #ff0066 85%, transparent 100%)',
              borderRadius: '4px',
            }}
          />

          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
            }}
          >
            {/* NEON Squid Game Symbols */}
            <div style={{ display: 'flex', gap: '28px', alignItems: 'center' }}>
              {/* Circle - neon outline */}
              <div
                style={{
                  display: 'flex',
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  border: '5px solid #ff0066',
                  background: 'rgba(255, 0, 102, 0.15)',
                }}
              />
              {/* Triangle - neon filled */}
              <svg width="70" height="62" viewBox="0 0 70 62" style={{ display: 'flex' }}>
                <polygon points="35,4 66,58 4,58" fill="#ff0066" />
              </svg>
              {/* Square - neon outline */}
              <div
                style={{
                  display: 'flex',
                  width: '58px',
                  height: '58px',
                  border: '5px solid #ff0066',
                  background: 'rgba(255, 0, 102, 0.15)',
                }}
              />
            </div>

            {/* Glowing Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'linear-gradient(135deg, #ff0066 0%, #cc0044 100%)',
                padding: '16px 36px',
                borderRadius: '32px',
                fontSize: '16px',
                fontWeight: '800',
                color: '#fff',
                textTransform: 'uppercase',
                letterSpacing: '3px',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white" style={{ display: 'flex' }}>
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
              Early Access
            </div>
          </div>

          {/* Center - MASSIVE Title */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              width: '100%',
            }}
          >
            {/* Main Title - HUGE with custom Squid Game font */}
            <div
              style={{
                display: 'flex',
                fontSize: '110px',
                fontFamily: 'GameOfSquids',
                color: '#ffffff',
                lineHeight: 1,
                marginLeft: '20px',
              }}
            >
              TRUSTMEBRO
            </div>

            {/* Neon subtitle bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginTop: '20px',
                gap: '0',
              }}
            >
              {/* Left line */}
              <div style={{ display: 'flex', width: '120px', height: '3px', background: 'linear-gradient(90deg, transparent, #ff0066)' }} />
              {/* Center text box */}
              <div
                style={{
                  display: 'flex',
                  padding: '10px 28px',
                  border: '2px solid #ff0066',
                  borderRadius: '8px',
                  marginLeft: '16px',
                  marginRight: '16px',
                  background: 'rgba(255, 0, 102, 0.1)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    fontSize: '18px',
                    color: '#ff0066',
                    letterSpacing: '6px',
                    textTransform: 'uppercase',
                    fontWeight: '700',
                  }}
                >
                  Waitlist Pass
                </div>
              </div>
              {/* Right line */}
              <div style={{ display: 'flex', width: '120px', height: '3px', background: 'linear-gradient(90deg, #ff0066, transparent)' }} />
            </div>
          </div>

          {/* Bottom Stats - BOLD */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              width: '100%',
            }}
          >
            {/* Position - LEFT */}
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: '200px' }}>
              <div
                style={{
                  display: 'flex',
                  fontSize: '13px',
                  color: '#888',
                  textTransform: 'uppercase',
                  letterSpacing: '4px',
                  fontWeight: '600',
                  marginBottom: '6px',
                }}
              >
                Your Position
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', fontSize: '56px', color: '#ff0066', fontWeight: '800', lineHeight: 1 }}>#</div>
                <div
                  style={{
                    display: 'flex',
                    fontSize: '56px',
                    fontWeight: '800',
                    color: '#ffffff',
                    lineHeight: 1,
                  }}
                >
                  {position}
                </div>
              </div>
            </div>

            {/* Center - Tagline */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '12px',
                flex: 1,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  fontSize: '20px',
                  color: '#999',
                  fontWeight: '400',
                }}
              >
                Trust the tap.
              </div>
              {/* Mini neon symbols */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ display: 'flex', width: '14px', height: '14px', borderRadius: '50%', border: '2px solid #ff0066' }} />
                <svg width="16" height="14" viewBox="0 0 16 14" style={{ display: 'flex' }}>
                  <polygon points="8,0 16,14 0,14" fill="#ff0066" />
                </svg>
                <div style={{ display: 'flex', width: '12px', height: '12px', border: '2px solid #ff0066' }} />
              </div>
            </div>

            {/* Total - RIGHT */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '200px' }}>
              <div
                style={{
                  display: 'flex',
                  fontSize: '13px',
                  color: '#888',
                  textTransform: 'uppercase',
                  letterSpacing: '4px',
                  fontWeight: '600',
                  marginBottom: '6px',
                }}
              >
                Total Degens
              </div>
              <div
                style={{
                  display: 'flex',
                  fontSize: '56px',
                  fontWeight: '800',
                  color: '#ff0066',
                  lineHeight: 1,
                }}
              >
                {total}
              </div>
            </div>
          </div>

          {/* NEON bottom border */}
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              bottom: '-2px',
              left: '15%',
              width: '70%',
              height: '4px',
              background: 'linear-gradient(90deg, transparent, #ff0066 30%, #ff3388 50%, #ff0066 70%, transparent)',
              borderRadius: '4px',
            }}
          />

          {/* Corner accents */}
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              top: '20px',
              right: '20px',
              width: '40px',
              height: '40px',
              borderTop: '3px solid #ff0066',
              borderRight: '3px solid #ff0066',
              borderRadius: '0 12px 0 0',
            }}
          />
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              bottom: '20px',
              left: '20px',
              width: '40px',
              height: '40px',
              borderBottom: '3px solid #ff0066',
              borderLeft: '3px solid #ff0066',
              borderRadius: '0 0 0 12px',
            }}
          />
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'GameOfSquids',
          data: fontData,
          style: 'normal',
        },
      ],
    }
  );
}
