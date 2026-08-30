# Production cinematic-realism review — 2026-08-26

## Executive decision

CineWeave should remain provider-neutral. The right production upgrade is not
to embed the latest video model or a ComfyUI graph in a creative contract, but
to make the last mile auditable: exact generated output → verified Draft import
→ scoped observations → benchmark findings → human review → one-owner repair.

The core `verify-media-import` CLI now accepts a local MP4, MOV or WebM
`video_candidate` only after bounded local `ffprobe` metadata inspection and a
streamed content hash. This establishes provenance and temporal metadata; it is
not a claim of semantic, aesthetic or safety review. The optional World OS
`production-media-import` callback remains intentionally image-only, so video
review uses the core receipt chain until that callback gains an equally bounded
video implementation.

This pass adds `ControlBenchmarkReview`, a schema, example, semantic checks and
Production route that make that chain explicit. It cannot generate media,
approve assets, infer rights or publish work.

## Source-derived design findings

| Source | Verified pattern | CineWeave consequence |
| --- | --- | --- |
| [Wan2.1 official repository](https://github.com/Wan-Video/Wan2.1) | A video family exposes distinct T2V, I2V, first/last-frame and editing paths, each with different resolution, stability and integration constraints. | A model name is not a capability guarantee; profile controls by task, input limits, evidence and observed review result. |
| [VACE official repository](https://github.com/ali-vilab/VACE) | Reference-to-video, video-to-video and masked video editing can be freely composed, but are separate operations. | Keep reference, mask and edit scope as exact control/evidence channels; a combined graph does not merge the creative owners. |
| [ComfyUI official repository](https://github.com/Comfy-Org/ComfyUI) | A graph/node system has an API/backend, workflow JSON and independently versioned dependencies. | Record graph, node and weight facts in `CapabilityProfile`/`AdapterDescriptor`, never as universal Director or Prompt truth. |
| [SAM 2 official repository](https://github.com/facebookresearch/sam2) | Video segmentation uses a streaming-memory design for promptable image/video masks. | A mask limits an editable region; it is evidence of scope, not proof of an identity, makeup or interaction result. |
| [CinePreGen paper](https://arxiv.org/abs/2408.17424) | Cinematic camera control benefits from interactive, engine-backed previsualization and iterative camera evaluation. | Preserve the existing coverage → blocking → behaviour → pose/keyframe → adapter camera ladder and judge its visible result after import. |
| [HunyuanVideo official repository](https://github.com/Tencent-Hunyuan/HunyuanVideo) | The open foundation model ships weights and inference code alongside I2V, customization and ComfyUI integrations. | Treat model output as a candidate only; its frame quality cannot upgrade a CapabilityProfile or an approval gate without receipts and review. |

## Final photoreal-human gate

For a requested natural-human result, the review must check delivery-scale
evidence across the relevant frame sample: approved identity/appearance anchors,
anatomy and contact, regional surface/material response, eye/lip/hair edges,
motivated source light, perspective/focus/depth, temporal continuity and all
rights/capability inputs. It must not score attractiveness, create biometric
claims or turn a model's self-description into evidence.

A failed blocking finding has one owner and one smallest repair variable. The
review receipt lists the finding and prevents advancement; it does not replace
the separate human approval gate.

## Scope deliberately left external

No model weights, workflows, repositories, custom nodes, endpoints or paid APIs
are installed by this change. Before a real adapter is promoted, its revision,
license, inputs, dependencies, controls and benchmark evidence must be captured
in an exact `CapabilityProfile`, while real executions still require the existing
hash-bound approval and registered adapter boundary.
