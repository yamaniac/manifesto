-- =============================================
-- SUPER ADMIN ROLE SETUP FOR MANIFESTO
-- =============================================

-- 1. Create user role enum
CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin');

-- 2. Create user_roles table
CREATE TABLE user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'user',
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- 3. Create user profiles table for additional user info
CREATE TABLE user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable RLS on both tables
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- User Roles Policies
CREATE POLICY "Users can view their own roles"
    ON user_roles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Super admins can view all roles"
    ON user_roles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can insert roles"
    ON user_roles FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can update roles"
    ON user_roles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can delete roles"
    ON user_roles FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'super_admin'
        )
    );

-- User Profiles Policies
CREATE POLICY "Users can view their own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Super admins can view all profiles"
    ON user_profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "Users can update their own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Super admins can update all profiles"
    ON user_profiles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "Anyone can insert their profile"
    ON user_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to check if user has specific role
CREATE OR REPLACE FUNCTION has_role(check_role user_role)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = check_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's highest role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
DECLARE
    highest_role user_role;
BEGIN
    SELECT role INTO highest_role
    FROM user_roles 
    WHERE user_id = auth.uid()
    ORDER BY 
        CASE role
            WHEN 'super_admin' THEN 3
            WHEN 'admin' THEN 2
            WHEN 'user' THEN 1
        END DESC
    LIMIT 1;
    
    RETURN COALESCE(highest_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (user_id, full_name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
    
    -- Assign default 'user' role
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- VIEWS FOR EASIER QUERYING
-- =============================================

-- View to get users with their roles and profiles
CREATE VIEW user_details AS
SELECT 
    u.id,
    u.email,
    u.created_at as user_created_at,
    p.full_name,
    p.avatar_url,
    p.created_at as profile_created_at,
    COALESCE(
        ARRAY_AGG(r.role ORDER BY 
            CASE r.role
                WHEN 'super_admin' THEN 3
                WHEN 'admin' THEN 2
                WHEN 'user' THEN 1
            END DESC
        ) FILTER (WHERE r.role IS NOT NULL),
        ARRAY['user']::user_role[]
    ) as roles,
    -- Get highest role
    (
        SELECT role FROM user_roles 
        WHERE user_id = u.id
        ORDER BY 
            CASE role
                WHEN 'super_admin' THEN 3
                WHEN 'admin' THEN 2
                WHEN 'user' THEN 1
            END DESC
        LIMIT 1
    ) as primary_role
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.user_id
LEFT JOIN user_roles r ON u.id = r.user_id
GROUP BY u.id, u.email, u.created_at, p.full_name, p.avatar_url, p.created_at;

-- =============================================
-- CATEGORIES TABLE SETUP
-- =============================================

-- Create categories table
CREATE TABLE categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT DEFAULT '#3B82F6', -- Default blue color
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on categories table
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Categories Policies
CREATE POLICY "Anyone can view categories"
    ON categories FOR SELECT
    USING (true);

CREATE POLICY "Super admins can insert categories"
    ON categories FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can update categories"
    ON categories FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can delete categories"
    ON categories FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'super_admin'
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on categories
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- AFFIRMATIONS TABLE SETUP
-- =============================================

-- Create affirmations table
CREATE TABLE affirmations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    text TEXT NOT NULL CHECK (length(text) <= 100), -- 100 character limit
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    created_by UUID REFERENCES auth.users(id),
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on affirmations table
ALTER TABLE affirmations ENABLE ROW LEVEL SECURITY;

-- Affirmations Policies
CREATE POLICY "Users can view all affirmations"
    ON affirmations FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can insert their own affirmations"
    ON affirmations FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own affirmations"
    ON affirmations FOR UPDATE
    USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own affirmations"
    ON affirmations FOR DELETE
    USING (auth.uid() = created_by);

-- Super admins can manage all affirmations
CREATE POLICY "Super admins can manage all affirmations"
    ON affirmations FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'super_admin'
        )
    );

-- Trigger to auto-update updated_at on affirmations
CREATE TRIGGER update_affirmations_updated_at
    BEFORE UPDATE ON affirmations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- INITIAL SETUP COMPLETE
-- =============================================

-- To assign your first super admin, run:
-- INSERT INTO user_roles (user_id, role, assigned_by) 
-- VALUES ('YOUR_USER_ID_HERE', 'super_admin', 'YOUR_USER_ID_HERE');
