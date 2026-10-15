import { POSES_BY_SCENE } from '@/data/poses';
import {
    currentPoseAtom,
    poseCorrectionAtom,
    poseHintAtom,
    poseScoreAtom,
    selectPoseAtom,
    targetPoseAtom,
} from '@/lib/stores/pose-store';
import { act, renderHook } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import type { ReactNode } from 'react';
import { usePoseLibrary } from './use-pose-library';

function createWrapper(store: ReturnType<typeof createStore>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  };
}

describe('usePoseLibrary', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  describe('auto-initialization', () => {
    it('selects first standing pose when currentPose is null', () => {
      renderHook(() => usePoseLibrary(), { wrapper: createWrapper(store) });

      const expectedPose = POSES_BY_SCENE['standing'][0];
      expect(store.get(currentPoseAtom)).toBe(expectedPose);
      expect(store.get(targetPoseAtom)).toBe(expectedPose.targetLandmarks);
      expect(store.get(poseHintAtom)).toEqual({
        name: expectedPose.name,
        hint: expectedPose.actionHint,
      });
    });

    it('does not re-initialize if currentPose is already set', () => {
      const sofaPose = POSES_BY_SCENE['sofa'][1];
      store.set(selectPoseAtom, sofaPose);

      renderHook(() => usePoseLibrary(), { wrapper: createWrapper(store) });

      expect(store.get(currentPoseAtom)).toBe(sofaPose);
    });
  });

  describe('selectScene', () => {
    it('changes available poses and auto-selects first pose of new scene', () => {
      const { result } = renderHook(() => usePoseLibrary(), {
        wrapper: createWrapper(store),
      });

      act(() => {
        result.current.selectScene('sofa');
      });

      expect(result.current.selectedScene).toBe('sofa');
      expect(result.current.availablePoses).toBe(POSES_BY_SCENE['sofa']);
      expect(store.get(currentPoseAtom)).toBe(POSES_BY_SCENE['sofa'][0]);
    });

    it('resets score and correction', () => {
      store.set(poseScoreAtom, 0.85);
      store.set(poseCorrectionAtom, 'Raise your left arm');

      const { result } = renderHook(() => usePoseLibrary(), {
        wrapper: createWrapper(store),
      });

      act(() => {
        result.current.selectScene('stage');
      });

      expect(store.get(poseScoreAtom)).toBe(0);
      expect(store.get(poseCorrectionAtom)).toBeNull();
    });
  });

  describe('nextPose', () => {
    it('cycles through available poses', () => {
      const { result } = renderHook(() => usePoseLibrary(), {
        wrapper: createWrapper(store),
      });

      const standingPoses = POSES_BY_SCENE['standing'];
      expect(store.get(currentPoseAtom)).toBe(standingPoses[0]);

      act(() => {
        result.current.nextPose();
      });
      expect(store.get(currentPoseAtom)).toBe(standingPoses[1]);

      act(() => {
        result.current.nextPose();
      });
      expect(store.get(currentPoseAtom)).toBe(standingPoses[2]);
    });

    it('wraps to first pose after last', () => {
      const { result } = renderHook(() => usePoseLibrary(), {
        wrapper: createWrapper(store),
      });

      const standingPoses = POSES_BY_SCENE['standing'];

      for (let i = 0; i < standingPoses.length; i++) {
        act(() => {
          result.current.nextPose();
        });
      }

      expect(store.get(currentPoseAtom)).toBe(standingPoses[0]);
    });

    it('resets poseScoreAtom to 0', () => {
      store.set(poseScoreAtom, 0.85);

      const { result } = renderHook(() => usePoseLibrary(), {
        wrapper: createWrapper(store),
      });

      act(() => {
        result.current.nextPose();
      });

      expect(store.get(poseScoreAtom)).toBe(0);
    });

    it('resets poseCorrectionAtom to null', () => {
      store.set(poseCorrectionAtom, 'Raise your left arm');

      const { result } = renderHook(() => usePoseLibrary(), {
        wrapper: createWrapper(store),
      });

      act(() => {
        result.current.nextPose();
      });

      expect(store.get(poseCorrectionAtom)).toBeNull();
    });

    it('cycles within new scene after selectScene', () => {
      const { result } = renderHook(() => usePoseLibrary(), {
        wrapper: createWrapper(store),
      });

      act(() => {
        result.current.selectScene('sofa');
      });

      const sofaPoses = POSES_BY_SCENE['sofa'];
      expect(store.get(currentPoseAtom)).toBe(sofaPoses[0]);

      act(() => {
        result.current.nextPose();
      });
      expect(store.get(currentPoseAtom)).toBe(sofaPoses[1]);

      for (let i = 1; i < sofaPoses.length; i++) {
        act(() => {
          result.current.nextPose();
        });
      }
      expect(store.get(currentPoseAtom)).toBe(sofaPoses[0]);
    });
  });

  describe('selectPose', () => {
    it('resets score and correction', () => {
      store.set(poseScoreAtom, 0.75);
      store.set(poseCorrectionAtom, 'Lower your shoulders');

      const { result } = renderHook(() => usePoseLibrary(), {
        wrapper: createWrapper(store),
      });

      const pose = POSES_BY_SCENE['standing'][2];

      act(() => {
        result.current.selectPose(pose);
      });

      expect(store.get(poseScoreAtom)).toBe(0);
      expect(store.get(poseCorrectionAtom)).toBeNull();
    });

    it('sets the selected pose and syncs target and hint atoms', () => {
      const { result } = renderHook(() => usePoseLibrary(), {
        wrapper: createWrapper(store),
      });

      const pose = POSES_BY_SCENE['standing'][2];

      act(() => {
        result.current.selectPose(pose);
      });

      expect(store.get(currentPoseAtom)).toBe(pose);
      expect(store.get(targetPoseAtom)).toBe(pose.targetLandmarks);
      expect(store.get(poseHintAtom)).toEqual({
        name: pose.name,
        hint: pose.actionHint,
      });
    });
  });

  describe('returned values', () => {
    it('exposes selectedScene, availablePoses, currentPose', () => {
      const { result } = renderHook(() => usePoseLibrary(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.selectedScene).toBe('standing');
      expect(result.current.availablePoses).toBe(POSES_BY_SCENE['standing']);
      expect(result.current.currentPose).toBe(POSES_BY_SCENE['standing'][0]);
    });
  });
});
