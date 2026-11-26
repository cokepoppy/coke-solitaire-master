# Selected-card highlight audit

## Reference

The selected border is visible around the 3♠ in screenshot 2 from the official Apple App Store listing:

- Screenshot: [official 1242×2688 image](https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/53/41/6b/53416b41-3a65-0ced-013c-e7a94e42fe08/2.png/1242x2688bb.jpg)
- Screenshot SHA-256: `d4e9b3e064f4e1c37948d3aacc8c475b1c9c393b357ddeafb4d942b938a05695`
- Selected 3♠ crop: `(807,1129)` through `(923,1303)`, 116×174 pixels
- Browser card size: 118×177 CSS pixels at the source-sized mobile viewport

The crop is resized with Lanczos filtering. Its card interior is made transparent; the six-pixel edge is retained and the next two pixels are feathered. The resulting 118×177 RGBA sprite SHA-256 is `affb90c4150ab44ca497b4b2ad6537bf1630ec975c0c58d8402bc996b09ef639`. The source image is not stored in this repository.

Recreate the sprite with:

```sh
python3 tools/extract_selected_card_frame.py /path/to/official-screenshot-2.jpg
```

## Comparison

The source card crop was compared with a browser render at 442×960 CSS pixels and 2× device scale, with the card aligned to source coordinates. The previous CSS-only outline had mean absolute error (MAE) 13.343 across the card crop. The extracted frame plus glow measures 4.762, a 64.3% reduction. For the outer eight-pixel edge, MAE falls from 45.499 to 5.348, an 88.2% reduction. The remaining interior difference is mostly image decoding and screenshot compression; the selected border now comes from the source crop.

The sprite is applied to the selected face-up card with a pointer-transparent pseudo-element. A separate CSS shadow preserves the surrounding gold and green glow visible in the source. The visual state remains semantic and interactive, and the sprite is part of the service-worker core cache for offline play.
