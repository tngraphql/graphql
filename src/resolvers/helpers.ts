import { PubSubEngine } from 'graphql-subscriptions';
import { ParamMetadata } from '../metadata/definitions';
import { convertToType } from '../helpers/types';
import { ResolverData } from '../interfaces';
import { Middleware, MiddlewareClass, MiddlewareFn } from '../interfaces/Middleware';
import { IOCContainer } from '../utils/container';
import { convertArgsToInstance, convertArgToInstance } from './convert-args';
import isPromiseLike from '../utils/isPromiseLike';
import haye from 'haye'

export function getParams(
    params: ParamMetadata[],
    resolverData: ResolverData<any>,
    pubSub: PubSubEngine,
): Promise<any[]> | any[] {
    const paramValues = params
        .sort((a, b) => a.index - b.index)
        .map(paramInfo => {
            switch (paramInfo.kind) {
            case 'args':
                return convertArgsToInstance(paramInfo, resolverData.args);
            case 'arg':
                return convertArgToInstance(paramInfo, resolverData.args);
            case 'context':
                if ( paramInfo.propertyName ) {
                    return resolverData.context[paramInfo.propertyName];
                }
                return resolverData.context;
            case 'root':
                const rootValue = paramInfo.propertyName
                    ? resolverData.root[paramInfo.propertyName]
                    : resolverData.root;
                if ( ! paramInfo.getType ) {
                    return rootValue;
                }
                return convertToType(paramInfo.getType(), rootValue);
            case 'info':
                return resolverData.info;
            case 'pubSub':
                if ( paramInfo.triggerKey ) {
                    return (payload: any) => pubSub.publish(paramInfo.triggerKey!, payload);
                }
                return pubSub;
            case 'custom':
                return paramInfo.resolver(resolverData);
            }
        });
    if ( paramValues.some(isPromiseLike) ) {
        return Promise.all(paramValues);
    } else {
        return paramValues;
    }
}

export function applyMiddlewares(
    container: IOCContainer,
    resolverData: ResolverData<any>,
    middlewares: Array<Middleware<any>> | string[],
    resolverHandlerFunction: () => any,
): Promise<any> {
    if ( middlewares.length === 0 ) {
        return resolverHandlerFunction();
    }
    let middlewaresIndex = -1;

    async function dispatchHandler(currentIndex: number): Promise<void> {
        if ( currentIndex <= middlewaresIndex ) {
            throw new Error('next() called multiple times');
        }
        middlewaresIndex = currentIndex;
        type HandlerFn = {
            value: MiddlewareFn<any>,
            args?: any[];
        }
        let handlerFn: HandlerFn;
        let args = [];

        if ( currentIndex === middlewares.length ) {
            handlerFn = {
                value: resolverHandlerFunction
            };
        } else {
            let currentMiddleware: any = middlewares[currentIndex];

            // arrow function or class
            if ( currentMiddleware.prototype !== undefined) {
                const middlewareClassInstance = container.getInstance(
                    currentMiddleware as MiddlewareClass<any>,
                    resolverData,
                );
                handlerFn = {
                    value: middlewareClassInstance.handle.bind(middlewareClassInstance)
                };
            } else {
                handlerFn = currentMiddleware as HandlerFn;
            }
        }
        let nextResult: any;
        const result = await handlerFn.value(resolverData, async () => {
            nextResult = await dispatchHandler(currentIndex + 1);
            return nextResult;
        }, handlerFn.args);
        return result !== undefined ? result : nextResult;
    }

    return dispatchHandler(0);
}
