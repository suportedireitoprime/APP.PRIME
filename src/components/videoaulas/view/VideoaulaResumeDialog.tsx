import React, { memo } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatTempo } from './VideoaulaPlayerHeader';

interface VideoaulaResumeDialogProps {
  open: boolean;
  tempo: number;
  onOpenChange: (open: boolean) => void;
  onRestart: () => void;
  onResume: () => void;
}

export const VideoaulaResumeDialog = memo(function VideoaulaResumeDialog({
  open,
  tempo,
  onOpenChange,
  onRestart,
  onResume,
}: VideoaulaResumeDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="w-11/12 max-w-md rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Continuar assistindo?</AlertDialogTitle>
          <AlertDialogDescription>
            Você já começou esta aula. Deseja continuar de {formatTempo(tempo)} ou recomeçar do zero?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
          <AlertDialogCancel onClick={onRestart} className="mt-0">
            Começar do zero
          </AlertDialogCancel>
          <AlertDialogAction onClick={onResume}>
            Continuar de onde parei
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
});
