export interface HealthResponse {
    status: 'ok' | 'error';
    message: string;
    timestamp: string;
    uptime: number;
    environment: string;
    version: string;
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export interface ErrorResponse {
    success: false;
    error: string;
    timestamp: string;
    path?: string;
}