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
        $('#deptDateFrom').attr('disabled', true);
        $('#deptDateTo').attr('disabled', true);
        $('#spiderType').attr('disabled', true);
        $(`input[name="spiderType"]`).attr('disabled', true);
        $('#returnAfterDays').attr('disabled', true);
        $('#startSpider').text('停止获取');
        $('#startSpider').addClass('layui-btn-danger');
        getCurrentTabId((tabId) => {
            if (!_.isNil(bg.spiderInsts[tabId])) {
                $('#nextTickTime').show();
                $('#nextTickTime').text(moment(bg.spiderInsts[tabId].nextTick).format('YYYY/MM/DD HH:mm:ss'));
                $('#dept').val(bg.spiderInsts[tabId].dept);
                $('#dest').val(bg.spiderInsts[tabId].dest);
                $('#deptDateFrom').val(bg.spiderInsts[tabId].deptDateFrom);
                $('#deptDateTo').val(bg.spiderInsts[tabId].deptDateTo);
                $(`input[name="spiderType"][value="${bg.spiderInsts[tabId].spiderType}"]`).prop('checked', "true");
                $('#returnAfterDays').val(bg.spiderInsts[tabId].returnAfterDays);
            }
        })
    } else {
        $('#dest').attr('disabled', false);
        $('#dept').attr('disabled', false);
        $('#deptDateFrom').attr('disabled', false);
        $('#deptDateTo').attr('disabled', false);
        $(`input[name="spiderType"]`).attr('disabled', false);
        $('#returnAfterDays').attr('disabled', false);
        $('#startSpider').text('开始获取');
        $('#startSpider').removeClass('layui-btn-danger');
        $('#nextTickTime').hide();
    }

}

$(function () {
    getCurrentTabId((tabId) => {
        if (!bg.spiderInsts[tabId] || !bg.spiderInsts[tabId].isRunning) {
            updateState(false);
        } else {
            updateState(true);
        }
    });

    // 开始获取
    $('#startSpider').click(() => {
        // let urgency = $('input[name="spiderType"]:checked ').val();
        // console.log(urgency);
        // console.log($('input[name="spiderType"]'));
        // $('input[name="spiderType"][value="单程"]').prop('checked', "true");
        // form.render();
        // return;

        getCurrentTabId((tabId) => {
            if (!tabId) {
                layer.msg("获取当前tab失败，请新建标签后重试!");
                return;
            }
            console.log(bg.spiderInsts);
            if (!bg.spiderInsts[tabId] || bg.spiderInsts[tabId].isRunning == false) {
                let dest = $('#dest').val();
                let dept = $('#dept').val();
                let deptDateFrom = $('#deptDateFrom').val();
                let deptDateTo = $('#deptDateTo').val();
                let spiderType = $('input[name="spiderType"]:checked ').val();
                let returnAfterDays = $('#returnAfterDays').val();
                if (!bg.checkParamsValid(dept, dest, deptDateFrom, deptDateTo, spiderType, returnAfterDays)) {
                    layer.msg("当前城市不支持或参数有误");
                    return;
                }
                start(dept, dest, deptDateFrom, deptDateTo, spiderType, returnAfterDays);
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
    // laydate.render({
    //     // elem: '#deptDateFrom',
    //     // elem: '#deptDateTo',
    //     position: 'fixed'
    // })
});

function start(dept, dest, deptDateFrom, detptDateTo, spiderType, returnAfterDays) {
    // invoke spider
    bg.startSpider(dept, dest, deptDateFrom, detptDateTo, spiderType, returnAfterDays).then(res => {
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