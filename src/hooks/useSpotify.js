import { useState, useEffect, useCallback, useRef } from 'react';

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = window.location.origin + '/callback';
const SCOPES = [
  'user-read-currently-playing',
  'user-read-playback-state',
  'user-modify-playback-state',
].join(' ');

async function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function generateCodeChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function getToken() {
  return localStorage.getItem('spotify_token');
}

export function useSpotify() {
  const [token, setToken] = useState(() => getToken());
  const [currentTrack, setCurrentTrack] = useState(null);
  const [queue, setQueue] = useState([]);
  const artistImageCache = useRef({});

  const login = useCallback(async () => {
    const verifier = await generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    localStorage.setItem('spotify_verifier', verifier);
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      response_type: 'code',
      redirect_uri: REDIRECT_URI,
      scope: SCOPES,
      code_challenge_method: 'S256',
      code_challenge: challenge,
    });
    window.location.href = `https://accounts.spotify.com/authorize?${params}`;
  }, []);

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code) return;
    const verifier = localStorage.getItem('spotify_verifier');
    if (!verifier) return;
    localStorage.removeItem('spotify_verifier');
    window.history.replaceState({}, '', '/');

    fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        code_verifier: verifier,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.access_token) {
          localStorage.setItem('spotify_token', data.access_token);
          localStorage.setItem('spotify_refresh', data.refresh_token);
          localStorage.setItem('spotify_expires', Date.now() + data.expires_in * 1000);
          setToken(data.access_token);
        }
      })
      .catch(console.error);
  }, []);

  const refreshToken = useCallback(async () => {
    const refresh = localStorage.getItem('spotify_refresh');
    if (!refresh) return null;
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        grant_type: 'refresh_token',
        refresh_token: refresh,
      }),
    });
    const data = await res.json();
    if (data.access_token) {
      localStorage.setItem('spotify_token', data.access_token);
      localStorage.setItem('spotify_expires', Date.now() + data.expires_in * 1000);
      setToken(data.access_token);
      return data.access_token;
    }
    return null;
  }, []);

  const getActiveToken = useCallback(async () => {
    const expires = localStorage.getItem('spotify_expires');
    if (expires && Date.now() > Number(expires) - 60000) return await refreshToken();
    return getToken();
  }, [refreshToken]);

  // Fetch artist image (cached)
  const fetchArtistImage = useCallback(async (artistId, activeToken) => {
    if (!artistId) return null;
    if (artistImageCache.current[artistId]) return artistImageCache.current[artistId];
    try {
      const res = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      const data = await res.json();
      const url = data.images?.[0]?.url || null;
      artistImageCache.current[artistId] = url;
      return url;
    } catch {
      return null;
    }
  }, []);

  // Poll currently playing every 2s
  useEffect(() => {
    if (!token) return;

    const fetchCurrentTrack = async () => {
      const activeToken = await getActiveToken();
      if (!activeToken) { setToken(null); return; }

      try {
        const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
          headers: { Authorization: `Bearer ${activeToken}` },
        });
        if (res.status === 401) { setToken(null); setCurrentTrack(null); return; }
        if (res.status === 204) { setCurrentTrack(null); return; }

        const data = await res.json();
        if (!data.item) { setCurrentTrack(null); return; }

        const artistId = data.item.artists[0]?.id || null;
        const artistImageUrl = await fetchArtistImage(artistId, activeToken);

        setCurrentTrack({
          title: data.item.name,
          artist: data.item.artists.map((a) => a.name).join(', '),
          albumArt: data.item.album.images[0]?.url,
          artistImageUrl,
          artistId,
          isPlaying: data.is_playing,
          progressMs: data.progress_ms,
          durationMs: data.item.duration_ms,
          uri: data.item.uri,
        });
      } catch { /* ignore */ }
    };

    fetchCurrentTrack();
    const interval = setInterval(fetchCurrentTrack, 2000);
    return () => clearInterval(interval);
  }, [token, getActiveToken, fetchArtistImage]);

  // Poll queue every 10s
  useEffect(() => {
    if (!token) return;
    const fetchQueue = async () => {
      const activeToken = await getActiveToken();
      if (!activeToken) return;
      try {
        const res = await fetch('https://api.spotify.com/v1/me/player/queue', {
          headers: { Authorization: `Bearer ${activeToken}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setQueue(data.queue?.slice(0, 20) || []);
      } catch { /* ignore */ }
    };
    fetchQueue();
    const interval = setInterval(fetchQueue, 10000);
    return () => clearInterval(interval);
  }, [token, getActiveToken]);

  // Generic player action
  const playerAction = useCallback(async (endpoint, method = 'POST', body = null) => {
    const activeToken = await getActiveToken();
    if (!activeToken) return;
    await fetch(`https://api.spotify.com/v1/me/player/${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${activeToken}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  }, [getActiveToken]);

  const togglePlay   = useCallback(() => {
    const action = currentTrack?.isPlaying ? 'pause' : 'play';
    playerAction(action, 'PUT');
    setCurrentTrack((p) => p ? { ...p, isPlaying: !p.isPlaying } : p);
  }, [currentTrack, playerAction]);

  const nextTrack    = useCallback(() => playerAction('next'), [playerAction]);
  const prevTrack    = useCallback(() => playerAction('previous'), [playerAction]);
  const seekTo       = useCallback((ms) => {
    playerAction(`seek?position_ms=${Math.floor(ms)}`, 'PUT');
    setCurrentTrack((p) => p ? { ...p, progressMs: ms } : p);
  }, [playerAction]);
  const skipToTrack  = useCallback((uri) => playerAction('play', 'PUT', { uris: [uri] }), [playerAction]);

  const logout = useCallback(() => {
    localStorage.removeItem('spotify_token');
    localStorage.removeItem('spotify_refresh');
    localStorage.removeItem('spotify_expires');
    setToken(null);
    setCurrentTrack(null);
    setQueue([]);
  }, []);

  return {
    isConnected: !!token,
    login, logout,
    currentTrack, queue,
    togglePlay, nextTrack, prevTrack, seekTo, skipToTrack,
  };
}
