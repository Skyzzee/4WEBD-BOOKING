export enum VerificationTokenType {
    EMAIL_CONFIRMATION = 'EMAIL_CONFIRMATION',
    PASSWORD_RESET = 'PASSWORD_RESET',
}

export interface VerificationTokenDto {
    userId: string;
    email: string;
    type: VerificationTokenType;
}