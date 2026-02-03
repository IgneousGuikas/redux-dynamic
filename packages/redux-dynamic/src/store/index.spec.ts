import { createStore } from ".";
import type { Enhancer } from "../enhancers/interface";
import type { ModuleInstance } from "../modules/interface";
import type { Action } from "../reducers/interface";

type Module = Pick<ModuleInstance, "hash" | "id" | "initialState" | "reducer">;

const module1: Module = {
    hash: "hash1",
    id: "module1",
    initialState: { field1: "hello" },
    reducer: (state) => {
        state.field1 = state.field1 === "hello" ? "hi" : "hello";
    },
};
const module2: Module = {
    hash: "hash2",
    id: "module2",
    initialState: { field2: 42 },
    reducer: (state) => {
        state.field2 = state.field2 + 1;
    },
};
const module3: Module = {
    hash: "hash3",
    id: "module3",
    initialState: { field3: true },
    reducer: (state) => {
        state.field3 = !state.field3;
    },
};

const action1: Action = {
    hash: module1.hash,
    id: module1.id,
    type: "action1",
    payload: undefined,
};
const action2: Action = {
    hash: module2.hash,
    id: module2.id,
    type: "action2",
    payload: undefined,
};
const action3: Action = {
    hash: module3.hash,
    id: module3.id,
    type: "action3",
    payload: undefined,
};

describe("Redux Dynamic -> Store -> createStore", () => {
    it("should return store instance properly", () => {
        const store1 = createStore([]);
        expect(store1).toMatchObject({
            addModules: expect.any(Function),
            dispatch: expect.any(Function),
            getModules: expect.any(Function),
            getState: expect.any(Function),
            removeModules: expect.any(Function),
            subscribe: expect.any(Function),
        });

        const store2 = createStore([
            {
                hash: "hash1",
                id: "module1",
                initialState: { field1: "hello" },
                reducer: (state) => state,
            },
        ]);
        expect(store2).toMatchObject({
            addModules: expect.any(Function),
            dispatch: expect.any(Function),
            getModules: expect.any(Function),
            getState: expect.any(Function),
            removeModules: expect.any(Function),
            subscribe: expect.any(Function),
        });
    });

    describe("Returned store instance", () => {
        it("'s getState method should return store global state properly", () => {
            const store1 = createStore([]);
            expect(store1.getState()).toMatchObject({});

            const store2 = createStore([module1]);
            expect(store2.getState()).toMatchObject({
                [module1.hash]: {
                    [module1.id]: { field1: "hello" },
                },
            });
        });

        it("'s getModules method should return store module relation properly", () => {
            const store1 = createStore([]);
            expect(store1.getModules()).toMatchObject({});

            const store2 = createStore([module1]);
            expect(store2.getModules()).toMatchObject({
                [module1.id]: expect.any(Function),
            });
        });

        it("'s addModule method should properly inject new modules to store", () => {
            const store = createStore([]);
            store.addModules([
                module1,
                module2,
                module3,
                { ...module2, hash: module1.hash },
                { ...module3, hash: module1.hash },
            ]);

            expect(store.getState()).toMatchObject({
                [module1.hash]: {
                    [module1.id]: module1.initialState,
                    [module2.id]: module2.initialState,
                    [module3.id]: module3.initialState,
                },
                [module2.hash]: {
                    [module2.id]: module2.initialState,
                },
                [module3.hash]: {
                    [module3.id]: module3.initialState,
                },
            });

            expect(store.getModules()).toMatchObject({
                [module1.id]: expect.any(Function),
                [module2.id]: expect.any(Function),
                [module3.id]: expect.any(Function),
            });
        });

        it("'s addModule method should ignore duplicated entries", () => {
            const store = createStore([module2]);
            store.addModules([{ ...module2, initialState: { overwrite: 1 } }]);

            expect(store.getState()).toMatchObject({
                [module2.hash]: {
                    [module2.id]: module2.initialState,
                },
            });
        });

        it("'s removeModule method should properly remove modules from store", () => {
            const store = createStore([
                module1,
                module2,
                module3,
                { ...module2, hash: module1.hash },
                { ...module3, hash: module1.hash },
            ]);

            store.removeModules([{ hash: module1.hash, id: module1.id }]);
            expect(store.getState()).toMatchObject({
                [module1.hash]: {
                    [module2.id]: module2.initialState,
                    [module3.id]: module3.initialState,
                },
                [module2.hash]: {
                    [module2.id]: module2.initialState,
                },
                [module3.hash]: {
                    [module3.id]: module3.initialState,
                },
            });
            expect(store.getModules()).toMatchObject({
                [module2.id]: expect.any(Function),
                [module3.id]: expect.any(Function),
            });

            store.removeModules([{ hash: module2.hash }]);
            expect(store.getState()).toMatchObject({
                [module1.hash]: {
                    [module2.id]: module2.initialState,
                    [module3.id]: module3.initialState,
                },
                [module3.hash]: {
                    [module3.id]: module3.initialState,
                },
            });
            expect(store.getModules()).toMatchObject({
                [module2.id]: expect.any(Function),
                [module3.id]: expect.any(Function),
            });

            store.removeModules([{ id: module3.id }]);
            expect(store.getState()).toMatchObject({
                [module1.hash]: {
                    [module2.id]: module2.initialState,
                },
            });
            expect(store.getModules()).toMatchObject({
                [module2.id]: expect.any(Function),
            });

            store.removeModules([{ hash: module1.hash, id: module2.id }]);
            expect(store.getState()).toMatchObject({});
            expect(store.getModules()).toMatchObject({});
        });

        it("'s dispatch method should properly route actions to the correct reducers", () => {
            const store = createStore([module1, module2, module3]);

            store.dispatch(action1);
            store.dispatch(action2);
            store.dispatch(action3);

            expect(store.getState()).toMatchObject({
                [module1.hash]: {
                    [module1.id]: { field1: "hi" },
                },
                [module2.hash]: {
                    [module2.id]: { field2: 43 },
                },
                [module3.hash]: {
                    [module3.id]: { field3: false },
                },
            });
        });

        it("'s subscribe method should properly apply listeners to store state updates", () => {
            const store = createStore([
                module1,
                module2,
                { ...module1, hash: module2.hash },
            ]);

            const globalListener = jest.fn();
            const hashListener = jest.fn();
            const idListener = jest.fn();
            const instanceListener = jest.fn();

            store.subscribe(globalListener);
            store.subscribe(hashListener, { hash: module2.hash });
            store.subscribe(idListener, { id: module1.id });
            store.subscribe(instanceListener, {
                hash: module1.hash,
                id: module1.id,
            });

            let oldState = store.getState();
            store.dispatch(action1);
            let newState = store.getState();

            expect(globalListener).toHaveBeenCalledWith(oldState, newState);
            expect(idListener).toHaveBeenCalledWith(oldState, newState);
            expect(instanceListener).toHaveBeenCalledWith(oldState, newState);
            expect(hashListener).not.toHaveBeenCalled();

            jest.resetAllMocks();

            oldState = store.getState();
            store.dispatch(action2);
            newState = store.getState();

            expect(globalListener).toHaveBeenCalledWith(oldState, newState);
            expect(hashListener).toHaveBeenCalledWith(oldState, newState);
            expect(instanceListener).not.toHaveBeenCalled();
            expect(idListener).not.toHaveBeenCalled();

            jest.resetAllMocks();

            oldState = store.getState();
            store.dispatch({ ...action1, hash: module2.hash });
            newState = store.getState();

            expect(globalListener).toHaveBeenCalledWith(oldState, newState);
            expect(hashListener).toHaveBeenCalledWith(oldState, newState);
            expect(idListener).toHaveBeenCalledWith(oldState, newState);
            expect(instanceListener).not.toHaveBeenCalled();
        });

        it("'s subscribe method returned callback should properly remove listener from store", () => {
            const store = createStore([module1]);

            const listener = jest.fn();

            const unsubscribe = store.subscribe(listener);
            unsubscribe();

            store.dispatch(action1);

            expect(listener).not.toHaveBeenCalled();
        });
    });

    it("should apply enhancer function properly", () => {
        const enhancerCreator = jest.fn((modules) => {
            const store = createStore(modules);
            const parsed = { ...store, extra: "hello" };
            return parsed;
        });
        const enhancer: Enhancer<{ extra: string }> = jest.fn(
            () => enhancerCreator,
        );

        const modules = [module1, module3];
        const store = createStore(modules, enhancer);

        expect(enhancer).toHaveBeenCalledWith(createStore);
        expect(enhancerCreator).toHaveBeenCalledWith(modules);
        expect(store).toMatchObject({
            addModules: expect.any(Function),
            dispatch: expect.any(Function),
            getModules: expect.any(Function),
            getState: expect.any(Function),
            removeModules: expect.any(Function),
            subscribe: expect.any(Function),
            extra: "hello",
        });
    });
});
