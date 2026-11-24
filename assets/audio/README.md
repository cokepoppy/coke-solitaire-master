# Audio references

`card-move-reference.wav` is a 0.38-second, 44.1 kHz stereo PCM crop from the gameplay recording [gLd0HXtDt5I](https://www.youtube.com/watch?v=gLd0HXtDt5I), at source time 18.040–18.420 seconds. The matching frame at 18.216667 seconds shows the move counter advance to 2; a second move at 26.116667 seconds has a similar audio waveform (maximum normalized cross-correlation 0.895 with a 6.69 ms alignment shift). The file SHA-256 is `a158ffdfcc30fe2aa3ee140eff2ff5e6a5700fca649204de16fb12f9a483a819`.

The browser plays this sample for tableau `move` cues and caches it for offline play. Its gain compensates for the app's master and effects buses, preserving the WAV's PCM level in browser output; E2E verifies the effective gain is 1.0 before device volume. It comes from a mixed third-party recording, so treat it as a source-matched reference effect rather than a verified isolated master. Other effects and the ambient music remain synthesized approximations.

`combo-amazing-reference.wav` is a 0.96-second, 44.1 kHz stereo PCM crop from the same recording, at source time 72.820–73.780 seconds. The source frame at 72.900 seconds visibly shows `COMBO 4` and the `Amazing` overlay; a second audible transient follows at 73.550 seconds during its visual follow-through. The crop has an 8 ms edge fade and SHA-256 `876816e12714b09628fd03dc7e94685752c92cb09134495bc4e80c2c2229ed6d`.

The app plays this source-matched cue at combo 4 and above, with the same PCM-level compensation as the move cue. Its timing is visually aligned to the reward overlay, but the AAC track is mixed and the recording is third-party, so it is not an isolated original sound master. Music and other effects remain approximations.
