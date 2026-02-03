import type { Reducer } from "../reducers/interface";

export interface Module<State = any> {
    id: string;
    initialState: State;
    reducer: Reducer<State>;
}

export interface ModuleInstance<State = any> extends Module<State> {
    hash: string;
}
