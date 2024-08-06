import { Role } from '../entities/Role'; // Import Role if needed

export interface IUser {
    id: number;
    full_name: string;
    email: string;
    password: string;
    profile_image?: string;
    role?: Role;
    jwt_token?: string;
    google_signup_token?: string;
    reset_password_token?: string | null;
    reset_password_token_expiry?: Date | null; // Change here
    signup_method: "google" | "traditional";
    created_at: Date;
    updated_at: Date;
}
