
export function getDate(inputMoment?: Date): Date {
  const date = inputMoment || new Date();
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds()
    )
  );
}


export function getCurrentYear(): number {
  return new Date().getUTCFullYear();
}


export function getCurrentMonth(): number {
  return new Date().getUTCMonth() + 1;
}
