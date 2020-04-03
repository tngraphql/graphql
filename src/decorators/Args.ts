import { getMetadataStorage } from '../metadata/getMetadataStorage';
import { getParamInfo } from '../helpers/params';
import { ReturnTypeFunc } from './types';
import { getTypeDecoratorParams } from '../helpers/decorators';

export function Args(): ParameterDecorator;
export function Args(
    paramTypeFunction: ReturnTypeFunc
): ParameterDecorator;
export function Args(
    paramTypeFnOrOptions?: ReturnTypeFunc
): ParameterDecorator {
    const { options, returnTypeFunc } = getTypeDecoratorParams(paramTypeFnOrOptions, {});
    return (prototype, propertyKey, parameterIndex) => {
        getMetadataStorage().collectHandlerParamMetadata({
            kind: 'args',
            ...getParamInfo({ prototype, propertyKey, parameterIndex, returnTypeFunc, options }),
        });
    };
}
