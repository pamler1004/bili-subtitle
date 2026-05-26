chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'fetch_json') {
    fetch(message.url, { credentials: 'include' })
      .then(res => res.json())
      .then(data => sendResponse({ success: true, data }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.type === 'open_obsidian') {
    chrome.tabs.create({ url: message.url });
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'get_current_tab') {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      sendResponse({ tab: tabs[0] || null });
    });
    return true;
  }
});
