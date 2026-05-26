(function () {
  'use strict';

  const $ = id => document.getElementById(id);

  let cachedTitle = '';
  let cachedSubtitle = null;
  let cachedSettings = {};

  // 格式化工具
  function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function formatSRTTime(seconds) {
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(Math.floor(seconds % 60)).padStart(2, '0');
    const ms = String(Math.floor((seconds % 1) * 1000)).padStart(3, '0');
    return `${h}:${m}:${s},${ms}`;
  }

  // 按原时间戳分组字幕，组内用空格分隔
  function buildParagraphs(body) {
    const GROUP = 12;
    const groups = [];
    for (let i = 0; i < body.length; i += GROUP) {
      const slice = body.slice(i, i + GROUP);
      groups.push({
        content: slice.map(item => item.content).join(' '),
        from: slice[0].from,
      });
    }
    return groups;
  }

  function toMarkdown(title, data, settings) {
    const url = `https://www.bilibili.com/video/${data.bvid}`;
    const lines = buildParagraphs(data.body).map(p =>
      settings.includeTimestamp
        ? `**${formatTime(p.from)}** ${p.content}`
        : p.content
    );
    return [
      `# ${title}`,
      '',
      `> [!info] 视频信息`,
      `> **标题**: ${title}`,
      `> **链接**: ${url}`,
      `> **获取时间**: ${new Date().toLocaleString('zh-CN')}`,
      '',
      '## 字幕内容',
      '',
      lines.join('\n\n'),
    ].join('\n');
  }

  function toSRT(data) {
    return data.body.map((item, i) =>
      `${i + 1}\n${formatSRTTime(item.from)} --> ${formatSRTTime(item.to)}\n${item.content}\n`
    ).join('\n');
  }

  function toText(data) {
    return buildParagraphs(data.body).map(p => p.content).join('\n\n');
  }

  // API 请求（通过 background proxy，带 cookie）
  function fetchJSON(url) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'fetch_json', url }, resp => {
        if (resp && resp.success) resolve(resp.data);
        else reject(new Error(resp?.error || '请求失败'));
      });
    });
  }

  // 获取字幕核心逻辑
  async function fetchSubtitle(bvid) {
    // 1. 获取视频信息（aid, cid, title）
    const view = await fetchJSON(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`);
    if (view.code !== 0) throw new Error('获取视频信息失败: ' + (view.message || ''));

    const { aid, cid, title } = view.data;

    // 2. 获取字幕列表
    const player = await fetchJSON(`https://api.bilibili.com/x/player/wbi/v2?aid=${aid}&cid=${cid}`);
    if (player.code !== 0) throw new Error('获取播放信息失败: ' + (player.message || ''));

    const subtitles = player.data?.subtitle?.subtitles;
    if (!subtitles || subtitles.length === 0) {
      throw new Error('该视频没有字幕');
    }

    // 优先中文
    const target =
      subtitles.find(s => s.lan === 'zh-CN' || s.lan === 'ai-zh') ||
      subtitles.find(s => s.lan.startsWith('zh')) ||
      subtitles[0];

    if (!target?.subtitle_url) throw new Error('字幕 URL 为空');

    const subtitleUrl = target.subtitle_url.startsWith('http')
      ? target.subtitle_url
      : `https:${target.subtitle_url}`;

    // 3. 下载字幕内容
    const subtitleData = await fetchJSON(subtitleUrl);

    return { title, subtitleData: { ...subtitleData, bvid } };
  }

  // UI 操作
  function setStatus(text, type = '') {
    const el = $('status');
    el.textContent = text;
    el.className = 'status' + (type ? ' ' + type : '');
  }

  function showResult(title, data) {
    cachedTitle = title;
    cachedSubtitle = data;

    const preview = $('preview');
    const groups = buildParagraphs(data.body).slice(0, 6);
    preview.innerHTML = groups.map(p =>
      `<div><span class="time">[${formatTime(p.from)}]</span>${p.content}</div>`
    ).join('');

    if (data.body.length > 8) {
      preview.innerHTML += `<div class="more">... 共 ${data.body.length} 条字幕</div>`;
    }

    $('result').classList.add('show');
  }

  // 事件绑定
  $('fetchBtn').addEventListener('click', async () => {
    const btn = $('fetchBtn');
    btn.disabled = true;
    btn.textContent = '获取中...';
    setStatus('正在获取字幕...');

    try {
      const tab = (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
      const url = new URL(tab.url);
      const bvid = url.pathname.match(/BV[\w]+/)?.[0];

      if (!bvid) {
        setStatus('请在 B 站视频页面使用', 'error');
        return;
      }

      const { title, subtitleData } = await fetchSubtitle(bvid);
      showResult(title, subtitleData);
      setStatus(`已获取 ${subtitleData.body.length} 条字幕`, 'success');
    } catch (err) {
      setStatus(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '获取字幕';
    }
  });

  $('btnObsidian').addEventListener('click', async () => {
    if (!cachedSubtitle) return;
    const settings = await loadSettings();
    const content = toMarkdown(cachedTitle, cachedSubtitle, settings);
    const encoded = encodeURIComponent(content);
    const encodedTitle = encodeURIComponent(cachedTitle);

    let params = '';
    if (settings.vaultName) params += `vault=${encodeURIComponent(settings.vaultName)}&`;
    params += `name=${encodedTitle}&content=${encoded}&overwrite=true`;

    window.location.href = `obsidian://new?${params}`;
  });

  $('btnCopy').addEventListener('click', async () => {
    if (!cachedSubtitle) return;
    const settings = await loadSettings();
    const content = toMarkdown(cachedTitle, cachedSubtitle, settings);
    await navigator.clipboard.writeText(content);

    const btn = $('btnCopy');
    const orig = btn.textContent;
    btn.textContent = '✓ 已复制';
    setTimeout(() => btn.textContent = orig, 2000);
  });

  $('btnSRT').addEventListener('click', () => {
    if (!cachedSubtitle) return;
    download(`${cachedTitle}.srt`, toSRT(cachedSubtitle));
  });

  $('btnTXT').addEventListener('click', () => {
    if (!cachedSubtitle) return;
    download(`${cachedTitle}.txt`, toText(cachedSubtitle));
  });

  function download(filename, content) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // 设置
  function loadSettings() {
    return new Promise(resolve => {
      chrome.storage.sync.get(
        { vaultName: '', noteFolder: '', includeTimestamp: true },
        resolve
      );
    });
  }

  $('settingsBtn').addEventListener('click', () => {
    $('settingsPanel').classList.toggle('show');
  });

  $('saveSettingsBtn').addEventListener('click', () => {
    chrome.storage.sync.set({
      vaultName: $('vaultName').value.trim(),
      noteFolder: $('noteFolder').value.trim(),
      includeTimestamp: $('includeTimestamp').checked,
    }, () => {
      $('savedHint').style.display = 'block';
      setTimeout(() => $('savedHint').style.display = 'none', 2000);
    });
  });

  // 初始化：检测当前页面
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const tab = tabs[0];
    if (!tab?.url?.includes('bilibili.com/video/')) {
      $('notBilibili').style.display = 'block';
      $('mainContent').style.display = 'none';
      return;
    }

    const url = new URL(tab.url);
    const bvid = url.pathname.match(/BV[\w]+/)?.[0];
    $('videoBadge').textContent = bvid || '';

    // 从 tab title 提取视频标题
    const title = tab.title?.replace('_哔哩哔哩_bilibili', '').trim() || '未知视频';
    $('videoTitle').textContent = title;

    // 加载设置
    loadSettings().then(settings => {
      $('vaultName').value = settings.vaultName;
      $('noteFolder').value = settings.noteFolder;
      $('includeTimestamp').checked = settings.includeTimestamp;
    });
  });
})();
