-- Создание таблицы для хранения push-токенов
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  device_type TEXT DEFAULT 'android',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ограничение: либо user_id, либо driver_id
  CONSTRAINT check_user_or_driver CHECK (
    (user_id IS NOT NULL AND driver_id IS NULL) OR 
    (user_id IS NULL AND driver_id IS NOT NULL)
  ),
  
  -- Уникальный токен для каждого пользователя/водителя
  UNIQUE(token, user_id),
  UNIQUE(token, driver_id)
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_driver_id ON push_tokens(driver_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_token ON push_tokens(token);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_push_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления updated_at
DROP TRIGGER IF EXISTS trigger_update_push_tokens_updated_at ON push_tokens;
CREATE TRIGGER trigger_update_push_tokens_updated_at
  BEFORE UPDATE ON push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_push_tokens_updated_at();

-- RLS (Row Level Security) политики
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Пользователи могут видеть только свои токены
CREATE POLICY "Users can view own tokens" ON push_tokens
  FOR SELECT USING (
    auth.uid()::text = user_id::text OR 
    auth.uid()::text = driver_id::text
  );

-- Пользователи могут вставлять свои токены
CREATE POLICY "Users can insert own tokens" ON push_tokens
  FOR INSERT WITH CHECK (
    auth.uid()::text = user_id::text OR 
    auth.uid()::text = driver_id::text
  );

-- Пользователи могут обновлять свои токены
CREATE POLICY "Users can update own tokens" ON push_tokens
  FOR UPDATE USING (
    auth.uid()::text = user_id::text OR 
    auth.uid()::text = driver_id::text
  );

-- Пользователи могут удалять свои токены
CREATE POLICY "Users can delete own tokens" ON push_tokens
  FOR DELETE USING (
    auth.uid()::text = user_id::text OR 
    auth.uid()::text = driver_id::text
  );