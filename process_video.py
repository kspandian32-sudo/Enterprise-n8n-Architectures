import subprocess
import re
import sys
import os

ffmpeg_exe = r"C:\Users\ks_pa\AppData\Local\CapCut\Apps\8.3.0.3497\ffmpeg.exe"
input_video = "Automate Your Proposal and Follow-Up Process with Ease.mp4"
base_name = "Automate Your Proposal and Follow-Up Process with Ease"

output_fast = f"{base_name}_no_silence_fast.mp4"
output_ig = f"{base_name}_ig_reel.mp4"

# 1. Detect silences
print("Detecting silences...")
cmd_detect = [ffmpeg_exe, "-hide_banner", "-i", input_video, "-af", "silencedetect=noise=-35dB:d=0.7", "-f", "null", "-"]
res = subprocess.run(cmd_detect, stderr=subprocess.PIPE, text=True, encoding='utf-8')
output = res.stderr

loud_spans = []
starts = re.findall(r'silence_start: ([\d\.]+)', output)
ends = re.findall(r'silence_end: ([\d\.]+)', output)

current_end = 0.0
for s, e in zip(starts, ends):
    # Add a 0.2s safety buffer around words so we don't chop tails
    start_sil = float(s) + 0.2
    end_sil = float(e) - 0.2
    
    if start_sil >= end_sil:
        continue # Silence too short after padding, skip it

    if start_sil > current_end:
        loud_spans.append((current_end, start_sil))
    current_end = end_sil

# Extract total duration
dur_match = re.search(r'Duration: (\d+):(\d+):([\d\.]+)', output)
if dur_match:
    h, m, sec = dur_match.groups()
    total_dur = int(h)*3600 + int(m)*60 + float(sec)
else:
    total_dur = 205.39

if current_end < total_dur:
    loud_spans.append((current_end, total_dur))

print(f"Found {len(loud_spans)} loud segments.")

loud_duration = sum(e - s for s, e in loud_spans)
print(f"Duration without silence: {loud_duration:.2f}s")

# Target EXACTLY 90 seconds (if loud duration is longer than that)
target_duration = 90.0
speed_factor = max(1.0, loud_duration / target_duration)
print(f"Speedup factor applied: {speed_factor:.4f}x")

# 2. Build the complex filter script
filter_script_path = "filtergraph.txt"
with open(filter_script_path, "w", encoding="utf-8") as f:
    inputs_list = []
    
    for i, (start, end) in enumerate(loud_spans):
        f.write(f"[0:v]trim=start={start:.5f}:end={end:.5f},setpts=PTS-STARTPTS[v{i}];\n")
        f.write(f"[0:a]atrim=start={start:.5f}:end={end:.5f},asetpts=PTS-STARTPTS[a{i}];\n")
        inputs_list.append(f"[v{i}][a{i}]")
        
    inputs_str = "".join(inputs_list)
    f.write(f"{inputs_str}concat=n={len(loud_spans)}:v=1:a=1[vcat][acat];\n")
    
    # Speedup and assign to final outs
    p = 1.0 / speed_factor
    f.write(f"[vcat]setpts={p:.4f}*PTS[vout];\n")
    f.write(f"[acat]atempo={speed_factor:.4f}[aout]\n")

# 3. Process the fast video
print(f"Rendering fast video ({output_fast})... This will take up to a few minutes.")
cmd_render = [
    ffmpeg_exe, "-y", "-i", input_video, 
    "-filter_complex_script", filter_script_path,
    "-map", "[vout]", "-map", "[aout]",
    "-c:v", "h264_qsv",
    "-c:a", "aac",
    output_fast
]
subprocess.run(cmd_render, check=True)
print("Finished rendering fast video.")

# 4. Process the Instagram-ready video (1080x1920 with padding)
print(f"Rendering Instagram video ({output_ig})...")
cmd_ig = [
    ffmpeg_exe, "-y", "-i", output_fast,
    "-vf", "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1",
    "-c:v", "h264_qsv",
    "-c:a", "aac",
    output_ig
]
subprocess.run(cmd_ig, check=True)

print("All tasks completed successfully!")
