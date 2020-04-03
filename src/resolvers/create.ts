import { GraphQLFieldResolver } from 'graphql';

import { BaseResolverMetadata, FieldMetadata, FieldResolverMetadata, } from '../metadata/definitions';
import { applyMiddlewares, getParams } from './helpers';
import { convertToType } from '../helpers/types';
import { BuildContext } from '../schema/build-context';
import { ResolverData } from '../interfaces';
import isPromiseLike from '../utils/isPromiseLike';
import { Middleware } from '../middleware/Middleware';
import { Context } from './context';

export function isQuery(info) {
    return info.parentType && info.parentType.name === 'Query';
}

export function isMutation(info) {
    return info.parentType && info.parentType.name === 'Mutation';
}

export function isSubscription(info) {
    return info.parentType && info.parentType.name === 'Subscription';
}

export function isRootResolve(info) {
    return ! info.path || ! info.path.prev
}

function mergeMiddleware(info, middlewares, options): Middleware {
    const {
        globalMiddlewares,
        queryMiddlewares,
        mutationMiddlewares,
        subscriptionMiddlewares
    } = options;

    switch (info.parentType.name) {
    case 'Query':
        return new Middleware(BuildContext.container, BuildContext.middlewareStore)
            .register(queryMiddlewares)
            .register(middlewares)
        break;
    case 'Mutation':
        return new Middleware(BuildContext.container, BuildContext.middlewareStore)
            .register(mutationMiddlewares)
            .register(middlewares)
        break;
    case 'Subscription':
        return new Middleware(BuildContext.container, BuildContext.middlewareStore)
            .register(subscriptionMiddlewares)
            .register(middlewares)
        break
    default:
        return new Middleware(BuildContext.container, BuildContext.middlewareStore)
            .register(middlewares)
    }
}

export function createHandlerResolver(
    resolverMetadata: BaseResolverMetadata,
): GraphQLFieldResolver<any, any, any> {
    const {
        pubSub,
        globalMiddlewares,
        container,
        queryMiddlewares,
        mutationMiddlewares,
        subscriptionMiddlewares
    } = BuildContext;
    let middlewares = resolverMetadata.middlewares;

    return (root, args, context, info) => {
        let middleware: Middleware = mergeMiddleware(info, middlewares, {
            globalMiddlewares,
            queryMiddlewares,
            mutationMiddlewares,
            subscriptionMiddlewares
        });
        const resolverData: ResolverData<any> = { root, args, context: new Context(context), info };
        const targetInstance = container.getInstance(resolverMetadata.target, resolverData);
        return applyMiddlewares(container, resolverData, middleware.resolve(resolverData), () => {
            const params: Promise<any[]> | any[] = getParams(
                resolverMetadata.params!,
                resolverData,
                pubSub,
            );
            if ( isPromiseLike(params) ) {
                return params.then(resolvedParams =>
                    targetInstance[resolverMetadata.methodName].apply(targetInstance, resolvedParams),
                );
            } else {
                return targetInstance[resolverMetadata.methodName].apply(targetInstance, params);
            }
        });
    };
}

export function createAdvancedFieldResolver(
    fieldResolverMetadata: FieldResolverMetadata,
): GraphQLFieldResolver<any, any, any> {
    if ( fieldResolverMetadata.kind === 'external' ) {
        return createHandlerResolver(fieldResolverMetadata);
    }
    const targetType = fieldResolverMetadata.getObjectType!();
    const {
        pubSub,
        globalMiddlewares,
        queryMiddlewares,
        mutationMiddlewares,
        subscriptionMiddlewares,
        container,
    } = BuildContext;
    let middlewares = fieldResolverMetadata.middlewares;

    return (root, args, context, info) => {
        let middleware: Middleware = mergeMiddleware(info, middlewares, {
            globalMiddlewares,
            queryMiddlewares,
            mutationMiddlewares,
            subscriptionMiddlewares
        });
        const resolverData: ResolverData<any> = { root, args, context, info };
        const targetInstance: any = convertToType(targetType, root);
        return applyMiddlewares(container, resolverData, middleware.resolve(resolverData), () => {
            const handlerOrGetterValue = targetInstance[fieldResolverMetadata.methodName];
            if ( typeof handlerOrGetterValue !== 'function' ) {
                // getter
                return handlerOrGetterValue;
            }
            // method
            const params: Promise<any[]> | any[] = getParams(
                fieldResolverMetadata.params!,
                resolverData,
                pubSub,
            );
            if ( isPromiseLike(params) ) {
                return params.then(resolvedParams =>
                    handlerOrGetterValue.apply(targetInstance, resolvedParams),
                );
            } else {
                return handlerOrGetterValue.apply(targetInstance, params);
            }
        });
    };
}

export function createBasicFieldResolver(
    fieldMetadata: FieldMetadata,
): GraphQLFieldResolver<any, any, any> {

    const {
        globalMiddlewares,
        container,
        queryMiddlewares,
        mutationMiddlewares,
        subscriptionMiddlewares } = BuildContext;
    let middlewares = fieldMetadata.middlewares;

    return (root, args, context, info) => {
        let middleware: Middleware = mergeMiddleware(info, middlewares, {
            globalMiddlewares,
            queryMiddlewares,
            mutationMiddlewares,
            subscriptionMiddlewares
        });

        const resolverData: ResolverData<any> = { root, args, context, info };
        return applyMiddlewares(container, resolverData, middleware.resolve(resolverData), () => root[fieldMetadata.name]);
    };
}
