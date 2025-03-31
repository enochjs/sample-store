import { useRef, useSyncExternalStore } from "react";
import { shallow } from "./shallow";

type Selector<S, E> = (state: S) => E;

type SetState<S> = (partial: Partial<S>, options?: { replace?: boolean, flushUpdate?: boolean }) => void;
export interface Actions<S> {
  [key: string]: (...payload: any[]) => <R>(set: SetState<S>, state: S) => any;
}

type ArgumentTypes<T> = T extends (...args: infer U) => any ? U : never;
type ReplaceReturnType<T, TReturn> = (...args: ArgumentTypes<T>) => TReturn;
type ReturnActions<S, A extends Actions<S>> = {
  [K in keyof A]: ReturnType<A[K]> extends (...args: any) => infer R
    ? ReplaceReturnType<A[K], R>
    : ReplaceReturnType<A[K], void>;
};

type Hooks<S, A extends Actions<S>, E = S> = [Readonly<E>, ReturnActions<S, A>];

const isSupportedProxy = typeof Proxy !== "undefined";

export interface Store<S, A extends Actions<S>> {
  useStore(): Hooks<S, A>;
  useStore<E = S>(selector?: Selector<S, E>): Hooks<S, A, E>;
  getState: () => Readonly<S>;
  getActions: () => ReturnActions<S, A>;
  subscribe: (listener: (state: S, previous?: S) => void) => () => void;
}

function createStore<S, R extends Actions<S>>(initState: S, reducers: R) {
  let state = initState;
  const listeners = new Set<(state: S, previous?: S) => void>();

  const update = () => {
    listeners.forEach((listener) => listener(state));
  };

  let proxy: ReturnActions<S, R>;

  const setState = (partial: Partial<S>, options?: {replace?: boolean, flushUpdate?: boolean}) => {
    const { replace, flushUpdate } = options || {};
    const nextState = partial;
    if (!Object.is(nextState, state)) {
      state =
        (replace ?? (typeof nextState !== "object" || nextState === null))
          ? (nextState as S)
          : Object.assign({}, state, nextState);
    }
    if (flushUpdate) {
      update();
    }
  };

  const store = {
    getState() {
      return state;
    },
    getActions() {
      return proxy;
    },
    subscribe(listener: (state: S) => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    useStore<E = S>(selector?: Selector<S, E>) {
      const pre = useRef<E>();
      const state = useSyncExternalStore(store.subscribe, () => {
        if (selector) {
          const next = selector(store.getState());
          if (shallow(pre.current, next)) {
            return pre.current;
          }
          pre.current = next;
          return pre.current;
        }
        return store.getState() as any as E;
      });
      return [state, proxy] as const;
    },
  } as any as Store<S, R>;

  const mapActions =
    (key: string) =>
    (...args: any[]) => {
      const action = reducers[key](...args);
      const result = action(setState, store.getState());
      if (result instanceof Promise) {
        result.then(update);
      } else {
        update();
      }
      return result;
    };

  if (isSupportedProxy) {
    proxy = new Proxy(reducers, {
      get(target, key, desc) {
        return mapActions(key as string);
      },
    }) as any;
  } else {
    proxy = Object.keys(reducers).reduce((pre: any, key: string) => {
      pre[key] = mapActions(key);
      return pre;
    }, {} as R);
  }

  return store;
}

export default createStore;
