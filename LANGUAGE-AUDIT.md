# Language audit, October 2026

All nine translations (335 strings each) were reviewed line by line against the English for naturalness, cultural fit, register and UI clarity. The aim: copy that reads as if it were written in each language, plain rather than poetic, with nothing that feels machine-translated or "AI-eloquent". English is the source and was not changed.

| Language | Verdict before | Strings changed |
|---|---|---|
| German (de) | Solid, consistent formal "Sie", correct Swiss spelling | 49 |
| Swiss German (gsw) | Warm and authentic, but inconsistent spelling | 46 |
| French (fr) | Strongest of all; typography needed fixing | 91 (≈60 are typography) |
| Italian (it) | Natural, but literary past tense and calques | 44 |
| Spanish (es) | Natural, but "película", stray "vosotros", calques | 46 |
| Portuguese (pt, European) | Natural, with spelling errors and gendered phrasing | 49 |
| Chinese (zh, Simplified) | Very well localized; English place names in sentences | 37 |
| Vietnamese (vi) | Natural and respectful; "Vietnam" spelled in English | 46 |
| Japanese (ja) | Excellent; English place names, one register slip | 41 |

## Issues found across languages

1. **English place names inside translated text.** "Zurich", "Rome", "Tokyo", "Vietnam" and "Switzerland" appeared in their English form in eight languages. Now localized, for example Zürich / Rom / Tokio (de), Züri (gsw), Zurigo / Roma / Parigi (it), Zúrich / Roma / Tokio (es), Zurique / Tóquio / Vietname (pt), 苏黎世 / 越南 (zh), Việt Nam / Úc / Thụy Sĩ (vi), チューリッヒ / ベトナム (ja). Street addresses (Rüdigerstrasse 7, 8045 Zürich) stay as written so maps and post work.
2. **Competition terms translated literally.** "Freestyle" had become swimming terms ("stile libero", "estilo libre", "estilo livre", "tự do"). Category names (Eastern Freestyle, Asian Inspired) are now kept as titles.
3. **"Film" rendered as a cinema film.** Spanish, Portuguese and Vietnamese used película / filme / phim for short clips; now "vídeo" / "video".
4. **Literal lines.** Examples: "Make room for yourself" had become "Faites-vous une place", "Hazte un espacio", "Fai spazio a te", "Dành chỗ cho chính mình". These now read like natural invitations to take time for yourself.
5. **Mindset label.** Long paraphrases on the wheel ("Innere Haltung", "Atteggiamento mentale", "Actitud mental") replaced with what people actually say: Mindset (de, gsw, it), Mentalidad (es), Mentalidade (pt).
6. **UI labels.** Shorter, standard wording for "Tap for sound" (now simply "turn sound on"), "More ways to reach Matthew" (now "other contact options") and the experiment button.

## Per language, highlights

**German.** Familiar sayings: "Energie folgt der Aufmerksamkeit" and "Wohin der Fokus geht, fliesst die Energie". "Entfachen Sie Ihr inneres Feuer neu" became "Das innere Feuer neu entfachen". "Ich bin unsicher" became "Ich bin mir nicht sicher". "Es war auch da" became "Es war die ganze Zeit da". "Übernimmt die Krankenkasse die Kosten?" replaces a stiff noun-phrase question. "Berufstätige" (employees) became "Führungskräfte" for professionals. The experiment button is now "Experiment starten".

**Swiss German.** Spelling unified ("Experimänt", "sächs", "D Spraach hät nöd chöne glade wärde"). Required articles restored ("zum Matthew", "De Matthew meldet sich"). Infinitives corrected ("zum mitenand z lerne", "zum wieder gfasst z sii"). Natural phrases such as "Zahlt d Chrankekasse öppis?" and "Nimm der Ziit für dich".

**French.** Typography: curly apostrophes throughout and the non-breaking space before ? ! : ; so punctuation never wraps alone. "Thérapeute en transformation" (reads as "a therapist who is transforming") became "Thérapeute transformationnel". "Les séances sont-elles remboursées par l'assurance ?" replaces a bureaucratic question. "à la Rüdigerstrasse 7" fixes the address grammar.

**Italian.** The About story moved from the literary passato remoto ("lasciò, iniziò, diede") to the everyday passato prossimo ("ha lasciato, è iniziata, ha trovato casa"). "Come ti senti a tuo agio" (ungrammatical) became "Come preferisci". "Home" and "Privacy" match Italian web conventions.

**Spanish.** The stray plural "Conversad / acordad" (vosotros) is gone; copy now consistently speaks to one person. "Como te sientas a gusto" became "A tu manera". "No lo sé con certeza" became "No lo tengo claro".

**Portuguese.** Spelling errors fixed ("Australia" → "Austrália", "Vietnam" → "Vietname"). "Experimente esta experiência!" (repetitive) became "Fazer a experiência". Gendered phrases ("vê-lo", "conhecê-lo", "para o ouvir") were made neutral. The plural "Conversem" was removed.

**Chinese.** Place names in Chinese with proper spacing. 一楼 for ground floor, a cleaner counter (已选择 {count} / 3), 短片 used consistently, and simpler UI labels (开启声音, 其他联系方式, 普通电话).

**Vietnamese.** Việt Nam spelled correctly (important for Matthew's own story). "thử nghiệm" used consistently, the lofty "phụng sự" became "giúp đỡ người khác", and "Theo sự thoải mái của bạn" became "Theo cách của bạn".

**Japanese.** The casual "試してみよう！" became the polite UI "実験をはじめる". 1階 for ground floor. 要素 used consistently for the elements, イースタン・フリースタイル for the category, and 温 / 冷 as a compact wheel label.

## Notes

- The link-in-bio page reads the same dictionaries, so every fix applies there too. Hard-coded English place names in the templates (award ribbon, closing line, tab titles, link-in-bio film caption) were also localized.
- No em or en dashes are used anywhere in the site copy.

- French already used "Zurich" correctly; Japanese and Chinese keep brand and school names (Wim Hof Method, University of Technology Sydney) in Latin script, as is usual.
- Native-speaker review is still worthwhile for Swiss German, where written dialect has no single standard spelling, and for Vietnamese, given Matthew's personal connection to it.
