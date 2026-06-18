import os
import re

directory = r"C:\Users\Bruno\Documents\AgroGB\apps\mobile\mobile_app\src\screens"

for filename in os.listdir(directory):
    if filename.endswith(".js"):
        filepath = os.path.join(directory, filename)
        with open(filepath, 'r', encoding='utf8') as f:
            content = f.read()

        # Find react-native import
        match = re.search(r"import\s+\{([^}]+)\}\s+from\s+['\"]react-native['\"];", content)
        if match:
            imports = match.group(1).split(',')
            imports = [i.strip() for i in imports if i.strip()]
            
            # Remove duplicates while preserving order
            seen = set()
            new_imports = []
            for item in imports:
                if item not in seen:
                    seen.add(item)
                    new_imports.append(item)
            
            if len(imports) != len(new_imports):
                new_import_str = f"import {{ {', '.join(new_imports)} }} from 'react-native';"
                content = content[:match.start()] + new_import_str + content[match.end():]
                with open(filepath, 'w', encoding='utf8') as f:
                    f.write(content)
                print(f"Fixed duplicates in {filename}")
