
import os

css_path = '/home/jhon/.gemini/antigravity/scratch/spesfidem_aluminio/css/style.css'

with open(css_path, 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    # Match the start of the problematic block
    if '@media (max-width: 768px) {' in line and i > 820 and i < 830:
        new_lines.append('/* Responsive */\n')
        new_lines.append('@media (max-width: 768px) {\n')
        new_lines.append('    .hero h1 {\n')
        new_lines.append('        font-size: 2.5rem;\n')
        new_lines.append('    }\n')
        new_lines.append('\n')
        new_lines.append('    .big-menu {\n')
        new_lines.append('        display: none;\n')
        new_lines.append('        width: 100%;\n')
        new_lines.append('        flex-direction: column;\n')
        new_lines.append('        align-items: center;\n')
        new_lines.append('        margin-top: 1rem;\n')
        new_lines.append('        background: rgba(15, 23, 42, 0.98);\n')
        new_lines.append('        padding: 1rem;\n')
        new_lines.append('        border-radius: 8px;\n')
        new_lines.append('    }\n')
        new_lines.append('\n')
        new_lines.append('    .big-menu.active {\n')
        new_lines.append('        display: flex;\n')
        new_lines.append('    }\n')
        new_lines.append('\n')
        new_lines.append('    .mobile-menu-btn {\n')
        new_lines.append('        display: block;\n')
        new_lines.append('    }\n')
        new_lines.append('}\n')
        skip = True
        continue
    
    if skip:
        # Stop skipping after the old broken block
        if '/* --- TOAST NOTIFICATIONS --- */' in line:
            skip = False
            new_lines.append(line)
        continue
    
    new_lines.append(line)

# Ensure the file has enough closing braces at the end
content = "".join(new_lines)
open_braces = content.count('{')
close_braces = content.count('}')

print(f"Braces: {open_braces} open, {close_braces} closed")

if open_braces > close_braces:
    for _ in range(open_braces - close_braces):
        content += "\n}"

with open(css_path, 'w') as f:
    f.write(content)

print("Fix completed.")
