# check_tags.py
import re

with open("src/pages/TrainingDirectorDashboard.jsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

# Simple tag balancer
stack = []
for idx, line in enumerate(lines):
    line_num = idx + 1
    # Find all opening and closing tags on this line
    # Match tags like <div>, <div ...>, </div>, <></>, <Layout ...>, etc.
    # Exclude self-closing tags like <input />, <img />, <Plus />
    # Also ignore comments
    clean_line = re.sub(r"\{\/\*.*?\*\/\s*\}", "", line) # remove jsx comments
    clean_line = re.sub(r"\/\/.*$", "", clean_line) # remove single-line comments
    
    # Find tags
    tags = re.findall(r"<\/?(?:[a-zA-Z0-9_\-]+|\<\>)(?:\s+[a-zA-Z0-9_\-]+(?:=(?:\"[^\"]*\"|'[^']*'|\{[^\}]*\}|[a-zA-Z0-9_\-]+))?)*\s*\/?>", clean_line)
    
    for tag in tags:
        # Check if self-closing
        if tag.endswith("/>") or "input" in tag.lower() or "br" in tag.lower() or "img" in tag.lower():
            # self-closing, ignore
            continue
        
        # Check if closing tag
        if tag.startswith("</"):
            tag_name = tag[2:-1].strip().split()[0].replace(">", "")
            if not tag_name:
                tag_name = "<>"
            if stack:
                last_tag, last_line = stack.pop()
                if last_tag != tag_name and tag_name != "<>" and last_tag != "<>":
                    print(f"Mismatch at line {line_num}: found {tag} but expected {last_tag} (opened at line {last_line})")
            else:
                print(f"Extra closing tag at line {line_num}: {tag}")
        else:
            tag_name = tag[1:-1].strip().split()[0]
            if tag_name.startswith("?"): # xml or whatever
                continue
            if not tag_name:
                tag_name = "<>"
            stack.append((tag_name, line_num))

if stack:
    print(f"Unclosed tags at end of file: {stack}")
else:
    print("Tags are balanced!")
