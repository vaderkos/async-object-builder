export type Await<P> = P extends PromiseLike<infer T>
    ? T extends PromiseLike<infer R> ? Await<R> : T
    : P

/**
 * Infers and expands T type.
 * Useful for complex types to infer final type at first nesting level.
 */
export type Expand<T extends any> = T extends object
    ? T extends infer O
        ? { [K in keyof O]: O[K] }
        : never
    : T

/**
 * Converts union type U to intersection
 */
type Intersection<U> =
    (U extends any ? (_: U) => void : never) extends (_: infer V) => void
        ? V
        : U

export type ValuesIntersection<T extends Record<string, Record<string, any>>> = Intersection<T[keyof T]>

export type PropGuard<P extends keyof any, G extends Record<any, any>> = P extends keyof G
    ? G[P]
    : any

export type RecordGuard<P extends keyof any, G extends Record<any, any>> = P extends keyof G
    ? G[P] extends Record<any, any>
        ? G[P][keyof G[P]]
        : any
    : any

export type Supplier<O extends object, V extends any> = PromiseLike<V>
    | Builder<any, V & object>
    | ((obj: O) => V)
    | ((obj: O) => PromiseLike<V>)

export type SupplierResult<S extends Supplier<any, any>> = S extends Supplier<any, infer R> ? Await<R> : never

export type BuilderContext<
    Guards extends object,
    Result extends object,
    Props extends string,
    Records extends string
> = Builder<Guards, Result, Props, Records> & BuilderSuppliers<Guards, Result, Props, Records>

export type BuilderSuppliers<
    Guards extends object,
    Result extends object,
    Props extends string,
    Records extends string
> = ValuesIntersection<{
    [K in Props]: {
        [M in `supply${Capitalize<K>}`]:
            <V extends PropGuard<K, Guards>> (supply: Supplier<Result, V>) => BuilderContext<
                Guards,
                { [P in keyof Result | K]: P extends K ? V : Result[P & keyof Result] },
                Props,
                Records
            >
    }
}> & ValuesIntersection<{
    [K in Records]: {
        [M in `supplyTo${Capitalize<K>}`]:
            <S extends Record<string, Supplier<Result, RecordGuard<K, Guards>>>> (supplies: S) => BuilderContext<
                Guards,
                {
                    [P in keyof Result | K]: P extends K
                        ? Expand<Result[P & keyof Result] & { [SK in keyof S]: SupplierResult<S[SK]> }>
                        : Result[P & keyof Result]
                },
                Props,
                Records
            >
    }
}>

export interface Builder<
    Guards extends object,
    Result extends object,
    Props extends string = never,
    Records extends string = never
> {
    props <P extends string>(props: readonly P[]): BuilderContext<
        { [K in keyof Guards | P]: K extends P ? unknown : Guards[K & keyof Guards] },
        { [K in keyof Result | P ]: K extends P ? undefined : Result[K & keyof Result] },
        Props | P,
        Records
    >

    records <R extends string>(records: readonly R[]): BuilderContext<
        { [K in keyof Guards | R]: K extends R ? Record<string, unknown> : Guards[K & keyof Guards] },
        { [K in keyof Result | R ]: K extends R ? {} : Result[K & keyof Result] },
        Props,
        Records | R
    >

    guard <G extends Partial<Record<keyof Guards, any>>> (): BuilderContext<
        { [K in keyof G | keyof Guards]: K extends keyof G ? G[K] : Guards[K & keyof Guards] },
        Result,
        Props,
        Records
    >

    guardProp <P extends keyof Guards, G extends any> (): BuilderContext<
        { [K in keyof Guards]: K extends P ? G : Guards[K] },
        Result,
        Props,
        Records
    >

    guardRecord<P extends keyof Guards, G extends any> (): BuilderContext<
        { [K in keyof Guards]: K extends P ? Record<string, G> : Guards[K] },
        Result,
        Props,
        Records
    >

    build (): Promise<Result>

    perform (
        action: (obj: Result) => any
    ): BuilderContext<Guards, Result, Props, Records>

    map <NewResult extends object> (
        mapper: Supplier<Result, NewResult>
    ): BuilderContext<Guards, NewResult, Props, Records>

    on (
        event: 'error',
        handler: (error: BuilderError, obj: Result) => any // todo Result may have nonexistent props
    ): BuilderContext<Guards, Result, Props, Records>

    on (
        event: 'step',
        handler: (step: BuilderStep, obj: Result) => any
    ): BuilderContext<Guards, Result, Props, Records>
}

interface BuilderError extends Error {

}

interface BuilderStep {

}






