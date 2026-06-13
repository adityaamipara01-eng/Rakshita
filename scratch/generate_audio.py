import wave
import math
import struct
import os

os.makedirs('c:/Users/ADITYA/HACKTHONE/rakshika/assets', exist_ok=True)
path = 'c:/Users/ADITYA/HACKTHONE/rakshika/assets/alarm.mp3'

# Create a 2-second siren sound (modulating sine wave)
sample_rate = 11025
duration = 2.0
num_samples = int(sample_rate * duration)

with wave.open(path, 'wb') as w:
    w.setnchannels(1)
    w.setsampwidth(2) # 16-bit
    w.setframerate(sample_rate)
    for i in range(num_samples):
        t = i / sample_rate
        # Frequency fluctuates between 600Hz and 1200Hz to sound like a siren
        freq = 900 + 300 * math.sin(2 * math.pi * 3 * t)
        val = int(25000 * math.sin(2 * math.pi * freq * t))
        w.writeframes(struct.pack('<h', val))

print(f"Siren sound generated successfully at {path}")
