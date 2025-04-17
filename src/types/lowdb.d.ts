declare module "lowdb" {
  interface LowdbSync<T> {
    defaults: (defaults: T) => LowdbSync<T>;
    get: <K extends keyof T>(name: K) => LowdbChain<T[K]>;
    set: <K extends keyof T>(name: K, value: T[K]) => LowdbSync<T>;
    update: <K extends keyof T>(
      name: K,
      fn: (value: T[K]) => T[K]
    ) => LowdbSync<T>;
    write: () => void;
    read: () => T;
    state: T;
  }

  interface LowdbChain<T> {
    find: (query: any) => LowdbChain<T extends Array<infer U> ? U : T>;
    value: () => T;
    push: (item: T extends Array<infer U> ? U : never) => LowdbChain<T>;
    assign: (data: Partial<T extends Array<infer U> ? U : T>) => LowdbChain<T>;
  }

  function lowdb<T>(adapter: any): LowdbSync<T>;
  export = lowdb;
}

declare module "lowdb/adapters/FileSync" {
  export default class FileSync<T> {
    constructor(filename: string);
  }
}
