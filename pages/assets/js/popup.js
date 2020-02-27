//判断是否登陆
var bg = chrome.extension.getBackgroundPage();
var layer = layui.layer, form = layui.form;

// 获取当前选项卡ID
function getCurrentTabId(callback) {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        if (callback) callback(tabs.length ? tabs[0].id : null);
    });
}

// 这2个获取当前选项卡id的方法大部分时候效果都一致，只有少部分时候会不一样
function getCurrentTabId2() {
    chrome.windows.getCurrent(function (currentWindow) {
        chrome.tabs.query({active: true, windowId: currentWindow.id}, function (tabs) {
            if (callback) callback(tabs.length ? tabs[0].id : null);
        });
    });
}

// 向content-script主动发送消息
function sendMessageToContentScript(message, callback) {
    getCurrentTabId((tabId) => {
        chrome.tabs.sendMessage(tabId, message, function (response) {
            // alert(response)
            // console.log(response)
        });
    });
}

function updateState() {
    chrome.storage.local.get('autoGetList', function (res) {
        document.getElementById("autoGetList").checked = res['autoGetList'];
        form.render('checkbox')
    });
    chrome.storage.local.get('autoClickSearch', function (res) {
        document.getElementById("autoClickSearch").checked = res['autoClickSearch'];
        form.render('checkbox')
    });

    $.get(`${API_BASE}/yenExRate/maxReleaseTime`, resp => {
        $('#latestReleaseTime').text(moment(resp).format('YYYY/MM/DD HH:mm:ss'));
    });

    $('#latestRefreshTime').text(moment(bg.get_next_refresh()).format('YYYY/MM/DD HH:mm:ss'));

    //判断是否登陆
    if (bg.loginUser === undefined) {
        $('#unLoginDiv').show();
        $('#loginDiv').hide();
        chrome.storage.local.remove('loginUser', _ => {
        });
    } else {
        $('#unLoginDiv').hide();
        $('#loginDiv').show();
        $('#userName').text(bg.loginUser.userName);
    }
}


$(function () {
    // // $('#enabled')
    // updateState();

    // // 刷新后自动获取列表开关
    // form.on('switch(autoGetListClick)', function (data) {
    //     let checked = data.elem.checked;
    //     chrome.storage.local.set({'autoGetList': checked}, _ => {
    //     });
    // })

    // //  自动点击查询开关
    // form.on('switch(autoClickSearchClick)', function (data) {
    //     let checked = data.elem.checked;
    //     if (checked === true) {
    //         console.log("aa")
    //         getCurrentTabId(tabId => {
    //             console.log(tabId)
    //             bg.setActiveTabId(tabId);
    //             console.log(bg.activeTabId)
    //         })
    //     }
    //     chrome.storage.local.set({'autoClickSearch': checked}, _ => {
    //     });
    // })

    // 跳转到汇率页面
    // $('#btnGotoPage').click(() => {
    //     bg.openUrlNewTab({url: 'http://srh.bankofchina.com/search/whpj/search.jsp'}, _ => {
    //         sendMessageToContentScript({'cmd':'selectYenAndClickSearch'})
    //     });
    // });

    // 获取当前页面
    $('#startSpider').click(() => {
        getCurrentTabId((tabId) => {
            console.log(bg.spiderInsts);
            if (!bg.spiderInsts[tabId]) {
                start();
            } else {
                let isRunning = bg.spiderInsts[tabId].isRunning;
                console.log(isRunning)
                if (isRunning === true) {
                    stop();
                } else {
                    start();
                }
            }
            
        });
    });

    //登陆按钮
    $('#btnLogin').click(function () {
        $.ajax({
            type: 'post',
            url: `${API_BASE}/feizhu/login`,
            contentType: 'application/json;charset=utf-8',
            data: JSON.stringify({'workId': $('#txtWorkId').val(), 'password': $('#txtPassword').val()}),
            success: resp => {
                layer.msg("登陆成功");
                bg.loginUser = resp;
                chrome.storage.local.set({'loginUser': resp}, _ => {
                });
                $('#unLoginDiv').hide();
                $('#loginDiv').show();
                $('#userName').text(bg.loginUser.userName);
                $('#hideLoginForm').click();
            },
            statusCode: {
                400: function () {
                    layer.msg('用户名密码错误');
                }, 404: function () {
                    layer.msg('无此用户');
                }
            },
        });
    });

    form.render();
});

function start() {
    let dept = 'sha';
    let dest = 'tyo';
    let deptDate = '2020-03-29'

    // invoke spider
    bg.startSpider(dept, dest, deptDate);

}

function stop() {
    let dept = 'sha';
    let dest = 'tyo';
    let deptDate = '2020-03-29'

    // invoke spider
    bg.stopSpider();

}




