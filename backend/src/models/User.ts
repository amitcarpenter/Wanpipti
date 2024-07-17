export interface IUser {
    id: number; // Assuming the ID is a number, change to string if using UUIDs
    full_name: string;
    email: string;
    password: string; // Store hashed password, keep as string
    wallet_balance?: number; // Optional, if you have this field
    profile_image?: string; // Optional, if you have this field
    today_earning?: number; // Optional, if you have this field
    total_earning?: number; // Optional, if you have this field
    role: "admin" | "user"; // Role can be either admin or user
    jwt_token?: string; // Optional, if you store JWT token in user record
    reset_password_token?: string; // Optional
    reset_password_token_expiry?: Date; // Optional
    signup_method: "google" | "traditional"; // Method of signup
    created_at: Date; // Timestamp for when the user was created
    updated_at: Date; // Timestamp for last update
}
