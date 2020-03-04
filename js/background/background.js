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

function startSpider(dept, dest, deptDateFrom, deptDateTo) {
    // open a new tab
    deptCode = surpportCityCodeMap[dept];
    destCode = surpportCityCodeMap[dest];
    let url = `https://flights.ctrip.com/international/search/oneway-${deptCode}-${destCode}?depdate=${deptDateFrom}&cabin=y_s&adult=1&child=0&infant=0`;
    console.log(url);
    return new Promise(function(resolve){
        openUrlCurrentTab(url, (tabId) => {
            if(!tabId){
                resolve(false);
                return;
            }
            console.log(`${tabId} start, ${dept} -> ${dest} deptDate:${deptDateFrom}=>${deptDateTo}`);
            spiderInsts[tabId] = {}
            spiderInsts[tabId].isRunning = true;
            spiderInsts[tabId].dept = dept;
            spiderInsts[tabId].dest = dest;
            spiderInsts[tabId].deptDateFrom = deptDateFrom;
            spiderInsts[tabId].deptDateTo = deptDateTo;
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
            spiderInsts[tabId].deptDateFrom = '';
            spiderInsts[tabId].deptDateTo = '';
            spiderInsts[tabId].nextTick = 0;
            resolve(true);
        });
    })
}

queryConfig(); //立即触发一次  加载配置
setInterval(timerEvent, 20000);

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
    let tabId = sender.tab.id;
    console.log(`postResponse from tabid:${tabId}`);
    if (request.cmd === 'postResponse') {
        postResponse(tabId, request.data);
    }
});

function queryNextTick() {
    for (let tabId in spiderInsts) {
        let spider = spiderInsts[tabId];
        if (!spider)
            continue;
        if (spider.isRunning === true) {
            let dest = spider.dest;
            let dept = spider.dept;
            let deptDateFrom = spider.deptDateFrom;
            let deptDateTo = spider.deptDateTo;
            $.ajax({
                type: 'post',
                url: `${API_BASE}/spider/tick`,
                contentType: 'application/json;charset=utf-8',
                data: JSON.stringify({ dest: dest, dept: dept, deptFrom: deptDateFrom, deptTo: deptDateTo}),
                success: resp => {
                    if(resp.needRun === true) {
                        let deptDate = resp.params.deptDate;
                        let deptCode = surpportCityCodeMap[dept];
                        let destCode = surpportCityCodeMap[dest];
                        let url = `https://flights.ctrip.com/international/search/oneway-${deptCode}-${destCode}?depdate=${deptDate}&cabin=y_s&adult=1&child=0&infant=0`;
                        let updateProperties = { 'active': true,url:url };
                        chrome.tabs.update(parseInt(tabId), updateProperties);
                        // chrome.tabs.highlight([parseInt(tabId)]);
                        console.log(`${tabId} reloading, ${dept} -> ${dest} ${deptDate}`);
                    }
                    // spider.nextTick = nextTick;
                    // if (new Date().getTime() >= nextTick) {
                    //     // reloadTab(parseInt(tabId));
                    //     deptCode = surpportCityCodeMap[dept];
                    //     destCode = surpportCityCodeMap[dest];
                    //     let url = `https://flights.ctrip.com/international/search/oneway-${deptCode}-${destCode}?depdate=${deptDate}&cabin=y_s&adult=1&child=0&infant=0`;
                    //     let updateProperties = { 'active': true,url:url };
                    //     chrome.tabs.update(parseInt(tabId), updateProperties);
                    //     // chrome.tabs.highlight([parseInt(tabId)]);
                    //     console.log(`${tabId} reloading, ${dept} -> ${dest} ${deptDate}`);
                    // }
                    console.log(resp);
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

function checkParamsValid(dept, dest, deptDateFrom, deptDateTo) {
    if (_.isEmpty(surpportCityCodeMap)) {
        return false;
    }
    if (!deptDateFrom || !deptDateTo) {
        return false;
    }
    if (dept === dest) {
        return false;
    }
    return !!surpportCityCodeMap[dept] && !!surpportCityCodeMap[dest];
}

function postResponse(tabId, data) {
    let spider = spiderInsts[tabId];
    if (!spider) {
        console.log(`tabid ${tabId} spider instance not found`);
        return;
    }
    data.dept = spider.dept;
    data.dest = spider.dest;
    data.deptFrom = spider.deptDateFrom;
    data.deptTo = spider.deptDateTo;
    $.ajax({
        type: 'post',
        url: `${API_BASE}/spider/handle`,
        contentType: 'application/json;charset=utf-8',
        data: JSON.stringify(data),
        success: _ => {
        },
    });
}