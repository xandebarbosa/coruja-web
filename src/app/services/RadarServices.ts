import type { AxiosRequestConfig } from "axios";
import HttpClient from "./api";

import type { RadarResponse } from "@/model/response/RadarResponse";
import type { PageResponse } from "@/model/response/PageResponse";
import type { Filtros } from "../pesquisa-local/page";

class RadarServices {
    private httpClient: HttpClient;
    

    constructor() {
        this.httpClient = new HttpClient();
    }

    public async getPaged(
        page?: number, 
        size?: number, 
        filtros?: Filtros, 
        options?: AxiosRequestConfig) {
        const response = await this.httpClient.get<PageResponse<RadarResponse>>(
             "/rondon",
             {
                 params: {
                ...filtros,
                page,
                size
            },
            ...options
             }
             
        );
        console.log('GetPaged ==>', response);
        
        return response.data;
    }
 }

 export default new RadarServices();