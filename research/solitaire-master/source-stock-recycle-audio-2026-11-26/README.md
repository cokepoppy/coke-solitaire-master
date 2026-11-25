# Stock recycle and first post-recycle draw audio

This review aligns the stock return and first following draw in the 60 fps gameplay recording with the mixed audio track. The source is the local ignored video `research/solitaire-master/source-videos/gLd0HXtDt5I.mp4`, SHA-256 `56489d4aac9256d15de461d236a990df361621363fdc2904341a0e8e9cb64928`, from [IOSTouchplayHD Solitaire Master gameplay](https://www.youtube.com/watch?v=gLd0HXtDt5I). The decoded 94–99 s audio window is 44.1 kHz stereo PCM16; its source hash and extraction metadata are in [`audio-extraction.json`](audio-extraction.json).

## Source observations

The 60 fps frame ledger covers 97.5–99.2 s. At 98.2 s (PTS 1,508,352), the stock has returned with 11 cards. A candidate audio transient begins at 98.400 s while the stock remains visible. A second candidate begins at 98.580 s. The first changed stock-draw frame is at 98.650 s (PTS 1,515,264); the move counter reaches 56 by 98.783 s (PTS 1,517,312), and the 9♠ appears by 98.800 s (PTS 1,517,568). All 103 requested frame PTS values, actual times, and PNG hashes are in [`frames.csv`](frames.csv); the AVFoundation extraction details are in [`frames-manifest.json`](frames-manifest.json).

The 10 ms envelope shows the first event from 98.410–98.510 s, with a peak window RMS of 0.061388 and peak sample 0.231110. The next event spans 98.590–98.710 s, with peak window RMS 0.081009 at 98.610 s and peak sample 0.541473. Audio falls to digital silence after 98.750 s in this crop. These times place the first event after the recycled pile becomes visible and the second immediately before the first card motion. The two event windows are therefore assigned to recycle completion and the first draw after recycling. This is an inference from one mixed third-party recording, not proof of isolated original stems.

## Reference crops

`stock-recycle-reference.wav` captures 98.400–98.540 s and `draw-after-recycle-reference.wav` captures 98.580–98.720 s. Both are 0.14-second, 44.1 kHz stereo PCM crops with 8 ms edge fades. The normalized correlations against the decoded 0–120 s PCM are 0.99980567 at 98.400 s and 0.99995988 at 98.580 s. The next candidate matches are about 0.21, while the existing 0.38-second move sample is independently observed at ordinary stock draws such as 23.416 s and 95.096 s. The complete peak report is in [`audio-similarity.json`](audio-similarity.json); 10 ms RMS, peak, spectral-band, and centroid rows are in [`audio-envelope-97_8-99_0.csv`](audio-envelope-97_8-99_0.csv).

The game stores `recycledStockPendingDraw` with its saved state. Recycling sets it; the first following stock draw clears it. Because history snapshots include the flag, undo restores the correct cue state, and the cue also survives a reload. This keeps ordinary draws on the regular move sample while matching the distinct first draw after stock return.

Recreate the frame and PCM analyses using the commands in [`stock-recycle-transition-2026-11-25`](../stock-recycle-transition-2026-11-25/README.md) and the crop timestamps above. The source video and full decoded PCM remain local and ignored; the repository keeps only compact ledgers, hashes, correlation output, and the two event-level candidate WAVs.
