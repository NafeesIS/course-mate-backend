import { IApiKey } from '../app/modules/apiKey/apiKey.model';

declare module 'express' {
  interface Request {
    apiKey?: IApiKey;
  }
}
