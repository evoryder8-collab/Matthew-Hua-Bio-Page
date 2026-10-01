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
