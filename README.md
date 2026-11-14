# 日本自由行規劃網站（第一版）

## 功能
- 每日行程新增、日期/城市篩選、刪除
- Leaflet + OpenStreetMap 互動地圖與景點標記
- 地圖點擊選取座標
- 餐廳/購物收藏與 Google Maps 搜尋連結
- 日圓預算加總、台幣估算
- JSON 匯出/匯入備份
- LocalStorage 本機儲存，無需資料庫或自建 API

## 本機預覽
直接以瀏覽器開啟 `index.html`。地圖需連網；若瀏覽器限制本機檔案載入，請使用 VS Code 的 Live Server，或直接部署 GitHub Pages。

## GitHub Pages 免費架站
1. 登入 https://github.com/ 並建立帳號。
2. 建立新的 repository，例如 `japan-trip-planner`，選擇 Public。
3. 將 `index.html` 上傳到 repository 根目錄（Add file → Upload files → Commit changes）。
4. 進入 repository 的 Settings → Pages。
5. Build and deployment 選擇 `Deploy from a branch`。
6. Branch 選 `main`，資料夾選 `/ (root)`，按 Save。
7. 等待部署完成，網址通常是 `https://你的GitHub帳號.github.io/japan-trip-planner/`。

## 免費額度與避免意外費用
- 本專案沒有串接 Google Maps Platform API、Places API、Directions API、AI API 或付費資料庫。
- GitHub Pages 使用免費方案時仍受 GitHub Pages 使用限制約束；不要將它當成商業高流量主機。
- OpenStreetMap 標準圖磚服務由社群提供，並非無限制免費 CDN。請遵守 https://operations.osmfoundation.org/policies/tiles/ ：不要批次下載、預先抓取、離線打包、過度刷新或大量自動平移地圖。保留地圖署名。
- Google Maps 使用一般網頁搜尋/導航連結，不呼叫 Google Maps API；使用者點擊後由 Google Maps 網站或 App 處理。
- LocalStorage 資料只在目前瀏覽器/裝置，不會跨裝置同步。定期按「匯出 JSON 備份」。
- 不購買自訂網域、不啟用付費服務、不加入需綁信用卡的 API，即可避免本專案本身產生 API 帳單。第三方服務政策可能變更，請以官方公告為準。

## 使用方式
1. 在「每日行程」填日期、時間、城市、名稱；可選填座標與預估花費。
2. 在「互動地圖」點地圖選取座標，按「把選取座標帶到行程表單」，再新增行程。
3. 在收藏頁新增餐廳、購物地點。
4. 在預算頁設定總預算與匯率。匯率是手動輸入的估算值，不會自動更新。
5. 在資料備份頁定期匯出 JSON，換裝置時匯入。

## 注意
- 第一版沒有帳號系統、雲端同步、地址轉座標自動搜尋、即時交通/營業時間或離線地圖。
- 景點座標可在地圖上點選取得；也可自行填入緯度/經度。
- 出發前請自行確認店家資訊、預約與交通狀況。
