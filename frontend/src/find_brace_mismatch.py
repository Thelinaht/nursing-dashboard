# find_brace_mismatch.py
import re

with open("src/pages/TrainingDirectorDashboard.jsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

# Focus only on lines from 810 to 1758 (0-indexed lines 809 to 1757)
jsx_lines = lines[809:1757]

stack = []
for idx, line in enumerate(jsx_lines):
    line_num = idx + 810
    
    # We want to find '{' and '}' that are parts of JSX expressions.
    # To do this safely, let's strip string literals first so we don't match braces inside strings.
    # Replace double-quoted strings, single-quoted strings, and template literals
    clean_line = re.sub(r'"[^"]*"', '""', line)
    clean_line = re.sub(r"'[^']*'", "''", clean_line)
    clean_line = re.sub(r"`[^`]*`", "``", clean_line)
    # Remove comments
    clean_line = re.sub(r"\{\/\*.*?\*\/\s*\}", "", clean_line)
    clean_line = re.sub(r"\/\/.*$", "", clean_line)
    
    for char_idx, char in enumerate(clean_line):
        if char == '{':
            stack.append((line_num, char_idx))
        elif char == '}':
            if stack:
                open_line, open_char = stack.pop()
                # print(f"Match: {open_line}:{open_char} -> {line_num}:{char_idx}")
            else:
                print(f"Extra closing brace at {line_num}:{char_idx}: {line.strip()}")

if stack:
    print(f"Unclosed braces at end: {stack}")
else:
    print("Braces are balanced!")
