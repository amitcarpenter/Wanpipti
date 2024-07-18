export interface IUser {
    id: number ;
    full_name: string;
    email: string;
    password: string;
    wallet_balance?: number;
    profile_image?: string;
    today_earning?: number;
    total_earning?: number;
    role: "admin" | "user";
    jwt_token?: string;
    google_signup_token?: string;
    reset_password_token?: string;
    reset_password_token_expiry?: Date;
    signup_method: "google" | "traditional";
    created_at: Date;
    updated_at: Date;
}
