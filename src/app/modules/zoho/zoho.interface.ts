export interface IZohoAuthToke {
  access_token: string;
  scope: string;
  api_domain: string;
  token_type: string;
  expires_in: number;
  cookie: string;
  savedAt: Date;
}
