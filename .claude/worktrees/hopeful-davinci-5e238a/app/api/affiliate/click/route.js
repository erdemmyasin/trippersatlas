export async function POST(req) {
  try {
    const { listingName, platform, url } = await req.json();

    console.log('[affiliate:click]', { listingName, platform, url });

    return Response.json({ success: true, url });
  } catch (err) {
    console.error('[affiliate:click] hata:', err);
    return Response.json({ success: false, url: null }, { status: 400 });
  }
}
