/* ESign install manifest only. No signing, IPA upload, or certificate changes. */
(function () {
  "use strict";

  function decodeMetadata(encoded) {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    const text = decodeURIComponent(encoded).replace(/=+$/, "");
    if (!text || text.length > 16384 || text.length % 4 === 1 || !/^[A-Za-z0-9+/]+$/.test(text)) {
      throw new Error("invalid_encoding");
    }
    let buffer = 0, bits = 0;
    const bytes = [];
    // ESign consumes six-bit digits least-significant first, unlike Base64.
    for (let i = 0; i < text.length; i++) {
      buffer |= alphabet.indexOf(text[i]) << bits;
      bits += 6;
      if (bits >= 8) {
        bytes.push(buffer & 255);
        buffer >>>= 8;
        bits -= 8;
      }
    }
    if (buffer !== 0) throw new Error("invalid_tail");
    const utf8 = bytes.map(value => "%" + ("0" + value.toString(16)).slice(-2)).join("");
    const data = JSON.parse(decodeURIComponent(utf8));
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("invalid_metadata");
    if (typeof data.b !== "string" || !/^[A-Za-z0-9][A-Za-z0-9.-]{0,254}$/.test(data.b)) throw new Error("invalid_bundle");
    if (typeof data.n !== "string" || !data.n.trim() || data.n.length > 256 || /[\x00-\x1f]/.test(data.n)) throw new Error("invalid_title");
    if (typeof data.v !== "string" || data.v.length > 64 || !/^\d+(?:\.\d+){0,3}$/.test(data.v)) throw new Error("invalid_version");
    if (typeof data.i !== "string" || !/^\/[A-Fa-f0-9]{32}\.ipa$/.test(data.i)) throw new Error("invalid_ipa_path");
    if (data.l !== undefined && data.l !== "" && (typeof data.l !== "string" || !/^\/[A-Fa-f0-9]{32}\.(?:png|jpg|jpeg)$/.test(data.l))) throw new Error("invalid_icon_path");
    return data;
  }

  function xml(value) {
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  }

  function manifest(url, method) {
    if (method && method !== "GET" && method !== "HEAD") return null;
    const match = /^https:\/\/esign\.yyyue\.xyz(?::443)?\/yyy\/api\/esignapp\/localinstall\/(\d{1,5})\/([^?#]+)(?:\?[^#]*)?$/.exec(url);
    if (!match) return null;
    const port = Number(match[1]);
    if (port < 1024 || port > 65535) throw new Error("invalid_port");
    const data = decodeMetadata(match[2]);
    // Remote mode serves the IPA over ESign's local HTTP listener.
    const base = "http://127.0.0.1:" + port;
    const asset = (kind, path) => "<dict><key>kind</key><string>" + kind + "</string><key>url</key><string>" + xml(base + path) + "</string></dict>";
    const assets = [asset("software-package", data.i)];
    if (data.l) assets.push(asset("display-image", data.l), asset("full-size-image", data.l));
    const body = '<?xml version="1.0" encoding="UTF-8"?>\n<plist version="1.0"><dict><key>items</key><array><dict><key>assets</key><array>' + assets.join("") +
      '</array><key>metadata</key><dict><key>bundle-identifier</key><string>' + xml(data.b) +
      '</string><key>bundle-version</key><string>' + xml(data.v) +
      '</string><key>kind</key><string>software</string><key>title</key><string>' + xml(data.n) +
      '</string></dict></dict></array></dict></plist>';
    return {status: 200, headers: {"Content-Type": "application/x-plist; charset=utf-8", "Cache-Control": "no-store"}, body: method === "HEAD" ? "" : body};
  }

  if (typeof module !== "undefined" && module.exports) module.exports = {decodeMetadata, manifest};
  if (typeof $request === "undefined" || typeof $done !== "function") return;
  try {
    const response = manifest(String($request.url || ""), $request.method || "GET");
    if (response) {
      console.log("[ESign Install Fix] 安装清单已在手机本地生成");
      $done({response});
    } else $done({});
  } catch (_) {
    console.log("[ESign Install Fix] 不支持的清单参数，保留原请求");
    $done({});
  }
})();
