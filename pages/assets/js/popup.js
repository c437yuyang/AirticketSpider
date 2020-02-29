//判断是否登陆
var bg = chrome.extension.getBackgroundPage();
var layer = layui.layer, form = layui.form, laydate = layui.laydate;

// 获取当前选项卡ID
function getCurrentTabId(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (callback) callback(tabs.length ? tabs[0].id : null);
    });
}

// 这2个获取当前选项卡id的方法大部分时候效果都一致，只有少部分时候会不一样
function getCurrentTabId2() {
    chrome.windows.getCurrent(function (currentWindow) {
        chrome.tabs.query({ active: true, windowId: currentWindow.id }, function (tabs) {
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

function updateState(isRunning) {
    if (isRunning === true) {
        $('#dest').attr('disabled', true);
        $('#dept').attr('disabled', true);
        $('#deptDate').attr('disabled', true);
        $('#startSpider').text('停止获取');
        $('#startSpider').addClass('layui-btn-danger');
        getCurrentTabId((tabId) => {
            if (!_.isNil(bg.spiderInsts[tabId])) {
                $('#nextTickTime').show();
                $('#nextTickTime').text(moment(bg.spiderInsts[tabId].nextTick).format('YYYY/MM/DD HH:mm:ss'));
                $('#dept').val(bg.spiderInsts[tabId].dept);
                $('#dest').val(bg.spiderInsts[tabId].dest);
                $('#deptDate').val(bg.spiderInsts[tabId].deptDate);
            }
        })
    } else {
        $('#dest').attr('disabled', false);
        $('#dept').attr('disabled', false);
        $('#deptDate').attr('disabled', false);
        $('#startSpider').text('开始获取');
        $('#startSpider').removeClass('layui-btn-danger');
        $('#nextTickTime').hide();
    }

}

$(function () {
    getCurrentTabId((tabId) => {
        if (!bg.spiderInsts[tabId] || !bg.spiderInsts[tabId].isRunning) {
            console.log('a');
            updateState(false);
        } else {
            console.log('b');
            updateState(true);
        }
    });

    // 开始获取
    $('#startSpider').click(() => {
        getCurrentTabId((tabId) => {
            if (!tabId) {
                layer.msg("获取当前tab失败，请新建标签后重试!");
                return;
            }
            console.log(bg.spiderInsts);
            if (!bg.spiderInsts[tabId] || bg.spiderInsts[tabId].isRunning == false) {
                let dest = $('#dest').val();
                let dept = $('#dept').val();
                let deptDate = $('#deptDate').val();
                if (!bg.checkParamsValid(dept, dest, deptDate)) {
                    layer.msg("当前城市不支持或参数有误");
                    return;
                }
                start(dept, dest, deptDate);
            } else {
                stop();
            }
        });
    });

    //登陆按钮
    $('#btnLogin').click(function () {
        $.ajax({
            type: 'post',
            url: `${API_BASE}/feizhu/login`,
            contentType: 'application/json;charset=utf-8',
            data: JSON.stringify({ 'workId': $('#txtWorkId').val(), 'password': $('#txtPassword').val() }),
            success: resp => {
                layer.msg("登陆成功");
                bg.loginUser = resp;
                chrome.storage.local.set({ 'loginUser': resp }, _ => {
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
    laydate.render({
        elem: '#deptDate',
        position: 'fixed'
    })
});

function start(dept, dest, deptDate) {
    // invoke spider
    bg.startSpider(dept, dest, deptDate).then(res => {
        if (res === true) {
            updateState(true);
            layer.msg("启动成功");
        } else {
            layer.msg("启动失败");
        }
    });
}

function stop() {
    // invoke spider
    bg.stopSpider().then(res => {
        if (res === true) {
            updateState(false);
            layer.msg("停止成功");
        } else {
            layer.msg("停止失败");
        }
    })
}