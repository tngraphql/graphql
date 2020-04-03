import { findType } from './findType';
import { ReturnTypeFunc, TypeOptions } from '../decorators/types';
import { CommonArgMetadata } from '../metadata/definitions';
import { SymbolKeysNotSupportedError } from '../errors';

export interface ParamInfo {
    prototype: Object;
    propertyKey: string | symbol;
    parameterIndex: number;
    returnTypeFunc?: ReturnTypeFunc;
    options?: TypeOptions;
}

export function getParamInfo({
                                 prototype,
                                 propertyKey,
                                 parameterIndex,
                                 returnTypeFunc,
                                 options = {},
                             }: ParamInfo): CommonArgMetadata {
    if ( typeof propertyKey === 'symbol' ) {
        throw new SymbolKeysNotSupportedError();
    }

    const { getType, typeOptions } = findType({
        metadataKey: 'design:paramtypes',
        prototype,
        propertyKey,
        parameterIndex,
        returnTypeFunc,
        typeOptions: options,
    });

    return {
        target: prototype.constructor,
        methodName: propertyKey,
        index: parameterIndex,
        getType,
        typeOptions
    };
}
