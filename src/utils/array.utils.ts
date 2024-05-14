const mergeWithoutDuplicate = (a: any[], b: any[], key?: string) => {
  var list = [...a, ...b];
  for (var i = 0; i < list.length; ++i) {
    for (var j = i + 1; j < list.length; ++j) {
      if (key) {
        if (list[i][key] === list[j][key]) list.splice(j--, 1);
      } else {
        if (list[i] === list[j]) list.splice(j--, 1);
      }
    }
  }

  return list;
};

const shuffle = (array) => {
  // Loop over the array from the last element to the first
  for (let i = array.length - 1; i > 0; i--) {
    // Pick a random index from 0 to i
    let j = Math.floor(Math.random() * (i + 1));
    // Swap the elements at i and j
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export const ArrayUtils = {
  mergeWithoutDuplicate,
  shuffle,
};
