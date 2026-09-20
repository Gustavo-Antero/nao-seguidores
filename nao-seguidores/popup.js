const IG = 'https://www.instagram.com/';
const $ = (id) => document.getElementById(id);

let onInstagram = false;
let port = null;
let data = null;
let ignored = new Set();
let currentTab = 'notBack';
let scanState = { running: false, phase: 'idle', done: 0, total: 0, error: null };

const ERRORS = {
  NOT_LOGGED: 'Você precisa estar logado no Instagram nesta aba.',
  RATE_LIMIT: 'O Instagram limitou as requisições. Espere alguns minutos e tente de novo.',
  AUTH: 'Sessão inválida. Recarregue o Instagram, confirme que está logado e tente de novo.',
  INJECT: 'Não consegui acessar esta aba. Recarregue a página do Instagram e abra a extensão de novo.'
};

function errorText(code) {
  return ERRORS[code] || 'Algo deu errado (' + code + '). Tente de novo em alguns minutos.';
}

/* Estado do escaneamento */

function renderScan() {
  const btn = $('scanBtn');
  const status = $('status');
  const progress = $('progress');

  if (!onInstagram) {
    btn.dataset.mode = 'open';
    btn.disabled = false;
    btn.textContent = 'Abrir o Instagram';
    status.textContent = 'Abra o instagram.com e entre na sua conta para escanear.';
    progress.hidden = true;
    return;
  }

  btn.dataset.mode = 'scan';

  if (scanState.running) {
    btn.disabled = true;
    btn.textContent = 'Escaneando...';
    progress.hidden = false;
    const label = scanState.phase === 'followers' ? 'Lendo seus seguidores' : 'Lendo quem você segue';
    status.textContent = scanState.total
      ? label + ': ' + scanState.done + ' de ' + scanState.total
      : label + ': ' + scanState.done;
    const step = scanState.phase === 'followers' ? 1 : 0;
    const frac = scanState.total ? Math.min(scanState.done / scanState.total, 1) : 0;
    $('bar').style.width = ((step + frac) / 2) * 100 + '%';
    return;
  }

  progress.hidden = true;
  btn.disabled = false;
  btn.textContent = data ? 'Escanear de novo' : 'Escanear agora';
  status.textContent = scanState.error ? errorText(scanState.error) : '';
}

/* Listas */

function ignoredUsers() {
  return data ? data.notFollowingBack.filter((u) => ignored.has(u.username)) : [];
}

function visibleUsers() {
  if (!data) return [];
  let list;
  if (currentTab === 'notBack') list = data.notFollowingBack.filter((u) => !ignored.has(u.username));
  else if (currentTab === 'ignored') list = ignoredUsers();
  else list = data.fans;

  const q = $('search').value.trim().toLowerCase().replace(/^@/, '');
  if (q) {
    list = list.filter((u) => u.username.toLowerCase().includes(q) || u.name.toLowerCase().includes(q));
  }
  return list;
}

function buildRow(u) {
  const li = document.createElement('li');

  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  const showInitial = () => { avatar.textContent = u.username.charAt(0).toUpperCase(); };
  if (u.pic) {
    const img = document.createElement('img');
    img.alt = '';
    img.loading = 'lazy';
    img.referrerPolicy = 'no-referrer';
    img.addEventListener('error', () => { img.remove(); showInitial(); });
    img.src = u.pic;
    avatar.appendChild(img);
  } else {
    showInitial();
  }

  const info = document.createElement('div');
  info.className = 'info';
  const link = document.createElement('a');
  link.href = IG + encodeURIComponent(u.username) + '/';
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = u.username;
  const sub = document.createElement('div');
  sub.className = 'sub';
  if (u.name) {
    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = u.name;
    sub.appendChild(name);
  }
  if (u.verified) sub.appendChild(tag('verificado'));
  if (u.private) sub.appendChild(tag('privado'));
  info.append(link, sub);

  li.append(avatar, info);

  if (currentTab !== 'fans') {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'row-btn';
    btn.textContent = currentTab === 'ignored' ? 'Restaurar' : 'Ignorar';
    btn.addEventListener('click', () => toggleIgnore(u.username));
    li.appendChild(btn);
  }
  return li;
}

function tag(text) {
  const span = document.createElement('span');
  span.className = 'tag';
  span.textContent = text;
  return span;
}

const EMPTY = {
  notBack: 'Ninguém por aqui. Todo mundo que você segue também segue você.',
  fans: 'Você já segue de volta todo mundo que segue você.',
  ignored: 'Nenhum perfil ignorado. Use Ignorar para tirar alguém da lista principal.'
};

function renderResults() {
  $('results').hidden = !data;
  if (!data) return;

  const ignoredCount = ignoredUsers().length;
  $('heroNum').textContent = data.notFollowingBack.length - ignoredCount;
  $('cNotBack').textContent = data.notFollowingBack.length - ignoredCount;
  $('cFans').textContent = data.fans.length;
  $('cIgnored').textContent = ignoredCount;

  const who = data.username ? '@' + data.username + ' segue ' : 'Você segue ';
  $('meta').textContent =
    who + data.followingCount + ' e tem ' + data.followersCount + ' seguidores. Verificado em ' +
    new Date(data.at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) + '.';

  document.querySelectorAll('#tabs button').forEach((b) => {
    b.setAttribute('aria-selected', String(b.dataset.tab === currentTab));
  });

  const list = $('list');
  list.replaceChildren();
  const users = visibleUsers();
  if (!users.length) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = $('search').value.trim() ? 'Nenhum resultado para essa busca.' : EMPTY[currentTab];
    list.appendChild(li);
  } else {
    const frag = document.createDocumentFragment();
    users.forEach((u) => frag.appendChild(buildRow(u)));
    list.appendChild(frag);
  }
}

function render() {
  renderScan();
  renderResults();
}

/* Ações */

async function toggleIgnore(username) {
  if (ignored.has(username)) ignored.delete(username);
  else ignored.add(username);
  await chrome.storage.local.set({ ignored: [...ignored] });
  renderResults();
}

async function copyList() {
  const users = visibleUsers();
  if (!users.length) return;
  await navigator.clipboard.writeText(users.map((u) => '@' + u.username).join('\n'));
  const btn = $('copyBtn');
  btn.textContent = 'Copiado';
  setTimeout(() => { btn.textContent = 'Copiar lista'; }, 1500);
}

function csvCell(value) {
  return '"' + String(value).replace(/"/g, '""') + '"';
}

function downloadCsv() {
  const users = visibleUsers();
  if (!users.length) return;
  const rows = [['usuario', 'nome', 'verificado', 'privado', 'link']];
  users.forEach((u) => {
    rows.push([u.username, u.name, u.verified ? 'sim' : 'nao', u.private ? 'sim' : 'nao', IG + u.username + '/']);
  });
  const csv = '\uFEFF' + rows.map((r) => r.map(csvCell).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'nao-seguidores-' + currentTab + '.csv';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

$('scanBtn').addEventListener('click', () => {
  if ($('scanBtn').dataset.mode === 'open') {
    chrome.tabs.create({ url: IG });
    return;
  }
  if (!port) return;
  scanState = { ...scanState, error: null };
  port.postMessage({ type: 'start' });
});

$('tabs').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-tab]');
  if (!btn) return;
  currentTab = btn.dataset.tab;
  renderResults();
});

$('search').addEventListener('input', renderResults);
$('copyBtn').addEventListener('click', copyList);
$('csvBtn').addEventListener('click', downloadCsv);

/* Início */

async function init() {
  const saved = await chrome.storage.local.get(['result', 'ignored']);
  data = saved.result || null;
  ignored = new Set(saved.ignored || []);

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  onInstagram = !!(tab && tab.url && tab.url.startsWith(IG));

  if (onInstagram) {
    try {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
      port = chrome.tabs.connect(tab.id, { name: 'nao-seguidores' });
      port.onMessage.addListener((msg) => {
        if (msg.type !== 'state') return;
        scanState = msg.state;
        if (msg.state.result) data = msg.state.result;
        render();
      });
    } catch (e) {
      scanState = { ...scanState, error: 'INJECT' };
    }
  }
  render();
}

init();
