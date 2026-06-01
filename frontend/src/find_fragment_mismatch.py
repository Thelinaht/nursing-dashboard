# find_fragment_mismatch.py

with open("src/pages/TrainingDirectorDashboard.jsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

stack = []
for idx, line in enumerate(lines):
    line_num = idx + 1
    if line_num < 810:
        continue
    
    # We want to match '<>' and '</>'
    # Simple regex or split
    # Let's count them on each line
    import re
    # Remove strings
    clean_line = re.sub(r'"[^"]*"', '""', line)
    clean_line = re.sub(r"'[^']*'", "''", clean_line)
    clean_line = re.sub(r"`[^`]*`", "``", clean_line)
    
    opens = re.findall(r"<>\s*", clean_line)
    closes = re.findall(r"<\/>\s*", clean_line)
    
    for _ in opens:
        stack.append(line_num)
        # print(f"Open fragment at line {line_num}")
    for _ in closes:
        if stack:
            open_line = stack.pop()
            # print(f"Close fragment at line {line_num} (opened at line {open_line})")
        else:
            print(f"Extra close fragment at line {line_num}")

if stack:
    print(f"Unclosed fragments at end: {stack}")
else:
    print("Fragments are balanced!")
