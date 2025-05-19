export interface RadarDTO {
    id: number;
    rodovia: string;
    km: string;
    sentido: string;
    data?: Date;
    hora: Date;
    placa: string;
}