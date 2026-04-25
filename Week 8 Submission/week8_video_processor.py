"""
Pure Remedy Solutions - Video Processor  (Week 8 Submission)
Video  : AI Self-Grading Workflow and Learning Kit.mp4
Handles: silence removal (word-safe) -> speed cap (<=90 s) -> Instagram 1:1 square crop
"""

import subprocess, re, os, shutil, sys

# == CONFIG ==================================================================
FFMPEG        = r"C:\ffmpeg\ffmpeg-8.1-essentials_build\ffmpeg-8.1-essentials_build\bin\ffmpeg.exe"
INPUT         = r"C:\Users\ks_pa\Downloads\Week 8 Submission\AI Self-Grading Workflow and Learning Kit.mp4"
FOLDER        = r"C:\Users\ks_pa\Downloads\Week 8 Submission"
OUTPUT_EDITED = os.path.join(FOLDER, "AI_Learning_Machine_Edited.mp4")
OUTPUT_IG     = os.path.join(FOLDER, "AI_Learning_Machine_Instagram.mp4")
TEMP_DIR      = os.path.join(FOLDER, "_temp_proc")

SILENCE_DB    = "-35dB"   # noise floor for silence detection
SILENCE_DUR   = 0.5       # min seconds of silence to remove
WORD_PAD      = 0.18      # seconds of buffer kept around speech edges
TARGET_DUR    = 90.0      # max output duration in seconds

# == HELPERS =================================================================

def run(args, label=""):
    cmd = [FFMPEG] + args
    print(f"\n  >> {label}" if label else "")
    res = subprocess.run(cmd, stderr=subprocess.PIPE, stdout=subprocess.PIPE,
                         text=True, encoding="utf-8", errors="replace")
    if res.returncode != 0:
        print(f"  [WARN/ERR rc={res.returncode}]")
        print("  " + res.stderr[-2500:])
    else:
        print("  [OK]")
    return res

def get_duration(path):
    r = run(["-i", path, "-f", "null", "-"], f"duration of {os.path.basename(path)}")
    m = re.search(r"Duration:\s*(\d+):(\d+):([\d.]+)", r.stderr)
    return int(m.group(1))*3600 + int(m.group(2))*60 + float(m.group(3)) if m else 0.0

def get_video_wh(path):
    r = run(["-i", path, "-f", "null", "-"], f"dimensions of {os.path.basename(path)}")
    m = re.search(r"(\d{3,4})x(\d{3,4})", r.stderr)
    return (int(m.group(1)), int(m.group(2))) if m else (1920, 1080)

def detect_silences(path):
    r = run(["-i", path,
             "-af", f"silencedetect=noise={SILENCE_DB}:d={SILENCE_DUR}",
             "-f", "null", "-"], "silence detection")
    starts = [float(x) for x in re.findall(r"silence_start:\s*([\d.]+)", r.stderr)]
    ends   = [float(x) for x in re.findall(r"silence_end:\s*([\d.]+)",   r.stderr)]
    return list(zip(starts, ends))

def silences_to_segments(silences, total_dur):
    """Convert silence list -> list of (start, end) speech segments with word-safe padding."""
    keep = []
    pos  = 0.0
    for sil_s, sil_e in silences:
        seg_end = min(sil_s + WORD_PAD, sil_e)
        if seg_end > pos + 0.05:
            keep.append((pos, seg_end))
        pos = max(pos, sil_e - WORD_PAD)
    if pos < total_dur - 0.05:
        keep.append((pos, total_dur))
    merged = []
    for s, e in sorted(keep):
        if merged and s <= merged[-1][1] + 0.03:
            merged[-1] = (merged[-1][0], max(merged[-1][1], e))
        else:
            merged.append((s, e))
    return [(s, e) for s, e in merged if e - s > 0.05]

# == SILENCE REMOVAL =========================================================

def build_silence_removed(src, segments, out):
    os.makedirs(TEMP_DIR, exist_ok=True)
    seg_files = []
    total = len(segments)
    for i, (s, e) in enumerate(segments):
        sf = os.path.join(TEMP_DIR, f"s{i:05d}.mp4")
        run(["-y",
             "-ss", f"{s:.4f}", "-i", src,
             "-t",  f"{e-s:.4f}",
             "-c:v", "libx264", "-preset", "fast", "-crf", "20",
             "-c:a", "aac", "-ar", "44100",
             "-avoid_negative_ts", "make_zero",
             sf], f"cutting segment {i+1}/{total}")
        if os.path.exists(sf):
            seg_files.append(sf)
    concat_txt = os.path.join(TEMP_DIR, "concat.txt")
    with open(concat_txt, "w", encoding="utf-8") as f:
        for sf in seg_files:
            f.write(f"file '{sf.replace(os.sep, '/')}'\n")
    run(["-y", "-f", "concat", "-safe", "0", "-i", concat_txt,
         "-c:v", "libx264", "-preset", "fast", "-crf", "20",
         "-c:a", "aac", out], "joining segments")

# == SPEED ADJUSTMENT ========================================================

def apply_speed(src, factor, out):
    # atempo is capped at 2.0 per stage; chain if needed
    atempo = []
    rem = factor
    while rem > 2.0:
        atempo.append("atempo=2.0"); rem /= 2.0
    atempo.append(f"atempo={rem:.6f}")
    run(["-y", "-i", src,
         "-filter_complex",
         f"[0:v]setpts={1/factor:.6f}*PTS[v];[0:a]{','.join(atempo)}[a]",
         "-map", "[v]", "-map", "[a]",
         "-c:v", "libx264", "-preset", "slow", "-crf", "18",
         "-c:a", "aac", "-b:a", "192k",
         out], f"speed x{factor:.3f}")

# == INSTAGRAM CONVERSION (1080x1080 SQUARE) =================================

def create_instagram(src, out):
    """Create 1080x1080 square crop for Instagram feed."""
    vid_w, vid_h = get_video_wh(src)
    ig_size = 1080

    # Scale video so shortest dimension fills 1080, then center-crop
    if vid_w / vid_h >= 1:
        # Landscape: scale height to 1080, crop width
        scale_filter = f"scale=-2:{ig_size}"
    else:
        # Portrait: scale width to 1080, crop height
        scale_filter = f"scale={ig_size}:-2"

    crop_filter = f"crop={ig_size}:{ig_size}"

    run(["-y", "-i", src,
         "-vf", f"{scale_filter},{crop_filter}",
         "-r", "30",
         "-c:v", "libx264", "-preset", "slow", "-crf", "17",
         "-c:a", "aac", "-b:a", "192k",
         "-pix_fmt", "yuv420p",
         "-movflags", "+faststart",
         out], "Instagram 1080x1080 square render")

# == MAIN ====================================================================

def main():
    print("=" * 62)
    print("  PURE REMEDY SOLUTIONS - Video Processor  (Week 8)")
    print("  AI Learning Machine - Autonomous Research Engine")
    print("=" * 62)

    if not os.path.exists(INPUT):
        print(f"\n[ERROR] Input not found:\n  {INPUT}")
        sys.exit(1)

    os.makedirs(TEMP_DIR, exist_ok=True)

    # 1. Original duration
    orig_dur = get_duration(INPUT)
    print(f"\n  Original duration : {orig_dur:.2f}s")

    # 2. Detect silences
    silences = detect_silences(INPUT)
    print(f"  Silence periods   : {len(silences)}")

    # 3. Build speech segments
    segs = silences_to_segments(silences, orig_dur)
    kept = sum(e - s for s, e in segs)
    print(f"  Speech segments   : {len(segs)}  ->  {kept:.2f}s kept")

    # 4. Cut and join
    temp_joined = os.path.join(TEMP_DIR, "joined.mp4")
    build_silence_removed(INPUT, segs, temp_joined)
    joined_dur = get_duration(temp_joined)
    print(f"\n  After silence removal : {joined_dur:.2f}s")

    # 5. Speed-up if needed
    if joined_dur > TARGET_DUR:
        factor = joined_dur / TARGET_DUR
        print(f"  Speed factor needed   : {factor:.4f}x")
        apply_speed(temp_joined, factor, OUTPUT_EDITED)
    else:
        print("  No speedup needed - copying as-is")
        shutil.copy2(temp_joined, OUTPUT_EDITED)

    final_dur = get_duration(OUTPUT_EDITED)
    print(f"\n  Edited video duration : {final_dur:.2f}s")
    print(f"  Saved to              : {OUTPUT_EDITED}")

    # 6. Instagram version
    print("\n" + "-" * 62)
    print("  Creating Instagram 1080x1080 square version...")
    create_instagram(OUTPUT_EDITED, OUTPUT_IG)
    ig_dur = get_duration(OUTPUT_IG)
    print(f"\n  Instagram duration : {ig_dur:.2f}s")
    print(f"  Saved to           : {OUTPUT_IG}")

    # 7. Cleanup temp dir
    shutil.rmtree(TEMP_DIR, ignore_errors=True)

    print("\n" + "=" * 62)
    print("  ALL DONE!")
    print(f"  Edited  -> {OUTPUT_EDITED}")
    print(f"  Insta   -> {OUTPUT_IG}")
    print("=" * 62)

if __name__ == "__main__":
    main()
