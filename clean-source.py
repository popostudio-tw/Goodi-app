import re

# 讀取檔案
with open('import-facts.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 刪除所有 source 欄位 (包括逗號和換行)
content = re.sub(r',?\s*"source":\s*"[^"]*"', '', content)

# 寫回檔案
with open('import-facts.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('✅ 已刪除所有 source 欄位')
