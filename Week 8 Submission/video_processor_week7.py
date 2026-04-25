"""
Pure Remedy Solutions - Video Processor  (Week 7 Submission)
Video  : Following Leads Through Three Workflow Steps.mp4
Handles: silence removal (word-safe) -> speed cap (<=90 s) -> Instagram 9:16 beautification
"""

import subprocess, re, os, shutil, sys

# == CONFIG ==================================================================
FFMPEG        = r"C:\ffmpeg\ffmpeg-8.1-essentials_build\ffmpeg-8.1-essentials_build\bin\ffmpeg.exe"
INPUT         = r"C:\Users\ks_pa\Downloads\Week 7 Submission\Following Leads Through Three Workflow Steps.mp4"
FOLDER        = r"C:\Users\ks_pa\Downloads\Week 7 Submission"
OUTPUT_EDITED = os.path.join(FOLDER, "Following_Leads_Edited.mp4")
OUTPUT_IG     = os.path.join(FOLDER, "Following_Leads_Instagram.mp4")
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

# == INSTAGRAM CONVERSION ====================================================

def create_instagram(src, out):
    vid_w, vid_h = get_video_wh(src)
    ig_w, ig_h   = 1080, 1920

    # Scale video to fit canvas width, keep aspect ratio
    scale_h = int(ig_w * vid_h / vid_w / 2) * 2   # keep even
    y_off   = (ig_h - scale_h) // 2               # video top edge
    bar_h   = y_off                                # top and bottom bar height
    bb      = ig_h - bar_h                         # y-start of bottom bar

    print(f"\n  Video area : {ig_w}x{scale_h}")
    print(f"  Bar height : {bar_h}px each")

    # Font paths - ffmpeg needs forward slashes and escaped colons
    fb = "C\\:/Windows/Fonts/arialbd.ttf"
    fr = "C\\:/Windows/Fonts/arial.ttf"

    # -- Responsive font sizes --
    sz_xl = max(44, min(58, bar_h // 9))
    sz_lg = max(32, min(44, bar_h // 12))
    sz_md = max(24, min(34, bar_h // 16))
    sz_sm = max(18, min(27, bar_h // 20))
    sz_xs = max(15, min(22, bar_h // 26))

    # -- Top bar text row anchors (7ths for good spread) --
    tr1 = bar_h // 7
    tr2 = bar_h * 2 // 7
    tr3 = bar_h * 3 // 7
    tr4 = bar_h * 4 // 7
    tr5 = bar_h * 5 // 7

    # -- Bottom bar text row anchors --
    br1 = bb + bar_h // 7
    br2 = bb + bar_h * 2 // 7
    br3 = bb + bar_h * 3 // 7
    br4 = bb + bar_h * 4 // 7
    br5 = bb + bar_h * 5 // 7
    br6 = bb + bar_h * 6 // 7

    # -- Glow line positions --
    glt = y_off             # bottom edge of top bar (video top)
    glb = y_off + scale_h   # top edge of bottom bar (video bottom)

    # -- Decoration constants --
    m   = 32    # margin from canvas edge
    brk = 30    # corner bracket arm length
    bt  = 3     # bracket line thickness
    sbw = 6     # side accent bar width
    dr  = 5     # diamond dot half-size
    alw = ig_w * 3 // 5        # accent divider line width (60% of canvas)
    alx = (ig_w - alw) // 2    # accent divider line x-start (centered)

    # -----------------------------------------------------------------------
    # FILTER COMPLEX
    # Label chain documented at each stage for clarity:
    #   bg, vid -> base
    #   -> top bar layers (tb0-tb3)
    #   -> bottom bar layers (bb0-bb3)
    #   -> side accent bars (sb1-sb4)
    #   -> top glow lines (gl1-gl4)
    #   -> bottom glow lines (gl5-gl8)
    #   -> top bar corners (c1-c8)
    #   -> bottom bar corners (c9-c16)
    #   -> diamond dot accents (d1-d6)
    #   -> horizontal accent dividers (al1-al4)
    #   -> text layers (tx1-tx8) -> [out]
    # -----------------------------------------------------------------------
    P = []

    # 1. Background: blurred + deep cinematic blue-purple tint
    P.append(
        f"[0:v]scale={ig_w}:{ig_h}:force_original_aspect_ratio=increase,"
        f"crop={ig_w}:{ig_h},"
        f"boxblur=30:7,"
        f"colorchannelmixer="
        f"rr=0.12:rg=0.0:rb=0.08:"
        f"gr=0.0:gg=0.10:gb=0.10:"
        f"br=0.28:bg=0.08:bb=1.0[bg]"
    )

    # 2. Main video scaled to canvas width
    P.append(f"[0:v]scale={ig_w}:{scale_h}[vid]")

    # 3. Overlay video on blurred background
    P.append(f"[bg][vid]overlay=0:{y_off}[base]")

    # 4-7. Top bar: deep-space navy base + two-sided gradient bleed + mid-glow strip
    P.append(f"[base]drawbox=x=0:y=0:w={ig_w}:h={bar_h}:color=0x04040E@0.96:t=fill[tb0]")
    P.append(f"[tb0]drawbox=x=0:y=0:w={ig_w*2//5}:h={bar_h}:color=0x1E0A4A@0.35:t=fill[tb1]")
    P.append(f"[tb1]drawbox=x={ig_w*3//5}:y=0:w={ig_w*2//5}:h={bar_h}:color=0x041E3A@0.28:t=fill[tb2]")
    P.append(f"[tb2]drawbox=x=0:y={bar_h//2-1}:w={ig_w}:h=2:color=0x5B21B6@0.18:t=fill[tb3]")

    # 8-11. Bottom bar: same treatment
    P.append(f"[tb3]drawbox=x=0:y={bb}:w={ig_w}:h={bar_h}:color=0x04040E@0.96:t=fill[bb0]")
    P.append(f"[bb0]drawbox=x=0:y={bb}:w={ig_w*2//5}:h={bar_h}:color=0x1E0A4A@0.35:t=fill[bb1]")
    P.append(f"[bb1]drawbox=x={ig_w*3//5}:y={bb}:w={ig_w*2//5}:h={bar_h}:color=0x041E3A@0.28:t=fill[bb2]")
    P.append(f"[bb2]drawbox=x=0:y={bb+bar_h//2-1}:w={ig_w}:h=2:color=0x5B21B6@0.18:t=fill[bb3]")

    # 12-15. Side accent bars: left=violet, right=cyan, both bars
    P.append(f"[bb3]drawbox=x=0:y=0:w={sbw}:h={bar_h}:color=0x7C3AED@1.0:t=fill[sb1]")
    P.append(f"[sb1]drawbox=x={ig_w-sbw}:y=0:w={sbw}:h={bar_h}:color=0x0891B2@1.0:t=fill[sb2]")
    P.append(f"[sb2]drawbox=x=0:y={bb}:w={sbw}:h={bar_h}:color=0x7C3AED@1.0:t=fill[sb3]")
    P.append(f"[sb3]drawbox=x={ig_w-sbw}:y={bb}:w={sbw}:h={bar_h}:color=0x0891B2@1.0:t=fill[sb4]")

    # 16-19. Top glow lines (3-layer: outer diffuse -> mid -> bright core -> cyan accent)
    P.append(f"[sb4]drawbox=x=0:y={glt-6}:w={ig_w}:h=3:color=0x6D28D9@0.22:t=fill[gl1]")
    P.append(f"[gl1]drawbox=x=0:y={glt-3}:w={ig_w}:h=3:color=0x7C3AED@0.55:t=fill[gl2]")
    P.append(f"[gl2]drawbox=x=0:y={glt}:w={ig_w}:h=4:color=0xA78BFA@1.0:t=fill[gl3]")
    P.append(f"[gl3]drawbox=x=0:y={glt+4}:w={ig_w}:h=1:color=0x22D3EE@0.65:t=fill[gl4]")

    # 20-23. Bottom glow lines (mirrored)
    P.append(f"[gl4]drawbox=x=0:y={glb-1}:w={ig_w}:h=1:color=0x22D3EE@0.65:t=fill[gl5]")
    P.append(f"[gl5]drawbox=x=0:y={glb}:w={ig_w}:h=4:color=0xA78BFA@1.0:t=fill[gl6]")
    P.append(f"[gl6]drawbox=x=0:y={glb+4}:w={ig_w}:h=3:color=0x7C3AED@0.55:t=fill[gl7]")
    P.append(f"[gl7]drawbox=x=0:y={glb+7}:w={ig_w}:h=3:color=0x6D28D9@0.22:t=fill[gl8]")

    # 24-31. Corner brackets - Top bar (4 corners x 2 lines = 8 drawboxes)
    # Top-left of top bar: cyan
    P.append(f"[gl8]drawbox=x={m}:y={m}:w={brk}:h={bt}:color=0x22D3EE@1.0:t=fill[c1]")
    P.append(f"[c1]drawbox=x={m}:y={m}:w={bt}:h={brk}:color=0x22D3EE@1.0:t=fill[c2]")
    # Top-right of top bar: violet
    P.append(f"[c2]drawbox=x={ig_w-m-brk}:y={m}:w={brk}:h={bt}:color=0x8B5CF6@1.0:t=fill[c3]")
    P.append(f"[c3]drawbox=x={ig_w-m-bt}:y={m}:w={bt}:h={brk}:color=0x8B5CF6@1.0:t=fill[c4]")
    # Bottom-left of top bar: cyan dimmed
    P.append(f"[c4]drawbox=x={m}:y={bar_h-m-bt}:w={brk}:h={bt}:color=0x22D3EE@0.6:t=fill[c5]")
    P.append(f"[c5]drawbox=x={m}:y={bar_h-m-brk}:w={bt}:h={brk}:color=0x22D3EE@0.6:t=fill[c6]")
    # Bottom-right of top bar: violet dimmed
    P.append(f"[c6]drawbox=x={ig_w-m-brk}:y={bar_h-m-bt}:w={brk}:h={bt}:color=0x8B5CF6@0.6:t=fill[c7]")
    P.append(f"[c7]drawbox=x={ig_w-m-bt}:y={bar_h-m-brk}:w={bt}:h={brk}:color=0x8B5CF6@0.6:t=fill[c8]")

    # 32-39. Corner brackets - Bottom bar (same pattern)
    P.append(f"[c8]drawbox=x={m}:y={bb+m}:w={brk}:h={bt}:color=0x22D3EE@1.0:t=fill[c9]")
    P.append(f"[c9]drawbox=x={m}:y={bb+m}:w={bt}:h={brk}:color=0x22D3EE@1.0:t=fill[c10]")
    P.append(f"[c10]drawbox=x={ig_w-m-brk}:y={bb+m}:w={brk}:h={bt}:color=0x8B5CF6@1.0:t=fill[c11]")
    P.append(f"[c11]drawbox=x={ig_w-m-bt}:y={bb+m}:w={bt}:h={brk}:color=0x8B5CF6@1.0:t=fill[c12]")
    P.append(f"[c12]drawbox=x={m}:y={bb+bar_h-m-bt}:w={brk}:h={bt}:color=0x22D3EE@0.6:t=fill[c13]")
    P.append(f"[c13]drawbox=x={m}:y={bb+bar_h-m-brk}:w={bt}:h={brk}:color=0x22D3EE@0.6:t=fill[c14]")
    P.append(f"[c14]drawbox=x={ig_w-m-brk}:y={bb+bar_h-m-bt}:w={brk}:h={bt}:color=0x8B5CF6@0.6:t=fill[c15]")
    P.append(f"[c15]drawbox=x={ig_w-m-bt}:y={bb+bar_h-m-brk}:w={bt}:h={brk}:color=0x8B5CF6@0.6:t=fill[c16]")

    # 40-45. Diamond dot accents
    # Top bar: flanking dots at brand-name row height, just inside the bracket arms
    dot_y_top = tr1
    P.append(f"[c16]drawbox=x={m+brk+14}:y={dot_y_top-dr}:w={dr*2}:h={dr*2}:color=0x22D3EE@1.0:t=fill[d1]")
    P.append(f"[d1]drawbox=x={ig_w-m-brk-14-dr*2}:y={dot_y_top-dr}:w={dr*2}:h={dr*2}:color=0x8B5CF6@1.0:t=fill[d2]")
    # Top bar: center glowing diamond between tr4 and tr5 (decorative footer)
    dot_y_c = (tr4 + tr5) // 2
    P.append(f"[d2]drawbox=x={ig_w//2-dr-1}:y={dot_y_c-dr-1}:w={dr*2+2}:h={dr*2+2}:color=0x5B21B6@0.5:t=fill[d3]")
    P.append(f"[d3]drawbox=x={ig_w//2-dr}:y={dot_y_c-dr}:w={dr*2}:h={dr*2}:color=0xA78BFA@1.0:t=fill[d4]")
    # Bottom bar: flanking dots at series-label row height
    dot_y_bot = br1
    P.append(f"[d4]drawbox=x={m+brk+14}:y={dot_y_bot-dr}:w={dr*2}:h={dr*2}:color=0x22D3EE@1.0:t=fill[d5]")
    P.append(f"[d5]drawbox=x={ig_w-m-brk-14-dr*2}:y={dot_y_bot-dr}:w={dr*2}:h={dr*2}:color=0x8B5CF6@1.0:t=fill[d6]")

    # 46-49. Horizontal accent divider lines (thin, partial width, centered)
    # Top bar: between brand row and tagline
    P.append(f"[d6]drawbox=x={alx}:y={(tr1+tr2)//2}:w={alw}:h=1:color=0x4C1D95@0.5:t=fill[al1]")
    # Top bar: between category and website
    P.append(f"[al1]drawbox=x={alx}:y={(tr3+tr4)//2}:w={alw}:h=1:color=0x0E7490@0.4:t=fill[al2]")
    # Bottom bar: between series label and title
    P.append(f"[al2]drawbox=x={alx}:y={(br1+br2)//2}:w={alw}:h=1:color=0x4C1D95@0.5:t=fill[al3]")
    # Bottom bar: between cohort label and CTA
    P.append(f"[al3]drawbox=x={alx}:y={(br5+br6)//2}:w={alw}:h=1:color=0x0E7490@0.4:t=fill[al4]")

    # =========================================================================
    # TEXT LAYERS
    # =========================================================================

    # --- Top bar ---

    # Brand name: large, white-lavender, violet glow shadow + border
    P.append(
        f"[al4]drawtext="
        f"text='PURE REMEDY SOLUTIONS':"
        f"fontfile='{fb}':"
        f"fontsize={sz_xl}:"
        f"fontcolor=0xEDE9FE:"
        f"x=(w-text_w)/2:y={tr1-sz_xl//2}:"
        f"shadowcolor=0x7C3AED:shadowx=0:shadowy=4:"
        f"borderw=2:bordercolor=0x6D28D9@0.7"
        f"[tx1]"
    )

    # Tagline: cyan glow, smaller
    P.append(
        f"[tx1]drawtext="
        f"text='AI Automation  *  n8n  *  Claude':"
        f"fontfile='{fr}':"
        f"fontsize={sz_md}:"
        f"fontcolor=0x67E8F9:"
        f"x=(w-text_w)/2:y={tr2-sz_md//2}:"
        f"shadowcolor=0x0E7490:shadowx=0:shadowy=2"
        f"[tx2]"
    )

    # Category: soft lavender
    P.append(
        f"[tx2]drawtext="
        f"text='~ Workflow Automation Deep Dives ~':"
        f"fontfile='{fr}':"
        f"fontsize={sz_sm}:"
        f"fontcolor=0xA78BFA:"
        f"x=(w-text_w)/2:y={tr3-sz_sm//2}"
        f"[tx3]"
    )

    # Website: very dim deep violet
    P.append(
        f"[tx3]drawtext="
        f"text='pureremedysolutions.com':"
        f"fontfile='{fr}':"
        f"fontsize={sz_xs}:"
        f"fontcolor=0x4C1D95:"
        f"x=(w-text_w)/2:y={tr4-sz_xs//2}"
        f"[tx4]"
    )

    # --- Bottom bar ---

    # Series / week label: bright cyan with shadow
    P.append(
        f"[tx4]drawtext="
        f"text='Week 7  |  n8n Masterclass':"
        f"fontfile='{fb}':"
        f"fontsize={sz_sm}:"
        f"fontcolor=0x22D3EE:"
        f"x=(w-text_w)/2:y={br1-sz_sm//2}:"
        f"shadowcolor=0x0E7490:shadowx=0:shadowy=2"
        f"[tx5]"
    )

    # Main title line 1: pure white, strong violet glow + border
    P.append(
        f"[tx5]drawtext="
        f"text='Following Leads Through':"
        f"fontfile='{fb}':"
        f"fontsize={sz_xl}:"
        f"fontcolor=0xFFFFFF:"
        f"x=(w-text_w)/2:y={br2-sz_xl//2}:"
        f"shadowcolor=0x7C3AED:shadowx=2:shadowy=4:"
        f"borderw=1:bordercolor=0x5B21B6@0.5"
        f"[tx6]"
    )

    # Main title line 2: light lavender, slightly smaller
    P.append(
        f"[tx6]drawtext="
        f"text='Three Workflow Steps':"
        f"fontfile='{fb}':"
        f"fontsize={sz_lg}:"
        f"fontcolor=0xC4B5FD:"
        f"x=(w-text_w)/2:y={br3-sz_lg//2}:"
        f"shadowcolor=0x6D28D9:shadowx=1:shadowy=3"
        f"[tx7]"
    )

    # Cohort attribution: muted violet
    P.append(
        f"[tx7]drawtext="
        f"text='AI Architect Cohort - Pure Remedy Solutions':"
        f"fontfile='{fr}':"
        f"fontsize={sz_xs}:"
        f"fontcolor=0x7C3AED:"
        f"x=(w-text_w)/2:y={br4-sz_xs//2}"
        f"[tx8]"
    )

    # CTA: grey, understated
    P.append(
        f"[tx8]drawtext="
        f"text='Follow for daily AI automation tips  -->':"
        f"fontfile='{fr}':"
        f"fontsize={sz_sm}:"
        f"fontcolor=0x6B7280:"
        f"x=(w-text_w)/2:y={br5-sz_sm//2}"
        f"[out]"
    )

    fc = ";".join(P)

    run(["-y", "-i", src,
         "-filter_complex", fc,
         "-map", "[out]",
         "-map", "0:a",
         "-c:v", "libx264", "-preset", "slow", "-crf", "17",
         "-c:a", "aac", "-b:a", "192k",
         "-pix_fmt", "yuv420p",
         "-movflags", "+faststart",
         out], "Instagram 9:16 render")

# == MAIN ====================================================================

def main():
    print("=" * 62)
    print("  PURE REMEDY SOLUTIONS - Video Processor  (Week 7)")
    print("  Following Leads Through Three Workflow Steps")
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
    print("  Creating Instagram 9:16 version...")
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
