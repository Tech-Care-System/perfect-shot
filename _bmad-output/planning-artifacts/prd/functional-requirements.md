# Functional Requirements

## Camera & Capture

- FR1: User can access device camera (front-facing) for selfie mode
- FR2: User can access device camera (rear-facing) for portrait mode
- FR3: User can switch between front and rear cameras during session
- FR4: User can capture a photo manually at any time using the override shutter button
- FR5: System can automatically capture a photo when pose match score exceeds threshold (Smart Shutter)
- FR6: User can save captured photos to device Camera Roll/Gallery

## AI Pose Detection

- FR7: System can detect human body pose landmarks in real-time from camera feed
- FR8: System can compare detected pose against reference pose template
- FR9: System can calculate pose similarity score between user pose and reference
- FR10: System can adapt wireframe scale to match user's body proportions
- FR11: System can detect when subject is too far from camera
- FR12: System can detect when subject is partially out of frame

## Visual Feedback

- FR13: User can see wireframe overlay on camera preview showing target pose
- FR14: User can see color-coded feedback indicating pose match quality (Red/Yellow/Green)
- FR15: User can see text prompts suggesting corrective actions (e.g., "Move right", "Tilt head")
- FR16: User can see lighting warning indicator when backlit or poor lighting detected
- FR17: User can see subject positioning guidance (e.g., "Step closer", "Move left to fit in frame")

## Audio & Haptic Feedback

- FR18: System can play audio cue (ding) when pose match is achieved
- FR19: System can trigger device vibration (haptic) when pose match is achieved
- FR20: Subject (person being photographed) can perceive feedback cue without seeing screen

## Pose Library

- FR21: User can browse available poses in a pose pack
- FR22: User can select a pose from the pose pack to use as reference
- FR23: User can view pose preview before activating it
- FR24: System can load pose data (keypoints) for pose matching

## Onboarding & Settings

- FR25: User can view onboarding tutorial explaining Red/Yellow/Green feedback
- FR26: User can skip onboarding tutorial
- FR27: User can grant camera permission through guided permission flow
- FR28: User can re-request camera permission if initially denied

## Device Compatibility

- FR29: System can detect device performance capability on first launch
- FR30: System can enable "Lite Mode" for lower-end devices automatically
- FR31: User can see warning if device is not fully supported
- FR32: System can gracefully degrade features on unsupported devices
