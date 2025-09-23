# 🎯 成員身份指定小卡

## 📝 快速語法

### Commit 中指定
```bash
git commit -m "feat: 新功能 [member:KlauderA]"
git commit -m "fix: 修復bug [member:KlauderB]"
```

### PR Title 中指定
```
[KlauderA] 實作新功能
[KlauderB] 修復登入問題
```

## ✨ 自動效果

```
🔧 原始: feat: 新增API [member:KlauderB]
✅ 備註: ✨ KlauderB • 新功能: 新增API
```

## 💡 使用時機

- 🤝 多人共用同一個 GitHub 帳號
- 🎭 一人在不同專案有不同身份
- 🎯 需要精確指定備註歸屬

## ⚠️ 注意事項

- ✅ 成員名稱要**完全正確**（區分大小寫）
- ✅ 格式：`[member:成員名稱]`
- ✅ 沒指定時會用預設對應

---
💻 **技術支援**: 詳細規範請見 [MEMBER-IDENTITY-SPEC.md](./MEMBER-IDENTITY-SPEC.md)