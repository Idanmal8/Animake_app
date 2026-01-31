declare module 'imagetracerjs' {
    export interface Tracedata {
        layers: {
            [key: string]: {
                paths: {
                    segments: {
                        type: number;
                        x1: number; y1: number;
                        x2: number; y2: number;
                        x3?: number; y3?: number;
                    }[];
                }[];
            };
        };
        palette: { r: number; g: number; b: number; a: number }[];
        width: number;
        height: number;
    }

    export function imagedataToTracedata(
        imagedata: ImageData,
        options?: any
    ): Tracedata;

    export function imagedataToSVG(
        imagedata: ImageData,
        options?: any
    ): string;
}
