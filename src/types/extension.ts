export type MapperFn = (decl: any, options?: any) => Promise<any> | any;
export type ExtensionHook = (ctx: any, options?: any) => void | Promise<void>;

