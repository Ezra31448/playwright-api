import { APIRequestContext } from "@playwright/test";
import { expect } from "@playwright/test";

export class RequestHandler {
  private request: APIRequestContext;
  private baseUrl: string = "";
  private defaultBaseUrl: string = "";
  private apiPath: string = "";
  private queryParams: object = {};
  private apiHeaders: Record<string, string> = {};
  private apiBody: object = {};

  constructor(request: APIRequestContext, apiBaseUrl: string) {
    this.request = request;
    this.defaultBaseUrl = apiBaseUrl;
  }

  url(url: string) {
    this.baseUrl = url;
    return this;
  }

  path(path: string) {
    this.apiPath = path;
    return this;
  }

  params(params: object) {
    this.queryParams = params;
    return this;
  }

  header(headers: Record<string, string>) {
    this.apiHeaders = headers;
    return this;
  }

  body(body: object) {
    this.apiBody = body;
    return this;
  }

  async getRequest(stautsCode: number) {
    const url = this.getUrl();
    const response = await this.request.get(url, {
      headers: this.apiHeaders,
    });
    expect(response.status()).toEqual(stautsCode);
    const responseJson = await response.json();
    return responseJson;
  }

  private getUrl() {
    const url = new URL(
      `${this.baseUrl || this.defaultBaseUrl}${this.apiPath}`,
    );
    for (const [key, value] of Object.entries(this.queryParams)) {
      url.searchParams.append(key, value);
    }
    return url.toString();
  }
}
