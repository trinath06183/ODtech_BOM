import re

with open('templates/tracker/product_list.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix missing spaces around == in if statements
content = re.sub(r'(\{% if [a-zA-Z0-9_\.]+)==([\'\"][a-zA-Z0-9_]+[\'\"])', r'\1 == \2', content)

# Fix missing spaces before %}
content = re.sub(r'([\'\"a-zA-Z0-9_])%\}', r'\1 %}', content)

with open('templates/tracker/product_list.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('Fixed syntax errors in template.')
