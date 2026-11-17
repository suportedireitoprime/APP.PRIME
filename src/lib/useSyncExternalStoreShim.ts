import React from 'react';

/**
 * 100% ESM compatible shim for useSyncExternalStoreWithSelector.
 * Solves Vite dev-server CJS export mismatch in React 19 and prevents
 * "Cannot read properties of undefined (reading 'hasValue')".
 */
export function useSyncExternalStoreWithSelector<Snapshot, Selection>(
  subscribe: (onStoreChange: () => void) => () => void,
  getSnapshot: () => Snapshot,
  getServerSnapshot: undefined | null | (() => Snapshot),
  selector: (snapshot: Snapshot) => Selection,
  isEqual?: (a: Selection, b: Selection) => boolean
): Selection {
  const instRef = React.useRef<{ hasValue: boolean; value: Selection }>({
    hasValue: false,
    value: undefined as unknown as Selection,
  });

  const [getSelection, getServerSelection] = React.useMemo(() => {
    let hasMemo = false;
    let memoizedSnapshot: Snapshot;
    let memoizedSelection: Selection;

    const memoizedSelector = (nextSnapshot: Snapshot) => {
      if (!hasMemo) {
        hasMemo = true;
        memoizedSnapshot = nextSnapshot;
        const nextSelection = selector(nextSnapshot);
        if (isEqual !== undefined && instRef.current?.hasValue) {
          const currentSelection = instRef.current.value;
          if (isEqual(currentSelection, nextSelection)) {
            return (memoizedSelection = currentSelection);
          }
        }
        return (memoizedSelection = nextSelection);
      }
      const prevSnapshot = memoizedSnapshot;
      const prevSelection = memoizedSelection;
      if (Object.is(prevSnapshot, nextSnapshot)) {
        return prevSelection;
      }
      const nextSelection = selector(nextSnapshot);
      if (isEqual !== undefined && isEqual(prevSelection, nextSelection)) {
        return prevSelection;
      }
      memoizedSnapshot = nextSnapshot;
      return (memoizedSelection = nextSelection);
    };

    const getSnapshotWithSelector = () => memoizedSelector(getSnapshot());
    const getServerSnapshotWithSelector =
      getServerSnapshot === undefined || getServerSnapshot === null
        ? undefined
        : () => memoizedSelector(getServerSnapshot());

    return [getSnapshotWithSelector, getServerSnapshotWithSelector];
  }, [getSnapshot, getServerSnapshot, selector, isEqual]);

  const value = React.useSyncExternalStore(
    subscribe,
    getSelection,
    getServerSelection
  );

  React.useEffect(() => {
    if (instRef.current) {
      instRef.current.hasValue = true;
      instRef.current.value = value;
    }
  }, [value]);

  React.useDebugValue(value);
  return value;
}

export default {
  useSyncExternalStoreWithSelector,
};
