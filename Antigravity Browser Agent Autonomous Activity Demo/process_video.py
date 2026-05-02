"""
Antigravity Browser Agent - Autonomous Activity Demo Processor
Video  : Autonomous Workflow Creation Watchdog Demo Danger.mp4
Handles: silence removal (gentlest, word-safe) -> speed cap (<=180 s) -> Instagram 9:16 beautification
"""

import subprocess, re, os, shutil, sys

# == CONFIG ==================================================================
FFMPEG        = r"C:\ffmpeg\ffmpeg-8.1-essentials_build\ffmpeg-8.1-essentials_build\bin\ffmpeg.exe"
FOLDER        = r"C:\AI-SEO\mission-control\Antigravity Browser Agent Autonomous Activity Demo"
INPUT         = os.path.join(FOLDER, "Autonomous Workflow Creation Watchdog Demo Danger.mp4")
OUTPUT_EDITED = os.path.join(FOLDER, "Autonomous_Workflow_Demo_Edited.mp4")
OUTPUT_IG     = os.path.join(FOLDER, "Autonomous_Workflow_Demo_Instagram.mp4")
TEMP_DIR      = os.path.join(FOLDER, "_temp_proc_autonomous")

SILENCE_DB    = "-45dB"   # gentlest noise floor: only very clear silences detected
SILENCE_DUR   = 1.0       # min seconds of silence to remove (longer = gentler = fewer cuts)
WORD_PAD      = 0.25      # generous buffer kept around speech edges to protect words
TARGET_DUR    = 180.0     # max output duration in seconds

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
    if os.path.exists(TEMP_DIR): shutil.rmtree(TEMP_DIR)
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

# == INSTAGRAM CONVERSION ====================================================

def create_instagram(src, out):
    vid_w, vid_h = get_video_wh(src)
    ig_w, ig_h   = 1080, 1920

    scale_h = int(ig_w * vid_h / vid_w / 2) * 2
    y_off   = (ig_h - scale_h) // 2
    bar_h   = y_off
    bb      = ig_h - bar_h

    fb = "C\\:/Windows/Fonts/arialbd.ttf"
    fr = "C\\:/Windows/Fonts/arial.ttf"

    sz_xl = max(44, min(58, bar_h // 9))
    sz_lg = max(32, min(44, bar_h // 12))
    sz_md = max(24, min(34, bar_h // 16))
    sz_sm = max(18, min(27, bar_h // 20))
    sz_xs = max(15, min(22, bar_h // 26))

    tr1 = bar_h // 6
    tr2 = bar_h * 2 // 6
    tr3 = bar_h * 3 // 6
    tr4 = bar_h * 4 // 6
    tr5 = bar_h * 5 // 6

    br1 = bb + bar_h // 6
    br2 = bb + bar_h * 2 // 6
    br3 = bb + bar_h * 3 // 6
    br4 = bb + bar_h * 4 // 6
    br5 = bb + bar_h * 5 // 6

    m, brk, bt, sbw, dr = 32, 30, 3, 6, 5
    alw, alx = ig_w * 3 // 5, (ig_w - (ig_w * 3 // 5)) // 2

    P = []
    # 1. Background: Deep Space Cyan-Violet Blur
    P.append(
        f"[0:v]scale={ig_w}:{ig_h}:force_original_aspect_ratio=increase,crop={ig_w}:{ig_h},boxblur=30:7,"
        f"colorchannelmixer=rr=0.1:rg=0.0:rb=0.2:gr=0.0:gg=0.1:gb=0.2:br=0.3:bg=0.1:bb=1.0[bg]"
    )
    P.append(f"[0:v]scale={ig_w}:{scale_h}[vid]")
    P.append(f"[bg][vid]overlay=0:{y_off}[base]")

    # Top/Bottom Bars Base
    P.append(f"[base]drawbox=x=0:y=0:w={ig_w}:h={bar_h}:color=0x08081A@0.98:t=fill[tb]")
    P.append(f"[tb]drawbox=x=0:y={bb}:w={ig_w}:h={bar_h}:color=0x08081A@0.98:t=fill[bb]")

    # Side Accents
    P.append(f"[bb]drawbox=x=0:y=0:w={sbw}:h={ig_h}:color=0x22D3EE@0.8:t=fill[sb1]")
    P.append(f"[sb1]drawbox=x={ig_w-sbw}:y=0:w={sbw}:h={ig_h}:color=0x8B5CF6@0.8:t=fill[sb2]")

    # Top Bar Text
    P.append(f"[sb2]drawtext=text='🤖 AUTONOMOUS AI AGENT':fontfile='{fb}':fontsize={sz_sm}:fontcolor=0x22D3EE:x=(w-text_w)/2:y={tr1-sz_sm//2}:shadowcolor=black:shadowx=2:shadowy=2[tx1]")
    P.append(f"[tx1]drawtext=text='FULL LAPTOP CONTROL':fontfile='{fb}':fontsize={sz_xl}:fontcolor=0xFFFFFF:x=(w-text_w)/2:y={tr2-sz_xl//2}:shadowcolor=0x7C3AED:shadowx=3:shadowy=3[tx2]")
    P.append(f"[tx2]drawtext=text='Antigravity Browser Agent':fontfile='{fr}':fontsize={sz_md}:fontcolor=0xA78BFA:x=(w-text_w)/2:y={tr3-sz_md//2}[tx3]")
    P.append(f"[tx3]drawtext=text='--------------------------------------':fontfile='{fr}':fontsize={sz_sm}:fontcolor=0x1E1E2E:x=(w-text_w)/2:y={tr4-sz_sm//2}[tx4]")

    # Bottom Bar Text
    P.append(f"[tx4]drawtext=text='n8n  WORKFLOW  CREATION':fontfile='{fb}':fontsize={sz_sm}:fontcolor=0x22D3EE:x=(w-text_w)/2:y={br1-sz_sm//2}[tx5]")
    P.append(f"[tx5]drawtext=text='Zero Human Input | Pure Intelligence':fontfile='{fb}':fontsize={sz_lg}:fontcolor=0xFFFFFF:x=(w-text_w)/2:y={br2-sz_lg//2}:shadowcolor=0x7C3AED:shadowx=2:shadowy=2[tx6]")
    P.append(f"[tx6]drawtext=text='The Future of Automation is Here':fontfile='{fr}':fontsize={sz_md}:fontcolor=0x67E8F9:x=(w-text_w)/2:y={br3-sz_md//2}[tx7]")
    P.append(f"[tx7]drawtext=text='Watch the Agent Build in Real-Time':fontfile='{fr}':fontsize={sz_sm}:fontcolor=0x4B5563:x=(w-text_w)/2:y={br4-sz_sm//2}[out]")

    fc = ";".join(P)
    run(["-y", "-i", src, "-filter_complex", fc, "-map", "[out]", "-map", "0:a",
         "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-c:a", "aac", "-b:a", "192k",
         "-pix_fmt", "yuv420p", "-movflags", "+faststart", out], "Instagram 9:16 render")

# == MAIN ====================================================================

def main():
    if not os.path.exists(INPUT):
        print(f"[ERROR] Input not found: {INPUT}"); sys.exit(1)
    os.makedirs(TEMP_DIR, exist_ok=True)

    orig_dur = get_duration(INPUT)
    silences = detect_silences(INPUT)
    segs = silences_to_segments(silences, orig_dur)
    
    temp_joined = os.path.join(TEMP_DIR, "joined.mp4")
    build_silence_removed(INPUT, segs, temp_joined)
    
    joined_dur = get_duration(temp_joined)
    if joined_dur > TARGET_DUR:
        apply_speed(temp_joined, joined_dur / TARGET_DUR, OUTPUT_EDITED)
    else:
        shutil.copy2(temp_joined, OUTPUT_EDITED)

    create_instagram(OUTPUT_EDITED, OUTPUT_IG)
    shutil.rmtree(TEMP_DIR, ignore_errors=True)
    print(f"\nALL DONE!\nEdited -> {OUTPUT_EDITED}\nInsta  -> {OUTPUT_IG}")

if __name__ == "__main__":
    main()
