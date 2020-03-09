// 将 jquery 的 ajax 方法封装为 Promise 方法
function post(url, params) {
    return new Promise(
        (resolve, reject) => {
            jQuery.ajax({
                url,
                data: { ...params },
                type: "post",
                success: function (res) {
                    resolve(res)
                },
                error: function (res) {
                    reject(res)
                }
            })
        }
    )
}

function httpPostJson(url, params) {
    return new Promise(
        (resolve, reject) => {
            jQuery.ajax({
                url,
                data: JSON.stringify(params),
                type: "post",
                contentType: 'application/json;charset=utf-8',
                success: function (res) {
                    resolve(res)
                },
                error: function (res) {
                    reject(res)
                }
            })
        }
    )
}

function httpGet(url) {
    return new Promise(
        (resolve, reject) => {
            jQuery.ajax({
                url,
                type: "get",
                success: function (res) {
                    resolve(res)
                },
                error: function (res) {
                    reject(res)
                }
            })
        }
    )
}