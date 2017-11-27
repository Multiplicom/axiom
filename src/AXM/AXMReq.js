/**
 * Requires an object to be present, and returns it
 * @param obj
 * @returns {*}
 */
export function ARMReq (obj) {
  if (obj === undefined) Test.reportBug("Requered object not present");
  return obj;
};
