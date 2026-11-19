# Avatar 02 wardrobe expansion

## Goal
Add silhouette variety rather than merely recolouring the original 39 selections. Keep the approved round child body, pixel density, four direction rows and seven motion atlases plus idle.

## Added selections
- Hair: buzz cut, compact afro, high bun, side ponytail.
- Clothing: raglan tee, turtleneck knit, bomber jacket, pleated skirt, cargo trousers.
- Equipment: bucket hat, canvas tote, compact camera.

New art is created as original directional overlay source images. The build pipeline aligns it to existing body poses; this is not independent hand-animation of every fold or strand. A camera selection is a held prop, not a new photo-taking action. Mutually exclusive slots remain unchanged.

## Acceptance gates
- All named additions exist as distinct selectable items with actual transparent direction/motion atlases.
- No source mannequin skin/limbs baked into the clothing; no fixed lowered arms under raised arms.
- Hair and hats retain the body/head scale; selected hats use fitted hair variants.
- Explicit idle, walk, raised-arm, seated and rear-view inspection.
- Actual rendered catalogue, composition checks, structural tests and exact remote-tree confirmation before completion.

Status: 12 new selectable parts, bringing the catalogue to 51. Source images and fitting modules are included. New parts cover 84 action atlases and the full catalogue has 40 hair/hat variant combinations. See QA-expansion.md and category source READMEs for observed checks and remaining limitations. Actual browser/in-game validation is still separate.
