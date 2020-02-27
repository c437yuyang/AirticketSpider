// background.js
chrome.runtime.onInstalled.addListener(function () {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
        chrome.declarativeContent.onPageChanged.addRules([
            {
                conditions: [
                    new chrome.declarativeContent.PageStateMatcher({pageUrl: {urlContains: 'https://flights.ctrip.com/international/search'}})
                ],
                actions: [new chrome.declarativeContent.ShowPageAction()]
            }
        ]);
    });
});

let loginUser = undefined;
chrome.storage.local.remove('loginUser', _ => {
});

// 开启时钟 每隔一定时间向content-script发送刷新消息
// let interval = randomNum(8 * 1000 * 60, 10 * 1000 * 60);
let interval = randomNum(8 * 1000, 10 * 1000);
// let interval = randomNum(10, 20) * 1000;
let next_refresh = new Date().getTime() + interval;
let activeTabId = -1;
console.log(interval);
setTimeout(timerEvent, interval);

function setActiveTabId(id) { //必须要这样设置，不然popup.js直接bg.activeTabId = id 不生效不知道为什么
    activeTabId = id;
}

function get_next_refresh() { //这里必须要这样返回，不然popup里面直接获取next_refresh,每次都重新执行new Date().getTime()+interval,会得到不一样的值
    return next_refresh;
}

function timerEvent() {
    sendMessageToContentScript({'cmd': 'timerEvent'}, _ => {
    });
    let interval = randomNum(8 * 1000, 10 * 1000);
    // let interval = randomNum(10, 20) * 1000;
    next_refresh = new Date().getTime() + interval;
    console.log(interval);
    setTimeout(timerEvent, interval);
}

//向contentScript发送消息
function sendMessageToContentScript(message, callback) {
    console.log(activeTabId)
    if (activeTabId === -1)
        return;
    console.log(`active:${activeTabId}`);
    chrome.tabs.sendMessage(activeTabId, message, function (response) {
        if (callback) callback(response);
    });
}

// 监听来自content-script的消息
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log('收到来自content-script的消息：');
    console.log(request)
    if (request.cmd === 'OpenNewTab') {
        openUrlNewTab(request.data);
    }
    else if (request.cmd === 'CloseTab') {
        closeTabs(request.data)
    }
    else if (request.cmd === 'OpenUrlInCurTab') {
        openUrlCurrentTab(request.data)
    }

    sendResponse('我是后台，我已收到你的消息：' + JSON.stringify(request));
});


