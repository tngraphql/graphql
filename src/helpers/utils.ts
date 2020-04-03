const toString = Function.prototype.toString

export type ArrayElements<TArray extends any[]> = TArray extends Array<infer TElement>
    ? TElement
    : never;

export type UnionFromClasses<TClassesArray extends any[]> = InstanceType<ArrayElements<TClassesArray>>;

/**
 * Returns a function telling if value is a class or not
 */
export function isClass (fn: any): boolean {
    return typeof (fn) === 'function' && /^class\s/.test(toString.call(fn))
}

/**
 * Returns a boolean to differentiate between null and objects
 * and arrays too
 */
export function isObject (value: any): boolean {
    return value && typeof (value) === 'object' && !Array.isArray(value)
}

/**
 * Returns a function telling if value is a class or not
 */
export function isFuntion (value: any): boolean {
    return typeof value === 'function';
}