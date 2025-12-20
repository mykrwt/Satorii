import os
import struct

# Create a simple keystore file for testing purposes
keystore_data = bytearray()

# Keystore header
keystore_data.extend(b'\xFE\xED\xFE\xED')  # Magic number
keystore_data.extend(struct.pack('>I', 1))     # Version

# Simple keystore entry
keystore_data.extend(struct.pack('>I', 1))     # Entry count

# Entry data (simplified)
keystore_data.extend(b'\x01\x02\x03\x04')  # Placeholder data

with open('satorii.keystore', 'wb') as f:
    f.write(keystore_data)

print("Created satorii.keystore")
