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
var spiderInsts = {'a':'aa'};

chrome.storage.local.remove('loginUser', _ => {
});

function startSpider(dept, dest, deptDate) {
    // open a new tab
    // let url = `https://flights.ctrip.com/international/search/oneway-${dept}-${dest}?depdate=${deptDate}&cabin=y_s&adult=1&child=0&infant=0`;
    let url = `http://www.baidu.com`;
    openUrlCurrentTab(url, (tabId) => {
        console.log(`${tabId} start`);
        spiderInsts[tabId] = {}
        spiderInsts[tabId].isRunning = true;
        spiderInsts[tabId].dept = dept;
        spiderInsts[tabId].dest = dest;
        spiderInsts[tabId].deptDate = deptDate;
    });
}

function stopSpider() {
    getCurrentTabId((tabId) => {
        console.log(`${tabId} stop`);
        spiderInsts[tabId].isRunning = false;
        spiderInsts[tabId].dept = '';
        spiderInsts[tabId].dest = '';
        spiderInsts[tabId].deptDate = '';
    });
}

setInterval(timerEvent, 10000);

function setActiveTabId(id) { //必须要这样设置，不然popup.js直接bg.activeTabId = id 不生效不知道为什么
    activeTabId = id;
}

function timerEvent() {
    queryNextTick();
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

function queryNextTick() {
    for (let tabId in spiderInsts) {
        let spider = spiderInsts[tabId];
        if (!spider)
            continue;
        if (spider.isRunning === true) {
            let dest = spider.dest;
            let dept = spider.dept;
            let deptDate = spider.deptDate;
            $.ajax({
                type: 'post',
                url: `${API_BASE}/spider/queryNextTick`,
                contentType: 'application/x-www-form-urlencoded;charset=utf-8',
                data: { dest: dest, dept: dept, deptDate: deptDate },
                success: nextTick => {
                    if (new Date().getTime() >= nextTick) {
                        // reloadTab(tabId);
                        console.log(`${tabId} reloading`);
                    }
                },
            });
        }
    }
}