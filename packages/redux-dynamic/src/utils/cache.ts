export const hashSymbol = Symbol("redux-dynamic-hash-state");

export type HashState<State, Attach = true> = State extends [
    infer F,
    ...infer Rest,
]
    ? ([] extends Rest
          ? [HashState<F>]
          : HashState<Rest, false> extends any[]
            ? [HashState<F>, ...HashState<Rest, false>]
            : [HashState<F>]) &
          (Attach extends true
              ? { [hashSymbol]: string }
              : NonNullable<unknown>)
    : State extends (infer T)[]
      ? HashState<T>[] & { [hashSymbol]: string }
      : State extends Record<string, any>
        ? {
              [K in keyof State]: State[K] extends Record<string, any>
                  ? HashState<State[K]>
                  : State[K];
          } & {
              [hashSymbol]: string;
          }
        : State;

export type UnhashState<State> = (
    State extends infer S & { [hashSymbol]: string } ? S : State
) extends infer Parsed
    ? Parsed extends [infer F, ...infer Rest]
        ? [] extends Rest
            ? [UnhashState<F>]
            : UnhashState<Rest> extends any[]
              ? [UnhashState<F>, ...UnhashState<Rest>]
              : never
        : Parsed extends (infer T)[]
          ? UnhashState<T>[]
          : Parsed extends Record<string, any>
            ? {
                  [K in keyof Parsed]: Parsed[K] extends Record<string, any>
                      ? UnhashState<Parsed[K]>
                      : Parsed[K];
              }
            : Parsed
    : never;

function cyrb64Hash(str: string, seed = 0) {
    let h1 = 0xdeadbeef ^ seed,
        h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return h2.toString(36).padStart(7, "0") + h1.toString(36).padStart(7, "0");
}

export function hashState<State>(state: State): HashState<State> {
    if (typeof state === "function") return state as HashState<State>;
    if (Array.isArray(state)) {
        const temp = state.map((el) => hashState(el));
        if (hashSymbol in temp) delete temp[hashSymbol];
        temp[hashSymbol as any] = cyrb64Hash(JSON.stringify(temp));
        return temp as HashState<State>;
    }
    if (typeof state === "object" && state) {
        const temp: Record<string, any> = {};
        const keys = Object.getOwnPropertyNames(state) as (keyof State)[];
        for (const key of keys) {
            temp[key as string] = hashState(state[key]);
        }
        temp[hashSymbol as any] = cyrb64Hash(JSON.stringify(temp));
        return temp as HashState<State>;
    }
    return state as HashState<State>;
}

export function unhashState<State>(state: State): UnhashState<State> {
    if (typeof state === "function") return state as UnhashState<State>;
    if (Array.isArray(state)) {
        const temp = state.map((el) => unhashState(el));
        if (hashSymbol in temp) delete temp[hashSymbol];
        return temp as UnhashState<State>;
    }
    if (typeof state === "object" && state) {
        const temp: Record<string, any> = {};
        const keys = Object.getOwnPropertyNames(state) as (keyof State)[];
        for (const key of keys) {
            temp[key as string] = unhashState(state[key]);
        }
        return temp as UnhashState<State>;
    }
    return state as UnhashState<State>;
}
