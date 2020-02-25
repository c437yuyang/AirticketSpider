(function () {
    console.log('orderList.js loaded');
})();

document.addEventListener('DOMContentLoaded', function () {
    getCurrentPage(); //页面加载完成后自动执行getOrderList()
});

function timerEvent(){
    console.log("time out")
    chrome.storage.local.get('autoClickSearch', function (res) {
        if (res['autoClickSearch'] === true) {
            console.log("click search");
            selectYenAndClickSearch();
        }
    });
}

function selectYenAndClickSearch() {
    $('#pjname').val('日元'); //下拉框先选择日元
    $('input[onclick="executeSearch()"]').click(); // 点击查询
}

function getCurrentPage() {
    checkLogin(() => {
        $.get(`${API_BASE}/yenExRate/maxReleaseTime`, resp => {
            let latest = moment('1900-00-00')
            if (resp !== '') {
                console.log('not empty')
                latest = moment(resp);
                console.log(`latest: ${latest}`);
            }
            let trs = $('div[class="BOC_main publish"] tbody tr');
            let items = []
            let all = 0;
            for (let i = trs.length - 2; i > 0; --i) {
                let tr = $(trs[i]);
                let tds = tr.find('td');
                let item = {}
                item['xhmrj'] = $(tds[1]).text()
                item['xcmrj'] = $(tds[2]).text()
                item['xhmcj'] = $(tds[3]).text()
                item['xcmcj'] = $(tds[4]).text()
                item['zhzsj'] = $(tds[5]).text()
                let rel_time = moment($(tds[6]).text(), 'YYYY.MM.DD. h:mm:ss')
                item['releaseTime'] = rel_time;
                if (rel_time.isAfter(latest)) {
                    items.push(item);
                }
                all++;
            }
            console.log(`本次共${all}条记录,${items.length}条有效`);
            if (items.length > 0) {
                $.ajax({
                    type: 'post',
                    url: `${API_BASE}/yenExRate`,
                    contentType: 'application/json;charset=utf-8',
                    data: JSON.stringify(items),
                    success: resp => {

                    },
                });
            }
        });
    })
}

function getOrder(orderId) {
    checkLogin(() => {
        url = `https://orderdetail.fliggy.com/tripOrderDetail.htm?orderId=${orderId}`
        sendMessageToBackground('OpenNewTab', {url: url, 'orderId': orderId});
    })
}


// var tipCount = 0;
// // 简单的消息通知
// function tip(info) {
// 	info = info || '';
// 	var ele = document.createElement('div');
// 	ele.className = 'chrome-plugin-simple-tip slideInLeft';
// 	ele.style.top = tipCount * 70 + 20 + 'px';
// 	ele.innerHTML = `<div>${info}</div>`;
// 	document.body.appendChild(ele);
// 	ele.classList.add('animated');
// 	tipCount++;
// 	setTimeout(() => {
// 		ele.style.top = '-100px';
// 		setTimeout(() => {
// 			ele.remove();
// 			tipCount--;
// 		}, 400);
// 	}, 3000);
// }
