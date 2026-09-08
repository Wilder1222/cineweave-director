# Optional: cinematography craft — space, light, movement

Load for lens/perspective choices, difficult lighting, motivated movement, shot matching, or a request for stronger cinematography. This is a visual-design guide, not equipment operation or a claim that camera metadata controls an image/video model. For numerical paths read [camera-previsualization.md](camera-previsualization.md); for color pipeline handoff read [editorial-color.md](editorial-color.md).

## Camera distance before lens prestige

Select the viewer's relationship to the subject, camera access, framing, and focus needs before choosing a focal length.

- Perspective relationships depend on viewpoint. At a fixed viewpoint, changing focal length primarily changes framing; moving the camera to recover the same subject size changes near/far relationships. Do not describe a distant “compressed” view while placing the camera close to the subject. [Nikon: choosing lenses and perspective](https://www.nikonimgsupport.com/na/NSG_article?articleNo=000047395&configured=1&lang=en_SG)
- State sensor/image-area and crop assumptions if millimeters matter. A focal length alone does not establish a shot size. If the format is unknown, prioritize position, subject/background relationship, field of view intent, and crop over false numerical precision.
- Treat depth of field as a coupled design choice involving aperture, focus distance, focal length, format/framing, and viewing tolerance. Do not promise “both actors sharp at f/1.4” without their distances and a test. A shallow plane can hide the second action the scene needs.
- Separate perspective, lens distortion, focus breathing, optical character, and representational stylization. None is an identity correction.
- **Paired check:** compare viewpoints with the subject similarly framed; then compare focal lengths from one viewpoint with matching crops. Label these as different experiments, not a one-variable test.

For AIGC handoff, write the resulting visible relationship—“near hand larger than the face; doorway recedes behind”—and retain numerical camera intent separately. Do not claim a model obeyed real optics without reviewing its output.

## Composition as attention, not a grid rule

Choose one primary attention target and any essential competing target. Use scale, contrast, focus, movement, negative space, occlusion, and looking room in service of their relationship. A centered, asymmetrical, cramped, or deep composition is valid when its purpose is clear.

Check the frame at the intended delivery size and at the action's turning point, not only in the opening hero frame. A bright lamp, reflection, moving extra, or subtitle region may compete with the intended cue. Preserve required hands, contact points, and exits. Cropping away contradictory geography is not a repair.

## Source → modification → surface → readable result

For each important light decision identify the exact scene source, any approved bounce/transmission surface, subject orientation, source-to-subject relation, occlusion, and resulting highlight/shadow behavior. New fixtures, bounce surfaces, or altered windows require a Scene proposal; a `ShotLightingPlan` cannot manufacture them.

ARRI's handbook distinguishes light quality from intensity and discusses the difficulty of containing soft-source spill. Its illustrated setups are examples, not mandatory three-point recipes. [ARRI Lighting Handbook, fourth edition, sections 1–2](https://www.arri.com/resource/blob/83996/409091c612f371b0c68b41d9dcb636db/arri-lighting-handbook-english-data.pdf)

- **Softness:** describe the apparent emitting area from the subject and expected shadow edge. Dimming alone does not make a hard source soft. A diffusion surface must actually become an illuminated source of useful size.
- **Contrast:** distinguish adding fill from reducing environmental bounce. Negative fill is removal of returned light, not a black light source. Keep the proposed intervention within approved scene facts.
- **Separation:** try background value/color, blocking, or focus as well as edge light. Do not add an unmotivated rim automatically. Hitchcock's interview explicitly questions habitual object/back lighting and asks where illumination originates. [ASC: Hitchcock on lighting](https://theasc.com/article/flashback-hitchcock-talks-about-lights-camera-action/)
- **Exposure intent:** identify highlights and shadow information that must survive. Darkness can preserve readable silhouettes or selective detail; “underexpose everything” is not a complete night plan. Actual clipping/noise claims require accessible media and suitable technical evidence, not prose or a display screenshot alone.
- **Materials:** distinguish diffuse body color from specular source reflections. Check glossy cloth, wet stone, glass, and metal from the camera's actual angle; a source that models the face may obscure a critical object in glare.
- **Color:** keep source color, white-balance intent, surface color, and later grade separate. Do not make a supposedly neutral object change canon color to express warmth.

**Failure check:** draw or describe one consistent source map across reverse angles and the actor's path. Test the entrance, turn, and end state. If an added “cinematic” light has no approved source, return to Scene or remove it.

## Movement and focus as changing access

Choose a movement for an information or relationship change:

| Choice | Useful effect to test | Failure signal |
| --- | --- | --- |
| Hold | lets simultaneous action or listening develop | critical cue never becomes legible |
| Pan/tilt | redirects view from one anchor to another | reveals the destination before its dramatic cue |
| Track with subject | preserves a relation while geography changes | route or support becomes physically inconsistent |
| Move closer | changes proximity and relative spatial relationships | approach has no turn, or obscures necessary context |
| Zoom | changes framing from a fixed viewpoint | described as a spatial move with parallax |
| Orbit | changes which side, background, or relation is visible | axis/geography shifts without readable orientation |
| Handheld drift | gives a situated, unstable viewpoint if appropriate | micro-motion hides a small performance cue |
| Focus transfer | changes which existing plane is readable | invents an object, or shifts before attention is motivated |

Specify cue, start, speed change, arrival, and settling behavior only as precisely as the task needs. Do not start actor, camera, focus, weather, and light changes simultaneously unless their collision is the point. Test whether a simpler move preserves the purpose. Fixed camera does not mean emotionally static.

## Shot matching and AIGC evidence

Match world-relative source direction, eyelines, screen travel, prop placement, appearance, and material response; do not blindly keep the key on the same screen side in reverse angles. A mismatch may belong to Scene, Character, Direction, or Style—route it to the owner.

AFI's curriculum includes comparative lens/exposure/lighting tests and review of dailies. CineWeave adapts this as a test-plan discipline: hold the approved brief and locks constant, state what varies, and name the visible result that would justify the choice. [AFI cinematography curriculum](https://conservatory.afi.com/cinematography-curriculum/)

Without returned media, report a reasoned proposal and unknown realization. With still evidence, review framing and visible light only; motion, focus continuity, flicker, and edit timing remain unknown. Do not grade cinematography by camera-brand mentions or a blanket “film look.”
