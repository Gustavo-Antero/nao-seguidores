(() => {
  // Evita registrar os listeners duas vezes quando o popup injeta o script de novo.
  if (window.__naoSeguidoresLoaded) return;
  window.__naoSeguidoresLoaded = true;

  const APP_ID = '936619743392459';
  const PORT_NAME = 'nao-seguidores';

  const state = {
    running: false,
    phase: 'idle', // idle | following | followers | done
    done: 0,
    total: 0,
    error: null,
    result: null
  };
  const ports = new Set();

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  // Pausa aleatória entre páginas para não parecer um robô e evitar bloqueio.
  const pause = () => sleep(900 + Math.random() * 1100);

  function readCookie(name) {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  }

  function broadcast() {
    for (const port of ports) {
      try {
        port.postMessage({ type: 'state', state });
      } catch (e) {
        ports.delete(port);
      }
    }
  }

  async function api(path) {
    const res = await fetch('https://www.instagram.com' + path, {
      credentials: 'include',
      headers: {
        'x-ig-app-id': APP_ID,
        'x-requested-with': 'XMLHttpRequest',
        accept: '*/*'
      }
    });
    if (res.status === 429) throw new Error('RATE_LIMIT');
    if (res.status === 401 || res.status === 403) throw new Error('AUTH');
    if (!res.ok) throw new Error('HTTP_' + res.status);

    const json = await res.json();
    if (json && json.status === 'fail') {
      const msg = String(json.message || '').toLowerCase();
      if (msg.includes('wait') || msg.includes('limit')) throw new Error('RATE_LIMIT');
      if (msg.includes('login') || msg.includes('checkpoint')) throw new Error('AUTH');
      throw new Error('FAIL');
    }
    return json;
  }

  function slimUser(u) {
    return {
      id: String(u.pk || u.id),
      username: u.username,
      name: u.full_name || '',
      pic: u.profile_pic_url || '',
      verified: !!u.is_verified,
      private: !!u.is_private
    };
  }

  async function listAll(userId, kind) {
    const users = [];
    let maxId = '';
    do {
      const query = '?count=100' + (maxId ? '&max_id=' + encodeURIComponent(maxId) : '');
      const data = await api('/api/v1/friendships/' + userId + '/' + kind + '/' + query);
      for (const u of data.users || []) users.push(slimUser(u));
      state.done = users.length;
      broadcast();
      maxId = data.next_max_id ? String(data.next_max_id) : '';
      if (maxId) await pause();
    } while (maxId);
    return users;
  }

  async function scan() {
    if (state.running) return;
    Object.assign(state, {
      running: true,
      phase: 'following',
      done: 0,
      total: 0,
      error: null,
      result: null
    });
    broadcast();

    try {
      const userId = readCookie('ds_user_id');
      if (!userId) throw new Error('NOT_LOGGED');

      // Os totais servem só para a barra de progresso e para mostrar o nome de usuário.
      let username = '';
      let counts = { followers: 0, following: 0 };
      try {
        const info = await api('/api/v1/users/' + userId + '/info/');
        username = info.user.username || '';
        counts = {
          followers: info.user.follower_count || 0,
          following: info.user.following_count || 0
        };
      } catch (e) {
        if (e.message === 'RATE_LIMIT') throw e;
      }

      state.phase = 'following';
      state.total = counts.following;
      state.done = 0;
      broadcast();
      const following = await listAll(userId, 'following');

      await pause();

      state.phase = 'followers';
      state.total = counts.followers;
      state.done = 0;
      broadcast();
      const followers = await listAll(userId, 'followers');

      const followerIds = new Set(followers.map((u) => u.id));
      const followingIds = new Set(following.map((u) => u.id));

      const result = {
        at: Date.now(),
        username,
        followersCount: followers.length,
        followingCount: following.length,
        notFollowingBack: following.filter((u) => !followerIds.has(u.id)),
        fans: followers.filter((u) => !followingIds.has(u.id))
      };

      state.result = result;
      state.phase = 'done';
      try {
        await chrome.storage.local.set({ result });
      } catch (e) {
        // Se não der para salvar, o resultado ainda chega ao popup pela conexão.
      }
    } catch (e) {
      state.error = e && e.message ? e.message : 'FAIL';
      state.phase = 'idle';
    } finally {
      state.running = false;
      broadcast();
    }
  }

  chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== PORT_NAME) return;
    ports.add(port);
    port.onDisconnect.addListener(() => ports.delete(port));
    port.onMessage.addListener((msg) => {
      if (msg && msg.type === 'start') scan();
    });
    port.postMessage({ type: 'state', state });
  });
})();
