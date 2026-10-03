export const emptyToNull = (val: unknown) => {
  if (
    val === "null" ||
    val === "undefined" ||
    val === "" ||
    val === null ||
    val === undefined
  ) {
    return null
  }
  return val
}

export const emptyToUndefined = (val: unknown) => {
  if (
    val === "null" ||
    val === "undefined" ||
    val === "" ||
    val === null ||
    val === undefined
  ) {
    return undefined
  }
  return val
}
