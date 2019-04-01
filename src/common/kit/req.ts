import qs from "qs";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

let baseUrl = "";
if (__DEV__) {
  // baseUrl = '/api';
}

export { baseUrl };

export async function GET<Result = any>(
  uri: string,
  params?: any,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<Result>> {
  uri = params ? uri + "?" + qs.stringify(params) : uri;
  return await axios.get(`${baseUrl}${uri}`, config);
}

export async function POST<Result = any>(
  uri: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<Result>> {
  return await axios.post(`${baseUrl}${uri}`, data, config);
}

export async function POST_FORM<Result = any>(
  uri: string,
  form: any,
  config: AxiosRequestConfig = {}
): Promise<AxiosResponse<Result>> {
  const resp = await POST(uri, qs.stringify(form), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
    },
    ...config
  });
  return resp;
}
