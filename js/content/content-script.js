(function () {
    console.log('content-script.js loaded');
})();


// 主动发送消息给后台
// 要演示此功能，请打开控制台主动执行sendMessageToBackground()
function sendMessageToBackground(cmd, data) {
    chrome.runtime.sendMessage({cmd: cmd, data: data}, function (response) {
        // tip();
        // console.log('收到来自后台的回复：' + response)
    });
}

//接收来自后台或者popup的消息
// chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
//     // console.log(sender.tab ?"from a content script:" + sender.tab.url :"from the extension");
//     if (request.cmd === 'setSpiderParams') {
//         setSpiderParams(request.data);
//     }
// });



// 判断是否登陆
function checkLogin(callback) {
    chrome.storage.local.get('loginUser', function (res) {
        let user = res['loginUser'];
        if (user !== undefined) {
            callback()
        } else {
            alert("未登录状态不能使用进行此操作，请先登陆！");
        }
    });
}

function getLoginUser(callback) {
    chrome.storage.local.get('loginUser', function (res) {
        callback(res['loginUser']);
    });
}

// function setSpiderParams(params) {
//     console.log('setParams', params);
//     var dataDOMElement = document.createElement('div');
//     dataDOMElement.id = '__spiderParams';
//     dataDOMElement.innerText = JSON.stringify(params);
//     dataDOMElement.style.height = 0;
//     dataDOMElement.style.overflow = 'hidden';
//     document.body.appendChild(dataDOMElement);
// }