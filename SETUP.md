# 東璘匹克 — 後端設定步驟

前端已全部完成並部署在 <https://charliersa.github.io/176-dink/>。
以下三項設定完成後，訂位、後台密碼、跨裝置同步才會真正運作。

目前狀態：

| 項目 | 狀態 | 影響 |
|---|---|---|
| Cloudinary 圖片上傳 | 待設定 upload preset | 後台「瀏覽圖片」只存本機，貼網址可用 |
| Google Sheets 訂位 | 待部署 | 客人送出後顯示「訂位未送出」 |
| 後台密碼 | 待設定指令碼屬性 | 後台進不去 |

---

## 步驟 1：Google Sheets + Apps Script

### 1-1 建立試算表

新建一份 Google 試算表，命名隨意。`Bookings` 和 `Settings` 兩個工作表會在第一次寫入時自動建立，不必手動開。

### 1-2 貼上程式碼

在試算表中點 **擴充功能 → Apps Script**，把 [`google-apps-script.gs`](google-apps-script.gs) 的全部內容貼進去，存檔。

### 1-3 設定後台密碼

在 Apps Script 編輯器左側點 **齒輪圖示（專案設定）** → 捲到最下方 **指令碼屬性** → **新增指令碼屬性**：

| 欄位 | 填入 |
|---|---|
| 屬性 | `ADMIN_PASSWORD` |
| 值 | 你的新密碼 |

> **不要使用 `176dink`。** 這組密碼曾經出現在公開 repo 的提交紀錄中，任何人都能從 git 歷史翻出來。請設一組全新的。

密碼放在這裡而不是程式碼裡，是因為 `google-apps-script.gs` 會被推上公開的 GitHub。

### 1-4 部署為網頁應用程式

右上角 **部署 → 新增部署作業 → 類型選「網頁應用程式」**：

| 設定 | 選擇 |
|---|---|
| 執行身分 | **我** |
| 具有存取權的使用者 | **任何人** |

兩項都必須如此，否則前端拿到的會是 Google 登入頁而不是資料。

首次部署會要求授權，依指示允許即可。畫面出現「這個應用程式未經 Google 驗證」時，點 **進階 → 前往（不安全）**——這是你自己的指令碼，正常現象。

完成後複製 **網頁應用程式網址**，格式類似：

```
https://script.google.com/macros/s/AKfycb.../exec
```

### 1-5 驗證

直接在瀏覽器開啟 `你的網址?action=settings`，應該看到：

```json
{"ok":true,"bg":{},"txt":{}}
```

看到 JSON 才算成功。若看到登入頁或錯誤頁，回到 1-4 檢查存取權設定。

---

## 步驟 2：把網址填進前端

編輯 [`index.html`](index.html) **第 430 行**：

```js
const GOOGLE_SHEET_WEB_APP_URL = '';
```

改成：

```js
const GOOGLE_SHEET_WEB_APP_URL = '你的網頁應用程式網址';
```

存檔後推上 GitHub：

```bash
git add index.html
git commit -m "Connect frontend to Apps Script backend"
git push origin main
```

GitHub Pages 約 1–2 分鐘後自動重建。

---

## 步驟 3：Cloudinary 上傳（選用）

不做這步也能用——後台可以直接貼 Cloudinary 圖片網址。做了這步才能在後台直接選檔上傳。

登入 [Cloudinary](https://cloudinary.com/) → **Settings → Upload → Upload presets → Add upload preset**：

| 設定 | 值 |
|---|---|
| Signing Mode | **Unsigned** |
| Folder | `dink176` |
| Max file size | 建議設 5 MB |

儲存後複製 preset 名稱，填進 [`index.html`](index.html) **第 445 行**：

```js
const CLOUDINARY_UPLOAD_PRESET = '你的 preset 名稱';
```

> Unsigned preset 代表任何看到網頁原始碼的人都能上傳到你的帳號。**務必**在 preset 設定中限制資料夾與檔案大小。

---

## 完成後的驗收清單

依序測試，全部通過才算接通：

- [ ] 瀏覽器開 `網址?action=settings` 回傳 JSON
- [ ] 進入後台，輸入密碼可以解鎖
- [ ] 故意輸入錯誤密碼，顯示「密碼錯誤」
- [ ] 後台改一張背景圖，試算表 `Settings` 工作表出現 `bg` 那列
- [ ] 換一台裝置（或無痕視窗）開網站，看得到剛才改的背景圖
- [ ] 完成一筆測試訂位，試算表 `Bookings` 工作表出現該列
- [ ] 訂位後客人端顯示「訂位完成」

---

## 疑難排解

**後台顯示「無法連線到後端，請稍後再試」**

CORS 問題。Apps Script 部署為「任何人」時通常可正常運作；若持續失敗，回報給我，改用 JSONP 方式繞過。

**改了 `.gs` 卻沒有效果**

最常見的坑：Apps Script **只按存檔不會生效**。必須 **部署 → 管理部署作業 → 編輯（鉛筆圖示）→ 版本選「新版本」→ 部署**。舊網址會繼續執行舊程式碼，而且不會報錯。

**訂位一直顯示「訂位未送出」**

依序檢查：第 430 行的網址是否已填、Apps Script 是否已部署新版本、`?action=settings` 是否回傳 JSON。

**背景圖改了但沒變**

瀏覽器本機設定會覆蓋預設值。進後台按 **全部恢復預設**，或清除該網站的瀏覽器資料。

**後台密碼忘記**

回到 Apps Script 專案設定的指令碼屬性，直接改 `ADMIN_PASSWORD` 的值即可，不需要重新部署。

---

## 運作方式簡述

```
客人送出訂位
  └─ POST {id, name, phone, ...}  →  Bookings 工作表（附加一列）
     伺服器確認寫入後才顯示「訂位完成」

你在後台改設定
  └─ POST {type:'settings', password, bg}  →  密碼比對
     通過 → Settings 工作表覆寫 bg 那列
     失敗 → 不寫入，前端自動重新上鎖

任何人開啟網站
  └─ GET ?action=settings  →  讀回 bg / txt  →  套用
```

圖片本身存在 Cloudinary，Google Sheets 只存「哪個區塊用哪張圖、濃度多少」。

### 安全性範圍

密碼由伺服器比對，改前端 JavaScript 無法取得寫入權限。但請注意：

- **知道 Apps Script 網址的人可以讀取訂位資料。** `doGet` 沒有驗證。
- **任何人都能送出訂位。** 這是必要的，客人不需要密碼。
- 密碼以 sessionStorage 保存，關閉瀏覽器後需重新輸入。
