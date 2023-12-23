const $ = new Env('2bulu script');
const cacheKey = '2buluNet2';

const config = {
  "root": "",
  "pwd": "",
  "shorturl": "",
  "BDUSS": "",
};

const headers = {
  "User-Agent": "netdisk",
  "Content-Type": "text/plain; charset=utf-8",
  "Cookie": "%%; ndut_fmt="
};

const cache = {
  info: {},
  net: {}
};


// main
(async () => {

  config.root = $.getval('Tbulu_Baidu_Share_Root') || '';
  config.pwd = $.getval('Tbulu_Baidu_Share_Pwd') || '';
  config.shorturl = $.getval('Tbulu_Baidu_Share_ShortUrl') || '';
  config.BDUSS = $.getval('Tbulu_Baidu_Share_BDUSS') || '';

  if (config.shorturl == "") {
    $.msg(`${$.name}两步路户外助手`, "请先配置分享链接等信息");
    return;
  }

  headers.Cookie = headers.Cookie.replace("%%", config.BDUSS);

  let tmpConfig = config;
  if (tmpConfig.BDUSS != "") {
    tmpConfig.BDUSS = "XXXX";
  }
  $.log(`config: ${JSON.stringify(tmpConfig)}`, "");

  // cache = $.getjson(cacheKey);
  // $.log(JSON.stringify(cache.info));

  // $.log(await baidu_share_link(cache.net["54526023.zip"]));

  await baidu_share_int();
  await collectZip({ dir: config.root, page: 1, isRoot: "0" });
})()
  .catch((err) => $.logErr(err))
  .finally(() => $.done());

function fetch(url) {
  $.log(`fetch params: ${JSON.stringify(url)}`);
  return new Promise((resolve) => {
    $.post(url, (err, resp, body) => {
      resolve({ err: err, resp: resp, body: body });
    });
  });
}

function get(url) {
  $.log(`get params: ${JSON.stringify(url)}`);
  return new Promise((resolve) => {
    $.get(url, (err, resp, body) => {
      resolve({ err: err, resp: resp, body: body });
    });
  });
}

async function baidu_share_int() {
  const resp = await _baidu_share_list_api("", "1", "1");
  // $.log(resp.err, JSON.stringify(resp.resp), resp.body);
  var res = JSON.parse(resp.body);
  // respStatus = resp.resp.status ? resp.resp.status : resp.resp.statusCode;
  $.log(`status: ${resp.resp.status}, errno: ${res.errno}`);
  if (resp.resp.status == 200 && res.errno == 0) {
    cache["info"] = {
      "root": res.data.list[0].path.substr(0, res.data.list[0].path.lastIndexOf('/')),
      "seckey": res.data.seckey,
      "shareid": res.data.shareid,
      "uk": res.data.uk
    };
  }
  $.log(`cache.info: ${JSON.stringify(cache.info)}`);
}

async function baidu_share_link(link) {
  // $.log(JSON.stringify(link));

  let signResp = await get({
    url: `https://pan.baidu.com/share/tplconfig?fields=sign,timestamp&channel=chunlei&web=1&app_id=250528&clienttype=0&surl=${config.shorturl}`,
    headers: headers
  });

  // $.log(`signResp.body: ${signResp.body}`);

  const signBody = JSON.parse(signResp.body);
  if (signBody.errno != 0) {
    $.logErr(`get sign fail: ${signResp.body}`);
    return;
  }

  let extra = encodeURIComponent(`{"sekey":"${cache.info.seckey}"}`);
  const linkResp = await fetch({
    url: `https://pan.baidu.com/api/sharedownload?app_id=250528&channel=chunlei&clienttype=12&web=1&sign=${signBody.data.sign}&timestamp=${signBody.data.timestamp}`,
    headers: headers,
    body: `encrypt=0&extra=${extra}&fid_list=%5B${link.fs_id}%5D&primaryid=${cache.info.shareid}&product=share&type=nolimit&uk=${cache.info.uk}`
  });

  // $.log(`linkResp.body: ${linkResp.body}`);

  const linkBody = JSON.parse(linkResp.body);

  try {
    return linkBody.list[0].dlink;
  } catch (e) {
    $.logErr(e);
    return '';
  }
}


async function collectZip(req) {
  $.log(`req: ${JSON.stringify(req)}`);
  req.page = 1;
  if (req.dir == config.root) {
    req.dir = cache.info.root + req.dir;
    $.log(`req.dir: ${req.dir}`);
  }
  req.isRoot = req.dir == cache.info.root ? "1" : "0";

  let more = false;

  let count = 0;
  do {
    $.log(`while ${req.page}`);
    const response = await _baidu_share_list_api(req.dir, req.page, req.isRoot);
    if (response.resp.status != 200) {
      continue;
    }

    let body = JSON.parse(response.body);
    if (body.errno != 0) {
      continue;
    }

    $.log(`data list len: ${body.data.list.length}`);

    count += body.data.list.length;

    for (let i in body.data.list) {
      let item = body.data.list[i];
      cache.net[item.server_filename] = {
        fs_id: item.fs_id,
        isdir: item.isdir,
        path: item.path,
        server_filename: item.server_filename,
        size: item.size,
        server_mtime: item.server_mtime
      };
    }

    more = body.data.has_more;
    $.log(`has_more: ${more}`, "");
    req.page++;
  } while (more);

  $.log(`net length: ${count}`);

  if (count != 2378) {
    $.logErr(`net length not eqaul 2378`);
  }

  $.setjson(cache, cacheKey);
  $.log(`net cache saved`, "");

  return count;
}

function _baidu_share_list_api(dir, page, isRoot) {
  return fetch({
    url: "https://pan.baidu.com/share/wxlist?channel=weixin&version=2.2.2&clienttype=25&web=1",
    headers: headers,
    body: `pwd=${config.pwd}&root=${isRoot}&shorturl=${config.shorturl}&dir=${dir}&page=${page}&num=1000&order=time`
  });
}

// prettier-ignore
// https://github.com/chavyleung/scripts/raw/master/Env.js
function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,a)=>{s.call(this,t,(t,s,r)=>{t?a(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.encoding="utf-8",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`\ud83d\udd14${this.name}, \u5f00\u59cb!`)}getEnv(){return"undefined"!=typeof $environment&&$environment["surge-version"]?"Surge":"undefined"!=typeof $environment&&$environment["stash-version"]?"Stash":"undefined"!=typeof module&&module.exports?"Node.js":"undefined"!=typeof $task?"Quantumult X":"undefined"!=typeof $loon?"Loon":"undefined"!=typeof $rocket?"Shadowrocket":void 0}isNode(){return"Node.js"===this.getEnv()}isQuanX(){return"Quantumult X"===this.getEnv()}isSurge(){return"Surge"===this.getEnv()}isLoon(){return"Loon"===this.getEnv()}isShadowrocket(){return"Shadowrocket"===this.getEnv()}isStash(){return"Stash"===this.getEnv()}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const a=this.getdata(t);if(a)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,a)=>e(a))})}runScript(t,e){return new Promise(s=>{let a=this.getdata("@chavy_boxjs_userCfgs.httpapi");a=a?a.replace(/\n/g,"").trim():a;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[i,o]=a.split("@"),n={url:`http://${o}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":i,Accept:"*/*"},timeout:r};this.post(n,(t,e,a)=>s(a))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),a=!s&&this.fs.existsSync(e);if(!s&&!a)return{};{const a=s?t:e;try{return JSON.parse(this.fs.readFileSync(a))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),a=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):a?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const a=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of a)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,a)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[a+1])>>0==+e[a+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,a]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,a,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,a,r]=/^@(.*?)\.(.*?)$/.exec(e),i=this.getval(a),o=a?"null"===i?null:i||"{}":"{}";try{const e=JSON.parse(o);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),a)}catch(e){const i={};this.lodash_set(i,r,t),s=this.setval(JSON.stringify(i),a)}}else s=this.setval(t,e);return s}getval(t){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":return $persistentStore.read(t);case"Quantumult X":return $prefs.valueForKey(t);case"Node.js":return this.data=this.loaddata(),this.data[t];default:return this.data&&this.data[t]||null}}setval(t,e){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":return $persistentStore.write(t,e);case"Quantumult X":return $prefs.setValueForKey(t,e);case"Node.js":return this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0;default:return this.data&&this.data[e]||null}}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){switch(t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"],delete t.headers["content-type"],delete t.headers["content-length"]),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,a)=>{!t&&s&&(s.body=a,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,a)});break;case"Quantumult X":this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:a,headers:r,body:i,bodyBytes:o}=t;e(null,{status:s,statusCode:a,headers:r,body:i,bodyBytes:o},i,o)},t=>e(t&&t.error||"UndefinedError"));break;case"Node.js":let s=require("iconv-lite");this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:a,statusCode:r,headers:i,rawBody:o}=t,n=s.decode(o,this.encoding);e(null,{status:a,statusCode:r,headers:i,rawBody:o,body:n},n)},t=>{const{message:a,response:r}=t;e(a,r,r&&s.decode(r.rawBody,this.encoding))})}}post(t,e=(()=>{})){const s=t.method?t.method.toLocaleLowerCase():"post";switch(t.body&&t.headers&&!t.headers["Content-Type"]&&!t.headers["content-type"]&&(t.headers["content-type"]="application/x-www-form-urlencoded"),t.headers&&(delete t.headers["Content-Length"],delete t.headers["content-length"]),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient[s](t,(t,s,a)=>{!t&&s&&(s.body=a,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,a)});break;case"Quantumult X":t.method=s,this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:a,headers:r,body:i,bodyBytes:o}=t;e(null,{status:s,statusCode:a,headers:r,body:i,bodyBytes:o},i,o)},t=>e(t&&t.error||"UndefinedError"));break;case"Node.js":let a=require("iconv-lite");this.initGotEnv(t);const{url:r,...i}=t;this.got[s](r,i).then(t=>{const{statusCode:s,statusCode:r,headers:i,rawBody:o}=t,n=a.decode(o,this.encoding);e(null,{status:s,statusCode:r,headers:i,rawBody:o,body:n},n)},t=>{const{message:s,response:r}=t;e(s,r,r&&a.decode(r.rawBody,this.encoding))})}}time(t,e=null){const s=e?new Date(e):new Date;let a={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in a)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?a[e]:("00"+a[e]).substr((""+a[e]).length)));return t}queryStr(t){let e="";for(const s in t){let a=t[s];null!=a&&""!==a&&("object"==typeof a&&(a=JSON.stringify(a)),e+=`${s}=${a}&`)}return e=e.substring(0,e.length-1),e}msg(e=t,s="",a="",r){const i=t=>{switch(typeof t){case void 0:return t;case"string":switch(this.getEnv()){case"Surge":case"Stash":default:return{url:t};case"Loon":case"Shadowrocket":return t;case"Quantumult X":return{"open-url":t};case"Node.js":return}case"object":switch(this.getEnv()){case"Surge":case"Stash":case"Shadowrocket":default:{let e=t.url||t.openUrl||t["open-url"];return{url:e}}case"Loon":{let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}case"Quantumult X":{let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl,a=t["update-pasteboard"]||t.updatePasteboard;return{"open-url":e,"media-url":s,"update-pasteboard":a}}case"Node.js":return}default:return}};if(!this.isMute)switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:$notification.post(e,s,a,i(r));break;case"Quantumult X":$notify(e,s,a,i(r));break;case"Node.js":}if(!this.isMuteLog){let t=["","==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="];t.push(e),s&&t.push(s),a&&t.push(a),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":case"Quantumult X":default:this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t);break;case"Node.js":this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t.stack)}}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;switch(this.log("",`\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`),this.log(),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":case"Quantumult X":default:$done(t);break;case"Node.js":process.exit(1)}}}(t,e)}