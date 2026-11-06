# ESign 安装清单修复（Loon）

适用于 ESign **服务端**安装：第三方安装清单接口返回 HTML 时，在手机本地生成正确的 plist。IPA 仍由 ESign 本机 HTTP 服务提供，不上传 IPA、证书或凭据，不改变 IPA 签名。

## 使用

1. ESign 安装地址选“服务端”。
2. 在 Loon 导入 `https://raw.githubusercontent.com/osinx/Script/main/esign/esign-install-fix.lpx`。
3. 启用脚本和 MITM，按 Loon 的要求安装并信任其 CA；只拦截 `esign.yyyue.xyz` 的安装清单接口。
4. 保持 ESign 打开，对已签名包点安装。

GitHub 地址需提交推送后才可用。联调时可使用本机 HTTP 服务及对应临时脚本地址。

## 行为与边界

- 清单请求包含包名、版本、图标与 IPA 相对路径，使用低位优先六位编码，区别于标准 Base64。
- 脚本只生成清单；文件下载固定指向 `http://127.0.0.1:<请求端口>`。
- 限制输入尺寸、UTF-8、端口及文件路径，校验失败时原样放行，不记录原始 URL 或文件标识。
- 不处理“本地”模式的过期 HTTPS 证书，不处理证书吊销或 IPA 签名失败。
- ESign 未运行或未开启相应下载端口时，仍然无法下载 IPA。
- 图标使用第三方外链，仓库不保存图片。

本地协议回放与 20 项脚本场景验证通过；Loon 真机安装仍在联调，不能据此宣称已经修复所有安装问题。测试文件未加入本项目。

接口形式参考 [Loon Script API](https://nsloon.app/docs/Script/script_api/)。
