# ErSlice - 前端切版說明包生成器

**專案狀態：** 🚧 進行中  
**整體完成度：** 70%  
**最後更新：** 2025-09-01
**開始日期：** 2025-08-30  

## 🏗️ 核心完整度指標

### 1. 🎨 前端開發
**完成度：** true%  
**狀態：** 🚧 進行中  
- [x] 一鍵流程（處理 Arima：匯入→驗證→達標即產包/Sketch）
- [x] 設定面板（.erslicerc.json：門檻/包含項/覆寫策略/是否生成 Sketch）
- [x] 匯入報告檢視（含 TODO 與差異）
- [x] 模組詳情：查看 AI 規格/匯入報告、補齊精靈（HTML→語義建議預填）
- [x] 自動生成 CVA 變體、React 元件草稿、Story/Test
- [ ] HTML 更深層解析（table/list/form 的結構與樣式映射）

### 2. ⚙️ 後端開發  
**完成度：** 60%  
**狀態：** 🚧 進行中  
- [x] Tauri 指令整合（設計資產/站點圖/DB 介面）
- [x] 一鍵流程打通（產包+可選 Sketch 輸出）
- [ ] CLI 無頭流程（erslice process <path|zip> --preset <name>）

### 3. 🗃️ 資料庫
**完成度：** 60%  
**狀態：** 🚧 進行中  
- [x] AI 規格/模板/設計模組 CRUD 接口（SQLite）
- [x] 備份/還原、連線狀態與統計
- [ ] 進度與分數的歷史化記錄

### 4. 🚀 部署
**完成度：** 60%  
**狀態：** 🚧 進行中  
- [x] 一鍵本地打包（Tauri）
- [x] GitHub Actions 基礎流程
- [ ] 產包摘要與哈希、無差異跳過
- [ ] 監控與告警

### 5. ✅ 驗證
**完成度：** 55%  
**狀態：** 🚧 進行中  
- [x] 完整度 Gate（低於門檻阻擋產包並導流補齊）
- [x] 報告 TODO 與差異輸出
- [ ] 黃金測試與 snapshot（HTML/CSS/產包）

## 📋 功能清單

### ✅ 已完成功能
- ERS0001 — Arima 匯入（資料夾/檔案），輸出 tokens.css/tailwind.extend.json
- ERS0002 — 匯入報告（含 TODO 與 manifest 差異）
- ERS0003 — 一鍵流程（處理 Arima + 可選 Sketch）與設定檔 .erslicerc.json
- ERS0004 — 補齊精靈（HTML→語義建議預填，寫回 ai-spec.md）
- ERS0005 — 自動生成 CVA 變體、React 元件草稿、Story/Test
- ERS0006 — Sketch 輸出：套用 tokens 主題，Flex/Grid 佈局基礎映射，HTML→元件（title/nav/card/button 等）

### 🚧 進行中功能  
- ERS0101 — HTML 更深解析（table/list/form 欄位與階層）
- ERS0102 — CLI 無頭流程（process/preset）
- ERS0103 — Manifest 回寫設計（Figma 外掛對接）

### 📝 待開發功能
- **ERS0201** — tokens-to-style 更細緻映射（按類別套用色板/字級/陰影）
- **ERS0202** — 產包摘要與哈希、無差異跳過
- **ERS0203** — 黃金測試與 snapshot（HTML/CSS/產包）

## 🐛 已知問題
- 部分 HTML 類名語義不足，需補齊命名規範以提高自動映射品質

## 📝 開發筆記
- 使用的技術棧：React + TS + Tailwind + Tauri(Rust) + Vite/Vitest
- 設計決策：以 Arima 為核心匯入；一鍵流程為主，細項可高度自定；輸出切版包與 Sketch 同步
- 經驗：先確保決定性產出與 Gate，再逐步提升還原度（HTML→元件、tokens 映射）

## 🎯 下個里程碑
**目標日期：** 2025-09-30  
**目標功能：** CLI 無頭流程、HTML 深解析、產包摘要與哈希
