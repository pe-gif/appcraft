CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE career_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  goals TEXT,
  interests TEXT,
  extracurriculars TEXT,
  writing_style_notes TEXT,
  target_roles TEXT[],
  target_industries TEXT[],
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE work_experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  title TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT FALSE,
  description TEXT,
  bullets TEXT[],
  achievements TEXT[],
  technologies TEXT[],
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  role TEXT,
  tech_stack TEXT[],
  outcomes TEXT,
  url TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  proficiency TEXT
);

CREATE TABLE education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  institution TEXT NOT NULL,
  degree TEXT,
  field TEXT,
  graduation_year INT,
  gpa TEXT,
  honors TEXT,
  activities TEXT[]
);

CREATE TABLE behavioral_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  themes TEXT[],
  situation TEXT NOT NULL,
  task TEXT NOT NULL,
  action TEXT NOT NULL,
  result TEXT NOT NULL,
  company_context TEXT
);

CREATE TABLE essays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  prompt TEXT,
  response TEXT NOT NULL,
  theme TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE application_inputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  job_title TEXT,
  company_name TEXT,
  job_description TEXT NOT NULL,
  company_description TEXT,
  application_questions TEXT,
  user_notes TEXT,
  job_profile_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE application_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_input_id UUID REFERENCES application_inputs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  version INT DEFAULT 1,
  tailored_resume JSONB,
  cover_letter TEXT,
  question_responses JSONB,
  application_notes JSONB,
  generation_status TEXT DEFAULT 'pending',
  generation_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE kit_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id UUID REFERENCES application_kits(id) ON DELETE CASCADE,
  section TEXT,
  edited_content TEXT,
  edited_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE application_tracking (
  kit_id UUID PRIMARY KEY REFERENCES application_kits(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'draft',
  applied_at TIMESTAMPTZ,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE education ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavioral_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE essays ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE kit_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own user row" ON users
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can manage their own career profile" ON career_profiles
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage their own work experiences" ON work_experiences
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage their own projects" ON projects
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage their own skills" ON skills
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage their own education" ON education
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage their own stories" ON behavioral_stories
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage their own essays" ON essays
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage their own application inputs" ON application_inputs
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage their own application kits" ON application_kits
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage edits for their kits" ON kit_edits
  USING (
    EXISTS (
      SELECT 1 FROM application_kits
      WHERE application_kits.id = kit_edits.kit_id
        AND application_kits.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM application_kits
      WHERE application_kits.id = kit_edits.kit_id
        AND application_kits.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own application tracking" ON application_tracking
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX application_inputs_user_created_idx ON application_inputs(user_id, created_at DESC);
CREATE INDEX application_kits_user_created_idx ON application_kits(user_id, created_at DESC);
CREATE INDEX work_experiences_user_order_idx ON work_experiences(user_id, display_order);
