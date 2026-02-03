import type { Action, Reducer } from "../reducers/interface";
import type { HashState } from "../utils/cache";

import type { ModuleInstance } from "../modules/interface";

export interface RootState {
    [hash: string]: {
        [id: string]: NonNullable<HashState<any>>;
    };
}

export interface ModuleRelation {
    [id: string]: Reducer;
}

export interface StoreListener {
    (prev: RootState, curr: RootState): void;
}

export interface Store {
    addModules: (
        modules: Pick<
            ModuleInstance,
            "hash" | "id" | "initialState" | "reducer"
        >[],
    ) => void;
    dispatch: <A extends Action<any>>(action: A) => A;
    getModules: () => ModuleRelation;
    getState: () => RootState;
    removeModules: (
        modulesToRemove: Partial<Pick<ModuleInstance, "hash" | "id">>[],
    ) => void;
    subscribe: (
        listener: StoreListener,
        options?: { hash?: string; id?: string },
    ) => () => void;
}
