# Optional: portrait, natural human, and surfaces

Load for portrait reconstruction, close human fixtures, makeup/hair/skin continuity, or realistic surface response.

## Layer separation

- stable identity: face/body geometry, proportion, natural asymmetry, baseline skin features;
- current appearance: makeup, grooming, hair, costume, temporary skin condition, moisture, dirt, injury;
- capture: viewpoint, distance, focus, exposure, lens inference, sensor/render behavior;
- representation: realism, retouch restraint, line/paint/cel behavior;
- shot: pose, expression, composition, physical light.

Do not convert makeup or smoothing into identity. Do not infer ethnicity, health, age precision, focal length, or beauty from uncertain visual cues.

## Detail budget

- close-up: identity relationships, eye/lip surface, pores or medium-appropriate microtexture, makeup edges, hairline, material/light transitions;
- medium: facial anchors, hair mass, neckline, garment construction, hand interaction;
- full body: silhouette, proportion, posture, costume layers, footwear, contact;
- wide: silhouette, color block, gait, scene relation; omit invisible pore-level detail.

## Surface language

Describe four observable parts:

1. source: which physical light reaches the surface;
2. reflection: broad/specular/soft/anisotropic response;
3. form: how response reveals geometry;
4. contact: occlusion, compression, moisture, dust, or shadow at interaction.

Natural human rendering preserves plausible asymmetry, variation, and material distinction. Avoid universal blur, plastic gloss, pore exaggeration, beauty-filter language, or contradictory hard/soft light claims.
