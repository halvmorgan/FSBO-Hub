import { useState, useEffect, useRef } from 'react';

/**
 * Hook to manage AI wait and timeout state:
 * - If execution takes longer than 15 seconds: shows "This is taking a little longer than usual, hang tight..."
 * - After 90 seconds: automatically stops and invokes onTimeout callback to display "AI is busy, please try again" with a Try Again button
 */
export function useAiWaitTimer(isLoading: boolean, onTimeout: () => void) {
  const [waitMessage, setWaitMessage] = useState<string | null>(null);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  useEffect(() => {
    if (!isLoading) {
      setWaitMessage(null);
      return;
    }

    // 15 seconds timer
    const waitTimer = setTimeout(() => {
      setWaitMessage('This is taking a little longer than usual, hang tight...');
    }, 15000);

    // 90 seconds timeout
    const timeoutTimer = setTimeout(() => {
      setWaitMessage(null);
      if (onTimeoutRef.current) {
        onTimeoutRef.current();
      }
    }, 90000);

    return () => {
      clearTimeout(waitTimer);
      clearTimeout(timeoutTimer);
    };
  }, [isLoading]);

  return { waitMessage };
}
