# find_brackets_mismatch.py
import re

with open("src/pages/TrainingDirectorDashboard.jsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

# Focus only on lines from 810 to 1758 (0-indexed lines 809 to 1757)
jsx_lines = lines[809:1757]

stack = []
for idx, line in enumerate(jsx_lines):
    line_num = idx + 810
    
    # Replace strings and comments to avoid matching brackets inside them
    clean_line = re.sub(r'"[^"]*"', '""', line)
    clean_line = re.sub(r"'[^']*'", "''", clean_line)
    clean_line = re.sub(r"`[^`]*`", "``", clean_line)
    clean_line = re.sub(r"\{\/\*.*?\*\/\s*\}", "", clean_line)
    clean_line = re.sub(r"\/\/.*$", "", clean_line)
    
    for char_idx, char in enumerate(clean_line):
        if char == '[':
            stack.append((line_num, char_idx))
        elif char == ']':
            if stack:
                stack.pop()
            else:
                print(f"Extra closing bracket at {line_num}:{char_idx}: {line.strip()}")

if stack:
    print(f"Unclosed brackets at end: {stack}")
else:
    print("Brackets are balanced!")
