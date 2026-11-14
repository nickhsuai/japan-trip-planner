# Japan Trip Planner v2.0

## 功能
- Google 登入、Firebase 雲端同步
- 旅伴共同編輯（每個旅程最多 10 位）
- Firestore Web IndexedDB 離線快取與離線寫入佇列
- 東京/京都/大阪行程、Leaflet 地圖標記、Google Maps 導航
- 餐廳/購物收藏、日圓預算與台幣估算
- JSON 匯入/匯出、手機主畫面 PWA

## A. Firebase Spark 設定
1. 到 https://console.firebase.google.com/ 建立專案，保持 Spark 免費方案，不升級 Blaze。
2. 專案總覽新增 Web App，複製 SDK 設定。
3. 編輯 `firebase-config.js`，填入 `apiKey`、`authDomain`、`projectId`、`appId`。
4. Authentication → Sign-in method → 啟用 Google。
5. Authentication → Settings → Authorized domains，加入 `你的GitHub帳號.github.io`（本機測試另加 localhost）。
6. Firestore Database → Create database → Production mode，選擇資料庫地區。
7. Firestore → Rules，貼上 `firestore.rules` 全文並 Publish。

## B. GitHub Pages 部署
1. 建立 Public repository，例如 `japan-trip-planner-v2`。
2. 將本資料夾所有檔案上傳到 repository 根目錄。
3. Settings → Pages → Deploy from a branch → main → /(root) → Save。
4. 開啟 `https://你的帳號.github.io/japan-trip-planner-v2/`。
5. Firebase Authentication Authorized domains 要加入 `你的帳號.github.io`，只填網域、不含 https 和路徑。

## C. 旅伴共享
1. 擁有者 Google 登入，按「建立新旅程」。
2. 旅伴先登入網站，複製登入資訊區的 UID 傳給擁有者。
3. 擁有者在「旅伴共享」輸入 UID、加入旅伴。
4. 擁有者複製旅程分享網址傳給旅伴。
5. 旅伴開啟網址即可共同讀寫該旅程。只有擁有者能新增成員；所有成員都能新增/刪除行程和收藏。
6. 最多 10 位成員。移除成員可在 Firebase Console 的 trips/{tripId} 文件編輯 members 陣列。

## D. 離線
- 每台裝置都要先在線登入並開啟旅程一次。
- Firestore Web 持久快取使用 IndexedDB；離線時可讀取已快取文件，新增/修改/刪除會排隊，恢復網路後同步。
- 同一份文件多人同時修改時採 last-write-wins。建議不要同時修改同一景點。
- PWA 只快取本站程式外殼；Firebase SDK 及 OSM 地圖圖磚未保證離線。離線時行程可用，但底圖可能無法顯示。
- 不要在公用電腦使用，因為 IndexedDB 快取會保留已讀資料。

## E. 免費額度與防超額
- Spark 不要求付款方式；本專案不使用 Cloud Functions、Storage、App Hosting、付費地圖 API 或其他需升級的產品。
- Firestore 免費額度（依官方文件，可能調整）：每專案一個免費資料庫、1 GiB 儲存、每日 50,000 次讀取、20,000 次寫入、20,000 次刪除、每月 10 GiB 外傳。
- Spark 超過免費額度時服務可能被限制/停止，不會自動改成付費方案。絕對不要升級 Blaze。
- 防用量設計：只監聽目前開啟的一個旅程；沒有輪詢；每旅程限制 10 人；資料欄位有長度與數字限制；不儲存圖片；避免頻繁重新整理或大量匯入。
- Firebase Console → Firestore Usage 定期查看用量。免費方案不是無限量保證。
- OSM 標準圖磚有獨立使用政策，禁止批次下載/預先抓取/過度刷新；地圖署名不可移除。

## F. 安全規則
`firestore.rules` 限制只有登入且屬於該旅程 members 的使用者可讀寫子集合；只有 owner 可管理旅程成員。不要改成 `allow read, write: if true`。
Firebase Web API key 不是管理員私鑰；實際權限由 Firestore Rules 控制。請勿公開任何服務帳戶私鑰。

## 限制
- 第一版 JSON 與第二版格式不同，不能直接匯入第一版備份。
- 沒有地址轉座標自動搜尋、即時交通/天氣、路線最佳化、離線地圖。
- 請先以兩個 Google 帳號測試成員邀請與權限，再放入重要旅遊資料。
