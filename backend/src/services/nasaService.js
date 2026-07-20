const NASA_API_KEY = () => process.env.NASA_API_KEY || 'DEMO_KEY';
const BASE = 'https://api.nasa.gov';
const IMG_BASE = 'https://images-api.nasa.gov';

// Fetch with timeout helper
const fetchJSON = async (url, timeout = 8000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) throw new Error(`NASA API error: ${res.status}`);
    return res.json();
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
};

// NASA Astronomy Picture of the Day
const getAPOD = async (date = null) => {
  const dateParam = date ? `&date=${date}` : '';
  return fetchJSON(`${BASE}/planetary/apod?api_key=${NASA_API_KEY()}${dateParam}`);
};

// NASA Image and Video Library search
const searchImages = async (query, count = 6) => {
  const data = await fetchJSON(`${IMG_BASE}/search?q=${encodeURIComponent(query)}&media_type=image&page_size=${count}`);
  const items = data.collection?.items || [];
  return items.slice(0, count).map(item => ({
    url: item.links?.[0]?.href || '',
    title: item.data?.[0]?.title || query,
    description: item.data?.[0]?.description || '',
    date: item.data?.[0]?.date_created || '',
    nasaId: item.data?.[0]?.nasa_id || '',
  })).filter(i => i.url);
};

// NASA Near-Earth Objects
const getNEOs = async () => {
  const today = new Date().toISOString().split('T')[0];
  return fetchJSON(`${BASE}/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=${NASA_API_KEY()}`);
};

// Mars Rover Photos (latest)
const getMarsPhotos = async (rover = 'curiosity', count = 6) => {
  const data = await fetchJSON(`${BASE}/mars-photos/api/v1/rovers/${rover}/latest_photos?api_key=${NASA_API_KEY()}`);
  return (data.latest_photos || []).slice(0, count).map(p => ({
    url: p.img_src,
    camera: p.camera?.full_name,
    sol: p.sol,
    date: p.earth_date,
    rover: p.rover?.name,
  }));
};

// NASA Exoplanet Archive (basic count)
const getExoplanetCount = async () => {
  const data = await fetchJSON('https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=select+count(*)+from+pscomppars&format=json');
  return data?.[0]?.['count(*)'] || '5000+';
};

module.exports = { getAPOD, searchImages, getNEOs, getMarsPhotos, getExoplanetCount };
