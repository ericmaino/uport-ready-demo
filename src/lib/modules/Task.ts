
export class Task {
    public static async Wait(timeoutMs : number) : Promise<any> {
        return new Promise((resolve) => {
            setTimeout(() => resolve(), timeoutMs);
        });
    }
}