# Clothing source overlays

11 garment designs, 4 directions each. `sources.json` rows are zero-based; columns FRONT, RIGHT, BACK, LEFT. Transparent source sheets only, not already normalized to 80px rig.

Inspected all 44 source cells: no character skin/head/hands, distinct shirt/cardigan/hoodie/vest/overall and lower silhouettes, rear buttons/pockets/hood correctly differentiated. Plain tee and shorts source alternatives included so parent may choose these or retain v3.

Limitations: static relaxed-arm sleeve poses; hoodie/cardigan long sleeves require motion-aware arm separation or masks rather than simply overlaying full item on raised arms. Trouser legs likewise need per-leg remapping for walking/sitting. These are source parts, not complete animated clothes. Garment style and pixel density approximate approved02, not exact shared pixel grid. Overall upper/lower use matching blue denim palette but seam/waist attachment must be inspected after normalization. Do not claim animation validation from these source sheets.
