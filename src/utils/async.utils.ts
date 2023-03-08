const mapPromiseAll = async <T>(
  map: Map<string, Promise<T>>
): Promise<Map<string, T>> => {
  const keys = map.keys();
  const values = await Promise.all(map.values());

  console.log(values);

  const result: Map<string, T> = new Map();
  for (let i = 0; i < values.length; i++) {
    result.set(keys[i], values[i]);
  }
  return result;
};

export const AsyncUtils = { mapPromiseAll };
