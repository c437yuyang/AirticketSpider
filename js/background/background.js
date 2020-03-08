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

function getReturnDate(deptDate, returnAfterDays) {
    let _deptDate = moment(deptDate);
    return _deptDate.add(returnAfterDays, 'days').format('YYYY-MM-DD');
}

function startSpider(dept, dest, deptDateFrom, deptDateTo, spiderType, returnAfterDays) {
    if (spiderType === '单程') {
        return startSingleSpider(dept, dest, deptDateFrom, deptDateTo);
    } else {
        return startRoundSpider(dept, dest, deptDateFrom, deptDateTo, returnAfterDays);
    }
}

function getSpiderUrl(spiderInst, deptDate) {
    if (!spiderInst) {
        return;
    }
    let dest = spiderInst.dest;
    let dept = spiderInst.dept;
    let deptDateFrom = spiderInst.deptDateFrom;
    let deptCode = surpportCityCodeMap[dept];
    let destCode = surpportCityCodeMap[dest];
    if (spiderInst.spiderType === "单程") {
        return `https://flights.ctrip.com/international/search/oneway-${deptCode}-${destCode}?depdate=${deptDate}&cabin=y_s&adult=1&child=0&infant=0`;
    } else {
        let returnDate = getReturnDate(deptDate, spiderInst.returnAfterDays);
        return `https://flights.ctrip.com/international/search/round-${deptCode}-${destCode}?depdate=${deptDate}_${returnDate}&cabin=y_s&adult=1&child=0&infant=0&isbuildup=1`;
    }
}

function startSingleSpider(dept, dest, deptDateFrom, deptDateTo) {
    // open a new tab
    deptCode = surpportCityCodeMap[dept];
    destCode = surpportCityCodeMap[dest];

    let singleUrl = `https://flights.ctrip.com/international/search/oneway-${deptCode}-${destCode}?depdate=${deptDateFrom}&cabin=y_s&adult=1&child=0&infant=0`;
    console.log(singleUrl);
    return new Promise(function(resolve){
        openUrlCurrentTab(singleUrl, (tabId) => {
            if(!tabId){
                resolve(false);
                return;
            }
            console.log(`${tabId} start, ${dept} -> ${dest} deptDate:${deptDateFrom}=>${deptDateTo}`);
            spiderInsts[tabId] = {}
            spiderInsts[tabId].spiderType = '单程';
            spiderInsts[tabId].isRunning = true;
            spiderInsts[tabId].dept = dept;
            spiderInsts[tabId].dest = dest;
            spiderInsts[tabId].deptDateFrom = deptDateFrom;
            spiderInsts[tabId].deptDateTo = deptDateTo;
            resolve(true);
        });
    });
}

function startRoundSpider(dept, dest, deptDateFrom, deptDateTo, returnAfterDays) {
    // open a new tab
    deptCode = surpportCityCodeMap[dept];
    destCode = surpportCityCodeMap[dest];
    
    let returnDate = getReturnDate(deptDateFrom, returnAfterDays); 
    let roundUrl = `https://flights.ctrip.com/international/search/round-${deptCode}-${destCode}?depdate=${deptDateFrom}_${returnDate}&cabin=y_s&adult=1&child=0&infant=0&isbuildup=1`;
    console.log(roundUrl);
    return new Promise(function(resolve) {
        openUrlCurrentTab(roundUrl, (tabId) => {
            if(!tabId){
                resolve(false);
                return;
            }
            console.log(`${tabId} round spider start, ${dept} -> ${dest} deptDate:${deptDateFrom}=>${deptDateTo} returnAfter:${returnAfterDays}`);
            spiderInsts[tabId] = {}
            spiderInsts[tabId].spiderType = '往返';
            spiderInsts[tabId].isRunning = true;
            spiderInsts[tabId].dept = dept;
            spiderInsts[tabId].dest = dest;
            spiderInsts[tabId].deptDateFrom = deptDateFrom;
            spiderInsts[tabId].deptDateTo = deptDateTo;
            spiderInsts[tabId].returnAfterDays = returnAfterDays;
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
            spiderInsts[tabId] = {};
            spiderInsts[tabId].isRunning = false;
            resolve(true);
        });
    })
}

queryConfig(); //立即触发一次  加载配置
setInterval(timerEvent, 60000);

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
            checkTabExist(parseInt(tabId)).then(exist => {
                if (!exist) {
                    console.log(`tabId:${tabId} not found, destoying spider inst`);
                    spider.isRunning = false;
                    return;
                }
                let dest = spider.dest;
                let dept = spider.dept;
                let deptDateFrom = spider.deptDateFrom;
                let deptDateTo = spider.deptDateTo;
                let spiderType = spider.spiderType;
                let returnAfterDays = spider.returnAfterDays;
                $.ajax({
                    type: 'post',
                    url: `${API_BASE}/spider/tick`,
                    contentType: 'application/json;charset=utf-8',
                    data: JSON.stringify({ dest: dest, dept: dept, deptFrom: deptDateFrom, deptTo: deptDateTo, spiderType: spiderType, returnAfterDays: returnAfterDays }),
                    success: resp => {
                        console.log(`${tabId} querying, ${dept} -> ${dest}, resp:`, resp);
                        if (resp.needRun === true) {
                            let deptDate = resp.params.deptDate;
                            let url = getSpiderUrl(spider, deptDate);
                            let updateProperties = { 'active': true, url: url };
                            chrome.tabs.update(parseInt(tabId), updateProperties);
                            console.log(`${tabId} reloading, ${dept} -> ${dest} ${deptDate}`);
                        }
                    },
                });
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

function checkParamsValid(dept, dest, deptDateFrom, deptDateTo, spiderType, returnAfterDays) {
    if (_.isEmpty(surpportCityCodeMap)) {
        return false;
    }
    if (!deptDateFrom || !deptDateTo) {
        return false;
    }
    if (dept === dest) {
        return false;
    }
    if (spiderType === "往返" && !returnAfterDays) {
        return false;
    }
    return !!surpportCityCodeMap[dept] && !!surpportCityCodeMap[dest];
}

function postResponse(tabId, data) {
    let spider = spiderInsts[tabId];
    console.log(data);
    if (!spider) {
        console.log(`tabid ${tabId} spider instance not found`);
        return;
    }
    data.dept = spider.dept;
    data.dest = spider.dest;
    data.deptFrom = spider.deptDateFrom;
    data.deptTo = spider.deptDateTo;
    data.spiderType = spider.spiderType;
    data.returnAfterDays = spider.returnAfterDays;
    $.ajax({
        type: 'post',
        url: `${API_BASE}/spider/handle`,
        contentType: 'application/json;charset=utf-8',
        data: JSON.stringify(data),
        success: _ => {
        },
    });
}