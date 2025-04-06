declare module 'firebase-functions' {
  export interface HttpsFunction {
    run(data: any): Promise<any>;
  }

  export interface HttpsOptions {
    memory?: string;
    timeoutSeconds?: number;
  }

  export function https(options?: HttpsOptions): {
    onRequest: (handler: (request: any, response: any) => void | Promise<void>) => HttpsFunction;
  };
  
  export interface RuntimeOptions {
    memory?: string;
    timeoutSeconds?: number;
    [key: string]: any;
  }
  
  export interface Config {
    firebase: {
      databaseURL: string;
      storageBucket: string;
      projectId: string;
    };
  }
  
  export function config(): Config;
} 