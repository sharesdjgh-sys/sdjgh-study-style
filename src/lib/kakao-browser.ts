type KakaoSdk = {
  init(key: string): void;
  isInitialized(): boolean;
  Auth: {
    authorize(options: {
      redirectUri: string;
      state: string;
      scope?: string;
    }): Promise<unknown> | void;
  };
  Share: { sendDefault(options: object): void };
};

declare global {
  interface Window {
    Kakao?: KakaoSdk;
  }
}

export function getKakao() {
  const key = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
  const sdk = window.Kakao;
  if (!sdk || !key) return;
  try {
    if (!sdk.isInitialized()) sdk.init(key);
    return sdk;
  } catch {
    return;
  }
}
