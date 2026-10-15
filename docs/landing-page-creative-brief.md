# Perfect Shot landing-page creative brief

## Verified reference

The inspected Canva design is [DAHYGF_pZJY](https://www.canva.com/design/DAHYGF_pZJY/lU3G08nbpDksoA8Hv-S94A/edit). Its exported reference is a single flattened 896 × 1776 bitmap; the available preview is 303 × 600. It has no editable text or font layers, so its exact typefaces cannot be verified.

The reference uses a cream page with a full-bleed portrait hero, a black camera-demo section, four scene cards, a privacy strip, and a lime closing panel reading “THAT’S THE ONE.” Its headline is “Be yourself. Nail the shot.” The dominant flat colors sampled from the image are cream `#f8f5f0`, ink `#11120d`, and lime `#def753`. These are visual observations from the bitmap, not a claim about a formal brand system.

The page follows that direction. It uses the existing Inter font and a system Georgia italic for editorial emphasis; the italic face is an approximation because the Canva font cannot be identified from the flattened reference. The reference portrait, type, and controls are not customer content or endorsements.

## Page structure and product flow

The homepage at `/` has the reference headline and cream/ink/lime palette, a full-bleed standing portrait, an illustrative camera panel, a four-card pose-scene section, three pricing plans, a privacy strip, and the lime “THAT’S THE ONE” close. The camera-panel guide and interface are illustrative HTML/SVG, not a screenshot of a live camera session. Interface text starts at 1rem; narrow layouts reflow and use a disclosure menu.

The four scene cards link to `/camera`; they do not preselect a scene. The camera PWA starts at `/`, and the user enters the camera flow and grants permission before camera use. The camera app supplies live pose matching, framing and lighting prompts, automatic capture after a matching pose is held, a manual shutter, and local photo download. Copy should not promise capture speed or tracking accuracy across devices.

Pose frames are processed on-device in a MediaPipe Web Worker and are not uploaded. Photos are downloaded locally when the user chooses to save them. There is no account or sign-up flow. Camera access on a phone requires HTTPS. The page is a Server Component with scoped CSS, a skip link, visible focus styles, descriptive image alternatives, semantic links and sections, and reduced-motion handling.

## Five-image plan

All five assets are generated and visually checked: 1086 × 1448 PNGs in a 3:4 aspect ratio. All portraits are fictional generated subjects, not customers or endorsements. They were generated using the built-in image generation tool and copied into the project.

| Asset                                     | Placement and status                            | Image direction                                                                                                                                                     |
| ----------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `public/images/landing/hero-standing.png` | Full-bleed hero; generated and visually checked | Southeast Asian woman in an ivory linen blouse and rust/caramel trousers on sunlit cream limestone steps and colonnade. Keep head and shoes visible with crop room. |
| `public/images/landing/pose-standing.png` | Camera-demo backdrop                            | Man in a forest overshirt, off-white tee, charcoal trousers, and neutral shoes beside a warm limestone wall. Leave room for the code-drawn guide.                   |
| `public/images/landing/pose-chair.png`    | Chair card; existing                            | Woman in an ivory linen shirt and muted olive trousers, seated naturally on an oak cafe chair, with both shoes visible.                                             |
| `public/images/landing/pose-sofa.png`     | Sofa card; generated and visually checked       | Man in a forest-green overshirt and charcoal trousers, relaxed on a warm-gray sofa in an ivory living room, with both shoes visible.                                |
| `public/images/landing/pose-stage.png`    | Stage card; generated and visually checked      | Woman in a dark warm-brown outfit on a black-box stage, fully visible under a legible amber spotlight.                                                              |

## Image prompt briefs

**Hero standing portrait:** Photorealistic natural 3:4 editorial portrait of an adult Southeast Asian woman in her late 20s, standing relaxed on a sunlit cream limestone colonnade with broad steps. Ivory linen blouse tucked into flowing warm rust/caramel wide-leg trousers, neutral low shoes, dark shoulder-length wavy hair, looking near the camera. Full figure from head to shoes, centered, with generous crop room above and below. Warm afternoon architectural shadows, lifelike skin and hands, subtle 35mm treatment. One person only; no phones, UI, text, logos, watermarks, or other people.

**Standing scene portrait:** Photorealistic natural 3:4 editorial portrait of an adult man in his early 30s with warm medium skin, standing relaxed outside a minimalist limestone building. Muted forest overshirt over an off-white T-shirt, charcoal trousers, neutral sneakers; one hand in a trouser pocket and the other resting naturally away from his torso. Full head-to-toe silhouette with safe crop margins. Warm late-afternoon architectural light, believable hands and proportions, subtle 35mm texture. No bystanders, fake testimonials, UI, graphics, text, logos, or watermarks.

**Chair scene portrait:** Photorealistic natural 3:4 editorial portrait of an adult Southeast Asian woman in her late 20s seated casually on a simple oak cafe chair. Ivory linen shirt, muted olive trousers, understated off-white shoes; one forearm on the chair back and the other hand on her thigh. Show the entire seated figure and both shoes with breathing room. Minimal warm plaster cafe, soft window light, an out-of-focus plant, natural skin and hands. No other people, phones, screens, interface, text, logos, or watermarks.

**Sofa scene portrait:** Photorealistic natural 3:4 editorial portrait of an adult man in his early 30s, comfortably seated on a warm-gray modern fabric sofa. Forest-green overshirt over an off-white tee, charcoal trousers, neutral shoes; both feet and shoes fully visible on the floor, one arm resting along the sofa and the other hand on his thigh. Warm minimalist ivory living room with a few plants, soft window light, natural skin and hands, and generous crop room. One subject only; no UI, text, logos, watermarks, phones, or other people.

**Stage scene portrait:** Photorealistic natural 3:4 editorial portrait of an adult woman standing confidently on a small intimate black-box theater stage. Dark warm-brown long dress that clears the shoes, holding a low microphone in one hand while the other rests naturally at her side. Full head-to-toe figure and both shoes, centered with about 15% breathing room around her, including above her head and below her shoes. Deep black backdrop, faint haze, matte stage floor, warm amber spotlight and soft rim light that keep face, hands, outfit, and shoes legible. One subject only; no audience, phones, UI, text, logos, watermarks, or exaggerated theatrical advertising.

## Delivery and verification notes

Landing photos use Next Image with responsive `sizes`. A standalone production check verified the hero's 640-pixel responsive variant: a fresh cache miss returned HTTP 200 as `image/webp`, at 32,888 bytes, with a `RIFF/WEBP` body signature. This confirms optimization for that tested request; it is not a size or performance claim for every image and viewport. Before the showcase, verify the production HTTPS camera flow on the demonstration phone. Local browser tests use a simulated camera and cannot establish physical-device tracking performance.
