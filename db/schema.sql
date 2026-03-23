-- MySQL Schema for AppTrọ Lỏ Lỏ

CREATE DATABASE IF NOT EXISTS apptrololo;
USE apptrololo;

-- Users table
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255)
);

-- Lodges table
CREATE TABLE lodges (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20) NOT NULL,
    bank VARCHAR(50),
    bank_name VARCHAR(100),
    owner_id BIGINT,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Utility Prices table
CREATE TABLE utility_prices (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    elec DOUBLE DEFAULT 3500.0,
    water DOUBLE DEFAULT 15000.0,
    wifi DOUBLE DEFAULT 100000.0,
    garbage DOUBLE DEFAULT 20000.0,
    water_mode VARCHAR(20) DEFAULT 'meter',
    water_fixed DOUBLE DEFAULT 150000.0,
    lodge_id BIGINT UNIQUE,
    FOREIGN KEY (lodge_id) REFERENCES lodges(id) ON DELETE CASCADE
);

-- Rooms table
CREATE TABLE rooms (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DOUBLE NOT NULL,
    status VARCHAR(20) DEFAULT 'empty',
    tenant VARCHAR(255),
    phone VARCHAR(20),
    checkin DATE,
    people INT DEFAULT 0,
    ep DOUBLE DEFAULT 0.0,
    wp DOUBLE DEFAULT 0.0,
    desc_text TEXT,
    contract VARCHAR(20) DEFAULT 'monthly',
    contract_months INT DEFAULT 0,
    contract_prepaid INT DEFAULT 0,
    lodge_id BIGINT,
    FOREIGN KEY (lodge_id) REFERENCES lodges(id) ON DELETE CASCADE
);

-- Members table
CREATE TABLE members (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    note VARCHAR(255),
    room_id BIGINT,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- Meter Readings table
CREATE TABLE meter_readings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    elec DOUBLE,
    water DOUBLE,
    date DATE NOT NULL,
    room_id BIGINT,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- Bills table
CREATE TABLE bills (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    total DOUBLE,
    sent BOOLEAN DEFAULT FALSE,
    collected BOOLEAN DEFAULT FALSE,
    date DATE NOT NULL,
    room_id BIGINT,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- Notifications table
CREATE TABLE notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(20),
    msg TEXT NOT NULL,
    time DATETIME NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    user_id BIGINT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Activities table
CREATE TABLE activities (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    txt TEXT NOT NULL,
    time DATETIME NOT NULL,
    color VARCHAR(20),
    user_id BIGINT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
