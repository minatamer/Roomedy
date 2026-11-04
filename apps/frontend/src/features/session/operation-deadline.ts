import { POLICY } from '@roomedy/contracts/policy';

export type OperationStage = 'request' | 'verification';
export type OperationProgress = (stage: OperationStage) => void;

/** Bound active network/local work. Human verification waiting owns no server work slot. */
export function createOperationDeadline(expired: () => void) {
  let live = true;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const stage: OperationProgress = (next) => {
    clearTimeout(timer);
    timer = undefined;
    if (!live || next === 'verification') return;
    timer = setTimeout(() => {
      if (!live) return;
      live = false;
      timer = undefined;
      expired();
    }, POLICY.operationBridgeMs);
  };
  stage('request');
  return {
    stage,
    dispose() {
      live = false;
      clearTimeout(timer);
      timer = undefined;
    },
  };
}
