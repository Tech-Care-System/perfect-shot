'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle, Camera, RefreshCw, Shield } from 'lucide-react';

function DeniedScreenStatic() {
  const instructions = [
    'Tap the "aA" button in the address bar',
    'Select "Website Settings"',
    'Toggle "Camera" to Allow',
    'Refresh this page',
  ];
  
  return (
    <div className="permission-screen flex flex-col items-center justify-center gap-8 text-center">
      {/* Warning Icon */}
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-surface">
        <AlertTriangle className="h-12 w-12 text-feedback-warning" />
      </div>
      
      {/* Title */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Camera Access Needed
        </h1>
        <p className="text-base text-muted-foreground">
          No worries! Here&apos;s how to enable camera access:
        </p>
      </div>
      
      {/* Browser-specific instructions */}
      <ol className="max-w-xs list-inside list-decimal space-y-2 text-left text-sm text-text-secondary">
        {instructions.map((step, index) => (
          <li key={index} className="pl-2">
            {step}
          </li>
        ))}
      </ol>
      
      {/* Check Again Button */}
      <Button 
        size="lg" 
        variant="secondary"
        className="h-12 min-w-[200px] text-base font-medium"
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Check Again
      </Button>
      
      {/* Help text */}
      <p className="max-w-xs text-xs text-muted-foreground">
        Still having trouble? Try refreshing the page and tapping &quot;Grant Camera Access&quot; again.
      </p>
    </div>
  );
}

function WelcomeScreenStatic() {
  return (
    <div className="permission-screen flex flex-col items-center justify-center gap-8 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-surface">
        <Camera className="h-12 w-12 text-foreground" />
      </div>
      
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          ai-perfect-shot
        </h1>
        <p className="text-lg text-muted-foreground">
          Real-time AI pose guidance
        </p>
      </div>
      
      <div className="max-w-xs">
        <p className="text-base text-text-secondary">
          We need camera access to show you live pose feedback and help you take better photos.
        </p>
      </div>
      
      <Button 
        size="lg" 
        className="h-12 min-w-[200px] text-base font-medium"
      >
        Grant Camera Access
      </Button>
      
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Shield className="h-4 w-4" />
        <span>Your photos never leave your device</span>
      </div>
    </div>
  );
}

export default function VisualTestPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        {/* Welcome State */}
        <div className="flex flex-col items-center justify-center p-8 border-r border-border">
          <h2 className="text-xs font-mono text-muted-foreground mb-8 uppercase">
            Welcome State (permission: prompt)
          </h2>
          <WelcomeScreenStatic />
        </div>
        
        {/* Denied State */}
        <div className="flex flex-col items-center justify-center p-8">
          <h2 className="text-xs font-mono text-muted-foreground mb-8 uppercase">
            Denied State (permission: denied)
          </h2>
          <DeniedScreenStatic />
        </div>
      </div>
    </div>
  );
}
