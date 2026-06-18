import sys

def fix_syntax(filepath):
    with open(filepath, 'r', encoding='utf8') as f:
        content = f.read()

    # Fix SafeAreaView style
    content = content.replace("style={ flex: 1, backgroundColor: theme?.colors?.bg || '#0F172A' }", "style={{ flex: 1, backgroundColor: theme?.colors?.bg || '#0F172A' }}")
    content = content.replace("style={ flex: 1, backgroundColor: activeColors.bg || '#0B121E' }", "style={{ flex: 1, backgroundColor: activeColors.bg || '#0B121E' }}")
    
    # Fix KeyboardAvoidingView style
    content = content.replace("style={flex: 1}", "style={{flex: 1}}")

    with open(filepath, 'w', encoding='utf8') as f:
        f.write(content)

for f in sys.argv[1:]:
    fix_syntax(f)
