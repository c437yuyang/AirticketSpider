function getCurrentTabIdAsync() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (chrome.runtime.lastError) {
                var errorMsg = chrome.runtime.lastError.message
                console.log(errorMsg);
                reject(false);
                return;
            }
            resolve(tabs.length ? tabs[0].id : null);
        });
    });
}