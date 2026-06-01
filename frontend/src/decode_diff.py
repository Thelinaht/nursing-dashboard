# decode_diff.py
import sys

try:
    with open("src/diff_utf8.txt", "r", encoding="utf-8") as f:
        text = f.read()
    
    # Try decoding CP437 characters back to original UTF-8 bytes
    # Some characters might not be CP437, so we use replace or ignore
    # Let's try cp437 first
    decoded_bytes = text.encode("cp437", errors="replace")
    decoded_text = decoded_bytes.decode("utf-8", errors="replace")
    
    # Save the result
    with open("src/diff_decoded.txt", "w", encoding="utf-8") as out:
        out.write(decoded_text.replace("\r\n", "\n"))
        
    print("Success! Decoded diff written to src/diff_decoded.txt")
except Exception as e:
    print(f"Error: {e}")
