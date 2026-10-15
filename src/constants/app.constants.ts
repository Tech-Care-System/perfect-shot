// MediaPipe CDN URLs (Local)
export const MEDIAPIPE_CDN_URL = '/wasm';
export const POSE_MODEL_URL = '/models/pose_landmarker_lite.task';


// Performance thresholds
export const POSE_THRESHOLD = 0.9;
export const MAX_RETRY_COUNT = 3;
export const TARGET_FPS = 30;
export const LITE_MODE_FPS = 15;

// Scene types
export const SCENE_TYPES = ['solo-chair', 'sofa', 'standing', 'stage'] as const;

// Scene detection
export const SCENE_SAMPLE_INTERVAL_MS = 2_000;
export const SCENE_DEBOUNCE_COUNT = 3;

// Distance detection
export const SUBJECT_TOO_FAR_TORSO_HEIGHT = 0.10;
export const DISTANCE_SAMPLE_INTERVAL_MS = 500;
export const DISTANCE_TOO_FAR_DEBOUNCE = 2;

// Framing detection
export const FRAMING_EDGE_THRESHOLD = 0.05;
export const FRAMING_SAMPLE_INTERVAL_MS = 500;
export const FRAMING_DEBOUNCE_COUNT = 2;

// Lighting detection
export const LIGHTING_VISIBILITY_THRESHOLD = 0.5;
export const LIGHTING_SAMPLE_INTERVAL_MS = 2_000;
export const LIGHTING_POOR_DEBOUNCE = 3;

// Smart shutter
export const SMART_SHUTTER_HOLD_MS = 500;

// Feedback settings
export const FEEDBACK_LATENCY_TARGET_MS = 100;
export const POSE_CLOSE_THRESHOLD = 0.7;
export const MATCH_FLASH_DURATION_MS = 150;
export const FEEDBACK_TRANSITION_MS = 300;

// Benchmark
export const BENCHMARK_FRAMES = 5;
export const BENCHMARK_WARMUP_FRAMES = 1;
export const BENCHMARK_STORAGE_KEY = 'ai-perfect-shot-benchmark';
export const BENCHMARK_TIMEOUT_MS = 15_000;
export const UNSUPPORTED_FPS_THRESHOLD = 10;
