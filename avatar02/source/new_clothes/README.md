# Generated clothing extension source art

Five separate built-in image-generation calls; each PNG contains one row of four equal-width directions: front/right/back/left. Transparent, clothing-only, no embedded body/skin/hands. All 20 directional source cells visually inspected.

Shared prompt: isolated hollow clothing overlay sheet, four equal columns in front/right/back/left order, identical scale, chunky limited-palette pixel art with dark outline, tiny chibi torso, no labels/logos/human/mannequin, transparent background.

Per-item prompt subjects:
- top-raglan: sporty ivory raglan tee, cobalt short sleeves and ribbed crew neck.
- top-turtleneck: ochre mustard folded ribbed turtleneck, long sleeves, coarse rib-knit texture.
- top-bomber: forest-green bomber, cream ribbed collar/cuffs, brass center zipper, two slash pockets.
- bottom-skirt-pleated: plum skirt, defined accordion folds, fitted waistband.
- bottom-trousers-cargo: khaki olive trousers, protruding cargo pocket flaps and dark belt loops.

`fit_expansion_clothes.fit_new_clothes` uses these sources: raglan source color sampling transferred to pose-native tee geometry and diagonal shoulder pattern; sweater/jacket source torso texture with posed arm fitting; source pleats with standing/lap skirt fit; source cargo pocket crops on moving baseline leg fabric. Rendering is not merely recoloring preexisting items.
