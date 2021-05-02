/**
 *
 * @param delay Amount of time (in ms) you want to delay something
 *
 */
exports.sleep = (delay) => new Promise((resolve => setTimeout(resolve, delay)));
