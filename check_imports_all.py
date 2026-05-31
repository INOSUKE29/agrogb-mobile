import os, re

base_dir = r'C:\Users\Bruno\Documents\AgroGB\apps\mobile\mobile_app'
src_dir = os.path.join(base_dir, 'src')

missing = []

for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith('.js') or file.endswith('.jsx'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Match imports like `import X from './path'` or `import { X } from '../path'`
            matches = re.findall(r'from\s+[\'\"](\.[^\'\"]+)[\'\"]', content)
            matches.extend(re.findall(r'import\s+[\'\"](\.[^\'\"]+)[\'\"]', content)) # for side-effect imports
            
            for m in matches:
                # Resolve the relative path
                imported_path = os.path.normpath(os.path.join(root, m))
                
                path_js = imported_path + '.js'
                path_jsx = imported_path + '.jsx'
                path_ts = imported_path + '.ts'
                path_tsx = imported_path + '.tsx'
                path_dir = os.path.join(imported_path, 'index.js')
                path_dir_ts = os.path.join(imported_path, 'index.ts')
                path_dir_tsx = os.path.join(imported_path, 'index.tsx')
                
                # Check if any of these exist
                if not any(os.path.exists(p) for p in [path_js, path_jsx, path_ts, path_tsx, path_dir, path_dir_ts, path_dir_tsx, imported_path]):
                    missing.append((filepath, m, imported_path))

for file, import_str, resolved_path in missing:
    print(f"File: {file}\nMissing Import: {import_str}\n")
