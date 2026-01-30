import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

const useIsomorphicLayoutEffect =
    typeof window !== 'undefined' ? useLayoutEffect : useEffect;

// biome-ignore lint/suspicious/noExplicitAny: generic utility requires flexible function signature
export function useEffectEvent<T extends (...args: any[]) => any>(fn: T): T {
    const ref = useRef(fn);

    useIsomorphicLayoutEffect(() => {
        ref.current = fn;
    }, [fn]);

    // biome-ignore lint/suspicious/noExplicitAny: must match generic T's parameter spread
    return useCallback((...args: any[]) => {
        return ref.current(...args);
    }, []) as T;
}
