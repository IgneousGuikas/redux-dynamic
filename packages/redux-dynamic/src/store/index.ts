import { produce, type WritableDraft } from "immer";

import type { Enhancer } from "../enhancers/interface";
import type { ModuleInstance } from "../modules/interface";
import type { Reducer } from "../reducers/interface";
import { hashState } from "../utils/cache";

import type {
    ModuleRelation,
    RootState,
    Store,
    StoreListener,
} from "./interface";

export function createStore<
    Extra extends Record<string, any> = NonNullable<unknown>,
>(
    modules: Pick<ModuleInstance, "hash" | "id" | "initialState" | "reducer">[],
    enhancer?: Enhancer<Extra>,
): Store & Extra {
    if (enhancer) {
        if (typeof enhancer !== "function") {
            throw new Error("Expected the enhancer to be a function.");
        }
        return enhancer(createStore)(modules);
    }

    const rootState: { current: RootState } = { current: {} };
    const moduleRelation: ModuleRelation = {};
    const listenerRelation: Map<string, StoreListener[]> = new Map();
    let isDispatching = false;

    const getState: Store["getState"] = () => {
        if (isDispatching) {
            throw new Error(
                "You may not call store.getState() while the reducer is executing. " +
                    "The reducer has already received the state as an argument. " +
                    "Pass it down from the top reducer instead of reading it from the store.",
            );
        }
        return rootState.current;
    };
    const getModules: Store["getModules"] = () => moduleRelation;

    const addModules: Store["addModules"] = (mds) => {
        for (const module of mds) {
            const { hash, id, initialState, reducer } = module;

            if (!rootState.current[hash]) rootState.current[hash] = {};
            if (rootState.current[hash][id]) continue;
            rootState.current[hash][id] = hashState(initialState);

            moduleRelation[id] = reducer;
        }
    };

    const removeModules: Store["removeModules"] = (mdsToRemove) => {
        for (const module of mdsToRemove) {
            const { hash, id } = module;
            if (!hash && !id) continue;

            if (hash && id) {
                const group = rootState.current[hash];
                if (!group) continue;
                delete group[id];
            } else if (hash) {
                delete rootState.current[hash];
            } else if (id) {
                const groups = Object.getOwnPropertyNames(rootState.current);
                for (const grpId of groups) {
                    const group = rootState.current[grpId]!;
                    delete group[id];
                }
            }
        }

        const groups = Object.getOwnPropertyNames(rootState.current);
        const stateModuleIds = new Set();
        for (const grp of groups) {
            const ids = Object.getOwnPropertyNames(rootState.current[grp]);
            ids.forEach((id) => stateModuleIds.add(id));
            if (!ids.length) delete rootState.current[grp];
        }

        const relationModuleIds = Object.getOwnPropertyNames(moduleRelation);
        for (const mdId of relationModuleIds) {
            if (!stateModuleIds.has(mdId)) delete moduleRelation[mdId];
        }
    };

    const mainReducer: Reducer<RootState> = (root, action) => {
        const { hash, id } = action;

        if (!root[hash]) {
            throw new Error(
                `No module group found with provided hash: ${hash}`,
            );
        }
        if (typeof root[hash][id] === "undefined") {
            throw new Error(
                `No module with id "${id}" found within hash group "${hash}"`,
            );
        }
        if (!moduleRelation[id]) {
            throw new Error(`No module with id "${id}" found`);
        }

        const reducer = moduleRelation[id];

        const applyAction = produce((rootDraft: WritableDraft<RootState>) => {
            const draft = rootDraft[hash]?.[id];
            reducer(draft, action);
            hashState(draft);
        });

        return applyAction(root);
    };

    const dispatch: Store["dispatch"] = (action) => {
        if (isDispatching) {
            throw new Error("Reducers may not dispatch actions.");
        }

        const oldRoot = rootState.current;

        try {
            isDispatching = true;
            rootState.current = mainReducer(oldRoot, action);
        } finally {
            isDispatching = false;
        }

        const listeners = [
            listenerRelation.get("/") ?? [],
            listenerRelation.get([action.hash, ""].join("/")) ?? [],
            listenerRelation.get(["", action.id].join("/")) ?? [],
            listenerRelation.get([action.hash, action.id].join("/")) ?? [],
        ].flat();
        listeners.forEach((listener) => listener(oldRoot, rootState.current));

        return action;
    };

    const subscribe: Store["subscribe"] = (listener, options = {}) => {
        if (isDispatching) {
            throw new Error(
                "You may not call store.subscribe() while the reducer is executing.",
            );
        }

        const key = [options.hash ?? "", options.id ?? ""].join("/");
        if (!listenerRelation.has(key)) listenerRelation.set(key, []);

        const listeners = listenerRelation.get(key)!;
        listeners.push(listener);

        return function unsubscribe() {
            if (isDispatching) {
                throw new Error(
                    "You may not unsubscribe from a store listener while the reducer is executing. ",
                );
            }
            const listeners = listenerRelation.get(key)!;
            const idx = listeners.indexOf(listener);
            listeners.splice(idx, 1);
        };
    };

    addModules(modules);

    return {
        addModules,
        dispatch,
        getModules,
        getState,
        removeModules,
        subscribe,
    } as Store & Extra;
}
