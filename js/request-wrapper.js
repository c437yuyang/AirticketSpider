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

// 异步请求，使用 then 和 catch
function asyncPost(url, params) {
    post(
        url,
        {
            foo: 'qwwerwer'
        }
    ).then(res => {
        console.log(res)
    }).catch(err => {
        console.err(err)
    })
}

// 同步请求，使用 async 和 await
async function syncPost() {
    try {
        console.log('==== 同步请求 start =====')
        let res = await post(
            'http://removeUrl',
            {
                foo: 'qwwerwer'
            }
        )
        console.log(res)
        console.log('==== 同步请求 end =====')
    } catch (e) {
        console.log(e)
    }
}
