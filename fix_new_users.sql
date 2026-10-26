-- Fix & Automatic Sync for New Users in TikiTasco (Supabase)
-- Execute este script no SQL Editor do Supabase se desejar que a sincronização
-- entre auth.users e public.users também ocorra automaticamente ao nível do banco de dados.

-- 1. Função de trigger para novos utilizadores do auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  default_gid UUID := '34f5269e-1aac-4041-93a9-0841bb7cf3ed';
BEGIN
  INSERT INTO public.users (id, email, nome, avatar_url, is_guest)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', ''),
    false
  )
  ON CONFLICT (email) DO UPDATE SET
    id = EXCLUDED.id,
    nome = CASE WHEN public.users.nome = '' OR public.users.nome IS NULL THEN EXCLUDED.nome ELSE public.users.nome END,
    avatar_url = CASE WHEN public.users.avatar_url = '' OR public.users.avatar_url IS NULL THEN EXCLUDED.avatar_url ELSE public.users.avatar_url END;

  -- Associar ao grupo padrão
  INSERT INTO public.group_members (user_email, group_id, role)
  VALUES (new.email, default_gid, 'member')
  ON CONFLICT (user_email, group_id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Ativar o trigger em auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Backfill de quaisquer utilizadores existentes em auth.users que ainda não estejam em public.users
INSERT INTO public.users (id, email, nome, avatar_url, is_guest)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
  COALESCE(au.raw_user_meta_data->>'avatar_url', au.raw_user_meta_data->>'picture', ''),
  false
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.email = au.email
)
ON CONFLICT (email) DO UPDATE SET
  id = EXCLUDED.id;

-- 4. Garantir que todos os utilizadores de public.users pertencem ao grupo padrão
INSERT INTO public.group_members (user_email, group_id, role)
SELECT pu.email, '34f5269e-1aac-4041-93a9-0841bb7cf3ed', 'member'
FROM public.users pu
WHERE NOT EXISTS (
  SELECT 1 FROM public.group_members gm 
  WHERE gm.user_email = pu.email AND gm.group_id = '34f5269e-1aac-4041-93a9-0841bb7cf3ed'
)
ON CONFLICT (user_email, group_id) DO NOTHING;

-- 5. Garantir políticas RLS para users e group_members
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
CREATE POLICY "Enable read access for all users" ON public.users FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.users;
CREATE POLICY "Enable all access for authenticated users" ON public.users FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON group_members;
CREATE POLICY "Enable read access for all users" ON group_members FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON group_members;
CREATE POLICY "Enable all access for authenticated users" ON group_members FOR ALL USING (auth.role() = 'authenticated');

