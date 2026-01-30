export interface PageResponse<T> {
    page: any;
    content: T[];
    number: number;
    size: number;
    totalElements: number;
    totalPages?: number;
}