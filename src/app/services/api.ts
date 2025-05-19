import axios, { type AxiosRequestConfig, type AxiosInstance } from "axios";

export default class HttpClient {
    
    private api: AxiosInstance;    

    constructor() {
        this.api = axios.create({
            baseURL: "http://localhost:8000/radares" // ✅ Aponta para o gateway!            
        });        
    }

    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    get<T = any>(path: string, options?: AxiosRequestConfig) {
        return this.api.get<T>(path, { ...options, method: 'GET' });
    }
}