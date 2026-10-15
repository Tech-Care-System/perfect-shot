# Camera pose guide research

This is a research and implementation brief. Portrait and waist-up modes are not implemented yet. Instagram integration is deferred at the owner's request.

The recommended direction is a framing-aware guide: select the intended crop first, show a matching human reference, and assess only the body regions that the pose actually needs. Framing is separate from the existing standing, chair, sofa and stage scenes.

## Photography findings

A deliberate close portrait or waist-up composition is a complete photograph. The guide should show that intended composition rather than shrink a full-length figure into every frame. Canon describes waist-up framing; Nikon illustrates how tighter crops and a slightly turned body can simplify a portrait. Body and head angles are starting options, not mandatory beauty rules. [Canon portrait guide](https://www.canon.ca/en/Articles/2024/portrait-photography-tips-and-techniques), [Nikon portrait guide](https://www.nikonusa.com/learn-and-explore/c/tips-and-techniques/take-better-portraits).

For portraits, useful visual anchors are headroom, eye line, head direction and shoulder angle. Camera height and head tilt depend on the intended look and the person. A guide should offer a neutral option and a lightly turned option rather than enforce one chin angle. [Adobe headshot guide](https://www.adobe.com/uk/creativecloud/photography/discover/professional-headshots.html), [Canon posing guide](https://www.usa.canon.com/learning/training-articles/training-articles-list/posing-tips-for-successful-portraits).

For waist-up images, hands need an intentional, relaxed placement when included: resting, holding a simple object or making a natural gesture. Keep them from pressing hard into the body. Frame boundaries should avoid awkward cuts directly through joints; a tight crop of the top of the head can still be a deliberate style. These are composition recommendations, not a universal aesthetic score. [Adobe hand and sitting poses](https://www.adobe.com/creativecloud/photography/discover/sitting-poses-and-hand-poses.html), [Canon posing guide](https://www.usa.canon.com/learning/training-articles/training-articles-list/posing-tips-for-successful-portraits).

## Proposed demo modes

| Mode                         | Visible guide                                                                      | Relevant guidance                                                                                      |
| ---------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Portrait: head and shoulders | Light head outline, eye line and shoulder curve, plus a small reference photo      | Head placement, headroom and shoulder direction; no leg or hip requirement                             |
| Waist-up                     | Torso and arm contours, with hands shown only when the selected pose includes them | Shoulder and arm placement, intentional hand placement and crop boundary; no knee or ankle requirement |
| Full body                    | Natural human contour with visible feet and a small reference photo                | Weight shift, arms, stance and adequate room around the intended pose                                  |

The overlay's appearance is a product proposal: a subtle white contour and adjustable translucent fill, with an easy hide/show control. It must leave the live face readable. The reference should communicate a pose, not require the user's anatomy or facial identity to match a model.

## Confirmed limitations in the current app

- `src/lib/types/pose.types.ts` fixes the matching set to 12 shoulder, elbow, wrist, hip, knee and ankle points. `calculate-similarity.ts` rejects the whole set if any selected point is missing or below its visibility cutoff. A low-confidence ankle can therefore produce score zero for an otherwise usable waist-up shot.
- `generate-correction.ts` uses the same extractor, so missing lower-body points can suppress shoulder and arm corrections too. Its normalizer centers on the hips and scales by shoulder-to-hip length; shortening the index list alone will not support portraits.
- `detect-framing.ts` checks only horizontal shoulder/hip edges. `detect-distance.ts` needs shoulders and hips; missing hips return `ok`, which does not establish correct portrait framing.
- Scene detection uses lower-body geometry and can replace a manually chosen target. Crop selection should remain explicit during the demo.
- `capture-photo.ts` saves the full video dimensions. A new crop guide must share its projection with capture so the saved image matches the preview.

MediaPipe Pose Landmarker estimates 33 body points and exposes confidence information. An output array of 33 entries does not establish that every point is visible or suitable for scoring. The official documentation does not promise cropped-body accuracy for this application's pipeline. Head pose or expression measurements would need separately validated face tracking; a visual portrait reference should not claim that capability. [Pose Landmarker Web guide](https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker/web_js), [NormalizedLandmark reference](https://ai.google.dev/edge/api/mediapipe/python/mp/tasks/components/containers/NormalizedLandmark), [Face Landmarker guide](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker).

## Smallest credible implementation

1. Add explicit Portrait, Waist-up and Full body framing selection. Use the same framing profile for the guide, matching, correction messages and framing checks.
2. Start with six carefully reviewed reference images: two per mode. Portrait references should be composed as portraits; waist-up references should make hand placement clear. Generate or choose human references before deriving their matching targets, and measure targets from the exact image used by the guide.
3. Use region-specific confidence checks and normalization. Deliberately cropped legs must neither invalidate a portrait nor generate stance instructions. When required points are unavailable, show incomplete guidance rather than an arbitrary good match.
4. Keep the manual shutter available. Enable automatic capture for a new framing mode only after its score and held-pose behavior are validated on representative crops.
5. Keep guide graphics out of saved photos and verify front-camera mirroring, cover/contain projection and preview-to-capture framing together.

Acceptance checks should include close portraits with no visible hips, waist-up shots with no knees or ankles, deliberate hand crops, head turns, front/rear cameras and resize/rotation. Validate on the physical demonstration phone before claiming reliable automatic pose scoring. No new camera behavior or reference assets were added during this research step.
