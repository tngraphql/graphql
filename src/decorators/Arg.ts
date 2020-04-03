import { DecoratorTypeOptions, DescriptionOptions, ReturnTypeFunc } from './types';
import { getMetadataStorage } from '../metadata/getMetadataStorage';
import { getParamInfo } from '../helpers/params';
import { getTypeDecoratorParams } from '../helpers/decorators';

export type ArgOptions = DecoratorTypeOptions & DescriptionOptions;

export function Arg(name: string, options?: ArgOptions): ParameterDecorator;
export function Arg(
    name: string,
    returnTypeFunc: ReturnTypeFunc,
    options?: ArgOptions,
): ParameterDecorator;
export function Arg(
    name: string,
    returnTypeFuncOrOptions?: ReturnTypeFunc | ArgOptions,
    maybeOptions?: ArgOptions,
): ParameterDecorator {
    return (prototype, propertyKey, parameterIndex) => {
        const { options, returnTypeFunc } = getTypeDecoratorParams(
            returnTypeFuncOrOptions,
            maybeOptions,
        );
        getMetadataStorage().collectHandlerParamMetadata({
            kind: 'arg',
            name,
            description: options.description,
            ...getParamInfo({ prototype, propertyKey, parameterIndex, returnTypeFunc, options }),
        });
    };
}
