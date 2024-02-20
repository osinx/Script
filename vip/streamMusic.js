
/*
#!name = 音流
#!desc =  永久解锁VIP
#!author = osinx
#!homepage = https://github.com/osinx/Script
#!icon = https://raw.githubusercontent.com/osinx/Script/main/icon/streamMusic.png

[Script]
http-response ^https:\/\/pay\.aqzscn\.cn\/api\/v1\/payments\/ script-path = https://raw.githubusercontent.com/osinx/Script/main/vip/streamMusic.js, requires-body = true, tag = 音流解锁VIP

[Mitm]
hostname = pay.aqzscn.cn
*/

let res = JSON.parse($response.body);

const url = $request.url;
const valiorder = "/validations/orders";
const device = "/onlinedevices";

if (url.indexOf(valiorder) != -1) {
    res.originalTransactionId = "1704038400";
    res.originalPurchaseDate = 1704038400;
    res.email = "";
    res.platform = "alipay";
} else if (url.indexOf(device) != -1) {
    res["Authorization-Date"] = 4102358400;
    delete res.code
    delete res.message
}

$done({
    body: JSON.stringify(res)
});
