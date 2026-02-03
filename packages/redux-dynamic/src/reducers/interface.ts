export interface Action<Payload = void> {
    hash: string;
    id: string;
    type: string;
    payload: void extends Payload ? undefined : Payload;
}

export interface Reducer<
    State = any,
    Actions extends Action<any> = Action<any>,
> {
    (state: State, action: Actions): State;
}
