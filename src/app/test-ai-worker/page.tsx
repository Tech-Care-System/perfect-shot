'use client';

import { Button } from '@/components/ui/button';
import { useAIWorker } from '@/lib/hooks/use-ai-worker';
import { notFound } from 'next/navigation';
import { useState } from 'react';

export default function TestAIWorkerPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  const { workerStatus, lastResponse, error, initializationDurationMs, postMessage, terminate } =
    useAIWorker();
  const [clickCount, setClickCount] = useState(0);

  const [canvasError, setCanvasError] = useState<string | null>(null);
 
   const handleDetect = () => {
     if (typeof OffscreenCanvas === 'undefined') {
       setCanvasError('OffscreenCanvas is not supported in this environment.');
       return;
     }
     setCanvasError(null);
 
     // Use a representative camera-sized frame instead of a 1×1 placeholder.
     const canvas = new OffscreenCanvas(320, 240);
     postMessage({
       type: 'DETECT',
       payload: {
         image: canvas,
         timestamp: performance.now(),
       },
     }, [canvas]);
   };

  return (
    <main className="min-h-screen bg-background text-foreground p-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <h1 className="text-2xl font-semibold">AI Worker Integration Check</h1>

        <div className="rounded-lg border border-border bg-surface p-4">
          <p>
            <span className="font-medium">Worker status:</span>{' '}
            <span data-testid="worker-status">{workerStatus}</span>
          </p>
          <p>
            <span className="font-medium">Initialization time:</span>{' '}
            <span data-testid="worker-init-time">
              {initializationDurationMs === null ? 'measuring...' : `${initializationDurationMs} ms`}
            </span>
          </p>
          <p>
            <span className="font-medium">Last response:</span>{' '}
            <span data-testid="worker-response">{lastResponse?.type ?? 'none'}</span>
          </p>
          <p>
            <span className="font-medium">Error details:</span>{' '}
            <span data-testid="worker-error">
              {error 
                ? typeof error === 'string' 
                  ? error 
                  : (error.rawError ? String(error.rawError) : 'Unknown error')
                : 'none'}
            </span>

          </p>
        </div>

        <div className="flex flex-col gap-2">
           <div className="flex flex-wrap items-center gap-3">
             <Button onClick={handleDetect}>Run DETECT</Button>
             <Button variant="secondary" onClick={terminate}>
               Terminate Worker
             </Button>
             <Button
               variant="outline"
               data-testid="ui-counter-button"
               onClick={() => setClickCount((value) => value + 1)}
             >
               UI Counter: <span data-testid="ui-counter-value">{clickCount}</span>
             </Button>
           </div>
           {canvasError && (
             <p className="text-sm text-destructive font-medium" data-testid="canvas-error">
               {canvasError}
             </p>
           )}
         </div>

        <p className="text-sm text-muted-foreground">
          Click the counter repeatedly while DETECT is running. Counter updates must remain immediate.
        </p>
      </div>
    </main>
  );
}
