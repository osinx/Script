const chavy = init()
const cookieName = '截天帝'
const KEY_signurl = 'signurl_jietiandi'
const KEY_signheader = 'signheader_jietiandi'
const chavygosign = true

const signinfo = {}
let VAL_signurl = chavy.getdata(KEY_signurl)
let VAL_signheader = chavy.getdata(KEY_signheader)
let gosign = /*JSON.parse(VAL_signheader)||*/chavygosign
let signToken = '';


;(sign = async () => {
    chavy.log(`🔔 ${cookieName}`)
    // await loginapp()
    if (gosign == true) await signapp()
    showmsg()

    chavy.done()
})()
  .catch((e) => chavy.log(`❌ ${cookieName} 签到失败: ${e}`))
  .finally(() => chavy.done())

function loginapp() {
    return new Promise((resolve, reject) => {
        const url = { url: VAL_signurl, headers: JSON.parse(VAL_signheader) }
        chavy.post(url, (error, response, data) => {
            try {
                let matches = response.body.match(/sign=(\w+)/);
                // console.log(JSON.stringify(matches));

                if (matches.length >= 2) {
                    signToken = matches[1];
                }
                resolve()
            } catch (e) {
                chavy.msg(cookieName, `登录结果: 失败`, `说明: ${e}`)
                chavy.log(`❌ ${cookieName} loginapp - 登录失败: ${e}`)
                chavy.log(`❌ ${cookieName} loginapp - response: ${JSON.stringify(response)}`)
                resolve()
            }
        })
    })
}

function signapp() {
    return new Promise((resolve, reject) => {
        chavy.log(VAL_signurl);
        // const url = { url: VAL_signurl+"&sign="+signToken, headers: JSON.parse(VAL_signheader) }
        const url = { url: VAL_signurl, headers: JSON.parse(VAL_signheader) }

        chavy.post(url, (error, response, data) => {
            try {
                // console.log(response.body)
                const matches = response.body.match(/<p>([^<]*)<\/p>/)
                // console.log(JSON.stringify(matches));

                if (matches.length >= 2) {
                    signinfo.n = matches[1];
                }
                resolve()
            } catch (e) {
                chavy.msg(cookieName, `签到结果: 失败`, `说明: ${e}`)
                chavy.log(`❌ ${cookieName} signapp - 签到失败: ${e}`)
                chavy.log(`❌ ${cookieName} signapp - response: ${JSON.stringify(response)}`)
                resolve()
            }
        })
    })
}


function showmsg() {
    let subTitle = ''
    let detail = ''
    chavy.log(`showmsg: ${JSON.stringify(signinfo)}`);
    // 签到结果
    if (gosign == true) {
        subTitle = `签到: ${signinfo.n}`
    }

    chavy.msg(cookieName, subTitle, detail)
}

function init() {
    isSurge = () => {
        return undefined === this.$httpClient ? false : true
    }
    isQuanX = () => {
        return undefined === this.$task ? false : true
    }
    getdata = (key) => {
        if (isSurge()) return $persistentStore.read(key)
        if (isQuanX()) return $prefs.valueForKey(key)
    }
    setdata = (key, val) => {
        if (isSurge()) return $persistentStore.write(key, val)
        if (isQuanX()) return $prefs.setValueForKey(key, val)
    }
    msg = (title, subtitle, body) => {
        if (isSurge()) $notification.post(title, subtitle, body)
        if (isQuanX()) $notify(title, subtitle, body)
    }
    log = (message) => console.log(message)
    get = (url, cb) => {
        if (url['headers'] != undefined) {
            delete url['headers']['Content-Length']
            // console.log(url['headers'])
        }
        if (isSurge()) {
            $httpClient.get(url, cb)
        }
        if (isQuanX()) {
            url.method = 'GET'
            $task.fetch(url).then((resp) => cb(null, resp, resp.body))
        }
    }
    post = (url, cb) => {
        if (url['headers'] != undefined) {
            delete url['headers']['Content-Length']
            // console.log(JSON.stringify(url['headers']))
        }
        if (isSurge()) {
            $httpClient.post(url, cb)
        }
        if (isQuanX()) {
            url.method = 'POST'
            $task.fetch(url).then((resp) => cb(null, resp, resp.body))
        }
    }
    done = (value = {}) => {
        $done(value)
    }
    return { isSurge, isQuanX, msg, log, getdata, setdata, get, post, done }
}
