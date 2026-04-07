# UI State Checklist

完成任何 React UI 元件前，至少檢查：

- [ ] loading state 只在真的沒有資料時顯示主載入狀態
- [ ] error state 有清楚訊息與可重試方式
- [ ] empty state 有下一步指引
- [ ] submit / mutation 有成功或失敗 feedback
- [ ] 按鈕在 async 中有 disable + loading 樣式
- [ ] 入口卡片與表單都有 hover / focus / disabled 行為