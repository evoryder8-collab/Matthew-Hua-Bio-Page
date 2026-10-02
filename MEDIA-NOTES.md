# Matthew Hua media delivery

Prepared 2026-10-02 for the authorized website redesign.

## Scope

- Delivered four JPEGs in `assets/editorial/` and four MP4s in `assets/films/`.
- Original assets and the source PDF were not overwritten. Original video SHA-256 hashes were checked before and after conversion and match.
- No website source, existing asset, or unrelated file was edited by this media task. No commit, push, or publication was performed.
- Only selected embedded photographs are delivered. The full PDF, extracted raw images, and inspection frames are not included in the site.

## Photo source and selection

Source: `/Users/jaxoncorrey/Downloads/LR Editing via Agent/output/pdf/Matthew_Hua_A_Life_in_Motion_Editorial_Edition.pdf`

PDF SHA-256: `7bb368e70fb96d2b2516034eadffa9b745e52d14b90c6e488286aac1f850e201`

The source contains 51 pages. Its colophon distinguishes documentary photographs from conceptual illustrations. Embedded candidates were extracted with `pdfimages -j` and visually inspected using `view_image`; every final delivery JPEG was also inspected. Selection is based on the supplied document's context and visual inspection, not independent forensic authentication.

Page numbers below are one-based PDF pages. Image numbers are the zero-based `num` values from a full-document `pdfimages -list` run, including intervening masks. Object IDs include generation numbers. Page-specific extraction resets its filename counter, so each selected JPEG was locally extracted as `page-N-000.jpg`.

| Delivery file | PDF page / context | Global image number | PDF object ID | Embedded dimensions | Delivered dimensions | Bytes | Classification |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `assets/editorial/hero-bodywork.jpg` | 14, Learning with the hands | 67 | 99 0 | 3200 x 2285 | 2200 x 1571 | 966626 | Real documentary photograph |
| `assets/editorial/about-matthew.jpg` | 1, cover portrait | 0 | 3 0 | 2560 x 3200 | 1440 x 1800 | 449783 | Real documentary photograph |
| `assets/editorial/workshop.jpg` | 22, Meeting the cold | 116 | 137 0 | 2560 x 3200 | 1440 x 1800 | 443149 | Real documentary photograph |
| `assets/editorial/stillness.jpg` | 16, Sound / Touch / Attention | 75 | 107 0 | 2560 x 3200 | 1440 x 1800 | 312929 | Real documentary photograph |

All four requested roles were available; no conceptual-image substitution was needed.

- **Hero:** Matthew applying hands-on bodywork to a prone client at an event. This is a landscape treatment photograph, not a scenic landscape or an illustration. Suggested alt: "Matthew Hua applying bodywork to a client on a massage table."
- **About:** Clear, front-facing portrait of Matthew in a white Healwell shirt. Suggested alt: "Matthew Hua wearing a white Healwell shirt."
- **Workshop:** Matthew guiding a participant beside an ice bath, with European Massage Championship 2024 signage. This documents cold-exposure instruction at that event; do not label it as a specific Zurich workshop. Suggested alt: "Matthew Hua guiding a participant during an ice-bath demonstration."
- **Stillness:** Matthew holding small cymbals above a resting client, with his hand and the instruments in focus. The shallow depth of field is already present in the source. Suggested alt: "Matthew Hua holding small cymbals above a resting client."

### Credits and excluded artwork

The workshop source contains **New Massage Association** and **iConstantine Photography** marks at the lower left. Both remain visible and intact in the final JPEG. No separate photographer signature is visibly present in the selected hero, about, or stillness embedded images; no photographer attribution has been invented. Existing garment and event marks are retained.

The conceptual travel/tree montage on page 3 (global image 10, PDF object 16 0; reused on page 4 as image 15) was inspected and excluded. No conceptual illustration or newly generated image was delivered. Other documentary candidates were reviewed but not added to the delivery set.

Full embedded image bounds were preserved: no cropping, retouching, recoloring, compositing, added blur, watermark removal, generative fill, or upscaling. Do not hide the workshop credit marks with downstream CSS cropping or overlays.

### Image export

Tools: Poppler `pdfimages` 25.08.0; macOS `sips` 316.

Extraction pattern, using a temporary directory outside the repository:

```sh
pdfimages -list "$PDF"
pdfimages -f "$PAGE" -l "$PAGE" -j "$PDF" "$TMP/page-$PAGE"
```

Delivery export pattern:

```sh
sips -s format jpeg -s formatOptions 80 -Z "$MAX_EDGE" \
  "$TMP/page-$PAGE-000.jpg" --out "$OUTPUT"
```

`MAX_EDGE` is 2200 for the hero and 1800 for the other images. The four JPEGs total 2172487 bytes (2.17 MB, decimal). Dimensions and JPEG format were verified with `sips -g pixelWidth -g pixelHeight -g format`.

## Video sources and conversion

All input paths are the existing files directly under `assets/`, not the duplicate files in the repository root or `videos/`.

| Original source | New delivery |
| --- | --- |
| `assets/reignite your inner fire promo short film.mp4` | `assets/films/inner-fire.mp4` |
| `assets/Reel 9 Awarded in EMC 2024.mp4` | `assets/films/european-championship.mp4` |
| `assets/winning champ of the champs.mp4` | `assets/films/champ-of-champs.mp4` |
| `assets/advice for other therapists as a judge.mp4` | `assets/films/advice-as-judge.mp4` |

Inputs were HEVC Main 10, 1080 x 1920, with AAC stereo audio. Delivery uses FFmpeg 8.1, libx264 H.264 High profile / level 3.1, `avc1`, 8-bit `yuv420p`, AAC-LC stereo targeting 128 kb/s, and MP4 faststart. Original frame rates and audio sample rates were retained. No video frames were dropped, no editorial trims were made, and no audio normalization or replacement was applied.

Conversion pattern:

```sh
ffmpeg -hide_banner -nostdin -n -i "$INPUT" \
  -map 0:v:0 -map 0:a:0 -map_metadata -1 \
  -vf 'scale=720:1280:force_original_aspect_ratio=decrease:force_divisible_by=2,setsar=1,pad=720:1280:(ow-iw)/2:(oh-ih)/2' \
  -c:v libx264 -preset fast -crf 24 -pix_fmt yuv420p -tag:v avc1 \
  -c:a aac -b:a 128k -movflags +faststart "$OUTPUT"
```

The original videos are already 9:16, so the aspect-preserving scale fills 720 x 1280 without cropping, stretching, or visible padding. Only video and audio streams are retained; the European source's auxiliary data stream is omitted.

**Size adjustment:** The first unrestricted CRF 24 encode of `champ-of-champs.mp4` was 24842243 bytes. It was re-encoded directly from the untouched original with the same settings plus `-maxrate 1900k -bufsize 3800k`. Only the newly created delivery was replaced. Capped CRF preserves the requested CRF/preset while allowing additional compression when needed to meet the web-delivery budget. All final films are below 20000000 bytes.

## Final ffprobe validation

Validated with ffprobe 8.1. Every output has exactly one H.264 video stream and one AAC-LC stereo audio stream. All are 720 x 1280, `yuv420p`, SAR 1:1, DAR 9:16, High profile, level 3.1.

| File in `assets/films/` | Duration (s) | Frame rate | Video frames | Audio Hz / channels | Measured video kb/s | Measured audio kb/s | Bytes | MB (decimal) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `inner-fire.mp4` | 60.186009 | 24/1 | 1443 | 44100 / 2 | 2122.332 | 129.548 | 16972894 | 16.97 |
| `european-championship.mp4` | 28.350000 | 24000/1001 | 679 | 48000 / 2 | 2184.590 | 127.080 | 8204845 | 8.20 |
| `champ-of-champs.mp4` | 73.351995 | 24/1 | 1759 | 44100 / 2 | 1845.364 | 128.703 | 18143307 | 18.14 |
| `advice-as-judge.mp4` | 35.548005 | 24/1 | 853 | 44100 / 2 | 1591.183 | 128.071 | 7667431 | 7.67 |

Video frame counts and rates match the originals exactly. Container/audio durations differ slightly after AAC re-encoding; the largest observed difference is the European film's container duration, 28.394667 s originally versus 28.350000 s delivered (44.667 ms). Its 679 video frames and 28.319958 s video duration are unchanged. No duration-limiting option was used.

Probe command:

```sh
ffprobe -v error \
  -show_entries 'format=duration,size,bit_rate:stream=index,codec_name,codec_type,profile,codec_tag_string,level,width,height,pix_fmt,sample_aspect_ratio,display_aspect_ratio,r_frame_rate,sample_rate,channels,channel_layout,duration,nb_frames,bit_rate' \
  -of json "$OUTPUT"
```

### Decode, audio, and faststart checks

Every final MP4 passed a complete video/audio decode with exit code 0 and no errors:

```sh
ffmpeg -hide_banner -v error -xerror -nostdin -i "$OUTPUT" \
  -map 0:v:0 -map 0:a:0 -f null -
```

FFmpeg `volumedetect` confirmed non-silent decoded audio in every final file. This is a technical audio-presence check, not a listening review. A frame at 8 seconds from each final film was visually inspected for valid picture, correct portrait orientation, and intact embedded text.

| Film | Audio mean / peak (dBFS) | `moov` offset | `mdat` offset | Result |
| --- | --- | --- | --- | --- |
| Inner Fire | -14.7 / 0.0 | 32 | 47226 | Decode pass; audio present; faststart pass |
| European Championship | -17.1 / 0.0 | 32 | 20709 | Decode pass; audio present; faststart pass |
| Champ of Champs | -14.1 / -0.2 | 32 | 56610 | Decode pass; audio present; faststart pass |
| Advice as Judge | -22.5 / -3.2 | 32 | 28798 | Decode pass; audio present; faststart pass |

Top-level MP4 atoms were parsed to confirm `moov` precedes `mdat` in all four files, independently of the encoder flag. Validation also asserted the output dimensions, codecs, stereo channel count, pixel format, frame counts, frame rates, and the strict 20 MB byte limit.

### Original video integrity

SHA-256 values below matched before and after all conversions:

| Original source basename | SHA-256 |
| --- | --- |
| `reignite your inner fire promo short film.mp4` | `c18b4923e22c568a18dd956b1f9cdcc6e20edb6780a4ce09c23bdca62f10babb` |
| `Reel 9 Awarded in EMC 2024.mp4` | `ed6c26d3d4d9d2985eb3b0a9e60b246bc42bd0c974f5febdfcccad217193ff3a` |
| `winning champ of the champs.mp4` | `c1763124e590aa38291f51e8acb1eb466959aaf67085914461c1953433c53c64` |
| `advice for other therapists as a judge.mp4` | `51682aab0aa8d6c5508cf83d1e2b7cf8ae07b56c3e72bd25ae87f1289b5b8dc0` |

## Interface audio (2026-10-02)

Supplied by the user for this release. Originals were read, never modified; only the web derivatives below are part of the site. They play only after the visitor explicitly chooses sound (portal "sound on" or the header speaker) and are never fetched for a visitor who declines, except that the two short effects are prefetched (not played) while the sound question is on screen.

| Delivery file | Source | Source SHA-256 | Derivative | Use |
| --- | --- | --- | --- | --- |
| `assets/sfx/sparkler-sizzle.mp3` (31,392 bytes, 1.49 s) | `~/Downloads/acid-burn-2026-05-18-16-19-43-utc/Acid Burn.wav` ("Acid Burn", AudioJungle item by urbazon / Dejan; the folder's `info.txt` is the marketplace thank-you note) | `92183d8f35ccde6f3414e924fd4185437e2a6b9a71591e951ddd7ba3c92cbfd8` | 0.15 s tail fade, MP3 160 kbps, 44.1 kHz | Signature sparkle transition (entrance and menu destinations) |
| `assets/sfx/tear-drop.mp3` (13,106 bytes, 0.60 s) | `~/Downloads/CB Video Editing Assets /CB SFX/mechanical sfx like camera or computers & misc/water-drop.mp3` | `0d549515a3b545986880cf66dfcd3ef4fa0e9d1cef5f73f9316d39658d98a617` | Leading 105 ms of silence trimmed so the transient (111 ms in the source) lands on impact; 0.18 s tail fade; MP3 160 kbps | Tear landing; replayed quieter and higher for the rebound bead and satellite droplet |
| `assets/sfx/element-wink.mp3` (18,670 bytes, 1.10 s) | `CB SFX/Glitch/Good for UI & Overlay motion graphics/Eye Wink 06.wav` | `324f8257c9c5b85dd8e2319fd69d0a11de42105277dfc66e2514d59be3ed23f3` | 25 ms lead trimmed, 0.3 s tail fade | Tapping any of the six element tabs |
| `assets/sfx/signal-pick.mp3` (19,924 bytes, 1.20 s) | `.../NEW NOTIFICATION.wav` | `28a46ae20f67317fa4dc7c9d13b966736afd3894757bcd79729cc365a1982525` | 95 ms lead trimmed, 0.3 s tail fade | Each tap on a signal while recalling the blue positions |
| `assets/sfx/red-twinkle.mp3` (21,000 bytes, 1.27 s) | `.../TWINKLE SFX.mp3` | `002a7a370a9ec83e667a8378e5d934c84409c1e76015d8ec29555ae6abe7db85` | +26 dB with limiter (source peaked near -30 dBFS), tail fade | The red signal being revealed after it was missed |
| `assets/sfx/conclusion-pop.mp3` (29,537 bytes, 1.80 s) | `.../Pop Positive 4.wav` | `77a919cf27cfeebe646940f1b8455b500863b9a7cd8f997db2a9bd3a0a07da2a` | -3 dB (source clipped), trimmed to 1.8 s with fade | The concluding Matthew/Tony slide arriving |
| `assets/sfx/slide-whoosh.mp3` (23,681 bytes, 1.40 s) | `CB SFX/Whooshes/FIRE WOOSH quick.wav` (6 s source) | `0c9dc5bba5485de05f65eb687e26c09cc0833dc5f5b80fd8d6508f9ce36cb7dc` | First 0.2 s trimmed, 1.4 s body with 0.5 s fade | The right-to-left "torch" pass between the game's teaching slides |
| `assets/sfx/magic-wink.mp3` (1.25 s) | `CB SFX/Glitch/Good for UI & Overlay motion graphics/MAGIC WINK.mp3` | `5974670e581cc0057bccc950e972a40549f466afe9bcf34d9244064a9f20c466` | 40 ms lead trimmed, +30 dB with limiter (source peaked near -34 dBFS), tail fade | Game navigation buttons (Begin, Continue, Next, Let's continue, Try again) |
| `assets/sfx/button-pop.mp3` (0.60 s) | `CB SFX/Glitch/Good for UI & Overlay motion graphics/JUG POP UP.mp3` | `43df21e3ac261c5aaf71c292ed0ce492b41e103d3740bf204dc32898e7bf971d` | 20 ms lead trimmed, short tail fade | Game Begin and Continue buttons (replaces the Magic Wink, which is no longer used) |
| `assets/audio/effortless-prestige.m4a` (3,245,106 bytes, 200 s) | `Effortless Prestige.m4a` at the repository root (Opus in MP4, 48 kHz, integrated loudness -16.8 LUFS) | `6ec6aac845bc436d4662bb8b1d93e5dce9566f0f1db18cccc73fd5052ed805da` | AAC-LC 128 kbps, 44.1 kHz, faststart; 0.8 s fade-in and 1.8 s fade-out so the loop restarts gently | Background soundtrack at gain 0.3: silent through the first sparkle and arrival film only, then continuous (effects play on top), lowered to silence only while a film plays |

```sh
ffmpeg -i "Acid Burn.wav" -af "afade=t=out:st=1.42:d=0.15" -t 1.57 -c:a libmp3lame -b:a 160k -ar 44100 sparkler-sizzle.mp3
ffmpeg -ss 0.105 -i water-drop.mp3 -t 0.6 -af "afade=t=out:st=0.42:d=0.18" -c:a libmp3lame -b:a 160k -ar 44100 tear-drop.mp3
ffmpeg -i "Effortless Prestige.m4a" -af "afade=t=in:st=0:d=0.8,afade=t=out:st=198.2:d=1.8" -c:a aac -b:a 128k -ar 44100 -movflags +faststart effortless-prestige.m4a
```

The Opus source was transcoded because Safari does not reliably play Opus inside MP4. Rights: the user confirmed on 2026-10-02 that they created these sounds and the soundtrack and hold the rights to use them on the website. The original `Effortless Prestige.m4a` remains untracked at the repository root and is not referenced by the site.

## HDR white clip (2026-10-02)

`assets/films/hdr-white.mp4` (7,576 bytes) is generated, not supplied: a 2 s, 96 x 96, solid-white HEVC Main 10 clip tagged BT.2020 / SMPTE ST 2084 (PQ) with HDR10 metadata (`hvc1`). The game's closing "Let's continue" light fades it in at full screen so EDR/HDR displays (recent iPhone Pro, MacBook Pro) can exceed SDR white; other browsers show the CSS white beneath it.

```sh
ffmpeg -f lavfi -i color=c=white:s=96x96:r=30:d=2 -pix_fmt yuv420p10le -c:v libx265 -tag:v hvc1 -color_primaries bt2020 -color_trc smpte2084 -colorspace bt2020nc -x265-params "colorprim=bt2020:transfer=smpte2084:colormatrix=bt2020nc:range=limited:hdr10=1:master-display=G(13250,34500)B(7500,3000)R(34000,16000)WP(15635,16450)L(10000000,1):max-cll=1000,400" -movflags +faststart -an hdr-white.mp4
```
