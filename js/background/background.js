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
var spiderInsts = {};
var surpportCityCodeMap = undefined;

chrome.storage.local.remove('loginUser', _ => {
});

function startSpider(dept, dest, deptDate) {
    // open a new tab
    deptCode = surpportCityCodeMap[dept];
    destCode = surpportCityCodeMap[dest];
    let url = `https://flights.ctrip.com/international/search/oneway-${deptCode}-${destCode}?depdate=${deptDate}&cabin=y_s&adult=1&child=0&infant=0`;
    console.log(url);
    return new Promise(function(resolve){
        openUrlCurrentTab(url, (tabId) => {
            if(!tabId){
                resolve(false);
                return;
            }
            console.log(`${tabId} start, ${dept} -> ${dest} ${deptDate}`);
            spiderInsts[tabId] = {}
            spiderInsts[tabId].isRunning = true;
            spiderInsts[tabId].dept = dept;
            spiderInsts[tabId].dest = dest;
            spiderInsts[tabId].deptDate = deptDate;
            resolve(true);
        });
    });
    // let url = `http://www.baidu.com`;
    
}

function stopSpider() {
    return new Promise(function (resolve) {
        getCurrentTabId((tabId) => {
            if (!tabId) {
                resolve(false);
                return;
            }
            console.log(`${tabId} stop`);
            spiderInsts[tabId].isRunning = false;
            spiderInsts[tabId].dept = '';
            spiderInsts[tabId].dest = '';
            spiderInsts[tabId].deptDate = '';
            resolve(true);
        });
    })
}

setInterval(timerEvent, 10000);


function timerEvent() {
    queryNextTick();
    queryConfig();
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
                data: { dest: dest, dept: dept, deptDate: deptDate},
                success: nextTick => {
                    spider.nextTick = nextTick;
                    if (new Date().getTime() >= nextTick) {
                        reloadTab(parseInt(tabId));
                        console.log(`${tabId} reloading, ${dept} -> ${dest} ${deptDate}`);
                    }
                },
            });
        }
    }
}

function queryConfig() {
    $.ajax({
        type: 'get',
        url: `${API_BASE}/spider/queryConfig`,
        success: config => {
            surpportCityCodeMap = config.surpportCityCodeMap;
        },
    });
}

function checkParamsValid(dept, dest, deptDate) {
    if (_.isEmpty(surpportCityCodeMap)) {
        return false;
    }
    if (!deptDate) {
        return false;
    }
    if (dept === dest) {
        return false;
    }
    return !!surpportCityCodeMap[dept] && !!surpportCityCodeMap[dest];
}