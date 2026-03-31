import 'reflect-metadata';

export const ROUTE_META = Symbol('route');
export const PREFIX_META = Symbol('prefix');
export const VALIDATOR_META = Symbol('validator');

export interface RouteInfo {
  path: string;
  method: string;
  handler: string;
}

export const Controller = (prefix: string = '') =>
  (target: any) => Reflect.defineMetadata(PREFIX_META, prefix, target);

const routeDecorator = (method: string, path: string) =>
  (target: any, propertyKey: string) => {
    const routes = Reflect.getMetadata(ROUTE_META, target.constructor) ?? [];
    routes.push({ path, method, handler: propertyKey });
    Reflect.defineMetadata(ROUTE_META, routes, target.constructor);
  };

export const Get = (path: string = '') => routeDecorator('get', path);
export const Post = (path: string = '') => routeDecorator('post', path);
export const Patch = (path: string = '') => routeDecorator('patch', path);
export const Delete = (path: string = '') => routeDecorator('delete', path);