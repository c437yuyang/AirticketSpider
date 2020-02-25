//右键菜单部分
chrome.contextMenus.create({
    id: "1",
    type: 'normal',
    title: 'BOC Tools', // 显示的文字，除非为“separator”类型否则此参数必需，如果类型为“selection”，可以使用%s显示选定的文本
    contexts: ['page'], // 上下文环境，可选：["all", "page", "frame", "selection", "link", "editable", "image", "video", "audio"]，默认page
    onclick: function () {
        alert("点击了菜单")
    }, // 单击时触发的方法
    documentUrlPatterns: ['http://srh.bankofchina.com/search/whpj/search.jsp'] // 只在某些页面显示此右键菜单
});

chrome.contextMenus.create({
    parentId: "1",
    type: 'normal',
    title: '获取当前页面', // 显示的文字，除非为“separator”类型否则此参数必需，如果类型为“selection”，可以使用%s显示选定的文本
    contexts: ['page'], // 上下文环境，可选：["all", "page", "frame", "selection", "link", "editable", "image", "video", "audio"]，默认page
    onclick: function (args) {
        let orderId = args.selectionText;
        if (orderId.length != 18) {
            alert("请选择18位的订单编号!");
            return false;
        }
        if (this.loginUser === undefined) {
            alert("请先登陆后继续操作！");
            return false;
        }
        $.get(`${API_BASE}/feizhu/orderNo/${orderId}`, resp => {
            if (resp === false) {
                alert("未找到指定订单数据，请先获取订单数据！");
                return false;
            }
            openUrlNewTab({url: `${API_EASY_GO}?orderNo=${orderId}&type=feizhu&WorkId=${this.loginUser.workId}`});
        })
    }, // 单击时触发的方法
    documentUrlPatterns: ['http://srh.bankofchina.com/search/whpj/search.jsp'] // 只在某些页面显示此右键菜单
});
