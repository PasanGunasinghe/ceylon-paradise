IF DB_ID(N'CeylonParadiseDB') IS NULL
BEGIN
    EXEC(N'CREATE DATABASE CeylonParadiseDB');
END
GO

USE CeylonParadiseDB;
GO

IF OBJECT_ID('dbo.BookingInquiries', 'U') IS NOT NULL DROP TABLE dbo.BookingInquiries;
IF OBJECT_ID('dbo.Reviews', 'U') IS NOT NULL DROP TABLE dbo.Reviews;
IF OBJECT_ID('dbo.Memories', 'U') IS NOT NULL DROP TABLE dbo.Memories;
IF OBJECT_ID('dbo.MapPins', 'U') IS NOT NULL DROP TABLE dbo.MapPins;
IF OBJECT_ID('dbo.TourPackages', 'U') IS NOT NULL DROP TABLE dbo.TourPackages;
IF OBJECT_ID('dbo.Destinations', 'U') IS NOT NULL DROP TABLE dbo.Destinations;
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL DROP TABLE dbo.Users;
GO

CREATE TABLE dbo.Users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    email NVARCHAR(150) NOT NULL UNIQUE,
    phone NVARCHAR(30) NOT NULL,
    password NVARCHAR(255) NOT NULL,
    role NVARCHAR(50) NOT NULL CONSTRAINT DF_Users_Role DEFAULT 'user'
);
GO

CREATE TABLE dbo.Destinations (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(150) NOT NULL,
    region NVARCHAR(150) NOT NULL,
    description NVARCHAR(MAX) NULL,
    image_url NVARCHAR(MAX) NULL,
    rating DECIMAL(3,2) NULL CONSTRAINT CK_Destinations_Rating CHECK (rating BETWEEN 0 AND 5),
    is_popular BIT NOT NULL CONSTRAINT DF_Destinations_Popular DEFAULT 0
);
GO

CREATE TABLE dbo.TourPackages (
    id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(200) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    duration NVARCHAR(80) NOT NULL,
    description NVARCHAR(MAX) NULL,
    category NVARCHAR(100) NOT NULL,
    location NVARCHAR(150) NULL,
    images_json NVARCHAR(MAX) NULL,
    highlights NVARCHAR(MAX) NULL
);
GO

CREATE TABLE dbo.MapPins (
    id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(200) NOT NULL,
    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,
    day_number INT NULL,
    details NVARCHAR(MAX) NULL,
    photo_url NVARCHAR(MAX) NULL,
    category NVARCHAR(100) NULL
);
GO

CREATE TABLE dbo.BookingInquiries (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_name NVARCHAR(100) NOT NULL,
    user_email NVARCHAR(150) NOT NULL,
    tour_id INT NOT NULL,
    booking_date DATE NOT NULL,
    status NVARCHAR(50) NOT NULL CONSTRAINT DF_Bookings_Status DEFAULT 'pending',
    notes NVARCHAR(MAX) NULL,
    CONSTRAINT FK_BookingInquiry_Tour FOREIGN KEY (tour_id) REFERENCES dbo.TourPackages(id)
);
GO

CREATE TABLE dbo.Reviews (
    id INT IDENTITY(1,1) PRIMARY KEY,
    tour_id INT NOT NULL,
    user_name NVARCHAR(100) NOT NULL,
    comment NVARCHAR(MAX) NOT NULL,
    rating INT NOT NULL CONSTRAINT CK_Reviews_Rating CHECK (rating BETWEEN 1 AND 5),
    images_json NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_Reviews_Created DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Review_Tour FOREIGN KEY (tour_id) REFERENCES dbo.TourPackages(id) ON DELETE CASCADE
);
GO

CREATE TABLE dbo.Memories (
    id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(200) NOT NULL,
    image_url NVARCHAR(MAX) NOT NULL,
    summary NVARCHAR(MAX) NULL,
    pinned BIT NOT NULL CONSTRAINT DF_Memories_Pinned DEFAULT 1,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_Memories_Created DEFAULT SYSUTCDATETIME()
);
GO

CREATE TABLE dbo.RouteInquiries (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NULL,
    user_name NVARCHAR(100) NOT NULL,
    user_email NVARCHAR(150) NOT NULL,
    route_json NVARCHAR(MAX) NOT NULL,
    stops_json NVARCHAR(MAX) NULL,
    travelers INT NOT NULL DEFAULT 1,
    status NVARCHAR(50) NOT NULL DEFAULT 'Pending',
    notes NVARCHAR(MAX) NULL,
    admin_notes NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

CREATE TABLE dbo.Notifications (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    message NVARCHAR(500) NOT NULL,
    is_read BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

/* Run the optional seed file after this schema with SQLCMD:
   :r .\seed.sql
   Or execute database/mssql/03_seed_data.sql after adapting its column names.
*/
PRINT 'CeylonParadiseDB schema created. Run backend/seed.sql to load starter data.';
GO
