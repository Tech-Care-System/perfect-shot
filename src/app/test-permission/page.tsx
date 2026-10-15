'use client';

import { PermissionScreen } from '@/components/screens/permission-screen';
import { Button } from '@/components/ui/button';
import { cameraPermissionAtom } from '@/lib/stores/camera-store';
import { Provider, useAtom } from 'jotai';

function PermissionScreenTestContent() {
  const [permission, setPermission] = useAtom(cameraPermissionAtom);

  return (
    <div className="min-h-screen bg-background">
      {/* Test Controls */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 rounded-lg bg-surface p-4 shadow-lg border border-border">
        <h3 className="text-sm font-semibold text-foreground">Test Controls</h3>
        <div className="flex flex-col gap-2">
          <Button
            size="sm"
            variant={permission === 'prompt' ? 'default' : 'outline'}
            onClick={() => setPermission('prompt')}
          >
            Prompt State
          </Button>
          <Button
            size="sm"
            variant={permission === 'denied' ? 'default' : 'outline'}
            onClick={() => setPermission('denied')}
          >
            Denied State
          </Button>
          <Button
            size="sm"
            variant={permission === 'granted' ? 'default' : 'outline'}
            onClick={() => setPermission('granted')}
          >
            Granted State
          </Button>
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          Current: <span className="font-mono">{permission}</span>
        </div>
      </div>

      {/* Permission Screen */}
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        {permission === 'granted' ? (
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-foreground">
              ✅ Permission Granted
            </h1>
            <p className="mt-2 text-muted-foreground">
              The camera screen would appear here (Story 1.3)
            </p>
          </div>
        ) : (
          <PermissionScreen />
        )}
      </main>
    </div>
  );
}

export default function PermissionScreenTestPage() {
  return (
    <Provider>
      <PermissionScreenTestContent />
    </Provider>
  );
}
