declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: string;
      PORT: string;
      VERSION_PASSWORD: string;
    }
  }
}
export {};
