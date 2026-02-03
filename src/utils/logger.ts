const colors = {
    blue: (s: string) => `\x1b[34m${s}\x1b[0m`,
    yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
    red: (s: string) => `\x1b[31m${s}\x1b[0m`,
    green: (s: string) => `\x1b[32m${s}\x1b[0m`,
    gray: (s: string) => `\x1b[90m${s}\x1b[0m`,
};

export type LogLevel = "info" | "warn" | "error" | "success" | "debug";

export class Logger {
    constructor(private prefix?: string) { }

    private format(level: LogLevel, msg: string) {
        const p = this.prefix ? `[${this.prefix}] ` : "";
        switch (level) {
            case "info": return colors.blue(`${p}info `) + msg;
            case "warn": return colors.yellow(`${p}warn `) + msg;
            case "error": return colors.red(`${p}error `) + msg;
            case "success": return colors.green(`${p}success `) + msg;
            case "debug": return colors.gray(`${p}debug `) + msg;
        }
    }

    info(msg: string) { console.log(this.format("info", msg)); }
    warn(msg: string) { console.warn(this.format("warn", msg)); }
    error(msg: string) { console.error(this.format("error", msg)); }
    success(msg: string) { console.log(this.format("success", msg)); }
    debug(msg: string) { console.log(this.format("debug", msg)); }

    child(prefix: string) {
        return new Logger(this.prefix ? `${this.prefix}:${prefix}` : prefix);
    }
}

export const logger = new Logger();
