import { useState, useEffect, useCallback } from 'react';

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = window.location.origin + '/callback';
const SCOPES = 'user-read-currently-playing user-read-playback-state';

async function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 43);
}

async function generateCodeChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export function useSpotify() {
  const [token, setToken] = useState(() => localStorage.getItem('spotify_token'));
  const [currentTrack, setCurrentTrack] = useState(null);

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
      });
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

  // Poll current track every 5s
  useEffect(() => {
    if (!token) return;

    const fetchCurrentTrack = async () => {
      const expires = localStorage.getItem('spotify_expires');
      let activeToken = token;

      if (expires && Date.now() > Number(expires) - 60000) {
        activeToken = await refreshToken();
        if (!activeToken) {
          setToken(null);
          return;
        }
      }

      try {
        const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
          headers: { Authorization: `Bearer ${activeToken}` },
        });

        if (res.status === 401) {
          setToken(null);
          setCurrentTrack(null);
          return;
        }

        if (res.status === 204) {
          setCurrentTrack(null);
          return;
        }

        const data = await res.json();
        if (data.item) {
          setCurrentTrack({
            title: data.item.name,
            artist: data.item.artists.map((a) => a.name).join(', '),
            albumArt: data.item.album.images[0]?.url,
            isPlaying: data.is_playing,
          });
        } else {
          setCurrentTrack(null);
        }
      } catch {
        // ignore network errors silently
      }
    };

    fetchCurrentTrack();
    const interval = setInterval(fetchCurrentTrack, 5000);
    return () => clearInterval(interval);
  }, [token, refreshToken]);

  const logout = useCallback(() => {
    localStorage.removeItem('spotify_token');
    localStorage.removeItem('spotify_refresh');
    localStorage.removeItem('spotify_expires');
    setToken(null);
    setCurrentTrack(null);
  }, []);

  return {
    isConnected: !!token,
    login,
    logout,
    currentTrack,
  };
}
