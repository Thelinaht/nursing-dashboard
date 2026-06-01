# find_early_brace_close.py

with open("src/pages/TrainingDirectorDashboard.jsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

# Find the brace at line 816 (0-indexed line 815)
# We will trace starting from line 816 char '{'
stack = []
found_start = False

for idx, line in enumerate(lines):
    line_num = idx + 1
    if line_num < 816:
        continue
    
    # Simple parser to ignore characters inside comments and strings
    in_string = False
    string_char = None
    in_jsx_comment = False
    in_line_comment = False
    
    char_idx = 0
    while char_idx < len(line):
        char = line[char_idx]
        
        # Check comments
        if not in_string:
            if not in_jsx_comment and line[char_idx:char_idx+2] == "//":
                in_line_comment = True
                break
            if not in_jsx_comment and line[char_idx:char_idx+3] == "{/*":
                in_jsx_comment = True
                char_idx += 3
                continue
            if in_jsx_comment and line[char_idx:char_idx+3] == "*/}":
                in_jsx_comment = False
                char_idx += 3
                continue
                
        if in_jsx_comment or in_line_comment:
            char_idx += 1
            continue
            
        # Check strings
        if char in ['"', "'", "`"]:
            if not in_string:
                in_string = True
                string_char = char
            elif string_char == char:
                in_string = False
                string_char = None
                
        if in_string:
            char_idx += 1
            continue
            
        # Match braces
        if char == '{':
            if line_num == 816 and not found_start:
                # This is our outer brace!
                found_start = True
                stack.append(line_num)
                print(f"Outer brace starts at {line_num}:{char_idx}")
            elif found_start:
                stack.append(line_num)
        elif char == '}':
            if found_start:
                stack.pop()
                if not stack:
                    print(f"Outer brace CLOSED at line {line_num}:{char_idx}")
                    print(f"Line content: {line.strip()}")
                    break
        char_idx += 1
        
    if found_start and not stack:
        break
