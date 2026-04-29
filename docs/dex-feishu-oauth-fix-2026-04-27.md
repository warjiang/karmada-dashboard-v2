# Karmada Dashboard 接入 Dex + 飞书 OAuth 故障排查与修复记录

更新时间：2026-04-27

## 1. 初始故障与现象

### 1.1 Dex 启动失败（最初）
日志报错：
- `no issuer specified in config file`
- `no storage supplied in config file`

原因：`helm install dex ... -f extra/dex/values.yaml` 时，`values.yaml` 默认 `config: {}`，生成的 `secret/dex` 中 `config.yaml` 为空配置。

### 1.2 加入飞书 connector 后的连续报错
依次出现：
- `OAuth connector: failed to get token: oauth2: server response missing access_token`
- `OAuth Connector: not found id claim`
- `OAuth Connector: not found open_id claim`
- `OAuth Connector: failed to execute request to userinfo: status 502`
- 飞书授权页报错 `20043`（scope 校验失败）

---

## 2. 关键根因分析

### 2.1 token 接口不兼容
最早配置使用：
- `tokenURL: https://open.feishu.cn/open-apis/authen/v1/oidc/access_token`

该接口与 Dex `oauth` connector 预期的标准 OAuth2 token 响应不匹配，导致 `missing access_token`。

### 2.2 userIDKey 配置层级错误
最早把 `userIDKey` 写在 `claimMapping` 内，Dex 不读取该位置，回退默认找 `id`，导致 `not found id claim`。

### 2.3 飞书 user_info 返回结构与 Dex 预期不一致
飞书 `user_info` 返回格式是：
```json
{"code":0,"msg":"success","data":{...}}
```
Dex 期望 userinfo 顶层直接是 claims（如 `open_id`），因此无法直接读取。

### 2.4 scope 不被飞书授权接口接受
配置了 `openid email profile`，飞书授权页返回 `20043`。

---

## 3. 已完成修复项

### 3.1 Dex 基础配置修复
文件：`extra/dex/values.yaml`

- 设置 `issuer: https://dex.20220625.xyz`
- 设置 `storage.type: kubernetes`
- 配置 `staticClients`：
  - `id: karmada-dashboard`
  - `redirectURIs`：
    - `https://karmada.20220625.xyz/login/callback`
    - `http://localhost:5173/login/callback`

### 3.2 飞书 OAuth endpoint 修复
文件：`extra/dex/values.yaml`

- `authorizationURL` 改为官方授权地址：
  - `https://accounts.feishu.cn/open-apis/authen/v1/authorize`
- `tokenURL` 改为 v2：
  - `https://open.feishu.cn/open-apis/authen/v2/oauth/token`
- `scopes` 改为空数组：
  - `scopes: []`

### 3.3 userID claim 修复
文件：`extra/dex/values.yaml`

- 顶层设置：`userIDKey: open_id`
- 从 `claimMapping` 中移除 `userIDKey`

### 3.4 userinfo 适配器新增（解决 data 嵌套）
新增文件：`extra/dex/feishu-userinfo-adapter.yaml`

在 `dex` namespace 部署：
- `ConfigMap feishu-userinfo-adapter`
- `Deployment feishu-userinfo-adapter`
- `Service feishu-userinfo-adapter`

作用：
- 接收 Dex 的 `Authorization: Bearer <user_access_token>`
- 调飞书 `authen/v1/user_info`
- 将返回包装体拍平为 Dex 需要的顶层 claims JSON
- `id` 字段回退链：`open_id -> user_id -> union_id -> sub`

Dex 中 `userInfoURL` 已切到：
- `http://feishu-userinfo-adapter.dex.svc.cluster.local/userinfo`

### 3.5 Karmada APIServer OIDC 参数已对齐
集群内当前已生效参数：
- `--oidc-issuer-url=https://dex.20220625.xyz`
- `--oidc-client-id=karmada-dashboard`
- `--oidc-username-claim=sub`
- `--oidc-username-prefix=oidc:`

---

## 4. dashboard-api 本地开发联调建议

你当前选择本地启动 `karmada-dashboard-api`，建议参数：

```bash
--oidc-issuer-url=https://dex.20220625.xyz
--oidc-client-id=karmada-dashboard
--oidc-client-secret=KARMADA
--oidc-redirect-url=http://localhost:5173/login/callback
--oidc-scopes=openid,email,profile
```

说明：
- Dex 已加入 `http://localhost:5173/login/callback`，本地前端可直接回调。
- 如果前端不在本地而在公网域名，仅本地 API 不会自动接到回调，需额外做本地 API 对外暴露或前端 API 代理切换。

---

## 5. 当前建议的验证步骤

1. 登录流程验证
- 访问 Dashboard 登录页
- 点击企业登录
- 完成飞书授权
- 观察是否成功返回并换取 token

2. 日志验证

```bash
kubectl -n dex logs deploy/dex --tail=200
kubectl -n dex logs deploy/feishu-userinfo-adapter --tail=200
```

3. OIDC 发现文档验证

```bash
curl -s https://dex.20220625.xyz/.well-known/openid-configuration
```

---

## 6. 后续建议（安全）

当前 `extra/dex/values.yaml` 中仍有明文敏感信息（`clientSecret` 等），建议尽快：
- 轮换 Dex static client secret
- 轮换飞书 app secret
- 改为 K8s Secret 注入，不再明文放 values 文件
