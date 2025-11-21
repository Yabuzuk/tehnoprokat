-- Создание таблиц для приложения водовозки

-- Таблица пользователей
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица водителей
CREATE TABLE drivers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    service_type TEXT[] NOT NULL, -- ['water_delivery', 'septic_pumping']
    car_number VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица заказов
CREATE TABLE orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_type VARCHAR(20) NOT NULL CHECK (service_type IN ('water_delivery', 'septic_pumping')),
    address TEXT NOT NULL,
    coordinates JSONB NOT NULL, -- {lat: number, lng: number}
    delivery_date DATE NOT NULL,
    delivery_time TIME NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для оптимизации запросов
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_driver_id ON orders(driver_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_service_type ON orders(service_type);
CREATE INDEX idx_orders_delivery_date ON orders(delivery_date);
CREATE INDEX idx_drivers_status ON drivers(status);
CREATE INDEX idx_drivers_service_type ON drivers USING GIN(service_type);

-- RLS (Row Level Security) политики
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Политики для пользователей
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own data" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (true);

-- Политики для водителей
CREATE POLICY "Drivers can view own data" ON drivers
    FOR SELECT USING (true);

CREATE POLICY "Drivers can insert own data" ON drivers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Drivers can update own data" ON drivers
    FOR UPDATE USING (true);

-- Политики для заказов
CREATE POLICY "Users can view own orders" ON orders
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own orders" ON orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own orders" ON orders
    FOR UPDATE USING (true);

CREATE POLICY "Drivers can view relevant orders" ON orders
    FOR SELECT USING (true);

CREATE POLICY "Drivers can update assigned orders" ON orders
    FOR UPDATE USING (true);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Добавляем поле updated_at к таблицам
ALTER TABLE users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE drivers ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE orders ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Создаем триггеры для автоматического обновления updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Вставляем тестовые данные
INSERT INTO users (name, phone) VALUES 
    ('Иван Иванов', '+79991234567'),
    ('Петр Петров', '+79991234568'),
    ('Мария Сидорова', '+79991234569');

INSERT INTO drivers (full_name, phone, service_type, car_number, status) VALUES 
    ('Алексей Водовозов', '+79991234570', ARRAY['water_delivery'], 'А123БВ123', 'active'),
    ('Сергей Ассенизаторов', '+79991234571', ARRAY['septic_pumping'], 'В456ГД456', 'active'),
    ('Михаил Универсалов', '+79991234572', ARRAY['water_delivery', 'septic_pumping'], 'Г789ЕЖ789', 'active');