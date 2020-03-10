// 获取当前标签页(处于背景页等会获取失败)
function getCurrentTabIdAsync() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (chrome.runtime.lastError) {
                var errorMsg = chrome.runtime.lastError.message
                reject(errorMsg);
                return;
            }
            resolve(tabs.length ? tabs[0].id : null);
        });
    });
}

// 检查指定id的tab是否存在
function checkTabExistAsync(tabId) {
    return new Promise(
        (resolve, reject) => {
            chrome.tabs.get(tabId, function (tab) {
                if (chrome.runtime.lastError) {
                    var errorMsg = chrome.runtime.lastError.message
                    reject(errorMsg);
                    return;
                }
                resolve(true);
            });
        }
    );
}

// 当前标签打开某个链接,返回打开的tabid
function openUrlCurrentTabAsync(url) {
    return new Promise((resolve, reject) => {
        getCurrentTabIdAsync().then((tabId) => {
            chrome.tabs.update(tabId, { url: url }, function (tab) {
                if (chrome.runtime.lastError) {
                    var errorMsg = chrome.runtime.lastError.message
                    reject(errorMsg);
                    return;
                }
                resolve(tab.id);
            });
        })
    });
}