# Alpaca Campus 3D Avatar Asset Pipeline

This is the concrete production path for the player alpaca avatar. PNGs are useful art direction, but they are not enough for a playable quadruped character. The final runtime asset must be a modeled, rigged, animated, optimized GLB with predictable skeleton, materials, pivots, naming, and walk-loop behavior.

## Source And Runtime Paths

- Image references: `assets-source/campus-3d/avatars/player-alpaca/references/`
- Blender source: `assets-source/campus-3d/avatars/player-alpaca/player-alpaca.blend`
- Runtime GLB: `/assets/campus-3d/avatars/player-alpaca/player-alpaca.glb`
- Optional animation-only GLBs: `/assets/campus-3d/avatars/player-alpaca/animations/{animationId}.glb`
- Blender CLI: `/Applications/Blender.app/Contents/MacOS/Blender`

Use the room asset coordinate contract: `Y` is up, forward is negative `Z`, and the avatar root sits on the ground plane at `Y = 0`.

## Why PNGs Are Not Enough

Generated PNGs can define silhouette, color, facial attitude, clothing ideas, and texture cues. They do not provide:

- Clean all-sided geometry.
- Consistent topology around shoulders, hips, knees, ankles, neck, ears, and mouth.
- A usable skeleton.
- Skin weights that prevent leg and neck collapse.
- Foot contact, gait timing, or loopable locomotion.
- Web-safe PBR materials and texture packing.
- Runtime scale, pivots, and node naming.

Treat PNGs as references unless an image-to-3D tool produces a mesh that survives cleanup, retopology, rigging, animation, and export validation. The production decision is based on the final GLB, not on the beauty of a generated still.

## GPT Image Generator Requests

Ask for a consistent, stylized, game-ready alpaca player character. Keep the prompt strict: orthographic, neutral lighting, no dramatic perspective, same outfit, same proportions, transparent or plain light background, full body visible, hooves visible, no cropped legs, no camera tilt, no pose variation except the requested view.

Minimum PNG set:

| File | View | Purpose |
|---|---|---|
| `player-alpaca_ref_front.png` | Orthographic front | Face, chest wool, outfit front closure, leg spacing. |
| `player-alpaca_ref_side-left.png` | Orthographic left side | Body length, neck angle, leg profile, backpack or side clothing depth. |
| `player-alpaca_ref_back.png` | Orthographic back | Tail, rear wool mass, outfit back, symmetry checks. |
| `player-alpaca_ref_three-quarter-front.png` | 3/4 front | Personality read and face shape sanity check. |
| `player-alpaca_ref_face.png` | Close front face | Eyes, muzzle, ears, expression, optional mouth shape. |
| `player-alpaca_ref_outfit-flat.png` | Flat clothing callout | Poncho, scarf, satchel, badges, seams, palette. |

Preferred extended set:

- `player-alpaca_ref_side-right.png` if the outfit is asymmetrical.
- `player-alpaca_ref_top.png` for complex hats, backpacks, saddlebags, or mane shapes.
- `player-alpaca_ref_walk-contact.png`, `player-alpaca_ref_walk-passing.png`, and `player-alpaca_ref_walk-recoil.png` as loose pose references only. Do not model the base mesh in a walking pose.
- `player-alpaca_ref_materials.png` with wool, hoof, eye, fabric, leather, metal, and accent-color swatches.

Prompt template:

```text
Orthographic [front/left side/back] view of the same stylized young alpaca player character for a cozy 3D campus game, full body visible, neutral standing A-pose for quadruped rigging, all four legs straight but naturally spaced, head facing forward relative to the view, soft cream wool with readable curly clumps, friendly face, large dark eyes, short rounded muzzle, small ears, wearing the same [outfit details], clean flat light background, no perspective distortion, no shadows hiding feet, no text, no watermark.
```

## When To Model In Blender From References

Use Blender modeling from references as the default production path when the avatar must be animated. Use AI image-to-3D only as a starting mesh if it saves time after inspection.

Model in Blender from references when:

- The generated views disagree on proportions, clothing, face markings, leg length, or tail placement.
- The image-to-3D mesh has melted legs, fused belly-to-leg gaps, noisy wool lumps, hollow surfaces, bad normals, or asymmetrical eyes.
- The outfit must layer cleanly over the body and survive motion.
- The avatar needs a reliable walk cycle, idle, turn, sit, emote, or future customization.
- File size and draw calls matter more than raw visual novelty.

Recommended Blender build:

1. Block out the body from primitives: torso, neck, head, muzzle, ears, four legs, hooves, tail.
2. Sculpt wool forms as readable medium-scale clumps, not dense micro-fur.
3. Retopologize to animation-friendly loops around shoulders, hips, knees, ankles, neck, jaw/muzzle, and ears.
4. Keep the neutral mesh symmetrical unless clothing intentionally breaks symmetry.
5. Add clothes as separate meshes over the body, with hidden body faces removed only after checking animation deformation.
6. UV unwrap body, outfit, eyes, and hooves into compact atlases.
7. Bake high-detail sculpt or procedural texture into web-safe texture maps.

## Scale And Proportions

- Target standing height: `1.05` to `1.25` scene units at head top.
- Ground contact: all four hooves rest on `Y = 0` in bind pose.
- Root origin: centered between the four hooves on the ground plane.
- Forward axis: alpaca nose points toward `-Z`.
- Silhouette priority: readable head, ears, neck, fluffy torso, and four separate legs from the default campus camera.
- Camera readability: facial features and outfit color accents must read at normal player-follow distance.

## Rigging Requirements

The avatar is a quadruped and should not rely on humanoid autorigging. Mixamo can be useful for humanoids, but this asset needs a custom quadruped rig or a Blender/Rigify quadruped-style setup verified by animation tests.

Required bones or controls:

- `root` at ground center.
- `hips` / pelvis and `spine_01`, `spine_02`, `chest`.
- `neck_01`, optional `neck_02`, `head`, `muzzle`.
- `ear_L`, `ear_R`, optional ear tip bones.
- `tail_01`, optional `tail_02`.
- Four leg chains: `front_leg_L`, `front_leg_R`, `back_leg_L`, `back_leg_R`.
- Per-leg upper, lower, ankle/fetlock, hoof bones.
- IK controls for each hoof with pole targets.
- Optional wool jiggle controls only if they bake to stable keyframes or are removed before export.

Skinning requirements:

- Hooves remain rigid.
- Knees and ankles bend without volume collapse.
- Shoulders and hips deform smoothly under the wool mass.
- Neck rotation keeps the head attached without visible stretching.
- Clothing weights either follow the body bones or use a separate bound layer with no clipping in walk and idle.

## Walking Motion Requirements

The first runtime animation set should include:

| Animation | Loop | Notes |
|---|---|---|
| `idle` | Yes | Subtle breathing, ear flicks, small head motion. |
| `walk` | Yes | Four-beat quadruped walk with stable foot contacts. |
| `turn-left` | Optional | Can be procedural at runtime if walk blends well. |
| `turn-right` | Optional | Can be procedural at runtime if walk blends well. |
| `emote-happy` | Optional | Short head lift, ear perk, small hop if body scale allows. |

Walk-loop contract:

- Duration: `24` or `32` frames at `24 fps`, exported as one seamless loop.
- Gait: diagonal rhythm is acceptable for a stylized alpaca, but every hoof must have clear plant, support, lift, swing, and contact phases.
- Foot sliding: planted hooves should stay visually locked relative to the ground.
- Body motion: small vertical bob, slight side-to-side weight shift, chest and hips counter-rotate gently.
- Head and neck: damped follow-through, not rigidly locked to torso.
- Tail and ears: secondary motion may be keyed, but avoid noisy high-frequency movement.
- Root motion: prefer in-place walk for the current player controller unless runtime explicitly supports root-motion extraction.
- Loop seam: frame `1` and final frame must match, or final frame should be omitted on export if the engine loops back to frame `1`.

## Outfit And Clothing Layering

Build the player outfit as separate named meshes so future customization can swap pieces without rebuilding the body.

Recommended first outfit:

- A short campus scarf or bandana around the neck.
- A small satchel or book pouch attached behind one shoulder.
- Optional light poncho only if it does not hide leg readability.
- No long robe, skirt, or blanket that obscures all four legs in the first playable pass.

Layering rules:

- Keep `body_wool` as the base mesh.
- Clothes should sit slightly above the body surface with enough clearance for walk deformation.
- Remove hidden body polygons only under rigid or low-motion pieces.
- Do not bake school text, WSC guide text, UI labels, or score-like content into clothing.
- Use separate materials for wool, fabric, leather, hoof, and eye.
- Keep fabric patterns broad enough to survive texture compression and mobile rendering.

## Naming Conventions

Files:

- Blender source: `player-alpaca.blend`
- Main GLB: `player-alpaca.glb`
- Texture prefix: `player-alpaca_{materialSet}_{map}.png`
- Animation clip names: `idle`, `walk`, `turn-left`, `turn-right`, `emote-happy`

Nodes and meshes:

- Root node: `AVATAR__player-alpaca`
- Armature: `RIG__player-alpaca`
- Body mesh: `MESH__body_wool`
- Eye meshes: `MESH__eye_L`, `MESH__eye_R`
- Hooves: `MESH__hoof_front_L`, `MESH__hoof_front_R`, `MESH__hoof_back_L`, `MESH__hoof_back_R`
- Outfit meshes: `OUTFIT__scarf`, `OUTFIT__satchel`, `OUTFIT__poncho`
- Attachment anchors: `ANCHOR__head`, `ANCHOR__neck`, `ANCHOR__back`, `ANCHOR__satchel`

Bones:

- Use lowercase semantic names with `_L` / `_R` side suffixes.
- Keep exported deform bones stable across revisions once runtime animation begins.
- Do not rename bones after animation clips are authored unless all clips are regenerated.

## GLB Export Requirements

Export as GLB 2.0 with embedded meshes, textures, skeleton, and animation clips.

Required export settings:

- Apply transforms before export; root scale should be `1, 1, 1`.
- Export selected avatar root only.
- Include skinning and animations.
- Use `Y` up and `-Z` forward.
- Keep material names stable.
- Use PBR metallic-roughness materials.
- Prefer texture dimensions of `1024` for body/outfit and `512` for smaller pieces in the first pass.
- Clamp or repeat texture modes intentionally; avoid accidental high-frequency tiling.
- No cameras, lights, reference planes, hidden blockout meshes, or Blender-only helper objects in the runtime GLB.

Optimization target:

| Asset | Target |
|---|---:|
| Body and outfit triangles | `12k` to `25k` |
| Max first-pass triangles | `35k` |
| Materials | `5` or fewer |
| Skinned meshes | `4` or fewer |
| Optimized GLB | `3 MB` or less |

Optimize after export:

```bash
npx --yes @gltf-transform/cli optimize player-alpaca.glb player-alpaca.optimized.glb --compress meshopt --texture-compress webp --texture-size 1024
```

Validation checklist:

- GLB opens in Blender, a glTF viewer, and the campus route without console errors.
- Avatar stands on the floor with no scale correction in runtime code.
- `idle` and `walk` clips appear with exact expected names.
- Walk loops in place without visible foot sliding from the default camera.
- Clothing does not clip through body during walk, idle, and sharp direction changes.
- Face and outfit read clearly on desktop and 390px mobile screenshots.
- No generated reference PNGs, reference planes, or unused textures ship in the runtime GLB.

## Tool Directions To Verify

These are investigation directions, not committed dependencies. Re-verify license, cost, hardware needs, output format, and commercial/project fit before using in production.

- Blender plus Rigify: free and local. Verify current Rigify quadruped/metarig support and whether its generated controls export cleanly to GLB after baking animation.
- TripoSR: open-source single-image-to-3D direction from Stability AI / Tripo AI. Good for quick mesh experiments, but expect cleanup and retopology before rigging.
- Stable Fast 3D: Stability AI single-image mesh reconstruction direction that can output GLB. Test as a fast concept-to-mesh pass, not as guaranteed final topology.
- Hunyuan3D-2 / Hunyuan3D-2mv: Tencent open-source image/text-to-3D and multi-view direction. Test multi-view mode with the front/side/back alpaca references to see whether it preserves legs and outfit better than single-image tools.
- TRELLIS: Microsoft Research image/text-to-3D research direction. Verify current license and output quality; use as a comparison tool for shape exploration.
- Mixamo: free with Adobe ID, but treat as humanoid-oriented. Do not depend on it for the alpaca quadruped rig unless a test proves the uploaded skeleton and animations are usable.

Current-source links to check before committing to a tool:

- Blender Rigify manual: https://docs.blender.org/manual/en/latest/addons/rigging/rigify/index.html
- TripoSR GitHub: https://github.com/VAST-AI-Research/TripoSR
- Stable Fast 3D GitHub: https://github.com/Stability-AI/stable-fast-3d
- Hunyuan3D-2 GitHub: https://github.com/Tencent-Hunyuan/Hunyuan3D-2
- TRELLIS project page: https://microsoft.github.io/TRELLIS/
- Adobe Mixamo FAQ: https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html

## Handoff Gate

The player alpaca is ready for runtime integration only when the art source, optimized GLB, and animation clips are all present and validated. If only PNGs exist, the asset is still in concept-reference state. If only an unrigged generated mesh exists, the asset is still in prototype state. If a rigged GLB exists but the walk slides or clothing clips, the asset is still in animation-fix state.
