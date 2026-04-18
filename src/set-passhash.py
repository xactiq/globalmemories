#!/usr/bin/env python3
from pathlib import Path
import hashlib
import sys

passphrase = sys.argv[1] if len(sys.argv) > 1 else 'change-me-memory-globe'
hash_value = hashlib.sha256(passphrase.encode()).hexdigest()
config_path = Path(__file__).resolve().parents[1] / 'public' / 'config.js'
config_path.write_text(f"window.MEMORY_GLOBE_PASSHASH = '{hash_value}';\n")
print(hash_value)
