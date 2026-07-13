import os, re
with open(r'C:\Users\Bruno\Documents\AgroGB\apps\mobile\mobile_app\App.js', 'r', encoding='utf-8') as f:
    content = f.read()
matches = re.findall(r'import\s+.*?\s+from\s+[\'\"](\./src/[^\'\"]+)[\'\"]', content)
base_dir = r'C:\Users\Bruno\Documents\AgroGB\apps\mobile\mobile_app'
missing = []
for m in matches:
    path = os.path.join(base_dir, m.replace('./', '').replace('/', os.sep)) + '.js'
    path_ts = os.path.join(base_dir, m.replace('./', '').replace('/', os.sep)) + '.ts'
    path_tsx = os.path.join(base_dir, m.replace('./', '').replace('/', os.sep)) + '.tsx'
    path_jsx = os.path.join(base_dir, m.replace('./', '').replace('/', os.sep)) + '.jsx'
    path_dir = os.path.join(base_dir, m.replace('./', '').replace('/', os.sep), 'index.js')
    if not os.path.exists(path) and not os.path.exists(path_ts) and not os.path.exists(path_tsx) and not os.path.exists(path_dir) and not os.path.exists(path_jsx):
        print('MISSING:', path)
