import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_DOMAINS = [
  'pbs.twimg.com',
  'abs.twimg.com',
  'ton.twitter.com',
  'video.twimg.com',
];

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    const parsed = new URL(url);
    if (!ALLOWED_DOMAINS.includes(parsed.hostname)) {
      return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 });
    }

    const response = await fetch(url);
    if (!response.ok) {
      return NextResponse.json({ error: 'Upstream fetch failed' }, { status: 502 });
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });
  }
}
