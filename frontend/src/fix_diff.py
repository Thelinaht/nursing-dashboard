# fix_diff.py
import re

with open("src/diff_utf8.txt", "rb") as f:
    content = f.read()

# Convert CRLF to LF
content = content.replace(b"\r\n", b"\n")

# Remove any trailing carriage return in case of single \r
content = content.replace(b"\r", b"")

# Write it back
with open("src/diff_fixed.txt", "wb") as f:
    f.write(content)

print("Diff file fixed and written to src/diff_fixed.txt")
