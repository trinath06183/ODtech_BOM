import re

with open('templates/tracker/product_list.html', 'r', encoding='utf-8') as f:
    content = f.read()

def reformat_option(match):
    indent = match.group(1)
    val = match.group(2)
    stage_type = match.group(3)
    val2 = match.group(4)
    label = match.group(5)
    
    return f'{indent}<option value="{val}"\n{indent}    {{% if product.{stage_type} == \'{val2}\' %}}selected{{% endif %}}>\n{indent}    {label}\n{indent}</option>'

content = re.sub(r'( +)<option\s+value=\"([A-Z_]+)\"\s*\{%\s*if\s+product\.(customer_stage|supplier_stage)\s*==\s*[\'\"]([A-Z_]+)[\'\"]\s*%\}selected\{%\s*endif\s*%\}>([^<]+)</option>', reformat_option, content)

with open('templates/tracker/product_list.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('Reformatted option tags.')
