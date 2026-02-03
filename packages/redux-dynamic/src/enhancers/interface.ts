import type { ModuleInstance } from "../modules/interface";
import type { Store } from "../store/interface";

export interface StoreCreator {
    (
        modules: Pick<
            ModuleInstance,
            "hash" | "id" | "initialState" | "reducer"
        >[],
    ): Store;
}

export interface Enhancer<
    Extra extends Record<string, any> = NonNullable<unknown>,
> {
    (
        creator: StoreCreator,
    ): (
        modules: Pick<
            ModuleInstance,
            "hash" | "id" | "initialState" | "reducer"
        >[],
    ) => Store & Extra;
}
