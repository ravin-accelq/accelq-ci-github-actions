const AQFormValidate = {
    validateJobID: (value:string): string | null => {
        try {
            const x:number = +value;
            if (x <= 0) {
                return "Must be a number greater than 0";
            }
        } catch {
            return "Not a number";
        }
        return null;
    },
    validateTenantCode: function (value:string): string | null{
        return this.validateGenericField(value);
    },
    validateAppURL: (value:string): string | null => {
        try {
            new URL(value);
        } 
        catch {
            return "Not a URL";
        }
        return null;
    },
    validateGenericField: (value:string): string | null => {
        try {
            if (value == null || value.length == 0)return "Cannot be empty";
        } 
        catch {
            return "Cannot be empty";
        }
        return null;
    }, 
    validateProjectCode: function (value:string): string | null {
        return this.validateGenericField(value);
    },
    validateAPIKey: function (value:string): string | null {
        return this.validateGenericField(value);
    },
    validateUserId: (value:string): string | null => {
        try {
            const emailRegex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            const pat = new RegExp(emailRegex); 
            if (value == null || value.length == 0) return "Cannot be empty";
            else if (!pat.test(value)) return "User ID must be in email format";
        }catch {}
        return null;
    }
}

export default AQFormValidate;