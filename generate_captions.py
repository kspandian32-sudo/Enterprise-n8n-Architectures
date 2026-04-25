import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
from faster_whisper import WhisperModel

video_file = "Automate Your Proposal and Follow-Up Process with Ease_no_silence_fast.mp4"
srt_file = "Automate Your Proposal and Follow-Up Process with Ease_ig_reel.srt"

print("Loading Whisper model (tiny.en) on CPU for safety... This may download ~150MB the first time.")
try:
    model = WhisperModel("tiny.en", device="cpu", compute_type="float32")
except Exception as e:
    print(f"Error loading model: {e}")
    exit(1)

print(f"Transcribing '{video_file}'...")
try:
    segments, info = model.transcribe(video_file, beam_size=5, word_timestamps=False)
except Exception as e:
    print(f"Error transcribing: {e}")
    exit(1)

def format_timestamp(seconds: float):
    hours = int(seconds / 3600)
    minutes = int((seconds % 3600) / 60)
    secs = int(seconds % 60)
    millis = int((seconds - int(seconds)) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"

count = 0
with open(srt_file, "w", encoding="utf-8") as f:
    for i, segment in enumerate(segments, start=1):
        start = format_timestamp(segment.start)
        end = format_timestamp(segment.end)
        f.write(f"{i}\n{start} --> {end}\n{segment.text.strip()}\n\n")
        print(f"[{start} --> {end}] {segment.text.strip()}")
        count += 1

print(f"\nSuccess! Wrote {count} subtitle chunks to '{srt_file}'")
