const log = (msg) => console.log(`[AgroGB] ${msg}`);
const error = (msg) => console.error(`[AgroGB ERROR] ${msg}`);

export const Logger = {
    info: (msg) => log(msg),
    warn: (msg) => console.warn(`[AgroGB WARN] ${msg}`),
    error: (msg) => error(msg),
    debug: (msg) => log(`DEBUG: ${msg}`)
};

export default Logger;
