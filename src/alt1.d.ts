// src/alt1.d.ts
declare module "alt1" {
    export function mixColor(r: number, g: number, b: number): number;
    export function identifyAppUrl(url: string): void;
    export function overLayRect(color: number, x: number, y: number, w: number, h: number, duration: number, lineWidth: number): void;
    export function captureHoldFullRs(): any;
    export function captureHold(): any;
}

declare module "alt1/chatbox" {
    class ChatboxReader {
        pos: any;
        readargs: any;
        find(img?: any): any;
        read(img?: any): any;
    }
    export default ChatboxReader;
}

declare global {
    interface Window {
        alt1: any;
    }
}