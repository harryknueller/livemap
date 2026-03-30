const fs = require('fs');
const http = require('http');
const path = require('path');
const { BrowserWindow, shell } = require('electron');

function loadSupabaseModule() {
  try {
    return require('@supabase/supabase-js');
  } catch (moduleError) {
    try {
      return require(path.join(__dirname, 'vendor-node-modules', '@supabase', 'supabase-js'));
    } catch (_vendorError) {
      throw moduleError;
    }
  }
}

const { createClient } = loadSupabaseModule();

const SESSION_FILE_NAME = 'supabase-session.json';
const PREFERENCES_FILE_NAME = 'auth-preferences.json';
const OAUTH_TIMEOUT_MS = 2 * 60 * 1000;
const SUPABASE_URL = 'https://drzqdfmsyxpzbdyttnyg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_K7-xGQ4xexTp7XzbV-TLTA_DO3SEfFU';

const ROLE_FEATURES = {
  public: [],
  prem: ['findNearest', 'worldBossTimer', 'mapMarkerOnly'],
  guild: ['findNearest', 'routePlanner', 'altars', 'worldBossTimer', 'mapMarkerOnly'],
  beta: ['findNearest', 'routePlanner', 'altars', 'worldBossTimer', 'mapMarkerOnly'],
  admin: ['findNearest', 'routePlanner', 'altars', 'worldBossTimer', 'mapMarkerOnly', 'admin'],
};

function createEmptyFeatures() {
  return {
    findNearest: false,
    routePlanner: false,
    altars: false,
    worldBossTimer: false,
    mapMarkerOnly: false,
    admin: false,
  };
}

function normalizeRole(value) {
  const candidate = String(value || 'public').trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(ROLE_FEATURES, candidate) ? candidate : 'public';
}

function resolveFeatures(role) {
  const features = createEmptyFeatures();
  for (const feature of ROLE_FEATURES[normalizeRole(role)] || []) {
    features[feature] = true;
  }
  return features;
}

function buildStatusMessage({ configured, session, access, configError }) {
  if (!configured) {
    return configError || 'Supabase konnte nicht initialisiert werden.';
  }

  if (!session?.loggedIn) {
    return 'Bitte mit Discord anmelden.';
  }
  if (access?.blocked) {
    return 'Dein Account wurde gesperrt !';
  }
  return `Angemeldet als ${normalizeRole(access?.role)}.`;
}

function createBaseState() {
  return {
    configured: false,
    loading: false,
    configError: null,
    session: {
      loggedIn: false,
      userId: null,
      email: null,
      displayName: null,
      avatarUrl: null,
    },
    access: {
      role: 'public',
      blocked: false,
      features: createEmptyFeatures(),
      message: 'Bitte mit Discord anmelden.',
    },
    preferences: {
      autoLogin: false,
    },
  };
}

function ensureDirectory(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function safeReadJson(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_error) {
    return null;
  }
}

function pickDisplayName(user, profile) {
  const metadata = user?.user_metadata || {};
  return (
    profile?.discord_username
    || metadata.preferred_username
    || metadata.user_name
    || metadata.full_name
    || metadata.name
    || user?.email
    || 'Discord Nutzer'
  );
}

function pickAvatarUrl(user, profile) {
  const metadata = user?.user_metadata || {};
  return profile?.avatar_url || metadata.avatar_url || null;
}

function buildProfileInsertPayload(user) {
  const metadata = user?.user_metadata || {};
  return {
    id: user.id,
    email: user.email || null,
    discord_user_id: metadata.provider_id ? String(metadata.provider_id) : null,
    discord_username: pickDisplayName(user),
    avatar_url: pickAvatarUrl(user),
    role: 'public',
  };
}

function sanitizeProfileUpdate(payload) {
  const updatePayload = {
    role: normalizeRole(payload?.role),
  };
  if (Object.prototype.hasOwnProperty.call(payload || {}, 'blocked')) {
    updatePayload.blocked = Boolean(payload?.blocked);
  }
  return updatePayload;
}

function createAuthManager({ app, appDir, onStateChange }) {
  const state = createBaseState();
  const sessionPath = path.join(app.getPath('userData'), SESSION_FILE_NAME);
  const preferencesPath = path.join(app.getPath('userData'), PREFERENCES_FILE_NAME);

  let supabase = null;
  let authFlowPromise = null;

  function emit() {
    const publicState = {
      configured: state.configured,
      loading: state.loading,
      configError: state.configError,
      session: { ...state.session },
      access: {
        role: normalizeRole(state.access.role),
        blocked: Boolean(state.access.blocked),
        features: { ...state.access.features },
        message: buildStatusMessage(state),
      },
      preferences: {
        autoLogin: Boolean(state.preferences?.autoLogin),
      },
    };

    state.access.message = publicState.access.message;
    if (typeof onStateChange === 'function') {
      onStateChange(publicState);
    }
    return publicState;
  }

  function setLoading(loading) {
    state.loading = Boolean(loading);
    emit();
  }

  function resetAuthState({ keepConfigured = true } = {}) {
    const configured = keepConfigured ? state.configured : false;
    const configError = keepConfigured ? state.configError : null;
    state.configured = configured;
    state.configError = configError;
    state.session = {
      loggedIn: false,
      userId: null,
      email: null,
      displayName: null,
      avatarUrl: null,
    };
    state.access = {
      role: 'public',
      blocked: false,
      features: createEmptyFeatures(),
      message: buildStatusMessage(state),
    };
    state.preferences = {
      autoLogin: Boolean(state.preferences?.autoLogin),
    };
  }

  function loadConfig() {
    const url = SUPABASE_URL;
    const anonKey = SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      state.configured = false;
      state.configError = 'Supabase-Zugangsdaten fehlen in auth.js.';
      return null;
    }

    state.configured = true;
    state.configError = null;
    return { url, anonKey };
  }

  function ensureClient() {
    const config = loadConfig();
    if (!config) {
      supabase = null;
      emit();
      return null;
    }

    if (!supabase) {
      supabase = createClient(config.url, config.anonKey, {
        auth: {
          flowType: 'pkce',
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      });
    }

    return supabase;
  }

  function saveSession(session) {
    if (!session?.access_token || !session?.refresh_token) {
      return;
    }

    ensureDirectory(sessionPath);
    fs.writeFileSync(sessionPath, JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    }, null, 2), 'utf8');
  }

  function clearSession() {
    try {
      fs.rmSync(sessionPath, { force: true });
    } catch (_error) {
      // ignore
    }
  }

  function loadPreferences() {
    const stored = safeReadJson(preferencesPath);
    state.preferences = {
      autoLogin: Boolean(stored?.autoLogin),
    };
  }

  function savePreferences() {
    ensureDirectory(preferencesPath);
    fs.writeFileSync(preferencesPath, JSON.stringify({
      autoLogin: Boolean(state.preferences?.autoLogin),
    }, null, 2), 'utf8');
  }

  function setAutoLogin(enabled) {
    state.preferences = {
      autoLogin: Boolean(enabled),
    };
    savePreferences();
    return emit();
  }

  async function ensureProfile(user) {
    if (!supabase || !user?.id) {
      return null;
    }

    let { data: profile, error: selectError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (selectError) {
      throw new Error(`Profil konnte nicht gelesen werden: ${selectError.message}`);
    }

    if (profile) {
      return profile;
    }

    const { error: insertError } = await supabase
      .from('profiles')
      .insert(buildProfileInsertPayload(user));

    if (insertError && insertError.code !== '23505') {
      throw new Error(`Profil konnte nicht angelegt werden: ${insertError.message}`);
    }

    const { data: insertedProfile, error: insertedProfileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (insertedProfileError) {
      throw new Error(`Profil konnte nach dem Anlegen nicht gelesen werden: ${insertedProfileError.message}`);
    }

    return insertedProfile || null;
  }

  async function refreshStateFromSupabase() {
    const client = ensureClient();
    if (!client) {
      resetAuthState({ keepConfigured: false });
      state.configured = false;
      state.configError = 'Supabase-Zugangsdaten fehlen in auth.js.';
      return emit();
    }

    const { data: userData, error: userError } = await client.auth.getUser();
    if (userError || !userData?.user) {
      resetAuthState();
      clearSession();
      return emit();
    }

    const user = userData.user;
    const profile = await ensureProfile(user);
    const role = normalizeRole(profile?.role);
    const blocked = Boolean(profile?.blocked);

    state.session = {
      loggedIn: true,
      userId: user.id,
      email: user.email || null,
      displayName: pickDisplayName(user, profile),
      avatarUrl: pickAvatarUrl(user, profile),
    };
    state.access = {
      role,
      blocked,
      features: blocked ? createEmptyFeatures() : resolveFeatures(role),
      message: buildStatusMessage({
        configured: state.configured,
        session: { loggedIn: true },
        access: { role, blocked },
      }),
    };

    const { data: sessionData } = await client.auth.getSession();
    if (sessionData?.session) {
      saveSession(sessionData.session);
    }

    return emit();
  }

  async function restoreSession() {
    const client = ensureClient();
    if (!client) {
      return emit();
    }

    const savedSession = safeReadJson(sessionPath);
    if (!savedSession?.access_token || !savedSession?.refresh_token) {
      resetAuthState();
      return emit();
    }

    const { data, error } = await client.auth.setSession({
      access_token: savedSession.access_token,
      refresh_token: savedSession.refresh_token,
    });

    if (error || !data?.session) {
      clearSession();
      resetAuthState();
      return emit();
    }

    saveSession(data.session);
    return refreshStateFromSupabase();
  }

  async function initialize() {
    resetAuthState({ keepConfigured: false });
    loadPreferences();
    ensureClient();
    if (!state.configured) {
      return emit();
    }
    try {
      return await restoreSession();
    } catch (error) {
      state.configured = true;
      state.configError = error?.message || 'Supabase-Initialisierung fehlgeschlagen.';
      state.session = {
        loggedIn: false,
        userId: null,
        email: null,
        displayName: null,
        avatarUrl: null,
      };
      state.access = {
        role: 'public',
        blocked: false,
        features: createEmptyFeatures(),
        message: state.configError,
      };
      clearSession();
      return emit();
    }
  }

  async function signOut() {
    if (supabase) {
      await supabase.auth.signOut();
    }
    clearSession();
    resetAuthState();
    return emit();
  }

  async function signInWithDiscord(options = {}) {
    if (authFlowPromise) {
      return authFlowPromise;
    }

    authFlowPromise = (async () => {
      if (Object.prototype.hasOwnProperty.call(options, 'autoLogin')) {
        setAutoLogin(options.autoLogin);
      }

      const client = ensureClient();
      if (!client) {
        throw new Error(state.configError || 'Supabase ist nicht konfiguriert.');
      }

      setLoading(true);

      const server = http.createServer();
      const oauthResult = await new Promise((resolve, reject) => {
        let settled = false;
        let authWindow = null;

        const closeAuthWindow = () => {
          if (authWindow && !authWindow.isDestroyed()) {
            authWindow.close();
          }
          authWindow = null;
        };

        const timeout = setTimeout(() => {
          if (!settled) {
            settled = true;
            closeAuthWindow();
            server.close(() => reject(new Error('Discord-Login Zeitueberschreitung.')));
          }
        }, OAUTH_TIMEOUT_MS);

        server.on('request', async (req, res) => {
          try {
            const requestUrl = new URL(req.url, 'http://127.0.0.1');
            if (requestUrl.pathname !== '/auth/callback') {
              res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
              res.end('Not found');
              return;
            }

            const authError = requestUrl.searchParams.get('error_description') || requestUrl.searchParams.get('error');
            if (authError) {
              res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
              res.end('<h1>Login fehlgeschlagen</h1><p>Du kannst dieses Fenster jetzt schliessen.</p>');
              if (!settled) {
                settled = true;
                clearTimeout(timeout);
                closeAuthWindow();
                server.close(() => reject(new Error(authError)));
              }
              return;
            }

            const code = requestUrl.searchParams.get('code');
            if (!code) {
              res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
              res.end('<h1>Login fehlgeschlagen</h1><p>Kein Auth-Code erhalten.</p>');
              if (!settled) {
                settled = true;
                clearTimeout(timeout);
                closeAuthWindow();
                server.close(() => reject(new Error('Kein Auth-Code erhalten.')));
              }
              return;
            }

            const { data, error } = await client.auth.exchangeCodeForSession(code);
            if (error || !data?.session) {
              res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
              res.end('<h1>Login fehlgeschlagen</h1><p>Session konnte nicht erstellt werden.</p>');
              if (!settled) {
                settled = true;
                clearTimeout(timeout);
                closeAuthWindow();
                server.close(() => reject(error || new Error('Session konnte nicht erstellt werden.')));
              }
              return;
            }

            saveSession(data.session);
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <title>Login erfolgreich</title>
</head>
<body style="font-family:Segoe UI,sans-serif;padding:24px;line-height:1.5;">
  <h1>Login erfolgreich</h1>
  <p>Dieses Fenster schliesst sich in 5 Sekunden automatisch. Du kannst jetzt zur Livemap zurueckkehren.</p>
  <script>
    window.setTimeout(() => {
      window.close();
      window.open('', '_self');
      window.close();
    }, 5000);
  </script>
</body>
</html>`);
            if (!settled) {
              settled = true;
              clearTimeout(timeout);
              closeAuthWindow();
              server.close(() => resolve(data.session));
            }
          } catch (error) {
            if (!settled) {
              settled = true;
              clearTimeout(timeout);
              closeAuthWindow();
              server.close(() => reject(error));
            }
          }
        });

        server.listen(0, '127.0.0.1', async () => {
          try {
            const { port } = server.address();
            const redirectTo = `http://127.0.0.1:${port}/auth/callback`;
            const { data, error } = await client.auth.signInWithOAuth({
              provider: 'discord',
              options: {
                redirectTo,
                scopes: 'identify email',
                skipBrowserRedirect: true,
              },
            });

            if (error || !data?.url) {
              throw error || new Error('Discord-Login URL konnte nicht erstellt werden.');
            }

            authWindow = new BrowserWindow({
              width: 520,
              height: 760,
              show: false,
              autoHideMenuBar: true,
              title: 'Discord Login',
              webPreferences: {
                contextIsolation: true,
                nodeIntegration: false,
                sandbox: true,
              },
            });

            authWindow.once('ready-to-show', () => {
              authWindow?.show();
            });

            authWindow.on('closed', () => {
              authWindow = null;
              if (!settled) {
                settled = true;
                clearTimeout(timeout);
                server.close(() => reject(new Error('Login-Fenster wurde geschlossen.')));
              }
            });

            authWindow.webContents.setWindowOpenHandler(({ url }) => {
              shell.openExternal(url);
              return { action: 'deny' };
            });

            await authWindow.loadURL(data.url);
          } catch (error) {
            if (!settled) {
              settled = true;
              clearTimeout(timeout);
              if (authWindow && !authWindow.isDestroyed()) {
                authWindow.close();
              }
              server.close(() => reject(error));
            }
          }
        });
      });

      await refreshStateFromSupabase();
      return oauthResult;
    })();

    try {
      return await authFlowPromise;
    } finally {
      authFlowPromise = null;
      setLoading(false);
    }
  }

  async function refreshAccess() {
    if (!state.configured) {
      ensureClient();
    }
    setLoading(true);
    try {
      return await refreshStateFromSupabase();
    } finally {
      setLoading(false);
    }
  }

  async function listProfiles() {
    if (!state.access.features.admin) {
      throw new Error('Adminrechte erforderlich.');
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  }

  async function updateProfileAccess(payload) {
    if (!state.access.features.admin) {
      throw new Error('Adminrechte erforderlich.');
    }

    const userId = String(payload?.userId || '');
    if (!userId) {
      throw new Error('userId fehlt.');
    }

    const updatePayload = sanitizeProfileUpdate({
      ...payload,
    });

    const { data, error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', userId)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    if (userId === state.session.userId) {
      await refreshStateFromSupabase();
    } else {
      emit();
    }

    return data;
  }

  function hasFeature(featureKey) {
    return Boolean(state.access.features[featureKey]);
  }

  return {
    initialize,
    signInWithDiscord,
    signOut,
    refreshAccess,
    setAutoLogin,
    listProfiles,
    updateProfileAccess,
    hasFeature,
    getState: () => emit(),
  };
}

module.exports = {
  createAuthManager,
  normalizeRole,
  resolveFeatures,
};
