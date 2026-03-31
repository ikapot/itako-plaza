import re
with open('src/data/profiles.js', encoding='utf-8') as f:
    content = f.read()
matches = list(re.finditer(r"(\w+):\s*`([^`]*)`", content, re.DOTALL))
print("Found profiles:", len(matches))
