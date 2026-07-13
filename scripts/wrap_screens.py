import sys
import re

def wrap_file(filepath):
    with open(filepath, 'r', encoding='utf8') as f:
        content = f.read()

    # 1. Add imports if missing
    imports_to_add = []
    if 'SafeAreaView' not in content: imports_to_add.append('SafeAreaView')
    if 'KeyboardAvoidingView' not in content: imports_to_add.append('KeyboardAvoidingView')
    if 'Platform' not in content: imports_to_add.append('Platform')
    
    if imports_to_add:
        content = re.sub(r"import \{([^}]+)\} from 'react-native';", lambda m: f"import {{{m.group(1)}, {', '.join(imports_to_add)}}} from 'react-native';", content, count=1)
    
    parts = content.split('const styles = StyleSheet.create')
    if len(parts) != 2: 
        print(f"Failed to split {filepath}")
        return
    
    main_code = parts[0]
    
    # Check if already wrapped
    if '<KeyboardAvoidingView' in main_code and '<SafeAreaView' in main_code:
        print(f"Already wrapped {filepath}")
        return

    # Find the LAST </View> before styles
    last_view_index = main_code.rfind('</View>')
    if last_view_index != -1:
        main_code = main_code[:last_view_index] + '</View>\n            </KeyboardAvoidingView>\n        </SafeAreaView>' + main_code[last_view_index+7:]
        
    # Find the LAST <View style={[styles.container
    last_container_idx = main_code.rfind('<View style={[styles.container')
    if last_container_idx != -1:
        # Check if theme is imported or use activeColors
        bg_var = "theme?.colors?.bg || '#0F172A'"
        if "activeColors.bg" in main_code: bg_var = "activeColors.bg || '#0B121E'"
        
        prefix = f"<SafeAreaView style={{ flex: 1, backgroundColor: {bg_var} }}>\n            <KeyboardAvoidingView behavior={{Platform.OS === 'ios' ? 'padding' : 'height'}} style={{flex: 1}}>\n                "
        main_code = main_code[:last_container_idx] + prefix + main_code[last_container_idx:]
    
    with open(filepath, 'w', encoding='utf8') as f:
        f.write(main_code + 'const styles = StyleSheet.create' + parts[1])
    print(f"Successfully wrapped {filepath}")

for f in sys.argv[1:]:
    wrap_file(f)
