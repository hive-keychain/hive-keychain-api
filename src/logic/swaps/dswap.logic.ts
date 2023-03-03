import fetch from "cross-fetch";

const calculateSwapOutput = (
  startToken: string,
  endToken: string,
  amount: number
) => {
  const url =
    "https://dswap-api.dswap.trade/api/SwapRequest/CalculateSwapOutput";
  return new Promise((resolve, reject) => {
    fetch(url, {
      method: "POST",
      body: JSON.stringify({
        TokenInput: startToken,
        TokenInputAmount: amount,
        TokenOutput: endToken,
        Chain: 1,
      }),
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => {
        if (res && res.status === 200) {
          return res.json();
        }
      })
      .then((res: any) => {
        resolve(res.TokenOutputAmount);
      });
  });
};

export const DSwapLogic = {
  calculateSwapOutput,
};
