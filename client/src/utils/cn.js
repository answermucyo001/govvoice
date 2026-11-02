export const cn = (...classes) =>
  classes.filter((value) => typeof value === 'string' && value.trim()).join(' ');

export default cn;
