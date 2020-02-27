// 新标签打开某个链接
function openUrlNewTab(data) {
    chrome.tabs.create({url: data.url}, function (tab) {
        chrome.storage.local.set({[data.orderId]: tab.id}, function () {
            console.log(`${data.orderId}'s tab set to ` + tab.id);
        });
    });
}

// 当前标签打开某个链接
function openUrlCurrentTab(url, callback) {
    getCurrentTabId(tabId => {
        chrome.tabs.update(tabId, { url: url }, function(tab) {
            if(callback) {
                callback(tab.id);
            }
        });
    })
}

// 关闭指定tab
function closeTabs(tabId) {
    chrome.tabs.remove(tabId);
}

// 刷新指定tab
function reloadTab(tabId) {
    chrome.tabs.reload(tabId);
}

// 定时刷新指定tab
function autoRefreshTab(tabId, interval) {
    setInterval(() => {
        console.log("reloading:");
        reloadTab(tabId)
    }, interval);
}

// 获取当前选项卡ID
function getCurrentTabId(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (callback) callback(tabs.length ? tabs[0].id : null);
    });
}